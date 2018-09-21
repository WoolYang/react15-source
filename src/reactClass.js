import { Vnode } from "./createElement";
import { update, currentOwner } from "./render";
import { catchError } from "./errorBoundary";
//生命周期
export const Com = {
    CREATE: 0,//创造节点
    MOUNT: 1,//节点已经挂载
    UPDATING: 2,//节点正在更新
    UPDATED: 3,//节点已经更新
    MOUNTTING: 4,//节点正在挂载,
    CATCHING: 5 //节点异常
};
let uniqueId = 0;

export class ReactClass {
    constructor(props, context) {
        this.props = props;//组件props
        this.context = context;
        this.state = this.state || {}; //state初始化

        this.nextState = null; //更新state
        this.lifeCycle = Com.CREATE;//初始化生命节点
        this.stateMergeQueue = [];//state队列，作用？？？？
        this._penddingState = [];//state即将执行队列
        this.refs = {};
        this._uniqueId = uniqueId; //组件执行标识
        uniqueId++;
    }

    // 事件触发的时候setState只会触发最后一个
    // 在componentdidmount的时候会全部合成
    setState(partialNewState, callback) {

        this._penddingState.push({ partialNewState, callback }); //存放state到队列

        //获取用户shouldComponentUpdate逻辑决定是否更新state
        if (this.shouldComponentUpdate) {
            let shouldUpdate = this.shouldComponentUpdate(this.props, this.nextState, this.context);
            if (!shouldUpdate) {
                return;
            }
        }

        if (this.lifeCycle === Com.CREATE) {
            //组件挂载期
        } else {
            //组件更新期
            if (this.lifeCycle === Com.UPDATING) {
                return;
            }
            if (this.lifeCycle === Com.MOUNTTING) {  //componentDidMount的时候调用setState
                this.stateMergeQueue.push(1);
                return;
            }

            // if (this.lifeCycle === Com.CATCHING) {
            //     this.stateMergeQueue.push(1)  //componentDidMount的时候调用setState
            //     return
            // }
            //不在生命周期中调用，有可能是异步调用
            this.updateComponent();
        }
    }

    updateComponent() {
        const prevState = this.state; //记录旧state
        const oldVnode = this.Vnode; //获取旧Vnode
        const oldContext = this.context;

        this.nextState = this.state; //获取旧state引用

        //多次合并state操作，得到最终结果nextState
        this._penddingState.forEach(item => {
            if (typeof item.partialNewState === "function") {
                this.nextState = Object.assign({}, this.nextState, item.partialNewState(this.nextState, this.props));
            } else {
                this.nextState = Object.assign({}, this.state, item.partialNewState);
            }
        });

        if (this.nextState !== prevState) { //合并后state新旧state不同更新当前state
            this.state = this.nextState;
        }

        if (this.getChildContext) {
            this.context = Object.assign({}, this.context, this.getChildContext());
        }

        let lastOwner = currentOwner.cur;
        currentOwner.cur = this;
        this.nextState = null;
        let newVnode = this.render();//获取当前节点
        newVnode = newVnode ? newVnode : new Vnode("#text", "", null, null); //用户返回null时创建空节点
        currentOwner.cur = lastOwner;

        this.Vnode = update(oldVnode, newVnode, this.Vnode._hostNode, this.context);//这个函数返回一个更新后的Vnode

        if (this.componentDidUpdate) {
            catchError(this, "componentDidUpdate", [this.props, prevState, oldContext]);
        }

        //更新结束执行回调
        this._penddingState.forEach(item => {
            if (typeof item.callback === "function") {
                item.callback(this.state, this.props);
            }
        });

        this._penddingState = []; //state异步队列制空
    }

    //这个是在什么时候调用呢
    _updateInLifeCycle() {
        if (this.stateMergeQueue.length > 0) {
            let tempState = this.state;
            this._penddingState.forEach((item) => {
                tempState = Object.assign({}, tempState, ...item.partialNewState);
            });
            this.nextState = { ...tempState };
            this.stateMergeQueue = [];
            this.updateComponent();
        }
    }

    componentWillReceiveProps() { }
    componentWillMount() { }
    componentDidMount() { }
    componentWillUnmount() { }
    componentDidUnmount() { }

    render() { }//用户会重写这个方法，所以我们就放一个壳子在这里
}