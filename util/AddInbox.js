/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("cross.fnd.fiori.inbox.util.AddInbox");
jQuery.sap.require("cross.fnd.fiori.inbox.util.Substitution");
cross.fnd.fiori.inbox.util.AddInbox = (function() {
	var _ = null;
	var a = null;
	var b = null;
	var c = "TAKE_OVER";
	var d = null;
	return {
		open: function() {
			if (!_) {
				_ = new sap.ui.view({
					id: "MIB_VIEW_ADD_INBOX",
					viewName: "cross.fnd.fiori.inbox.view.AddInbox",
					type: sap.ui.core.mvc.ViewType.XML
				});
			}
			if (!a) {
				a = _.byId("DLG_ADD_INBOX");
			}
			if (!b) {
				b = _.byId("LST_USERS");
			}
			if (!d) {
				d = sap.ca.scfld.md.app.Application.getImpl().getComponent().getDataManager();
			}
			var m = new sap.ui.model.json.JSONModel();
			a.setModel(m);
			b.setShowNoData(false);
			b.removeSelections(true);
			a.open();
			this.refreshDataAfterUpdateSubstitutionRule();
		},
		_setAgents: function(A) {
			a.getModel().setProperty("/agents", A);
			a.rerender();
		},
		refreshDataAfterUpdateSubstitutionRule: function() {
			b.setBusyIndicatorDelay(1000);
			b.setBusy(true);
			d.readAddInboxUsers(jQuery.proxy(this._addInboxUsersReadSuccess, this), function() {
				b.setBusy(false);
				a.close();
			});
		},
		_addInboxUsersReadSuccess: function(r) {
			var D = [];
			var n;
			var t = this;
			b.setBusy(false);
			jQuery.each(r.results, function(i, o) {
				if (o.Mode === c && !cross.fnd.fiori.inbox.Substitution.isRuleOutdated(o.EndDate)) {
					n = true;
					o.User = o.User.toUpperCase();
					jQuery.each(D, function(e, p) {
						if (p.User === o.User) {
							t._mergeRule(p, o);
							n = false;
							return false;
						}
					});
					if (n) {
						D.push(t._getProcessedRuleObject(o));
					}
				}
			});
			if (D.length > 0) {
				this._setStatus(D);
				this._setAgents(D);
			} else {
				b.setShowNoData(true);
				b.rerender();
			}
		},
		_mergeRule: function(m, C) {
			if (!m.IsEnabled && C.IsEnabled) {
				m.IsEnabled = true;
			}
			var k = C.IsEnabled ? m.aEnabledRules : m.aDisabledRules;
			k.push({
				subRuleId: C.SubstitutionRuleID,
				sOrigin: C.SAP__Origin
			});
		},
		_getProcessedRuleObject: function(r) {
			var n = {
				User: r.User,
				FullName: r.FullName,
				SupportsEnableSubstitutionRule: r.SupportsEnableSubstitutionRule,
				IsEnabled: r.IsEnabled,
				SAP__Origin: r.SAP__Origin,
				aEnabledRules: [],
				aDisabledRules: []
			};
			var k = r.IsEnabled ? n.aEnabledRules : n.aDisabledRules;
			k.push({
				subRuleId: r.SubstitutionRuleID,
				sOrigin: r.SAP__Origin
			});
			return n;
		},
		_setStatus: function(D) {
			jQuery.each(D, function(i, r) {
				r.bShowWarning = (r.aEnabledRules.length > 0 && r.aDisabledRules.length > 0) ? true : false;
			});
		}
	};
}());