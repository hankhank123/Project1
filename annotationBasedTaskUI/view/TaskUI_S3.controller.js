/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("cross.fnd.fiori.inbox.annotationBasedTaskUI.util.util");
jQuery.sap.require("cross.fnd.fiori.inbox.annotationBasedTaskUI.util.navigationUtil");
jQuery.sap.require("sap.ui.core.mvc.Controller");
sap.ui.core.mvc.Controller.extend("cross.fnd.fiori.inbox.annotationBasedTaskUI.view.TaskUI_S3", {
	onInit: function() {},
	fnRenderCommentsComponent: function() {
		var M = this.getView().getViewData().component.getComponentData().inboxHandle.inboxDetailView;
		if (M && M !== undefined && M !== null) {
			M.createGenericCommentsComponent.call(M, this.getView());
		}
	},
	fnRenderAttachmentsComponent: function() {
		var v = this.getView();
		var a = v.byId("attachmentComponent");
		var b = v.getViewData().component.getComponentData().inboxHandle.attachmentHandle;
		if (!jQuery.isEmptyObject(b)) {
			this.oGenericAttachmentComponent = sap.ui.getCore().createComponent({
				name: "cross.fnd.fiori.inbox.attachment",
				settings: {
					attachmentHandle: b
				}
			});
			var m = v.getViewData().component.getComponentData().inboxHandle.inboxDetailView;
			this.oGenericAttachmentComponent.uploadURL(b.uploadUrl);
			m.oAttachmentComponentView = this.oGenericAttachmentComponent.view;
			a.setPropagateModel(true);
			a.setComponent(this.oGenericAttachmentComponent);
		}
	},
	onVendorPress: function(e) {
		var u = e.getSource().getProperty("titleTarget");
		sap.m.URLHelper.redirect(u, false);
	},
	handleTabSelect: function(c) {
		var v = this.getView();
		var k = c.getParameters().selectedKey;
		var a = v.byId("attachmentComponent");
		var C = v.byId("commentsContainer");
		if (C && k === "NOTES") {
			this.fnRenderCommentsComponent();
		}
		if (a && k === "ATTACHMENTS") {
			this.fnRenderAttachmentsComponent();
		}
		this.getView().oViewData.component.getComponentData().inboxHandle.tabSelectHandle.fnOnTabSelect(c);
	},
	onTableItemPressed: function(e) {
		cross.fnd.fiori.inbox.annotationBasedTaskUI.util.navigationUtil.navigateForward(e, this);
	}
});