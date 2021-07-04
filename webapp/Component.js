<<<<<<< HEAD
jQuery.sap.declare("cross.fnd.fiori.inbox.CA_FIORI_INBOXExtension.Component");

// use the load function for getting the optimized preload file if present
sap.ui.component.load({
	name: "cross.fnd.fiori.inbox",
	// Use the below URL to run the extended application when SAP-delivered application is deployed on SAPUI5 ABAP Repository
	url: "/sap/bc/ui5_ui5/sap/CA_FIORI_INBOX"
		// we use a URL relative to our own component
		// extension application is deployed with customer namespace
});

this.cross.fnd.fiori.inbox.Component.extend("cross.fnd.fiori.inbox.CA_FIORI_INBOXExtension.Component", {
	metadata: {
		manifest: "json"
	}
=======
sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"Program2Program2/model/models"
], function(UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("Program2Program2.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function() {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
		}
	});
>>>>>>> 45b6bf34f4eb12ebb7d1d54ee3350a8e9f662aed
});
