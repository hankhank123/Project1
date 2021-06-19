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
	ACTION_FAILURE:"Failure",
	
	//cache store
	aSystemInfoCollection: null,
	aSubstitutionProfilesCollection: null,
	oCustomAttributeDefinitions: {},
	oUIExecutionLinks: {},
	oDecisionOptions: {},
	oDescriptions: {},
	oCurrentUserImageAvailability: {}, // cache logged in user's picture availability
	
	// startup (url) parameters
	sScenarioId: null,				// scenarioId
	sClientScenario : null,			// taskDefinitions	manual client scenario definition. Ex: TS70008308,TS70008333
	bAllItems: null,				// allItems		values: true, false
	userSearch: true,				//userSearch	values: true, false ; default: true
	bOutbox: false,				    // outbox		values: true, false
	tableView:false,				//table view	values: true, false
	tableViewOnPhone:false,			//table view on phone	values: true, false
	bIsMassActionEnabled: null,		// massAction	values: true, false
	bIsQuickActionEnabled: null,	// quickAction	values: true, false
	sDefaultSortBy: null,			// sortBy		value: taskCollection field name
	iListSize: null,
	bEnablePaging: false,
	sOperationMode: "Server",
	iPageSize: 30,
	iCacheSize: null,
	bShowAdditionalAttributes: false, // showAdditionalAttributes
	bSubstitution:true,				  // Substitution feature
	bShowLog:true, // Log feature
	
	//debug mode
	bDebug:false,
	
	//flags
	bDetailPageLoaded: false,
	//Flag
	bDetailPageLoadedViaDeepLinking:false,	
	//flag to check call
	bIsDeepLinkingURLCall:false,
	sCustomAttributeDefinitionNavProperty : "CustomAttributeDefinitionData",
	sClaimAction : "Claim",
	sReleaseAction : "Release",
	sResumeAction : "CancelResubmission",
	sTaskDefinitionCollectionName : "TaskDefinitionCollection",
	sStatusCompleted: "COMPLETED",
	sDefaultSortForOutbox: "CompletedOn",
	sDeafultSortForInbox: "CreatedOn",
	oServiceMetaModel: null,        // initialized in S2 controller before initializing list binding
	oEventBus: null,
	sTaskInstanceID:null,
	sSapOrigin:null,
	bPropogateSapURLParameters: true,
	
	constructor : function(oModel, oController) {
		
		sap.ui.base.EventProvider.apply(this);
		this.oCacheStore = {
								"DecisionOptions" : this.oDecisionOptions,
								"UIExecutionLink" : this.oUIExecutionLinks,
								"Description"	  : this.oDescriptions
							};
		var oComponentData, oStartupParameters, oAppImpl;
		// handle startup URL parameters
		if(oController){
			oComponentData = oController.getOwnerComponent().getComponentData();
			if (oComponentData) {
				oStartupParameters = oComponentData.startupParameters;
				this._getURLParametersfromStartUpParameters(oStartupParameters);
			} else {
				this._getURLParameters();
			}
			this.oPostActionModel = oController.getView().getModel("POSTACTION");
		}
		
		this.oModel = oModel;
		if (this.oModel) {
			this.oModel.setUseBatch(true);
			this.oModel.setRefreshAfterChange(false);
			this.oModel.attachRequestCompleted(jQuery.proxy(this.handleRequestCompleted, this));
		}
		oAppImpl = sap.ca.scfld.md.app.Application.getImpl();
		this.oi18nResourceBundle = oAppImpl.AppI18nModel.getResourceBundle();
		this.oEventBus = oAppImpl.getComponent().getEventBus();

		// to synchronize master and detail screen loaders
		this.setDetailPageLoaded(false);
		
		if(!this.iListSize) {
			// Restrict the default list size to 300 for Outbox or 100 for Inbox:
			this.iListSize = this.bOutbox ? 300 : 100;
		}
		
		//set debug flag
		if(jQuery.sap.debug()){
			this.bDebug = true;
		}
		else{
			this.bDebug = jQuery.sap.getUriParameters().get("sap-ui-debug") == "true" ? true : false;
		}
	},
	
	
	handleRequestCompleted: function(oEvent){
		// handling cases where taskCollection query fails
		if (oEvent) {
			var sRequestUrl = oEvent.getParameter("url");
			if (sRequestUrl && sRequestUrl.split("?")[0] === "TaskCollection" && oEvent.getSource().oProcessingMultiSelect && oEvent.getSource().oProcessingMultiSelect.bProcessing && oEvent.getParameters().success) {
				sap.ca.scfld.md.app.Application.getImpl().getComponent()
					.getEventBus().publish("cross.fnd.fiori.inbox.dataManager", "multiSelectFilterCompleted", oEvent.getSource().oProcessingMultiSelect);
			}
		}
		this.fnShowReleaseLoader(false);
	},
	
	handleRequestFailed: function(oEvent){
		// handling cases where taskCollection query fails
		if (oEvent) {
			var sRequestUrl = oEvent.getParameter("url");
			if (sRequestUrl && sRequestUrl.split("?")[0] === "TaskCollection") {
				this.handleTaskCollectionFailed(oEvent);
			}
		}
		this.fnShowReleaseLoader(false);
	},
	
	handleTaskCollectionFailed: function(oEvent) {
		
		// show a generic error message with details
		var sDetails = oEvent.getParameter("response") ? oEvent.getParameter("response").responseText : "";
		var oError = {
				customMessage: {
					message: this.oi18nResourceBundle.getText("dialog.error.task_collection"),
					details: sDetails
				},
				oEvent : oEvent
		};
		
		this.oDataRequestFailed(oError);
		
		//do not remove header footer options in case the failure happens on filter of task type for mass actions.
		if(!oEvent.getSource().oProcessingMultiSelect){
			// remove the header footer options of the list
			this.oEventBus.publish("cross.fnd.fiori.inbox.dataManager","taskCollectionFailed");
		}else{
			this.oEventBus.publish("cross.fnd.fiori.inbox.dataManager", "multiSelectFilterFailed");
		}
	},
	
	attachItemRemoved : function(oData, fnFunction, oListener) {
		this.attachEvent(cross.fnd.fiori.inbox.util.DataManager.M_EVENTS.ItemRemoved, oData, fnFunction, oListener);
		return this;
	},
	
	attachRefreshDetails : function(oData, fnFunction, oListener) {
		this.attachEvent(cross.fnd.fiori.inbox.util.DataManager.M_EVENTS.refreshDetails, oData, fnFunction, oListener);
		return this;
	},
	
	fireRefreshDetails : function(mArguments) {
		this.fireEvent(cross.fnd.fiori.inbox.util.DataManager.M_EVENTS.refreshDetails, mArguments);
		return this;
	},
	
	fireItemRemoved : function(mArguments) {
		this.fireEvent(cross.fnd.fiori.inbox.util.DataManager.M_EVENTS.ItemRemoved, mArguments);
		return this;
	},
	
	attachActionPerformed: function(oData, fnFunction, oListener) {
		this.attachEvent(cross.fnd.fiori.inbox.util.DataManager.M_EVENTS.ActionPerformed, oData, fnFunction, oListener);
		return this;
	},
	
	fireActionPerformed : function(mArguments) {
		// If paging is enabled the model has to be refreshed when a task action is performed, because otherwise the list doesn't get updated:
		if(this.getPagingEnabled()) {
			this.oModel.refresh();
		}
		this.fireEvent(cross.fnd.fiori.inbox.util.DataManager.M_EVENTS.ActionPerformed, mArguments);
		return this;
	},
	
	fetchTaskDefinitionsandCustomAttributeDefinitions: function(fnSuccessCallback){
    	var that = this;
    	var sContextPath = "/" + that.sTaskDefinitionCollectionName;
    	var sExpand = { $expand: that.sCustomAttributeDefinitionNavProperty };
    	
    	var fnSuccess = function(data, response){
    		// clear oCustomAttributeDefinitions object
    		that.oCustomAttributeDefinitions = {};
			var oResults = data.results;
			if(jQuery.isArray(oResults) && oResults.length > 0){
				jQuery.each( oResults, function( i, oTaskDefnData ) {
					that.oCustomAttributeDefinitions[oTaskDefnData.TaskDefinitionID] = oTaskDefnData.CustomAttributeDefinitionData.results;
				});
			}
    		fnSuccessCallback(data);
    	};
    	
    	var fnErrorCallback = function( oError ) {
			that.oDataRequestFailed( oError );
		};
		
    	this.oDataRead(sContextPath,
    			sExpand, 
    			fnSuccess,
    			fnErrorCallback,  "taskDefn");
	},
	
	loadInitialAppData: function(fnSuccess) {
		if (!(this.sScenarioId || this.sClientScenario) || !this.oModel) {
			// required
			return null;
		}
		var that = this;

		if(this.sScenarioId){
			//Setup request for ConsumerScenario
			var sFilterValue = "(ConsumerType eq '" + jQuery.sap.encodeURL(this.sMode) + 
	        "') and (UniqueName eq '" + jQuery.sap.encodeURL(this.sScenarioId) + "')";
			
			var fnSuccessCallback = function(oData) {
				if (oData.hasOwnProperty("__batchResponses") && oData.__batchResponses.length == 2) {
					// Result from batch read
					var aErrors = [];
					var oFOBatchResp = oData.__batchResponses[0];
					if (oFOBatchResp.hasOwnProperty("data") && oFOBatchResp.statusCode >= '200' && oFOBatchResp.statusCode < '300') {
						// Successful request
						that._processFilterOptionsResult(oFOBatchResp.data);
						
					} else if (oFOBatchResp.hasOwnProperty("response") && oFOBatchResp.response.statusCode >= '400') {
						aErrors.push(JSON.parse(oFOBatchResp.response.body));
					}
					
					var oCSBatchResp = oData.__batchResponses[1];
					if (oCSBatchResp.hasOwnProperty("data") && oCSBatchResp.statusCode >= '200' && oCSBatchResp.statusCode < '300') {
						// Successful request
						fnSuccess(that._processConsumerScenarioResult(oCSBatchResp.data));
						
					} else if (oCSBatchResp.hasOwnProperty("response") && oCSBatchResp.response.statusCode >= '400') {
						aErrors.push(JSON.parse(oCSBatchResp.response.body));
					}
					
					that._handleBatchErrors(aErrors);
				}
				
			};
			
			var fnErrorCallback = function(oError) {
				that.oDataRequestFailed(oError);
			};
			
			//CSRF token validation/refresh handled inside - here it would not be needed because token is valid at app startup
			var aRequests = [ "/FilterOptionCollection","/ConsumerScenarioCollection" ];
			that.fireBatch({aPaths:aRequests ,aUrlParameters:["", "$filter=" + encodeURIComponent(sFilterValue) ], 
				sMethod:"GET",sBatchGroupId:"FilterOptionsAndConsumerScenarioCollection",numberOfRequests:aRequests.length,fnSuccessCallback:fnSuccessCallback,fnErrorCallback:fnErrorCallback});
			
		}
		else if(this.sClientScenario){ //Client scenario configuration parsing
			//Parse sClientScenario and construct parameter for construct the oScenario for S2.loadInitialAppData
			var taskDefinitions = this.sClientScenario.trim().split(",");
			
			//Validate and cut white space
			for(var i = (taskDefinitions.length - 1) ; i >= 0 ; i--){
				taskDefinitions[i] = taskDefinitions[i].trim();
				if(taskDefinitions[i].length == 0){
					taskDefinitions.splice(i,1);
				}
			}
			if(taskDefinitions.length == 0){
			   this._clientScenarioRequestFailed();
			   return;
			}
			
			//Build scenario service info object
			var oScenarioServiceInfo = new Object();
			oScenarioServiceInfo.Origin = "";
			oScenarioServiceInfo.TaskDefinitionIDs = taskDefinitions;
			
			// Build Scenario config
			var oClientScenario = this.getScenarioConfig();
			oClientScenario.ScenarioServiceInfos = [oScenarioServiceInfo];
			this._oScenarioConfig = oClientScenario;
			
			//Invoke same success handler as in case with scenarioId
			fnSuccess(oClientScenario);
		}
	},
	
	fireBatch: function(mParameters, bUsePostModel){
		
		var oModelToUse = bUsePostModel ? this.oPostActionModel : this.oModel;
		if(oModelToUse.hasPendingChanges()) {
			oModelToUse.resetChanges();
		}
		oModelToUse.setDeferredBatchGroups([mParameters.sBatchGroupId]);
		var sPath;
		var oEntry = {
	    	batchGroupId : mParameters.sBatchGroupId
	    };

		for (var i = 0; i < mParameters.numberOfRequests; i++) {
			if (mParameters.aUrlParameters) {
				oEntry.urlParameters = mParameters.aUrlParameters[i];
			}
			if (mParameters.aProperties) {
				oEntry.properties = mParameters.aProperties[i];
			}
			if (mParameters.sPath) {
				sPath = mParameters.sPath;
			} 
			else if (mParameters.aPaths) {
				sPath = mParameters.aPaths[i];
			}
			if (!jQuery.sap.startsWith(sPath, "/")) {
				sPath = "/" + sPath;
			}
			if (mParameters.sMethod == "GET") {
				oModelToUse.read(sPath, oEntry);
			} 
			else if (mParameters.sMethod == "POST") {
				oEntry.changeSetId = "changeSetId" + i;
				oModelToUse.createEntry(sPath, oEntry);
			}
			else if (mParameters.sMethod == "DELETE") {
				oEntry.changeSetId = "changeSetId" + i;
				oModelToUse.remove(sPath, oEntry);
			}
			// to call FunctionImport in post, use this method
			else if (mParameters.sMethod == "FUNCTIONIMPORT") {
				oEntry.changeSetId = "changeSetId" + i;
				oEntry.method = "POST";
				oModelToUse.callFunction(sPath, oEntry);
			}
			
		}
		
		oModelToUse.submitChanges({batchGroupId : mParameters.sBatchGroupId, success : mParameters.fnSuccessCallback , error : mParameters.fnErrorCallback });
	},
	
	_handleBatchErrors: function(aErrors, sCustomMessage) {
		if (aErrors.length > 0) {
			if (sCustomMessage) {
				
				var sDetails = "";
				jQuery.each(aErrors, $.proxy(function(index, oError) {
					if (sDetails.localeCompare(this.getErrorMessage(oError) + "\n")){ //to prevent duplicate message 
						sDetails += this.getErrorMessage(oError) + "\n";
					}
				}, this));
				var oError = {
						customMessage: {
							message: sCustomMessage,
							details: sDetails
						}
				};
				
			} else {
				
				var sMessage = "";
				var sBodyValue = "";
				for (var i = 0; i < aErrors.length; i++) {
					if (aErrors[i].hasOwnProperty("error")) {
						sMessage += aErrors[i].error.message.value;
					} else if (aErrors[i].hasOwnProperty("response")) {
						sMessage += aErrors[i].message;
						var body = JSON.parse(aErrors[i].response.body);
						sBodyValue += body.error.message.value + "\n";
					}
					if (i < aErrors.length-1) {
						sMessage += "\n";
					}
				}
				
				var oError = {
						message: sMessage,
						response: {
							body: sBodyValue
						}
				};
			}
			
			this.oDataRequestFailed(oError);
		}
	},
	
	processListAfterAction : function (sOrigin, sInstanceId) {
		// if not stored already, publish the event "storeNextItemsToSelect" to store the next possible items to select
		sap.ca.scfld.md.app.Application.getImpl().getComponent()
				.getEventBus().publish("cross.fnd.fiori.inbox", "storeNextItemsToSelect", {
					"sOrigin": sOrigin,
					"sInstanceID" : sInstanceId
				});
	},

    _processConsumerScenarioResult: function(oData) {
    	if (oData.results.length == 0) {
			// nothing found
			this._scenarioRequestFailed();
			return;
		} 
    	
		var oMainParseRegexp = new RegExp(";o=([A-Z0-9_]+)/.+\\?\\$filter=(.+)"); 
		var oFilterParseRegexp = new RegExp("TaskDefinitionID eq '(.+)'");
    	
    	// after merge only one entry shall exists with maybe different scenario ids
    	
    	var oConsumerScenarioData = {};
		var oScenarioObjects = {};
		
    	jQuery.each(oData.results, function(iIndex, oEntry) {
			var oScenario = oScenarioObjects[oEntry.UniqueName];
			if (!oScenario) {
				oScenario = oEntry;
				oScenario.ScenarioServiceInfos = [];
				oScenarioObjects[oScenario.UniqueName] = oScenario;
			} else {
				oScenario.TotalItems = oScenario.TotalItems + oEntry.TotalItems;
			}
			
			var aResult = oMainParseRegexp.exec(oEntry.ScenarioServiceURL);
			if (aResult) {
				var sOrigin = aResult[1];
				var aTaskDefinitionIDs = [];
				
				var aFilterExprs = aResult[2].split(" or ");
				for (var i = 0; i < aFilterExprs.length; i++) {
					aResult = oFilterParseRegexp.exec(aFilterExprs[i]);
					if (aResult){
						aTaskDefinitionIDs.push(aResult[1]);
					}
				}
				
				if (aTaskDefinitionIDs.length > 0) {				
					var oScenarioServiceInfo = {
						Origin: sOrigin,
						TaskDefinitionIDs: aTaskDefinitionIDs
					};
				
					oScenario.ScenarioServiceInfos.push(oScenarioServiceInfo);
				}
			}
		});
    	
    	//this loop is required to bring the scenario object one level up
    	//the property name is the unique name of the scenario that cannot be used as getter
		jQuery.each(oScenarioObjects, function(iIndex, oScenario) {
			oConsumerScenarioData = oScenario;
		});
		this._oScenarioConfig = oConsumerScenarioData;
		return oConsumerScenarioData;
    },
    
    getScenarioConfig: function() {
    	var oConfig = this._oScenarioConfig;
    	
    	if (oConfig == null) {
    		oConfig = {};
    	}
    	oConfig.AllItems = this.bAllItems;
    	if (this.bIsMassActionEnabled != null) { 
    		// if we have url parameter, than it overrides the backend config
    		oConfig.IsMassActionEnabled = this.bIsMassActionEnabled;
    	}
    	if (oConfig.IsMassActionEnabled === undefined) {
    		// if there is no customizing nor url parameter, the default is true
    		oConfig.IsMassActionEnabled = true;
    	}
    	if (this.bIsQuickActionEnabled != null) {
    		// if we have url parameter, than it overrides the backend config
    		oConfig.IsQuickActionEnabled = this.bIsQuickActionEnabled;
    	}
    	if (oConfig.IsQuickActionEnabled === undefined) {
    		// if there is no customizing nor url parameter, the default is true
    		oConfig.IsQuickActionEnabled = true;
    	}
    	if (this.sDefaultSortBy != null) {
    		oConfig.SortBy = this.sDefaultSortBy;
    	}
    	if (!oConfig.SortBy) {
    		// set the default sorting if not set already
    		oConfig.SortBy = this.bOutbox ? this.sDefaultSortForOutbox : this.sDeafultSortForInbox; 
    	}

    	//Config display name, used as list title
    	//In case of scenarioId defined it's taken from the tile config.
    	//Otherwise it's populated here with a constant text depending on bAllItems and sClientScenario
    	if(!oConfig.DisplayName){ 
    		if(oConfig.AllItems){
    			oConfig.DisplayName = this.oi18nResourceBundle.getText("ALL_ITEMS_SCENARIO_DISPLAY_NAME");
	    	}
	    	else if(this.sClientScenario){
	    		oConfig.DisplayName = this.oi18nResourceBundle.getText("CLIENT_SCENARIO_DISPLAY_NAME");
	    	}
    	}	
    	
    	return oConfig;
    },

    getSubstitutionEnabled: function(){
    	return this.bSubstitution;
    },
    
    getShowLogEnabled: function() {
    	return this.bShowLog;
    },
    
    getTableViewOnPhone: function(){
	    return this.tableViewOnPhone;
    },
    
    getTableView: function(){
    	return this.tableView;
    },

    // getter function for iListSize
	getListSize: function() {
		return this.iListSize;
	},
		
	// setter function for iListSize
	setListSize: function(iValue) {
		this.iListSize = iValue;
	},
	
	// getter function for iPageSize
	getPageSize: function() {
    	return this.iPageSize;
    },
    
    // getter function for iCacheSize
    getCacheSize: function(){
    	return this.iCacheSize;
    },
    
    // getter function for sOpertationMode
    getOperationMode : function(){
    	return this.sOperationMode;
    },
    
    // getter function for flag bEnablePaging
    getPagingEnabled : function(){
    	return this.bEnablePaging;
    },
    
    // getter function for flag bPropogateSapURLParameters
    isForwardUserSettings: function(){
    	return this.bPropogateSapURLParameters;
    },
    
    
    _scenarioRequestFailed: function() {
    	var oError = {
    					customMessage: {
    						message: this.oi18nResourceBundle.getText("DataManager.scenarioReadFailed"),
    						details: this.oi18nResourceBundle.getText("DataManager.scenarioReadFailedDetail")
    					}
    	};
    	this.oDataRequestFailed(oError);
    },
    
    _clientScenarioRequestFailed: function() {
    	var oError = {
    					customMessage: {
    						message: this.oi18nResourceBundle.getText("DataManager.clientScenarioReadFailed"),
    						details: this.oi18nResourceBundle.getText("DataManager.clientScenarioReadFailedDetail", this.sClientScenario)
    					}
    	};
    	this.oDataRequestFailed(oError);
    },

    sendMultiAction: function(sFunctionImportName, aItems, oDecisionOption, sNote, onSuccess, onError, bHandleBusyLoader) {
    	var aParams = [];
    	var that = this;
    	var oTask;
    	var aChangedItems = [];
    	
    	// prepare the request for each selected task and later add all these requests in a batch
    	for (var index in aItems) {
    		oTask = aItems[index];
    		var oParams = {
    			SAP__Origin: "'" + jQuery.sap.encodeURL(oTask.SAP__Origin) + "'",
    			InstanceID: "'" + jQuery.sap.encodeURL(oTask.InstanceID) + "'"
    		};
    		if (oDecisionOption && oDecisionOption.DecisionKey) {
    			oParams.DecisionKey = "'" + oDecisionOption.DecisionKey + "'";
    		}
    		if (sNote && sNote.length > 0) {
    			oParams.Comments = "'" + sNote + "'";
    		}
			aParams.push(oParams);
        }
    	
    	// success handler for the batch request
    	var fnSuccessCallback = function(oData) {
			if (bHandleBusyLoader) {
				that.fnShowReleaseLoader(false);
	    	}
			
			var aBatchResponses = oData.__batchResponses;
			var aSuccessList = [];
			var aErrorList = [];
			
			for (var i = 0; i < aBatchResponses.length; i++) {
				var oBatchResponse = aBatchResponses[i];
				var oItem = aItems[i];
				var bSuccess = false;
				
				if (oBatchResponse.hasOwnProperty("__changeResponses")) {
					var oChangeResponse = oBatchResponse.__changeResponses[0];
					if (oChangeResponse.statusCode >= "200" && oChangeResponse.statusCode < "300") {
						bSuccess = true;
						aChangedItems.push({index: i, oData: oChangeResponse.data});
					}
				}
				
				if (bSuccess) {
					oItem.message = that.oi18nResourceBundle.getText("multi.processed");
					aSuccessList.push(oItem);
				} else {
					if (oBatchResponse.response) {
						oItem.message = JSON.parse(oBatchResponse.response.body).error.message.value;
						aErrorList.push(oItem);
						
					}
				}
			}
			
			if (onSuccess) {
				onSuccess(aSuccessList, aErrorList, aChangedItems);
			}
    	};
    	
    	// error handler for the batch request
    	var fnErrorCallback = function(oError) {
    		if (bHandleBusyLoader) {
				that.fnShowReleaseLoader(false);
	    	}
			that.oDataRequestFailed(oError);
			if (onError) {
				onError(oError);
			}
    	};
    	
    	if (bHandleBusyLoader) {
			that.fnShowReleaseLoader(true);
    	}
		
		that.fireBatch({
			sPath:sFunctionImportName,
			aUrlParameters:aParams, 
			sMethod:"POST",
			sBatchGroupId:"SendMultiAction",
			numberOfRequests:aItems.length,
			fnSuccessCallback:fnSuccessCallback,
			fnErrorCallback:fnErrorCallback
		});
    },
    
    readDataOnTaskSelection: function(sCtxPath, aExpandEntitySets, aTabCounts, sOrigin, sInstanceID, sTaskTypeID, fnSuccess) {
    	if (!sCtxPath || !sOrigin || !sInstanceID) {
			// required
			return null;
		}
		var that = this;
		
		//Setup request for FilterOptions
		var aRequests = [];
		var aParams = [];
		var sEntitiesToExpand = "";
		
		// push query to fetch task's latest data in to a batch
		aRequests.push(sCtxPath);
		for(var i=0;i<aExpandEntitySets.length;i++) {
			if(sEntitiesToExpand !== ""){
				sEntitiesToExpand = sEntitiesToExpand + ",";
			}				
			sEntitiesToExpand = sEntitiesToExpand + aExpandEntitySets[i];
		}
		
		if(sEntitiesToExpand !== "") {
			/*
			load status as well to remove the tasks that do not satisfy the current status filter applied for the list.
			How does it work: if status has been changed, lets say to COMPLETED' and the filter applied was Status ne 'COMPLETED',
			OData model will merge this change in to the main model,
			This will trigger a refresh in the bindings, completed task will be removed from the list and the next item will be selected.
			*/
			aParams.push({$expand:sEntitiesToExpand, $select:sEntitiesToExpand + ",Status,TaskTitle"});
		} else {
			aParams.push("");
		}
		
		// push custom attribute definition request in to batch if not cached
    	if (!that.oCustomAttributeDefinitions[sTaskTypeID]) {
    		aRequests.push("/" + 
    			that.sTaskDefinitionCollectionName + 
    				"(SAP__Origin='" + jQuery.sap.encodeURL(sOrigin) +
    					"',TaskDefinitionID='" + jQuery.sap.encodeURL(sTaskTypeID) +"')" +
    						"/" + that.sCustomAttributeDefinitionNavProperty);
    		aParams.push("");
    	}
    	
    	// Push the requests to count the items in the detail tabs
    	if(aTabCounts != null) {
    		for (var i=0; i<aTabCounts.length;i++) {
    			aRequests.push(sCtxPath + "/" +aTabCounts[i] +"/$count");
    			aParams.push("");
    		}
    	}
    	
		// TODO ERROR_HANDLING improve the error handling and remove the task may be if 403 forbidden
		var fnSuccessCallback = $.proxy(function(aRequests, oData) {
			that.setDetailPageLoaded(true);
			var oValue = {};
			oValue.bValue = false;
			that.oEventBus.publish("cross.fnd.fiori.inbox.dataManager", "showReleaseLoaderOnInfoTab", oValue);
			if (oData.hasOwnProperty("__batchResponses") && oData.__batchResponses.length > 0) {
				
				var oTaskEntityResponse = jQuery.extend(true, {}, oData.__batchResponses[0]);
				
				if (oTaskEntityResponse.hasOwnProperty("data") && oTaskEntityResponse.statusCode >= '200' && oTaskEntityResponse.statusCode < '300') {
					var oTaskData = oTaskEntityResponse.data;
					var oTabCounts = {};
					for(var i = 1; i < oData.__batchResponses.length; i++) {
						switch(true) {
							case (aRequests[i].indexOf("CustomAttributeDefinitionData") !== -1):
								var oCustomAttributeDefintionData = oData.__batchResponses[i];
								if (oCustomAttributeDefintionData.hasOwnProperty("data") && oCustomAttributeDefintionData.statusCode >= '200' && oCustomAttributeDefintionData.statusCode < '300') {
									that.oCustomAttributeDefinitions[sTaskTypeID] = oCustomAttributeDefintionData.data.results;
								}
								break;
							case (aRequests[i].indexOf("Comments/$count") !== -1):
								var oCommentsCount = oData.__batchResponses[i];
								if (oCommentsCount.hasOwnProperty("data") && oCommentsCount.statusCode >= '200' && oCommentsCount.statusCode < '300') {
									oTabCounts.sCommentsCount = oCommentsCount.data;
								}
								break;
							case (aRequests[i].indexOf("Attachments/$count") !== -1):
								var oAttachmentsCount = oData.__batchResponses[i];
								if (oAttachmentsCount.hasOwnProperty("data") && oAttachmentsCount.statusCode >= '200' && oAttachmentsCount.statusCode < '300') {
									oTabCounts.sAttachmentsCount = oAttachmentsCount.data;
								}
								break;
							case (aRequests[i].indexOf("TaskObjects/$count") !== -1):
								var oTaskObjectsCount = oData.__batchResponses[i];
								if (oTaskObjectsCount.hasOwnProperty("data") && oTaskObjectsCount.statusCode >= '200' && oTaskObjectsCount.statusCode < '300') {
									oTabCounts.sTaskObjectsCount = oTaskObjectsCount.data;
								}
						}
					}
					// call original success function with task details data and custom attribute defintion data
					fnSuccess(oTaskData, that.oCustomAttributeDefinitions[sTaskTypeID], oTabCounts);
					
				} else {
					// If there is an error reading the task details refresh the task list and select the next task
					that._refreshListOnError(sOrigin, sInstanceID);
				}
			}
		}, null, aRequests);
		
		var fnErrorCallback = function(oError) {
			//Entire batch request failed
			var oValue = {};
			oValue.bValue = false;
			that.oEventBus.publish("cross.fnd.fiori.inbox.dataManager", "showReleaseLoaderOnInfoTab", oValue);
			that.oDataRequestFailed(oError);
		};
		
		var oValue = {};
		oValue.bValue = true;
		that.oEventBus.publish("cross.fnd.fiori.inbox.dataManager", "showReleaseLoaderOnInfoTab", oValue);

		
		that.setDetailPageLoaded(false);
		that.fireBatch({
			aPaths: aRequests,
			aUrlParameters: aParams, 
			sMethod: "GET",
			sBatchGroupId: "DetailWithDecisionOptions",
			numberOfRequests: aRequests.length,
			fnSuccessCallback: fnSuccessCallback,
			fnErrorCallback: fnErrorCallback
		});
    },
    
    
    // read custom attributes definitions from TaskDefinitionCollection
    readCustomAttributeDefinitionData:function( sOrigin, sTaskDefinitionID, fnSuccessCallback ){
    	var that = this;
    	var sContextPath = "/" + that.sTaskDefinitionCollectionName + "(SAP__Origin='" + jQuery.sap.encodeURL(sOrigin) +"',TaskDefinitionID='" + jQuery.sap.encodeURL(sTaskDefinitionID) +"')";
    	var sExpand = { $expand: that.sCustomAttributeDefinitionNavProperty };
    	
    	var fnSuccess = function(data, response){
    		fnSuccessCallback(data);
    	};
    	var fnErrorCallback = function( oError ) {
			that.oDataRequestFailed( oError );
		};
    	this.oDataRead(sContextPath,
    			sExpand, 
    			fnSuccess,
    			fnErrorCallback);
    	
    },
    
	readDecisionOptions: function(sOrigin, sInstanceID, sTaskTypeID, onSuccess, onError, bHandleBusyLoader) {

		var that = this;
		if (bHandleBusyLoader) {
			that.fnShowReleaseLoader(true);
		}

		this.oDataRead("/" + this.FUNCTION_IMPORT_DECISIONOPTIONS,
			{SAP__Origin: "'"+sOrigin+"'",
			InstanceID : "'"+sInstanceID+"'"
			},
			function (oData, oResponse) {
				if (bHandleBusyLoader) {
					that.fnShowReleaseLoader(false);
				}
				if (oData && oData.results) {
					that.oDecisionOptions[sOrigin + sTaskTypeID] = oData.results;
					if (onSuccess) {
						onSuccess(oData.results);
					}
				}
			},
			function (oError) {
				if (bHandleBusyLoader) {
					that.fnShowReleaseLoader(false);
				}
				that.oDataRequestFailed(oError);
				if (onError) {
					onError(oError);
				}
			}, "decisionOptions"
		);
	},
    
    /**
     * Private method for repeating the detail request in batch response without Comments/CreatedByDetails
     */
    _doReadDetail: function(sContextPath, aExpandEntitySets, bIncludeCreatedByDetails, fnSuccess, fnError) {
    	var sExpand;
    	
    	if (!bIncludeCreatedByDetails)
    		var i = aExpandEntitySets.indexOf("Comments/CreatedByDetails");
    		if (i >= 0) {
    			aExpandEntitySets[i] = "Comments";
    		}
    	sExpand = {$expand:aExpandEntitySets.join(",")};
    	this.oDataRead(sContextPath,
    			sExpand, 
    			fnSuccess,
    			fnError);
    },
    
    readPotentialOwners: function(sOrigin, sInstanceID, fnSuccess, fnError) {
    	var that = this;
		that.fnShowLoaderInDialogs(true);
    	this.oDataRead("/TaskCollection(SAP__Origin='" + jQuery.sap.encodeURL(sOrigin) + 
    			"',InstanceID='" + jQuery.sap.encodeURL(sInstanceID) + "')/PotentialOwners",
    			null, 
    			function(oData, oResponse) {
					that.fnShowLoaderInDialogs(false);
    				if (oData) {
						if (fnSuccess) {
							fnSuccess(oData);
						}
					}
    			},
    			function(oError) {
					that.fnShowLoaderInDialogs(false);
    				that.oDataRequestFailed(oError);
    				if (fnError){
    					fnError(oError);
    				}
    			}
    	);
    },
    
    /**
     * method to read task description
     */
    readDescription: function(sOrigin, sInstanceID, fnSuccess, fnError) {

    	var that = this;
		
		// Try to read the decision options from cache
		if (that.oDescriptions[sOrigin + sInstanceID]) {
			if (fnSuccess) {
				fnSuccess(that.oDescriptions[sOrigin + sInstanceID]);
			}
			return;
		}

		//Fetch task description
		that.oDataRead("/TaskCollection(SAP__Origin='" + jQuery.sap.encodeURL(sOrigin) + 
    			"',InstanceID='" + jQuery.sap.encodeURL(sInstanceID) + "')/Description",
    			null,
    			function(oData, oResponse) {
					if (oData) {
    					// store the results in the cache
						that.oDescriptions[sOrigin + sInstanceID] = oData;
						if (fnSuccess) {
							fnSuccess(oData);
						}
					}
    			},
    			function(oError) {
					that.oDataRequestFailed(oError);
    				if (fnError){
    					fnError(oError);
    				}
    			}
    	);
    },
    
    /**
     * method to read user info collection for a user.
     * (optional) send parameter bCustomBusy as true if you do not want this function to handle showing busy indicator
     */
    readUserInfo: function(sSAP_Origin, sUserID, fnSuccess, fnError, bCustomBusy) {
    	var that = this;
    	if (!bCustomBusy) {
    		that.fnShowReleaseLoader(true);
    	}
    	this.oDataRead("/UserInfoCollection(SAP__Origin='"+ jQuery.sap.encodeURL(sSAP_Origin) + "',UniqueName='" + jQuery.sap.encodeURL(sUserID) + "')",
    			null, 
    			function(oData, oResponse) {
    				if (!bCustomBusy) {
    					that.fnShowReleaseLoader(false);
    				}
    		  		if (oData) {
    		  			fnSuccess(oData);
    		  		}
    			},
    			function(oError) {
    				if (!bCustomBusy) {
    					that.fnShowReleaseLoader(false);
    				}
    				that.oDataRequestFailed(oError);
    				if (fnError){
    					fnError(oError);
    				}
    			});
    },

	_processFilterOptionsResult: function(oData) {
		this.oPriorityMap = {};
		this.oStatusMap = {};
		var oNameMap;
		
		jQuery.each(oData.results, $.proxy(function(iIndex, oEntry) {
			if (oEntry.Type == "PRIORITY") {
				if (!this.oPriorityMap.hasOwnProperty(oEntry.SAP__Origin)){
					this.oPriorityMap[oEntry.SAP__Origin] = {};
				}
			
				oNameMap = this.oPriorityMap[oEntry.SAP__Origin];
				oNameMap[oEntry.TechnicalName] = oEntry.DisplayName;
			} 
			else if (oEntry.Type == "STATUS") {
				if (!this.oStatusMap.hasOwnProperty(oEntry.SAP__Origin)){
					this.oStatusMap[oEntry.SAP__Origin] = {};
				}
			
				oNameMap = this.oStatusMap[oEntry.SAP__Origin];
				oNameMap[oEntry.TechnicalName] = oEntry.DisplayName;
			}
		}, this));
	},
	
	getPriorityDisplayName : function(sOrigin, sTechnicalName) {
		  var oNameMap;
		  
		  if (sOrigin == null || sTechnicalName == null){
			  throw "sOrigin and sTechnicalName mustn't be null";
		  }
		  
		  if (this.oPriorityMap && this.oPriorityMap.hasOwnProperty(sOrigin)) {
			  oNameMap = this.oPriorityMap[sOrigin];
			  if (oNameMap.hasOwnProperty(sTechnicalName)){
				  return oNameMap[sTechnicalName];
			  }
		  }
		  
		  return null;
	 },
	  
	 getStatusDisplayName : function(sOrigin, sTechnicalName) {
		 var oNameMap;
			  
		  if (sOrigin == null || sTechnicalName == null){
			  throw "sOrigin and sTechnicalName mustn't be null";
		  }
			  
		  if (this.oStatusMap && this.oStatusMap.hasOwnProperty(sOrigin)) {
			  oNameMap = this.oStatusMap[sOrigin];
			  if (oNameMap.hasOwnProperty(sTechnicalName)){
				  return oNameMap[sTechnicalName];
			  }
		  }
			  
		  return null;
	 },	 
	 getErrorMessageKey: function(sFIName) {
		
		 switch (sFIName) {
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

	 sendAction: function(sFIName, oDecision, sNote, fnSuccess, fnError) {
		 
		 this.fnShowReleaseLoader(true);
         var sErrorMessage = this.oi18nResourceBundle.getText(this.getErrorMessageKey(sFIName));
        
         var oUrlParams = {
                                        SAP__Origin: "'" + encodeURIComponent(oDecision.SAP__Origin) + "'",
                                        InstanceID: "'" + (oDecision.InstanceID) + "'"
        };
        
         if (oDecision.DecisionKey) {
                        oUrlParams.DecisionKey = "'" + oDecision.DecisionKey + "'";
        }
          
         if (sNote && sNote.length > 0) {
                        oUrlParams.Comments = "'" + sNote + "'";
        }
        
         this._performPost("/" + sFIName, oDecision.SAP__Origin, oUrlParams,
        	$.proxy(function (oDecision, fnSuccess) {
        		this.fnShowReleaseLoader(false);
        		// remove the processed item from the list
        		this.processListAfterAction(oDecision.SAP__Origin, oDecision.InstanceID);
        		this.triggerRefresh("SENDACTION", this.ACTION_SUCCESS);
        		this.fireActionPerformed();
        		// call the original success function
        		if (fnSuccess) {
        			fnSuccess();
        		}
        	}, this, oDecision, fnSuccess),
        	$.proxy(function (oError) {
        		this.fnShowReleaseLoader(false);
        		// call the original error function
        		if (fnError) {
        			fnError(oError);
        		}
        		//refresh the list after error and select a task accordingly
        		this.processListAfterAction(oDecision.SAP__Origin, oDecision.InstanceID);
        		this.fireActionPerformed();
        		this.triggerRefresh("SENDACTION", this.ACTION_FAILURE);
        	}, this), sErrorMessage);
	 },

	  triggerRefresh: function(sAction, sStatus){
	  	var mArguments = {}, bIsTableViewActive, bIsPhone = sap.ui.Device.system.phone;
	  		bIsTableViewActive = this.getTableView() && (!bIsPhone || this.getTableViewOnPhone());
	  		mArguments.bIsTableViewActive = bIsTableViewActive;
	  		mArguments.sAction = sAction;
	  		mArguments.sStatus = sStatus;
	  		if(bIsTableViewActive || bIsPhone){
                this.fireRefreshDetails(mArguments);
            }     
	  },
	  doForward: function(sOrigin, sInstanceID, sUserId, sNote, fnSuccess, fnError) {
		  
		  var oUrlParams = {
			SAP__Origin : "'" + sOrigin + "'",
			InstanceID : "'" + sInstanceID + "'",
			ForwardTo : "'" + sUserId + "'",
			Comments : "'" + sNote + "'"
		  };
		  this.fnShowReleaseLoader(true);
		  this._performPost("/Forward", sOrigin, oUrlParams, 
				  $.proxy(function (oData, oResponse) {
					  this.fnShowReleaseLoader(false);
					  // remove the processed item from the list
					  this.processListAfterAction(sOrigin, sInstanceID);
					   this.triggerRefresh("FORWARD", this.ACTION_SUCCESS);
					   this.fireActionPerformed();
					  // call the original success function
					  fnSuccess();
				  }, this), $.proxy(function(){
				  	this.fnShowReleaseLoader(false);
					  this.processListAfterAction(sOrigin, sInstanceID);
					   this.triggerRefresh("FORWARD",this.ACTION_FAILURE);
					   this.fireActionPerformed();
					  if (fnError) {
						  fnError();
					  }
				  }, this), this.oi18nResourceBundle.getText("dialog.error.forward"));
					  
	  },
	  
	  doResubmit: function(sOrigin, sInstanceID, dResubmissionDate, fnSuccess, fnError) {

		  var sUrlParams = "SAP__Origin="+"'" + sOrigin + "'" +  "&InstanceID=" + "'" + sInstanceID + "'" + "&ResubmissionDate=" + dResubmissionDate ;
		  this.fnShowReleaseLoader(true);
		  this._performPost("/"+ this.FUNCTION_IMPORT_RESUBMIT, sOrigin, sUrlParams,
				  $.proxy(function () {
				  	this.fnShowReleaseLoader(false);
					  this.processListAfterAction(sOrigin, sInstanceID);
					   this.triggerRefresh("RESUBMIT", this.ACTION_SUCCESS);
					   this.fireActionPerformed();
					  fnSuccess();
				  }, this),
				  $.proxy(function() {
				  	this.fnShowReleaseLoader(false);
					  this.processListAfterAction(sOrigin, sInstanceID);
					  this.triggerRefresh("RESUBMIT", this.ACTION_FAILURE);
					  this.fireActionPerformed();
					  if (fnError) {
						  fnError();
					  }
				  }, this),
				  this.oi18nResourceBundle.getText("dialog.error.resubmit"));
	  },
	  
	doMassClaimRelease: function(aItems, sAction, fnSuccess, fnError) {
		var that = this;
		var aRequests = [];
		var aParams = [];
			
		for (var i = 0; i < aItems.length; i++) {
			var oItem = aItems[i].getBindingContext().getObject();
			aRequests.push("/" + sAction);
			var sParams = "SAP__Origin='"+ jQuery.sap.encodeURL(oItem.SAP__Origin) +
			"'&InstanceID='" + jQuery.sap.encodeURL(oItem.InstanceID) + "'";
			aParams.push(sParams);
		}
		
		var fnSuccessCallback = function(oData) {
			that.fireActionPerformed();
			that.fnShowReleaseLoader(false);
			var aBatchResponses = oData.__batchResponses;
			var aSuccessList = [];
			var aErrorList = [];
			for (var i = 0; i < aBatchResponses.length; i++) {
				var oBatchResponse = aBatchResponses[i];
				var oItem = aItems[i].getBindingContext().getObject();
				var bSuccess = false;
				if (oBatchResponse.hasOwnProperty("__changeResponses")) {
					var oChangeResponse = oBatchResponse.__changeResponses[0];
					if (oChangeResponse.statusCode >= "200" && oChangeResponse.statusCode < "300"){
						bSuccess = true;
					}
				}
				if (bSuccess) {
					oItem.message = that.oi18nResourceBundle.getText("multi.processed");
					aSuccessList.push(oItem);
				} else {
					if (oBatchResponse.response) {
						oItem.message = JSON.parse(oBatchResponse.response.body).error.message.value;
						aErrorList.push(oItem);
					}
				}
			}
				
			if (fnSuccess){
				fnSuccess(aSuccessList, aErrorList);
			}
		};
		var fnErrorCallback = function(oError) {
			that.fireActionPerformed();
			that.fnShowReleaseLoader(false);
			that.oDataRequestFailed(oError);
			if (fnError){
				fnError(oError);
			}
		};
		
		that.fnShowReleaseLoader(true);
		that.oModel.setRefreshAfterChange(false);
		that.fireBatch({aPaths: aRequests, aUrlParameters: aParams, sMethod: "POST", sBatchGroupId: "massClaimRelease", numberOfRequests: aRequests.length,
			fnSuccessCallback: fnSuccessCallback, fnErrorCallback: fnErrorCallback});
	},

	 doMassForward: function(aItems, oAgent, sNote, fnSuccess, fnError) {
		  
		var aRequests = [];
		var aParams = [];
		var that = this;
		
		for (var i = 0; i < aItems.length; i++) {
			var oItem = aItems[i];
			var sPath = "/Forward";
			var sParams = "SAP__Origin='"+ jQuery.sap.encodeURL(oItem.SAP__Origin) +
			"'&InstanceID='" + jQuery.sap.encodeURL(oItem.InstanceID) +
			"'&ForwardTo='" + jQuery.sap.encodeURL(oAgent.UniqueName) + "'";
			
			if (sNote && sNote.length > 0){
				sParams += "&Comments='" + jQuery.sap.encodeURL(sNote) + "'";
			}
			
			aRequests.push(sPath);
			aParams.push(sParams);
		}
		
    	var fnSuccessCallback = function(oData) {
    		that.fireActionPerformed();
			that.fnShowReleaseLoader(false);
			var aBatchResponses = oData.__batchResponses;
			var aSuccessList = [];
			var aErrorList = [];
			
			for (var i = 0; i < aBatchResponses.length; i++) {
				var oBatchResponse = aBatchResponses[i];
				var oItem = aItems[i];
				var bSuccess = false;
				
				if (oBatchResponse.hasOwnProperty("__changeResponses")) {
					var oChangeResponse = oBatchResponse.__changeResponses[0];
					
					if (oChangeResponse.statusCode >= "200" && oChangeResponse.statusCode < "300"){
						bSuccess = true;
					}
				}
				
				if (bSuccess) {
					oItem.message = that.oi18nResourceBundle.getText("multi.processed");
					aSuccessList.push(oItem);
				} else {
					if (oBatchResponse.response) {
						oItem.message = JSON.parse(oBatchResponse.response.body).error.message.value;
						aErrorList.push(oItem);
					}
				}
			}
			
			if (fnSuccess){
				fnSuccess(aSuccessList, aErrorList, oAgent);
			}
    	};
    	
    	var fnErrorCallback = function(oError) {
    		that.fireActionPerformed();
			that.fnShowReleaseLoader(false);
			that.oDataRequestFailed(oError);
			
			if (fnError){
				fnError(oError);
			}
    	};
    	
		that.fnShowReleaseLoader(true);
		that.oModel.setRefreshAfterChange(false);
		that.fireBatch({aPaths:aRequests ,aUrlParameters:aParams, sMethod:"POST",sBatchGroupId:"massForward",numberOfRequests:aRequests.length,
			fnSuccessCallback:fnSuccessCallback,fnErrorCallback:fnErrorCallback});

	  },
	  
	  doMassResubmit: function(aItems, dResubmissionDate, fnSuccess, fnError, bHandleBusyLoader) {
		  
			var aRequests = [];
			var aParams = [];
			var that = this;
			var aChangedItems = [];
			
			for (var i = 0; i < aItems.length; i++) {
				var oItem = aItems[i];
				var sPath = "/"+ this.FUNCTION_IMPORT_RESUBMIT;
				var sParams = "SAP__Origin='"+ jQuery.sap.encodeURL(oItem.SAP__Origin) +
				"'&InstanceID='" + jQuery.sap.encodeURL(oItem.InstanceID) +
				"'&ResubmissionDate=" + dResubmissionDate;
				aRequests.push(sPath);
				aParams.push(sParams);
			}
			
	    	var fnSuccessCallback = function(oData) {
	    		that.fireActionPerformed();
	    		if (bHandleBusyLoader) {
	    			that.fnShowReleaseLoader(false);
	    		}
				var aBatchResponses = oData.__batchResponses;
				var aSuccessList = [];
				var aErrorList = [];
				
				for (var i = 0; i < aBatchResponses.length; i++) {
					var oBatchResponse = aBatchResponses[i];
					var oItem = aItems[i];
					var bSuccess = false;
					
					if (oBatchResponse.hasOwnProperty("__changeResponses")) {
						var oChangeResponse = oBatchResponse.__changeResponses[0];
						
						if (oChangeResponse.statusCode >= "200" && oChangeResponse.statusCode < "300"){
							bSuccess = true;
							aChangedItems.push({index: i, oData: oChangeResponse.data});
						}
					}
					
					if (bSuccess) {
						oItem.message = that.oi18nResourceBundle.getText("multi.processed");
						aSuccessList.push(oItem);
					} else {
						if (oBatchResponse.response) {
							oItem.message = JSON.parse(oBatchResponse.response.body).error.message.value;
							aErrorList.push(oItem);
						}
					}
				}
				
				if (fnSuccess){
					fnSuccess(aSuccessList, aErrorList, aChangedItems);
				}
	    	};
	    	
	    	var fnErrorCallback = function(oError) {
	    		that.fireActionPerformed();
	    		if (bHandleBusyLoader) {
	    			that.fnShowReleaseLoader(false);
	    		}
				that.oDataRequestFailed(oError);
				
				if (fnError){
					fnError(oError);
				}
	    	};
	    	that.oModel.setRefreshAfterChange(false);
			that.fireBatch({aPaths:aRequests ,aUrlParameters:aParams, sMethod:"POST",sBatchGroupId:"massResubmit",numberOfRequests:aRequests.length,
				fnSuccessCallback:fnSuccessCallback,fnErrorCallback:fnErrorCallback});
	  },
	  
	  searchUsers: function(sOrigin, sSearchPattern, iMaxResults, fnSuccess) {
		  this.fnShowLoaderInDialogs(true);
		  var that = this;
		  var oParams = {
				  SAP__Origin: "'" + sOrigin + "'",
				  SearchPattern: "'" + sSearchPattern + "'",
				  MaxResults: iMaxResults
		  };
		  this.oDataRead("/SearchUsers",
					oParams,
					function (oData, oResponse) {
			  			that.fnShowLoaderInDialogs(false);
						if (oData && oData.results) {
							if (fnSuccess) {
								fnSuccess(oData.results);
							}
						}
					},
					function (oError) {
						that.fnShowLoaderInDialogs(false);
						that.oDataRequestFailed(oError);
					}
			);
	  },	  
	  
	  _performPost: function(sPath, sOrigin, oUrlParams, fnSuccess, fnError, sErrorMsg) {
						this.oDataCreate(
							sPath,
							sOrigin,
							oUrlParams,
							undefined,
							undefined,
							// the success callback
							$.proxy(function(oData, oResponse) {
								$.sap.log.info("successful action");
								if (fnSuccess) {
									$.proxy(fnSuccess(oData, oResponse), this);
								}
							}, this),
							// the error callback - TODO refine with nice error popup
							$.proxy(function(oError) {
								// creating a custom message to display
								if (sErrorMsg) {
									
									var sDetails = this.getErrorMessage(oError);
									var oError = {
											customMessage: {
												message: sErrorMsg,
												details: sDetails
											}
									
									};
								}else{
									var sDetails = this.getErrorMessage(oError);
									var oError = {
											customMessage: {
												message: oError.message,
												details: sDetails
											}
									
									};
									oError.customMessage.details = sDetails;
								}
			    				this.oDataRequestFailed(oError, fnError);
							}, this)
						);
	  },
	  
	  oDataRequestFailed: function(oError, fnError) {
		  var sMessage;
		  var sDetails;
		  
		  if (oError.hasOwnProperty("customMessage")) {
			  sMessage = oError.customMessage.message;
			  sDetails = oError.customMessage.details;		
		  } else {
			  if (oError.response && oError.response.statusCode == "0"){
				  sMessage = this.oi18nResourceBundle.getText("DataManager.connectionError");
			  }else{
				  sMessage = this.oi18nResourceBundle.getText("DataManager.HTTPRequestFailed");
			  }
			  if (oError.response && oError.response.body != "" && oError.response.statusCode == "400") {
				  var oParsedError = JSON.parse(oError.response.body);
				  sDetails = oParsedError.error.message.value;
			  } else {
				  sDetails = oError.response ? oError.response.body : null;
			  }
		  }
		  
		  var oParameters = {message: sMessage,
		                     responseText: sDetails};
		  this.showLocalErrorMessage(oParameters, fnError);
		  this.oModel.fireRequestFailed(oParameters);
	  },
	  
	  oDataRead: function(sPath, oUrlParams, fnSuccess, fnError, groupId) {
		  this.oModel.read( sPath, {urlParameters:oUrlParams, success:fnSuccess, error:fnError, groupId: groupId});
	  },

	  oDataCreate: function(sPath, sOrigin, oUrlParams, oData, oContext, fnSuccess, fnError) {
          var oSettings = {
                                          context : oContext,
                                          success: fnSuccess,
                                          error: fnError,
                                          urlParameters: oUrlParams
          };
          //this.oPostActionModel.create(sPath, oData, oSettings);
          this.oModel.create(sPath, oData, oSettings);
	  },

	  
	  oDataAddOperationsAndSubmitBatch: function(aReadOperations, aChangeOperations, fnSuccess, fnError, bAsync) {
		  
		  this.oPostActionModel.clearBatch();
			  
		  if (aReadOperations){
			  this.oPostActionModel.addBatchReadOperations(aReadOperations);
		  }
			  
		  if (aChangeOperations) {
			  // Embed change operations in different change sets.
			  
			  for (var i = 0; i < aChangeOperations.length; i++){
				  this.oPostActionModel.addBatchChangeOperations([aChangeOperations[i]]);
			  }
		  }
		  
		  this.oPostActionModel.submitBatch(fnSuccess, fnError, bAsync);
	  },
	  
	  oDataConvertHeaders: function(sConvertHeader, mHeaders) {
	      for (var sHeaderName in mHeaders) {
	    	  if (sHeaderName !== sConvertHeader && sHeaderName.toLowerCase() === sConvertHeader.toLowerCase()) {
	    		  var oHeaderValue = mHeaders[sHeaderName];
	              delete mHeaders[sHeaderName];
	              mHeaders[sConvertHeader] = oHeaderValue;
	              break;
	          }
	      }
	  },
	  
	  addComment: function(sSAP__Origin, sInstanceID, sComment, fnSuccess, fnError) {
		  var oUrlParams = {
			SAP__Origin : "'" + sSAP__Origin + "'",
			InstanceID : "'" + sInstanceID + "'",
			Text : "'" + sComment + "'"
		  };
		  this._performPost("/AddComment", sSAP__Origin, oUrlParams,
					$.proxy(function (data, response) {
						if (fnSuccess) {
							fnSuccess(data, response);
						}
					}, this),
					$.proxy(function (oError) {
						// call the original error function
						if (fnError) {
							fnError(oError);
						}
					}, this), this.oi18nResourceBundle.getText("dialog.error.addComment"));		  
	  },
	  
	  _createSubstitutionRule: function(oAddSubstituteEntry, aProviders, fnSuccess, fnError) {
		  var aRequests = [];
		  var aParams = [];
		  var aPropertiesArray = [];
          var that = this;
          //looping through all the backends where the substitution rule was not created successfully
          jQuery.each(aProviders, function(i, sProvider) {
                    var oTempEntry = {};
                    oTempEntry = jQuery.extend(true, {}, oAddSubstituteEntry);
                    oTempEntry.SAP__Origin = sProvider;
                    aRequests.push("/SubstitutionRuleCollection");
                    aParams.push("");
                    aPropertiesArray.push(oTempEntry );
                    
          });
          
          var fnSuccessCallback = function(oData) {
					that.fnShowReleaseLoader(false);
                    var aBatchResponses = oData.__batchResponses;
                    var aSuccessList = [];
                    var aErrorList = [];
                    
                    jQuery.each (aBatchResponses, function (index, oBatchResponse) {
                    	var bSuccess = false;
                    	if (oBatchResponse.hasOwnProperty("__changeResponses")) {
                    		var oChangeResponse = oBatchResponse.__changeResponses[0];
                    		if (oChangeResponse.statusCode >= "200" && oChangeResponse.statusCode < "300"){
                    			bSuccess = true;
                    		}
                    	}
                    	if (bSuccess) {
                    		// pushing index to aSuccessList
                    		aSuccessList.push(index);
                    	} else {
                    		aErrorList.push(oBatchResponse);
                    	}
                    });
                    
                    //display error message if substitution rule creation fails in one of the backends
                    if(aErrorList.length>0) {
                    	var sErrorMessage = aSuccessList.length > 0 ? that.oi18nResourceBundle.getText("substn.create.multi.error") : that.oi18nResourceBundle.getText("substn.create.error");
                    	that._handleBatchErrors(aErrorList, sErrorMessage);
                    }    
                    //show a success message if rule was created successfully in all the backends and perform a refresh
                    if (fnSuccess) {
                    	  fnSuccess(aSuccessList, aErrorList);
                    }
					that.fnShowReleaseLoader(false);
          };
          
          var fnErrorCallback = function(oError) {
					that.fnShowReleaseLoader(false);
                    that.oDataRequestFailed(oError);
                    if (fnError) {
                    	fnError(oError);
                    }
         };
		that.fnShowReleaseLoader(true);
         that.fireBatch({aPaths:aRequests ,aUrlParameters:aParams, sMethod:"POST",sBatchGroupId:"CreateSubstitutionRule",numberOfRequests:aRequests.length,fnSuccessCallback:fnSuccessCallback,fnErrorCallback:fnErrorCallback,aProperties:aPropertiesArray});
      },

      
      showLocalErrorMessage:function(oError, fnError) {
    	// v2 provides the error nested in response parameter
			
			var	oSettings = {
					type : sap.ca.ui.message.Type.ERROR,
					message : oError.message,
					details : oError.responseText
				};
			this.showMessageBox(oSettings, fnError);
      },
      
      showMessageBox: function(oSettings, fnError){
    	  sap.ca.ui.message.showMessageBox(oSettings, fnError);  
      },
	  
	  readSubstitutionData : function(fnSuccess) {
			var that = this;
			
			var aRequests = [];
			var aParams = [];
			var config = new cross.fnd.fiori.inbox.Configuration();
			var isBPM = config.getServiceList()[0].serviceUrl === "/bpmodata/tasks.svc/";
			//Fetch the Substitution Rules
			aRequests.push("/SubstitutionRuleCollection");
			aParams.push("");
			
			//System Collection setup as first inner request
	    	if (!this.aSystemInfoCollection && !isBPM) {
	    		//not in the cache yet
	    		aRequests.push("/SystemInfoCollection");
	    		aParams.push("");
	    	} 
			
	    	//System Collection setup as second inner request
	    	if (!this.aSubstitutionProfilesCollection) {
	    		//not in the cache yet
				aRequests.push("/SubstitutionProfileCollection");
				aParams.push("");
	    	} 
			
    		var fnSuccessCallback = function(oData) {
    			if (oData.hasOwnProperty("__batchResponses") && oData.__batchResponses.length >= 1) {
    				// Result from batch read
    				var aErrors = [];
    				
    				if (oData.__batchResponses.length == 3) {

    					//Substitution Profile options data was requested as third inner request
    					var oSPBatchResp = oData.__batchResponses[2];
    					// if one of the call in batch request fails, do not cache the data
    					if (!(aErrors.length > 0) && oSPBatchResp.hasOwnProperty("data") && oSPBatchResp.statusCode >= '200' && oSPBatchResp.statusCode < '300') {
    						//Caching the Substitution Profiles
    						that.aSubstitutionProfilesCollection = oSPBatchResp.data.results;
    					} else if (oSPBatchResp.hasOwnProperty("response") && oSPBatchResp.response.statusCode >= '400') {
    						aErrors.push(JSON.parse(oSPBatchResp.response.body));
    					}
    					
    					//System Info data was requested as second inner request
    					var oSIBatchResp = oData.__batchResponses[1];
    					// if one of the call in batch request fails, do not cache the data
    					if (!(aErrors.length > 0) && oSIBatchResp.hasOwnProperty("data") && oSIBatchResp.statusCode >= '200' && oSIBatchResp.statusCode < '300') {
    						//Caching the System Info
    						that.aSystemInfoCollection = oSIBatchResp.data.results;
    					} else if (oSIBatchResp.hasOwnProperty("response") && oSIBatchResp.response.statusCode >= '400') {
    						aErrors.push(JSON.parse(oSIBatchResp.response.body));
    					}
    				} 
    				else if (oData.__batchResponses.length == 2 && isBPM){
    					//Substitution Profile options data was requested as second inner request
    					var oSPBatchResp = oData.__batchResponses[1];
    					// if one of the call in batch request fails, do not cache the data
    					if (!(aErrors.length > 0) && oSPBatchResp.hasOwnProperty("data") && oSPBatchResp.statusCode >= '200' && oSPBatchResp.statusCode < '300') {
    						//Caching the Substitution Profiles
    						that.aSubstitutionProfilesCollection = oSPBatchResp.data.results;
    					} else if (oSPBatchResp.hasOwnProperty("response") && oSPBatchResp.response.statusCode >= '400') {
    						aErrors.push(JSON.parse(oSPBatchResp.response.body));
    					}
    					
    					that.aSystemInfoCollection = [{SAP__Origin: "NA", SystemAlias: "NA", SystemType: "BPM"}];
    				}
    				
    				//Substitution Rules data was requested as first inner request
    				var oSRBatchResp = oData.__batchResponses[0];
    				// call fnSuccess only if all the calls in the batch request are successful
    				if (!(aErrors.length > 0) && oSRBatchResp.hasOwnProperty("data") && oSRBatchResp.statusCode >= '200' && oSRBatchResp.statusCode < '300') {
    					fnSuccess(oSRBatchResp.data, that.aSubstitutionProfilesCollection, that.aSystemInfoCollection);
    				} else if (oSRBatchResp.hasOwnProperty("response") && oSRBatchResp.response.statusCode >= '400') {
    					aErrors.push(JSON.parse(oSRBatchResp.response.body));
    				}
    				
					that.fnShowReleaseLoader(false);
    				that._handleBatchErrors(aErrors);
    			}
    		};
    		
    		var fnErrorCallback = function(oError) {
    			//Entire batch request failed
				that.fnShowReleaseLoader(false);
    			that.oDataRequestFailed(oError);
    		};
    		
			that.fnShowReleaseLoader(true);
    		that.fireBatch({aPaths:aRequests ,aUrlParameters:aParams, sMethod:"GET",sBatchGroupId:"SubstitutionData",numberOfRequests:aRequests.length,
    			fnSuccessCallback:fnSuccessCallback,fnErrorCallback:fnErrorCallback});
		},
		
		updateSubstitutionRule: function(oAddUserDetails, bEnabled, fnSuccess, fnError) {

			var aRequests = [];
			var aParams = [];
			var that = this;
			var sUser = cross.fnd.fiori.inbox.Substitution.formatterSubstitutedUserName(oAddUserDetails.User, oAddUserDetails.FullName);
			var aRulesToUpdate = bEnabled? oAddUserDetails.aDisabledRules : oAddUserDetails.aEnabledRules; //if enable is true then activate else de activate
			
			for (var i = 0; i < aRulesToUpdate.length; i++) {
				var oItem =  aRulesToUpdate[i];
				var sPath = "/"+ that.FUNCTION_IMPORT_ENABLESUBSTITUTIONRULE;
				var oParams = {
						SubstitutionRuleID : "'" + 	oItem.subRuleId + "'",
						SAP__Origin : "'" + 	oItem.sOrigin + "'",
						Enabled : bEnabled
						};
				aRequests.push(sPath);
				aParams.push(oParams);
			}
			
			var fnSuccessCallback = function(oData) {
				var aErrorList = [];
				var aSuccessList = [];
				var aBatchResponses = oData.__batchResponses;
				var sMessage;
				
				jQuery.each(aBatchResponses, function(index, oBatchResponse) {
					var bSuccess = false;
					if (oBatchResponse.hasOwnProperty("__changeResponses")) {
						var oChangeResponse = oBatchResponse.__changeResponses[0];
						if (oChangeResponse.statusCode >= "200" && oChangeResponse.statusCode < "300") {
							aSuccessList.push(index);
							bSuccess = true;
						}
					}
					if (!bSuccess) {
						aErrorList.push(oBatchResponse);
					} 
				});
				
				if (aSuccessList.length > 0 && aErrorList.length === 0 ) {
					// if action is fully successfull
					jQuery.sap.delayedCall(500, that, function() {
						sMessage = bEnabled ? that.oi18nResourceBundle.getText("addInbox.enable.rule.success", sUser) : 
							that.oi18nResourceBundle.getText("addInbox.disable.rule.success", sUser);
						sap.ca.ui.message.showMessageToast(sMessage);
					});	
				} else {
					// if action has failed completely
					if (aSuccessList.length === 0) {
						sMessage = that.oi18nResourceBundle.getText("addInbox.action.error");
					} else {
						// if action is partially successfull
						sMessage = bEnabled ? that.oi18nResourceBundle.getText("addInbox.enable.rule.partial.success", sUser) : 
							that.oi18nResourceBundle.getText("addInbox.disable.rule.partial.success", sUser);
					}
				}
				
				that._handleBatchErrors(aErrorList, sMessage);
				
				if(fnSuccess) {
					fnSuccess(aSuccessList.length);
				}
			};
			
			var fnErrorCallback = function(oData) {
				var sDetails = that.getErrorMessage(oError);
				var oError = {
						customMessage: {
							message: that.oi18nResourceBundle.getText("addInbox.action.error"),
							details: sDetails
						}
				};
				that.oDataRequestFailed(oError);
				if(fnError) {
					fnError();
				}
			};
			
			that.fireBatch({
				aPaths:aRequests ,
				aUrlParameters:aParams, sMethod:"POST",
				sBatchGroupId:"updateSubstitution",
				numberOfRequests:aRequests.length,
				fnSuccessCallback:fnSuccessCallback,
				fnErrorCallback:fnErrorCallback
			});
		},
		
	    deleteAttachment: function(sSAP__Origin, sInstanceID, sAttachmentId, fnSuccess, fnError){
	    	var sPath = "/AttachmentCollection(SAP__Origin='" + jQuery.sap.encodeURL(sSAP__Origin) + 
							"',InstanceID='" + jQuery.sap.encodeURL(sInstanceID) + "',ID='" + jQuery.sap.encodeURL(sAttachmentId) + "')/$value";
	    	var aRequests = [];
	    	aRequests.push(sPath);
	    	var fnSuccessCallback = function(){
	    		fnSuccess();
	    	};
	    	var fnErrorCallback = function(){
	    		fnError();
	    	};
	    	// TODO why do we need to send the delete request in a batch ?
	    	this.fireBatch({aPaths:aRequests ,aUrlParameters:"", sMethod:"DELETE",sBatchGroupId:"DeleteAttachment",numberOfRequests:aRequests.length,fnSuccessCallback:fnSuccessCallback,fnErrorCallback:fnErrorCallback});
	    },
	    
	    deleteSubstitution: function(aRuleKeys, fnSuccess) {
	    	var that = this;
	    	this.fnShowReleaseLoader(true);
	    	if (aRuleKeys.length === 1) { // if only one substitution rule needs to be deleted
	    		

	    		var oUrlParams = {
					SubstitutionRuleID : "'" + aRuleKeys[0].SubstitutionRuleId + "'", 
					SAP__Origin : "'" + aRuleKeys[0].SAP__Origin + "'"
	    		};
	    		
	    		var fnError = function(){
	    			that.fnShowReleaseLoader(false);
	    		};
	    		
	    		var fnSuccessCallback = function(oData){
	    			that.fnShowReleaseLoader(false);
	    			fnSuccess(oData);
	    		};

	    		this._performPost("/DeleteSubstitutionRule", aRuleKeys[0].SAP__Origin, oUrlParams, fnSuccessCallback, fnError, this.oi18nResourceBundle.getText("substn.delete.error"));
	    		
	    	} else if(aRuleKeys.length > 1) { // if more than one delete requests need to be sent
	    		
	    		var aRequests = [];
	    		var aParams = [];
	    		
	    		// creating batch requests
	    		jQuery.each(aRuleKeys, $.proxy(function(index, oRule) {
	    			var oEntry = this.getDeleteSubtnEntry(oRule);
	    			aRequests.push(oEntry.rule);
	    			aParams.push(oEntry.parameters);
	    		}, this));
	    		
	    		var fnSuccessCallback = function(oData) {
					that.fnShowReleaseLoader(false);
					var aBatchResponses = oData.__batchResponses;
					var aSuccessList = [];
					var aErrorList = [];
					var sDetails  = "";
					
					jQuery.each(aBatchResponses, function(index, oBatchResponse) {
						
						var bSuccess = false;
						
						if (oBatchResponse.hasOwnProperty("__changeResponses")) {
							var oChangeResponse = oBatchResponse.__changeResponses[0];
							
							if (oChangeResponse.statusCode >= "200" && oChangeResponse.statusCode < "300") {
								aSuccessList.push(index);
								bSuccess = true;
							}
						}
						
						if (!bSuccess) {
							aErrorList.push(oBatchResponse);
						} 
						
					});
					
					if (aSuccessList.length > 0) {
						fnSuccess(aSuccessList, aErrorList);
					}
					
					if (aErrorList.length > 0) {
						var sErrorMessage = aSuccessList.length > 0 ? this.oi18nResourceBundle.getText("substn.delete.multi.error") : this.oi18nResourceBundle.getText("substn.delete.error");
						this._handleBatchErrors(aErrorList, sErrorMessage);
					}
					
		    	};
	    		
	    		var fnErrorCallback = function(oError) {
	    			that.fnShowReleaseLoader(false);
	    			var sDetails = this.getErrorMessage(oError);
					var oError = {
							customMessage: {
								message: this.oi18nResourceBundle.getText("substn.delete.error"),
								details: sDetails
							}
					
					};
					this.oDataRequestFailed(oError);
		    	};
		    	
		    	that.fireBatch({aPaths:aRequests ,aUrlParameters:aParams, sMethod:"FUNCTIONIMPORT",sBatchGroupId:"DeleteSubstitution",numberOfRequests:aRequests.length,
		    		fnSuccessCallback:fnSuccessCallback,fnErrorCallback:fnErrorCallback});
	    	}
	    	
		},
		
		getDeleteSubtnEntry: function(oRule) {
			return {
				rule: "/DeleteSubstitutionRule", 
				parameters: {
					SubstitutionRuleID : oRule.SubstitutionRuleId,
					SAP__Origin : oRule.SAP__Origin
					} 
			};
		},
		
		getErrorMessage: function(oError) {
/*			if (oError.response && oError.response.body != "") {
				return oError.response.body;
			}*/
	    	if(oError.response && oError.response.body && oError.response.body != ""){
				try{
					var oMessage = JSON.parse(oError.response.body);
					 return (oMessage.error.message.value ? oMessage.error.message.value : null);
				}catch(e){
					return oError.response.body;
				}
	        }else if(oError.responseText && oError.responseText != ""){
				try{
					var oMessage = JSON.parse(oError.responseText);
					 return (oMessage.error.message.value ? oMessage.error.message.value : null);
				}catch(e){
					return oError.responseText;
				}
	        }else if(oError.getParameter("responseText") || oError.getParameter("response").body){
	        	return oError.getParameter("responseText") ? oError.getParameter("responseText"): oError.getParameter("response").body;
	        }else {
	        	return null;
	        }			
		},
					
		readSubstitutionProfiles: function(onSuccess, onError) {
			if (this.aSubstitutionProfilesCollection) {
				if (onSuccess) {
					onSuccess(this.aSubstitutionProfilesCollection);
				}
				return;
			}
					
			var that = this;
			that.fnShowReleaseLoader(true);
					
			this.oDataRead("/SubstitutionProfileCollection",
					null,
					function (oData, oResponse) {
						that.fnShowReleaseLoader(false);
						if (oData && oData.results) {
							if (onSuccess) {
								onSuccess(oData.results);
							}
						}
					},
					function (oError) {
						that.fnShowReleaseLoader(false);
						that.oDataRequestFailed(oError);
						if (onError) {
							onError(oError);
						}
					}
				);
		},
		
		readSystemInfoCollection: function(onSuccess, onError) {
			if (this.aSystemInfoCollection) {
				if (onSuccess) {
					onSuccess(this.aSystemInfoCollection);
				}
				return;
			}
			var config = new cross.fnd.fiori.inbox.Configuration();
			var isBPM = config.getServiceList()[0].serviceUrl === "/bpmodata/tasks.svc/";
			if (isBPM){
				this.aSystemInfoCollection = [{SAP__Origin: "NA", SystemAlias: "NA", SystemType: "BPM"}];
				if (onSuccess) {
					onSuccess(this.aSystemInfoCollection);
				}
				return;
			}
			var that = this;
			that.fnShowReleaseLoader(true);	
			this.oDataRead("/SystemInfoCollection",
					null,
					function (oData, oResponse) {
						that.fnShowReleaseLoader(false);
						if (oData && oData.results) {
							that.aSystemInfoCollection = oData.results;
							if (onSuccess) {
								onSuccess(oData.results);
							}
						}
					},
					function (oError) {
						that.fnShowReleaseLoader(false);
						that.oDataRequestFailed(oError);
						if (onError) {
							onError(oError);
						}
					}
				);
		},
		
		readTaskDefinitionCollection: function(onSuccess, onError, merge ) {
			var that = this;
			this.oDataRead("/TaskDefinitionCollection",
					null,
					function (oData, oResponse) {
						that.fnShowReleaseLoader(false);
						if (oData && oData.results) {
							if (onSuccess) {
								onSuccess(oData.results, merge);
							}
						}
					},
					function (oError) {
						that.oDataRequestFailed(oError);
						if (onError) {
							onError([]);
						}
					}
				);
		},		
		
		fnGetCount: function( sOrigin, sInstanceID, fnSuccessCallback, sEntity ){
			var that = this;
			var sContextPath = this._getTaskContextPath(sOrigin, sInstanceID) +"/"+ sEntity + "/$count";
	    
	    	var fnErrorCallback = function( oError ) {
				that.oDataRequestFailed( oError );
			};
			
	    	this.oDataRead(sContextPath, null, function(oData){
	    		fnSuccessCallback(oData);
	    	}, fnErrorCallback);
		},
		
		// function to get the context path of a task
		_getTaskContextPath: function(sOrigin, sInstanceID) {
			return "/" + "TaskCollection" + "(SAP__Origin='" + jQuery.sap.encodeURL(sOrigin) +"',InstanceID='" + jQuery.sap.encodeURL(sInstanceID) +"')";
		},
		
		/* This method is used to check if the user has a picture in backend or not, 
		Returns true if the image is present else false */
		fnIsImagePresent: function(uri){
			var isImagePresent = false;
			jQuery.ajax({
				url : uri,
				type : 'GET',
				contentType : 'image/jpeg',
				async: false,
			success : function(data,status,jqXHR) {
				/* if the returned response is true and there is no data that means there is no picture 
				 for that current user, hence set the default place holder */
				if (data != "" && data != undefined){
					isImagePresent =  true;
				}
				},
				error : function(data, text, code) {
					// if the call fails means unable to fetch the picture, set to false
					isImagePresent =  false;
				}
			});  
			
			return isImagePresent;
		},
		
		fnShowReleaseLoader: function(bValue){
			var oValue = {};
			oValue["bValue"] = bValue;
			this.oEventBus.publish("cross.fnd.fiori.inbox.dataManager", "showReleaseLoader", oValue);
		},
		
		fnShowLoaderInDialogs: function(bValue){
			var oValue = {};
			oValue["bValue"] = bValue;
			sap.ca.scfld.md.app.Application.getImpl().getComponent().getEventBus().publish("cross.fnd.fiori.inbox.dataManager", "showLoaderInDialogs", oValue);

		},
		
		_refreshListOnError: function(sOrigin, sInstanceID) {
			this.oModel.bFullRefreshNeeded = true;
			jQuery.sap.delayedCall(500, this, function() {
				sap.ca.ui.message.showMessageToast(this.oi18nResourceBundle.getText("dialog.info.task_completed"));
			});	
			
			// in case of phone, remove the stored context path and navigate to master 
			if (sap.ui.Device.system.phone) {
				this.oEventBus.publish("cross.fnd.fiori.inbox.dataManager", "refreshOnError");
			} else {
				// in case of devices other than phone, select the next item from the list
				this.processListAfterAction(sOrigin, sInstanceID);
			}
			// refresh the list
			this.oModel.refresh();
		},
		
		// check status of the task. if there is no error or task has not been completed, open the task UI. else refresh the list.
		checkStatusAndOpenTask: function(sOrigin, sInstanceID, fnOpenTask) {
			
			var that = this;
			
			var fnError = function() {
				that._refreshListOnError(sOrigin, sInstanceID);
			};
			
			var fnSuccess = function(oData) {
				if (oData.hasOwnProperty("__batchResponses") && oData.__batchResponses.length > 0) {
					var oStatusResponse = oData.__batchResponses[0];
					if (oStatusResponse.hasOwnProperty("data") && oStatusResponse.statusCode >= '200' && oStatusResponse.statusCode < '300') {
						// might be we do not require thsi check at all , need to confirm this
						if ( !(oStatusResponse.data.Status === that.sStatusCompleted) && (that.bOutbox==false) ) {
							fnOpenTask();
							return;
						}else if(that.bOutbox==true){
							fnOpenTask();
							return;
						}
					}
				}
				fnError();
			};
			
			/*
			 * TODO do we show a busy loader ?
			 * TODO send the query as a read request
			 * sending it as a batch as v2 oDataModel in case of batch calls fires requestCompleted event first and then success handler
			 * */
			this.fireBatch({
				aPaths: [this._getTaskContextPath(sOrigin, sInstanceID)],
				aUrlParameters: [{$select: "Status"}], 
				sMethod:"GET",
				sBatchGroupId:"GetLatestStatus",
				numberOfRequests: 1,
				fnSuccessCallback: fnSuccess,
				fnErrorCallback: fnError
			});
			
		},
		
		readAddInboxUsers: function(fnSuccess, fnError) {
	    	var that = this;
	    	this.oDataRead("/SubstitutesRuleCollection",
	    			null, 
	    			function(oData, oResponse) {
	    				if (oData) {
							if (fnSuccess) {
								fnSuccess(oData);
							}
						}
	    			},
	    			function(oError) {
	    				fnError();
	    				that.fnShowReleaseLoader(false);
	    				var sDetails = that.getErrorMessage(oError);
	    				var oError = {
	    						customMessage: {
	    							message: that.oi18nResourceBundle.getText("addInbox.read.error"),
	    							details: sDetails
	    						}
	    				
	    				};
	    				that.oDataRequestFailed(oError);
	    			}
	    	);
	    },
	    
	    readSubstitutedUserList: function(fnSuccess, fnError) {
	    	var that = this;
	    	this.oDataRead("/SubstitutedUsersCollection",
	    			null, 
	    			function(oData, oResponse) {
	    				if (oData && fnSuccess) {
								fnSuccess(oData);
						}
	    			},
	    			function(oError) {
	    				fnError();
	    				that.fnShowReleaseLoader(false);
	    				var sDetails = that.getErrorMessage(oError);
	    				var oError = {
	    						customMessage: {
	    							message: that.oi18nResourceBundle.getText("substitutesUser.read.error"),
	    							details: sDetails
	    						}
	    				
	    				};
	    				that.oDataRequestFailed(oError);
	    			}
	    	);
	    },
	    
	    refreshListOnAddInboxDone: function(oEvent) {
	    	this.readTaskDefinitionCollection(jQuery.proxy(this.updateTaskDefinitionModel), null, false);
	    	this.oModel.bFullRefreshNeeded = true;
	    	this.oModel.refresh();
	    },
	    
	    updateTaskDefinitionModel: function(oResult, merge){
	    	var masterController = sap.ca.scfld.md.app.Application.getImpl().oCurController.MasterCtrl;
	    	masterController.getView().getModel("taskDefinitionsModel").setData(oResult, merge);
	    },
	    
	    handleMetadataFailed: function(oError) {
	    	var sDetails = this.getErrorMessage(oError);
			var oError = {
					customMessage: {
						message: this.oi18nResourceBundle.getText("DataManager.metadataFailed"),
						details: sDetails
					}
			};
			this.oDataRequestFailed(oError);
	    },
	    
	    // asynchronous call to check whether the picture exists in the backend or not
		checkImageAvailabilityAsync: function(sUrl, fnSuccess, fnError){
			jQuery.ajax({
				url : sUrl,
				type : 'GET',
				contentType : 'image/jpeg',
				async: true,
				success : function(data,status,jqXHR) {
					if (data != "" && data != undefined){
						fnSuccess();
					} else {
						fnError();
					}
				},
				error : function(data, text, code) {
					fnError();
				}
			});  
		},
		
		fetchUIExecutionLink: function(oItem, fnSuccess, fnError){
			var that = this;
			if(!oItem.TaskSupports.UIExecutionLink){
				fnError();
				return;
			}
			// check if UI Execution Data is a nav property. If yes, fetch the data. Else, return the UI Link present in the task data.
			if (!this.isUIExecnLinkNavProp() && oItem.GUI_Link) {
				var oUIExecnLinkData = {};
                oUIExecnLinkData.GUI_Link = oItem.GUI_Link;
                this.oUIExecutionLinks[oItem.SAP__Origin + oItem.InstanceID] = oUIExecnLinkData;
				fnSuccess(oUIExecnLinkData);
			} else {
				if (this.oUIExecutionLinks[oItem.SAP__Origin + oItem.InstanceID]) {
					fnSuccess(this.oUIExecutionLinks[oItem.SAP__Origin + oItem.InstanceID]);
				} else {
					var oValue = {};
					oValue.bValue = true;
					this.oEventBus.publish("cross.fnd.fiori.inbox.dataManager", "UIExecutionLinkRequest", oValue);
					this.oDataRead(this._getTaskContextPath(oItem.SAP__Origin, oItem.InstanceID) + "/UIExecutionLink", null, function(data){
			    		that.oUIExecutionLinks[oItem.SAP__Origin + oItem.InstanceID] = data;
						var oValue = {};
						oValue.bValue = true;
						that.oEventBus.publish("cross.fnd.fiori.inbox.dataManager", "UIExecutionLinkRequest", oValue);
						fnSuccess(data);
					}, function(error){
						fnError(error);
						var oValue = {};
						oValue.bValue = true;
						that.oEventBus.publish("cross.fnd.fiori.inbox.dataManager", "UIExecutionLinkRequest", oValue);
			    	}, "UILink");
				}
			}
		},
		
		isUIExecnLinkNavProp: function(){
			if(this.oServiceMetaModel && this.bUIExecnLinkNavProp === undefined){
				var oTaskEntity = this.oServiceMetaModel.getODataEntityType("TASKPROCESSING.Task");
				if(oTaskEntity){
					this.bUIExecnLinkasNavProp = !this.oServiceMetaModel.getODataProperty(oTaskEntity, "GUI_Link") ;
				}
			}
	        return this.bUIExecnLinkasNavProp;
        },
        
        getDataFromCache: function(sKey, oItem){
        	//special handling for UIExecutionLink : 
        	// Need to cache the UIExecutionLink for the Table view scenario.
        	/*if(sKey === "UIExecutionLink" && !this.isUIExecnLinkNavProp()){
                return oItem.UIExecutionLink;
        	}*/
        	return this.oCacheStore[sKey][this.getCacheStoreKey(sKey, oItem)];
        	
        },
        
        getCacheStoreKey: function(sKey,oItem){
        	switch (sKey) {
			 	case "UIExecutionLink":
					return oItem.SAP__Origin + oItem.InstanceID;
				case "DecisionOptions":
					return oItem.SAP__Origin + oItem.TaskDefinitionID;
				case "Descriptions":
					return oItem.SAP__Origin + oItem.InstanceID;
			}
        },
        
        getCurrentUserImage: function(sOrigin, sUserId, fnSuccess){ // TODO write all the code related to user pictures at one single place
        	var sImagePath = this.oModel.sServiceUrl + "/UserInfoCollection(SAP__Origin='" + sOrigin + "',UniqueName='" + sUserId + "')/$value";
        	if (this.oCurrentUserImageAvailability[sImagePath] != null && this.oCurrentUserImageAvailability[sImagePath] === true) {
        		fnSuccess(sImagePath);
        		return;
        	}
        	
        	var that = this;
			jQuery.ajax({
				url : sImagePath,
				type : 'GET',
				contentType : 'image/jpeg',
				async: true,
				success : function(data,status,jqXHR) {
					if (data != "" && data != undefined){
						that.oCurrentUserImageAvailability[sImagePath] = true;
						fnSuccess(sImagePath);
					} else {
						that.oCurrentUserImageAvailability[sImagePath] = false;
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
		
		// getter function for flag bDetailPageLoaded
		getDetailPageLoaded: function() {
			return this.bDetailPageLoaded;
		},
		
		// setter function for flag bDetailPageLoaded
		setDetailPageLoaded: function(bValue) {
			this.bDetailPageLoaded = bValue;
		},
		
		// getter function for flag bDetailPageLoadedViaDeepLinking
		getDetailPageLoadedViaDeepLinking: function() {
			return this.bDetailPageLoadedViaDeepLinking;
		},
		
		// setter function for flag bDetailPageLoadedViaDeepLinking
		setDetailPageLoadedViaDeepLinking: function(bValue) {
			this.bDetailPageLoadedViaDeepLinking = bValue;
		},
		setCallFromDeepLinkURL:function(bValue){
			this.bIsDeepLinkingURLCall = bValue;
		},	
		getCallFromDeepLinkURL:function(){
			return this.bIsDeepLinkingURLCall;
		},

		//
		_getURLParametersfromStartUpParameters: function(oStartupParameters){
			if (oStartupParameters) {
				//Get parameters from startupParameters if exist. 
				//If a parameter does not exist in startupParameters then get it from URL.
				
				//Substitution feature
				if (oStartupParameters.substitution && oStartupParameters.substitution.length > 0) {
					this.bSubstitution = oStartupParameters.substitution[0] == "true" ? true : false;
				}else{
					this.bSubstitution = jQuery.sap.getUriParameters().get("substitution") == "false" ? false : true;
				}
				
				//log feature
				if (oStartupParameters.showLog && oStartupParameters.showLog.length > 0) {
					this.bShowLog = oStartupParameters.showLog[0];
				}else{
					this.bShowLog =  jQuery.sap.getUriParameters().get("showLog") == "false" ? false : true;
				}
				
				//table view
				if (oStartupParameters.expertMode && oStartupParameters.expertMode.length > 0) {
					this.tableView = oStartupParameters.expertMode[0];
				}else{
					this.tableView = jQuery.sap.getUriParameters().get("expertMode") == "true" ? true : false;
				}
				if (oStartupParameters.expertModeOnPhone && oStartupParameters.expertModeOnPhone.length > 0) {
					this.tableViewOnPhone = oStartupParameters.expertModeOnPhone[0];
				}else{
					this.tableViewOnPhone = jQuery.sap.getUriParameters().get("expertModeOnPhone") == "true" ? true : false;
				}
				
				// scenarioId
				if (oStartupParameters.scenarioId && oStartupParameters.scenarioId.length > 0) {
					this.sScenarioId = oStartupParameters.scenarioId[0];
				}else{
					this.sScenarioId = jQuery.sap.getUriParameters().get("scenarioId");
				}
				
				// taskDefinitions (client scenario)
				// Only taken into account when scenarioId is not provided
				//if(!this.sScenarioId && !this.tableView){ //TODO - implement client scenario in table view
				if(!this.sScenarioId){
					if (oStartupParameters.taskDefinitions && oStartupParameters.taskDefinitions[0]) {
						this.sClientScenario = decodeURIComponent(oStartupParameters.taskDefinitions[0]);
					}
					else{
						var taskDefs = jQuery.sap.getUriParameters().get("taskDefinitions");
						if(taskDefs != null) {
							this.sClientScenario = decodeURIComponent(taskDefs);
						}
					}
				}

				//userSearch
				//default : true
				//If it's false, this measn that backend is not able to provide user search functionality 
				//(no access to user details) - cloud, workflowservice
				if (oStartupParameters.userSearch && oStartupParameters.userSearch.length > 0) {
					this.userSearch = oStartupParameters.userSearch[0] == "false" ? false : true;
				}
				else{
					this.userSearch = jQuery.sap.getUriParameters().get("userSearch") == "false" ? false : true;
				}

				// allItems
				if (oStartupParameters.allItems && oStartupParameters.allItems.length > 0) {
					this.bAllItems = oStartupParameters.allItems[0] == "true" ? true : false;
				}else{
					this.bAllItems = jQuery.sap.getUriParameters().get("allItems") == "true" ? true : !(this.sScenarioId || this.sClientScenario);
				}
				
				this.bAllItems = this.bAllItems || !(this.sScenarioId || this.sClientScenario);
				
				// OutBox
				if (oStartupParameters.outbox && oStartupParameters.outbox.length > 0) {
					this.bOutbox = oStartupParameters.outbox[0] == "true" ? true : false;
				}else{
					this.bOutbox = jQuery.sap.getUriParameters().get("outbox") == "true" ? true : false;
				}
				
				// to show custom attributes in list view and detail view item header
				if (oStartupParameters.showAdditionalAttributes && oStartupParameters.showAdditionalAttributes.length > 0) {
					this.bShowAdditionalAttributes = oStartupParameters.showAdditionalAttributes[0] == "true" ? true : false;
				}else{
					this.bShowAdditionalAttributes = jQuery.sap.getUriParameters().get("showAdditionalAttributes") == "true" ? true : false;
				}
					
				// massAction
				if (oStartupParameters.massAction && oStartupParameters.massAction.length > 0) {
					if(oStartupParameters.massAction[0] == "true") {
						this.bIsMassActionEnabled = true;
					} else if(oStartupParameters.massAction[0] == "false") {
						this.bIsMassActionEnabled = false;
					}
				}else{
					if (jQuery.sap.getUriParameters().get("massAction") == "true") {
						this.bIsMassActionEnabled = true;
					} else if (jQuery.sap.getUriParameters().get("massAction") == "false") {
						this.bIsMassActionEnabled = false;
					}
				}
				
				// quickAction
				if (oStartupParameters.quickAction && oStartupParameters.quickAction.length > 0) {
					if (oStartupParameters.quickAction[0] == "true") {
						this.bIsQuickActionEnabled = true;
					} else if (oStartupParameters.quickAction[0] == "false") {
						this.bIsQuickActionEnabled = false;
					}
				}else{
					if (jQuery.sap.getUriParameters().get("quickAction") == "true") {
						this.bIsQuickActionEnabled = true;
					} else if (jQuery.sap.getUriParameters().get("quickAction") == "false") {
						this.bIsQuickActionEnabled = false;
					}
				}
				
				// sortBy
				if (oStartupParameters.sortBy && oStartupParameters.sortBy.length > 0) {
					this.sDefaultSortBy = oStartupParameters.sortBy[0];
				}else{
					this.sDefaultSortBy = jQuery.sap.getUriParameters().get("sortBy");
				}
				
				// listSize
				var iLstSize;
				if (oStartupParameters.listSize && oStartupParameters.listSize.length > 0) {
					iLstSize = oStartupParameters.listSize[0];
				}else{
					iLstSize = jQuery.sap.getUriParameters().get("listSize");
				}
				if (iLstSize && jQuery.isNumeric(iLstSize) && parseInt(iLstSize, 10) > 0) {
					this.iListSize = parseInt(iLstSize, 10);
				}
				
				//taskObjects
				var sTaskObjects = jQuery.sap.getUriParameters().get("taskObjects");
				if (oStartupParameters.taskObjects && oStartupParameters.taskObjects.length > 0){
					this.bShowTaskObjects = oStartupParameters.taskObjects[0] == "true" ? true : false;					
				}else if (sTaskObjects && sTaskObjects.length > 0){
					this.bShowTaskObjects = sTaskObjects === "true" ? true : false;					
				}else{
					this.bShowTaskObjects = sap.ui.Device.system.desktop;
				}
				
				// pageSize
				var iPgSize;
				if (oStartupParameters.pageSize && oStartupParameters.pageSize.length > 0) {
					iPgSize = oStartupParameters.pageSize[0];
				} else {
					iPgSize = jQuery.sap.getUriParameters().get("pageSize");
				}
				if (iPgSize && jQuery.isNumeric(iPgSize) && parseInt(iPgSize, 10) > 0) {						
					this.iPageSize = parseInt(iPgSize, 10);
				}
				
				//enablePaging
				if (oStartupParameters.enablePaging && oStartupParameters.enablePaging.length > 0) {
					this.bEnablePaging = oStartupParameters.enablePaging[0] === "true" ? true : false;
				}else{
					this.bEnablePaging = jQuery.sap.getUriParameters().get("enablePaging") === "true" ? true : false;
				}
				
				//operationMode
				var sOppMode;
				if (oStartupParameters.operationMode && oStartupParameters.operationMode.length > 0) {
					sOppMode = oStartupParameters.operationMode[0];
				} else {
					sOppMode = jQuery.sap.getUriParameters().get("operationMode");
				}
				if(sOppMode && sOppMode.toUpperCase() === "CLIENT"){
					this.sOperationMode = "Client";
				}else{ 
					this.sOperationMode = "Server";
				}
				
				//cacheSize
				var iChSize;
				if (oStartupParameters.cacheSize && oStartupParameters.cacheSize.length > 0) {
					iChSize = oStartupParameters.cacheSize[0];
				} else {
					iChSize = jQuery.sap.getUriParameters().get("cacheSize");
				}
				if(jQuery.isNumeric(iChSize)){
					iChSize = parseInt(iChSize, 10);
				} else {
					iChSize = undefined;
				}
				if (iChSize && iChSize >= 0) {						
					this.iCacheSize = iChSize;
				}
				
				//InstanceID
				if (oStartupParameters.InstanceID && oStartupParameters.InstanceID.length > 0) {
					this.sTaskInstanceID = oStartupParameters.InstanceID[0];
				} else {
					this.sTaskInstanceID = jQuery.sap.getUriParameters().get("InstanceID");
				}
				
				//SAP__Origin
				if (oStartupParameters.SAP__Origin && oStartupParameters.SAP__Origin.length > 0) {
					this.sSapOrigin = oStartupParameters.SAP__Origin[0];
				} else {
					this.sSapOrigin = jQuery.sap.getUriParameters().get("SAP__Origin");
				}
				
				//propogate SAP URL parameters, by default the parameters are propogated
				if (oStartupParameters.forwardUserSettings && oStartupParameters.forwardUserSettings.length > 0) {
					this.bPropogateSapURLParameters = oStartupParameters.forwardUserSettings[0] == "false" ? false : true;
				} else {
					this.bPropogateSapURLParameters = jQuery.sap.getUriParameters().get("forwardUserSettings") === "false" ? false : true;
				}
			} else {
				// Get parameters from the URL
				this._getURLParameters();
			}
		},
		_getURLParameters: function(){
			// Application running in local dev environment
			this.sScenarioId = jQuery.sap.getUriParameters().get("scenarioId");
			//if(!this.sScenarioId && !this.tableView){
			if(!this.sScenarioId){
				var taskDefs = jQuery.sap.getUriParameters().get("taskDefinitions");
				if(taskDefs != null) {
					this.sClientScenario = decodeURIComponent(taskDefs);
				}
			}	
			this.bAllItems = jQuery.sap.getUriParameters().get("allItems") == "true" ? true : !(this.sScenarioId || this.sClientScenario);
			
			this.userSearch = jQuery.sap.getUriParameters().get("userSearch") == "false" ? false : true;
			this.bOutbox = jQuery.sap.getUriParameters().get("outbox") == "true" ? true : false;
			this.tableView = jQuery.sap.getUriParameters().get("expertMode") == "true" ? true : false;
			this.tableViewOnPhone = jQuery.sap.getUriParameters().get("expertModeOnPhone") == "true" ? true : false;
			this.bSubstitution = jQuery.sap.getUriParameters().get("substitution") == "true" ? true : false;
			this.bShowLog =  jQuery.sap.getUriParameters().get("showLog") == "false" ? false : true;
			this.sTaskInstanceID = jQuery.sap.getUriParameters().get("InstanceID");
			this.sSapOrigin = jQuery.sap.getUriParameters().get("SAP__Origin");
			
			
			// to show custom attributes in list view and detail view item header
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
			
			var iLstSize = jQuery.sap.getUriParameters().get("listSize");
			if (iLstSize && jQuery.isNumeric(iLstSize) && parseInt(iLstSize, 10) > 0) {
				this.iListSize = parseInt(iLstSize, 10);
			}
			var sTaskObjects = jQuery.sap.getUriParameters().get("taskObjects");
			if (sTaskObjects && sTaskObjects.length > 0){
				this.bShowTaskObjects = sTaskObjects === "true" ? true : false;					
			}else{
				this.bShowTaskObjects = sap.ui.Device.system.desktop;
			}
			var iPgSize = jQuery.sap.getUriParameters().get("pageSize");
			if (iPgSize && jQuery.isNumeric(iPgSize) && parseInt(iPgSize, 10) > 0) {
				this.iPageSize = parseInt(iPgSize, 10);
			}
			//cache size
			var iChSize = jQuery.sap.getUriParameters().get("cacheSize");
			if(jQuery.isNumeric(iChSize)){
						iChSize = parseInt(iChSize, 10);
			} else {
				iChSize = undefined;
			}
			if (iChSize && iChSize >= 0) {						
				this.iCacheSize = iChSize;
			}
			//enablePaging
			this.bEnablePaging = jQuery.sap.getUriParameters().get("enablePaging") === "true" ? true : false;
			
			//operationMode
			var sOppMode = jQuery.sap.getUriParameters().get("operationMode");
			if(sOppMode && sOppMode.toUpperCase() === "CLIENT"){
				this.sOperationMode = "Client";
			}else{ 
				this.sOperationMode = "Server";
			}
			
			//propogate SAP URL parameters, by default the parameters are propogated
			this.bPropogateSapURLParameters = jQuery.sap.getUriParameters().get("forwardUserSettings") === "false" ? false : true;
		},
		
	fnUpdateSingleTask: function(sSAP_Origin, sInstanceID, fnSuccess, fnError){
			var that = this;
			this.oDataRead("/TaskCollection(SAP__Origin='" + jQuery.sap.encodeURL(sSAP_Origin) + 
    			"',InstanceID='" + jQuery.sap.encodeURL(sInstanceID) + "')",
    			null, 
    			function(oData) {
    				if(fnSuccess){
    					that.processListAfterAction(sSAP_Origin, sInstanceID);
    					that.fireActionPerformed();
    					fnSuccess(oData);
    				}
					that.fnShowReleaseLoader(false);
    			},
    			function(oError) {
    				if(fnError){
    					fnError(oError);
    				}
    				that.processListAfterAction(sSAP_Origin, sInstanceID);
					that.fnShowReleaseLoader(false);
    				that.oDataRequestFailed(oError);
    			}
    		);
	},
		
    massReadDecisionOptions: function(oTasksToFetchDecisionsFor, fnSuccess) {

		var aParams = [], aDecisionOptionsToReturn = [], aDecisionOptionsToLoad = [], oItem;
		for (var key in oTasksToFetchDecisionsFor) {
			if (oTasksToFetchDecisionsFor.hasOwnProperty(key)) {
				oItem = oTasksToFetchDecisionsFor[key];
				
				aDecisionOptionsToLoad.push({
					SAP__Origin: oItem.SAP__Origin,
					TaskDefinitionID: oItem.TaskDefinitionID
				});
				
				aParams.push({
					SAP__Origin: "'"+ jQuery.sap.encodeURL(oItem.SAP__Origin) +"'",
					InstanceID : "'"+ jQuery.sap.encodeURL(oItem.InstanceID) +"'"
				});
			}
		}

		var fnSuccessCallback = function(oData) {
			var aBatchResponses = oData.__batchResponses;
			var oTask, oBatchResponse, oResult;
			for (var j in aBatchResponses) {
				oBatchResponse = aBatchResponses[j];
				if (oBatchResponse.hasOwnProperty("data") && oBatchResponse.statusCode >= "200" && oBatchResponse.statusCode < "300") {
					oResult = oBatchResponse.data.results;
					oTask = aDecisionOptionsToLoad[j];
					if (oResult) {
						this.oDecisionOptions[oTask.SAP__Origin + oTask.TaskDefinitionID] = oResult;
						aDecisionOptionsToReturn.push(oResult);
					}
				}
			}
			fnSuccess(aDecisionOptionsToReturn);
		};

		var fnErrorCallback = function(oError) {
			// handle error case
		};

		this.fireBatch({
			sPath: this.FUNCTION_IMPORT_DECISIONOPTIONS,
			aUrlParameters: aParams, 
			sMethod: "GET",
			sBatchGroupId: "DecisionOptionsBatch",
			numberOfRequests: aDecisionOptionsToLoad.length,
			fnSuccessCallback: jQuery.proxy(fnSuccessCallback, this),
			fnErrorCallback: jQuery.proxy(fnErrorCallback, this)
		});
	}
});
/*global cross:true*/
/*eslint no-undef: 2*/
cross.fnd.fiori.inbox.util.DataManager.M_EVENTS = { ItemRemoved : "itemRemoved", ActionPerformed: "actionPerformed", refreshDetails : "refreshDetails"};