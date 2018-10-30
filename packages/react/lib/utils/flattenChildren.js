'use strict';

var traverseAllChildren = require('./traverseAllChildren');

/**
 * @param {function} traverseContext Context passed through traversal.
 * @param {?ReactComponent} child React child component.
 * @param {!string} name String name of key path to child.
 * @param {number=} selfDebugID Optional debugID of the current internal instance.
 */
function flattenSingleChildIntoContext(traverseContext, child, name) {
  // We found a component instance.
  if (traverseContext && typeof traverseContext === 'object') {
    var result = traverseContext;
    var keyUnique = result[name] === undefined;

    if (keyUnique && child != null) {
      result[name] = child;
    }
  }
}

/**
 * 扁平化通常指定为“props.children”的children+。 任何null子项都不会包含在结果对象中。
 * @return {!object}
 */
function flattenChildren(children) {
  if (children == null) {
    return children;
  }
  var result = {};

  traverseAllChildren(children, flattenSingleChildIntoContext, result);
  return result;
}

module.exports = flattenChildren;