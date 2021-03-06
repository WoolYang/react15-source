'use strict';

/* global Symbol */

var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
var FAUX_ITERATOR_SYMBOL = '@@iterator'; // Before Symbol spec.

/**
* Returns the iterator method function contained on the iterable object.
*
* Be sure to invoke the function with the iterable as context:
*
*     var iteratorFn = getIteratorFn(myIterable);
*     if (iteratorFn) {
*       var iterator = iteratorFn.call(myIterable);
*       ...
*     }
*
* @param {?object} maybeIterable
* @return {?function}
*/
function getIteratorFn(maybeIterable) {
 var iteratorFn = maybeIterable && (ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL]);
 if (typeof iteratorFn === 'function') {
   return iteratorFn;
 }
}

export default getIteratorFn;