/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("cross.fnd.fiori.inbox.util.MultiSelect");
cross.fnd.fiori.inbox.util.MultiSelect = (function() {
	var f = null;
	var m = null;
	var d = null;
	return {
		openFilterDialog: function(F, o, c) {
			if (!f) {
				f = new sap.ui.view({
					viewName: "cross.fnd.fiori.inbox.view.MultiSelectFilter",
					type: sap.ui.core.mvc.ViewType.XML
				});
			}
			f.getController().openDialog(F, o, c);
			return f;
		},
		openMessageDialog: function(s, e, c) {
			if (!m) {
				m = new sap.ui.view({
					viewName: "cross.fnd.fiori.inbox.view.MultiSelectMessage",
					type: sap.ui.core.mvc.ViewType.XML
				});
			}
			m.getController().openDialog(s, e, c);
		},
		openDetailDialog: function(D, c, b) {
			if (!d) {
				d = new sap.ui.view({
					viewName: "cross.fnd.fiori.inbox.view.MultiSelectDetail",
					type: sap.ui.core.mvc.ViewType.XML
				});
			}
			d.getController().openDialog(D, c, b);
		}
	};
}());