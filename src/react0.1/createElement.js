import { typeNumber } from "./utils";
import { currentOwner } from "./render";

//props中需要过滤的
const RESERVED_PROPS = {
    ref: true,
    key: true
};

/**
 * 
 * Vnode构造函数是用于生成vode对象来存储由JSX转化来的虚拟dom
 * 
 * @param {any} type 节点的类型，div/span等
 * @param {object} props 节点属性，包括children元素，各属性等
 * @param {string|null} key 节点key值
 * @param {any} ref 节点ref属性
 */
export function Vnode(type, props, key, ref) {
    this.owner = currentOwner.cur;
    this.type = type;
    this.props = props;
    this.key = key;
    this.ref = ref;
}

/**
 * React.createElement是react的jsx转化工具默认入口，对转化后的jsx处理后注入vnode对象生成虚拟dom树
 * 比如<div></div>会被翻译成 React.createElement("div",null,null);
 * 
 * @param {any} type 解析jsx后得到的节点类型
 * @param {object} config 解析jsx后节点属性信息存储在这里
 * @param {array} children 解析jsx后得到的子节点信息
 * @returns {Vnode} 返回vode节点对象
 */
export function createElement(type, config, ...children) {
    let props = {},
        key = null,
        ref = null,
        childLength = children.length;

    if (config != null) {

        key = config.key === undefined ? null : "" + config.key;
        ref = config.ref === undefined ? null : config.ref;

        for (let propName in config) {

            //if (propName === "key" || propName === "ref") continue;
            if (RESERVED_PROPS.hasOwnProperty(propName)) {
                continue;
            }

            if (config.hasOwnProperty(propName)) {
                props[propName] = config[propName];
            }
        }
    }

    if (childLength === 1) {
        props.children = typeNumber(children[0]) > 2 ? children[0] : []; //null undefined节点不渲染
    } else if (childLength > 1) { //child为空时不移动到props
        props.children = children;
    }

    let defaultProps = type.defaultProps; //拷贝默认props
    if (defaultProps) {
        for (let propName in defaultProps) {
            if (props[propName] === undefined) {
                props[propName] = defaultProps[propName];
            }
        }
    }

    // console.log(props)
    return new Vnode(type, props, key, ref);
}

//将文字节点转换为vnode类型文字节点,将前后同是普通类型的合并,将同一层级的children展开 例[vnode(0),1,2,[3,4]] ==>[vnode(0),vnode(1),vnode(2),vnode(3),vnode(4)]
export function flattenChildren(children, parentVnode) {
    //console.log(children)
    //children不存在时返回空文字vnode节点
    // if (typeNumber(children) == 7 && children.length === 4) children.push(33)合并测试
    if (children === undefined) {
        return new Vnode("#text", "", null, null);
    }

    let length = children.length,
        childType = typeNumber(children),
        array = [],
        isLastSimple = false, //判断上一个元素是否是string 或者 number
        lastString = "";

    if (childType === 4 || childType === 3) {
        return new Vnode("#text", children, null, null);
    }

    //childType不是数组，字符串，数字，undefined，则在return中记录其父节点
    if (childType !== 7) {
        if (parentVnode) {
            children.return = parentVnode;
        }
        return children;
    }

    //children是数组的时候处理,这步把数组中相邻项且都是普通文本进行的合并，减少vnode实例数量，但实际这种情况在什么时候会出现有待验证
    children.forEach((item, index) => {
        //子节点还是数组
        if (typeNumber(item) === 7) {
            if (isLastSimple) {
                array.push(lastString);
            }
            item.forEach((item) => {
                array.push(item);
            });
            lastString = "";
            isLastSimple = false;
        }

        //子节点是字符串数字累加
        if (typeNumber(item) === 3 || typeNumber(item) === 4) {
            lastString += item;
            isLastSimple = true;
        }

        if (typeNumber(item) !== 3 && typeNumber(item) !== 4 && typeNumber(item) !== 7) {
            if (isLastSimple) {//上一个节点是简单节点结束累加
                array.push(lastString);
                array.push(item);
                lastString = "";
                isLastSimple = false;
            } else {
                array.push(item);
            }
        }
        if (length - 1 === index) {
            if (lastString) {
                array.push(lastString);
            }
        }
    });

    array = array.map((item) => {
        //把数组中的字符串数字转化为text类型vnode
        if (typeNumber(item) === 4) {
            item = new Vnode("#text", item, null, null);
        } else {
            if (item) {//首先判断是否存在
                if (typeNumber(item) !== 3 && typeNumber(item) !== 4) {//再判断是不是字符串，或者数字
                    //不是就加上return
                    if (parentVnode) {
                        item.return = parentVnode; //暂时没用用到
                    }

                }
            }
        }
        return item;

    });
    // console.log(array)
    return array;
}