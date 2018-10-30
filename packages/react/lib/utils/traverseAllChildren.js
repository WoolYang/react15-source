'use strict';

var REACT_ELEMENT_TYPE = require('../ReactElementSymbol');

var getIteratorFn = require('./getIteratorFn');
var KeyEscapeUtils = require('./KeyEscapeUtils');

var SEPARATOR = '.';
var SUBSEPARATOR = ':';

/**
 * 生成标识集合中组件的键字符串。
 *
 * @param {*} component 可以包含手动密钥的组件
 * @param {number} index 未提供手动密钥时使用的索引。
 * @return {string}
 */
function getComponentKey(component, index) {
  //粗略类型检测，不影响未来可能ES API
  if (component && typeof component === 'object' && component.key != null) {
    return KeyEscapeUtils.escape(component.key);
  }
  return index.toString(36); //由集合中的索引确定的隐式键 36:0-9A-Z
}

/**
 * @param {?*} children Children tree container.
 * @param {!string} nameSoFar Name of the key path so far.
 * @param {!function} callback Callback to invoke with each child found.
 * @param {?*} traverseContext Used to pass information throughout the traversal
 * process.
 * @return {!number} The number of children in this subtree.
 */
function traverseAllChildrenImpl(children, nameSoFar, callback, traverseContext) {
  var type = typeof children;

  if (type === 'undefined' || type === 'boolean') {
    children = null;
  }

  if (children === null || type === 'string' || type === 'number' || type === 'object' && children.$$typeof === REACT_ELEMENT_TYPE) {
    callback(traverseContext, children, nameSoFar === '' ? SEPARATOR + getComponentKey(children, 0) : nameSoFar);
    return 1;
  }

  var child;
  var nextName;
  var subtreeCount = 0; // 在当前子树中找到的子项数
  var nextNamePrefix = nameSoFar === '' ? SEPARATOR : nameSoFar + SUBSEPARATOR;

  if (Array.isArray(children)) {
    for (var i = 0; i < children.length; i++) {
      child = children[i];
      nextName = nextNamePrefix + getComponentKey(child, i);
      subtreeCount += traverseAllChildrenImpl(child, nextName, callback, traverseContext);
    }
  } else {
    //该对象是否可用迭代器，若不可用，则忽略
    var iteratorFn = getIteratorFn(children); 
    if (iteratorFn) {
      var iterator = iteratorFn.call(children);
      var step;
      if (iteratorFn !== children.entries) {
        var ii = 0;
        while (!(step = iterator.next()).done) {
          child = step.value;
          nextName = nextNamePrefix + getComponentKey(child, ii++);
          subtreeCount += traverseAllChildrenImpl(child, nextName, callback, traverseContext);
        }
      } else {
        while (!(step = iterator.next()).done) {
          var entry = step.value;
          if (entry) {
            child = entry[1];
            nextName = nextNamePrefix + KeyEscapeUtils.escape(entry[0]) + SUBSEPARATOR + getComponentKey(child, 0);
            subtreeCount += traverseAllChildrenImpl(child, nextName, callback, traverseContext);
          }
        }
      }
    }
  }

  return subtreeCount;
}

/**
 *遍历通常指定为`props.children`的子项，但也可以通过属性指定： 
 *-`traverseAllChildren（this.props.children，...）` - `traverseAllChildren（this.props.leftPanelChildren，... ）`
 *`traverseContext`是一个可选的参数，它通过整个遍历传递。
 *它可用于存储累积或回调可能相关的任何其他内容。
 *
 * @param {?*} children Children tree object.
 * @param {!function} callback To invoke upon traversing each child.
 * @param {?*} traverseContext Context for traversal.
 * @return {!number} The number of children in this subtree.
 */
function traverseAllChildren(children, callback, traverseContext) {
  if (children == null) {
    return 0;
  }

  return traverseAllChildrenImpl(children, '', callback, traverseContext);
}

module.exports = traverseAllChildren;