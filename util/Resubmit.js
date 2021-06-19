/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("cross.fnd.fiori.inbox.util.Resubmit");
cross.fnd.fiori.inbox.util.Resubmit = (function() {
	var _ = null;
	return {
		open: function(a, c, v) {
			if (!_) {
				_ = sap.ui.xmlfragment(a, "cross.fnd.fiori.inbox.frag.Resubmit", c);
				v.addDependent(_);
			}
			var C = sap.ui.core.Fragment.byId(a, "DATE_RESUBMIT");
			if (C) {
				C.removeAllSelectedDates();
				C.focusDate(new Date());
			}
			_.open();
		},
		close: function() {
			_.close();
			_.destroy(true);
			_ = null;
		},
		validateDate: function() {
			var c = sap.ui.core.Fragment.byId(this.sResubmitUniqueId, "DATE_RESUBMIT");
			var s = c.getSelectedDates()[0].getStartDate();
			var C = new Date();
			var r = sap.ui.core.Fragment.byId(this.sResubmitUniqueId, "RESUBMIT_BTN_OK");
			if (C > s) {
				r.setEnabled(false);
				c.removeAllSelectedDates();
			} else {
				r.setEnabled(true);
			}
		}
	};
}());