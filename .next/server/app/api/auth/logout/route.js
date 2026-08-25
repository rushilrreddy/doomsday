"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/auth/logout/route";
exports.ids = ["app/api/auth/logout/route"];
exports.modules = {

/***/ "../../client/components/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/client/components/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/action-async-storage.external.js");

/***/ }),

/***/ "../../client/components/request-async-storage.external":
/*!********************************************************************************!*\
  !*** external "next/dist/client/components/request-async-storage.external.js" ***!
  \********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/request-async-storage.external.js");

/***/ }),

/***/ "../../client/components/static-generation-async-storage.external":
/*!******************************************************************************************!*\
  !*** external "next/dist/client/components/static-generation-async-storage.external.js" ***!
  \******************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/static-generation-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "node:buffer":
/*!******************************!*\
  !*** external "node:buffer" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("node:buffer");

/***/ }),

/***/ "node:crypto":
/*!******************************!*\
  !*** external "node:crypto" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("node:crypto");

/***/ }),

/***/ "node:util":
/*!****************************!*\
  !*** external "node:util" ***!
  \****************************/
/***/ ((module) => {

module.exports = require("node:util");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2Flogout%2Froute&page=%2Fapi%2Fauth%2Flogout%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2Flogout%2Froute.ts&appDir=C%3A%5CUsers%5Cravir%5Cprep%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cravir%5Cprep&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2Flogout%2Froute&page=%2Fapi%2Fauth%2Flogout%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2Flogout%2Froute.ts&appDir=C%3A%5CUsers%5Cravir%5Cprep%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cravir%5Cprep&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Users_ravir_prep_src_app_api_auth_logout_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/auth/logout/route.ts */ \"(rsc)/./src/app/api/auth/logout/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/auth/logout/route\",\n        pathname: \"/api/auth/logout\",\n        filename: \"route\",\n        bundlePath: \"app/api/auth/logout/route\"\n    },\n    resolvedPagePath: \"C:\\\\Users\\\\ravir\\\\prep\\\\src\\\\app\\\\api\\\\auth\\\\logout\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_Users_ravir_prep_src_app_api_auth_logout_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/auth/logout/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZhdXRoJTJGbG9nb3V0JTJGcm91dGUmcGFnZT0lMkZhcGklMkZhdXRoJTJGbG9nb3V0JTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGYXV0aCUyRmxvZ291dCUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDVXNlcnMlNUNyYXZpciU1Q3ByZXAlNUNzcmMlNUNhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPUMlM0ElNUNVc2VycyU1Q3JhdmlyJTVDcHJlcCZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQXNHO0FBQ3ZDO0FBQ2M7QUFDYTtBQUMxRjtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsZ0hBQW1CO0FBQzNDO0FBQ0EsY0FBYyx5RUFBUztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsWUFBWTtBQUNaLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxRQUFRLGlFQUFpRTtBQUN6RTtBQUNBO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ3VIOztBQUV2SCIsInNvdXJjZXMiOlsid2VicGFjazovL2NvdW50ZG93bi1jcmV3Lz85OWFjIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9mdXR1cmUvcm91dGUtbW9kdWxlcy9hcHAtcm91dGUvbW9kdWxlLmNvbXBpbGVkXCI7XG5pbXBvcnQgeyBSb3V0ZUtpbmQgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9mdXR1cmUvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIkM6XFxcXFVzZXJzXFxcXHJhdmlyXFxcXHByZXBcXFxcc3JjXFxcXGFwcFxcXFxhcGlcXFxcYXV0aFxcXFxsb2dvdXRcXFxccm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwiXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL2F1dGgvbG9nb3V0L3JvdXRlXCIsXG4gICAgICAgIHBhdGhuYW1lOiBcIi9hcGkvYXV0aC9sb2dvdXRcIixcbiAgICAgICAgZmlsZW5hbWU6IFwicm91dGVcIixcbiAgICAgICAgYnVuZGxlUGF0aDogXCJhcHAvYXBpL2F1dGgvbG9nb3V0L3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiQzpcXFxcVXNlcnNcXFxccmF2aXJcXFxccHJlcFxcXFxzcmNcXFxcYXBwXFxcXGFwaVxcXFxhdXRoXFxcXGxvZ291dFxcXFxyb3V0ZS50c1wiLFxuICAgIG5leHRDb25maWdPdXRwdXQsXG4gICAgdXNlcmxhbmRcbn0pO1xuLy8gUHVsbCBvdXQgdGhlIGV4cG9ydHMgdGhhdCB3ZSBuZWVkIHRvIGV4cG9zZSBmcm9tIHRoZSBtb2R1bGUuIFRoaXMgc2hvdWxkXG4vLyBiZSBlbGltaW5hdGVkIHdoZW4gd2UndmUgbW92ZWQgdGhlIG90aGVyIHJvdXRlcyB0byB0aGUgbmV3IGZvcm1hdC4gVGhlc2Vcbi8vIGFyZSB1c2VkIHRvIGhvb2sgaW50byB0aGUgcm91dGUuXG5jb25zdCB7IHJlcXVlc3RBc3luY1N0b3JhZ2UsIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmNvbnN0IG9yaWdpbmFsUGF0aG5hbWUgPSBcIi9hcGkvYXV0aC9sb2dvdXQvcm91dGVcIjtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgc2VydmVySG9va3MsXG4gICAgICAgIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgb3JpZ2luYWxQYXRobmFtZSwgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2Flogout%2Froute&page=%2Fapi%2Fauth%2Flogout%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2Flogout%2Froute.ts&appDir=C%3A%5CUsers%5Cravir%5Cprep%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cravir%5Cprep&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./src/app/api/auth/logout/route.ts":
/*!******************************************!*\
  !*** ./src/app/api/auth/logout/route.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   POST: () => (/* binding */ POST)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _lib_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/auth */ \"(rsc)/./src/lib/auth.ts\");\n\n\nasync function POST() {\n    await (0,_lib_auth__WEBPACK_IMPORTED_MODULE_1__.clearSessionCookie)();\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        success: true\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9hdXRoL2xvZ291dC9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBMkM7QUFDSztBQUV6QyxlQUFlRTtJQUNwQixNQUFNRCw2REFBa0JBO0lBQ3hCLE9BQU9ELHFEQUFZQSxDQUFDRyxJQUFJLENBQUM7UUFBRUMsU0FBUztJQUFLO0FBQzNDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vY291bnRkb3duLWNyZXcvLi9zcmMvYXBwL2FwaS9hdXRoL2xvZ291dC9yb3V0ZS50cz9kMjY3Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5leHRSZXNwb25zZSB9IGZyb20gXCJuZXh0L3NlcnZlclwiO1xuaW1wb3J0IHsgY2xlYXJTZXNzaW9uQ29va2llIH0gZnJvbSBcIkAvbGliL2F1dGhcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIFBPU1QoKSB7XG4gIGF3YWl0IGNsZWFyU2Vzc2lvbkNvb2tpZSgpO1xuICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBzdWNjZXNzOiB0cnVlIH0pO1xufVxuIl0sIm5hbWVzIjpbIk5leHRSZXNwb25zZSIsImNsZWFyU2Vzc2lvbkNvb2tpZSIsIlBPU1QiLCJqc29uIiwic3VjY2VzcyJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/auth/logout/route.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/auth.ts":
/*!*************************!*\
  !*** ./src/lib/auth.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   clearSessionCookie: () => (/* binding */ clearSessionCookie),\n/* harmony export */   createSessionToken: () => (/* binding */ createSessionToken),\n/* harmony export */   getSession: () => (/* binding */ getSession),\n/* harmony export */   hashPassword: () => (/* binding */ hashPassword),\n/* harmony export */   setSessionCookie: () => (/* binding */ setSessionCookie),\n/* harmony export */   verifyPassword: () => (/* binding */ verifyPassword),\n/* harmony export */   verifySessionToken: () => (/* binding */ verifySessionToken)\n/* harmony export */ });\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! bcryptjs */ \"(rsc)/./node_modules/bcryptjs/index.js\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(bcryptjs__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var jose__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! jose */ \"(rsc)/./node_modules/jose/dist/node/esm/jwt/sign.js\");\n/* harmony import */ var jose__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! jose */ \"(rsc)/./node_modules/jose/dist/node/esm/jwt/verify.js\");\n/* harmony import */ var next_headers__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/headers */ \"(rsc)/./node_modules/next/dist/api/headers.js\");\n\n\n\nconst JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || \"countdown-crew-secret-jwt-key-2026-super-secure\");\nconst COOKIE_NAME = \"crew_session\";\nasync function hashPassword(password) {\n    const salt = await bcryptjs__WEBPACK_IMPORTED_MODULE_0___default().genSalt(10);\n    return bcryptjs__WEBPACK_IMPORTED_MODULE_0___default().hash(password, salt);\n}\nasync function verifyPassword(password, hash) {\n    return bcryptjs__WEBPACK_IMPORTED_MODULE_0___default().compare(password, hash);\n}\nasync function createSessionToken(payload) {\n    return new jose__WEBPACK_IMPORTED_MODULE_2__.SignJWT({\n        ...payload\n    }).setProtectedHeader({\n        alg: \"HS256\"\n    }).setIssuedAt().setExpirationTime(\"30d\").sign(JWT_SECRET);\n}\nasync function verifySessionToken(token) {\n    try {\n        const { payload } = await (0,jose__WEBPACK_IMPORTED_MODULE_3__.jwtVerify)(token, JWT_SECRET);\n        return payload;\n    } catch  {\n        return null;\n    }\n}\nasync function getSession() {\n    const cookieStore = (0,next_headers__WEBPACK_IMPORTED_MODULE_1__.cookies)();\n    const token = cookieStore.get(COOKIE_NAME)?.value;\n    if (!token) return null;\n    return verifySessionToken(token);\n}\nasync function setSessionCookie(token) {\n    const cookieStore = (0,next_headers__WEBPACK_IMPORTED_MODULE_1__.cookies)();\n    cookieStore.set(COOKIE_NAME, token, {\n        httpOnly: true,\n        secure: \"development\" === \"production\",\n        sameSite: \"lax\",\n        maxAge: 30 * 24 * 60 * 60,\n        path: \"/\"\n    });\n}\nasync function clearSessionCookie() {\n    const cookieStore = (0,next_headers__WEBPACK_IMPORTED_MODULE_1__.cookies)();\n    cookieStore.set(COOKIE_NAME, \"\", {\n        httpOnly: true,\n        secure: \"development\" === \"production\",\n        sameSite: \"lax\",\n        maxAge: 0,\n        path: \"/\"\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL2F1dGgudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQThCO0FBQ1k7QUFDSDtBQUd2QyxNQUFNSSxhQUFhLElBQUlDLGNBQWNDLE1BQU0sQ0FDekNDLFFBQVFDLEdBQUcsQ0FBQ0osVUFBVSxJQUFJO0FBRTVCLE1BQU1LLGNBQWM7QUFFYixlQUFlQyxhQUFhQyxRQUFnQjtJQUNqRCxNQUFNQyxPQUFPLE1BQU1aLHVEQUFjLENBQUM7SUFDbEMsT0FBT0Esb0RBQVcsQ0FBQ1csVUFBVUM7QUFDL0I7QUFFTyxlQUFlRyxlQUFlSixRQUFnQixFQUFFRyxJQUFZO0lBQ2pFLE9BQU9kLHVEQUFjLENBQUNXLFVBQVVHO0FBQ2xDO0FBRU8sZUFBZUcsbUJBQW1CQyxPQUFvQztJQUMzRSxPQUFPLElBQUlqQix5Q0FBT0EsQ0FBQztRQUFFLEdBQUdpQixPQUFPO0lBQUMsR0FDN0JDLGtCQUFrQixDQUFDO1FBQUVDLEtBQUs7SUFBUSxHQUNsQ0MsV0FBVyxHQUNYQyxpQkFBaUIsQ0FBQyxPQUNsQkMsSUFBSSxDQUFDbkI7QUFDVjtBQUVPLGVBQWVvQixtQkFBbUJDLEtBQWE7SUFDcEQsSUFBSTtRQUNGLE1BQU0sRUFBRVAsT0FBTyxFQUFFLEdBQUcsTUFBTWhCLCtDQUFTQSxDQUFDdUIsT0FBT3JCO1FBQzNDLE9BQU9jO0lBQ1QsRUFBRSxPQUFNO1FBQ04sT0FBTztJQUNUO0FBQ0Y7QUFFTyxlQUFlUTtJQUNwQixNQUFNQyxjQUFjeEIscURBQU9BO0lBQzNCLE1BQU1zQixRQUFRRSxZQUFZQyxHQUFHLENBQUNuQixjQUFjb0I7SUFDNUMsSUFBSSxDQUFDSixPQUFPLE9BQU87SUFDbkIsT0FBT0QsbUJBQW1CQztBQUM1QjtBQUVPLGVBQWVLLGlCQUFpQkwsS0FBYTtJQUNsRCxNQUFNRSxjQUFjeEIscURBQU9BO0lBQzNCd0IsWUFBWUksR0FBRyxDQUFDdEIsYUFBYWdCLE9BQU87UUFDbENPLFVBQVU7UUFDVkMsUUFBUTFCLGtCQUF5QjtRQUNqQzJCLFVBQVU7UUFDVkMsUUFBUSxLQUFLLEtBQUssS0FBSztRQUN2QkMsTUFBTTtJQUNSO0FBQ0Y7QUFFTyxlQUFlQztJQUNwQixNQUFNVixjQUFjeEIscURBQU9BO0lBQzNCd0IsWUFBWUksR0FBRyxDQUFDdEIsYUFBYSxJQUFJO1FBQy9CdUIsVUFBVTtRQUNWQyxRQUFRMUIsa0JBQXlCO1FBQ2pDMkIsVUFBVTtRQUNWQyxRQUFRO1FBQ1JDLE1BQU07SUFDUjtBQUNGIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vY291bnRkb3duLWNyZXcvLi9zcmMvbGliL2F1dGgudHM/NjY5MiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYmNyeXB0IGZyb20gXCJiY3J5cHRqc1wiO1xuaW1wb3J0IHsgU2lnbkpXVCwgand0VmVyaWZ5IH0gZnJvbSBcImpvc2VcIjtcbmltcG9ydCB7IGNvb2tpZXMgfSBmcm9tIFwibmV4dC9oZWFkZXJzXCI7XG5pbXBvcnQgeyBTZXNzaW9uUGF5bG9hZCB9IGZyb20gXCIuL3R5cGVzXCI7XG5cbmNvbnN0IEpXVF9TRUNSRVQgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXG4gIHByb2Nlc3MuZW52LkpXVF9TRUNSRVQgfHwgXCJjb3VudGRvd24tY3Jldy1zZWNyZXQtand0LWtleS0yMDI2LXN1cGVyLXNlY3VyZVwiXG4pO1xuY29uc3QgQ09PS0lFX05BTUUgPSBcImNyZXdfc2Vzc2lvblwiO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFzaFBhc3N3b3JkKHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCBzYWx0ID0gYXdhaXQgYmNyeXB0LmdlblNhbHQoMTApO1xuICByZXR1cm4gYmNyeXB0Lmhhc2gocGFzc3dvcmQsIHNhbHQpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdmVyaWZ5UGFzc3dvcmQocGFzc3dvcmQ6IHN0cmluZywgaGFzaDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIHJldHVybiBiY3J5cHQuY29tcGFyZShwYXNzd29yZCwgaGFzaCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVTZXNzaW9uVG9rZW4ocGF5bG9hZDogT21pdDxTZXNzaW9uUGF5bG9hZCwgXCJleHBcIj4pOiBQcm9taXNlPHN0cmluZz4ge1xuICByZXR1cm4gbmV3IFNpZ25KV1QoeyAuLi5wYXlsb2FkIH0pXG4gICAgLnNldFByb3RlY3RlZEhlYWRlcih7IGFsZzogXCJIUzI1NlwiIH0pXG4gICAgLnNldElzc3VlZEF0KClcbiAgICAuc2V0RXhwaXJhdGlvblRpbWUoXCIzMGRcIilcbiAgICAuc2lnbihKV1RfU0VDUkVUKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHZlcmlmeVNlc3Npb25Ub2tlbih0b2tlbjogc3RyaW5nKTogUHJvbWlzZTxTZXNzaW9uUGF5bG9hZCB8IG51bGw+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB7IHBheWxvYWQgfSA9IGF3YWl0IGp3dFZlcmlmeSh0b2tlbiwgSldUX1NFQ1JFVCk7XG4gICAgcmV0dXJuIHBheWxvYWQgYXMgdW5rbm93biBhcyBTZXNzaW9uUGF5bG9hZDtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFNlc3Npb24oKTogUHJvbWlzZTxTZXNzaW9uUGF5bG9hZCB8IG51bGw+IHtcbiAgY29uc3QgY29va2llU3RvcmUgPSBjb29raWVzKCk7XG4gIGNvbnN0IHRva2VuID0gY29va2llU3RvcmUuZ2V0KENPT0tJRV9OQU1FKT8udmFsdWU7XG4gIGlmICghdG9rZW4pIHJldHVybiBudWxsO1xuICByZXR1cm4gdmVyaWZ5U2Vzc2lvblRva2VuKHRva2VuKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldFNlc3Npb25Db29raWUodG9rZW46IHN0cmluZykge1xuICBjb25zdCBjb29raWVTdG9yZSA9IGNvb2tpZXMoKTtcbiAgY29va2llU3RvcmUuc2V0KENPT0tJRV9OQU1FLCB0b2tlbiwge1xuICAgIGh0dHBPbmx5OiB0cnVlLFxuICAgIHNlY3VyZTogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09IFwicHJvZHVjdGlvblwiLFxuICAgIHNhbWVTaXRlOiBcImxheFwiLFxuICAgIG1heEFnZTogMzAgKiAyNCAqIDYwICogNjAsIC8vIDMwIGRheXNcbiAgICBwYXRoOiBcIi9cIixcbiAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbGVhclNlc3Npb25Db29raWUoKSB7XG4gIGNvbnN0IGNvb2tpZVN0b3JlID0gY29va2llcygpO1xuICBjb29raWVTdG9yZS5zZXQoQ09PS0lFX05BTUUsIFwiXCIsIHtcbiAgICBodHRwT25seTogdHJ1ZSxcbiAgICBzZWN1cmU6IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSBcInByb2R1Y3Rpb25cIixcbiAgICBzYW1lU2l0ZTogXCJsYXhcIixcbiAgICBtYXhBZ2U6IDAsXG4gICAgcGF0aDogXCIvXCIsXG4gIH0pO1xufVxuIl0sIm5hbWVzIjpbImJjcnlwdCIsIlNpZ25KV1QiLCJqd3RWZXJpZnkiLCJjb29raWVzIiwiSldUX1NFQ1JFVCIsIlRleHRFbmNvZGVyIiwiZW5jb2RlIiwicHJvY2VzcyIsImVudiIsIkNPT0tJRV9OQU1FIiwiaGFzaFBhc3N3b3JkIiwicGFzc3dvcmQiLCJzYWx0IiwiZ2VuU2FsdCIsImhhc2giLCJ2ZXJpZnlQYXNzd29yZCIsImNvbXBhcmUiLCJjcmVhdGVTZXNzaW9uVG9rZW4iLCJwYXlsb2FkIiwic2V0UHJvdGVjdGVkSGVhZGVyIiwiYWxnIiwic2V0SXNzdWVkQXQiLCJzZXRFeHBpcmF0aW9uVGltZSIsInNpZ24iLCJ2ZXJpZnlTZXNzaW9uVG9rZW4iLCJ0b2tlbiIsImdldFNlc3Npb24iLCJjb29raWVTdG9yZSIsImdldCIsInZhbHVlIiwic2V0U2Vzc2lvbkNvb2tpZSIsInNldCIsImh0dHBPbmx5Iiwic2VjdXJlIiwic2FtZVNpdGUiLCJtYXhBZ2UiLCJwYXRoIiwiY2xlYXJTZXNzaW9uQ29va2llIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/auth.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/bcryptjs","vendor-chunks/jose"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2Flogout%2Froute&page=%2Fapi%2Fauth%2Flogout%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2Flogout%2Froute.ts&appDir=C%3A%5CUsers%5Cravir%5Cprep%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cravir%5Cprep&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();