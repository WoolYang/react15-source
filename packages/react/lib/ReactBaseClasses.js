'use strict';

var ReactNoopUpdateQueue = require('./ReactNoopUpdateQueue');

/**
 * 用于组件更新状态的基类帮助程序。
 */
function ReactComponent(props, context, updater) {
  this.props = props;
  this.context = context;
  this.refs = {};
  //初始化默认的更新程序，但真实的更新程序会由渲染器注入
  this.updater = updater || ReactNoopUpdateQueue;
}

ReactComponent.prototype.isReactComponent = {};

/**
 * 设置state的子集。 总是使用它来改变state。 你应该将`this.state`视为不可变的。 
 * 无法保证`this.state`会立即更新，因此在调用此方法后访问`this.state`可能会返回旧值。
 * 无法保证对`setState`的调用将同步运行，因为它们最终可能会被批处理。 
 * 您可以提供可选的回调，该回调将在实际完成对setState的调用时执行。 当一个函数被提供给setState时，它将在未来的某个时刻被调用（不是同步的）。 
 * 它将使用最新的组件参数（state, props, context）进行调用。 这些值可能与此不同。因为您的函数可能在receiveProps之后但在shouldComponentUpdate之前调用，
 * 并且此新state，props和context也不会被分配给它。
 *
 * @param {object|function} partialState 下一个部分状态或函数产生下一个要与当前状态合并的部分状态。
 * @param {?function} callback 执行完更新后的回调
 * @final
 * @protected
 */
ReactComponent.prototype.setState = function (partialState, callback) {
  this.updater.enqueueSetState(this, partialState);
  if (callback) {
    this.updater.enqueueCallback(this, callback, 'setState');
  }
};

/**
 * 读者注：实际应用场景有待研究
 * 
 * 强制更新。 只有在确定不是在DOM事务中时才应该调用它。 
 * 当您知道组件状态的某些更深层次已更改但未调用“setState”时，您可能需要调用此方法。 
 * 这不会调用`shouldComponentUpdate`，但会调用`componentWillUpdate`和`componentDidUpdate`。
 * 
 * @param {?function} callback 更新完成后调用。
 * @final
 * @protected
 */
ReactComponent.prototype.forceUpdate = function (callback) {
  this.updater.enqueueForceUpdate(this);
  if (callback) {
    this.updater.enqueueCallback(this, callback, 'forceUpdate');
  }
};

/**
  弃用的API。 这些API过去常常存在于经典的React类中，但由于我们不想弃用它们，因此我们不打算将它们移到这个现代基类中。 
  相反，我们定义一个getter，它会在访问时发出警告。
 */

/**
 * 用于组件更新状态的基类帮助程序。
 */
function ReactPureComponent(props, context, updater) {
  // 从ReactComponent复制。
  this.props = props;
  this.context = context;
  this.refs = {};
  this.updater = updater || ReactNoopUpdateQueue;
}

function ComponentDummy() {}
ComponentDummy.prototype = ReactComponent.prototype;
ReactPureComponent.prototype = new ComponentDummy();
ReactPureComponent.prototype.constructor = ReactPureComponent;
// 避免为这些方法进行额外的原型跳转。
Object.assign(ReactPureComponent.prototype, ReactComponent.prototype);
ReactPureComponent.prototype.isPureReactComponent = true;

module.exports = {
  Component: ReactComponent,
  PureComponent: ReactPureComponent
};