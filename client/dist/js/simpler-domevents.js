/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./client/src/js/react-mountevents-emitter.js":
/*!****************************************************!*\
  !*** ./client/src/js/react-mountevents-emitter.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-dom */ "react-dom");
/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react_dom__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var lib_Injector__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! lib/Injector */ "lib/Injector");
/* harmony import */ var lib_Injector__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(lib_Injector__WEBPACK_IMPORTED_MODULE_2__);
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

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
      _inherits(FormWrapperItem, _React$Component);

      var _super = _createSuper(FormWrapperItem);

      function FormWrapperItem() {
        _classCallCheck(this, FormWrapperItem);

        return _super.apply(this, arguments);
      }

      _createClass(FormWrapperItem, [{
        key: "componentDidMount",
        value: function componentDidMount() {
          this.browserDomEl = react_dom__WEBPACK_IMPORTED_MODULE_1___default().findDOMNode(this); // console.log('FORM MOUNT - EMITTING...', this.browserDomEl, Date.now());

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

      return FormWrapperItem;
    }((react__WEBPACK_IMPORTED_MODULE_0___default().Component))
  );
}; // Register this 'transformation' on the original Silverstripe Form 'component'


lib_Injector__WEBPACK_IMPORTED_MODULE_2___default().transform('simpler-form-mount-emitter', function (updater) {
  updater.component('Form', FormWrapper);
});

/***/ }),

/***/ "./client/src/js/simpler-domevents-emulator.js":
/*!*****************************************************!*\
  !*** ./client/src/js/simpler-domevents-emulator.js ***!
  \*****************************************************/
/***/ (() => {

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
    } // let event = new Event("DOMNodesInserted", { bubbles: true, cancelable: true, detail: { type: type.toUpperCase(), time: Date.now() } });


    var event = new CustomEvent("DOMNodesInserted", {
      bubbles: true,
      cancelable: true,
      detail: {
        type: type.toUpperCase(),
        time: Date.now()
      }
    });
    var eventDelay = typeof delay !== 'undefined' ? delay : window.simpler_dom.insertEventDelay; // 'group' multiple triggers and emit (on the specific element of the last trigger, or on document)

    if (eventDelay && !element) {
      // reset previous events/timeout still underway
      if (window.simpler_dom.insertEventTimeout) {
        clearTimeout(window.simpler_dom.insertEventTimeout);
      } // set new timeout


      window.simpler_dom.insertEventTimeout = setTimeout(function () {
        // console.log('EMITTING (DELAY, document): DOMNodesInserted');
        document.dispatchEvent(event);
      }, eventDelay); // emit directly, on specific element (or body):
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
}; // IE9+ CustomEvent polyfill...

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
})(); // Actually trigger some AdminDOMChanged events every now & then...


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
  }); // // Try & do the same for Fetch requests (dispatch 'DOMContentLoaded' events, sadly doesn't catch *every* fetch request...)
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

/***/ }),

/***/ "./client/src/styles/simpler-silverstripe.scss":
/*!*****************************************************!*\
  !*** ./client/src/styles/simpler-silverstripe.scss ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ }),

/***/ "lib/Injector":
/*!***************************!*\
  !*** external "Injector" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = Injector;

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "React" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = React;

/***/ }),

/***/ "react-dom":
/*!***************************!*\
  !*** external "ReactDom" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = ReactDom;

/***/ })

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
/******/ 					result = fn();
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
/******/ 			for(moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) var result = runtime(__webpack_require__);
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkIds[i]] = 0;
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