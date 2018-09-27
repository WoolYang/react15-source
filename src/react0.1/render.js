import { typeNumber, isSameVnode, mapKeyToIndex } from "./utils";
import { flattenChildren, Vnode as VnodeClass } from "./createElement";
import { mapProps, updateProps } from "./mapProps";
import { catchError } from "./errorBoundary";
import { disposeVnode } from "./disposeVnode";
import { Com } from "./reactClass";
import { setRef } from "./refs";

let mountIndex = 0; //统计挂载次数
let containerMap = {}; //用于缓存vnode，即虚拟dom树

//记录负责创建此元素的组件。指当前正处于构建过程中的组件,实例化完成或render方法执行完成，currentOwner.cur置为null 
//大概既然是个指针，用处是什么？
export let currentOwner = {
    cur: null
};


function mountIndexAdd() {
    return mountIndex++;
}


//实例组件状态
function instanceProps(componentVnode) {
    return {
        oldState: componentVnode._instance.state,
        oldProps: componentVnode._instance.props,
        oldContext: componentVnode._instance.context,
        oldVnode: componentVnode._instance.Vnode
    };
}


/**
 * 虚拟dom渲染引擎入口
 * 调用React.render()后，最先执行的React.createElement()，将jsx解析后的对象清洗生成的vnode实例对象传入
 * 
 * @param {object} Vnode  转化后的vnode节点，即虚拟dom树
 * @param {any} 放置容器 
 * @returns 
 */
export function render(Vnode, container) {
    if (typeNumber(container) !== 8) { //必须有dom挂载容器
        throw new Error("Target container is not a DOM element.");
    }
    const uniqueKey = container.UniqueKey;
    if (uniqueKey) {//若干该组件已经被渲染
        const oldVnode = containerMap[uniqueKey];
        update(oldVnode, Vnode, container); //全树比对更新
        return Vnode._instance;
    }

    //第一次初始化渲染
    Vnode.isTop = true; //标注顶级Vnode
    container.UniqueKey = mountIndexAdd(); //标注挂载次数
    containerMap[container.UniqueKey] = Vnode; //缓存dom树
    renderCore(Vnode, container, false, Vnode.context, Vnode.owner); //全树解析
    return Vnode._instance; //暂时没有用到，node实例
}

//渲染引擎核心模块
function renderCore(Vnode, container, isUpdate, parentContext, instance) {
    const { type, props } = Vnode;
    // console.log(Vnode)
    if (!type) {
        return;
    }
    const { children } = props;

    let domNode;

    if (typeof type === "function") { //自定义组件
        const fixContext = parentContext || {}; //取得context
        domNode = mountComponent(Vnode, container, fixContext); //递归解析自定义组件从组件的render方法中拿到string类型标签
    } else if (typeof type === "string" && type === "#text") { //html原始标签
        domNode = mountTextComponent(Vnode, container);
    } else {
        domNode = document.createElement(type);
    }

    if (typeof type !== "function") {
        if (typeNumber(children) > 2 && children !== undefined) { //child不存在或类型不符合时不做解析处理
            const NewChild = mountChildren(children, domNode, Vnode, parentContext, instance); //解析children内容，记录格式化后的children
            props.children = NewChild;
        }
    }

    Vnode._hostNode = domNode; //真实dom挂载到对应层级的vnode属性上
    setRef(Vnode, instance, domNode);//为虚拟组件添加ref
    mapProps(domNode, props, Vnode); //映射props中的属性到domNode


    if (typeNumber(domNode) === 7) {
        if (isUpdate) {
            return domNode;
        } else {
            if (container && domNode && container.nodeName !== "#text") {
                domNode.forEach((DOM_SINGLE_Node) => {
                    container.appendChild(DOM_SINGLE_Node);
                });
            }
        }
    }

    if (isUpdate) {
        return domNode;
    } else {
        Vnode._mountIndex = mountIndexAdd();
        if (container && domNode && container.nodeName !== "#text") {
            container.appendChild(domNode);
        }
    }

    return domNode;
}

//挂载children
function mountChildren(children, parentDomNode, parentVnode, parentContext, instance) {
    //  console.log(children)
    let childType = typeNumber(children); //获取children节点类型
    let flattenChildList = children;

    //children类型为undefined时，处理成#text类型空vnode
    if (childType === undefined) {
        flattenChildList = flattenChildren(children, parentVnode);
    }

    //用于渲染单节点，vnode类型为对象,例如如果是数组，展开处理
    if (childType === 8 && children !== undefined) {
        flattenChildList = flattenChildren(children, parentVnode);
        if (typeNumber(children.type) === 5) {
            flattenChildList._hostNode = renderCore(flattenChildList, parentDomNode, false, parentContext, instance);
        } else if (typeNumber(children.type) === 3 || typeNumber(children.type) === 4) {
            flattenChildList._hostNode = mountNativeElement(flattenChildList, parentDomNode, instance);
        }
    }

    //用于渲染数组children
    if (childType === 7) {//children类型为数组
        flattenChildList = flattenChildren(children, parentVnode);
        //      console.log(flattenChildList)
        flattenChildList.forEach((item) => {
            if (item) {
                if (typeof item.type === "function") { //如果children是自定义组件
                    mountComponent(item, parentDomNode, parentContext);
                } else {
                    renderCore(item, parentDomNode, false, parentContext, instance);
                }
            }
        });
    }

    //children类型为string或number时，既文本节点，处理成#text类型vnode
    if (childType === 4 || childType === 3) {
        flattenChildList = flattenChildren(children, parentVnode);
        mountTextComponent(flattenChildList, parentDomNode); //普通类型直接处理
    }

    return flattenChildList;
}

//解析文本vnode，并挂载真实dom到_hostNode
function mountNativeElement(Vnode, parentDomNode, instance) {
    // console.log(Vnode)
    const domNode = renderCore(Vnode, parentDomNode, false, {}, instance);
    Vnode._hostNode = domNode;
    Vnode._mountIndex = mountIndexAdd();
    return domNode;
}

//解析文本
function mountTextComponent(Vnode, domNode) {
    let fixText = Vnode.props;
    let textDomNode = document.createTextNode(fixText);
    domNode.appendChild(textDomNode);
    Vnode._hostNode = textDomNode;
    Vnode._mountIndex = mountIndexAdd();
    return textDomNode;
}


//挂载自定义组件
function mountComponent(Vnode, parentDomNode, parentContext) {
    const { type, props, key } = Vnode;

    const Component = type; //拿到自定义组件(function)

    const instance = new Component(props, parentContext); //实例化自定义组件，传入props

    Vnode._instance = instance; // 在父节点上的child元素会保存一个自己，对应组件实例化对象

    if (!instance.render) {
        Vnode._instance = instance;//for react-redux,这里是渲染无状态组件，直接渲染
        return renderCore(instance, parentDomNode, false, parentContext);
    }

    if (instance.getChildContext) {//如果用户定义getChildContext，那么用它生成子context
        instance.context = Object.assign({}, instance.context, instance.getChildContext());
    } else {
        instance.context = Object.assign({}, parentContext);
    }

    //生命周期函数
    if (instance.componentWillMount) { //异常捕获
        const isCatched = catchError(instance, "componentWillMount", [Vnode]);
        if (isCatched) {
            return;
        }
    }

    let lastOwner = currentOwner.cur;
    currentOwner.cur = instance;

    let renderedVnode = catchError(instance, "render", [Vnode]);
    const renderedType = typeNumber(renderedVnode);
    if (renderedType === 7) {
        renderedVnode = mountChildren(renderedVnode, parentDomNode, parentContext, instance, Vnode);
    }
    if (renderedType === 3 && renderedType === 4) {
        renderedVnode = new VnodeClass("#text", renderedVnode, null, null);
    }

    currentOwner.cur = lastOwner;

    if (renderedVnode === void 233) {
        // console.warn("你可能忘记在组件render()方法中返回jsx了");
        return;
    }

    renderedVnode = renderedVnode ? renderedVnode : new VnodeClass("#text", "", null, null);

    renderedVnode.key = key || null;
    instance.Vnode = renderedVnode; //挂载虚拟dom到组件实例上
    instance.Vnode._mountIndex = mountIndexAdd();

    instance.Vnode.return = Vnode;//必须要在插入前设置return(父Vnode)给所有的Vnode ？？？？

    let domNode = null;
    if (renderedType !== 7) {
        domNode = renderCore(renderedVnode, parentDomNode, false, instance.context, instance); //递归调用
    } else {
        domNode = renderedVnode[0]._hostNode;
    }

    setRef(Vnode, instance, domNode);

    Vnode._hostNode = domNode; //记录真实dom到对应的虚拟dom节点上 ！！！

    instance.Vnode._hostNode = domNode;//用于在更新时期oldVnode的时候获取_hostNode

    if (instance.componentDidMount) {
        //Moutting变量用于标记组件是否正在挂载
        //如果正在挂载，则所有的setState全部都要合并
        instance.lifeCycle = Com.MOUNTTING;
        catchError(instance, "componentDidMount", []);
        instance.componentDidMount = null;//防止用户调用
        instance.lifeCycle = Com.MOUNT;
    }

    instance._updateInLifeCycle(); // componentDidMount之后一次性更新

    return domNode; //返回真实dom
}

/**
 * diff算法，采用snabbdom比对
 * 
 * @param {any} newVnode  旧vnode节点
 * @param {any} oldVnode  新vnode节点
 * @param {any} parentDomNode  父级真实dom，用于操作
 */
function updateChildren(oldVnode, newVnode, parentDomNode, parentContext) {
    newVnode = flattenChildren(newVnode); //扁平化处理，去除jsx生成的嵌套，文本节点转换为VNode等
    oldVnode = oldVnode || []; //旧节点
    //如果不是数组，转换为数组
    if (!Array.isArray(oldVnode)) {
        oldVnode = [oldVnode];
    }
    if (!Array.isArray(newVnode)) {
        newVnode = [newVnode];
    }

    let oldLength = oldVnode.length, //获取长度
        newLength = newVnode.length,
        oldStartIdx = 0, //建立newVnode,oldVnode上的4个指针
        newStartIdx = 0,
        oldEndIdx = oldLength - 1,
        newEndIdx = newLength - 1,
        oldStartVnode = oldVnode[0],    //获取新旧头节点
        newStartVnode = newVnode[0],
        oldEndVnode = oldVnode[oldEndIdx],  //获取新旧尾节点
        newEndVnode = newVnode[newEndIdx],
        oldKeyToIdx; //key值映射表

    if (newLength >= 0 && !oldLength) { //全部新节点存在，旧节点不存在，直接逐个解析
        newVnode.forEach(item => {
            renderCore(item, parentDomNode, false, parentContext);
            //newVnode[index] = item //更新解析后vnode的引用
        });
        return newVnode;
    }

    if (!newLength && oldLength >= 0) {//全部旧节点不存在，直接删除
        oldVnode.forEach((item) => {
            disposeVnode(item);
        });
        return newVnode[0];
    }

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
        //在指针移动过程中遇到被标记为未定义的节点跳过
        if (oldStartVnode === undefined || oldStartVnode === null) {
            oldStartVnode = oldVnode[++oldStartIdx];
        } else if (oldEndVnode === undefined || oldEndVnode === null) {
            oldEndVnode = oldVnode[--oldEndIdx];
        } else if (newStartVnode === undefined || newStartVnode === null) {
            newStartVnode = newVnode[++newStartIdx];
        } else if (newEndVnode === undefined || newEndVnode === null) {
            newEndVnode = newVnode[--newEndIdx];
        } else if (isSameVnode(oldStartVnode, newStartVnode)) { //新旧节点头比较
            update(oldStartVnode, newStartVnode, newStartVnode._hostNode);
            oldStartVnode = oldVnode[++oldStartIdx];
            newStartVnode = newVnode[++newStartIdx];
        } else if (isSameVnode(oldEndVnode, newEndVnode)) { //新旧节点尾比较
            update(oldEndVnode, newEndVnode, newEndVnode._hostNode);
            oldEndVnode = oldVnode[--oldEndIdx];
            newEndVnode = newVnode[--newEndIdx];
        } else if (isSameVnode(oldStartVnode, newEndVnode)) { //新旧节点尾头比较
            let dom = oldStartVnode._hostNode;
            parentDomNode.insertBefore(dom, oldEndVnode.nextSibling); //dom移位
            update(oldStartVnode, newEndVnode, oldStartVnode._hostNode._hostNode);
            oldStartVnode = oldVnode[++oldStartIdx];
            newEndVnode = newVnode[--newEndIdx];
        } else if (isSameVnode(oldEndVnode, newStartVnode)) { //新旧节点头尾比较
            let dom = oldEndVnode._hostNode;
            parentDomNode.insertBefore(dom, oldStartVnode._hostNode); //dom移位
            update(oldStartVnode, newEndVnode, oldStartVnode._hostNode);
            oldEndVnode = oldVnode[--oldEndIdx];
            newStartVnode = newVnode[++newStartIdx];
        } else {
            if (oldKeyToIdx === undefined) {
                oldKeyToIdx = mapKeyToIndex(oldVnode);
            }

            let indexInOld = oldKeyToIdx[newStartVnode.key]; //寻找索引值

            if (indexInOld === undefined) { //如果没有找到索引，表明该节点在oldVnode中不存在
                if (newStartVnode.type === "#text") { //该节点为文本类型
                    update(oldStartVnode, newStartVnode, parentDomNode, parentContext);
                } else {
                    let _parentDomNode = parentDomNode;
                    if (parentDomNode.nodeName === "#text") {
                        _parentDomNode = parentDomNode.parentNode;
                    }
                    if (oldStartVnode.type === "#text") {        //用处？
                        _parentDomNode = parentDomNode.parentNode;
                    }

                    let newElm = renderCore(newStartVnode, _parentDomNode, true, parentContext);
                    _parentDomNode.insertBefore(newElm, oldStartVnode._hostNode);
                    newStartVnode = newVnode[++newStartIdx];
                }
            } else {
                let moveVnode = oldVnode[indexInOld];
                update(moveVnode, newStartVnode, moveVnode._hostNode, parentContext);
                parentDomNode.insertBefore(moveVnode._hostNode, oldStartVnode._hostNode);
                oldVnode[indexInOld] = undefined;
                newStartVnode = newVnode[++newStartIdx];
            }

        }

        if (oldStartIdx > oldEndIdx) { //如果旧vnode指针相遇,即剩余新vnode为新增节点
            for (; newStartIdx - 1 < newEndIdx; newStartIdx++) {
                if (newVnode[newStartIdx]) {
                    let newDomNode = renderCore(newVnode[newStartIdx], parentDomNode);
                    parentDomNode.appendChild(newDomNode);
                    newVnode[newStartIdx]._hostNode = newDomNode;
                }
            }
        } else if (newStartIdx > newEndIdx) { //如果新vnode指针相遇,即剩余旧vnode为删除节点
            for (; oldStartIdx - 1 < oldEndIdx; oldStartIdx++) {
                if (oldVnode[oldStartIdx]) {
                    let removeNode = oldVnode[oldStartIdx];
                    if (typeNumber(removeNode._hostNode) <= 1) {  //证明这个节点已经被移除；
                        continue;
                    }
                    disposeVnode(removeNode);
                }
            }
        }
    }

    return newVnode;
}

//更新策略
export function update(oldVnode, newVnode, parentDomNode, parentContext) {
    newVnode._hostNode = oldVnode._hostNode; //拷贝旧vnode节点的真实dom
    if (oldVnode.type === newVnode.type) { //为同类型节点
        if (typeNumber(oldVnode) === 7) { //节点为数组，执行diff子类型比对
            newVnode = updateChildren(oldVnode, newVnode, parentDomNode, parentContext); //得的更新后的vnode
            newVnode.return = oldVnode.return;
            newVnode._hostNode = newVnode[0]._hostNode;
        }

        if (oldVnode.type === "#text") {
            newVnode._hostNode = oldVnode._hostNode; //拷贝旧vnode节点的真实dom
            updateText(oldVnode, newVnode);
            return newVnode;
        }

        if (typeof oldVnode.type === "string") {//原生html
            updateProps(oldVnode.props, newVnode.props, newVnode._hostNode);

            if (oldVnode.ref !== newVnode.ref) {
                setRef(newVnode, oldVnode.owner, newVnode._hostNode);
            }

            newVnode.props.children = updateChildren(oldVnode.props.children, newVnode.props.children, oldVnode._hostNode, parentContext); //递归调用更新子层
        }
        if (typeof oldVnode.type === "function") {//自定义组件
            if (!oldVnode._instance.render) { //无状态组件
                const { props } = newVnode;
                const newStateLessInstance = new newVnode.type(props); //实例化该节点，传入新的props
                update(oldVnode._instance, newStateLessInstance, parentDomNode, parentContext);
                newStateLessInstance.owner = oldVnode._instance.owner;
                newStateLessInstance.ref = oldVnode._instance.ref;
                newStateLessInstance.key = oldVnode._instance.key;
                newVnode._instance = newStateLessInstance;
                return newVnode;
            }
            //实例组件
            updateComponent(oldVnode, newVnode, parentDomNode, parentContext);
            newVnode.owner = oldVnode.owner;
            newVnode.ref = oldVnode.ref;
            newVnode.key = oldVnode.key;
            newVnode._instance = oldVnode._instance;
        }
    } else { //不同类型节点，简单粗暴直接干掉
        if (typeNumber(newVnode) === 7) {
            newVnode.forEach((item, index) => {
                let dom = renderCore(item, parentDomNode, true, parentContext); //解析子节点
                if (index === 0) {
                    newVnode._hostNode = dom; //挂载子节点dom
                }
                const parentNode = parentDomNode.parentNode;
                if (item._hostNode) {
                    parentNode.insertBefore(dom, oldVnode._hostNode); //父级的父级节点插入新节点
                } else {
                    item.appendChild(dom); //新建的节点里放入dom
                    item._hostNode = dom;
                }
            });
            disposeVnode(oldVnode); //干掉旧节点
            return newVnode;
        }

        const dom = renderCore(newVnode, parentDomNode); //不是数组直接解析节点
        if (typeNumber(newVnode.type) !== 5) {
            newVnode._hostNode = dom;

            if (oldVnode._hostNode) {
                parentDomNode.insertBefore(dom, oldVnode._hostNode);
                disposeVnode(oldVnode);  //干掉旧节点
            } else {
                parentDomNode.appendChild(dom);
            }
        }
    }
}

function updateComponent(oldComponentVnode, newComponentVnode, parentDomNode, parentContext) {
    const { oldState, oldProps, oldVnode, oldContext } = instanceProps(oldComponentVnode);
    const newProps = newComponentVnode.props;
    let newContext = parentContext;
    const instance = oldComponentVnode._instance; //记录旧实例

    //如果props和context中的任意一个改变了，那么就会触发组件的receive,render,update等
    //但是依旧会继续往下比较

    oldComponentVnode._instance.props = newProps; //更新原来组件的信息

    if (instance.getChildContext) {
        oldComponentVnode._instance.context = Object.assign({}, newContext, instance.getChildContext());
    } else {
        oldComponentVnode._instance.context = Object.assign({}, newContext);
    }

    oldComponentVnode._instance.lifeCycle = Com.UPDATING; //修改周期状态为更新中

    if (oldComponentVnode._instance.componentWillReceiveProps) {
        catchError(oldComponentVnode._instance, "componentWillReceiveProps", [newProps, newContext]); //执行当前周期钩子
        let mergedState = oldComponentVnode._instance.state; //获取旧实例上state
        oldComponentVnode._instance._penddingState.forEach((partialState) => {
            mergedState = Object.assign({}, mergedState, partialState.partialNewState); //合并state
        });
        oldComponentVnode._instance.state = mergedState; //更新旧实例上state
    }

    if (oldComponentVnode._instance.shouldComponentUpdate) {
        let shouldUpdate = catchError(oldComponentVnode._instance, "shouldComponentUpdate", [newProps, oldState, newContext]);
        if (!shouldUpdate) { //不更新时处理
            //无论shouldComponentUpdate结果是如何，数据都会给用户设置上去
            //但是不一定会刷新
            oldComponentVnode._instance.props = newProps;
            oldComponentVnode._instance.context = newContext;
            return;
        }
    }

    if (oldComponentVnode._instance.componentWillUpdate) {
        catchError(oldComponentVnode._instance, "componentWillUpdate", [newProps, oldState, newContext]);
    }

    let lastOwner = currentOwner.cur;
    currentOwner.cur = oldComponentVnode._instance;

    let newVnode = oldComponentVnode._instance.render ? catchError(oldComponentVnode._instance, "render", []) : new newComponentVnode.type(newProps, newContext);
    newVnode = newVnode ? newVnode : new VnodeClass("#text", "", null, null);
    const renderedType = typeNumber(newVnode);
    if (renderedType === 3 && renderedType === 4) {
        newVnode = new VnodeClass("#text", newVnode, null, null);
    }

    let fixedOldVnode = oldVnode ? oldVnode : oldComponentVnode._instance;

    currentOwner.cur = lastOwner;

    update(fixedOldVnode, newVnode, oldComponentVnode._hostNode, instance.context);
    oldComponentVnode._hostNode = newVnode._hostNode;
    if (oldComponentVnode._instance.Vnode) {//更新React component的时候需要用新的完全更新旧的component，不然无法更新
        oldComponentVnode._instance.Vnode = newVnode;
    } else {
        oldComponentVnode._instance = newVnode;
    }

    if (oldComponentVnode._instance) {
        if (oldComponentVnode._instance.componentDidUpdate) {
            catchError(oldComponentVnode._instance, "componentDidUpdate", [oldProps, oldState, oldContext]);
        }
        oldComponentVnode._instance.lifeCycle = Com.UPDATED;
    }
}

//更新文本节点
function updateText(oldTextVnode, newTextVnode) {
    let dom = oldTextVnode._hostNode;
    if (oldTextVnode.props !== newTextVnode.props) {
        dom.nodeValue = newTextVnode.props;
    }
}

export function findDOMNode(ref) {
    if (ref == null) {
        return null;
    }
    if (ref.nodeType === 1) {
        return ref;
    }
    return ref.__dom || null;
}