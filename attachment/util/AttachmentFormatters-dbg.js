/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("sap.ui.core.format.FileSizeFormat");

cross.fnd.fiori.inbox.attachment = (function() {

	
	return {
		getRelativeMediaSrc : function(sMediaSrc) {
			
			var sUrl = "";
	        if (sMediaSrc && typeof sMediaSrc === "string") {
	        	/* eslint-disable sap-browser-api-error */
	            var oLink = document.createElement("a");
	            /* eslint-enable sap-browser-api-error */
	            oLink.href = sMediaSrc;
	            sUrl = (oLink.pathname.charAt(0) === "/") ? oLink.pathname : "/" + oLink.pathname;
	        }
	        return sUrl;
		},
		
		formatFileSize :  function (sValue) {
			if (jQuery.isNumeric(sValue)) {
				return sap.ui.core.format.FileSizeFormat.getInstance({
					maxFractionDigits : 1,
					maxIntegerDigits : 3
				}).format(sValue);
			} else {
				return sValue;
			}
		},
		
		    
	};
}());
