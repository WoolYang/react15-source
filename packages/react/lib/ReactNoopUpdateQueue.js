'use strict';

/**
 * 更新队列的抽象API
 */
var ReactNoopUpdateQueue = {
  /**
   * 检查是否已挂载此复合组件。
   * @param {ReactClass} publicInstance 所检查的实例
   * @return {boolean}
   * @protected
   * @final
   */
  isMounted: function (publicInstance) {
    return false;
  },

  /**
   * 排队将在处理完所有待处理更新后执行的回调。
   *
   * @param {ReactClass} publicInstance 用作`this`上下文的实例。
   * @param {?function} callback Called after state is updated.
   * @internal
   */
  enqueueCallback: function (publicInstance, callback) {},

  /**
   *
   * @param {ReactClass} publicInstance 需要渲染的实例
   * @internal
   */
  enqueueForceUpdate: function (publicInstance) {},

  /**
   * 取代所有的state。 总是使用this或`setState`来改变状态。
   * 你应该将`this.state`视为不可变的。 
   * 无法保证`this.state`会立即更新，因此在调用此方法后访问`this.state`可能会返回旧值。
   *
   * @param {ReactClass} publicInstance
   * @param {object} completeState Next state.
   * @internal
   */
  enqueueReplaceState: function (publicInstance, completeState) {},

  /**
   * 设置状态的子集。 这只是因为_pendingState是内部的。 
   * 这提供了一种合并策略，该策略无法用于破坏令人困惑的属性。 
   * TODO：暴露pendingState或在合并期间不使用它。
   *
   * @param {ReactClass} publicInstance The instance that should rerender.
   * @param {object} partialState Next partial state to be merged with state.
   * @internal
   */
  enqueueSetState: function (publicInstance, partialState) {}
};

module.exports = ReactNoopUpdateQueue;