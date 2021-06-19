/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("sap.ui.core.format.FileSizeFormat");
cross.fnd.fiori.inbox.attachment = (function() {
	return {
		getRelativeMediaSrc: function(m) {
			var u = "";
			if (m && typeof m === "string") {
				var l = document.createElement("a");
				l.href = m;
				u = (l.pathname.charAt(0) === "/") ? l.pathname : "/" + l.pathname;
			}
			return u;
		},
		formatFileSize: function(v) {
			if (jQuery.isNumeric(v)) {
				return sap.ui.core.format.FileSizeFormat.getInstance({
					maxFractionDigits: 1,
					maxIntegerDigits: 3
				}).format(v);
			} else {
				return v;
			}
		},
	};
}());