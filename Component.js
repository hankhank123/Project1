/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("cross.fnd.fiori.inbox.Component");
jQuery.sap.require("sap.ui.core.UIComponent");
jQuery.sap.require("sap.ca.scfld.md.ConfigurationBase");
jQuery.sap.require("sap.ui.core.routing.Router");
jQuery.sap.require("sap.ca.scfld.md.ComponentBase");
sap.ca.scfld.md.ComponentBase.extend("cross.fnd.fiori.inbox.Component", {
	metadata: sap.ca.scfld.md.ComponentBase.createMetaData("MD", {
		"manifest": "json",
		viewPath: "cross.fnd.fiori.inbox.view",
		detailPageRoutes: {
			"detail": {
				"pattern": "detail/{SAP__Origin}/{InstanceID}/{contextPath}",
				"view": "S3"
			},
			"multi_select_summary": {
				"pattern": "multi_select_summary",
				"view": "MultiSelectSummary"
			},
			"replace_detail": {
				"pattern": "replaceDetail/{SAP__Origin}/{InstanceID}/{contextPath}",
				"view": "ReplaceDetail"
			}
		},
		fullScreenPageRoutes: {
			"detail_deep": {
				"pattern": "detail_deep/{SAP__Origin}/{InstanceID}/{contextPath}",
				"view": "S3"
			},
			"substitution": {
				"pattern": "substitution",
				"view": "ViewSubstitution"
			},
			"table_view": {
				"pattern": "table_view",
				"view": "S2_TaskList"
			}
		}
	}),
	initShellUIService: function() {
		if (sap.ushell && sap.ushell.ui5service && sap.ushell.ui5service.ShellUIService) {
			this.getService("ShellUIService").then(jQuery.proxy(function(s) {
				this.oShellUIService = s;
			}, this), function(e) {
				jQuery.sap.log.error("Cannot get ShellUIService", e, "cross.fnd.fiori.inbox.Component");
			});
		}
	},
	createContent: function() {
		this.initShellUIService();
		var v = {
			component: this
		};
		var r = new sap.ui.view({
			viewName: "cross.fnd.fiori.inbox.Main",
			type: sap.ui.core.mvc.ViewType.XML,
			viewData: v
		});
		r.addStyleClass(this.getContentDensityClass());
		var i = this.getDataManager().sTaskInstanceID;
		var s = this.getDataManager().sSapOrigin;
		if (i && s) {
			var u = this._getAppSpecificURL(i, s);
		}
		if (u) {
			var h = sap.ui.core.routing.HashChanger.getInstance();
			h.replaceHash(u);
			var U = this._getFullHash(u);
			if (window.history.replaceState) {
				window.history.replaceState({
					fromExternal: true
				}, null, '#' + U);
			}
		}
		if (this.getDataManager().getTableView() && (!sap.ui.Device.system.phone || this.getDataManager().getTableViewOnPhone())) {
			var h = sap.ui.core.routing.HashChanger.getInstance();
			var c = h.getHash();
			if (!jQuery.sap.startsWith(c, "detail_deep")) {
				var R = this.getRouter();
				var a = R.getURL("table_view", {});
				if (a) {
					h.replaceHash(a);
				}
			}
		}
		return r;
	},
	setDataManager: function(d) {
		this.oDataManager = d;
	},
	getDataManager: function() {
		return this.oDataManager;
	},
	getContentDensityClass: function() {
		if (this._sContentDensityClass === undefined) {
			if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
				this._sContentDensityClass = "";
			} else if (!sap.ui.Device.support.touch) {
				this._sContentDensityClass = "sapUiSizeCompact";
			} else {
				this._sContentDensityClass = "sapUiSizeCozy";
			}
		}
		return this._sContentDensityClass;
	},
	_getAppSpecificURL: function(i, s) {
		if (i && s) {
			var r = this.getRouter();
			var u = r.getURL("detail", {
				SAP__Origin: s,
				InstanceID: i,
				contextPath: "TaskCollection(SAP__Origin='" + s + "',InstanceID='" + i + "')"
			});
		}
		return u;
	},
	_getFullHash: function(a) {
		var u = "";
		if (a) {
			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				var x = sap.ushell.Container.getService("CrossApplicationNavigation");
				u = x.hrefForAppSpecificHash(a);
				var b = sap.ushell.Container.getService("URLParsing");
				var s = b.parseShellHash(u);
				delete s.params.InstanceID;
				delete s.params.SAP__Origin;
				u = b.constructShellHash(s);
			} else {
				jQuery.sap.log.error("sap.ushell.Container.getService is not found.");
			}
		}
		return u;
	}
});