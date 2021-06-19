/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("cross.fnd.fiori.inbox.util.Forward");
cross.fnd.fiori.inbox.util.Forward = (function() {
	var _ = null;
	return {
		open: function(s, c, n) {
			if (!_) {
				_ = new sap.ui.view({
					id: "MIB_VIEW_FORWARD",
					viewName: "cross.fnd.fiori.inbox.view.Forward",
					type: sap.ui.core.mvc.ViewType.XML
				});
			}
			var m = new sap.ui.model.json.JSONModel({
				startSearch: s,
				closeDlg: c,
				numberOfItems: n
			});
			var d = _.byId("DLG_FORWARD");
			d.setModel(m);
			_.byId("LST_AGENTS").removeSelections(true);
			d.open();
		},
		setAgents: function(a) {
			var d = _.byId("DLG_FORWARD");
			d.getModel().setProperty("/agents", a);
			if (a.length > 0) {
				d.getModel().setProperty("/isPreloadedAgents", true);
			} else {
				d.getModel().setProperty("/isPreloadedAgents", false);
			}
			d.rerender();
		},
		setOrigin: function(o) {
			var d = _.byId("DLG_FORWARD");
			d.getModel().setProperty("/origin", o);
		}
	};
}());