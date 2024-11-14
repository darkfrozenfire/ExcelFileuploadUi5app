sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/UIComponent",
    "sap/ui/unified/FileUploader",
    "sap/ui/model/json/JSONModel",
    "vendornamespace/productionplanning/mycustomlibrary/exceluploader"
], function (Controller, MessageToast, UIComponent, FileUploader, JSONModel, ExcelUploader) {
    "use strict";

    return Controller.extend("vendornamespace.productionplanning.controller.SearchVendorView1", {
        onInit: function () {
            this.excelUploader = new ExcelUploader();
            this.excelUploader.loadXLSX().then(function (XLSX) {
                console.log("XLSX is loaded ", XLSX); // Log XLSX object
                this.XLSX = XLSX; // Store XLSX for later use
            }.bind(this)).catch(function (error) {
                console.error("Error loading XLSX library:", error);
            });
        },

        // Handle Excel file upload
        onFileUpload: function (oEvent) {
            const oFileUploader = oEvent.getSource(); // Get the source of the event (FileUploader)
            
            // Get the selected file directly from the event
            const files = oEvent.getParameter("files"); // Access the files parameter
            const file = files.length > 0 ? files[0] : null; // Check if files exist and get the first one
             
            // Check if the file is null or undefined
            if (!file) {
                MessageToast.show("No file selected.");
                return; // Stop further execution if no file is selected
            }
        
            const reader = new FileReader();
            const that = this;
        
            reader.onload = function (e) {
                const data = new Uint8Array(e.target.result);
        
                // Ensure that the XLSX variable is properly defined in the controller
                const workbook = that.XLSX.read(data, { type: "array" });
        
                // Get the first sheet name
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
        
                // Convert sheet to JSON (with header: 1 for array format)
                const jsonData = that.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
                // Set the JSON data in a model
                const oModel = new JSONModel(jsonData);
                that.getView().setModel(oModel, "uploadedData");
        
                MessageToast.show("File uploaded and data processed!");
            };
        
            reader.readAsArrayBuffer(file); // Read the selected file as ArrayBuffer
        },        


        onSubmitPress: function () {
            // Get input fields
            const oFullNameInput = this.byId("fullNameInput");
            const oEmailInput = this.byId("emailInput");
            const oPasswordInput = this.byId("passwordInput");
            const oPhoneNumberInput = this.byId("phoneNumberInput");
            const oDobInput = this.byId("dobInput");

            // Validate fields
            let isValid = true;
            const messages = [];

            if (!oFullNameInput.getValue()) {
                messages.push("Full Name is required.");
                isValid = false;
            }

            if (!oEmailInput.getValue() || !this._isValidEmail(oEmailInput.getValue())) {
                messages.push("Please enter a valid Email Address.");
                isValid = false;
            }

            if (!oPasswordInput.getValue() || oPasswordInput.getValue().length < 6) {
                messages.push("Password must be at least 6 characters long.");
                isValid = false;
            }

            if (!oPhoneNumberInput.getValue()) {
                messages.push("Phone Number is required.");
                isValid = false;
            }

            if (!oDobInput.getDateValue()) {
                messages.push("Date of Birth is required.");
                isValid = false;
            }

            // Display validation messages
            if (!isValid) {
                MessageToast.show(messages.join(" "));
                return; // Stop form submission if invalid
            }

            // Get the uploaded data
            const oModel = this.getView().getModel("uploadedData");
            const uploadedData = oModel ? oModel.getData() : null;


            if (!uploadedData || uploadedData.length === 0) {
                MessageToast.show("No data available from the uploaded file.");
                return;
            }

            // Process the uploaded data as needed (you might want to validate or transform it here)

            // Encode the form data in Base64 to safely pass it in the URL
            const formData = {
                fullName: oFullNameInput.getValue(),
                email: oEmailInput.getValue(),
                password: oPasswordInput.getValue(),
                phoneNumber: oPhoneNumberInput.getValue(),
                dob: oDobInput.getDateValue(),
                uploadedData: JSON.stringify(uploadedData) // You can pass the uploaded data directly
            };

            // Optionally, encode the data for transmission
            const encodedFormData = btoa(JSON.stringify(formData));
            console.log("Encoded Form Data: ", encodedFormData);

            // Navigate to the next page and pass data
            const oRouter = UIComponent.getRouterFor(this);
            oRouter.navTo("RouteDisplayVendor", { formData: encodedFormData });

            // Proceed with form submission if valid
            MessageToast.show("Form submitted successfully!");
        },

        _isValidEmail: function (email) {
            // Simple email validation regex
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailPattern.test(email);
        }
    });
});
