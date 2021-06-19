/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.controller("cross.fnd.fiori.inbox.view.MultiSelectDetail", {
	onInit: function() {
		var oView = this.getView();
		
		oView.setModel(sap.ca.scfld.md.app.Application.getImpl().AppI18nModel, "i18n");	

		var oDialog = oView.byId("DIALOG");
		
		// creating custom header as the back button can not be inserted in the default header
		this.oCustomHeader = new sap.m.Bar();
		this.oCustomHeader.addContentLeft(new sap.m.Button({
			type: sap.m.ButtonType.Back,
			press: jQuery.proxy(this.onBackPress, this)
		}));
		oDialog.setCustomHeader(this.oCustomHeader);
		
	},
	
	openDialog: function(oDetailInfo, fnClose, fnBack) {
		this.fnClose = fnClose;
		this.fnBack = fnBack;
		
		// Create detail message.
		
		var i18nBundle = this.getView().getModel("i18n").getResourceBundle();
		
		var sMessage = "";

		for (var i = 0; i < oDetailInfo.itemStatusList.length; i++) {
			var oItemStatus = oDetailInfo.itemStatusList[i];
			
			if (sMessage.length > 0)
				sMessage += "\n";
			
			sMessage += i18nBundle.getText("multi.itemstatus", [oItemStatus.InstanceID, oItemStatus.SAP__Origin]) + "\n";
			sMessage += oItemStatus.message + "\n";
		}
		
		// Configure dialog.
		
		var oView = this.getView();
		
		var oModel = new sap.ui.model.json.JSONModel();
		oModel.setData(jQuery.extend({}, oDetailInfo, {
			detailMessage: sMessage
		}));
		oView.setModel(oModel);
		
		var oDialog = oView.byId("DIALOG");
		
		// adding middle content in the custom header
		this.oCustomHeader.destroyContentMiddle();
		
		var oIconImage = sap.ui.core.IconPool.createControlByURI({
			src: oDialog.getIcon()
		}, sap.m.Image).addStyleClass("sapMDialogIcon");
		this.oCustomHeader.insertAggregation("contentMiddle", oIconImage, 0);
		
		this.oCustomHeader.addContentMiddle(new sap.m.Title({
			text : oView.byId("DIALOG").getTitle(),
			level : "H1"
		}).addStyleClass("sapMDialogTitle"));
		
		// Display dialog.
		oDialog.open();
	},
	
	closeDialog: function() {
		this.getView().byId("DIALOG").close();
	},
	
	onOKPress: function() {
		this.closeDialog();

		if (this.fnClose)
			this.fnClose();
	},
	
	onBackPress: function() {
		this.closeDialog();
		
		if (this.fnBack)
			this.fnBack();
	}
});
