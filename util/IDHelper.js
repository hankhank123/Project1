/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("cross.fnd.fiori.inbox.util.IDHelper");
cross.fnd.fiori.inbox.util.IDHelper = (function() {
	var _ = "cross.fnd.fiori.inbox";
	return {
		generateID: function(s) {
			var i;
			if (s && typeof s === "string") {
				i = _.concat(".").concat(s);
			} else {
				i = _;
			}
			return i;
		},
		getNamespace: function() {
			return jQuery.sap.getObject(_, 0);
		}
	};
}());