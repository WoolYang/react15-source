'use strict';

var ReactDOMComponentTree = require('./ReactDOMComponentTree');
var ReactInstanceMap = require('./shared/ReactInstanceMap');

var getHostComponentFromComposite = require('./reconciler/getHostComponentFromComposite');

/**
 * Returns the DOM node rendered by this element.
 * @param {ReactComponent|DOMElement} componentOrElement
 * @return {?DOMElement} The root node of this element.
 */
function findDOMNode(componentOrElement) {
  if (componentOrElement == null) {
    return null;
  }
  if (componentOrElement.nodeType === 1) {
    return componentOrElement;
  }

  var inst = ReactInstanceMap.get(componentOrElement);
  if (inst) {
    inst = getHostComponentFromComposite(inst);
    return inst ? ReactDOMComponentTree.getNodeFromInstance(inst) : null;
  }
}

module.exports = findDOMNode;