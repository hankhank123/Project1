/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("sap.ui.core.mvc.Controller");
sap.ui.core.mvc.Controller.extend("cross.fnd.fiori.inbox.attachment.view.Attachments", {
	onInit: function() {
		this.oAttachmentControl = this.getView().byId("uploadCollection");
	},
	onAttachmentUploadComplete: function(e) {
		this.getOwnerComponent().getAttachmentHandle().fnOnAttachmentUploadComplete(e);
	},
	onAttachmentDeleted: function(e) {
		this.getOwnerComponent().getAttachmentHandle().fnOnAttachmentDeleted(e);
	},
	onAttachmentChange: function(e) {
		this.getOwnerComponent().getAttachmentHandle().fnOnAttachmentChange(e);
	}
});