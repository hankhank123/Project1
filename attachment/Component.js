/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("jquery.sap.global");
jQuery.sap.require("sap/ui/core/UIComponent");
jQuery.sap.require("sap/ui/core/mvc/View");
jQuery.sap.declare("cross.fnd.fiori.inbox.attachment.Component");
sap.ui.core.UIComponent.extend("cross.fnd.fiori.inbox.attachment.Component", {
	metadata: {
		properties: {
			attachmentHandle: "any"
		},
		publicMethods: ["uploadURL"],
		rootView: "cross.fnd.fiori.inbox.attachment.view.Attachments",
	},
	init: function() {
		sap.ui.core.UIComponent.prototype.init.apply(this, arguments);
	},
	uploadURL: function(u) {
		var U = this.view.byId("uploadCollection");
		U.setUploadUrl(u);
	},
	exit: function() {},
	createContent: function() {
		var v = {
			component: this
		};
		this.view = sap.ui.view({
			type: sap.ui.core.mvc.ViewType.XML,
			viewName: "cross.fnd.fiori.inbox.attachment.view.Attachments",
			viewData: v
		});
		return this.view;
	}
});