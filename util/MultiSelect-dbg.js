/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("cross.fnd.fiori.inbox.util.MultiSelect");

cross.fnd.fiori.inbox.util.MultiSelect = (function() {
	var oFilterView = null;
	var oMessageView = null;
	var oDetailView = null;
	
	return {
		openFilterDialog: function(aFilterItems, fnOK, fnCancel) {
			if (!oFilterView) {
				oFilterView = new sap.ui.view({
					viewName: "cross.fnd.fiori.inbox.view.MultiSelectFilter",
					type:     sap.ui.core.mvc.ViewType.XML
				});				
			}
			
			oFilterView.getController().openDialog(aFilterItems, fnOK, fnCancel);
			return oFilterView;
		},
		
		openMessageDialog: function(aSuccessList, aErrorList, fnClose) {
			if (!oMessageView) {
				oMessageView = new sap.ui.view({
					viewName: "cross.fnd.fiori.inbox.view.MultiSelectMessage",
					type:     sap.ui.core.mvc.ViewType.XML					
				});
			}
			
			oMessageView.getController().openDialog(aSuccessList, aErrorList, fnClose);
		},
		
		openDetailDialog: function(oDetailInfo, fnClose, fnBack) {
			if (!oDetailView) {
				oDetailView = new sap.ui.view({
					viewName: "cross.fnd.fiori.inbox.view.MultiSelectDetail",
					type:     sap.ui.core.mvc.ViewType.XML					
				});
			}
			
			oDetailView.getController().openDialog(oDetailInfo, fnClose, fnBack);
		}
	};
}());