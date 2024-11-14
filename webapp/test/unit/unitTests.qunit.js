/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"vendornamespace/productionplanning/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
