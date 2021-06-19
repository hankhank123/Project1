/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("sap.ui.core.mvc.Controller");

sap.ui.core.mvc.Controller.extend("cross.fnd.fiori.inbox.attachment.view.Attachments", {


	onInit: function() {
		this.oAttachmentControl = this.getView().byId("uploadCollection"); //get the control
		  
	},
	
	onAttachmentUploadComplete: function(oEvent) {
		this.getOwnerComponent().getAttachmentHandle().fnOnAttachmentUploadComplete(oEvent);
		
	},
	
	onAttachmentDeleted: function(oEvent) {
		this.getOwnerComponent().getAttachmentHandle().fnOnAttachmentDeleted(oEvent);
	},
	
	onAttachmentChange: function(oEvent) {
		this.getOwnerComponent().getAttachmentHandle().fnOnAttachmentChange(oEvent);
	}


});