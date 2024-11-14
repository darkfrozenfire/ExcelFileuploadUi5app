sap.ui.define([
    "sap/ui/base/ManagedObject"
], function (ManagedObject) {
    "use strict";

    return ManagedObject.extend("vendornamespace.productionplanning.mycustomlibrary.exceluploader", {
        loadXLSX: function () {
            return new Promise(function (resolve, reject) {
                sap.ui.require(["vendornamespace/productionplanning/mycustomlibrary/xlsx.full.min"], function (XLSX) {
                    if (XLSX) {
                        resolve(XLSX);
                    } else {
                        // If XLSX is undefined, check if it's available in the global scope
                        if (window.XLSX) {
                            resolve(window.XLSX);
                        } else {
                            reject(new Error("XLSX is undefined in both require and global scope"));
                        }
                    }
                }, function (error) {
                    console.error("Failed to load XLSX library:", error);
                    reject(error);
                });
            });
        }
    });
});
