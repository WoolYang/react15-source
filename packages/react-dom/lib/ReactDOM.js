
'use strict';

var ReactDefaultInjection = require('./shared/ReactDefaultInjection');
var ReactMount = require('./ReactMount');
var ReactUpdates = require('./reconciler/ReactUpdates');

var findDOMNode = require('./findDOMNode');
var renderSubtreeIntoContainer = require('./renderSubtreeIntoContainer');

ReactDefaultInjection.inject();

var ReactDOM = {
  findDOMNode: findDOMNode, //取dom
  render: ReactMount.render, //渲染
  unmountComponentAtNode: ReactMount.unmountComponentAtNode, //插入dom

  unstable_batchedUpdates: ReactUpdates.batchedUpdates,
  unstable_renderSubtreeIntoContainer: renderSubtreeIntoContainer
};

module.exports = ReactDOM;