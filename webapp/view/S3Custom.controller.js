sap.ui.controller("cross.fnd.fiori.inbox.CA_FIORI_INBOXExtension.view.S3Custom", {

	extHookChangeFooterButtons: function(B) {
		// Place your hook implementation code here 
		debugger;
	//	var l_len = B.aButtonList.length;
		var lt_but = [];
		for (var i = 0; i < 2; i++) {
			lt_but.push(B.aButtonList[i]);
		}
		
			B.aButtonList = lt_but;
			return B;



	}

});