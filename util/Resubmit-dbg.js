/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("cross.fnd.fiori.inbox.util.Resubmit");

cross.fnd.fiori.inbox.util.Resubmit = (function() {
	var _oResubmitFrag = null;
	return {
		open: function(_sResubmitUniqueId , oController , oView) {
			//Create ReSubmit PopUp
			if (!_oResubmitFrag) {
				_oResubmitFrag = sap.ui.xmlfragment(_sResubmitUniqueId, "cross.fnd.fiori.inbox.frag.Resubmit", oController);
				oView.addDependent(_oResubmitFrag);
	         }
			var oCalendar = sap.ui.core.Fragment.byId(_sResubmitUniqueId, "DATE_RESUBMIT");
			if (oCalendar) {	
				oCalendar.removeAllSelectedDates();
				oCalendar.focusDate(new Date());
			}
			_oResubmitFrag.open();
			
		},
		close : function(){
			_oResubmitFrag.close();
			_oResubmitFrag.destroy(true); //skip default calendar validation -> this.validateDate used instead
			_oResubmitFrag = null;
		},
		
		validateDate : function() {
			var oCalendar = sap.ui.core.Fragment.byId(this.sResubmitUniqueId, "DATE_RESUBMIT");
			var oSelectedDate = oCalendar.getSelectedDates()[0].getStartDate(); //get the selected date
			var oCurrentDate = new Date();
			var oResubmitOkBtn = sap.ui.core.Fragment.byId(this.sResubmitUniqueId, "RESUBMIT_BTN_OK");
			if (oCurrentDate > oSelectedDate) {
				oResubmitOkBtn.setEnabled(false);
				oCalendar.removeAllSelectedDates();
			} else {
				oResubmitOkBtn.setEnabled(true);
			}
		}
	};
}());