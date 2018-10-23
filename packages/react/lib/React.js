'use strict';

var ReactBaseClasses = require('./ReactBaseClasses');
var ReactChildren = require('./ReactChildren');
var ReactElement = require('./ReactElement');
//var ReactPropTypes = require('./unless/ReactPropTypes');

var onlyChild = require('./onlyChild');

var createElement = ReactElement.createElement;
var createFactory = ReactElement.createFactory;
var cloneElement = ReactElement.cloneElement;

var React = {
  // Modern

  Children: {
    map: ReactChildren.map,
    forEach: ReactChildren.forEach,
    count: ReactChildren.count,
    toArray: ReactChildren.toArray,
    only: onlyChild
  },

  Component: ReactBaseClasses.Component,
  PureComponent: ReactBaseClasses.PureComponent,

  createElement: createElement,
  cloneElement: cloneElement,
  isValidElement: ReactElement.isValidElement,

  // Classic

 // PropTypes: ReactPropTypes,
  createFactory: createFactory,

  // This looks DOM specific but these are actually isomorphic helpers
  // since they are just generating DOM strings.
  //DOM: ReactDOMFactories,

};

module.exports = React;