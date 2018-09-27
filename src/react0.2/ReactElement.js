import REACT_ELEMENT_TYPE from './ReactElementSymbol'
//过滤属性
const RESERVED_PROPS = {
    key: true,
    ref: true,
    __self: true,
    __source: true
};

//当前调用组件指针
const ReactCurrentOwner = {
    current: null
  };

//self和owner，ref用生产不用 self, source
const ReactElement = function (type, key, ref, self, source, owner, props) {

  const element = {
    $$typeof: REACT_ELEMENT_TYPE, //检测react对象，防XSS
    //元素的内置属性
    type: type,
    key: key,
    ref: ref,
    props: props,

    // 记录创建此元素的组件。
    _owner: owner
  };

  return element;
};

//top-level-api createElement 格式化JSX对象
ReactElement.createElement = function (type, config, children) {

    //初始化属性
    const props = {};
    let propName;
    let key = null; 
    let ref = null;
    let self = null;
    let source = null;
  
    if (config != null) {
        ref = config.ref === undefined ? null : config.ref;
        key = config.key === undefined ? '' + null : config.key;
        self = config.__self === undefined ? null : config.__self;
        source = config.__source === undefined ? null : config.__source;

      // 处理其它属性
      for (propName in config) {
        if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
          props[propName] = config[propName];
        }
      }
    }
  
    // 处理children,大于1个child，转换为数组
    const childrenLength = arguments.length - 2;
    if (childrenLength === 1) {
      props.children = children;
    } else if (childrenLength > 1) {
      const childArray = Array(childrenLength);
      for (let i = 0; i < childrenLength; i++) {
        childArray[i] = arguments[i + 2];
      }
      props.children = childArray;
    }
  
    // 默认属性
    if (type && type.defaultProps) {
      const defaultProps = type.defaultProps;
      for (propName in defaultProps) {
        if (props[propName] === undefined) {
          props[propName] = defaultProps[propName];
        }
      }
    }

    return ReactElement(type, key, ref, self, source, ReactCurrentOwner.current, props);
  };

//top-level-api createFactory 暴露type属性
ReactElement.createFactory = function (type) {
  const factory = ReactElement.createElement.bind(null, type);
  factory.type = type;
  return factory;
};

//cloneAndReplaceKey 克隆换key
ReactElement.cloneAndReplaceKey = function (oldElement, newKey) {
  const newElement = ReactElement(oldElement.type, newKey, oldElement.ref, oldElement._self, oldElement._source, oldElement._owner, oldElement.props);
  return newElement;
};

//top-level-api 克隆元素
ReactElement.cloneElement = function (element, config, children) {
  // 原props
  const props = Object.assign({}, element.props);

  let propName;

  let key = element.key;
  let ref = element.ref;

  let self = element._self;
  let source = element._source;

  let owner = element._owner;

  if (config != null) {
    ref = config.ref === undefined ? null : config.ref;

    key = config.key === undefined ? '' + null : config.key;

    // 默认属性
    let defaultProps;
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

  const childrenLength = arguments.length - 2;
  if (childrenLength === 1) {
    props.children = children;
  } else if (childrenLength > 1) {
    const childArray = Array(childrenLength);
    for (let i = 0; i < childrenLength; i++) {
      childArray[i] = arguments[i + 2];
    }
    props.children = childArray;
  }

  return ReactElement(element.type, key, ref, self, source, owner, props);
};

//top-level-api 检测元素是否是react元素
ReactElement.isValidElement = function (object) {
  return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
};

export default ReactElement;