/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("app/dashboard/layout",{

/***/ "(app-pages-browser)/./hooks/index.ts":
/*!************************!*\
  !*** ./hooks/index.ts ***!
  \************************/
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   useAddTag: function() { return /* reexport safe */ _usePanelHooks__WEBPACK_IMPORTED_MODULE_6__.useAddTag; },\n/* harmony export */   useAttachments: function() { return /* reexport safe */ _usePanelHooks__WEBPACK_IMPORTED_MODULE_6__.useAttachments; },\n/* harmony export */   useComments: function() { return /* reexport safe */ _useComments__WEBPACK_IMPORTED_MODULE_2__.useComments; },\n/* harmony export */   useCountdown: function() { return /* reexport safe */ _useCountdown__WEBPACK_IMPORTED_MODULE_4__.useCountdown; },\n/* harmony export */   useCreateComment: function() { return /* reexport safe */ _usePanelHooks__WEBPACK_IMPORTED_MODULE_6__.useCreateComment; },\n/* harmony export */   useExtendTaskETA: function() { return /* reexport safe */ _usePanelHooks__WEBPACK_IMPORTED_MODULE_6__.useExtendTaskETA; },\n/* harmony export */   useProfile: function() { return /* reexport safe */ _useProfile__WEBPACK_IMPORTED_MODULE_5__.useProfile; },\n/* harmony export */   useRemoveTag: function() { return /* reexport safe */ _usePanelHooks__WEBPACK_IMPORTED_MODULE_6__.useRemoveTag; },\n/* harmony export */   useSetTaskETA: function() { return /* reexport safe */ _usePanelHooks__WEBPACK_IMPORTED_MODULE_6__.useSetTaskETA; },\n/* harmony export */   useTags: function() { return /* reexport safe */ _usePanelHooks__WEBPACK_IMPORTED_MODULE_6__.useTags; },\n/* harmony export */   useTask: function() { return /* reexport safe */ _useTask__WEBPACK_IMPORTED_MODULE_1__.useTask; },\n/* harmony export */   useTaskAccountability: function() { return /* reexport safe */ _useTaskAccountability__WEBPACK_IMPORTED_MODULE_3__.useTaskAccountability; },\n/* harmony export */   useTaskActivity: function() { return /* reexport safe */ _usePanelHooks__WEBPACK_IMPORTED_MODULE_6__.useTaskActivity; },\n/* harmony export */   useTaskDiscussion: function() { return /* reexport safe */ _usePanelHooks__WEBPACK_IMPORTED_MODULE_6__.useTaskDiscussion; },\n/* harmony export */   useTasks: function() { return /* reexport safe */ _useTasks__WEBPACK_IMPORTED_MODULE_0__.useTasks; },\n/* harmony export */   useUpdateComment: function() { return /* reexport safe */ _usePanelHooks__WEBPACK_IMPORTED_MODULE_6__.useUpdateComment; }\n/* harmony export */ });\n/* harmony import */ var _useTasks__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./useTasks */ \"(app-pages-browser)/./hooks/useTasks.ts\");\n/* harmony import */ var _useTask__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./useTask */ \"(app-pages-browser)/./hooks/useTask.ts\");\n/* harmony import */ var _useComments__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./useComments */ \"(app-pages-browser)/./hooks/useComments.ts\");\n/* harmony import */ var _useTaskAccountability__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./useTaskAccountability */ \"(app-pages-browser)/./hooks/useTaskAccountability.ts\");\n/* harmony import */ var _useCountdown__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./useCountdown */ \"(app-pages-browser)/./hooks/useCountdown.ts\");\n/* harmony import */ var _useProfile__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./useProfile */ \"(app-pages-browser)/./hooks/useProfile.ts\");\n/* harmony import */ var _usePanelHooks__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./usePanelHooks */ \"(app-pages-browser)/./hooks/usePanelHooks.ts\");\n/* harmony import */ var _usePageLoading__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./usePageLoading */ \"(app-pages-browser)/./hooks/usePageLoading.ts\");\n/* harmony import */ var _usePageLoading__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_usePageLoading__WEBPACK_IMPORTED_MODULE_7__);\n/* harmony reexport (unknown) */ var __WEBPACK_REEXPORT_OBJECT__ = {};\n/* harmony reexport (unknown) */ for(var __WEBPACK_IMPORT_KEY__ in _usePageLoading__WEBPACK_IMPORTED_MODULE_7__) if([\"default\",\"useTasks\",\"useTask\",\"useComments\",\"useTaskAccountability\",\"useCountdown\",\"useProfile\",\"useAddTag\",\"useAttachments\",\"useCreateComment\",\"useExtendTaskETA\",\"useRemoveTag\",\"useSetTaskETA\",\"useTags\",\"useTaskActivity\",\"useTaskDiscussion\",\"useUpdateComment\"].indexOf(__WEBPACK_IMPORT_KEY__) < 0) __WEBPACK_REEXPORT_OBJECT__[__WEBPACK_IMPORT_KEY__] = function(key) { return _usePageLoading__WEBPACK_IMPORTED_MODULE_7__[key]; }.bind(0, __WEBPACK_IMPORT_KEY__)\n/* harmony reexport (unknown) */ __webpack_require__.d(__webpack_exports__, __WEBPACK_REEXPORT_OBJECT__);\n\n\n\n\n\n\n\n\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwcC1wYWdlcy1icm93c2VyKS8uL2hvb2tzL2luZGV4LnRzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBMkI7QUFDRDtBQUNJO0FBQ1U7QUFDVDtBQUNGO0FBQ0c7QUFDQyIsInNvdXJjZXMiOlsid2VicGFjazovL19OX0UvLi9ob29rcy9pbmRleC50cz81YjIxIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCAqIGZyb20gJy4vdXNlVGFza3MnO1xuZXhwb3J0ICogZnJvbSAnLi91c2VUYXNrJztcbmV4cG9ydCAqIGZyb20gJy4vdXNlQ29tbWVudHMnO1xuZXhwb3J0ICogZnJvbSAnLi91c2VUYXNrQWNjb3VudGFiaWxpdHknO1xuZXhwb3J0ICogZnJvbSAnLi91c2VDb3VudGRvd24nO1xuZXhwb3J0ICogZnJvbSAnLi91c2VQcm9maWxlJztcbmV4cG9ydCAqIGZyb20gJy4vdXNlUGFuZWxIb29rcyc7XG5leHBvcnQgKiBmcm9tICcuL3VzZVBhZ2VMb2FkaW5nJzsiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(app-pages-browser)/./hooks/index.ts\n"));

/***/ }),

/***/ "(app-pages-browser)/./hooks/usePageLoading.ts":
/*!*********************************!*\
  !*** ./hooks/usePageLoading.ts ***!
  \*********************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {



;
    // Wrapped in an IIFE to avoid polluting the global scope
    ;
    (function () {
        var _a, _b;
        // Legacy CSS implementations will `eval` browser code in a Node.js context
        // to extract CSS. For backwards compatibility, we need to check we're in a
        // browser context before continuing.
        if (typeof self !== 'undefined' &&
            // AMP / No-JS mode does not inject these helpers:
            '$RefreshHelpers$' in self) {
            // @ts-ignore __webpack_module__ is global
            var currentExports = module.exports;
            // @ts-ignore __webpack_module__ is global
            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;
            // This cannot happen in MainTemplate because the exports mismatch between
            // templating and execution.
            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);
            // A module can be accepted automatically based on its exports, e.g. when
            // it is a Refresh Boundary.
            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {
                // Save the previous exports signature on update so we can compare the boundary
                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)
                module.hot.dispose(function (data) {
                    data.prevSignature =
                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);
                });
                // Unconditionally accept an update to this module, we'll check if it's
                // still a Refresh Boundary later.
                // @ts-ignore importMeta is replaced in the loader
                module.hot.accept();
                // This field is set when the previous version of this module was a
                // Refresh Boundary, letting us know we need to check for invalidation or
                // enqueue an update.
                if (prevSignature !== null) {
                    // A boundary can become ineligible if its exports are incompatible
                    // with the previous exports.
                    //
                    // For example, if you add/remove/change exports, we'll want to
                    // re-execute the importing modules, and force those components to
                    // re-render. Similarly, if you convert a class component to a
                    // function, we want to invalidate the boundary.
                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {
                        module.hot.invalidate();
                    }
                    else {
                        self.$RefreshHelpers$.scheduleUpdate();
                    }
                }
            }
            else {
                // Since we just executed the code for the module, it's possible that the
                // new exports made it ineligible for being a boundary.
                // We only care about the case when we were _previously_ a boundary,
                // because we already accepted this update (accidental side effect).
                var isNoLongerABoundary = prevSignature !== null;
                if (isNoLongerABoundary) {
                    module.hot.invalidate();
                }
            }
        }
    })();


/***/ })

});