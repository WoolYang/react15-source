'use strict';

var REACT_ELEMENT_TYPE = require('./utils/ReactElementSymbol');

var hasOwnProperty = Object.prototype.hasOwnProperty;

var RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true
};

//跟踪当前所有者。当前所有者是应该拥有任何组件的组件
var ReactCurrentOwner = {
  current: null
};

/**
 * 创建react元素
 * 
 * @param {*} type
 * @param {*} key
 * @param {string|object} ref
 * @param {*} self ref使用箭头函数避免this指向问题
 * @param {*} source 注释对象（由转换器或其他方式添加）指示文件名，行号和/或其他信息。
 * @param {*} owner
 * @param {*} props
 * @internal
 */
var ReactElement = function (type, key, ref, self, source, owner, props) {
  var element = {
    // 标识react元素，防止XSS注入
    $$typeof: REACT_ELEMENT_TYPE,
    // 元素内置属性
    type: type,
    key: key,
    ref: ref,
    props: props,

    _owner: owner // 记录负责创建此元素的组件。
  };
  return element;
};

/**
 * 创建并返回给定类型的新ReactElement。
 * 读者注：格式化JSX转换后的对象，如过滤内置属性
 */
ReactElement.createElement = function (type, config, children) {
  var propName;
  var props = {};

  var key = null;
  var ref = null;
  var self = null;
  var source = null;

  if (config != null) {
    ref = config.ref !== undefined ? config.ref : null
    key = config.key !== undefined ? '' + config.key : null

    //非必要属性
    self = config.__self === undefined ? null : config.__self;
    source = config.__source === undefined ? null : config.__source;
    //拷贝属性到props对象
    for (propName in config) {
      if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
        props[propName] = config[propName];
      }
    }
  }

  // 子项可以是多个参数，并且这些参数将被转移到新分配的props对象上。
  var childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    var childArray = Array(childrenLength);
    for (var i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }

    props.children = childArray;
  }

  //处理默认props
  if (type && type.defaultProps) {
    var defaultProps = type.defaultProps;
    for (propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
  }

  return ReactElement(type, key, ref, self, source, ReactCurrentOwner.current, props);
};

/**
 * 返回一个生成给定类型的ReactElements的函数
 */
ReactElement.createFactory = function (type) {
  var factory = ReactElement.createElement.bind(null, type);
  factory.type = type;
  return factory;
};

ReactElement.cloneAndReplaceKey = function (oldElement, newKey) {
  var newElement = ReactElement(oldElement.type, newKey, oldElement.ref, oldElement._self, oldElement._source, oldElement._owner, oldElement.props);

  return newElement;
};

/**
 * 使用element作为起点克隆并返回一个新的ReactElement。
 */
ReactElement.cloneElement = function (element, config, children) {
  var propName;
  // 复制原props
  var props = Object.assign({}, element.props);
  // 提取保留名称
  var key = element.key;
  var ref = element.ref;
  //均指向原始
  var self = element._self;
  var source = element._source;

  // 除非ref被覆盖，否则将保留所有者
  var owner = element._owner;

  if (config != null) {

    if (config.ref !== undefined) {
      ref = config.ref;
      owner = ReactCurrentOwner.current;
    }

    key = config.key !== undefined ? '' + config.key : null

    var defaultProps;
    if (element.type && element.type.defaultProps) {
      defaultProps = element.type.defaultProps;
    }
    for (propName in config) {
      if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
        if (config[propName] === undefined && defaultProps !== undefined) {
          props[propName] = defaultProps[propName];
        } else {
          props[propName] = config[propName];
        }
      }
    }
  }

  var childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    var childArray = Array(childrenLength);
    for (var i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    props.children = childArray;
  }

  return ReactElement(element.type, key, ref, self, source, owner, props);
};

//检查是否为react元素
ReactElement.isValidElement = function (object) {
  return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
};

module.exports = ReactElement;