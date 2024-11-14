sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/UIComponent",
    "sap/ui/core/Fragment",
     "sap/ui/core/library"
], function (Controller, JSONModel, MessageToast, UIComponent, Fragment, coreLibrary) {
    "use strict";

    return Controller.extend("vendornamespace.productionplanning.controller.DisplayVendor", {
        _oEditDialog: undefined,
        _pageSize: 8, // Number of records per page for pagination

        onInit: function () {
            const oRouter = UIComponent.getRouterFor(this);
            oRouter.getRoute("RouteDisplayVendor").attachPatternMatched(this._onObjectMatched, this);
        },

        _onObjectMatched: function (oEvent) {
            const encodedFormData = oEvent.getParameter("arguments").formData;

            if (encodedFormData) {
                try {
                    const decodedFormData = JSON.parse(atob(encodedFormData));

                    const vendorData = {          
                        vendors: [{
                            fullName: decodedFormData.fullName,
                            email: decodedFormData.email,
                            phoneNumber: decodedFormData.phoneNumber,
                            dob: decodedFormData.dob,
                            editable: false // Default editable state
                        }],
                        uploadedData: [], 
                        pagedUploadedData: [],
                        currentPage: 1,
                        totalPages: 1,
                        isPrevEnabled: false,
                        isNextEnabled: false
                    };

                    if (decodedFormData.uploadedData) {
                        const uploadedData = JSON.parse(decodedFormData.uploadedData);
                        const headers = uploadedData[0]; // Get the headers
                        const dataRows = uploadedData.slice(1); // Get data rows
                        dataRows.forEach(row => {
                            const rowData = {};
                            headers.forEach((header, index) => {
                                rowData[header.toLowerCase().replace(/ /g, "")] = row[index]; // Format keys to lowercase without spaces
                            });
                            vendorData.uploadedData.push(rowData); // Add to uploadedData
                        });
                        console.log("Uploaded Excel Data: ", vendorData.uploadedData);
                    }

                    const oModel = new JSONModel(vendorData);
                    this.getView().setModel(oModel, "vendorListModel");
                    console.log("Model Data After Setting: ", oModel.getData());

                    // Initialize Pagination for uploadedData
                    this._initializePagination();
                } catch (error) {
                    console.error("Error decoding formData: ", error);
                    MessageToast.show("Failed to load vendor data.");
                }
            } else {
                console.warn("No formData found in route arguments.");
                MessageToast.show("No vendor data provided.");
            }
        },

        _initializePagination: function () {
            const oModel = this.getView().getModel("vendorListModel");
            const uploadedData = oModel.getProperty("/uploadedData");
            const totalPages = Math.ceil(uploadedData.length / this._pageSize);
            oModel.setProperty("/totalPages", totalPages);
            oModel.setProperty("/currentPage", 1);
            this._updatePageData();
        },

        onPageSizeChange: function (oEvent) {
            const sNewPageSize = oEvent.getParameter("value");
            const iNewPageSize = parseInt(sNewPageSize, 10);
        
            if (!isNaN(iNewPageSize) && iNewPageSize > 0) {
                this._pageSize = iNewPageSize; // Update the page size
                this._initializePagination(); // Re-initialize pagination with the new page size
            } else {
                MessageToast.show("Please enter a valid number for page size.");
            }
        },
        _updatePageData: function () {
            const oModel = this.getView().getModel("vendorListModel");
            const currentPage = oModel.getProperty("/currentPage");
            const uploadedData = oModel.getProperty("/uploadedData");
        
            const startIndex = (currentPage - 1) * this._pageSize;
            const endIndex = startIndex + this._pageSize;
            const pagedData = uploadedData.slice(startIndex, endIndex);
        
            oModel.setProperty("/pagedUploadedData", pagedData);
        
            const totalPages = oModel.getProperty("/totalPages");
            oModel.setProperty("/isPrevEnabled", currentPage > 1);
            oModel.setProperty("/isNextEnabled", currentPage < totalPages);
        },
        
     // Triggered when edit button is pressed
     onEditPress: function (oEvent) {
        const oView = this.getView();
        const oContext = oEvent.getSource().getBindingContext("vendorListModel");

        if (!this._oEditDialog) {
            Fragment.load({
                name: "vendornamespace.productionplanning.view.EditVendorDialog",
                controller: this
            }).then((oDialog) => {
                this._oEditDialog = oDialog;
                oView.addDependent(this._oEditDialog);
                this._bindDialog(oContext);
                this._oEditDialog.open();
            });
        } else {
            this._bindDialog(oContext);
            this._oEditDialog.open();
        }
    },

    _bindDialog: function (oContext) {
        this._oEditDialog.bindElement({
            path: oContext.getPath(),
            model: "vendorListModel"
        });
    },
     
    _validateInputs: function () {
        const oDialog = this._oEditDialog;
        const aContent = oDialog.getContent()[0].getItems(); 
        const oFullNameInput = aContent[1];
        const oEmailInput = aContent[3];
        const oPhoneInput = aContent[5];
        const oDobInput = aContent[7];
    
        let bValidationError = false; 
    
        // Validate Full Name
        if (!oFullNameInput.getValue()) {
            oFullNameInput.setValueState("Error");
            MessageToast.show("Full name is required.");
            bValidationError = true;
        } else {
            oFullNameInput.setValueState("None");
        }
    
        // Validate Email
        const sEmail = oEmailInput.getValue();
        const oEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!sEmail) {
            oEmailInput.setValueState("Error");
            MessageToast.show("Email is required.");
            bValidationError = true;
        } else if (!oEmailRegex.test(sEmail)) {
            oEmailInput.setValueState("Error");
            MessageToast.show("Invalid email format.");
            bValidationError = true;
        } else {
            oEmailInput.setValueState("None");
        }
    
        // Validate Phone Number
        const sPhoneNumber = oPhoneInput.getValue();
        const oPhoneRegex = /^[0-9]+$/;
        if (!sPhoneNumber) {
            oPhoneInput.setValueState("Error");
            MessageToast.show("Phone number is required.");
            bValidationError = true;
        } else if (!oPhoneRegex.test(sPhoneNumber)) {
            oPhoneInput.setValueState("Error");
            MessageToast.show("Phone number must contain only digits.");
            bValidationError = true;
        } else {
            oPhoneInput.setValueState("None");
        }
        return !bValidationError; // Returns true if no validation errors
    },
    
    
    onSavePress: function () {
        // Validate inputs
        const isValid = this._validateInputs();
        console.log("Is Valid Before Update: ", isValid);
    
        // Check validation status and exit if not valid
        if (!isValid) {
            console.log("Validation failed. No updates will occur.");
            MessageToast.show("Please correct the errors before saving.");
            return; // Make sure to exit early
        }
    
        // Proceed with updates since validation has passed
        console.log("Validation passed. Proceeding with update...");
    
        // Access vendor data and proceed to update
        const oVendorData = this._oEditDialog.getBindingContext("vendorListModel").getObject();
        const oModel = this.getView().getModel("vendorListModel");
    
        // Accessing dialog content items
        const aContent = this._oEditDialog.getContent()[0].getItems();
        console.log("Updating vendor data with:", {
            fullName: aContent[1].getValue(),
            email: aContent[3].getValue(),
            phoneNumber: aContent[5].getValue(),
            dob: aContent[7].getDateValue()
        });
    
        // Update properties in the model
        const vendorPath = this._oEditDialog.getBindingContext("vendorListModel").getPath();
        oModel.setProperty(`${vendorPath}/fullName`, aContent[1].getValue());
        oModel.setProperty(`${vendorPath}/email`, aContent[3].getValue());
        oModel.setProperty(`${vendorPath}/phoneNumber`, aContent[5].getValue());
        oModel.setProperty(`${vendorPath}/dob`, aContent[7].getDateValue());
    
        // Close the dialog and show success message
        this._oEditDialog.close();
        MessageToast.show("Vendor details updated successfully.");
    },
    
    onCancelPress: function () {
        this._oEditDialog.close();
    },

    onDialogClose: function () {
        if (this._oEditDialog) {
            this._oEditDialog.destroy(); // Optional cleanup
            this._oEditDialog = undefined; // Reset the dialog reference
        }
    },
//===============================================================
//select and deselect all 
onSelectAllPress: function () {
    const oModel = this.getView().getModel("vendorListModel");
    const pagedData = oModel.getProperty("/pagedUploadedData");

    // Set all items to selected
    pagedData.forEach(item => {
        item.editable = true; // Assuming 'editable' is the property bound to the CheckBox
    });

    // Update the model with the modified data
    oModel.setProperty("/pagedUploadedData", pagedData);
},

onDeselectAllPress: function () {
    const oModel = this.getView().getModel("vendorListModel");
    const pagedData = oModel.getProperty("/pagedUploadedData");

    // Set all items to unselected
    pagedData.forEach(item => {
        item.editable = false; // Assuming 'editable' is the property bound to the CheckBox
    });

    // Update the model with the modified data
    oModel.setProperty("/pagedUploadedData", pagedData);
},
//====================================================================
//get selected data proceed for further actions 
onSaveChangesPress: function () {
    const oModel = this.getView().getModel("vendorListModel");
    const pagedData = oModel.getProperty("/pagedUploadedData");
    
    // Collect selected data
    const selectedData = pagedData.filter(item => item.editable);
    
    // Log selected data to console
    console.log("Selected Vendor Data:", selectedData);

    // Optionally, add any additional logic for saving data
    MessageToast.show("Selected vendor data logged to console.");
},


//=====================================================================
        // Pagination Controls
        onFirstPress: function () {
            const oModel = this.getView().getModel("vendorListModel");
            oModel.setProperty("/currentPage", 1);
            this._updatePageData();
        },

        onPreviousPress: function () {
            const oModel = this.getView().getModel("vendorListModel");
            const currentPage = oModel.getProperty("/currentPage");
            if (currentPage > 1) {
                oModel.setProperty("/currentPage", currentPage - 1);
                this._updatePageData();
            }
        },

        onNextPress: function () {
            const oModel = this.getView().getModel("vendorListModel");
            const currentPage = oModel.getProperty("/currentPage");
            const totalPages = oModel.getProperty("/totalPages");
            if (currentPage < totalPages) {
                oModel.setProperty("/currentPage", currentPage + 1);
                this._updatePageData();
            }
        },

        onLastPress: function () {
            const oModel = this.getView().getModel("vendorListModel");
            const totalPages = oModel.getProperty("/totalPages");
            oModel.setProperty("/currentPage", totalPages);
            this._updatePageData();
        },

        onPageInputChange: function (oEvent) {
            const sNewPage = oEvent.getParameter("value");
            const oModel = this.getView().getModel("vendorListModel");
            const iTotalPages = oModel.getProperty("/totalPages");

            if (sNewPage && sNewPage > 0 && sNewPage <= iTotalPages) {
                oModel.setProperty("/currentPage", parseInt(sNewPage, 10));
                this._updatePageData();
            } else {
                MessageToast.show("Invalid page number");
            }
        }
    });
});


