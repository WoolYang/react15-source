'use strict';

var ReactElement = require('./ReactElement');
var PooledClass = require('./utils/PooledClass');
var traverseAllChildren = require('./utils/traverseAllChildren');

function escapeUserProvidedKey(text) {
  const userProvidedKeyEscapeRegex = /\/+/g;
  return ('' + text).replace(userProvidedKeyEscapeRegex, '$&/');
}

function forEachSingleChild(bookKeeping, child, name) {
  var func = bookKeeping.func,
      context = bookKeeping.context;

  func.call(context, child, bookKeeping.count++);
}

/**
 * PooledClass表示与执行子迁移相关的簿记。 允许避免绑定回调。
 *
 * @constructor MapBookKeeping
 * @param {!*} mapResult
 * @param {!function} mapFunction
 * @param {?*} mapContext
 */
function MapBookKeeping(mapResult, keyPrefix, mapFunction, mapContext) {
  this.result = mapResult;
  this.keyPrefix = keyPrefix;
  this.func = mapFunction;
  this.context = mapContext;
  this.count = 0;
}

MapBookKeeping.prototype.destructor = function () {
  this.result = null;
  this.keyPrefix = null;
  this.func = null;
  this.context = null;
  this.count = 0;
};
PooledClass.addPoolingTo(MapBookKeeping);

//如果有prefix，转义前缀
function mapIntoWithKeyPrefixInternal(children, array, prefix, func, context) {
  var escapedPrefix = '';
  if (prefix != null) {
    escapedPrefix = escapeUserProvidedKey(prefix) + '/';
  }
  var traverseContext = MapBookKeeping.getPooled(array, escapedPrefix, func, context);
  traverseAllChildren(children, mapSingleChildIntoContext, traverseContext);
  MapBookKeeping.release(traverseContext);
}

function mapSingleChildIntoContext(bookKeeping, child, childKey) {
  var result = bookKeeping.result,
      keyPrefix = bookKeeping.keyPrefix,
      func = bookKeeping.func,
      context = bookKeeping.context;


  var mappedChild = func.call(context, child, bookKeeping.count++);
  if (Array.isArray(mappedChild)) {
    mapIntoWithKeyPrefixInternal(mappedChild, result, childKey, arg=>arg);
  } else if (mappedChild != null) {
    if (ReactElement.isValidElement(mappedChild)) {
      mappedChild = ReactElement.cloneAndReplaceKey(mappedChild,
      keyPrefix + (mappedChild.key && (!child || child.key !== mappedChild.key) ? escapeUserProvidedKey(mappedChild.key) + '/' : '') + childKey);
    }
    result.push(mappedChild);
  }
}

/**
 * foreach
 *
 * @param {?*} children 
 * @param {function(*, int)} forEachFunc
 * @param {*} forEachContext
 */
function forEachChildren(children, forEachFunc, forEachContext) {
  if (children == null) {
    return children;
  }
  var traverseContext = MapBookKeeping.getPooled(forEachFunc,null, null, forEachContext);
  traverseAllChildren(children, forEachSingleChild, traverseContext);
  MapBookKeeping.release(traverseContext);
}

/**
 * mapFunction(child, key, index) 调用子节点
 *
 * @param {?*} children children
 * @param {function(*, int)} func map 函数
 * @param {*} context context API
 * @return {object} 结构
 */
function mapChildren(children, func, context) {
  if (children == null) {
    return children;
  }
  var result = [];
  mapIntoWithKeyPrefixInternal(children, result, null, func, context);
  return result;
}

/**
 * @param {?*} children
 * @return {number} 
 */
function countChildren(children) {
  return traverseAllChildren(children, ()=> null, null);
}

/**
 * Flatten a children object (typically specified as `props.children`) and
 * return an array with appropriately re-keyed children.
 */
function toArray(children) {
  var result = [];
  mapIntoWithKeyPrefixInternal(children, result, null, arg => arg);
  return result;
}

function onlyChild(children) {
  return children;
}

var ReactChildren = {
  forEach: forEachChildren,
  map: mapChildren,
  count: countChildren,
  toArray: toArray,
  only: onlyChild
};

module.exports = ReactChildren;