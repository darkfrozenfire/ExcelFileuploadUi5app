/*global QUnit*/

sap.ui.define([
	"vendornamespace/productionplanning/controller/SearchVendorView1.controller"
], function (Controller) {
	"use strict";

	QUnit.module("SearchVendorView1 Controller");

	QUnit.test("I should test the SearchVendorView1 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
