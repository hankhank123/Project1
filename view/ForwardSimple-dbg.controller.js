/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("sap.ca.ui.utils.resourcebundle");
jQuery.sap.require("cross.fnd.fiori.inbox.util.ConfirmationDialogManager");
jQuery.sap.require("cross.fnd.fiori.inbox.util.EmployeeCard");
/*global cross:true*/
/*eslint no-undef: 2*/
sap.ui.controller("cross.fnd.fiori.inbox.view.ForwardSimple", {
	_FORWARD_DIALOG_ID: "DLG_FORWARD_SIMPLE",
	_FORWARDER_ITEM_ID: "ITM_AGENT",
	_TARGET_USER: "IFD_TARGET_USER",
	_NOTE: "confirmDialogTextarea",
	
	fnForward: null, //Forward handler

	onInit: function() {
		this.getView().setModel(sap.ca.scfld.md.app.Application.getImpl().AppI18nModel, "i18n");	

		if (sap.ui.Device.system.phone) {
			var oDialog = this.getView().byId(this._FORWARD_DIALOG_ID);
			oDialog.setStretch(true);
		}
	},
	
	onCancel: function() {
		var oForwardDlg = this.getView().byId(this._FORWARD_DIALOG_ID);
		oForwardDlg.close(); 
	},
	
	onForward: function(){
		//Get the forward dialog handler
		var oFwdDlg = this.getView().byId(this._FORWARD_DIALOG_ID);
		var oDlgModel = oFwdDlg.getModel();
		if (oDlgModel) {
			this.fnForward = oDlgModel.getProperty("/closeDlg");
		}
		
		//Read target user ID
		var oFldTarget = this.getView().byId(this._TARGET_USER);
		var sUniqueName = oFldTarget.getValue();
		
		//Validate
		if(!sUniqueName || sUniqueName=="") {
			oFldTarget.setValueState(sap.ui.core.ValueState.Error);
			var sErrorText = sap.ca.scfld.md.app.Application.getImpl().getComponent().oDataManager.oi18nResourceBundle.getText("XMSG_FORWARD_USER_ID_MANDATORY");
			oFldTarget.setValueStateText(sErrorText);
			oFldTarget.focus();
			return;
		}
		else{
			oFldTarget.setValueState(sap.ui.core.ValueState.None);
			oFldTarget.setValueStateText("");
		}
		
		//Read comment
		var oFldNote = this.getView().byId(this._NOTE);
		var sNote = oFldNote.getValue();
		
		//Close the dialog
		this.getView().byId(this._FORWARD_DIALOG_ID).close();

		//Construct the result and invoke the forward handler
		var oAgent = {
			UniqueName: sUniqueName,
			DisplayName: sUniqueName
		};
		var oNewResult = {
					bConfirmed: true,
					sNote: sNote,
					oAgentToBeForwarded: oAgent
		};
		this.fnForward(oNewResult);
		
	},
	
	onBeforeOpenDialog: function() {
		var oFldTarget = this.getView().byId(this._TARGET_USER);
		var oFwdDlg = this.getView().byId(this._FORWARD_DIALOG_ID);
		
		// setting initial focus to target user in the forward dialog
		oFwdDlg.setInitialFocus(oFldTarget);
		
		//remove previous field values
		oFldTarget.setValue("");
		oFldTarget.setValueState(sap.ui.core.ValueState.None);
		oFldTarget.setValueStateText("");

		var oFldNote = this.getView().byId(this._NOTE);
		oFldNote.setValue("");
		
		//Attach the forward function to the handler from model
		this.fnForward = null;
		var oDlgModel = oFwdDlg.getModel();
		if (oDlgModel) {
			this.fnForward = oDlgModel.getProperty("/closeDlg");
		}
	}
	
});