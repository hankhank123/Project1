/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/core/mvc/ViewType",
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"sap/m/Column",
	"sap/m/MessageToast",
	"sap/m/TablePersoController",
	"sap/m/GroupHeaderListItem",
	"cross/fnd/fiori/inbox/util/TableOperations",
	"cross/fnd/fiori/inbox/util/TaskListGroupingHelper",
	"cross/fnd/fiori/inbox/util/TaskListSortingHelper",
	"cross/fnd/fiori/inbox/util/TaskListCustomAttributeHelper",
	"cross/fnd/fiori/inbox/util/DataManager",
	"sap/ca/scfld/md/controller/BaseFullscreenController",
	"sap/m/semantic/PositiveAction",
	"sap/m/semantic/NegativeAction",
	"sap/m/Button",
	"cross/fnd/fiori/inbox/util/ConfirmationDialogManager",
	"cross/fnd/fiori/inbox/util/Forward",
	"cross/fnd/fiori/inbox/util/Resubmit",
	"cross/fnd/fiori/inbox/util/MultiSelect",
	"cross/fnd/fiori/inbox/util/ActionHelper"
], function( UIComponent, ViewType, Sorter, Filter, FilterOperator, JSONModel, Column, MessageToast,
	TablePersoController, GroupHeaderListItem, TableOperations, TaskListGroupingHelper, TaskListSortingHelper, TaskListCustomAttributeHelper, DataManager, BaseFullscreenController,
	PositiveAction, NegativeAction, Button, ConfirmationDialogManager, ForwardPopUp, ResubmitPopUp, MultiSelectDialog, ActionHelper) {
	"use strict";

	BaseFullscreenController.extend("cross.fnd.fiori.inbox.view.S2_TaskList", {
		
		ClaimFunctionImport: "Claim",
		ReleaseFunctionImport: "Release",
		DecisionFunctionImport: "Decision",
		ConfirmFunctionImport: "Confirm",
		GUILinkProperty: "GUI_Link",
		//	This hook method can be used to add and change buttons for the table view footer
	    //	It is called when the tasks are selected in the table view
    	extHookChangeFooterButtonsForExpertMode: null,

		onInit: function() {
	   		this.mainViewModel = new sap.ui.model.json.JSONModel({
				busy: true,
				delay: 0
			});
			this.getView().setModel(this.mainViewModel, "mainView");
			var oComponent = sap.ca.scfld.md.app.Application.getImpl().getComponent();
        	this.oDataManager = oComponent.getDataManager();
        	oComponent.getEventBus().subscribe("cross.fnd.fiori.inbox", "refreshTask", jQuery.proxy(this._refreshTask, this));

			this._oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
			var oViewModel = new sap.ui.model.json.JSONModel({
				personalizationActive:false,
				taskListTitle: this._oResourceBundle.getText("ITEMS_SCENARIO_DISPLAY_NAME"),
				noDataText:this._oResourceBundle.getText("XMSG_LOADING")
			});
			this.getView().setModel(oViewModel, "taskListView");
			this._oTable = this.byId("taskListTable");
			this._oTable.setBusyIndicatorDelay(0);
			this._oFullScreenPage = this.getView().byId("taskListPage");
			this._oDataModel = this.getView().getModel();
			this._initPersonalization();
			this._aTaskPropertiesForSelect = ["SAP__Origin","InstanceID","TaskDefinitionID","TaskDefinitionName","TaskTitle","Priority","PriorityNumber","Status","StatusText",
												"CreatedBy","CreatedByName","CreatedOn","CompletionDeadLine","HasAttachments","TaskSupports","SupportsComments","SupportsAttachments","CustomAttributeData"];

			this._oTableOperations = new TableOperations(this._oTable,this.getView(), ["TaskTitle", "Priority", "Status","CreatedByName","CompletionDeadLine","CreatedOn"]);

			this._oGrouping = new TaskListGroupingHelper(this._oTableOperations, this.getView());
			this._oSorting =  new TaskListSortingHelper(this._oTableOperations, this.getView());
			this._tableHelper = new TaskListCustomAttributeHelper(this, this.getView(), this._oTable,this._oGrouping,this._oSorting,this._oTableOperations);
			this._actionHelper = new ActionHelper(this, this.getView());
			
			this._oConfirmationDialogManager = ConfirmationDialogManager;
			
			// create unique ID for resubmit pop up
			this.sResubmitUniqueId = this.createId() + "DLG_RESUBMIT";
			
			//Handling busy indicator while querying tasks.
			this._oDataModel.attachRequestSent($.proxy(function(){
				this._oTable.setShowNoData(false);
				this._oTable.setBusy(true);
			}, this));
			this._oDataModel.attachRequestCompleted($.proxy(function(){
				this._oTable.setBusy(false);
				this._oTable.setShowNoData(true);
			}, this));

			this._oDataModel.attachRequestFailed($.proxy(function(){
				//To hide busy initial load busy indicator
				this.mainViewModel.setProperty("/busy", false);
				this._oTable.setShowNoData(true);
			}, this));
			
			// load initial app data once the metadata is loaded
			if (!this.oDataManager.oModel.getServiceMetadata()) {
				//Execution can only continue - e.g.: metadata fetch success in scaffolding
				this.oDataManager.oModel.attachMetadataLoaded(jQuery.proxy(function() {
					this._loadInitialAppData();
				}, this));
			} else {
				this._loadInitialAppData();
			}
			
			//Use jQuery deferred object to delay the filterbar search event.
			this._loadCustomAttributesDeferredForTasks = $.Deferred();
			this._loadCustomAttributesDeferredForTaskDefs = $.Deferred();
			this.byId("taskListPage").insertContent(this._initFBSubView(), 0);
		},
		
		onExit: function(){
			this._tableHelper.destroy();
		},
		
		//Read Scenario Collection 
		_loadInitialAppData: function() {
			//Use jQuery deferred object to delay the filterbar search event.
			this._loadScenrioDeferred = $.Deferred();  

			if (this.oDataManager.sScenarioId || this.oDataManager.sClientScenario) {
				this.oDataManager.loadInitialAppData($.proxy(function(oScenario) {
					if (!oScenario) {
						return;
					}
					this._oScenario = oScenario;
					this._scenarioServiceInfos = oScenario.ScenarioServiceInfos;
					// get the config with the possible url parameter overrides
					var oConfig = this.oDataManager.getScenarioConfig();
					if ((oScenario.ScenarioServiceInfos.length === 1) || (oConfig.AllItems === true)){
						this._displaySortOption = true;
					}
					this._displayMultiSelectButton = oConfig.IsMassActionEnabled;
					this._defaultSortKey = oConfig.SortBy;
					this._loadScenrioDeferred.resolve();
				}, this));
			} else {
				var oConfig = this.oDataManager.getScenarioConfig();
				if (oConfig.AllItems === true) {
					this._displayMultiSelectButton = oConfig.IsMassActionEnabled ? true : false;
					this._displaySortOption = true;
					this._defaultSortKey = oConfig.SortBy;
				}
				this._loadScenrioDeferred.resolve();
			}
			//Create Json Model for Tasks to enable local filtering of custom attributes.
			//TODO us this instead
			//this.oDataManager.fetchTaskDefinitionsandCustomAttributeDefinitions(this.initTaskDefnandCustomAttrDefnnModel);
			$.when(this._loadScenrioDeferred).then($.proxy(function(){
				//Set default sorter
				this._oTableOperations.addSorter(this._getDefaultSorter());
				this._initTaskDefintionModel();
				// make sure the promise to load metadata is resolved as $select properties need to be chosen by checking the metadata
				this.oDataManager.oModel.getMetaModel().loaded().then(jQuery.proxy(function(){
					this._storeMetaModel();
					this._initTaskModel();
				}, this));
				
			}, this));
		},
		
		//Initialize Task Defintions and Custom attribute Definitions
		_initTaskDefintionModel:function(){
			//Process the task query response and create Json model
			var _handleTaskDefintionQueryResponse = function(oData, response){
				if(response.statusCode === "200"){
					//TODO Create an interface and provide two implmentations 
					//1. for Scenario based custom attribute columns (Merge custom attrbutes from Task defs in a scenario)
					//2. for TaskDefinition based custom attribute column.
					var columns = this._identifyColumnsTobeAdded(oData.results);
					var jsonModel = new JSONModel({
						TaskDefinitionCollection:oData.results,
						Columns:columns
					});
					this.getView().setModel(jsonModel, "taskDefinitions");
					this._loadCustomAttributesDeferredForTaskDefs.resolve();
				}else{
					jQuery.sap.require("sap.m.MessageToast");
					sap.m.MessageToast.show(response.statusText+":"+response.body);
				}
			};
			var taskDefArray = this._getTaskDefinitionFilters();
			if(taskDefArray){
				taskDefArray = [taskDefArray];
			}
			var params = {
					filters:taskDefArray, 
					success:$.proxy(_handleTaskDefintionQueryResponse,this),
					urlParameters: {$select: "SAP__Origin,TaskDefinitionID,TaskName,CustomAttributeDefinitionData", 
									$expand:"CustomAttributeDefinitionData"
									}
					};
			this._oDataModel.read("/TaskDefinitionCollection", params);
		},

		//Initialise TaskCollection Model
		_initTaskModel:function(){
			//Process the task query response and create Json model
			var _handleTaskQueryResponse = function(oData, response){
				if(response.statusCode === "200"){
					var tasks = this._dataMassage(oData.results);
					var jsonModel = new JSONModel({TaskCollection:tasks});
					this.getView().setModel(jsonModel, "taskList");
					//Calling resolve on deferred object to create filter bar
					this._loadCustomAttributesDeferredForTasks.resolve();
					if(this._filterDeferred){
						this._filterDeferred.resolve();
					}
				}else{
					jQuery.sap.require("sap.m.MessageToast");
					sap.m.MessageToast.show(response.statusText+":"+response.body);
				}
			};
			var filterArray = [this._getinitialStatusFilters()];
			var tasDefFilters = this._getTaskDefinitionFilters();
			if(tasDefFilters){
				filterArray.push(tasDefFilters);
			}
			var params = {
					filters:[new Filter({
								filters:filterArray,
								and:true})
							],
					sorters:[this._getCurrentSorter()],
					success:$.proxy(_handleTaskQueryResponse, this),
					urlParameters: {
										$top:this.oDataManager.getListSize(),
										$select: this._getTaskPropertiesToFetch().join(","), 
										$expand:"CustomAttributeData"
									}
					};
			this._oDataModel.read("/TaskCollection", params);
		},
		
		_refreshTask: function(channelId, eventId, data){
			var _handleTaskQueryResponse = function(oData, response){
				if(response.statusCode === "200"){
					var tasks = this._dataMassage([oData]);
					var jsonModel = this.getView().getModel("taskList");
					jsonModel.setProperty(this.selectedTaskPath, tasks[0]);
					this.selectedTaskPath = undefined;
					this.handleSelectionChange();
				}
			};
			var params = {
					success:$.proxy(_handleTaskQueryResponse, this),
					urlParameters:{$expand:"CustomAttributeData"}
					};
			this._oDataModel.read(data.contextPath, params);
		},
		
		// store the MetamModel in DataManager if not already stored
		_storeMetaModel: function() {
			if (!this.oDataManager.oServiceMetaModel) {
				this.oDataManager.oServiceMetaModel = this.oDataManager.oModel.getMetaModel();
			}
		},
		
		_getTaskPropertiesToFetch: function() {
				var aPropertiesToSelect = this._aTaskPropertiesForSelect.concat(); //creating a copy of _aTaskPropertiesForSelect
				if (this._actionHelper.fnCheckGUILinkPropertySupported.call(this)) {
					aPropertiesToSelect.push(this.GUILinkProperty);
				}
				return aPropertiesToSelect;
		},
		
		_getinitialStatusFilters:function(){
			var filterArray = [];
			filterArray.push(new Filter({path:"Status", operator:sap.ui.model.FilterOperator.EQ, value1:"READY"}));
			filterArray.push(new Filter({path:"Status", operator:sap.ui.model.FilterOperator.EQ, value1:"RESERVED"}));
			filterArray.push(new Filter({path:"Status", operator:sap.ui.model.FilterOperator.EQ, value1:"IN_PROGRESS"}));
			filterArray.push(new Filter({path:"Status", operator:sap.ui.model.FilterOperator.EQ, value1:"EXECUTED"}));
			return new Filter({filters:filterArray,and:false});
		},
		
		//If based on Scenario
		_getTaskDefinitionFilters:function(){
			if(this._scenarioServiceInfos){
				var taskDefFilters = [];
				for (var j = 0; j < this._scenarioServiceInfos.length; j++) {
					for (var k = 0; k < this._scenarioServiceInfos[j].TaskDefinitionIDs.length; k++) {
						taskDefFilters.push(new Filter({path:"TaskDefinitionID", operator:sap.ui.model.FilterOperator.EQ, value1:this._scenarioServiceInfos[j].TaskDefinitionIDs[k]}));
						//this._scenarioServiceInfos[j].Origin - if this is ever added, should take care of client scenario definitions, not to pass SAP__Origin filter.
					}
				}
				return new Filter({
					filters:taskDefFilters,
					and:false
				});
			}
		},
		
		_getDefaultSorter: function(){
			var descending = false;
			var sortKey = this._defaultSortKey;
			if(sortKey === "CreatedOn"){
				descending = true;
			}
			if(sortKey === "Priority"){
				sortKey = "PriorityNumber";
			}
			if(sortKey === "CreatedBy"){
				sortKey = "CreatedByName";
			}
			return new Sorter(sortKey, descending);	
		},
		
		_getCurrentSorter: function(){
			var currentSort = this._oTableOperations.getSorter()[0];
			if(["TaskTitle","Status","PriorityNumber","CreatedOn","CompletionDeadLine","CreatedByName"].indexOf(currentSort.sPath) !== -1){
				return currentSort;
			}else{
				return this._getDefaultSorter();
			}

		},
		
		//If based on Scenario
		_getTaskDefinitions:function(){
			var mergedTaskDefs = [];
			if(this._scenarioServiceInfos){
				for (var j = 0; j < this._scenarioServiceInfos.length; j++) {
					for (var k = 0; k < this._scenarioServiceInfos[j].TaskDefinitionIDs.length; k++) {
						mergedTaskDefs = mergedTaskDefs.concat(this._scenarioServiceInfos[j].TaskDefinitionIDs[k]);
						//this._scenarioServiceInfos[j].Origin - if this is ever added, take care of client scenarios no to pass SAP__Origin filter
					}
				}
			}
			return mergedTaskDefs;
		},
		
		_getScenrio: function(){
			return this._oScenario?this._oScenario.DisplayName:this._oResourceBundle.getText("ALL_ITEMS_SCENARIO_DISPLAY_NAME");	
		},
		
		_getScenrioId: function(){
			var id = "";
			if(this.oDataManager.sScenarioId){
				id = this.oDataManager.sScenarioId;
			}
			else if(this.oDataManager.sClientScenario){
				id= "clntScenario";
			}
			else{
				id = "allItems";
			}
			return id;
		},

		_identifyColumnsTobeAdded:function(taskDefinitions){
			var columns = {};
			for (var i=0; i<taskDefinitions.length; i++) {
				taskDefinitions[i].TaskDefinitionID = taskDefinitions[i].TaskDefinitionID.toUpperCase();
				columns[taskDefinitions[i].TaskDefinitionID] = taskDefinitions[i].CustomAttributeDefinitionData.results;
			}
			return columns;
		},

		//Massaging task result to denormalize the custom attributes
		_dataMassage:function(tasks){
			var oTask;
			for (var i=0; i<tasks.length; i++) {
				oTask = tasks[i];
				for (var j=0; j<oTask.CustomAttributeData.results.length; j++) {
					 oTask[encodeURIComponent(oTask.CustomAttributeData.results[j].Name)] = oTask.CustomAttributeData.results[j].Value;
				}
				tasks[i] = oTask;
			}
			return tasks;
		},
		
		// Creates and initializes the subview containing the FilterBar, which is located above the Task table.
		_initFBSubView: function() {
			var oViewDefinition = {
				viewName: "cross.fnd.fiori.inbox.view.S2_FilterBar",
				type: ViewType.XML,
				viewData: {
					oTable: this._oTable,
					oTableOperations: this._oTableOperations,
					oTableHelper:this._tableHelper,
					parentController: this
				}
			};
			return sap.ui.view(oViewDefinition);
		},
		
		_initPersonalization: function() {
			if (sap.ushell.Container) {
				var oPersonalizationService = sap.ushell.Container.getService("Personalization");
				var oPersonalizer = oPersonalizationService.getPersonalizer({
					container: "cross.fnd.fiori.inbox.table."+this._getScenrioId(), // This key must be globally unique (use a key to
					// identify the app) Note that only 40 characters are allowed
					item: "taskListTable" // Maximum of 40 characters applies to this key as well
				});
				this._oTablePersoController = new sap.m.TablePersoController({
					table: this._oTable,
					componentName: "table",
					showResetAll:false,
					persoService: oPersonalizer
				}).activate();
			}
			this.getView().getModel("taskListView").setProperty("/personalizationActive", !!sap.ushell.Container);
		},
		
		//On task selcttion navigate to detail page.
		onTaskSelected: function(oEvent) {
			var oParameters = {
				SAP__Origin: oEvent.getSource().getBindingContext("taskList").getProperty("SAP__Origin"),
				InstanceID: oEvent.getSource().getBindingContext("taskList").getProperty("InstanceID"),
				contextPath: "TaskCollection(SAP__Origin='"+oEvent.getSource().getBindingContext("taskList").getProperty("SAP__Origin")+"',InstanceID='"+oEvent.getSource().getBindingContext("taskList").getProperty("InstanceID")+"')"
			};
			this.selectedTaskPath = oEvent.getSource().getBindingContext("taskList").getPath();
			this.oRouter.navTo("detail_deep", oParameters, false);
			return;
		},

		//On the task title press open the task UI in a new browser window.
		onTaskTitlePressed: function(oEvent){
			var oPressedItem = oEvent.getSource().getBindingContext("taskList").getProperty();
			this.oDataManager.fetchUIExecutionLink(oPressedItem,
													jQuery.proxy(this._actionHelper.openTaskInNewWindow, this._actionHelper),
													jQuery.proxy(this._actionHelper.showErrorOnOpenTask, this._actionHelper));
		},
		
		// The list title displays the number of list items. Therefore the number has to be updated each
		// time the list changes. Note: the list binding returns the number of items matching the current filter criteria
		// even if the growing list does not yet show all of them. This method is also used by the filter bar subview.
		onUpdateFinished: function(oEvent) {
			this.mainViewModel.setProperty("/busy", false);
			// on phones the list title is not shown -> nothing needs to be done
			if (sap.ui.Device.system.phone) {
				return;
			}
			var iItemCount = oEvent.getParameter("total");
			this.getView().getModel("taskListView").setProperty("/taskListTitle",
				iItemCount ?
				this._oResourceBundle.getText("ITEMS_SCENARIO_DISPLAY_NAME_COUNT", [iItemCount]) :
				this._oResourceBundle.getText("ITEMS_SCENARIO_DISPLAY_NAME"));
			this.getView().getModel("taskListView").setProperty("/noDataText",this._oResourceBundle.getText("view.Workflow.noDataTasks"));
		},
		
		// --- Personalization
		onPersonalizationPressed: function() {
			this._oTablePersoController.openDialog();
		},
		
		createGroupHeader: function(oGroup) {
			return new GroupHeaderListItem({
				title: oGroup.text,
				upperCase: false
			});
		},
		
		onGroupPressed: function() {
			this._oGrouping.openGroupingDialog();
		},
		
		onSortPressed: function() {
			this._oSorting.openSortingDialog();
		},
		
		/**
		 * Utility method to attach a control, typically a dialog,
		 * to the view, and syncing the styleclass of the application
		 * @param {sap.ui.core.Control} oControl the control to be attached
		 * @public
		 */
		attachControl: function(oControl) {
			var sCompactCozyClass = this.getOwnerComponent().getContentDensityClass();
			jQuery.sap.syncStyleClass(sCompactCozyClass, this.getView(), oControl);
			this.getView().addDependent(oControl);
		},
		
		onMessagesButtonPress: function(oEvent) {
			if (!this._oMessagePopover) {
				// Create Message Popover for Error Handling        
				this._oMessagePopover = new sap.m.MessagePopover({
					items: {
						path: "message>/",
						template: new sap.m.MessagePopoverItem({
							description: "{message>description}",
							type: "{message>type}",
							title: "{message>message}"
						})
					}
				});

				this._oMessagePopover.setModel(sap.ui.getCore().getMessageManager().getMessageModel(), "message");
				this.attachControl(this._oMessagePopover);
			}
			this._oMessagePopover.openBy(oEvent.getSource());
		},
		
		setFilterBar: function(filterBar){
			this._oFilterBar = filterBar;
		},
		
		onRefreshPressed: function(oEvent){
			this._filterDeferred = $.Deferred();
			this._initTaskModel();
			$.when(this._filterDeferred).then($.proxy(function(){
				this._oFilterBar.fireSearch();
			},this));
		},
		
		onNavBack: function(oEvent){
			window.history.go(-1);
		/*
			var oHistory = sap.ui.core.routing.History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash(),
				oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			if (sPreviousHash !== undefined) {
				history.go(-2);
			} else {
				oCrossAppNavigator.toExternal({
					target: {
						shellHash: "#"
					}
				});
			}
		*/},
		
		handleSelectionChange: function(oEvent) {
			this.clearFooterButtons();
			var aSelectedContexts = this._oTable.getSelectedContexts();
			this.findCommonButtonsForSelectedTasks(aSelectedContexts);
		},
		
		clearFooterButtons: function() {
			this._oFullScreenPage.setPositiveAction(null);
			this._oFullScreenPage.setNegativeAction(null);
			this._oFullScreenPage.removeAllCustomFooterContent();
			this.oSelectedTasksDetails = null;
			this.oPositiveButton = null;
			this.oNegativeButton = null;
		},
		
		findCommonButtonsForSelectedTasks: function(aSelectedContexts) {
		
			if (aSelectedContexts.length === 0) {
				return;
			}
			
			//TODO Currently, buttons are being calculated everytime user selects or deselects something. Need to be optimized.
			this.oSelectedTasksDetails = this._actionHelper.getSelectedTasksDetails(aSelectedContexts);
			
			// create footer buttons without any decision buttons in following conditions:
			// 1. if there's a selected executable item
			// 2. in case of all items where tasks are selected of different task types
			if (this.oSelectedTasksDetails.bContainsConfirmableItem
					|| (this.oDataManager.getScenarioConfig().AllItems && this.oSelectedTasksDetails.aSelectedTaskTypes.length > 1)) {
				this.createFooterButtonsForSelectedTasks([]);
			}
			
			// fetch the decision options of the first task selected in case no scenario is configured
			else if (this.oDataManager.getScenarioConfig().AllItems) {
				this.oDataManager.readDecisionOptions(
					this.oSelectedTasksDetails.aItems[0].SAP__Origin, 
					this.oSelectedTasksDetails.aItems[0].InstanceID, 
					this.oSelectedTasksDetails.aSelectedTaskTypes[0],
					jQuery.proxy(this.createFooterButtonsForSelectedTasks, this), null, false);
			}
			
			// fetch the decision options for all the task types of selected tasks in case scenario filter is configured
			else {
				this.oDataManager.massReadDecisionOptions(
					this.oSelectedTasksDetails.oSelectedTaskTypes,
					jQuery.proxy(this.createFooterButtonsWithScenario, this));
			}
		},
		
		createFooterButtonsWithScenario: function(aAllDecisionOptions) {
			this.createFooterButtonsForSelectedTasks(this._actionHelper.getCommonDecisionsForMultipleTasks(aAllDecisionOptions));
		},
		
		createFooterButtonsForSelectedTasks: function(aDecisionsAvailable) {
			
			// do not create decision buttons if any selected task is confirmable
			if (this.oSelectedTasksDetails.bContainsConfirmableItem && this.oSelectedTasksDetails.SupportsConfirm) {
				// create confirm button in case all selected tasks are confirmable
				this._oFullScreenPage.setPositiveAction(this.getPositiveButton(null));
			}
			
			else if (!this.oSelectedTasksDetails.bContainsConfirmableItem) {
				
				// create decision buttons
				for (var i in aDecisionsAvailable) {
					var oDecision = aDecisionsAvailable[i];
					var button = new Button({
						text: oDecision.DecisionText,
						press: jQuery.proxy(this.showDecisionDialog, this, oDecision)
					});
					switch(oDecision.Nature) {
						case "POSITIVE":
							button.setType(sap.m.ButtonType.Accept);
							break;
						case "NEGATIVE":
							button.setType(sap.m.ButtonType.Reject);
					}
					this._oFullScreenPage.addCustomFooterContent(button);
				}
			}
			
			// create standard buttons
			
			// claim button
			if (this.oSelectedTasksDetails.SupportsClaim) {
				this._oFullScreenPage.addCustomFooterContent(this.getClaimButton());
			}
			
			// Release button
			if (this.oSelectedTasksDetails.SupportsRelease) {
				this._oFullScreenPage.addCustomFooterContent(this.getReleaseButton());
			}
			
			// Forward button
			// TODO need to take a call on this. Tasks of different task types will have different set of possible agents to whom it can be forwarded.
			// not creating the button for now.
			/*if (this.oSelectedTasksDetails.SupportsForward) {
				this._oFullScreenPage.addCustomFooterContent(this.getForwardButton());
			}*/
			
			// Resubmit button
			if (this.oSelectedTasksDetails.SupportsResubmit) {
				this._oFullScreenPage.addCustomFooterContent(this.getResubmitButton());
			}
			
			var oButtonList = {};
			oButtonList.aFooterButtons = this._oFullScreenPage.getCustomFooterContent();
			oButtonList.oPositiveAction = this._oFullScreenPage.getPositiveAction();
			oButtonList.oNegativeAction = this._oFullScreenPage.getNegativeAction();
			/**
    		 * @ControllerHook Modify the footer buttons in table view
    		 * This hook method can be used to add and change buttons for the table view footer
    		 * It is called when the task is selected in the table view
    		 * @callback cross.fnd.fiori.inbox.view.S2~extHookChangeFooterButtonsForExpertMode
    		 * @param {object} oButtonList - contains the positive, negative buttons and the additional button list.
    		 * @return {void}
    		 */
			if (this.extHookChangeFooterButtonsForExpertMode) {
			    this.extHookChangeFooterButtonsForExpertMode(oButtonList);
			    
			    if (oButtonList) {
			        if (oButtonList.oPositiveAction) {
                        this._oFullScreenPage.setPositiveAction(oButtonList.oPositiveAction);
                    }
                    if (oButtonList.oNegativeAction) {
                        this._oFullScreenPage.setNegativeAction(oButtonList.oNegativeAction);
                    }
                    if (oButtonList.aFooterButtons) {
                        var iButtonsLength = oButtonList.aFooterButtons.length;
                        for (var j =0; j< iButtonsLength; j++) {
                            this._oFullScreenPage.addCustomFooterContent(oButtonList.aFooterButtons[j]);
                        } 
                    }  
			    }
			}
		},
		
		getPositiveButton: function(oDecision) {
			if (!this.oPositiveButton) {
				this.oPositiveButton = new PositiveAction();
			}
			
			if (oDecision) {
				this.oPositiveButton.
					setText(oDecision.DecisionText).
					attachPress(jQuery.proxy(this.showDecisionDialog, this, oDecision));
			} else {
				this.oPositiveButton.
					setText(this._oResourceBundle.getText("XBUT_CONFIRM")).
					attachPress(jQuery.proxy(this.showConfirmDialog, this));
			}
			
			return this.oPositiveButton;
		},
		
		getNegativeButton: function(oDecision) {
			if (!this.oNegativeButton) {
				this.oNegativeButton = new NegativeAction();
			}
			this.oNegativeButton.
				setText(oDecision.DecisionText).
				attachPress(jQuery.proxy(this.showDecisionDialog, this, oDecision));
				
			return this.oNegativeButton;
		},
		
		getClaimButton: function() {
			if (!this.oClaimButton) {
				this.oClaimButton = new Button({
					text: this._oResourceBundle.getText("XBUT_CLAIM"),
					press: jQuery.proxy(this.sendActionForSelectedTasks, this, this.ClaimFunctionImport)
				});
			}
			return this.oClaimButton;
		},
		
		getReleaseButton: function() {
			if (!this.oReleaseButton) {
				this.oReleaseButton = new Button({
					text: this._oResourceBundle.getText("XBUT_RELEASE"),
					press: jQuery.proxy(this.sendActionForSelectedTasks, this, this.ReleaseFunctionImport)
				});
			}
			return this.oReleaseButton;
		},
		
		getForwardButton: function() {
			if (!this.oForwardButton) {
				this.oForwardButton = new Button({
					text: this._oResourceBundle.getText("XBUT_FORWARD"),
					press: jQuery.proxy(this.onForwardPopUp, this)
				});
			}
			return this.oForwardButton;
		},
		
		getResubmitButton: function() {
			if (!this.oResubmitButton) {
				this.oResubmitButton = new Button({
					text: this._oResourceBundle.getText("XBUT_RESUBMIT"),
					press: jQuery.proxy(this.showResubmitPopUp, this)
				});
			}
			return this.oResubmitButton;
		},
		
		// display confirmation dialog on click on confirm button (for executable tasks)
		showConfirmDialog: function() {
			this._oConfirmationDialogManager.showDecisionDialog({
				question: this._oResourceBundle.getText(this.oSelectedTasksDetails.aItems.length > 1 ? "XMSG_CONFIRM_QUESTION_PLURAL" : "XMSG_CONFIRM_QUESTION",
					[this.oSelectedTasksDetails.aItems.length]),
				showNote: false,
				title: this._oResourceBundle.getText("XTIT_SUBMIT_CONFIRM"),
				confirmButtonLabel: this._oResourceBundle.getText("XBUT_CONFIRM"),
				confirmActionHandler: jQuery.proxy(function() {
						this.sendActionForSelectedTasks(this.ConfirmFunctionImport);
				},
				this)
				});
		},
		
		// display confirmation dialog on click of decision buttons
		showDecisionDialog: function(oDecisionOption) {
			this._oConfirmationDialogManager.showDecisionDialog({
				question: this._oResourceBundle.getText(this.oSelectedTasksDetails.aItems.length > 1 ? "XMSG_MULTI_DECISION_QUESTION_PLURAL" : "XMSG_MULTI_DECISION_QUESTION", [
					oDecisionOption.DecisionText, this.oSelectedTasksDetails.aItems.length
				]),
				showNote: true,
				title: this._oResourceBundle.getText("XTIT_SUBMIT_DECISION"),
				confirmButtonLabel: this._oResourceBundle.getText("XBUT_SUBMIT"),
				noteMandatory: oDecisionOption.CommentMandatory,
				confirmActionHandler: jQuery.proxy(function(oDeciOption, sNote) {
											this.sendActionForSelectedTasks(this.DecisionFunctionImport, oDeciOption, sNote);
										}, this, oDecisionOption)
			});
		},
		
		sendActionForSelectedTasks: function(sFunctionImportName, oDecisionOption, sComment) {
			this.oDataManager.sendMultiAction(sFunctionImportName, 
				this.oSelectedTasksDetails.aItems, 
				oDecisionOption, 
				sComment, 
				jQuery.proxy(this.handleActionPerformed, this), 
				null);
		},
		
		onForwardPopUp: function() {
			// implement the forward functionality
		},
	
		showResubmitPopUp: function() {
			ResubmitPopUp.open(
				this.sResubmitUniqueId,
				this,
				this.getView()
			);
		},
		
		handleResubmitPopOverOk: function() {
			var oCalendar = sap.ui.core.Fragment.byId(this.sResubmitUniqueId, "DATE_RESUBMIT");
			var aSelectedDates = oCalendar.getSelectedDates();
			var oDate = aSelectedDates[0].getStartDate();
			var oFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "YYYY-MM-ddTHH:mm:ss"
			});
			this.oDataManager.doMassResubmit(this.oSelectedTasksDetails.aItems,
				"datetime'" + oFormat.format(oDate) + "'",
				jQuery.proxy(this.handleActionPerformed, this),
				null);
			ResubmitPopUp.close();
		},
		
		handleActionPerformed: function(aSuccessList, aErrorList, aChangedItems) {
			if (aErrorList.length === 0) {
				// TODO show messages according to the type of the action ?
				// for now, showing a generic message.
				jQuery.sap.delayedCall(500, this, function() {
					sap.ca.ui.message.showMessageToast(this._oResourceBundle.getText(aSuccessList.length > 1 ? "dialog.success.multi_complete_plural" :
						"dialog.success.multi_complete", aSuccessList.length));
				});
				this.updateTableOnActionComplete(aChangedItems);
			} else {
				MultiSelectDialog.openMessageDialog(aSuccessList, aErrorList,
					jQuery.proxy(this.updateTableOnActionComplete, this, aChangedItems));
			}
		},
		
		updateTableOnActionComplete: function(aChangedItems) {
			// update the table model
			if (aChangedItems && aChangedItems.length > 0) {
				var oTableModel = this.getView().getModel("taskList"), oChangedItem;
				for (var i in aChangedItems) {
					oChangedItem = aChangedItems[i];
					// not looping through each item and finding the context of the selected item which is changed.
					// instead using the index from the selected item's list to replace the item.
					// index in the chaanged item is being set in DataManager when we process the batch response.
					//Merge the exiting task with new so that custom attributes are retained when new task is applied to model
					var task = oTableModel.getProperty(this.oSelectedTasksDetails.aItems[oChangedItem.index].sContextPath);
					for (var property in task) {
						if (task.hasOwnProperty(property) && oChangedItem.oData.hasOwnProperty(property)) {
							task[property] = oChangedItem.oData[property];
						}
					}
					oTableModel.setProperty(this.oSelectedTasksDetails.aItems[oChangedItem.index].sContextPath, task);
				}
			}
			
			// remove all selections and reset selected task data
			// TODO removing selections as of now, but for the tasks which are not processed, keep the selection
			this._oTable.removeSelections(true);
			this.handleSelectionChange();
		}
	});
});