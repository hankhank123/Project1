/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("sap.ca.ui.utils.busydialog");
jQuery.sap.require("sap.ca.ui.message.message");
jQuery.sap.require("cross.fnd.fiori.inbox.util.Substitution");
sap.ui.base.EventProvider.extend("cross.fnd.fiori.inbox.util.DataManager", {
	sMode: "TABLET",
	oModel: null,
	oPostActionModel: null,
	_oScenarioConfig: null,
	FUNCTION_IMPORT_CONFIRM: "Confirm",
	FUNCTION_IMPORT_DECISION: "Decision",
	FUNCTION_IMPORT_DECISIONOPTIONS: "DecisionOptions",
	FUNCTION_IMPORT_RESUBMIT: "Resubmit",
	FUNCTION_IMPORT_ENABLESUBSTITUTIONRULE: "EnableSubstitutionRule",
	ACTION_SUCCESS: "Success",
	ACTION_FAILURE: "Failure",
	aSystemInfoCollection: null,
	aSubstitutionProfilesCollection: null,
	oCustomAttributeDefinitions: {},
	oUIExecutionLinks: {},
	oDecisionOptions: {},
	oDescriptions: {},
	oCurrentUserImageAvailability: {},
	sScenarioId: null,
	sClientScenario: null,
	bAllItems: null,
	userSearch: true,
	bOutbox: false,
	tableView: false,
	tableViewOnPhone: false,
	bIsMassActionEnabled: null,
	bIsQuickActionEnabled: null,
	sDefaultSortBy: null,
	iListSize: null,
	bEnablePaging: false,
	sOperationMode: "Server",
	iPageSize: 30,
	iCacheSize: null,
	bShowAdditionalAttributes: false,
	bSubstitution: true,
	bShowLog: true,
	bDebug: false,
	bDetailPageLoaded: false,
	bDetailPageLoadedViaDeepLinking: false,
	bIsDeepLinkingURLCall: false,
	sCustomAttributeDefinitionNavProperty: "CustomAttributeDefinitionData",
	sClaimAction: "Claim",
	sReleaseAction: "Release",
	sResumeAction: "CancelResubmission",
	sTaskDefinitionCollectionName: "TaskDefinitionCollection",
	sStatusCompleted: "COMPLETED",
	sDefaultSortForOutbox: "CompletedOn",
	sDeafultSortForInbox: "CreatedOn",
	oServiceMetaModel: null,
	oEventBus: null,
	sTaskInstanceID: null,
	sSapOrigin: null,
	bPropogateSapURLParameters: true,
	constructor: function(m, c) {
		sap.ui.base.EventProvider.apply(this);
		this.oCacheStore = {
			"DecisionOptions": this.oDecisionOptions,
			"UIExecutionLink": this.oUIExecutionLinks,
			"Description": this.oDescriptions
		};
		var C, s, a;
		if (c) {
			C = c.getOwnerComponent().getComponentData();
			if (C) {
				s = C.startupParameters;
				this._getURLParametersfromStartUpParameters(s);
			} else {
				this._getURLParameters();
			}
			this.oPostActionModel = c.getView().getModel("POSTACTION");
		}
		this.oModel = m;
		if (this.oModel) {
			this.oModel.setUseBatch(true);
			this.oModel.setRefreshAfterChange(false);
			this.oModel.attachRequestCompleted(jQuery.proxy(this.handleRequestCompleted, this));
		}
		a = sap.ca.scfld.md.app.Application.getImpl();
		this.oi18nResourceBundle = a.AppI18nModel.getResourceBundle();
		this.oEventBus = a.getComponent().getEventBus();
		this.setDetailPageLoaded(false);
		if (!this.iListSize) {
			this.iListSize = this.bOutbox ? 300 : 100;
		}
		if (jQuery.sap.debug()) {
			this.bDebug = true;
		} else {
			this.bDebug = jQuery.sap.getUriParameters().get("sap-ui-debug") == "true" ? true : false;
		}
	},
	handleRequestCompleted: function(e) {
		if (e) {
			var r = e.getParameter("url");
			if (r && r.split("?")[0] === "TaskCollection" && e.getSource().oProcessingMultiSelect && e.getSource().oProcessingMultiSelect.bProcessing &&
				e.getParameters().success) {
				sap.ca.scfld.md.app.Application.getImpl().getComponent().getEventBus().publish("cross.fnd.fiori.inbox.dataManager",
					"multiSelectFilterCompleted", e.getSource().oProcessingMultiSelect);
			}
		}
		this.fnShowReleaseLoader(false);
	},
	handleRequestFailed: function(e) {
		if (e) {
			var r = e.getParameter("url");
			if (r && r.split("?")[0] === "TaskCollection") {
				this.handleTaskCollectionFailed(e);
			}
		}
		this.fnShowReleaseLoader(false);
	},
	handleTaskCollectionFailed: function(e) {
		var d = e.getParameter("response") ? e.getParameter("response").responseText : "";
		var E = {
			customMessage: {
				message: this.oi18nResourceBundle.getText("dialog.error.task_collection"),
				details: d
			},
			oEvent: e
		};
		this.oDataRequestFailed(E);
		if (!e.getSource().oProcessingMultiSelect) {
			this.oEventBus.publish("cross.fnd.fiori.inbox.dataManager", "taskCollectionFailed");
		} else {
			this.oEventBus.publish("cross.fnd.fiori.inbox.dataManager", "multiSelectFilterFailed");
		}
	},
	attachItemRemoved: function(d, f, l) {
		this.attachEvent(cross.fnd.fiori.inbox.util.DataManager.M_EVENTS.ItemRemoved, d, f, l);
		return this;
	},
	attachRefreshDetails: function(d, f, l) {
		this.attachEvent(cross.fnd.fiori.inbox.util.DataManager.M_EVENTS.refreshDetails, d, f, l);
		return this;
	},
	fireRefreshDetails: function(a) {
		this.fireEvent(cross.fnd.fiori.inbox.util.DataManager.M_EVENTS.refreshDetails, a);
		return this;
	},
	fireItemRemoved: function(a) {
		this.fireEvent(cross.fnd.fiori.inbox.util.DataManager.M_EVENTS.ItemRemoved, a);
		return this;
	},
	attachActionPerformed: function(d, f, l) {
		this.attachEvent(cross.fnd.fiori.inbox.util.DataManager.M_EVENTS.ActionPerformed, d, f, l);
		return this;
	},
	fireActionPerformed: function(a) {
		if (this.getPagingEnabled()) {
			this.oModel.refresh();
		}
		this.fireEvent(cross.fnd.fiori.inbox.util.DataManager.M_EVENTS.ActionPerformed, a);
		return this;
	},
	fetchTaskDefinitionsandCustomAttributeDefinitions: function(s) {
		var t = this;
		var c = "/" + t.sTaskDefinitionCollectionName;
		var e = {
			$expand: t.sCustomAttributeDefinitionNavProperty
		};
		var S = function(d, r) {
			t.oCustomAttributeDefinitions = {};
			var R = d.results;
			if (jQuery.isArray(R) && R.length > 0) {
				jQuery.each(R, function(i, T) {
					t.oCustomAttributeDefinitions[T.TaskDefinitionID] = T.CustomAttributeDefinitionData.results;
				});
			}
			s(d);
		};
		var E = function(o) {
			t.oDataRequestFailed(o);
		};
		this.oDataRead(c, e, S, E, "taskDefn");
	},
	loadInitialAppData: function(s) {
		if (!(this.sScenarioId || this.sClientScenario) || !this.oModel) {
			return null;
		}
		var t = this;
		if (this.sScenarioId) {
			var f = "(ConsumerType eq '" + jQuery.sap.encodeURL(this.sMode) + "') and (UniqueName eq '" + jQuery.sap.encodeURL(this.sScenarioId) +
				"')";
			var S = function(d) {
				if (d.hasOwnProperty("__batchResponses") && d.__batchResponses.length == 2) {
					var E = [];
					var F = d.__batchResponses[0];
					if (F.hasOwnProperty("data") && F.statusCode >= '200' && F.statusCode < '300') {
						t._processFilterOptionsResult(F.data);
					} else if (F.hasOwnProperty("response") && F.response.statusCode >= '400') {
						E.push(JSON.parse(F.response.body));
					}
					var C = d.__batchResponses[1];
					if (C.hasOwnProperty("data") && C.statusCode >= '200' && C.statusCode < '300') {
						s(t._processConsumerScenarioResult(C.data));
					} else if (C.hasOwnProperty("response") && C.response.statusCode >= '400') {
						E.push(JSON.parse(C.response.body));
					}
					t._handleBatchErrors(E);
				}
			};
			var e = function(E) {
				t.oDataRequestFailed(E);
			};
			var r = ["/FilterOptionCollection", "/ConsumerScenarioCollection"];
			t.fireBatch({
				aPaths: r,
				aUrlParameters: ["", "$filter=" + encodeURIComponent(f)],
				sMethod: "GET",
				sBatchGroupId: "FilterOptionsAndConsumerScenarioCollection",
				numberOfRequests: r.length,
				fnSuccessCallback: S,
				fnErrorCallback: e
			});
		} else if (this.sClientScenario) {
			var a = this.sClientScenario.trim().split(",");
			for (var i = (a.length - 1); i >= 0; i--) {
				a[i] = a[i].trim();
				if (a[i].length == 0) {
					a.splice(i, 1);
				}
			}
			if (a.length == 0) {
				this._clientScenarioRequestFailed();
				return;
			}
			var o = new Object();
			o.Origin = "";
			o.TaskDefinitionIDs = a;
			var c = this.getScenarioConfig();
			c.ScenarioServiceInfos = [o];
			this._oScenarioConfig = c;
			s(c);
		}
	},
	fireBatch: function(p, u) {
		var m = u ? this.oPostActionModel : this.oModel;
		if (m.hasPendingChanges()) {
			m.resetChanges();
		}
		m.setDeferredBatchGroups([p.sBatchGroupId]);
		var P;
		var e = {
			batchGroupId: p.sBatchGroupId
		};
		for (var i = 0; i < p.numberOfRequests; i++) {
			if (p.aUrlParameters) {
				e.urlParameters = p.aUrlParameters[i];
			}
			if (p.aProperties) {
				e.properties = p.aProperties[i];
			}
			if (p.sPath) {
				P = p.sPath;
			} else if (p.aPaths) {
				P = p.aPaths[i];
			}
			if (!jQuery.sap.startsWith(P, "/")) {
				P = "/" + P;
			}
			if (p.sMethod == "GET") {
				m.read(P, e);
			} else if (p.sMethod == "POST") {
				e.changeSetId = "changeSetId" + i;
				m.createEntry(P, e);
			} else if (p.sMethod == "DELETE") {
				e.changeSetId = "changeSetId" + i;
				m.remove(P, e);
			} else if (p.sMethod == "FUNCTIONIMPORT") {
				e.changeSetId = "changeSetId" + i;
				e.method = "POST";
				m.callFunction(P, e);
			}
		}
		m.submitChanges({
			batchGroupId: p.sBatchGroupId,
			success: p.fnSuccessCallback,
			error: p.fnErrorCallback
		});
	},
	_handleBatchErrors: function(e, c) {
		if (e.length > 0) {
			if (c) {
				var d = "";
				jQuery.each(e, $.proxy(function(f, E) {
					if (d.localeCompare(this.getErrorMessage(E) + "\n")) {
						d += this.getErrorMessage(E) + "\n";
					}
				}, this));
				var E = {
					customMessage: {
						message: c,
						details: d
					}
				};
			} else {
				var m = "";
				var b = "";
				for (var i = 0; i < e.length; i++) {
					if (e[i].hasOwnProperty("error")) {
						m += e[i].error.message.value;
					} else if (e[i].hasOwnProperty("response")) {
						m += e[i].message;
						var a = JSON.parse(e[i].response.body);
						b += a.error.message.value + "\n";
					}
					if (i < e.length - 1) {
						m += "\n";
					}
				}
				var E = {
					message: m,
					response: {
						body: b
					}
				};
			}
			this.oDataRequestFailed(E);
		}
	},
	processListAfterAction: function(o, i) {
		sap.ca.scfld.md.app.Application.getImpl().getComponent().getEventBus().publish("cross.fnd.fiori.inbox", "storeNextItemsToSelect", {
			"sOrigin": o,
			"sInstanceID": i
		});
	},
	_processConsumerScenarioResult: function(d) {
		if (d.results.length == 0) {
			this._scenarioRequestFailed();
			return;
		}
		var m = new RegExp(";o=([A-Z0-9_]+)/.+\\?\\$filter=(.+)");
		var f = new RegExp("TaskDefinitionID eq '(.+)'");
		var c = {};
		var s = {};
		jQuery.each(d.results, function(I, e) {
			var S = s[e.UniqueName];
			if (!S) {
				S = e;
				S.ScenarioServiceInfos = [];
				s[S.UniqueName] = S;
			} else {
				S.TotalItems = S.TotalItems + e.TotalItems;
			}
			var r = m.exec(e.ScenarioServiceURL);
			if (r) {
				var o = r[1];
				var t = [];
				var F = r[2].split(" or ");
				for (var i = 0; i < F.length; i++) {
					r = f.exec(F[i]);
					if (r) {
						t.push(r[1]);
					}
				}
				if (t.length > 0) {
					var a = {
						Origin: o,
						TaskDefinitionIDs: t
					};
					S.ScenarioServiceInfos.push(a);
				}
			}
		});
		jQuery.each(s, function(i, S) {
			c = S;
		});
		this._oScenarioConfig = c;
		return c;
	},
	getScenarioConfig: function() {
		var c = this._oScenarioConfig;
		if (c == null) {
			c = {};
		}
		c.AllItems = this.bAllItems;
		if (this.bIsMassActionEnabled != null) {
			c.IsMassActionEnabled = this.bIsMassActionEnabled;
		}
		if (c.IsMassActionEnabled === undefined) {
			c.IsMassActionEnabled = true;
		}
		if (this.bIsQuickActionEnabled != null) {
			c.IsQuickActionEnabled = this.bIsQuickActionEnabled;
		}
		if (c.IsQuickActionEnabled === undefined) {
			c.IsQuickActionEnabled = true;
		}
		if (this.sDefaultSortBy != null) {
			c.SortBy = this.sDefaultSortBy;
		}
		if (!c.SortBy) {
			c.SortBy = this.bOutbox ? this.sDefaultSortForOutbox : this.sDeafultSortForInbox;
		}
		if (!c.DisplayName) {
			if (c.AllItems) {
				c.DisplayName = this.oi18nResourceBundle.getText("ALL_ITEMS_SCENARIO_DISPLAY_NAME");
			} else if (this.sClientScenario) {
				c.DisplayName = this.oi18nResourceBundle.getText("CLIENT_SCENARIO_DISPLAY_NAME");
			}
		}
		return c;
	},
	getSubstitutionEnabled: function() {
		return this.bSubstitution;
	},
	getShowLogEnabled: function() {
		return this.bShowLog;
	},
	getTableViewOnPhone: function() {
		return this.tableViewOnPhone;
	},
	getTableView: function() {
		return this.tableView;
	},
	getListSize: function() {
		return this.iListSize;
	},
	setListSize: function(v) {
		this.iListSize = v;
	},
	getPageSize: function() {
		return this.iPageSize;
	},
	getCacheSize: function() {
		return this.iCacheSize;
	},
	getOperationMode: function() {
		return this.sOperationMode;
	},
	getPagingEnabled: function() {
		return this.bEnablePaging;
	},
	isForwardUserSettings: function() {
		return this.bPropogateSapURLParameters;
	},
	_scenarioRequestFailed: function() {
		var e = {
			customMessage: {
				message: this.oi18nResourceBundle.getText("DataManager.scenarioReadFailed"),
				details: this.oi18nResourceBundle.getText("DataManager.scenarioReadFailedDetail")
			}
		};
		this.oDataRequestFailed(e);
	},
	_clientScenarioRequestFailed: function() {
		var e = {
			customMessage: {
				message: this.oi18nResourceBundle.getText("DataManager.clientScenarioReadFailed"),
				details: this.oi18nResourceBundle.getText("DataManager.clientScenarioReadFailedDetail", this.sClientScenario)
			}
		};
		this.oDataRequestFailed(e);
	},
	sendMultiAction: function(f, I, d, n, o, a, h) {
		var p = [];
		var t = this;
		var T;
		var c = [];
		for (var b in I) {
			T = I[b];
			var P = {
				SAP__Origin: "'" + jQuery.sap.encodeURL(T.SAP__Origin) + "'",
				InstanceID: "'" + jQuery.sap.encodeURL(T.InstanceID) + "'"
			};
			if (d && d.DecisionKey) {
				P.DecisionKey = "'" + d.DecisionKey + "'";
			}
			if (n && n.length > 0) {
				P.Comments = "'" + n + "'";
			}
			p.push(P);
		}
		var s = function(D) {
			if (h) {
				t.fnShowReleaseLoader(false);
			}
			var B = D.__batchResponses;
			var S = [];
			var E = [];
			for (var i = 0; i < B.length; i++) {
				var g = B[i];
				var j = I[i];
				var k = false;
				if (g.hasOwnProperty("__changeResponses")) {
					var C = g.__changeResponses[0];
					if (C.statusCode >= "200" && C.statusCode < "300") {
						k = true;
						c.push({
							index: i,
							oData: C.data
						});
					}
				}
				if (k) {
					j.message = t.oi18nResourceBundle.getText("multi.processed");
					S.push(j);
				} else {
					if (g.response) {
						j.message = JSON.parse(g.response.body).error.message.value;
						E.push(j);
					}
				}
			}
			if (o) {
				o(S, E, c);
			}
		};
		var e = function(E) {
			if (h) {
				t.fnShowReleaseLoader(false);
			}
			t.oDataRequestFailed(E);
			if (a) {
				a(E);
			}
		};
		if (h) {
			t.fnShowReleaseLoader(true);
		}
		t.fireBatch({
			sPath: f,
			aUrlParameters: p,
			sMethod: "POST",
			sBatchGroupId: "SendMultiAction",
			numberOfRequests: I.length,
			fnSuccessCallback: s,
			fnErrorCallback: e
		});
	},
	readDataOnTaskSelection: function(c, e, t, o, I, T, s) {
		if (!c || !o || !I) {
			return null;
		}
		var a = this;
		var r = [];
		var p = [];
		var E = "";
		r.push(c);
		for (var i = 0; i < e.length; i++) {
			if (E !== "") {
				E = E + ",";
			}
			E = E + e[i];
		}
		if (E !== "") {
			p.push({
				$expand: E,
				$select: E + ",Status,TaskTitle"
			});
		} else {
			p.push("");
		}
		if (!a.oCustomAttributeDefinitions[T]) {
			r.push("/" + a.sTaskDefinitionCollectionName + "(SAP__Origin='" + jQuery.sap.encodeURL(o) + "',TaskDefinitionID='" + jQuery.sap.encodeURL(
				T) + "')" + "/" + a.sCustomAttributeDefinitionNavProperty);
			p.push("");
		}
		if (t != null) {
			for (var i = 0; i < t.length; i++) {
				r.push(c + "/" + t[i] + "/$count");
				p.push("");
			}
		}
		var S = $.proxy(function(r, d) {
			a.setDetailPageLoaded(true);
			var v = {};
			v.bValue = false;
			a.oEventBus.publish("cross.fnd.fiori.inbox.dataManager", "showReleaseLoaderOnInfoTab", v);
			if (d.hasOwnProperty("__batchResponses") && d.__batchResponses.length > 0) {
				var b = jQuery.extend(true, {}, d.__batchResponses[0]);
				if (b.hasOwnProperty("data") && b.statusCode >= '200' && b.statusCode < '300') {
					var g = b.data;
					var h = {};
					for (var i = 1; i < d.__batchResponses.length; i++) {
						switch (true) {
							case (r[i].indexOf("CustomAttributeDefinitionData") !== -1):
								var C = d.__batchResponses[i];
								if (C.hasOwnProperty("data") && C.statusCode >= '200' && C.statusCode < '300') {
									a.oCustomAttributeDefinitions[T] = C.data.results;
								}
								break;
							case (r[i].indexOf("Comments/$count") !== -1):
								var j = d.__batchResponses[i];
								if (j.hasOwnProperty("data") && j.statusCode >= '200' && j.statusCode < '300') {
									h.sCommentsCount = j.data;
								}
								break;
							case (r[i].indexOf("Attachments/$count") !== -1):
								var A = d.__batchResponses[i];
								if (A.hasOwnProperty("data") && A.statusCode >= '200' && A.statusCode < '300') {
									h.sAttachmentsCount = A.data;
								}
								break;
							case (r[i].indexOf("TaskObjects/$count") !== -1):
								var k = d.__batchResponses[i];
								if (k.hasOwnProperty("data") && k.statusCode >= '200' && k.statusCode < '300') {
									h.sTaskObjectsCount = k.data;
								}
						}
					}
					s(g, a.oCustomAttributeDefinitions[T], h);
				} else {
					a._refreshListOnError(o, I);
				}
			}
		}, null, r);
		var f = function(b) {
			var v = {};
			v.bValue = false;
			a.oEventBus.publish("cross.fnd.fiori.inbox.dataManager", "showReleaseLoaderOnInfoTab", v);
			a.oDataRequestFailed(b);
		};
		var v = {};
		v.bValue = true;
		a.oEventBus.publish("cross.fnd.fiori.inbox.dataManager", "showReleaseLoaderOnInfoTab", v);
		a.setDetailPageLoaded(false);
		a.fireBatch({
			aPaths: r,
			aUrlParameters: p,
			sMethod: "GET",
			sBatchGroupId: "DetailWithDecisionOptions",
			numberOfRequests: r.length,
			fnSuccessCallback: S,
			fnErrorCallback: f
		});
	},
	readCustomAttributeDefinitionData: function(o, t, s) {
		var a = this;
		var c = "/" + a.sTaskDefinitionCollectionName + "(SAP__Origin='" + jQuery.sap.encodeURL(o) + "',TaskDefinitionID='" + jQuery.sap.encodeURL(
			t) + "')";
		var e = {
			$expand: a.sCustomAttributeDefinitionNavProperty
		};
		var S = function(d, r) {
			s(d);
		};
		var E = function(b) {
			a.oDataRequestFailed(b);
		};
		this.oDataRead(c, e, S, E);
	},
	readDecisionOptions: function(o, i, t, a, b, h) {
		var c = this;
		if (h) {
			c.fnShowReleaseLoader(true);
		}
		this.oDataRead("/" + this.FUNCTION_IMPORT_DECISIONOPTIONS, {
			SAP__Origin: "'" + o + "'",
			InstanceID: "'" + i + "'"
		}, function(d, r) {
			if (h) {
				c.fnShowReleaseLoader(false);
			}
			if (d && d.results) {
				c.oDecisionOptions[o + t] = d.results;
				if (a) {
					a(d.results);
				}
			}
		}, function(e) {
			if (h) {
				c.fnShowReleaseLoader(false);
			}
			c.oDataRequestFailed(e);
			if (b) {
				b(e);
			}
		}, "decisionOptions");
	},
	_doReadDetail: function(c, e, I, s, E) {
		var a;
		if (!I) var i = e.indexOf("Comments/CreatedByDetails");
		if (i >= 0) {
			e[i] = "Comments";
		}
		a = {
			$expand: e.join(",")
		};
		this.oDataRead(c, a, s, E);
	},
	readPotentialOwners: function(o, i, s, e) {
		var t = this;
		t.fnShowLoaderInDialogs(true);
		this.oDataRead("/TaskCollection(SAP__Origin='" + jQuery.sap.encodeURL(o) + "',InstanceID='" + jQuery.sap.encodeURL(i) +
			"')/PotentialOwners", null,
			function(d, r) {
				t.fnShowLoaderInDialogs(false);
				if (d) {
					if (s) {
						s(d);
					}
				}
			},
			function(E) {
				t.fnShowLoaderInDialogs(false);
				t.oDataRequestFailed(E);
				if (e) {
					e(E);
				}
			});
	},
	readDescription: function(o, i, s, e) {
		var t = this;
		if (t.oDescriptions[o + i]) {
			if (s) {
				s(t.oDescriptions[o + i]);
			}
			return;
		}
		t.oDataRead("/TaskCollection(SAP__Origin='" + jQuery.sap.encodeURL(o) + "',InstanceID='" + jQuery.sap.encodeURL(i) + "')/Description",
			null,
			function(d, r) {
				if (d) {
					t.oDescriptions[o + i] = d;
					if (s) {
						s(d);
					}
				}
			},
			function(E) {
				t.oDataRequestFailed(E);
				if (e) {
					e(E);
				}
			});
	},
	readUserInfo: function(s, u, S, e, c) {
		var t = this;
		if (!c) {
			t.fnShowReleaseLoader(true);
		}
		this.oDataRead("/UserInfoCollection(SAP__Origin='" + jQuery.sap.encodeURL(s) + "',UniqueName='" + jQuery.sap.encodeURL(u) + "')", null,
			function(d, r) {
				if (!c) {
					t.fnShowReleaseLoader(false);
				}
				if (d) {
					S(d);
				}
			},
			function(E) {
				if (!c) {
					t.fnShowReleaseLoader(false);
				}
				t.oDataRequestFailed(E);
				if (e) {
					e(E);
				}
			});
	},
	_processFilterOptionsResult: function(d) {
		this.oPriorityMap = {};
		this.oStatusMap = {};
		var n;
		jQuery.each(d.results, $.proxy(function(i, e) {
			if (e.Type == "PRIORITY") {
				if (!this.oPriorityMap.hasOwnProperty(e.SAP__Origin)) {
					this.oPriorityMap[e.SAP__Origin] = {};
				}
				n = this.oPriorityMap[e.SAP__Origin];
				n[e.TechnicalName] = e.DisplayName;
			} else if (e.Type == "STATUS") {
				if (!this.oStatusMap.hasOwnProperty(e.SAP__Origin)) {
					this.oStatusMap[e.SAP__Origin] = {};
				}
				n = this.oStatusMap[e.SAP__Origin];
				n[e.TechnicalName] = e.DisplayName;
			}
		}, this));
	},
	getPriorityDisplayName: function(o, t) {
		var n;
		if (o == null || t == null) {
			throw "sOrigin and sTechnicalName mustn't be null";
		}
		if (this.oPriorityMap && this.oPriorityMap.hasOwnProperty(o)) {
			n = this.oPriorityMap[o];
			if (n.hasOwnProperty(t)) {
				return n[t];
			}
		}
		return null;
	},
	getStatusDisplayName: function(o, t) {
		var n;
		if (o == null || t == null) {
			throw "sOrigin and sTechnicalName mustn't be null";
		}
		if (this.oStatusMap && this.oStatusMap.hasOwnProperty(o)) {
			n = this.oStatusMap[o];
			if (n.hasOwnProperty(t)) {
				return n[t];
			}
		}
		return null;
	},
	getErrorMessageKey: function(f) {
		switch (f) {
			case this.sReleaseAction:
				return "dialog.error.release";
			case this.sClaimAction:
				return "dialog.error.claim";
			case this.sResumeAction:
				return "dialog.error.resume";
			default:
				return "dialog.error.generic.action";
		}
	},
	sendAction: function(f, d, n, s, e) {
		this.fnShowReleaseLoader(true);
		var E = this.oi18nResourceBundle.getText(this.getErrorMessageKey(f));
		var u = {
			SAP__Origin: "'" + encodeURIComponent(d.SAP__Origin) + "'",
			InstanceID: "'" + (d.InstanceID) + "'"
		};
		if (d.DecisionKey) {
			u.DecisionKey = "'" + d.DecisionKey + "'";
		}
		if (n && n.length > 0) {
			u.Comments = "'" + n + "'";
		}
		this._performPost("/" + f, d.SAP__Origin, u, $.proxy(function(d, s) {
			this.fnShowReleaseLoader(false);
			this.processListAfterAction(d.SAP__Origin, d.InstanceID);
			this.triggerRefresh("SENDACTION", this.ACTION_SUCCESS);
			this.fireActionPerformed();
			if (s) {
				s();
			}
		}, this, d, s), $.proxy(function(o) {
			this.fnShowReleaseLoader(false);
			if (e) {
				e(o);
			}
			this.processListAfterAction(d.SAP__Origin, d.InstanceID);
			this.fireActionPerformed();
			this.triggerRefresh("SENDACTION", this.ACTION_FAILURE);
		}, this), E);
	},
	triggerRefresh: function(a, s) {
		var A = {},
			i, I = sap.ui.Device.system.phone;
		i = this.getTableView() && (!I || this.getTableViewOnPhone());
		A.bIsTableViewActive = i;
		A.sAction = a;
		A.sStatus = s;
		if (i || I) {
			this.fireRefreshDetails(A);
		}
	},
	doForward: function(o, i, u, n, s, e) {
		var U = {
			SAP__Origin: "'" + o + "'",
			InstanceID: "'" + i + "'",
			ForwardTo: "'" + u + "'",
			Comments: "'" + n + "'"
		};
		this.fnShowReleaseLoader(true);
		this._performPost("/Forward", o, U, $.proxy(function(d, r) {
			this.fnShowReleaseLoader(false);
			this.processListAfterAction(o, i);
			this.triggerRefresh("FORWARD", this.ACTION_SUCCESS);
			this.fireActionPerformed();
			s();
		}, this), $.proxy(function() {
			this.fnShowReleaseLoader(false);
			this.processListAfterAction(o, i);
			this.triggerRefresh("FORWARD", this.ACTION_FAILURE);
			this.fireActionPerformed();
			if (e) {
				e();
			}
		}, this), this.oi18nResourceBundle.getText("dialog.error.forward"));
	},
	doResubmit: function(o, i, r, s, e) {
		var u = "SAP__Origin=" + "'" + o + "'" + "&InstanceID=" + "'" + i + "'" + "&ResubmissionDate=" + r;
		this.fnShowReleaseLoader(true);
		this._performPost("/" + this.FUNCTION_IMPORT_RESUBMIT, o, u, $.proxy(function() {
			this.fnShowReleaseLoader(false);
			this.processListAfterAction(o, i);
			this.triggerRefresh("RESUBMIT", this.ACTION_SUCCESS);
			this.fireActionPerformed();
			s();
		}, this), $.proxy(function() {
			this.fnShowReleaseLoader(false);
			this.processListAfterAction(o, i);
			this.triggerRefresh("RESUBMIT", this.ACTION_FAILURE);
			this.fireActionPerformed();
			if (e) {
				e();
			}
		}, this), this.oi18nResourceBundle.getText("dialog.error.resubmit"));
	},
	doMassClaimRelease: function(I, a, s, e) {
		var t = this;
		var r = [];
		var p = [];
		for (var i = 0; i < I.length; i++) {
			var o = I[i].getBindingContext().getObject();
			r.push("/" + a);
			var P = "SAP__Origin='" + jQuery.sap.encodeURL(o.SAP__Origin) + "'&InstanceID='" + jQuery.sap.encodeURL(o.InstanceID) + "'";
			p.push(P);
		}
		var S = function(d) {
			t.fireActionPerformed();
			t.fnShowReleaseLoader(false);
			var b = d.__batchResponses;
			var c = [];
			var f = [];
			for (var i = 0; i < b.length; i++) {
				var B = b[i];
				var o = I[i].getBindingContext().getObject();
				var g = false;
				if (B.hasOwnProperty("__changeResponses")) {
					var C = B.__changeResponses[0];
					if (C.statusCode >= "200" && C.statusCode < "300") {
						g = true;
					}
				}
				if (g) {
					o.message = t.oi18nResourceBundle.getText("multi.processed");
					c.push(o);
				} else {
					if (B.response) {
						o.message = JSON.parse(B.response.body).error.message.value;
						f.push(o);
					}
				}
			}
			if (s) {
				s(c, f);
			}
		};
		var E = function(b) {
			t.fireActionPerformed();
			t.fnShowReleaseLoader(false);
			t.oDataRequestFailed(b);
			if (e) {
				e(b);
			}
		};
		t.fnShowReleaseLoader(true);
		t.oModel.setRefreshAfterChange(false);
		t.fireBatch({
			aPaths: r,
			aUrlParameters: p,
			sMethod: "POST",
			sBatchGroupId: "massClaimRelease",
			numberOfRequests: r.length,
			fnSuccessCallback: S,
			fnErrorCallback: E
		});
	},
	doMassForward: function(I, a, n, s, e) {
		var r = [];
		var p = [];
		var t = this;
		for (var i = 0; i < I.length; i++) {
			var o = I[i];
			var P = "/Forward";
			var b = "SAP__Origin='" + jQuery.sap.encodeURL(o.SAP__Origin) + "'&InstanceID='" + jQuery.sap.encodeURL(o.InstanceID) +
				"'&ForwardTo='" + jQuery.sap.encodeURL(a.UniqueName) + "'";
			if (n && n.length > 0) {
				b += "&Comments='" + jQuery.sap.encodeURL(n) + "'";
			}
			r.push(P);
			p.push(b);
		}
		var S = function(d) {
			t.fireActionPerformed();
			t.fnShowReleaseLoader(false);
			var B = d.__batchResponses;
			var c = [];
			var f = [];
			for (var i = 0; i < B.length; i++) {
				var g = B[i];
				var o = I[i];
				var h = false;
				if (g.hasOwnProperty("__changeResponses")) {
					var C = g.__changeResponses[0];
					if (C.statusCode >= "200" && C.statusCode < "300") {
						h = true;
					}
				}
				if (h) {
					o.message = t.oi18nResourceBundle.getText("multi.processed");
					c.push(o);
				} else {
					if (g.response) {
						o.message = JSON.parse(g.response.body).error.message.value;
						f.push(o);
					}
				}
			}
			if (s) {
				s(c, f, a);
			}
		};
		var E = function(c) {
			t.fireActionPerformed();
			t.fnShowReleaseLoader(false);
			t.oDataRequestFailed(c);
			if (e) {
				e(c);
			}
		};
		t.fnShowReleaseLoader(true);
		t.oModel.setRefreshAfterChange(false);
		t.fireBatch({
			aPaths: r,
			aUrlParameters: p,
			sMethod: "POST",
			sBatchGroupId: "massForward",
			numberOfRequests: r.length,
			fnSuccessCallback: S,
			fnErrorCallback: E
		});
	},
	doMassResubmit: function(I, r, s, e, h) {
		var R = [];
		var p = [];
		var t = this;
		var c = [];
		for (var i = 0; i < I.length; i++) {
			var o = I[i];
			var P = "/" + this.FUNCTION_IMPORT_RESUBMIT;
			var a = "SAP__Origin='" + jQuery.sap.encodeURL(o.SAP__Origin) + "'&InstanceID='" + jQuery.sap.encodeURL(o.InstanceID) +
				"'&ResubmissionDate=" + r;
			R.push(P);
			p.push(a);
		}
		var S = function(d) {
			t.fireActionPerformed();
			if (h) {
				t.fnShowReleaseLoader(false);
			}
			var b = d.__batchResponses;
			var f = [];
			var g = [];
			for (var i = 0; i < b.length; i++) {
				var B = b[i];
				var o = I[i];
				var j = false;
				if (B.hasOwnProperty("__changeResponses")) {
					var C = B.__changeResponses[0];
					if (C.statusCode >= "200" && C.statusCode < "300") {
						j = true;
						c.push({
							index: i,
							oData: C.data
						});
					}
				}
				if (j) {
					o.message = t.oi18nResourceBundle.getText("multi.processed");
					f.push(o);
				} else {
					if (B.response) {
						o.message = JSON.parse(B.response.body).error.message.value;
						g.push(o);
					}
				}
			}
			if (s) {
				s(f, g, c);
			}
		};
		var E = function(b) {
			t.fireActionPerformed();
			if (h) {
				t.fnShowReleaseLoader(false);
			}
			t.oDataRequestFailed(b);
			if (e) {
				e(b);
			}
		};
		t.oModel.setRefreshAfterChange(false);
		t.fireBatch({
			aPaths: R,
			aUrlParameters: p,
			sMethod: "POST",
			sBatchGroupId: "massResubmit",
			numberOfRequests: R.length,
			fnSuccessCallback: S,
			fnErrorCallback: E
		});
	},
	searchUsers: function(o, s, m, S) {
		this.fnShowLoaderInDialogs(true);
		var t = this;
		var p = {
			SAP__Origin: "'" + o + "'",
			SearchPattern: "'" + s + "'",
			MaxResults: m
		};
		this.oDataRead("/SearchUsers", p, function(d, r) {
			t.fnShowLoaderInDialogs(false);
			if (d && d.results) {
				if (S) {
					S(d.results);
				}
			}
		}, function(e) {
			t.fnShowLoaderInDialogs(false);
			t.oDataRequestFailed(e);
		});
	},
	_performPost: function(p, o, u, s, e, E) {
		this.oDataCreate(p, o, u, undefined, undefined, $.proxy(function(d, r) {
			$.sap.log.info("successful action");
			if (s) {
				$.proxy(s(d, r), this);
			}
		}, this), $.proxy(function(a) {
			if (E) {
				var d = this.getErrorMessage(a);
				var a = {
					customMessage: {
						message: E,
						details: d
					}
				};
			} else {
				var d = this.getErrorMessage(a);
				var a = {
					customMessage: {
						message: a.message,
						details: d
					}
				};
				a.customMessage.details = d;
			}
			this.oDataRequestFailed(a, e);
		}, this));
	},
	oDataRequestFailed: function(e, E) {
		var m;
		var d;
		if (e.hasOwnProperty("customMessage")) {
			m = e.customMessage.message;
			d = e.customMessage.details;
		} else {
			if (e.response && e.response.statusCode == "0") {
				m = this.oi18nResourceBundle.getText("DataManager.connectionError");
			} else {
				m = this.oi18nResourceBundle.getText("DataManager.HTTPRequestFailed");
			}
			if (e.response && e.response.body != "" && e.response.statusCode == "400") {
				var p = JSON.parse(e.response.body);
				d = p.error.message.value;
			} else {
				d = e.response ? e.response.body : null;
			}
		}
		var P = {
			message: m,
			responseText: d
		};
		this.showLocalErrorMessage(P, E);
		this.oModel.fireRequestFailed(P);
	},
	oDataRead: function(p, u, s, e, g) {
		this.oModel.read(p, {
			urlParameters: u,
			success: s,
			error: e,
			groupId: g
		});
	},
	oDataCreate: function(p, o, u, d, c, s, e) {
		var S = {
			context: c,
			success: s,
			error: e,
			urlParameters: u
		};
		this.oModel.create(p, d, S);
	},
	oDataAddOperationsAndSubmitBatch: function(r, c, s, e, a) {
		this.oPostActionModel.clearBatch();
		if (r) {
			this.oPostActionModel.addBatchReadOperations(r);
		}
		if (c) {
			for (var i = 0; i < c.length; i++) {
				this.oPostActionModel.addBatchChangeOperations([c[i]]);
			}
		}
		this.oPostActionModel.submitBatch(s, e, a);
	},
	oDataConvertHeaders: function(c, h) {
		for (var H in h) {
			if (H !== c && H.toLowerCase() === c.toLowerCase()) {
				var o = h[H];
				delete h[H];
				h[c] = o;
				break;
			}
		}
	},
	addComment: function(s, i, c, S, e) {
		var u = {
			SAP__Origin: "'" + s + "'",
			InstanceID: "'" + i + "'",
			Text: "'" + c + "'"
		};
		this._performPost("/AddComment", s, u, $.proxy(function(d, r) {
			if (S) {
				S(d, r);
			}
		}, this), $.proxy(function(E) {
			if (e) {
				e(E);
			}
		}, this), this.oi18nResourceBundle.getText("dialog.error.addComment"));
	},
	_createSubstitutionRule: function(a, p, s, e) {
		var r = [];
		var P = [];
		var b = [];
		var t = this;
		jQuery.each(p, function(i, c) {
			var T = {};
			T = jQuery.extend(true, {}, a);
			T.SAP__Origin = c;
			r.push("/SubstitutionRuleCollection");
			P.push("");
			b.push(T);
		});
		var S = function(d) {
			t.fnShowReleaseLoader(false);
			var B = d.__batchResponses;
			var c = [];
			var f = [];
			jQuery.each(B, function(i, o) {
				var h = false;
				if (o.hasOwnProperty("__changeResponses")) {
					var C = o.__changeResponses[0];
					if (C.statusCode >= "200" && C.statusCode < "300") {
						h = true;
					}
				}
				if (h) {
					c.push(i);
				} else {
					f.push(o);
				}
			});
			if (f.length > 0) {
				var g = c.length > 0 ? t.oi18nResourceBundle.getText("substn.create.multi.error") : t.oi18nResourceBundle.getText(
					"substn.create.error");
				t._handleBatchErrors(f, g);
			}
			if (s) {
				s(c, f);
			}
			t.fnShowReleaseLoader(false);
		};
		var E = function(o) {
			t.fnShowReleaseLoader(false);
			t.oDataRequestFailed(o);
			if (e) {
				e(o);
			}
		};
		t.fnShowReleaseLoader(true);
		t.fireBatch({
			aPaths: r,
			aUrlParameters: P,
			sMethod: "POST",
			sBatchGroupId: "CreateSubstitutionRule",
			numberOfRequests: r.length,
			fnSuccessCallback: S,
			fnErrorCallback: E,
			aProperties: b
		});
	},
	showLocalErrorMessage: function(e, E) {
		var s = {
			type: sap.ca.ui.message.Type.ERROR,
			message: e.message,
			details: e.responseText
		};
		this.showMessageBox(s, E);
	},
	showMessageBox: function(s, e) {
		sap.ca.ui.message.showMessageBox(s, e);
	},
	readSubstitutionData: function(s) {
		var t = this;
		var r = [];
		var p = [];
		var c = new cross.fnd.fiori.inbox.Configuration();
		var i = c.getServiceList()[0].serviceUrl === "/bpmodata/tasks.svc/";
		r.push("/SubstitutionRuleCollection");
		p.push("");
		if (!this.aSystemInfoCollection && !i) {
			r.push("/SystemInfoCollection");
			p.push("");
		}
		if (!this.aSubstitutionProfilesCollection) {
			r.push("/SubstitutionProfileCollection");
			p.push("");
		}
		var S = function(d) {
			if (d.hasOwnProperty("__batchResponses") && d.__batchResponses.length >= 1) {
				var E = [];
				if (d.__batchResponses.length == 3) {
					var o = d.__batchResponses[2];
					if (!(E.length > 0) && o.hasOwnProperty("data") && o.statusCode >= '200' && o.statusCode < '300') {
						t.aSubstitutionProfilesCollection = o.data.results;
					} else if (o.hasOwnProperty("response") && o.response.statusCode >= '400') {
						E.push(JSON.parse(o.response.body));
					}
					var a = d.__batchResponses[1];
					if (!(E.length > 0) && a.hasOwnProperty("data") && a.statusCode >= '200' && a.statusCode < '300') {
						t.aSystemInfoCollection = a.data.results;
					} else if (a.hasOwnProperty("response") && a.response.statusCode >= '400') {
						E.push(JSON.parse(a.response.body));
					}
				} else if (d.__batchResponses.length == 2 && i) {
					var o = d.__batchResponses[1];
					if (!(E.length > 0) && o.hasOwnProperty("data") && o.statusCode >= '200' && o.statusCode < '300') {
						t.aSubstitutionProfilesCollection = o.data.results;
					} else if (o.hasOwnProperty("response") && o.response.statusCode >= '400') {
						E.push(JSON.parse(o.response.body));
					}
					t.aSystemInfoCollection = [{
						SAP__Origin: "NA",
						SystemAlias: "NA",
						SystemType: "BPM"
					}];
				}
				var b = d.__batchResponses[0];
				if (!(E.length > 0) && b.hasOwnProperty("data") && b.statusCode >= '200' && b.statusCode < '300') {
					s(b.data, t.aSubstitutionProfilesCollection, t.aSystemInfoCollection);
				} else if (b.hasOwnProperty("response") && b.response.statusCode >= '400') {
					E.push(JSON.parse(b.response.body));
				}
				t.fnShowReleaseLoader(false);
				t._handleBatchErrors(E);
			}
		};
		var e = function(E) {
			t.fnShowReleaseLoader(false);
			t.oDataRequestFailed(E);
		};
		t.fnShowReleaseLoader(true);
		t.fireBatch({
			aPaths: r,
			aUrlParameters: p,
			sMethod: "GET",
			sBatchGroupId: "SubstitutionData",
			numberOfRequests: r.length,
			fnSuccessCallback: S,
			fnErrorCallback: e
		});
	},
	updateSubstitutionRule: function(a, e, s, E) {
		var r = [];
		var p = [];
		var t = this;
		var u = cross.fnd.fiori.inbox.Substitution.formatterSubstitutedUserName(a.User, a.FullName);
		var R = e ? a.aDisabledRules : a.aEnabledRules;
		for (var i = 0; i < R.length; i++) {
			var I = R[i];
			var P = "/" + t.FUNCTION_IMPORT_ENABLESUBSTITUTIONRULE;
			var o = {
				SubstitutionRuleID: "'" + I.subRuleId + "'",
				SAP__Origin: "'" + I.sOrigin + "'",
				Enabled: e
			};
			r.push(P);
			p.push(o);
		}
		var S = function(d) {
			var b = [];
			var c = [];
			var B = d.__batchResponses;
			var m;
			jQuery.each(B, function(g, h) {
				var j = false;
				if (h.hasOwnProperty("__changeResponses")) {
					var C = h.__changeResponses[0];
					if (C.statusCode >= "200" && C.statusCode < "300") {
						c.push(g);
						j = true;
					}
				}
				if (!j) {
					b.push(h);
				}
			});
			if (c.length > 0 && b.length === 0) {
				jQuery.sap.delayedCall(500, t, function() {
					m = e ? t.oi18nResourceBundle.getText("addInbox.enable.rule.success", u) : t.oi18nResourceBundle.getText(
						"addInbox.disable.rule.success", u);
					sap.ca.ui.message.showMessageToast(m);
				});
			} else {
				if (c.length === 0) {
					m = t.oi18nResourceBundle.getText("addInbox.action.error");
				} else {
					m = e ? t.oi18nResourceBundle.getText("addInbox.enable.rule.partial.success", u) : t.oi18nResourceBundle.getText(
						"addInbox.disable.rule.partial.success", u);
				}
			}
			t._handleBatchErrors(b, m);
			if (s) {
				s(c.length);
			}
		};
		var f = function(d) {
			var D = t.getErrorMessage(b);
			var b = {
				customMessage: {
					message: t.oi18nResourceBundle.getText("addInbox.action.error"),
					details: D
				}
			};
			t.oDataRequestFailed(b);
			if (E) {
				E();
			}
		};
		t.fireBatch({
			aPaths: r,
			aUrlParameters: p,
			sMethod: "POST",
			sBatchGroupId: "updateSubstitution",
			numberOfRequests: r.length,
			fnSuccessCallback: S,
			fnErrorCallback: f
		});
	},
	deleteAttachment: function(s, i, a, S, e) {
		var p = "/AttachmentCollection(SAP__Origin='" + jQuery.sap.encodeURL(s) + "',InstanceID='" + jQuery.sap.encodeURL(i) + "',ID='" +
			jQuery.sap.encodeURL(a) + "')/$value";
		var r = [];
		r.push(p);
		var f = function() {
			S();
		};
		var E = function() {
			e();
		};
		this.fireBatch({
			aPaths: r,
			aUrlParameters: "",
			sMethod: "DELETE",
			sBatchGroupId: "DeleteAttachment",
			numberOfRequests: r.length,
			fnSuccessCallback: f,
			fnErrorCallback: E
		});
	},
	deleteSubstitution: function(r, s) {
		var t = this;
		this.fnShowReleaseLoader(true);
		if (r.length === 1) {
			var u = {
				SubstitutionRuleID: "'" + r[0].SubstitutionRuleId + "'",
				SAP__Origin: "'" + r[0].SAP__Origin + "'"
			};
			var e = function() {
				t.fnShowReleaseLoader(false);
			};
			var S = function(d) {
				t.fnShowReleaseLoader(false);
				s(d);
			};
			this._performPost("/DeleteSubstitutionRule", r[0].SAP__Origin, u, S, e, this.oi18nResourceBundle.getText("substn.delete.error"));
		} else if (r.length > 1) {
			var R = [];
			var p = [];
			jQuery.each(r, $.proxy(function(i, o) {
				var a = this.getDeleteSubtnEntry(o);
				R.push(a.rule);
				p.push(a.parameters);
			}, this));
			var S = function(d) {
				t.fnShowReleaseLoader(false);
				var b = d.__batchResponses;
				var a = [];
				var c = [];
				var D = "";
				jQuery.each(b, function(i, B) {
					var g = false;
					if (B.hasOwnProperty("__changeResponses")) {
						var C = B.__changeResponses[0];
						if (C.statusCode >= "200" && C.statusCode < "300") {
							a.push(i);
							g = true;
						}
					}
					if (!g) {
						c.push(B);
					}
				});
				if (a.length > 0) {
					s(a, c);
				}
				if (c.length > 0) {
					var f = a.length > 0 ? this.oi18nResourceBundle.getText("substn.delete.multi.error") : this.oi18nResourceBundle.getText(
						"substn.delete.error");
					this._handleBatchErrors(c, f);
				}
			};
			var E = function(o) {
				t.fnShowReleaseLoader(false);
				var d = this.getErrorMessage(o);
				var o = {
					customMessage: {
						message: this.oi18nResourceBundle.getText("substn.delete.error"),
						details: d
					}
				};
				this.oDataRequestFailed(o);
			};
			t.fireBatch({
				aPaths: R,
				aUrlParameters: p,
				sMethod: "FUNCTIONIMPORT",
				sBatchGroupId: "DeleteSubstitution",
				numberOfRequests: R.length,
				fnSuccessCallback: S,
				fnErrorCallback: E
			});
		}
	},
	getDeleteSubtnEntry: function(r) {
		return {
			rule: "/DeleteSubstitutionRule",
			parameters: {
				SubstitutionRuleID: r.SubstitutionRuleId,
				SAP__Origin: r.SAP__Origin
			}
		};
	},
	getErrorMessage: function(E) {
		if (E.response && E.response.body && E.response.body != "") {
			try {
				var m = JSON.parse(E.response.body);
				return (m.error.message.value ? m.error.message.value : null);
			} catch (e) {
				return E.response.body;
			}
		} else if (E.responseText && E.responseText != "") {
			try {
				var m = JSON.parse(E.responseText);
				return (m.error.message.value ? m.error.message.value : null);
			} catch (e) {
				return E.responseText;
			}
		} else if (E.getParameter("responseText") || E.getParameter("response").body) {
			return E.getParameter("responseText") ? E.getParameter("responseText") : E.getParameter("response").body;
		} else {
			return null;
		}
	},
	readSubstitutionProfiles: function(o, a) {
		if (this.aSubstitutionProfilesCollection) {
			if (o) {
				o(this.aSubstitutionProfilesCollection);
			}
			return;
		}
		var t = this;
		t.fnShowReleaseLoader(true);
		this.oDataRead("/SubstitutionProfileCollection", null, function(d, r) {
			t.fnShowReleaseLoader(false);
			if (d && d.results) {
				if (o) {
					o(d.results);
				}
			}
		}, function(e) {
			t.fnShowReleaseLoader(false);
			t.oDataRequestFailed(e);
			if (a) {
				a(e);
			}
		});
	},
	readSystemInfoCollection: function(o, a) {
		if (this.aSystemInfoCollection) {
			if (o) {
				o(this.aSystemInfoCollection);
			}
			return;
		}
		var c = new cross.fnd.fiori.inbox.Configuration();
		var i = c.getServiceList()[0].serviceUrl === "/bpmodata/tasks.svc/";
		if (i) {
			this.aSystemInfoCollection = [{
				SAP__Origin: "NA",
				SystemAlias: "NA",
				SystemType: "BPM"
			}];
			if (o) {
				o(this.aSystemInfoCollection);
			}
			return;
		}
		var t = this;
		t.fnShowReleaseLoader(true);
		this.oDataRead("/SystemInfoCollection", null, function(d, r) {
			t.fnShowReleaseLoader(false);
			if (d && d.results) {
				t.aSystemInfoCollection = d.results;
				if (o) {
					o(d.results);
				}
			}
		}, function(e) {
			t.fnShowReleaseLoader(false);
			t.oDataRequestFailed(e);
			if (a) {
				a(e);
			}
		});
	},
	readTaskDefinitionCollection: function(o, a, m) {
		var t = this;
		this.oDataRead("/TaskDefinitionCollection", null, function(d, r) {
			t.fnShowReleaseLoader(false);
			if (d && d.results) {
				if (o) {
					o(d.results, m);
				}
			}
		}, function(e) {
			t.oDataRequestFailed(e);
			if (a) {
				a([]);
			}
		});
	},
	fnGetCount: function(o, i, s, e) {
		var t = this;
		var c = this._getTaskContextPath(o, i) + "/" + e + "/$count";
		var E = function(a) {
			t.oDataRequestFailed(a);
		};
		this.oDataRead(c, null, function(d) {
			s(d);
		}, E);
	},
	_getTaskContextPath: function(o, i) {
		return "/" + "TaskCollection" + "(SAP__Origin='" + jQuery.sap.encodeURL(o) + "',InstanceID='" + jQuery.sap.encodeURL(i) + "')";
	},
	fnIsImagePresent: function(u) {
		var i = false;
		jQuery.ajax({
			url: u,
			type: 'GET',
			contentType: 'image/jpeg',
			async: false,
			success: function(d, s, j) {
				if (d != "" && d != undefined) {
					i = true;
				}
			},
			error: function(d, t, c) {
				i = false;
			}
		});
		return i;
	},
	fnShowReleaseLoader: function(v) {
		var V = {};
		V["bValue"] = v;
		this.oEventBus.publish("cross.fnd.fiori.inbox.dataManager", "showReleaseLoader", V);
	},
	fnShowLoaderInDialogs: function(v) {
		var V = {};
		V["bValue"] = v;
		sap.ca.scfld.md.app.Application.getImpl().getComponent().getEventBus().publish("cross.fnd.fiori.inbox.dataManager",
			"showLoaderInDialogs", V);
	},
	_refreshListOnError: function(o, i) {
		this.oModel.bFullRefreshNeeded = true;
		jQuery.sap.delayedCall(500, this, function() {
			sap.ca.ui.message.showMessageToast(this.oi18nResourceBundle.getText("dialog.info.task_completed"));
		});
		if (sap.ui.Device.system.phone) {
			this.oEventBus.publish("cross.fnd.fiori.inbox.dataManager", "refreshOnError");
		} else {
			this.processListAfterAction(o, i);
		}
		this.oModel.refresh();
	},
	checkStatusAndOpenTask: function(o, i, O) {
		var t = this;
		var e = function() {
			t._refreshListOnError(o, i);
		};
		var s = function(d) {
			if (d.hasOwnProperty("__batchResponses") && d.__batchResponses.length > 0) {
				var S = d.__batchResponses[0];
				if (S.hasOwnProperty("data") && S.statusCode >= '200' && S.statusCode < '300') {
					if (!(S.data.Status === t.sStatusCompleted) && (t.bOutbox == false)) {
						O();
						return;
					} else if (t.bOutbox == true) {
						O();
						return;
					}
				}
			}
			e();
		};
		this.fireBatch({
			aPaths: [this._getTaskContextPath(o, i)],
			aUrlParameters: [{
				$select: "Status"
			}],
			sMethod: "GET",
			sBatchGroupId: "GetLatestStatus",
			numberOfRequests: 1,
			fnSuccessCallback: s,
			fnErrorCallback: e
		});
	},
	readAddInboxUsers: function(s, e) {
		var t = this;
		this.oDataRead("/SubstitutesRuleCollection", null, function(d, r) {
			if (d) {
				if (s) {
					s(d);
				}
			}
		}, function(E) {
			e();
			t.fnShowReleaseLoader(false);
			var d = t.getErrorMessage(E);
			var E = {
				customMessage: {
					message: t.oi18nResourceBundle.getText("addInbox.read.error"),
					details: d
				}
			};
			t.oDataRequestFailed(E);
		});
	},
	readSubstitutedUserList: function(s, e) {
		var t = this;
		this.oDataRead("/SubstitutedUsersCollection", null, function(d, r) {
			if (d && s) {
				s(d);
			}
		}, function(E) {
			e();
			t.fnShowReleaseLoader(false);
			var d = t.getErrorMessage(E);
			var E = {
				customMessage: {
					message: t.oi18nResourceBundle.getText("substitutesUser.read.error"),
					details: d
				}
			};
			t.oDataRequestFailed(E);
		});
	},
	refreshListOnAddInboxDone: function(e) {
		this.readTaskDefinitionCollection(jQuery.proxy(this.updateTaskDefinitionModel), null, false);
		this.oModel.bFullRefreshNeeded = true;
		this.oModel.refresh();
	},
	updateTaskDefinitionModel: function(r, m) {
		var a = sap.ca.scfld.md.app.Application.getImpl().oCurController.MasterCtrl;
		a.getView().getModel("taskDefinitionsModel").setData(r, m);
	},
	handleMetadataFailed: function(e) {
		var d = this.getErrorMessage(e);
		var e = {
			customMessage: {
				message: this.oi18nResourceBundle.getText("DataManager.metadataFailed"),
				details: d
			}
		};
		this.oDataRequestFailed(e);
	},
	checkImageAvailabilityAsync: function(u, s, e) {
		jQuery.ajax({
			url: u,
			type: 'GET',
			contentType: 'image/jpeg',
			async: true,
			success: function(d, a, j) {
				if (d != "" && d != undefined) {
					s();
				} else {
					e();
				}
			},
			error: function(d, t, c) {
				e();
			}
		});
	},
	fetchUIExecutionLink: function(i, s, e) {
		var t = this;
		if (!i.TaskSupports.UIExecutionLink) {
			e();
			return;
		}
		if (!this.isUIExecnLinkNavProp() && i.GUI_Link) {
			var u = {};
			u.GUI_Link = i.GUI_Link;
			this.oUIExecutionLinks[i.SAP__Origin + i.InstanceID] = u;
			s(u);
		} else {
			if (this.oUIExecutionLinks[i.SAP__Origin + i.InstanceID]) {
				s(this.oUIExecutionLinks[i.SAP__Origin + i.InstanceID]);
			} else {
				var v = {};
				v.bValue = true;
				this.oEventBus.publish("cross.fnd.fiori.inbox.dataManager", "UIExecutionLinkRequest", v);
				this.oDataRead(this._getTaskContextPath(i.SAP__Origin, i.InstanceID) + "/UIExecutionLink", null, function(d) {
					t.oUIExecutionLinks[i.SAP__Origin + i.InstanceID] = d;
					var v = {};
					v.bValue = true;
					t.oEventBus.publish("cross.fnd.fiori.inbox.dataManager", "UIExecutionLinkRequest", v);
					s(d);
				}, function(a) {
					e(a);
					var v = {};
					v.bValue = true;
					t.oEventBus.publish("cross.fnd.fiori.inbox.dataManager", "UIExecutionLinkRequest", v);
				}, "UILink");
			}
		}
	},
	isUIExecnLinkNavProp: function() {
		if (this.oServiceMetaModel && this.bUIExecnLinkNavProp === undefined) {
			var t = this.oServiceMetaModel.getODataEntityType("TASKPROCESSING.Task");
			if (t) {
				this.bUIExecnLinkasNavProp = !this.oServiceMetaModel.getODataProperty(t, "GUI_Link");
			}
		}
		return this.bUIExecnLinkasNavProp;
	},
	getDataFromCache: function(k, i) {
		return this.oCacheStore[k][this.getCacheStoreKey(k, i)];
	},
	getCacheStoreKey: function(k, i) {
		switch (k) {
			case "UIExecutionLink":
				return i.SAP__Origin + i.InstanceID;
			case "DecisionOptions":
				return i.SAP__Origin + i.TaskDefinitionID;
			case "Descriptions":
				return i.SAP__Origin + i.InstanceID;
		}
	},
	getCurrentUserImage: function(o, u, s) {
		var i = this.oModel.sServiceUrl + "/UserInfoCollection(SAP__Origin='" + o + "',UniqueName='" + u + "')/$value";
		if (this.oCurrentUserImageAvailability[i] != null && this.oCurrentUserImageAvailability[i] === true) {
			s(i);
			return;
		}
		var t = this;
		jQuery.ajax({
			url: i,
			type: 'GET',
			contentType: 'image/jpeg',
			async: true,
			success: function(d, a, j) {
				if (d != "" && d != undefined) {
					t.oCurrentUserImageAvailability[i] = true;
					s(i);
				} else {
					t.oCurrentUserImageAvailability[i] = false;
				}
			}
		});
	},
	getCustomAttributeDefinitions: function() {
		return this.oCustomAttributeDefinitions;
	},
	getShowAdditionalAttributes: function() {
		return this.bShowAdditionalAttributes;
	},
	getDetailPageLoaded: function() {
		return this.bDetailPageLoaded;
	},
	setDetailPageLoaded: function(v) {
		this.bDetailPageLoaded = v;
	},
	getDetailPageLoadedViaDeepLinking: function() {
		return this.bDetailPageLoadedViaDeepLinking;
	},
	setDetailPageLoadedViaDeepLinking: function(v) {
		this.bDetailPageLoadedViaDeepLinking = v;
	},
	setCallFromDeepLinkURL: function(v) {
		this.bIsDeepLinkingURLCall = v;
	},
	getCallFromDeepLinkURL: function() {
		return this.bIsDeepLinkingURLCall;
	},
	_getURLParametersfromStartUpParameters: function(s) {
		if (s) {
			if (s.substitution && s.substitution.length > 0) {
				this.bSubstitution = s.substitution[0] == "true" ? true : false;
			} else {
				this.bSubstitution = jQuery.sap.getUriParameters().get("substitution") == "false" ? false : true;
			}
			if (s.showLog && s.showLog.length > 0) {
				this.bShowLog = s.showLog[0];
			} else {
				this.bShowLog = jQuery.sap.getUriParameters().get("showLog") == "false" ? false : true;
			}
			if (s.expertMode && s.expertMode.length > 0) {
				this.tableView = s.expertMode[0];
			} else {
				this.tableView = jQuery.sap.getUriParameters().get("expertMode") == "true" ? true : false;
			}
			if (s.expertModeOnPhone && s.expertModeOnPhone.length > 0) {
				this.tableViewOnPhone = s.expertModeOnPhone[0];
			} else {
				this.tableViewOnPhone = jQuery.sap.getUriParameters().get("expertModeOnPhone") == "true" ? true : false;
			}
			if (s.scenarioId && s.scenarioId.length > 0) {
				this.sScenarioId = s.scenarioId[0];
			} else {
				this.sScenarioId = jQuery.sap.getUriParameters().get("scenarioId");
			}
			if (!this.sScenarioId) {
				if (s.taskDefinitions && s.taskDefinitions[0]) {
					this.sClientScenario = decodeURIComponent(s.taskDefinitions[0]);
				} else {
					var t = jQuery.sap.getUriParameters().get("taskDefinitions");
					if (t != null) {
						this.sClientScenario = decodeURIComponent(t);
					}
				}
			}
			if (s.userSearch && s.userSearch.length > 0) {
				this.userSearch = s.userSearch[0] == "false" ? false : true;
			} else {
				this.userSearch = jQuery.sap.getUriParameters().get("userSearch") == "false" ? false : true;
			}
			if (s.allItems && s.allItems.length > 0) {
				this.bAllItems = s.allItems[0] == "true" ? true : false;
			} else {
				this.bAllItems = jQuery.sap.getUriParameters().get("allItems") == "true" ? true : !(this.sScenarioId || this.sClientScenario);
			}
			this.bAllItems = this.bAllItems || !(this.sScenarioId || this.sClientScenario);
			if (s.outbox && s.outbox.length > 0) {
				this.bOutbox = s.outbox[0] == "true" ? true : false;
			} else {
				this.bOutbox = jQuery.sap.getUriParameters().get("outbox") == "true" ? true : false;
			}
			if (s.showAdditionalAttributes && s.showAdditionalAttributes.length > 0) {
				this.bShowAdditionalAttributes = s.showAdditionalAttributes[0] == "true" ? true : false;
			} else {
				this.bShowAdditionalAttributes = jQuery.sap.getUriParameters().get("showAdditionalAttributes") == "true" ? true : false;
			}
			if (s.massAction && s.massAction.length > 0) {
				if (s.massAction[0] == "true") {
					this.bIsMassActionEnabled = true;
				} else if (s.massAction[0] == "false") {
					this.bIsMassActionEnabled = false;
				}
			} else {
				if (jQuery.sap.getUriParameters().get("massAction") == "true") {
					this.bIsMassActionEnabled = true;
				} else if (jQuery.sap.getUriParameters().get("massAction") == "false") {
					this.bIsMassActionEnabled = false;
				}
			}
			if (s.quickAction && s.quickAction.length > 0) {
				if (s.quickAction[0] == "true") {
					this.bIsQuickActionEnabled = true;
				} else if (s.quickAction[0] == "false") {
					this.bIsQuickActionEnabled = false;
				}
			} else {
				if (jQuery.sap.getUriParameters().get("quickAction") == "true") {
					this.bIsQuickActionEnabled = true;
				} else if (jQuery.sap.getUriParameters().get("quickAction") == "false") {
					this.bIsQuickActionEnabled = false;
				}
			}
			if (s.sortBy && s.sortBy.length > 0) {
				this.sDefaultSortBy = s.sortBy[0];
			} else {
				this.sDefaultSortBy = jQuery.sap.getUriParameters().get("sortBy");
			}
			var l;
			if (s.listSize && s.listSize.length > 0) {
				l = s.listSize[0];
			} else {
				l = jQuery.sap.getUriParameters().get("listSize");
			}
			if (l && jQuery.isNumeric(l) && parseInt(l, 10) > 0) {
				this.iListSize = parseInt(l, 10);
			}
			var T = jQuery.sap.getUriParameters().get("taskObjects");
			if (s.taskObjects && s.taskObjects.length > 0) {
				this.bShowTaskObjects = s.taskObjects[0] == "true" ? true : false;
			} else if (T && T.length > 0) {
				this.bShowTaskObjects = T === "true" ? true : false;
			} else {
				this.bShowTaskObjects = sap.ui.Device.system.desktop;
			}
			var p;
			if (s.pageSize && s.pageSize.length > 0) {
				p = s.pageSize[0];
			} else {
				p = jQuery.sap.getUriParameters().get("pageSize");
			}
			if (p && jQuery.isNumeric(p) && parseInt(p, 10) > 0) {
				this.iPageSize = parseInt(p, 10);
			}
			if (s.enablePaging && s.enablePaging.length > 0) {
				this.bEnablePaging = s.enablePaging[0] === "true" ? true : false;
			} else {
				this.bEnablePaging = jQuery.sap.getUriParameters().get("enablePaging") === "true" ? true : false;
			}
			var o;
			if (s.operationMode && s.operationMode.length > 0) {
				o = s.operationMode[0];
			} else {
				o = jQuery.sap.getUriParameters().get("operationMode");
			}
			if (o && o.toUpperCase() === "CLIENT") {
				this.sOperationMode = "Client";
			} else {
				this.sOperationMode = "Server";
			}
			var c;
			if (s.cacheSize && s.cacheSize.length > 0) {
				c = s.cacheSize[0];
			} else {
				c = jQuery.sap.getUriParameters().get("cacheSize");
			}
			if (jQuery.isNumeric(c)) {
				c = parseInt(c, 10);
			} else {
				c = undefined;
			}
			if (c && c >= 0) {
				this.iCacheSize = c;
			}
			if (s.InstanceID && s.InstanceID.length > 0) {
				this.sTaskInstanceID = s.InstanceID[0];
			} else {
				this.sTaskInstanceID = jQuery.sap.getUriParameters().get("InstanceID");
			}
			if (s.SAP__Origin && s.SAP__Origin.length > 0) {
				this.sSapOrigin = s.SAP__Origin[0];
			} else {
				this.sSapOrigin = jQuery.sap.getUriParameters().get("SAP__Origin");
			}
			if (s.forwardUserSettings && s.forwardUserSettings.length > 0) {
				this.bPropogateSapURLParameters = s.forwardUserSettings[0] == "false" ? false : true;
			} else {
				this.bPropogateSapURLParameters = jQuery.sap.getUriParameters().get("forwardUserSettings") === "false" ? false : true;
			}
		} else {
			this._getURLParameters();
		}
	},
	_getURLParameters: function() {
		this.sScenarioId = jQuery.sap.getUriParameters().get("scenarioId");
		if (!this.sScenarioId) {
			var t = jQuery.sap.getUriParameters().get("taskDefinitions");
			if (t != null) {
				this.sClientScenario = decodeURIComponent(t);
			}
		}
		this.bAllItems = jQuery.sap.getUriParameters().get("allItems") == "true" ? true : !(this.sScenarioId || this.sClientScenario);
		this.userSearch = jQuery.sap.getUriParameters().get("userSearch") == "false" ? false : true;
		this.bOutbox = jQuery.sap.getUriParameters().get("outbox") == "true" ? true : false;
		this.tableView = jQuery.sap.getUriParameters().get("expertMode") == "true" ? true : false;
		this.tableViewOnPhone = jQuery.sap.getUriParameters().get("expertModeOnPhone") == "true" ? true : false;
		this.bSubstitution = jQuery.sap.getUriParameters().get("substitution") == "true" ? true : false;
		this.bShowLog = jQuery.sap.getUriParameters().get("showLog") == "false" ? false : true;
		this.sTaskInstanceID = jQuery.sap.getUriParameters().get("InstanceID");
		this.sSapOrigin = jQuery.sap.getUriParameters().get("SAP__Origin");
		this.bShowAdditionalAttributes = jQuery.sap.getUriParameters().get("showAdditionalAttributes") == "true" ? true : false;
		if (jQuery.sap.getUriParameters().get("massAction") == "true") {
			this.bIsMassActionEnabled = true;
		} else if (jQuery.sap.getUriParameters().get("massAction") == "false") {
			this.bIsMassActionEnabled = false;
		}
		if (jQuery.sap.getUriParameters().get("quickAction") == "true") {
			this.bIsQuickActionEnabled = true;
		} else if (jQuery.sap.getUriParameters().get("quickAction") == "false") {
			this.bIsQuickActionEnabled = false;
		}
		this.sDefaultSortBy = jQuery.sap.getUriParameters().get("sortBy");
		var l = jQuery.sap.getUriParameters().get("listSize");
		if (l && jQuery.isNumeric(l) && parseInt(l, 10) > 0) {
			this.iListSize = parseInt(l, 10);
		}
		var T = jQuery.sap.getUriParameters().get("taskObjects");
		if (T && T.length > 0) {
			this.bShowTaskObjects = T === "true" ? true : false;
		} else {
			this.bShowTaskObjects = sap.ui.Device.system.desktop;
		}
		var p = jQuery.sap.getUriParameters().get("pageSize");
		if (p && jQuery.isNumeric(p) && parseInt(p, 10) > 0) {
			this.iPageSize = parseInt(p, 10);
		}
		var c = jQuery.sap.getUriParameters().get("cacheSize");
		if (jQuery.isNumeric(c)) {
			c = parseInt(c, 10);
		} else {
			c = undefined;
		}
		if (c && c >= 0) {
			this.iCacheSize = c;
		}
		this.bEnablePaging = jQuery.sap.getUriParameters().get("enablePaging") === "true" ? true : false;
		var o = jQuery.sap.getUriParameters().get("operationMode");
		if (o && o.toUpperCase() === "CLIENT") {
			this.sOperationMode = "Client";
		} else {
			this.sOperationMode = "Server";
		}
		this.bPropogateSapURLParameters = jQuery.sap.getUriParameters().get("forwardUserSettings") === "false" ? false : true;
	},
	fnUpdateSingleTask: function(s, i, S, e) {
		var t = this;
		this.oDataRead("/TaskCollection(SAP__Origin='" + jQuery.sap.encodeURL(s) + "',InstanceID='" + jQuery.sap.encodeURL(i) + "')", null,
			function(d) {
				if (S) {
					t.processListAfterAction(s, i);
					t.fireActionPerformed();
					S(d);
				}
				t.fnShowReleaseLoader(false);
			},
			function(E) {
				if (e) {
					e(E);
				}
				t.processListAfterAction(s, i);
				t.fnShowReleaseLoader(false);
				t.oDataRequestFailed(E);
			});
	},
	massReadDecisionOptions: function(t, s) {
		var p = [],
			d = [],
			D = [],
			i;
		for (var k in t) {
			if (t.hasOwnProperty(k)) {
				i = t[k];
				D.push({
					SAP__Origin: i.SAP__Origin,
					TaskDefinitionID: i.TaskDefinitionID
				});
				p.push({
					SAP__Origin: "'" + jQuery.sap.encodeURL(i.SAP__Origin) + "'",
					InstanceID: "'" + jQuery.sap.encodeURL(i.InstanceID) + "'"
				});
			}
		}
		var S = function(o) {
			var b = o.__batchResponses;
			var T, B, r;
			for (var j in b) {
				B = b[j];
				if (B.hasOwnProperty("data") && B.statusCode >= "200" && B.statusCode < "300") {
					r = B.data.results;
					T = D[j];
					if (r) {
						this.oDecisionOptions[T.SAP__Origin + T.TaskDefinitionID] = r;
						d.push(r);
					}
				}
			}
			s(d);
		};
		var e = function(E) {};
		this.fireBatch({
			sPath: this.FUNCTION_IMPORT_DECISIONOPTIONS,
			aUrlParameters: p,
			sMethod: "GET",
			sBatchGroupId: "DecisionOptionsBatch",
			numberOfRequests: D.length,
			fnSuccessCallback: jQuery.proxy(S, this),
			fnErrorCallback: jQuery.proxy(e, this)
		});
	}
});
cross.fnd.fiori.inbox.util.DataManager.M_EVENTS = {
	ItemRemoved: "itemRemoved",
	ActionPerformed: "actionPerformed",
	refreshDetails: "refreshDetails"
};