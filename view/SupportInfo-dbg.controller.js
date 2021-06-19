/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("cross.fnd.fiori.inbox.util.SupportInfo");
sap.ui.controller("cross.fnd.fiori.inbox.view.SupportInfo", {
_SUPPORT_INFO_DIALOG_ID : "DLG_SUPPORTINFO",
/**
* Called when a controller is instantiated and its View controls (if available) are already created.
* Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
* @memberOf abcdefgh.dummy
*/
	onInit: function() {
		this.getView().setModel(sap.ca.scfld.md.app.Application.getImpl().AppI18nModel, "i18n");
	},

/**
* Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
* (NOT before the first rendering! onInit() is used for that one!).
* @memberOf abcdefgh.dummy
*/
//	onBeforeRendering: function() {
//
//	},

/**
* Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
* This hook is the same one that SAPUI5 controls get after being rendered.
* @memberOf abcdefgh.dummy
*/
//	onAfterRendering: function() {
//
//	},

/**
* Called when the Controller is destroyed. Use this one to free resources and finalize activities.
* @memberOf abcdefgh.dummy
*/
//	onExit: function() {
//
//	}

	onCancelDialog: function() {
		var oSupportInfoDlg = this.getView().byId(this._SUPPORT_INFO_DIALOG_ID);
		oSupportInfoDlg.close(); 
	}
	
	
});