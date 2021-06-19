/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("cross.fnd.fiori.inbox.util.ForwardSimple");

cross.fnd.fiori.inbox.util.ForwardSimple = (function() {
	var _oXmlView = null;
	
	return {
		open: function(fnCloseDlg, iNumberOfItems) {
			if (!_oXmlView) {
				_oXmlView = new sap.ui.view({
					id: 		"MIB_VIEW_FORWARD_SIMPLE",
					viewName: 	"cross.fnd.fiori.inbox.view.ForwardSimple",
					type:		sap.ui.core.mvc.ViewType.XML
				});
			}
			
			var oModel = new sap.ui.model.json.JSONModel(
				{
					closeDlg: fnCloseDlg,
					numberOfItems: iNumberOfItems
				}
			);
			
			var oDialog = _oXmlView.byId("DLG_FORWARD_SIMPLE");
			oDialog.setModel(oModel);
			oDialog.open();
		}
	};
}());