/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("sap.ui.model.json.JSONModel");
jQuery.sap.require("sap.ui.model.Binding");
jQuery.sap.require("sap.ui.core.mvc.Controller");
jQuery.sap.require("cross.fnd.fiori.inbox.annotationBasedTaskUI.util.navigationUtil");
jQuery.sap.require("cross.fnd.fiori.inbox.annotationBasedTaskUI.util.i18n");
sap.ui.core.mvc.Controller.extend("cross.fnd.fiori.inbox.annotationBasedTaskUI.view.Detail", {
	onInit: function() {
		var v = this.getView();
		var d = new sap.ui.model.json.JSONModel();
		var i = cross.fnd.fiori.inbox.annotationBasedTaskUI.util.i18n.getResourceModel();
		v.setModel(i, "i18n");
		v.setModel(d, "detailModel");
		v.setModel(new sap.ui.model.json.JSONModel(), "controlModel");
		var b = new sap.ui.model.Binding(d, "/", d.getContext("/"));
		b.attachChange(jQuery.proxy(this.onDetailModelChanged, this));
	},
	onNavButtonPress: function() {
		this.setHeaderFooterOptions(this.previousHeaderFooterOptions);
		this.getView().getParent().back();
	},
	fSetPosition: function(i) {
		var v = this.getView();
		var m = v.getModel("controlModel");
		var c = m.getProperty("/collection");
		this.setNewHeaderFooterOptions(i, c.length);
		v.bindElement(c[i].getBindingContext().getPath());
	},
	onDetailModelChanged: function() {
		var v = this.getView();
		var d = v.getModel("detailModel");
		var i = d.getProperty("/isReady");
		if (!i) {
			return;
		}
		d.setProperty("/isReady", false);
		var c = v.getModel("controlModel");
		var a = d.getProperty("/collection");
		var b = d.getProperty("/itemIndex");
		var e = d.getProperty("/collectionName");
		c.setProperty("/collectionName", e);
		c.setProperty("/collection", a);
		var f = v.oViewData.component.getComponentData().inboxHandle.inboxDetailView.oHeaderFooterOptions;
		this.previousHeaderFooterOptions = jQuery.extend({}, f);
		this.setNewHeaderFooterOptions(b, a.length);
		var g = a[b].getBindingContext().getPath();
		v.bindElement(g);
	},
	setNewHeaderFooterOptions: function(i, a) {
		var n = this.createNewHeaderFooterOptions(i, a);
		this.setHeaderFooterOptions(n);
	},
	setHeaderFooterOptions: function(o) {
		var i = this.getView().oViewData.component.getComponentData().inboxHandle.inboxDetailView;
		i.oHeaderFooterOptions = o;
		i.setHeaderFooterOptions(o);
	},
	createNewHeaderFooterOptions: function(i, a) {
		var v = this.getView();
		var c = v.getModel("controlModel").getProperty("/collectionName");
		var o = v.getModel("i18n").getResourceBundle().getText("DETAIL_PAGE.TITLE.OF");
		var t = c + " (" + o + ")";
		var b = v.oViewData.component.getComponentData().inboxHandle.inboxDetailView;
		var d = this;
		return jQuery.extend({}, b.oHeaderFooterOptions, {
			onBack: jQuery.proxy(d.onNavButtonPress, d),
			oUpDownOptions: {
				iPosition: i,
				iCount: a,
				fSetPosition: jQuery.proxy(d.fSetPosition, d),
				sI18NDetailTitle: t,
				sI18NPhoneTitle: t
			},
			oPositiveAction: null,
			oNegativeAction: null,
			buttonList: [],
			oJamOptions: null,
			oEmailSettings: null
		});
	},
	onTableItemPressed: function(e) {
		cross.fnd.fiori.inbox.annotationBasedTaskUI.util.navigationUtil.navigateForward(e, this);
	},
	onVendorPress: function(e) {
		var u = e.getSource().getProperty("titleTarget");
		sap.m.URLHelper.redirect(u, false);
	}
});