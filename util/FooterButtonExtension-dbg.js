/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("sap.ca.scfld.md.app.ButtonListHelper");
cross.fnd.fiori.inbox.FooterButtonExtension = function() {
	return {
		overrideEnsureButton: function() {
			if(!sap.ca.scfld.md.app.ButtonListHelper.prototype.originalEnsureButton){ //This check is needed otherwise call stack is exceeded(stack overflow).
				sap.ca.scfld.md.app.ButtonListHelper.prototype.originalEnsureButton = sap.ca.scfld.md.app.ButtonListHelper.prototype.ensureButton;
				sap.ca.scfld.md.app.ButtonListHelper.prototype.ensureButton = function(oBtnMeta, sType, iMaxCountBeforeOverflow) {
					switch(oBtnMeta.nature) {
						case "POSITIVE":
							oBtnMeta.style = sap.m.ButtonType.Accept;
							break;
						case "NEGATIVE":
							oBtnMeta.style = sap.m.ButtonType.Reject;
					}
					return sap.ca.scfld.md.app.ButtonListHelper.prototype.originalEnsureButton.apply(this, arguments);
				};
			}
		}
	};
}();