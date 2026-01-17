/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./client/src/js/react-mountevents-emitter.js"
/*!****************************************************!*\
  !*** ./client/src/js/react-mountevents-emitter.js ***!
  \****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-dom */ "react-dom");
/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_dom__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var lib_Injector__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! lib/Injector */ "lib/Injector");
/* harmony import */ var lib_Injector__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(lib_Injector__WEBPACK_IMPORTED_MODULE_2__);
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
// Quite OK ref: https://docs.silverstripe.org/en/4/developer_guides/customising_the_admin_interface/reactjs_redux_and_graphql/#building-an-extensible-graphql-app
// And: https://docs.silverstripe.org/en/4/developer_guides/customising_the_admin_interface/reactjs_redux_and_graphql/#notes-app
// And: https://reactjs.org/docs/state-and-lifecycle.html




// react 'component' as function
// const FormWrapper = (Form) => (props) => {
//     window.simpler_dom.adminDOM_emit();
//     console.log('FORM EMITTING...');
//     return (
//         <Form {...props} />
//     );
// }

// react 'component' as class
var FormWrapper = function FormWrapper(Form) {
  return (
    /*#__PURE__*/
    // https://github.com/silverstripe/silverstripe-admin/blob/1/client/src/components/Form/Form.js
    function (_React$Component) {
      function FormWrapperItem() {
        _classCallCheck(this, FormWrapperItem);
        return _callSuper(this, FormWrapperItem, arguments);
      }
      _inherits(FormWrapperItem, _React$Component);
      return _createClass(FormWrapperItem, [{
        key: "componentDidMount",
        value: function componentDidMount() {
          this.browserDomEl = react_dom__WEBPACK_IMPORTED_MODULE_1___default().findDOMNode(this);
          // console.log('FORM MOUNT - EMITTING...', this.browserDomEl, Date.now());
          window.simpler_dom.emitInsert('mount', this.browserDomEl, 0);
        }
      }, {
        key: "componentWillUnmount",
        value: function componentWillUnmount() {
          // console.log('FORM UNMOUNT - EMITTING...', this.browserDomEl, Date.now());
          window.simpler_dom.emitRemove('unmount', this.browserDomEl, 0);
        }
      }, {
        key: "render",
        value: function render() {
          // console.log('FORM RENDER...', this.browserDomEl, Date.now());
          return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(Form, this.props);
        }
      }]);
    }((react__WEBPACK_IMPORTED_MODULE_0___default().Component))
  );
};

// Register this 'transformation' on the original Silverstripe Form 'component'
lib_Injector__WEBPACK_IMPORTED_MODULE_2___default().transform('simpler-form-mount-emitter', function (updater) {
  updater.component('Form', FormWrapper);
});

/***/ },

/***/ "./client/src/js/simpler-domevents-emulator.js"
/*!*****************************************************!*\
  !*** ./client/src/js/simpler-domevents-emulator.js ***!
  \*****************************************************/
() {

//
// 'Emulate' DOMContentLoaded events (named to DOMNodesInserted & DOMNodesRemoved) to init various JS listeners on ajax-inserted/react rendered DOMs
// event.detail.type values: LOAD (DOMContenLoaded), XHR (XHR requests to /admin), FETCH (requests to /admin), MOUNT/UNMOUNT (react component)
//
window.simpler_dom = {
  // Emit AdminContentChanged event only once per multiple triggers within 40ms
  insertEventDelay: 40,
  insertEventTimeout: null,
  emitInsert: function emitInsert(type, element, delay, loadedUrl) {
    // Ignore non-admin fetch/xhr events
    if (loadedUrl && loadedUrl.indexOf(ss.config.adminUrl) < 0) {
      // console.log('emitInsert IGNORING loadedUrl: "'+loadedUrl+'"');
      return;
    }

    // let event = new Event("DOMNodesInserted", { bubbles: true, cancelable: true, detail: { type: type.toUpperCase(), time: Date.now() } });
    var event = new CustomEvent("DOMNodesInserted", {
      bubbles: true,
      cancelable: true,
      detail: {
        type: type.toUpperCase(),
        time: Date.now()
      }
    });
    var eventDelay = typeof delay !== 'undefined' ? delay : window.simpler_dom.insertEventDelay;

    // 'group' multiple triggers and emit (on the specific element of the last trigger, or on document)
    if (eventDelay && !element) {
      // reset previous events/timeout still underway
      if (window.simpler_dom.insertEventTimeout) {
        clearTimeout(window.simpler_dom.insertEventTimeout);
      }
      // set new timeout
      window.simpler_dom.insertEventTimeout = setTimeout(function () {
        // console.log('EMITTING (DELAY, document): DOMNodesInserted');
        document.dispatchEvent(event);
      }, eventDelay);

      // emit directly, on specific element (or body):
    } else {
      // console.log('EMITTING (DIRECT, element): DOMNodesInserted', element);
      element && typeof element.dispatchEvent === 'function' ? element.dispatchEvent(event) : document.dispatchEvent(event);
    }
  },
  emitRemove: function emitRemove(type, element, delay) {
    // let event = new Event("DOMNodesRemoved", { bubbles: true, cancelable: true, detail: { type: type.toUpperCase(), time: Date.now() } });
    var event = new CustomEvent("DOMNodesRemoved", {
      bubbles: true,
      cancelable: true,
      detail: {
        type: type.toUpperCase(),
        time: Date.now()
      }
    });
    element && typeof element.dispatchEvent === 'function' ? element.dispatchEvent(event) : document.dispatchEvent(event);
  }
};

// IE9+ CustomEvent polyfill...
(function () {
  if (typeof window.CustomEvent === "function") return false;
  function CustomEvent(event, params) {
    params = params || {
      bubbles: false,
      cancelable: false,
      detail: null
    };
    var evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  }
  window.CustomEvent = CustomEvent;
})();

// Actually trigger some AdminDOMChanged events every now & then...
(function () {
  // // Dispatch events on XHR requests to allow hooking into as if regular DOMContentLoaded events were triggered
  // var origOpen = XMLHttpRequest.prototype.open;
  // XMLHttpRequest.prototype.open = function(method, url) {
  //     this.addEventListener('load', function() {
  //         // console.log('::XHR:: finished loading (admin)', method, url);
  //         simpler_dom.emitInsert('xhr', null, 100, url); // allow for 100ms DOM rendering time
  //     });
  //     // run original open callback & listeners
  //     origOpen.apply(this, arguments);
  // };

  // // jQuery XHR (not used much in CMS/Admin)
  // $( document ).ajaxComplete(function() {
  //     console.log('ajaxComplete');
  //     simpler_dom.emitInsert('xhr', null, 100, url); // allow for 100ms DOM rendering time
  // });

  // Use mutationobserver instead
  var observer = new MutationObserver(function (mutations) {
    simpler_dom.emitInsert('mutation', null, 100); // batch at 100ms
  });
  observer.observe(document, {
    childList: true,
    subtree: true
  });

  // // Try & do the same for Fetch requests (dispatch 'DOMContentLoaded' events, sadly doesn't catch *every* fetch request...)
  // const nativeFetch = window.fetch
  // window.fetch = async (input, options) => {
  //     // Set custom async handler
  //     let response = await nativeFetch(input, options);
  //         // .then(data => {
  //         //     console.log('::FETCH:: finished loading', input);
  //         //     simpler_dom.adminDOM_emit(input, 100);
  //         // });
  //     // slightly longer delay because we're actually in front of the callbacks being executed in case of fetch
  //     simpler_dom.emitInsert('fetch', null, 200, input);
  //     // return response to original caller
  //     return response;
  // }

  // // Fallback: event listener for clicks on buttons (poor solution but couldn't find a solid way to hook into *every* Fetch
  // document.addEventListener('click', function(e) {
  //     // loop parent nodes from the target to the delegation node
  //     for (var target = e.target; target && target !== this; target = target.parentNode) {
  //         if (target.matches('button, .btn')) {
  //             console.log('::BTN:: clicked');
  //             simpler_dom.emitInsert('btnclick');
  //             break;
  //         }
  //     }
  // }, false);

  // Dispatch an initial event on DOMContentLoaded;
  document.addEventListener('DOMContentLoaded', function () {
    simpler_dom.emitInsert('load', null, 0);
  });
})();

/***/ },

/***/ "./client/src/styles/simpler-silverstripe.scss"
/*!*****************************************************!*\
  !*** ./client/src/styles/simpler-silverstripe.scss ***!
  \*****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ },

/***/ "lib/Injector"
/*!***************************!*\
  !*** external "Injector" ***!
  \***************************/
(module) {

"use strict";
module.exports = Injector;

/***/ },

/***/ "react"
/*!************************!*\
  !*** external "React" ***!
  \************************/
(module) {

"use strict";
module.exports = React;

/***/ },

/***/ "react-dom"
/*!***************************!*\
  !*** external "ReactDom" ***!
  \***************************/
(module) {

"use strict";
module.exports = ReactDom;

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Check if module exists (development only)
/******/ 		if (__webpack_modules__[moduleId] === undefined) {
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"/js/simpler-domevents": 0,
/******/ 			"styles/simpler-silverstripe": 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunksimpler_silverstripe_package_json"] = self["webpackChunksimpler_silverstripe_package_json"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	__webpack_require__.O(undefined, ["styles/simpler-silverstripe"], () => (__webpack_require__("./client/src/js/simpler-domevents-emulator.js")))
/******/ 	__webpack_require__.O(undefined, ["styles/simpler-silverstripe"], () => (__webpack_require__("./client/src/js/react-mountevents-emitter.js")))
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["styles/simpler-silverstripe"], () => (__webpack_require__("./client/src/styles/simpler-silverstripe.scss")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;