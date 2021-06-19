/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("jquery.sap.global");
jQuery.sap.require("sap/ui/core/UIComponent");
jQuery.sap.require("sap/ui/core/mvc/View");
jQuery.sap.require("cross.fnd.fiori.inbox.comments.util.Formatters");
jQuery.sap.declare("cross.fnd.fiori.inbox.comments.Component");
sap.ui.core.UIComponent.extend("cross.fnd.fiori.inbox.comments.Component", {
	metadata: {
		properties: {
			mainView: {
				name: "mainView",
				type: "sap.ui.view"
			},
		},
		publicMethods: ["fnShowLoaderForComments", "fnSetFeedInputIcon", "fnGetFeedInputIcon", "fnIsFeedInputPresent", "setNoDataText"],
		rootView: "cross.fnd.fiori.inbox.comments.view.Comments",
	},
	init: function() {
		sap.ui.core.UIComponent.prototype.init.apply(this, arguments);
	},
	exit: function() {},
	fnShowLoaderForComments: function(s) {
		var v = this.getAggregation("rootControl");
		v.byId("MIBCommentList").setBusyIndicatorDelay(1000);
		v.byId("MIBCommentList").setBusy(s);
	},
	fnSetFeedInputIcon: function(u) {
		var f = this.getAggregation("rootControl").byId("commentsFeedInput");
		f.setIcon(u);
	},
	fnGetFeedInputIcon: function() {
		var f = this.getAggregation("rootControl").byId("commentsFeedInput");
		return f.getIcon();
	},
	fnIsFeedInputPresent: function() {
		var f = this.getAggregation("rootControl").byId("commentsFeedInput");
		if (f) {
			return true;
		} else {
			return false;
		}
	},
	setNoDataText: function(t) {
		var c = this.getAggregation("rootControl").byId("MIBCommentList");
		c.setNoDataText(t);
	},
	createContent: function() {
		var v = {
			component: this
		};
		return sap.ui.view({
			type: sap.ui.core.mvc.ViewType.XML,
			viewName: "cross.fnd.fiori.inbox.comments.view.Comments",
			viewData: v
		});
	}
});