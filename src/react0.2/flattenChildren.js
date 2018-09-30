import REACT_ELEMENT_TYPE from './ReactElementSymbol';
import getIteratorFn from './utils/getIteratorFn';
import KeyEscapeUtils from './utils/KeyEscapeUtils'

const SEPARATOR = '.';
const SUBSEPARATOR = ':';
function getComponentKey(component, index) {
    if (component && typeof component === 'object' && component.key != null) {
      return KeyEscapeUtils.escape(component.key);
    }
    return index.toString(36);
  }

//遍历所有children
function traverseAllChildrenImpl(children, nameSoFar, callback, traverseContext) {
    var type = typeof children;
  
    if (type === 'undefined' || type === 'boolean') {
      children = null;
    }
  
    if (children === null || type === 'string' || type === 'number' ||
    type === 'object' && children.$$typeof === REACT_ELEMENT_TYPE) {
      callback(traverseContext, children,
      nameSoFar === '' ? SEPARATOR + getComponentKey(children, 0) : nameSoFar);
      return 1;
    }
  
    var child;
    var nextName;
    var subtreeCount = 0; 
    var nextNamePrefix = nameSoFar === '' ? SEPARATOR : nameSoFar + SUBSEPARATOR;
  
    if (Array.isArray(children)) {
      for (var i = 0; i < children.length; i++) {
        child = children[i];
        nextName = nextNamePrefix + getComponentKey(child, i);
        subtreeCount += traverseAllChildrenImpl(child, nextName, callback, traverseContext);
      }
    } else {
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
      } else if (type === 'object') {
            console.error('Objects are not valid as a React child')
      }
    }
  
    return subtreeCount;
  }

function traverseAllChildren(children, callback, traverseContext) {
    if (children == null) {
      return 0;
    }
  
    return traverseAllChildrenImpl(children, '', callback, traverseContext);
  }


function flattenSingleChildIntoContext(traverseContext, child, name) {
    
    if (traverseContext && typeof traverseContext === 'object') {
      const result = traverseContext;
      const keyUnique = result[name] === undefined;

      if (keyUnique && child != null) {
        result[name] = child;
      }
    }
  }

//扁平化child
function flattenChildren(children) {
    if (children == null) {
      return children;
    }
    var result = {};
  
    traverseAllChildren(children, flattenSingleChildIntoContext, result);
    return result;
}

export default flattenChildren;