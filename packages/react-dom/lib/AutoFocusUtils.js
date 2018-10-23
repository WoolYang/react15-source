'use strict';

var ReactDOMComponentTree = require('./ReactDOMComponentTree');

var AutoFocusUtils = {
  focusDOMComponent: function () {
    ReactDOMComponentTree.getNodeFromInstance(this).focus();
  }
};

module.exports = AutoFocusUtils;