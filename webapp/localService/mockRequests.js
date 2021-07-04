/*
 * Copyright (C) 2009-2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("cross.fnd.fiori.inbox.model.mockRequests");
jQuery.sap.registerModulePath("cross.fnd.fiori.inbox", "./");
jQuery.sap.require("cross.fnd.fiori.inbox.model.MyInboxMockServerData");
cross.fnd.fiori.inbox.model.mockRequests = {};
cross.fnd.fiori.inbox.model.mockRequests.getRequests = function() {
	var r = [];
	r.push(cross.fnd.fiori.inbox.model.mockRequests.mockDecisionOptionFuntionImport());
	r.push(cross.fnd.fiori.inbox.model.mockRequests.mockDecisionFuntionImport());
	r.push(cross.fnd.fiori.inbox.model.mockRequests.mockClaimKamal());
	r.push(cross.fnd.fiori.inbox.model.mockRequests.mockDecisionFuntionImportReject());
	r.push(cross.fnd.fiori.inbox.model.mockRequests.mockClaimDavid());
	r.push(cross.fnd.fiori.inbox.model.mockRequests.mockClaimManna());
	r.push(cross.fnd.fiori.inbox.model.mockRequests.mockReleaseManna());
	r.push(cross.fnd.fiori.inbox.model.mockRequests.mockReleaseKamal());
	r.push(cross.fnd.fiori.inbox.model.mockRequests.mockResubmit());
	r.push(cross.fnd.fiori.inbox.model.mockRequests.mockSerchUsers());
	return r;
};
cross.fnd.fiori.inbox.model.mockRequests.mockDecisionOptionFuntionImport = function() {
	var s = cross.fnd.fiori.inbox.model.MyInboxMockServerData;
	return {
		method: "GET",
		path: new RegExp("(DecisionOptions)/?(.*)?"),
		response: function(x) {
			x.respondJSON(200, "", JSON.stringify(s.decisionOptionsData));
			jQuery.sap.log.debug("MockServer: response sent with 200, " + JSON.stringify(s.decisionOptionsData));
		}
	};
};
cross.fnd.fiori.inbox.model.mockRequests.mockDecisionFuntionImport = function() {
	var s = cross.fnd.fiori.inbox.model.MyInboxMockServerData;
	return {
		method: "POST",
		path: new RegExp("(Decision)/?(.*)?(.*)DecisionKey='Approve'?(.*)"),
		response: function(x) {
			x.respondJSON(200, "", JSON.stringify(s.decisionData));
			jQuery.sap.log.debug("MockServer: response sent with 200, " + JSON.stringify(s.decisionData));
		}
	};
};
cross.fnd.fiori.inbox.model.mockRequests.mockDecisionFuntionImportReject = function() {
	var s = cross.fnd.fiori.inbox.model.MyInboxMockServerData;
	return {
		method: "POST",
		path: new RegExp("(Decision)/?(.*)?(.*)DecisionKey='Reject'?(.*)"),
		response: function(x) {
			x.respondJSON(200, "", JSON.stringify(s.decisionRejectData));
			jQuery.sap.log.debug("MockServer: response sent with 200, " + JSON.stringify(s.decisionRejectData));
		}
	};
};
cross.fnd.fiori.inbox.model.mockRequests.mockClaimKamal = function() {
	var s = cross.fnd.fiori.inbox.model.MyInboxMockServerData;
	return {
		method: "POST",
		path: new RegExp("(Claim)/?(.*)?(.*)InstanceID='000001504109'"),
		response: function(x) {
			x.respondJSON(200, "", JSON.stringify(s.claimKamalData));
			jQuery.sap.log.debug("MockServer: response sent with 200, " + JSON.stringify(s.claimKamalData));
		}
	};
};
cross.fnd.fiori.inbox.model.mockRequests.mockClaimDavid = function() {
	var s = cross.fnd.fiori.inbox.model.MyInboxMockServerData;
	return {
		method: "POST",
		path: new RegExp("(Claim)/?(.*)?(.*)InstanceID='000001532231'"),
		response: function(x) {
			x.respondJSON(200, "", JSON.stringify(s.claimDavidData));
			jQuery.sap.log.debug("MockServer: response sent with 200, " + JSON.stringify(s.claimDavidData));
		}
	};
};
cross.fnd.fiori.inbox.model.mockRequests.mockClaimManna = function() {
	var s = cross.fnd.fiori.inbox.model.MyInboxMockServerData;
	return {
		method: "POST",
		path: new RegExp("(Claim)/?(.*)?(.*)InstanceID='000001532210'"),
		response: function(x) {
			x.respondJSON(200, "", JSON.stringify(s.claimMannaData));
			jQuery.sap.log.debug("MockServer: response sent with 200, " + JSON.stringify(s.claimMannaData));
		}
	};
};
cross.fnd.fiori.inbox.model.mockRequests.mockReleaseManna = function() {
	var s = cross.fnd.fiori.inbox.model.MyInboxMockServerData;
	return {
		method: "POST",
		path: new RegExp("(Release)/?(.*)InstanceID='000001532210'"),
		response: function(x) {
			x.respondJSON(200, "", JSON.stringify(s.releaseMannaData));
			jQuery.sap.log.debug("MockServer: response sent with 200, " + JSON.stringify(s.releaseMannaData));
		}
	};
};
cross.fnd.fiori.inbox.model.mockRequests.mockReleaseKamal = function() {
	var s = cross.fnd.fiori.inbox.model.MyInboxMockServerData;
	return {
		method: "POST",
		path: new RegExp("(Release)/?(.*)InstanceID='000001504109'"),
		response: function(x) {
			x.respondJSON(200, "", JSON.stringify(s.releaseKamalData));
			jQuery.sap.log.debug("MockServer: response sent with 200, " + JSON.stringify(s.releaseKamalData));
		}
	};
};
cross.fnd.fiori.inbox.model.mockRequests.mockResubmit = function() {
	var s = cross.fnd.fiori.inbox.model.MyInboxMockServerData;
	return {
		method: "POST",
		path: new RegExp("(Resubmit)/?(.*)?"),
		response: function(x) {
			x.respondJSON(200, "", JSON.stringify(s.resubmitData));
			jQuery.sap.log.debug("MockServer: response sent with 200, " + JSON.stringify(s.resubmitData));
		}
	};
};
cross.fnd.fiori.inbox.model.mockRequests.mockSerchUsers = function() {
	var s = cross.fnd.fiori.inbox.model.MyInboxMockServerData;
	return {
		method: "GET",
		path: new RegExp("(SearchUsers)/?(.*)?"),
		response: function(x) {
			x.respondJSON(200, "", JSON.stringify(s.searchUsers));
			jQuery.sap.log.debug("MockServer: response sent with 200, " + JSON.stringify(s.searchUsers));
		}
	};
};