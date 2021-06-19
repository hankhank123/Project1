/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("cross.fnd.fiori.inbox.annotationBasedTaskUI.util.sapUshellUtil");
cross.fnd.fiori.inbox.annotationBasedTaskUI.util.sapUshellUtil = {
	isSapUshellResourceAvailable: function() {
		return sap.ushell && sap.ushell.Container && sap.ushell.Container.getService;
	},
	getSapUshellService: function(s) {
		return sap.ushell.Container.getService(s);
	},
	shouldRenderLink: function(i, v) {
		if (!v) {
			return false;
		}
		var u = v.Apply.Parameters[0].Value;
		if (!cross.fnd.fiori.inbox.annotationBasedTaskUI.util.sapUshellUtil.isSapUshellResourceAvailable()) {
			return true;
		}
		var p = cross.fnd.fiori.inbox.annotationBasedTaskUI.util.sapUshellUtil.getSapUshellService("URLParsing");
		if (!p.isIntentUrl(u)) {
			return true;
		}
		var a = p.parseShellHash(u);
		var x = cross.fnd.fiori.inbox.annotationBasedTaskUI.util.sapUshellUtil.getSapUshellService("CrossApplicationNavigation");
		var b = true;
		x.isNavigationSupported([a]).done(function(l) {
			b = l[0].supported;
		});
		if (b) {
			return true;
		}
		jQuery.sap.log.debug("Link de-activated as intent " + u + " was defined but no intent configuration has been found.");
		return false;
	}
};
cross.fnd.fiori.inbox.annotationBasedTaskUI.util.sapUshellUtil.shouldRenderLink.requiresIContext = true;