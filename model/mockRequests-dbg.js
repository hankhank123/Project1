/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("cross.fnd.fiori.inbox.model.mockRequests");
jQuery.sap.registerModulePath("cross.fnd.fiori.inbox", "./");
jQuery.sap.require("cross.fnd.fiori.inbox.model.MyInboxMockServerData"); 

cross.fnd.fiori.inbox.model.mockRequests = {};

cross.fnd.fiori.inbox.model.mockRequests.getRequests = function() {
	var aRequests = [];
	aRequests.push(cross.fnd.fiori.inbox.model.mockRequests.mockDecisionOptionFuntionImport());
	aRequests.push(cross.fnd.fiori.inbox.model.mockRequests.mockDecisionFuntionImport());
	aRequests.push(cross.fnd.fiori.inbox.model.mockRequests.mockClaimKamal());
	aRequests.push(cross.fnd.fiori.inbox.model.mockRequests.mockDecisionFuntionImportReject());
	aRequests.push(cross.fnd.fiori.inbox.model.mockRequests.mockClaimDavid());
	aRequests.push(cross.fnd.fiori.inbox.model.mockRequests.mockClaimManna());
	aRequests.push(cross.fnd.fiori.inbox.model.mockRequests.mockReleaseManna());
	aRequests.push(cross.fnd.fiori.inbox.model.mockRequests.mockReleaseKamal());
	aRequests.push(cross.fnd.fiori.inbox.model.mockRequests.mockResubmit());
	aRequests.push(cross.fnd.fiori.inbox.model.mockRequests.mockSerchUsers());
	return aRequests;
};


cross.fnd.fiori.inbox.model.mockRequests.mockDecisionOptionFuntionImport = function() {
	var serverData = cross.fnd.fiori.inbox.model.MyInboxMockServerData;
	return {
		method: "GET",
		path: new RegExp("(DecisionOptions)/?(.*)?"),
		response: function(oXhr) {
			oXhr.respondJSON(200,"",JSON.stringify( serverData.decisionOptionsData));
			jQuery.sap.log.debug("MockServer: response sent with 200, " + JSON.stringify(serverData.decisionOptionsData));
		}
	};
};    

cross.fnd.fiori.inbox.model.mockRequests.mockDecisionFuntionImport = function() {
	var serverData = cross.fnd.fiori.inbox.model.MyInboxMockServerData;
	return {
		method: "POST",
		path: new RegExp("(Decision)/?(.*)?(.*)DecisionKey='Approve'?(.*)"),
		response: function(oXhr) {
			oXhr.respondJSON(200,"",JSON.stringify( serverData.decisionData));
			jQuery.sap.log.debug("MockServer: response sent with 200, " + JSON.stringify(serverData.decisionData));
		}
	};
};

cross.fnd.fiori.inbox.model.mockRequests.mockDecisionFuntionImportReject = function() {
	var serverData = cross.fnd.fiori.inbox.model.MyInboxMockServerData;
	return {
		method: "POST",
		path: new RegExp("(Decision)/?(.*)?(.*)DecisionKey='Reject'?(.*)"),
		response: function(oXhr) {
			oXhr.respondJSON(200,"",JSON.stringify( serverData.decisionRejectData));
			jQuery.sap.log.debug("MockServer: response sent with 200, " + JSON.stringify(serverData.decisionRejectData));
		}
	};
};



cross.fnd.fiori.inbox.model.mockRequests.mockClaimKamal = function() {
	var serverData = cross.fnd.fiori.inbox.model.MyInboxMockServerData;
	return {
		method: "POST",
		path: new RegExp("(Claim)/?(.*)?(.*)InstanceID='000001504109'"),
		response: function(oXhr) {
			oXhr.respondJSON(200,"",JSON.stringify( serverData.claimKamalData));
			jQuery.sap.log.debug("MockServer: response sent with 200, " + JSON.stringify(serverData.claimKamalData));
		}
	};
};

cross.fnd.fiori.inbox.model.mockRequests.mockClaimDavid = function() {
	var serverData = cross.fnd.fiori.inbox.model.MyInboxMockServerData;
	return {
		method: "POST",
		path: new RegExp("(Claim)/?(.*)?(.*)InstanceID='000001532231'"),
		response: function(oXhr) {
			oXhr.respondJSON(200,"",JSON.stringify( serverData.claimDavidData));
			jQuery.sap.log.debug("MockServer: response sent with 200, " + JSON.stringify(serverData.claimDavidData));
		}
	};
};

cross.fnd.fiori.inbox.model.mockRequests.mockClaimManna = function() {
	var serverData = cross.fnd.fiori.inbox.model.MyInboxMockServerData;
	return {
		method: "POST",
		path: new RegExp("(Claim)/?(.*)?(.*)InstanceID='000001532210'"),
		response: function(oXhr) {
			oXhr.respondJSON(200,"",JSON.stringify( serverData.claimMannaData));
			jQuery.sap.log.debug("MockServer: response sent with 200, " + JSON.stringify(serverData.claimMannaData));
		}
	};
};


cross.fnd.fiori.inbox.model.mockRequests.mockReleaseManna = function() {
	var serverData = cross.fnd.fiori.inbox.model.MyInboxMockServerData;
	return {
		method: "POST",
		path: new RegExp("(Release)/?(.*)InstanceID='000001532210'"),
		response: function(oXhr) {
			oXhr.respondJSON(200,"",JSON.stringify( serverData.releaseMannaData));
			jQuery.sap.log.debug("MockServer: response sent with 200, " + JSON.stringify(serverData.releaseMannaData));
		}
	};
};

cross.fnd.fiori.inbox.model.mockRequests.mockReleaseKamal = function() {
	var serverData = cross.fnd.fiori.inbox.model.MyInboxMockServerData;
	return {
		method: "POST",
		path: new RegExp("(Release)/?(.*)InstanceID='000001504109'"),
		response: function(oXhr) {
			oXhr.respondJSON(200,"",JSON.stringify( serverData.releaseKamalData));
			jQuery.sap.log.debug("MockServer: response sent with 200, " + JSON.stringify(serverData.releaseKamalData));
		}
	};
};




cross.fnd.fiori.inbox.model.mockRequests.mockResubmit = function() {
	var serverData = cross.fnd.fiori.inbox.model.MyInboxMockServerData;
	return {
		method: "POST",
		path: new RegExp("(Resubmit)/?(.*)?"),
		response: function(oXhr) {
			oXhr.respondJSON(200,"",JSON.stringify( serverData.resubmitData));
			jQuery.sap.log.debug("MockServer: response sent with 200, " + JSON.stringify(serverData.resubmitData));
		}
	};
};
cross.fnd.fiori.inbox.model.mockRequests.mockSerchUsers = function() {
	var serverData = cross.fnd.fiori.inbox.model.MyInboxMockServerData;
	return {
		method: "GET",
		path: new RegExp("(SearchUsers)/?(.*)?"),
		response: function(oXhr) {
			oXhr.respondJSON(200,"",JSON.stringify( serverData.searchUsers));
			jQuery.sap.log.debug("MockServer: response sent with 200, " + JSON.stringify(serverData.searchUsers));
		}
	};
};