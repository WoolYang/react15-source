'use strict';

var EventPluginUtils = require('../event/EventPluginUtils');
var EventPropagators = require('../event/EventPropagators');
var SyntheticUIEvent = require('../syntheticEvents/SyntheticUIEvent');
var ViewportMetrics = require('../ViewportMetrics');

var isStartish = EventPluginUtils.isStartish;
var isEndish = EventPluginUtils.isEndish;

var TouchEventUtils = {
  /**
   * Utility function for common case of extracting out the primary touch from a
   * touch event.
   * - `touchEnd` events usually do not have the `touches` property.
   *   http://stackoverflow.com/questions/3666929/
   *   mobile-sarai-touchend-event-not-firing-when-last-touch-is-removed
   *
   * @param {Event} nativeEvent Native event that may or may not be a touch.
   * @return {TouchesObject?} an object with pageX and pageY or null.
   */
  extractSingleTouch: function extractSingleTouch(nativeEvent) {
    var touches = nativeEvent.touches;
    var changedTouches = nativeEvent.changedTouches;
    var hasTouches = touches && touches.length > 0;
    var hasChangedTouches = changedTouches && changedTouches.length > 0;

    return !hasTouches && hasChangedTouches ? changedTouches[0] : hasTouches ? touches[0] : nativeEvent;
  }
};

/**
 * We are extending the Flow 'Touch' declaration to enable using bracket
 * notation to access properties.
 * Without this adjustment Flow throws
 * "Indexable signature not found in Touch".
 * See https://github.com/facebook/flow/issues/1323
 */


/**
 * Number of pixels that are tolerated in between a `touchStart` and `touchEnd`
 * in order to still be considered a 'tap' event.
 */
var tapMoveThreshold = 10;
var startCoords = { x: 0, y: 0 };

var Axis = {
  x: { page: 'pageX', client: 'clientX', envScroll: 'currentPageScrollLeft' },
  y: { page: 'pageY', client: 'clientY', envScroll: 'currentPageScrollTop' }
};

function getAxisCoordOfEvent(axis, nativeEvent) {
  var singleTouch = TouchEventUtils.extractSingleTouch(nativeEvent);
  if (singleTouch) {
    return singleTouch[axis.page];
  }
  return axis.page in nativeEvent ? nativeEvent[axis.page] : nativeEvent[axis.client] + ViewportMetrics[axis.envScroll];
}

function getDistance(coords, nativeEvent) {
  var pageX = getAxisCoordOfEvent(Axis.x, nativeEvent);
  var pageY = getAxisCoordOfEvent(Axis.y, nativeEvent);
  return Math.pow(Math.pow(pageX - coords.x, 2) + Math.pow(pageY - coords.y, 2), 0.5);
}

var touchEvents = ['topTouchStart', 'topTouchCancel', 'topTouchEnd', 'topTouchMove'];

var dependencies = ['topMouseDown', 'topMouseMove', 'topMouseUp'].concat(touchEvents);

var eventTypes = {
  touchTap: {
    phasedRegistrationNames: {
      bubbled: 'onTouchTap',
      captured: 'onTouchTapCapture'
    },
    dependencies: dependencies
  }
};

var usedTouch = false;
var usedTouchTime = 0;
var TOUCH_DELAY = 1000;

var TapEventPlugin = {
  tapMoveThreshold: tapMoveThreshold,

  eventTypes: eventTypes,

  extractEvents: function (topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    if (!isStartish(topLevelType) && !isEndish(topLevelType)) {
      return null;
    }
    // on ios, there is a delay after touch event and synthetic
    // mouse events, so that user can perform double tap
    // solution: ignore mouse events following touchevent within small timeframe
    if (touchEvents.indexOf(topLevelType) !== -1) {
      usedTouch = true;
      usedTouchTime = Date.now();
    } else {
      if (usedTouch && Date.now() - usedTouchTime < TOUCH_DELAY) {
        return null;
      }
    }
    var event = null;
    var distance = getDistance(startCoords, nativeEvent);
    if (isEndish(topLevelType) && distance < tapMoveThreshold) {
      event = SyntheticUIEvent.getPooled(eventTypes.touchTap, targetInst, nativeEvent, nativeEventTarget);
    }
    if (isStartish(topLevelType)) {
      startCoords.x = getAxisCoordOfEvent(Axis.x, nativeEvent);
      startCoords.y = getAxisCoordOfEvent(Axis.y, nativeEvent);
    } else if (isEndish(topLevelType)) {
      startCoords.x = 0;
      startCoords.y = 0;
    }
    EventPropagators.accumulateTwoPhaseDispatches(event);
    return event;
  }
};

module.exports = TapEventPlugin;