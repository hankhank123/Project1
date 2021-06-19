/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("cross.fnd.fiori.inbox.util.Forward");
jQuery.sap.require("cross.fnd.fiori.inbox.util.ForwardSimple");
jQuery.sap.require("cross.fnd.fiori.inbox.util.SupportInfo");
jQuery.sap.require("cross.fnd.fiori.inbox.util.Conversions");
jQuery.sap.require("cross.fnd.fiori.inbox.attachment.util.AttachmentFormatters");
jQuery.sap.require("cross.fnd.fiori.inbox.util.DataManager");
jQuery.sap.require("sap.ca.scfld.md.controller.BaseDetailController");
jQuery.sap.require("sap.ca.ui.message.message");
jQuery.sap.require("sap.ca.ui.model.type.DateTime");
/*jQuery.sap.require("sap.collaboration.components.fiori.sharing.Component");
 jQuery.sap.require("sap.collaboration.components.fiori.sharing.dialog.Component");*/
jQuery.sap.require("cross.fnd.fiori.inbox.util.Resubmit");
jQuery.sap.require("cross.fnd.fiori.inbox.util.Parser");
jQuery.sap.require("cross.fnd.fiori.inbox.util.ConfirmationDialogManager");
jQuery.sap.require("cross.fnd.fiori.inbox.util.EmployeeCard");
jQuery.sap.require("cross.fnd.fiori.inbox.util.ComponentCache"); 

/*global cross:true*/
/*eslint no-undef: 2*/

sap.ca.scfld.md.controller.BaseDetailController.extend("cross.fnd.fiori.inbox.view.S3", {
	//	Controller Hook method definitions 
	//	This hook method can be used to perform additional requests for example
	//	It is called in the success callback of the detail data fetch
	extHookOnDataLoaded: null,
	//	This hook method can be used to add custom related entities to the expand list of the detail data request
	//	It is called when the detail view is displayed and before the detail data fetch starts
	extHookGetEntitySetsToExpand: null,
	//	This hook method can be used to add and change buttons for the detail view footer
	//	It is called when the decision options for the detail item are fetched successfully
	extHookChangeFooterButtons: null,
	// the model of the detail view
	oModel2: null,
	// cached detailed data for selected item
	oDetailData2: null,
	oGenericComponent: null,
	oGenericAttachmentComponent: null,
	oConfirmationDialogManager: cross.fnd.fiori.inbox.util.ConfirmationDialogManager,
	fnFormatterSupportsProperty: cross.fnd.fiori.inbox.Conversions.formatterSupportsProperty,
	oMapCountProperty: {
		"Comments": "CommentsCount",
		"Attachments": "AttachmentsCount",
		"ProcessingLogs": "ProcessingLogsCount"
	},
	bShowAdditionalAttributes: null,
	sCustomTaskTitleAttribute: "CustomTaskTitle",
	sCustomNumberValueAttribute: "CustomNumberValue",
	sCustomNumberUnitValueAttribute: "CustomNumberUnitValue",
	sCustomObjectAttributeValue: "CustomObjectAttributeValue",
	oCrossNavigationService: null,
	OPEN_MODES: ["embedIntoDetails","replaceDetails","external","genericEmbedIntoDetails"],

	onExit: function() {
		this.oComponentCache.destroyCacheContent();
		delete this.oComponentCache;
		if (sap.ca.scfld.md.controller.BaseDetailController.prototype.onExit) {
			sap.ca.scfld.md.controller.BaseDetailController.prototype.onExit.call(this);
		}

	},
	onInit: function() {
		//execute the onInit for the base class BaseDetailController
		sap.ca.scfld.md.controller.BaseDetailController.prototype.onInit.call(this);

		//-- set the default oData Model
		var oView = this.getView();

		this.i18nBundle = oView.getModel("i18n").getResourceBundle();

		// creating a unique ID of add substitute fragment for the current instance of view
		this.sResubmitUniqueId = this.createId() + "DLG_RESUBMIT";

		//Subscribe to events
		var oEventBus = sap.ca.scfld.md.app.Application.getImpl().getComponent().getEventBus();
		oEventBus.subscribe("cross.fnd.fiori.inbox", "open_supportinfo", this.onSupportInfoOpenEvent, this);
		oEventBus.subscribe("cross.fnd.fiori.inbox.dataManager", "taskCollectionFailed", jQuery.proxy(this.onTaskCollectionFailed, this));
		oEventBus.subscribe("cross.fnd.fiori.inbox.dataManager", "showReleaseLoaderOnInfoTab", jQuery.proxy(this.onShowReleaseLoaderOnInfoTab,
			this));
		oEventBus.subscribe("cross.fnd.fiori.inbox.dataManager", "showReleaseLoader", jQuery.proxy(this.onShowReleaseLoader, this));
		oEventBus.subscribe("cross.fnd.fiori.inbox.dataManager", "UIExecutionLinkRequest", jQuery.proxy(this.onShowReleaseLoader, this));

		// for Handling Custom Attributes creation/removal
		this.aCA = [];
		this.aTaskDefinitionData = [];
		this.aUIExecutionLinkCatchedData = [];
		// this.bShowLogs = false;
		

		//if upload enabled, must set xsrf token
		//and the base64 encodingUrl service for IE9 support!

		this.oRouter.attachRoutePatternMatched(this.handleNavToDetail, this);

		this.oHeaderFooterOptions = {};

		this.oTabBar = oView.byId("tabBar");
		if (this.oTabBar) {
			this.oTabBar.bindProperty("visible", "detail>/showGenericComponent", function(sValue) {
				if (sValue === undefined) {
					return false;
				}
				return !sValue;
			});
		}

		var oDataManager = sap.ca.scfld.md.app.Application.getImpl().getComponent().getDataManager();
		if (oDataManager) {
			//oDataManager.detailPage = this.getView();
			var iCacheSize = oDataManager.getCacheSize();
			if (iCacheSize) {
				this.oComponentCache = new cross.fnd.fiori.inbox.ComponentCache(iCacheSize);
			} else {
				this.oComponentCache = new cross.fnd.fiori.inbox.ComponentCache();
			}
		} else {
			this.oComponentCache = new cross.fnd.fiori.inbox.ComponentCache();
		}
		
		//Clear flag to ensure default scaffolding method 'isMainScreen' is invoked during scaffolding logic
		this._setScaffoldingExtension(false);
	},
	onTaskCollectionFailed: function() {
		this.getView().setBusy(false);
	},
	onShowReleaseLoaderOnInfoTab: function(sChannelId, sEventId, oValue) {
		var oInfoTab = this.getView().byId("infoTabContent");
		if (oInfoTab) {
			oInfoTab.setBusyIndicatorDelay(0).setBusy(oValue.bValue);
		}
	},
	onShowReleaseLoader: function(sChannelId, sEventId, oValue) {
		this.getView().setBusyIndicatorDelay(1000);
		this.getView().setBusy(oValue.bValue);
	},
	createGenericAttachmentComponent: function(oView) {
		var oAttachmentContainer = oView.byId("attachmentComponent");
		if (!jQuery.isEmptyObject(this.oGenericAttachmentComponent)) {
			this.oGenericAttachmentComponent.destroy();
			delete this.oGenericAttachmentComponent;
		}
		this.oGenericAttachmentComponent = sap.ui.getCore().createComponent({
			name: "cross.fnd.fiori.inbox.attachment",
			settings: {
				attachmentHandle: this.fnCreateAttachmentHandle(this.sCtxPath)
			}
		});
		this.oGenericAttachmentComponent.uploadURL(this.fnGetUploadUrl(this.sCtxPath));
		oAttachmentContainer.setPropagateModel(true);
		oAttachmentContainer.setComponent(this.oGenericAttachmentComponent);
	},
	// create Comments component and attach event listeners
	createGenericCommentsComponent: function(oView) {
		var oCommentsContainer = oView.byId("commentsContainer");
		if (!jQuery.isEmptyObject(this.oGenericCommentsComponent)) {
			this.oGenericCommentsComponent.destroy();
			delete this.oGenericCommentsComponent;
		}
		this.oGenericCommentsComponent = sap.ui.getCore().createComponent({
			name: "cross.fnd.fiori.inbox.comments",
			componentData: {
				oModel: this.oModel2 // this model will contain the comments data object
					// oContainer: oView.byId("commentsContainer") mandatory setting in case of propagate model
			}
		});
		this.oGenericCommentsComponent.setContainer(oCommentsContainer);
		oCommentsContainer.setComponent(this.oGenericCommentsComponent);
		// Subscribe to events for comment added and to show business card
		this.oGenericCommentsComponent.getEventBus().subscribe(null, "commentAdded", jQuery.proxy(this.onCommentPost, this));
		this.oGenericCommentsComponent.getEventBus().subscribe(null, "businessCardRequested", jQuery.proxy(this.onEmployeeLaunchCommentSender,
			this));
	},
	handleNavToDetail: function(oEvent) {
		this.oRoutingParameters = oEvent.getParameters().arguments;
		if (oEvent.getParameter("name") === "detail" || oEvent.getParameter("name") === "detail_deep") {
			this.bIsTableViewActive = (oEvent.getParameter("name") === "detail_deep" && !this.bNavToFullScreenFromLog);
			var sInstanceID = oEvent.getParameter("arguments").InstanceID;
			var sContextPath = oEvent.getParameters().arguments.contextPath;
			var sOrigin = oEvent.getParameter("arguments").SAP__Origin;
			if(sInstanceID && sInstanceID.lastIndexOf(":") === (sInstanceID.length - 1)) {
				return;
			}
			// Deep link scenario: needs to load the detail view first on executing a deep link URL
			if (jQuery.isEmptyObject(this.getView().getModel().oData)) {
				var that = this;
				var oDataManager = sap.ca.scfld.md.app.Application.getImpl().getComponent().getDataManager();
				oDataManager.setCallFromDeepLinkURL(true);
				oDataManager.oDataRead("/TaskCollection(SAP__Origin='" + jQuery.sap.encodeURL(oEvent.getParameter("arguments").SAP__Origin) +
					"',InstanceID='" + jQuery.sap.encodeURL(sInstanceID) + "')", null,
					function(oDetailData) {
						oDataManager=sap.ca.scfld.md.app.Application.getImpl().getComponent().getDataManager();
						if (oDetailData === undefined || jQuery.isEmptyObject(oDetailData)) {
							oDataManager.setDetailPageLoadedViaDeepLinking(false);
						} else {
							var oItem = jQuery.extend(true, {}, oDetailData);
							if (that.fnIsTaskInstanceAllowed(oItem,oDataManager)) {
								oDataManager.setDetailPageLoadedViaDeepLinking(true);
								that.fnPerpareToRefreshData(sContextPath, sInstanceID, sOrigin);
							} else {
								oDataManager.setDetailPageLoadedViaDeepLinking(false);
							}
						}
					},
					function(oError) {
						sap.ca.scfld.md.app.Application.getImpl().getComponent().getDataManager().setDetailPageLoadedViaDeepLinking(false);
						return;
					}
				);
			} else {
				//In case of a list item selection the first tab shall be selected
				//Exception: Comment is added on the comment tab - this tab must stay selected or nav to detail on phone
				this.fnPerpareToRefreshData(sContextPath, sInstanceID, sOrigin);
			}
		}
	},
	fnPerpareToRefreshData: function(ctxPath, instanceID, sapOrigin) {
		if (!this.stayOnDetailScreen || sap.ui.Device.system.phone) {
			var oDescriptionTab = this.oTabBar.getItems()[0];
			this.oTabBar.setSelectedItem(oDescriptionTab);
		} else {
			this.stayOnDetailScreen = false;
		}

		var oRefreshData = {
			sCtxPath: "/" + ctxPath,
			sInstanceID: instanceID,
			sSAP__Origin: sapOrigin,
			bCommentCreated: false
		};
		this.refreshData(oRefreshData);
		
		var oDataManager = sap.ca.scfld.md.app.Application.getImpl().getComponent().getDataManager();
		if (oDataManager != null && oDataManager.bOutbox) { 
			this.getOwnerComponent().getService("ShellUIService").then(
            	function (oService) {
                	oService.setTitle(sap.ca.scfld.md.app.Application.getImpl().AppI18nModel.getResourceBundle().getText("SHELL_TITLE_OUTBOX"));
            	},
            	function (oError) {
            		jQuery.sap.log.error("Cannot get ShellUIService", oError, "cross.fnd.fiori.inbox");
            	}
        	);			
		}
	},
	fnIsTaskInstanceAllowed: function(oItem,oDataManager) {
		if (oDataManager.bOutbox && ( oItem.Status === "COMPLETED" || oItem.Status === "FOR_RESUBMISSION")) {
			return true;
		} else if (!(oDataManager.bOutbox) && (oItem.Status === "READY" || oItem.Status === "RESERVED" || oItem.Status === "IN_PROGRESS" || oItem
			.Status === "EXECUTED")) {
			return true;
		} else {
			return false;
		}
	},
	fnGetUploadUrl: function(sContextPath) {
		return this.oContext.getModel().sServiceUrl + sContextPath + "/Attachments";
	},
	fnCreateAttachmentHandle: function(sContextPath) {
		var oAttachmentHandle = {
			fnOnAttachmentChange: jQuery.proxy(this.onAttachmentChange, this),
			fnOnAttachmentUploadComplete: jQuery.proxy(this.onAttachmentUploadComplete, this),
			fnOnAttachmentDeleted: jQuery.proxy(this.onAttachmentDeleted, this),
			detailModel: this.oModel2,
			uploadUrl: this.fnGetUploadUrl(this.sCtxPath)
		};
		return oAttachmentHandle;
	},
	fnRenderComponent: function(oComponentParameters) {
		//Do not use component cache, in case of debug mode
		if(this.oDataManager.bDebug){
			this.oComponentCache.destroyCacheContent();                         
		}
		
		var oDetailData = this.oModel2.getData();
		var sTaskDefinitionID = oDetailData ? oDetailData["TaskDefinitionID"] : "";
		var sSAPOrigin = oDetailData ? oDetailData["SAP__Origin"] : "";
		var sKey = sTaskDefinitionID.concat(sSAPOrigin);
		var sPriorityText = cross.fnd.fiori.inbox.Conversions.formatterPriority.call(this.getView(), sSAPOrigin, oDetailData ? oDetailData["Priority"] : "" );
		var sStatusText = oDetailData ? oDetailData["StatusText"] : "";
		if (!sStatusText) {
			sStatusText = cross.fnd.fiori.inbox.Conversions.formatterStatus.call(this.getView(), sSAPOrigin, oDetailData ? oDetailData["Status"] : "" );	
		}
		
		this.oModel2.setProperty("/PriorityText", sPriorityText);
		this.oModel2.setProperty("/StatusText", sStatusText);
		var oComponent = this.oComponentCache.getComponentByKey(sKey);
		var oTaskUIIntegrationAPI = {
			updateTask: jQuery.proxy(this.updateTask,this)
		};
		var oParameters = {
			sServiceUrl: oComponentParameters.ServiceURL,
			sAnnoFileURI: oComponentParameters.AnnotationURL,
			sErrorMessageNoData: this.i18nBundle.getText("annotationcomponent.load.error"),
			sApplicationPath: oComponentParameters.ApplicationPath,
			oTaskModel:this.fnCloneTaskModel(oDetailData),
			oQueryParameters:oComponentParameters.QueryParameters
		};
		var oCompData = {
			startupParameters: {
				oParameters: oParameters,
				taskModel: this.fnCloneTaskModel(oDetailData),
				inboxAPI : {
					addAction: jQuery.proxy(this.addAction,this),
					removeAction: jQuery.proxy(this.removeAction,this),
					updateTask: jQuery.proxy(this.updateTask,this),
					getDescription: jQuery.proxy(this.getDescription,this),
					setShowFooter: jQuery.proxy(this.setShowFooter,this),
					setShowNavButton: jQuery.proxy(this.setShowNavButton,this),
					disableAction: jQuery.proxy(this.disableAction,this),
					disableAllActions: jQuery.proxy(this.disableAllActions,this),
					enableAction: jQuery.proxy(this.enableAction,this),
					enableAllActions: jQuery.proxy(this.enableAllActions,this)
				}
			},
			 
			inboxHandle: {
				attachmentHandle: this.fnCreateAttachmentHandle(this.sCtxPath),
				tabSelectHandle: {
					fnOnTabSelect: jQuery.proxy(this.onTabSelect, this)
				},
				inboxDetailView: this
			}
		};
		var oView = this.getView();
		if (!jQuery.isEmptyObject(this.oGenericComponent)) {
			if (!this.oComponentCache.getComponentById(this.oGenericComponent.getId())) {
				this.oGenericComponent.destroy();
			}
		}
		if (jQuery.isEmptyObject(oComponent)) {
			if (oComponentParameters.ApplicationPath && oComponentParameters.ApplicationPath != "") { //if the Component is not in the same application
				jQuery.sap.registerModulePath(oComponentParameters.ComponentName, oComponentParameters.ApplicationPath[0] == "/" ?
					oComponentParameters
					.ApplicationPath : "/" + oComponentParameters.ApplicationPath);
			}
			try {
				oComponent = sap.ui.getCore().createComponent({
					name: oComponentParameters.ComponentName,
					componentData: oCompData
				});
				if (oComponent && oComponent.getIsCacheable && oComponent.getIsCacheable() === true) {
					try {
						this.oComponentCache.cacheComponent(sKey, oComponent);
					} catch (oErr) {
						$.sap.log.error(oErr);
					}
				}
			} catch (oError) {
				$.sap.log.error("Cannot create component" + oComponentParameters.ComponentName + "for smart template rendering. Showing standard task in the detail screen as a fallback: " + oError.message);
				return false;
			}
		} else {
			if (oComponent && oComponent.updateBinding) {
				oComponent.updateBinding(oCompData);
			}
		}
		oView.byId("genericComponentContainer").setComponent(oComponent);
		this.oGenericComponent = oComponent;
		return true;

	},
	fnParseComponentParameters: function(sRawString) {
		var oParameters = cross.fnd.fiori.inbox.util.Parser.fnParseComponentParameters(sRawString);
		this.isGenericComponentRendered = !jQuery.isEmptyObject(oParameters) ? this.fnRenderComponent(oParameters) : false;
		this.oModel2.setProperty("/showGenericComponent", this.isGenericComponentRendered);
		this.fnShowHideDetailScrollBar(!this.isGenericComponentRendered);
	},
	fnCloneTaskModel:function(oTaskJson){
		var taskProperties = ["SAP__Origin",
							"InstanceID",
							"TaskDefinitionID",
							"TaskDefinitionName",
							"TaskTitle",
							"Priority",
							"PriorityText",
							"Status",
							"StatusText",
							"CreatedOn",
							"CreatedBy",
							"CreatedByName",
							"Processor",
							"ProcessorName",
							"SubstitutedUser",
							"SubstitutedUserName",
							"StartDeadLine",
							"CompletionDeadLine",
							"ExpiryDate",
							"IsEscalated",
							"PriorityNumber"];

		var cloneTaskJson = {};
		for(var i=0; i < taskProperties.length; i++){
			if(oTaskJson.hasOwnProperty(taskProperties[i])){
					cloneTaskJson[taskProperties[i]] = oTaskJson[taskProperties[i]];
			}
		}
		var oView = this.getView();
		var cloneTaskModel = oView.getModel("detailClone");
		if(!cloneTaskModel){
			cloneTaskModel = new sap.ui.model.json.JSONModel();
			oView.setModel(cloneTaskModel, "detailClone");
		}
		cloneTaskModel.setData(cloneTaskJson, false);
		return cloneTaskModel;
	},
	fnShowHideDetailScrollBar: function(bShow) {
		if (bShow) {
			this.byId("mainPage").setEnableScrolling(true);
		} else {
			this.byId("mainPage").setEnableScrolling(false);
		}
	},
	switchToOutbox: function() {
		return this.oDataManager.bOutbox ? true : false;
	},
	
	_updateDetailModel: function(oItem, bMerge){
		if(this.oModel2){
			this.oModel2.setData(oItem, bMerge);
			this.fnCloneTaskModel(this.oModel2.getData());
		}else{
			jQuery.sap.log.error("Detail Model is null.");
		}
	},
	refreshData: function(oRefreshData, oDetailData) {
		if (oDetailData !== undefined) {
			this.aTaskDefinitionData = oDetailData;
		} else {
			// store taskdefinitions for the selected task
			var oTaskDefinitionModel = this.getView().getModel("taskDefinitionsModel");
			this.aTaskDefinitionData = oTaskDefinitionModel ? oTaskDefinitionModel.getData() : [];
		}
		if (!this.bIsControllerInited) {
			var oComponent = sap.ca.scfld.md.app.Application.getImpl().getComponent();
			this.oDataManager = oComponent.getDataManager();
			if (!this.oDataManager) {
				var oOriginalModel = this.getView().getModel();
				this.oDataManager = new cross.fnd.fiori.inbox.util.DataManager(oOriginalModel, this);
				oComponent.setDataManager(this.oDataManager);
			}
			this.oDataManager.attachItemRemoved(jQuery.proxy(this._handleItemRemoved, this));
			this.oDataManager.attachRefreshDetails(jQuery.proxy(this._handleDetailRefresh, this));
			this.bIsControllerInited = true;
		}
		
		//clearing already present custom attributes from DOM
		this.clearCustomAttributes();

		var oView = this.getView();
		this.oContext = new sap.ui.model.Context(oView.getModel(), oRefreshData.sCtxPath);
		oView.setBindingContext(this.oContext);

		// store the context path to be used for the delayed downloads
		this.sCtxPath = oRefreshData.sCtxPath;

		var oItem = jQuery.extend(true, {}, oView.getModel().getData(this.oContext.getPath(), this.oContext));
          	if(jQuery.isEmptyObject(oItem)){
			oItem = jQuery.extend(true, {}, oView.getModel().getData(encodeURI(this.oContext.getPath()), this.oContext));
		}
		var oActionHelper = this._getActionHelper();
		
		// store the two next possible tasks that needs to be selected if the already selected item gets removed from the list
		// two tasks will be: current task and the one next to it
		sap.ca.scfld.md.app.Application.getImpl().getComponent()
			.getEventBus().publish("cross.fnd.fiori.inbox", "storeNextItemsToSelect", {
				"sOrigin": oItem.SAP__Origin,
				"sInstanceID": oItem.InstanceID
		});
		
		// process custom attribute's data in case CustomAttributeData is already loaded using $expand for list
		if (this._getShowAdditionalAttributes() === true) {
			oItem = this._processCustomAttributesData(oItem);
		}
		
		//Set WorkflowLog property within TaskSupports in case of old tasks without this property - to avoid value from previous task
		if(oItem.TaskSupports && !oItem.TaskSupports.WorkflowLog) {
			oItem.TaskSupports.WorkflowLog = false;
		}
		
		if (!this.oModel2) {
			this.oModel2 = new sap.ui.model.json.JSONModel();
			oView.setModel(this.oModel2, "detail");
		}
		this._updateDetailModel(oItem, true);
		this.oModel2.setProperty("/CustomAttributeData", oItem.CustomAttributeData ? oItem.CustomAttributeData : []);
		this.oModel2.setProperty("/sServiceUrl", oView.getModel().sServiceUrl);
		//introduced theme property to handle background color for the header as per the theme applied
		this.oModel2.setProperty("/SapUiTheme", oActionHelper._getThemeandLanguageLocaleParams()["sap-ui-theme"]);
		var sResetDataCallId = jQuery.sap.delayedCall(1000, this, this._resetCountandDescription);
		this._updateHeaderTitle(oItem);
		
		// destroy generic component if present and not cached
		var oComponentContainer = oView.byId("genericComponentContainer");
		var sComponentId = oComponentContainer && oComponentContainer.getComponent() ? oComponentContainer.getComponent() : null;

		if (sComponentId) {
			var oCachedComponent = this.oComponentCache.getComponentById(sComponentId) || null;
			if (!oCachedComponent) {
				var oGenericComponentInstance = sap.ui.getCore().getComponent(sComponentId);
				if (oGenericComponentInstance) {
					oGenericComponentInstance.destroy();
				}
			}
		}

		/*
		 * Manual detail request via DataManager in batch with decision options together
		 * Automatic request with view binding would cause a S2 list re-rendering - SAPUI5 issue
		 */
		var that = this;
		var fnSuccess = function(oDetailData, oCustomAttributeDefinition) {
			/**
			 * @ControllerHook Provide custom logic after the item detail data received
			 * This hook method can be used to perform additional requests for example
			 * It is called in the success callback of the detail data fetch
			 * @callback cross.fnd.fiori.inbox.view.S3~extHookOnDataLoaded
			 * @param {object} oDetailData - contains the item detail data
			 * @return {void}
			 */

			if (that.extHookOnDataLoaded) {
				that.extHookOnDataLoaded(oDetailData);
			}
			if (that.aCA.length > 0) {
				that.clearCustomAttributes();
			}
			that._updateDetailModel(oDetailData, true);

			//save detail data (used to fix the flickering of ProcessingLogs tab after detail screen refresh)
			that.oDetailData2 = oDetailData;

			var sSelectedTabKey = that.byId("tabBar").getSelectedKey();
			if (sSelectedTabKey === "NOTES") {
				that.fnSetIconForCommentsFeedInput();
				this.fnFetchDataOnTabSelect("Comments");
			} else if (sSelectedTabKey === "ATTACHMENTS") {
				this.fnFetchDataOnTabSelect("Attachments");
			/*} else if (sSelectedTabKey === "PROCESSINGLOGS") {
				this.fnFetchDataOnTabSelect("ProcessingLogs");*/
			} else if (sSelectedTabKey === "OBJECTLINKS") {
				that.fnFetchObjectLinks();
			} else if (sSelectedTabKey === "DESCRIPTION") {
				that.byId("DescriptionContent").rerender();
			}
			
			if (!this._getShowAdditionalAttributes()) {
				if (oDetailData.CustomAttributeData.results && oDetailData.CustomAttributeData.results.length > 0) {
					that.oModel2.setProperty("/CustomAttributeData", oDetailData.CustomAttributeData.results);
				}
			} else if (this._getShowAdditionalAttributes() === true) {
				// set the CustomAttributeDefinitionData if not already set
				if (that.oModel2.getData().CustomAttributeDefinitionData == null && oCustomAttributeDefinition) {
					that.oModel2.setProperty("/CustomAttributeDefinitionData", oCustomAttributeDefinition);
				}
			}

			// create custom attributes elements if data is available
			jQuery.proxy(that._createCustomAttributesOnDataLoaded(oCustomAttributeDefinition), that);
			
		};

		// At the start of each fetch:
		// - Initialize tabbar to show only description tab.
		// - Clear footer.
		var onBackHandler = null;
		if (this.bIsTableViewActive) {
			onBackHandler = jQuery.proxy(this.fnNavBackToTableVw, this);
		} else {
			if (sap.ui.Device.system.phone && !this.bNavToFullScreenFromLog) {
				onBackHandler = jQuery.proxy(this.fnOnNavBackInMobile, this);
			}
			else if (this.bNavToFullScreenFromLog) {
				onBackHandler = jQuery.proxy(this.fnOnNavBackFromLogDescription, this);
			}
		}
		if(this.getOwnerComponent().oShellUIService && onBackHandler) {
			this.getOwnerComponent().oShellUIService.setBackNavigation(onBackHandler);
		}
		if (this.oHeaderFooterOptions) {
			this.oHeaderFooterOptions = jQuery.extend(this.oHeaderFooterOptions, {
				oPositiveAction: null,
				oNegativeAction: null,
				buttonList: [],
				oJamOptions: null,
				oEmailSettings: null,
				oUpDownOptions: null,
				onBack: (this.getOwnerComponent().oShellUIService ? null : onBackHandler)
			});
			this.refreshHeaderFooterOptions();
		}
		if (this.oModel2 != null) {
			this.fnClearCachedData();
		}
		
		var sKey = oRefreshData.sSAP__Origin + oRefreshData.sInstanceID;
		var bDecisionOptionsRead = false;
		var bUIExecutionLinkRead = false;
		var bIsUIExecutionLinkSupported = oItem.TaskSupports.UIExecutionLink;

		var ofetchUIExecutionLinkDeferred = $.Deferred();
		$.when(ofetchUIExecutionLinkDeferred).then($.proxy(function(){
			this.oDataManager.fetchUIExecutionLink(oItem, jQuery.proxy(function(UIExecutionLinkData) {
				// check if the selected task is annotation based task, also render annotation component if needed
				bUIExecutionLinkRead = true;
				oItem.UIExecutionLink = UIExecutionLinkData;
				this.oModel2.getData().UIExecutionLink = UIExecutionLinkData;
				var aDecisionOptions = this.oDataManager.getDataFromCache("DecisionOptions", oItem);
				// TODO what if reading decision option fails. The decision option data will never be cached and open button will never be created.
				UIExecutionLinkData = bIsUIExecutionLinkSupported ? UIExecutionLinkData : {};
				jQuery.sap.clearDelayedCall(sResetDataCallId);
				this.fnHandleIntentValidationAndNavigation(UIExecutionLinkData, aDecisionOptions, bDecisionOptionsRead, bIsUIExecutionLinkSupported,  oRefreshData, fnSuccess);
	
			}, this), jQuery.proxy(function(oError) {
				bUIExecutionLinkRead = true;
				var aDecisionOptions = this.oDataManager.getDataFromCache("DecisionOptions", oItem);
				if (bDecisionOptionsRead) {
					aDecisionOptions = aDecisionOptions ? aDecisionOptions : [];
					this.createDecisionButtons(aDecisionOptions, {}, oRefreshData.sSAP__Origin);
				}
				jQuery.sap.clearDelayedCall(sResetDataCallId);
				this.fnHandleIntentValidationAndNavigation({},aDecisionOptions, bDecisionOptionsRead, bIsUIExecutionLinkSupported,  oRefreshData, fnSuccess);
			}, this));
		}, this));

		//Show or hide log based on TaskSupports flags and whether task was navigated fro Workflow Log
		if (this.bNavToFullScreenFromLog) {
			//Hide side content
			this.setShowSideContent(false);
			//Decision options are not required in case of completed task that is viewed by navigating from Workflow Log
			if (oItem.Status === "COMPLETED") {
				//Only resolve UI execution link and description specific data - No further processing required here
				ofetchUIExecutionLinkDeferred.resolve();
				return;
			}
		} else {
			if ((oItem.TaskSupports.ProcessingLogs || oItem.TaskSupports.WorkflowLog) 
								&& this.oDataManager.getShowLogEnabled() && this.bShowLogs) {
				//Show side content and log data
				this.createLogs();
				this.setShowSideContent(true);
			} else {
				//Hide side content
				that.setShowSideContent(false);
			}
		}	
		
		// load decision options for the selected task
		this.oDataManager.readDecisionOptions(oItem.SAP__Origin, oItem.InstanceID, oItem.TaskDefinitionID,
			jQuery.proxy(function(aDecisionOptions) {
				bDecisionOptionsRead = true;
				var oUIExecutionLink = this.oDataManager.getDataFromCache("UIExecutionLink", oItem);
				if (bUIExecutionLinkRead) {
					if (bIsUIExecutionLinkSupported) {
						oUIExecutionLink = oUIExecutionLink ? oUIExecutionLink : {};
						this.createDecisionButtons(aDecisionOptions, oUIExecutionLink, oRefreshData.sSAP__Origin);
					} else {
						this.createDecisionButtons(aDecisionOptions, {}, oRefreshData.sSAP__Origin);
					}
				}
				ofetchUIExecutionLinkDeferred.resolve();
			}, this), jQuery.proxy(function(oError) {
				jQuery.sap.log.error("Error while loading decision options");
				var oUIExecutionLink = this.oDataManager.getDataFromCache("UIExecutionLink", oItem);
				bDecisionOptionsRead = true;
				if (bUIExecutionLinkRead) {
					if (bIsUIExecutionLinkSupported) {
						oUIExecutionLink = oUIExecutionLink ? oUIExecutionLink : {};
						this.createDecisionButtons([], oUIExecutionLink, oRefreshData.sSAP__Origin);
					} else {
						this.createDecisionButtons([], {}, oRefreshData.sSAP__Origin);
					}
				}
				ofetchUIExecutionLinkDeferred.resolve();
			}, this), false);
	},
	/* validate the URL for an Intent.
	 * If validation passes, check for embed or external mode.
	 If embed mode , embed within detail view.
	 * If external mode navigate to the app if UI5
	 * If external mode open in new tab for legacy apps
	 * If both external and embed mode are not configured via the URL param in the target mapping , but Navigation is supported for the user open in the external mode.
	 * If the above validations fail, validate for an absolute URL and open in a new window
	 * The task opens either on click or on click of open task button.
	 * If the triggerOn taskSelect , it opens on task selection, in place 
	 * If triggerOn openTask, it saves the intent configuration and default view is loaded, on click of open task later, the application is loaded in either embed or external mode
	 * */
	fnHandleIntentValidationAndNavigation: function(UIExecutionLinkData,aDecisionOptions, bDecisionOptionsRead, bIsUIExecutionLinkSupported,  oRefreshData, fnSuccess) {
		var	that = this;
		var sURL = UIExecutionLinkData.GUI_Link;
		var oParsedParams = this._getParsedParamsForIntent(sURL);
		var xNavService = this._getCrossNavigationService();
		if (oParsedParams && xNavService) {
			var aIntents = this._getIntentParam(oParsedParams);
			xNavService.isNavigationSupported(aIntents, sap.ca.scfld.md.app.Application.getImpl().getComponent()).done(
				function(aResponses) {
					var supportedOpenMode = that._getSupportedOpenMode(aResponses);
					if (supportedOpenMode) {
						that.fnHandleIntentNavigation(oParsedParams, supportedOpenMode, UIExecutionLinkData, oRefreshData, fnSuccess);
					} else {
						that.fnViewTaskInDefaultView(UIExecutionLinkData, oRefreshData, fnSuccess);
					}
					if(supportedOpenMode === "genericEmbedIntoDetails") {
						that.setShowFooter(false);
					} else {
						that.fnValidateDecisionOptionsAndCreatButtons(bDecisionOptionsRead, bIsUIExecutionLinkSupported, aDecisionOptions, UIExecutionLinkData, oRefreshData.sSAP__Origin );
					}
				}
			).fail(function() {
				that.fnViewTaskInDefaultView(UIExecutionLinkData, oRefreshData, fnSuccess);
				that.fnValidateDecisionOptionsAndCreatButtons(bDecisionOptionsRead, bIsUIExecutionLinkSupported, aDecisionOptions, UIExecutionLinkData, oRefreshData.sSAP__Origin );
			});
		} else {
			this.fnValidateDecisionOptionsAndCreatButtons(bDecisionOptionsRead, bIsUIExecutionLinkSupported, aDecisionOptions, UIExecutionLinkData, oRefreshData.sSAP__Origin );
			this.fnViewTaskInDefaultView(UIExecutionLinkData, oRefreshData, fnSuccess);
		}
	},
	fnHandleIntentNavigation: function(oParsedParams, supportedOpenMode, UIExecutionLinkData, oRefreshData, fnSuccess) {
		oParsedParams.params.openMode = supportedOpenMode;
		switch(supportedOpenMode) {
			case "embedIntoDetails":
			case "genericEmbedIntoDetails":
				this.fnRenderIntentBasedApp(oParsedParams, UIExecutionLinkData, oRefreshData, fnSuccess);
				break;
			case "replaceDetails":
			case "external":
				this.oEmbedModeIntentParams = {};
				this.oEmbedModeIntentParams[oRefreshData.sSAP__Origin + "_" + oRefreshData.sInstanceID] = jQuery.extend({
					"OpenInEmbedMode": (supportedOpenMode === "replaceDetails")
				}, oParsedParams);
				this.fnViewTaskInDefaultView(UIExecutionLinkData, oRefreshData, fnSuccess);
		}
	},
	fnRenderIntentBasedApp: function(oParsedParams, UIExecutionLinkData, oRefreshData, fnSuccess) {
		var that = this;
		var sNavigationIntent = "#" + oParsedParams.semanticObject + "-" + oParsedParams.action;
		
		// destroy generic component if present and not cached
		var oComponentContainer = this.byId("genericComponentContainer");
		var sComponentId = oComponentContainer && oComponentContainer.getComponent() ? oComponentContainer.getComponent() : null;

		if (sComponentId) {
			var oCachedComponent = this.oComponentCache.getComponentById(sComponentId) || null;
			if (!oCachedComponent) {
    			var oGenericComponentInstance = sap.ui.getCore().getComponent(sComponentId);
    			if (oGenericComponentInstance) {
    				oGenericComponentInstance.destroy();
    			}
			}
		}

		var oNavigationService = this._getCrossNavigationService();
		var oComponentData = {
			startupParameters: {
				taskModel:this.fnGetTaskModelClone(oRefreshData),
				queryParameters:oParsedParams.params,
				inboxAPI : {
					addAction: jQuery.proxy(this.addAction,this),
					removeAction: jQuery.proxy(this.removeAction,this),
					updateTask: jQuery.proxy(this.updateTask,this),
					getDescription: jQuery.proxy(this.getDescription,this),
					setShowFooter: jQuery.proxy(this.setShowFooter,this),
					setShowNavButton: jQuery.proxy(this.setShowNavButton,this),
					disableAction: jQuery.proxy(this.disableAction,this),
					disableAllActions: jQuery.proxy(this.disableAllActions,this),
					enableAction: jQuery.proxy(this.enableAction,this),
					enableAllActions: jQuery.proxy(this.enableAllActions,this)
				}
				//applicationPath:,//Is this needed?
			},			
			onTaskUpdate: jQuery.proxy(that.fnDelegateTaskRefresh, that)
		};
		var sParams = "?" + that.fnCreateURLParameters(oParsedParams.params);
		oNavigationService.createComponentInstance(sNavigationIntent + sParams, {
				componentData: oComponentData
			}, that.getOwnerComponent())
			.done(function(oComponent) {
				that.byId("genericComponentContainer").setComponent(oComponent);
				that.oModel2.setProperty("/showGenericComponent", true);
			})
			.fail(function(oError) { // if cannot render component, open default view
				that.oModel2.setProperty("/showGenericComponent", false);
				jQuery.sap.log.error(oError);
				that.fnViewTaskInDefaultView(UIExecutionLinkData, oRefreshData, fnSuccess);
			});

	},
	
	updateTask: function(SAP__Origin, TaskInstanceId){
		var oDeferred = new jQuery.Deferred();
		if (!SAP__Origin || !TaskInstanceId ) {
			oDeferred.reject("Input parameters SAP__Origin and TaskInstanceId are mandatory");
			return oDeferred.promise();
		}
		var fnSuccess = function(oData){
			 oDeferred.resolve();	
		};
		
		var fnError = function(oError){
			oDeferred.reject(oError.message);
			
		};
		this.oDataManager.fnUpdateSingleTask(SAP__Origin, TaskInstanceId, fnSuccess, fnError);
		return oDeferred.promise();
	},
	
	getDescription: function(SAP__Origin, TaskInstanceId) {
		
		var oDeferred = new jQuery.Deferred();
		
		if (!SAP__Origin || !TaskInstanceId ) {
			oDeferred.reject("Input parameters SAP__Origin and TaskInstanceId are mandatory");
			return oDeferred.promise();
		}

		// success handler of read data request
		var fnSuccess = function(data) {
			oDeferred.resolve(data);
		};

		// error handler for read request
		var fnError = function(oError) {
			oDeferred.reject(oError.message);
		};

		this.oDataManager.readDescription(SAP__Origin, TaskInstanceId, fnSuccess, fnError);
		return oDeferred.promise();

	},
	
	_setScaffoldingExtension: function(bSetExtension) {
		if(bSetExtension) {
			this._isScaffoldingExtended = true;
		} else {
			this._isScaffoldingExtended = false;
		}
	},
	
	_getScaffoldingExtension: function() {
		if(this._isScaffoldingExtended) {
			return true;
		} else {
			return false;
		}
	},
	
	isMainScreen: function() {
		//Overriding default scaffolding to ensure successful execution of inbox API
		if(this._getScaffoldingExtension()) {
			return false;
		} else {
			return sap.ca.scfld.md.controller.BaseDetailController.prototype.isMainScreen.call(this);
		}
	},
	
	/**
	 * @public
	 * API: Show/hide footer of page
	 * @param: {boolean} showFooter - default value = false
	 */
	setShowFooter: function(showFooter) {
		if (showFooter) {
			this.oHeaderFooterOptions = jQuery.extend(this.oHeaderFooterOptions,this._oPreviousHeaderFooterOptions);
			this.refreshHeaderFooterOptions();
			//Clear flag to ensure default scaffolding method 'isMainScreen' is invoked
			this._setScaffoldingExtension(false);
		} else {
			//Set flag to ensure overridden scaffolding method 'isMainScreen' is invoked
			this._setScaffoldingExtension(true);
			//Store header/footer options before hiding footer
			this._oPreviousHeaderFooterOptions =  jQuery.extend({},this.oHeaderFooterOptions);
			//Nullify all attributes within header/footer options except title and set flag to suppress bookmark button
			this.oHeaderFooterOptions = jQuery.extend(this.oHeaderFooterOptions, {
				oPositiveAction: null,
				oNegativeAction: null,
				buttonList: null,
				oJamOptions: null,
				oEmailSettings: null,
				bSuppressBookmarkButton: true
			});
			this.refreshHeaderFooterOptions();
			//Ensure footer is hidden  
			if(this.getView().getContent()[0].getShowFooter()) {
				jQuery.sap.log.error("Hiding footer failed");
			} 
		}
	},
	
	/**
	 * @public
	 * API: Show/hide navigation button in header of page
	 * @param: {boolean} showNavButton - default value = false
	 *		   {function} navEventHandler - optional
	 */
	setShowNavButton: function(showNavButton, navEventHandler) {
		if (showNavButton) {
			if(navEventHandler){
				this._backButtonHandler = navEventHandler;
			} else {
				//Set default Back button handler in header/footer options
				this._backButtonHandler = jQuery.proxy(this.onNavButtonPress, this);
			}
		} else {
			//Nullify back button handler within header/footer options 
			this._backButtonHandler = null;
		}
		this.oHeaderFooterOptions = jQuery.extend(this.oHeaderFooterOptions, {
			onBack: this._backButtonHandler
		});
		this.refreshHeaderFooterOptions();
	},
	
	onNavButtonPress: function(oEvent) {
		//Navigate back
		if(window.history.length > 0) {
			window.history.back();
		} else {
			jQuery.sap.log.error("Navigation history does not exist. Ensure that navigation history is maintained or provide custom event handler for back navigation button through setShowNavButton API");
		}
	},
	
	fnGetTaskModelClone: function(oRefreshData){
		var oView = this.getView();
		var oContext = new sap.ui.model.Context(oView.getModel(), oRefreshData.sCtxPath);
		var oItem = jQuery.extend(true, {}, oView.getModel().getData(oContext.getPath(), oContext));
		return this.fnCloneTaskModel(oItem);
	},
	fnCreateURLParameters: function(data) {
		return Object.keys(data).map(function(key) {
			return [key, data[key]].map(encodeURIComponent).join("=");
		}).join("&");
	},
	
	fnValidateDecisionOptionsAndCreatButtons: function(bDecisionOptionsRead, bIsUIExecutionLinkSupported,aDecisionOptions, UIExecutionLinkData, sSAP__Origin) {
		if (bDecisionOptionsRead) {
				if (bIsUIExecutionLinkSupported) {
					aDecisionOptions = aDecisionOptions ? aDecisionOptions : [];
					this.createDecisionButtons(aDecisionOptions, UIExecutionLinkData, sSAP__Origin);
				} else {
					aDecisionOptions = aDecisionOptions ? aDecisionOptions : [];
					this.createDecisionButtons(aDecisionOptions, {}, sSAP__Origin);
				}
			}
	},
	fnDelegateTaskRefresh: function() {
		var oNavigationParameters = this.oRoutingParameters;
		var sSAPOrigin = oNavigationParameters.SAP__Origin;
		var sInstanceId = oNavigationParameters.InstanceID;

		if (oNavigationParameters && sSAPOrigin && sInstanceId) {
			this.oDataManager.fnUpdateSingleTask(sSAPOrigin, sInstanceId);
		}
	},
	/*
	 * Navigates to an app, either externally or embeds it into the detail page
	 */
	fnNavigateToApp: function(oParsedParams, bEmbed) {
		if (!bEmbed) {
			this._getCrossNavigationService().toExternal({
				target: {
					semanticObject: oParsedParams.semanticObject,
					action: oParsedParams.action
				},
				params: oParsedParams.params,
				appSpecificRoute: oParsedParams.appSpecificRoute
			});
		} else {
			var sOpenMode = oParsedParams.params.openMode;
			this.fnEmbedApplicationInDetailView(oParsedParams, sOpenMode);
		}
	},

	_resetCountandDescription: function() {
		this._updateDetailModel({
			Description: ""
		}, true);		
		this.fnClearCachedData();
	},

	fnViewTaskInDefaultView: function(UIExecutionLinkData, oRefreshData, fnSuccess) {
		this.oModel2.setProperty("/showGenericComponent", false);
		this.fnGetDetailsForSelectedTask(UIExecutionLinkData, oRefreshData, fnSuccess);
	},
	// Fetches task details like Description, CustomAttributeData, Tab Counts based on whether the task is annotation based
	fnGetDetailsForSelectedTask: function(UIExecutionLinkData, oRefreshData, fnSuccess) {
		var that = this;
		var oTaskSupports = that.oModel2.getData().TaskSupports;
		var bIsUIExLinkSupported = (oTaskSupports && oTaskSupports.UIExecutionLink) ? oTaskSupports.UIExecutionLink : false;

		// if the task has annotation based component, render it
		that.fnParseComponentParameters(bIsUIExLinkSupported ? UIExecutionLinkData.GUI_Link : "");

		var aExpandEntitySets = [];
		if (oTaskSupports && oTaskSupports.Description) {
			aExpandEntitySets.push("Description");
		}
		if (!this._getShowAdditionalAttributes() && oTaskSupports && oTaskSupports.CustomAttributeData) {
			aExpandEntitySets.push("CustomAttributeData");
		}

		/**
		 * @ControllerHook Add additional entities related to the work item
		 * This hook method can be used to add custom related entities to the expand list of the detail data request
		 * It is called when the detail view is displayed and before the detail data fetch starts
		 * @callback cross.fnd.fiori.inbox.view.S3~extHookGetEntitySetsToExpand
		 * @return {array} aEntitySets - contains the names of the related entities
		 */
		if (this.extHookGetEntitySetsToExpand) {
			var aEntitySets = this.extHookGetEntitySetsToExpand();
			// append custom entity sets to the default list
			aExpandEntitySets.push.apply(aExpandEntitySets, aEntitySets);
		}

		if (!UIExecutionLinkData.GUI_Link) {
			UIExecutionLinkData.GUI_Link = "";
		}

		var oItemData = that.oModel2.getData();

		if (!that.isGenericComponentRendered) {
			var aTabCounts = [];
			if(this.fnFormatterSupportsProperty(oItemData.TaskSupports.Comments, oItemData.SupportsComments)) {
				aTabCounts.push("Comments");
			}
			if(this.fnFormatterSupportsProperty(oItemData.TaskSupports.Attachments, oItemData.SupportsAttachments)) {
				aTabCounts.push("Attachments");
			}
			if(oItemData.TaskSupports.TaskObject && this.oDataManager.bShowTaskObjects) {
				aTabCounts.push("TaskObjects");
			}

			that.oDataManager.readDataOnTaskSelection(oRefreshData.sCtxPath, aExpandEntitySets, aTabCounts, oRefreshData.sSAP__Origin, oRefreshData.sInstanceID,
				oItemData.TaskDefinitionID,
				function(oDetailData, oCustomAttributeDefinition, oTabCounts) {
					if(oTabCounts.sCommentsCount != null && oTabCounts.sCommentsCount !== "") {
						that.oModel2.setProperty("/CommentsCount", oTabCounts.sCommentsCount);
					}
					if(oTabCounts.sAttachmentsCount != null && oTabCounts.sAttachmentsCount !== "") {
						that.oModel2.setProperty("/AttachmentsCount", oTabCounts.sAttachmentsCount);
					}
					if(oTabCounts.sTaskObjectsCount != null && oTabCounts.sTaskObjectsCount !== "") {
						that.oModel2.setProperty("/ObjectLinksCount", oTabCounts.sTaskObjectsCount);
						that.fnHandleNoTextCreation("ObjectLinks");
					}
					oDetailData.UIExecutionLink = UIExecutionLinkData;
					fnSuccess.call(that, oDetailData, oCustomAttributeDefinition);
				}
			);

		} else { // if annotation based task, fetch task details, update counts for attachment component and comments component if implemented and fetch decision options

			// set the value of DataManager flag bDetailPageLoaded to solve the busy loader issue after performing action.
			// TODO improve the busy loader implementation
			that.oDataManager.setDetailPageLoaded(true);
			if (that.byId("attachmentComponent")) {
				that.fnCountUpdater("Attachments", that.oModel2.getData().SAP__Origin, that.oModel2.getData().InstanceID);
			}
			if (that.byId("commentsContainer")) {
				that.fnCountUpdater("Comments", that.oModel2.getData().SAP__Origin, that.oModel2.getData().InstanceID);
			}
			if (that.byId("MIBObjectLinksList")) {
				that.fnCountUpdater("ObjectLinks", that.oModel2.getData().SAP__Origin, that.oModel2.getData().InstanceID);
			}
		}

	},
	clearCustomAttributes: function() {
		if (this.aCA.length > 0) {
			for (var i = 0; i < this.aCA.length; i++) {
				this.aCA[i].destroy();
			}
			this.aCA = [];
		}
	},

	onAttachmentChange: function(e) {

		var oUploadCollection = e.getSource();
		var sFileName = e.getParameters().getParameters().files[0].name;
		if (oUploadCollection.getHeaderParameters()) {
			oUploadCollection.destroyHeaderParameters();
		}
		//Split filename and extension
		var iLastDot = sFileName.lastIndexOf(".");
		var extension = "";
		if (iLastDot != -1) {
			extension = sFileName.substr(iLastDot+1);
			sFileName = sFileName.substr(0, iLastDot);
		}

		oUploadCollection.addHeaderParameter(new sap.m.UploadCollectionParameter({
			name: "x-csrf-token",
			value: this.getXsrfToken()
		}));
		oUploadCollection.addHeaderParameter(new sap.m.UploadCollectionParameter({
			name: "slug",
			value: encodeURIComponent(sFileName)
		}));
		oUploadCollection.addParameter(new sap.m.UploadCollectionParameter({
			name: "x-csrf-token",
			value: this.getXsrfToken()
		}));
		oUploadCollection.addParameter(new sap.m.UploadCollectionParameter({
			name: "slug",
			value: sFileName
		}));
		oUploadCollection.addHeaderParameter(new sap.m.UploadCollectionParameter({
			name: "Accept",
			value: "application/json"
		}));
		oUploadCollection.addParameter(new sap.m.UploadCollectionParameter({
			name: "Accept",
			value: "application/json"
		}));
		if(extension !== "") {
			oUploadCollection.addHeaderParameter(new sap.m.UploadCollectionParameter({
				name: "extension",
				value: extension
			}));
			oUploadCollection.addParameter(new sap.m.UploadCollectionParameter({
				name: "extension",
				value: extension
			}));
		}
	},
	onAttachmentUploadComplete: function(e) {
		var oItem = this.oModel2.getData();
		var that = this;
		that.oEventSource = e.getSource();
		var fnClose = function() {
			this.oEventSource.updateAggregation("items");
			this.oEventSource.rerender();
		};
		if (e.getParameters().getParameters().status == 201) {
			var oFileData = jQuery.parseJSON(e.getParameters().files[0].responseRaw).d;
			// update the attachments data and attachments count 
			if (oItem.Attachments && oItem.Attachments.results) {
				oItem.Attachments.results.unshift(oFileData);
			} else {
				oItem.Attachments = {
					results: [oFileData]
				};
			}
			oItem.AttachmentsCount = oItem.Attachments.results.length;
			this._updateDetailModel(oItem);
			sap.ca.ui.message.showMessageToast(this.i18nBundle.getText("dialog.success.attachmentUpload"));

			// update the counter on history tab
			//this.fnCountUpdater("ProcessingLogs", oItem.SAP__Origin, oItem.InstanceID);
		} else {
			var sErrorText = this.i18nBundle.getText("dialog.error.attachmentUpload");
			sap.ca.ui.message.showMessageBox({
				type: sap.ca.ui.message.Type.ERROR,
				message: sErrorText,
				details: ""
			}, jQuery.proxy(fnClose, that));
		}
	},
	onAttachmentDeleted: function(e) {
		var sAttachmentId = e.getParameters().documentId;
		var oItem = this.oModel2.getData();
		var oUploadCollectionControl = this._getUploadCollectionControl();
		this._setBusyIncdicatorOnDetailControls(oUploadCollectionControl, true);

		this.oDataManager.deleteAttachment(oItem.SAP__Origin, oItem.InstanceID, sAttachmentId,
			$.proxy(function() {

				// remove the deleted attachment from the data and update the model
				var oAttachmentsData = oItem.Attachments.results;
				$.each(oAttachmentsData, function(i, oAttachment) {
					if (oAttachment.ID === sAttachmentId) {
						oAttachmentsData.splice(i, 1);
						return false;
					}
				});
				oItem.Attachments.results = oAttachmentsData;
				oItem.AttachmentsCount = oAttachmentsData.length;

				// update the no data text if no attachments any more
				if (oItem.AttachmentsCount === 0) {
					oUploadCollectionControl.setNoDataText(this.i18nBundle.getText("view.Attachments.noAttachments"));
				}
				this._setBusyIncdicatorOnDetailControls(oUploadCollectionControl, false);
				this._updateDetailModel(oItem);
				// update the counter on history tab
			//	this.fnCountUpdater("ProcessingLogs", oItem.SAP__Origin, oItem.InstanceID);

				sap.ca.ui.message.showMessageToast(this.i18nBundle.getText("dialog.success.attachmentDeleted"));
			}, this),
			$.proxy(function(oError) {
				this._setBusyIncdicatorOnDetailControls(oUploadCollectionControl, false);
				var sErrorText = this.i18nBundle.getText("dialog.error.attachmentDelete");
				sap.ca.ui.message.showMessageBox({
					type: sap.ca.ui.message.Type.ERROR,
					message: sErrorText,
					details: ""
				});
			}, this)
		);

	},
	getXsrfToken: function() {
		var sToken = this.getView().getModel().getHeaders()['x-csrf-token'];
		if (!sToken) {

			this.getView().getModel().refreshSecurityToken(
				function(e, o) {
					sToken = o.headers['x-csrf-token'];
				},
				function() {
					sap.ca.ui.message.showMessageBox({
						type: sap.ca.ui.message.Type.ERROR,
						message: 'Could not get XSRF token',
						details: ''
					});
				},
				false);
		}
		return sToken;
	},
	onFileUploadFailed: function(e) {
		var sErrorText = this.i18nBundle.getText("dialog.error.attachmentUpload");
		sap.ca.ui.message.showMessageBox({
			type: sap.ca.ui.message.Type.ERROR,
			message: sErrorText,
			details: e.getParameters().exception
		});
	},
	addShareOnJamAndEmail: function(oButtonList) {

		if (this.oDataManager.bOutbox === true) {
			return;
		}

		var oJamOptions = {
			fGetShareSettings: jQuery.proxy(this.getJamSettings, this)
		};

		var oEmailSettings = {
			sSubject: this.getMailSubject(),
			fGetMailBody: jQuery.proxy(this.getMailBody, this)
		};
		
		oButtonList.oJamOptions = oJamOptions;
		oButtonList.oEmailSettings = oEmailSettings;

		this.oHeaderFooterOptions = jQuery.extend(this.oHeaderFooterOptions, {
			oJamOptions: oButtonList.oJamOptions,
			oEmailSettings: oButtonList.oEmailSettings
		});

	},
	_getDescriptionForShare: function(sDescriptionText) {
		var oData = this.oModel2.getData();
		var sBody = "\n\n" + this.i18nBundle.getText("share.email.body.detailsOfTheItem") + "\n\n";
		var oDateFormatter = sap.ui.core.format.DateFormat.getDateInstance();
		if (oData.TaskTitle && oData.TaskTitle.trim() !== "") {
			sBody += this.i18nBundle.getText("item.taskTitle", oData.TaskTitle.trim()) + "\n";
		}
		if (oData.Priority && oData.Priority !== "") {
			sBody += this.i18nBundle.getText("item.priority", cross.fnd.fiori.inbox.Conversions.formatterPriority.call(this.getView(), oData.SAP__Origin,
				oData.Priority)) + "\n";
		}
		if (oData.CompletionDeadLine) {
			sBody += this.i18nBundle.getText("item.dueDate", oDateFormatter.format(oData.CompletionDeadLine, true)) + "\n";
		}
		if (sDescriptionText && sDescriptionText.trim() !== "") {
			// use override text if given
			sBody += this.i18nBundle.getText("item.description", sDescriptionText) + "\n";
		} else if ((oData.Description) && (oData.Description.Description) && (oData.Description.Description.trim() !== "")) {
			sBody += this.i18nBundle.getText("item.description", this._getTrimmedString(oData.Description.Description)) + "\n";
		}
		var sCreator = oData.CreatedByName;
		if (!sCreator || sCreator.trim() === "") {
			sCreator = oData.CreatedBy;
		}
		if (sCreator && sCreator.trim() !== "") {
			sBody += this.i18nBundle.getText("item.createdBy", sCreator) + "\n";
		}
		if (oData.CreatedOn) {
			sBody += this.i18nBundle.getText("item.createdOn", oDateFormatter.format(oData.CreatedOn, true)) + "\n";
		}
		if (oData.CompletedOn) {
			sBody += this.i18nBundle.getText("item.completedOn", oDateFormatter.format(oData.CompletedOn, true)) + "\n";
		}

		return sBody;
	},
	_getDescriptionForShareInMail: function(sDescriptionText) {
		var sBody = this._getDescriptionForShare(sDescriptionText);
		sBody += this.i18nBundle.getText("share.email.body.link", window.location.href.split("(").join("%28").split(")").join("%29")) + "\n";

		return sBody;
	},
	getJamSettings: function() {
		return {
			object: {
				id: window.location.href,
				share: this.getJamDescription()
			}
		};
	},
	getJamDescription: function() {
		var sBody = this._getDescriptionForShare();

		return sBody;
	},
	getMailSubject: function() {
		var oData = this.oModel2.getData();
		var sPriority = cross.fnd.fiori.inbox.Conversions.formatterPriority.call(this.getView(), oData.SAP__Origin, oData.Priority);
		var sCreatedBy = oData.CreatedByName;
		var sTaskTitle = oData.TaskTitle;

		return cross.fnd.fiori.inbox.Conversions.formatterMailSubject.call(this, sPriority, sCreatedBy, sTaskTitle);
	},
	getMailBody: function() {

		// Internet Explorer supports only shorter mailto urls, we pass only the items url this case
		if (jQuery.browser.msie) {
			return window.location.href.split("(").join("%28").split(")").join("%29");
		}

		var sFullMailBody = this._getDescriptionForShareInMail();
		var sMailSubject = this.getMailSubject();
		// due to a limitation in most browsers, don't let the mail link longer than 2000 chars
		var sFullMailUrl = sap.m.URLHelper.normalizeEmail(null, sMailSubject, sFullMailBody);
		if (sFullMailUrl.length > 2000) {
			// mail url too long, we need to reduce the description field's size
			var oData = this.oModel2.getData();
			var sMinimalMailBody = this._getDescriptionForShareInMail(" ");
			var sMinimalMailUrl = sap.m.URLHelper.normalizeEmail(null, sMailSubject, sMinimalMailBody);
			var iMaxDescriptionLength = 2000 - sMinimalMailUrl.length;
			var sDescription = "";
			if (oData.Description && oData.Description.Description) {
				sDescription = window.encodeURIComponent(this._getTrimmedString(oData.Description.Description));
			}
			sDescription = sDescription.substring(0, iMaxDescriptionLength);

			// if we cut encoded chars in half the decoding won't work (encoded chars can have length of 9)
			// remove the encoded part from the end
			var bDecodeSucceeded = false;
			while (!bDecodeSucceeded || sDescription.length == 0) {
				bDecodeSucceeded = true;
				try {
					sDescription = window.decodeURIComponent(sDescription);
				} catch (oError) {
					sDescription = sDescription.substring(0, sDescription.length - 1);
					bDecodeSucceeded = false;
				}
			}
			sDescription = sDescription.substring(0, sDescription.length - 3) + "...";

			var sTruncatedMailBody = this._getDescriptionForShareInMail(sDescription);
			return sTruncatedMailBody;
		}

		return sFullMailBody;
	},
	_getIntentParam: function(oParsedParams) {
		var aMappingConfig = [];

		for(var i = 0; i < this.OPEN_MODES.length; i++) {
			aMappingConfig.push(
				{
					target: {
						semanticObject: oParsedParams.semanticObject,
						action: oParsedParams.action
					},
					//If parsedParams.params contains "openMode" we should replace it with ours in new object
					//in order to check which navigation is supported:
					params: jQuery.extend({}, oParsedParams.params,	{"openMode": this.OPEN_MODES[i]})
				}
			);
		}

		return aMappingConfig;
	},
	_getIntentWithOutParam: function(oParsedParams) {
		var aMappingConfig = [{
			target: {
				semanticObject: oParsedParams.semanticObject,
				action: oParsedParams.action
			},
			params: oParsedParams.params
		}];
		return aMappingConfig;
	},
	_getTrimmedString: function(sText) {
		// removes spaces in the beginning and at the end. Also removes new line characters, extra spaces and tabs in the description string.
		return sText.replace(/\s+/g, " ").trim();
	},
	_handleItemRemoved: function(oEvent) {

		//Successful request processing - navigate back to list on phone
		if (sap.ui.Device.system.phone && !this.getView().getParent().getParent().isMasterShown()) {

			if (!this.stayOnDetailScreen) {
				this.oRouter.navTo("master", {}, sap.ui.Device.system.phone);
				// after overwriting the history state that points to the
				// item which is not available any more, we can step back because
				// the previos history state is also the master list
				window.history.back();
			} else {
				var oRefreshData = {
					sCtxPath: this.getView().getBindingContext().getPath(),
					sInstanceID: this.oModel2.getData().InstanceID,
					sSAP__Origin: this.oModel2.getData().SAP__Origin,
					bCommentCreated: true
				};
				this.refreshData(oRefreshData);
				this.stayOnDetailScreen = false;
			}
		}
	},
	_handleDetailRefresh: function(oEvent) {
		var bIsTableViewActive = oEvent.getParameter('bIsTableViewActive');
		var oView = this.getView();
		if (bIsTableViewActive) {
			var oItem = jQuery.extend(true, {}, oView.getModel().getData(this.oContext.getPath(), this.oContext));
			var sAction = oEvent.getParameter('sAction');
			var sStatus = oEvent.getParameter('sStatus');
			if (oItem.Status === 'COMPLETED' || oItem.Status === 'FOR_RESUBMISSION' || ((sAction && sAction === "FORWARD") && (sStatus && sStatus ===
					"Success"))) {
				this.fnNavBackToTableVw();
			} else {
				this._updateDetailModel(oItem, true);
				var aDecisionOptions = this.oDataManager.getDataFromCache("DecisionOptions", oItem);
				aDecisionOptions = aDecisionOptions ? aDecisionOptions : [];
				var oUIExecutionLink = this.oDataManager.getDataFromCache("UIExecutionLink", oItem);
				oUIExecutionLink = oUIExecutionLink ? oUIExecutionLink : {};
				var bIsUIExecutionLinkSupported = oItem.TaskSupports.UIExecutionLink;
				oUIExecutionLink = bIsUIExecutionLinkSupported ? oUIExecutionLink : {};
				this.createDecisionButtons(aDecisionOptions, oUIExecutionLink, this.oModel2.getData().SAP__Origin);
				//this.fnCountUpdater("ProcessingLogs", this.oModel2.getData().SAP__Origin, this.oModel2.getData().InstanceID); //Fix Int Incident 1670342234	
			}
		} else {
			var oRefreshData = {
				sCtxPath: this.getView().getBindingContext().getPath(),
				sInstanceID: this.oModel2.getData().InstanceID,
				sSAP__Origin: this.oModel2.getData().SAP__Origin,
				bCommentCreated: true
			};
			this.refreshData(oRefreshData);
		}
		//this.stayOnDetailScreen = false;
	},
	_updateHeaderTitle: function(oData) {

		//-- update header
		if (oData) {
			var oComponentData = this.getOwnerComponent().getComponentData();
			// object header fiori 2.0				
			this.oHeaderFooterOptions = jQuery.extend(this.oHeaderFooterOptions, {
				sDetailTitle: oData.TaskDefinitionName ? oData.TaskDefinitionName : this.i18nBundle.getText("ITEM_DETAIL_DISPLAY_NAME")
			});
			this.refreshHeaderFooterOptions();
		}
	},
	_isTaskConfirmable: function(oItem) {
		//    	if (oItem.TaskSupports.Confirm)
		if (oItem.Status == 'EXECUTED') {
			return true;
		} else {
			return false;
		}
	},
	createDecisionButtons: function(aDecisionOptions, oUIExecutionLink, sOrigin) {
		var oPositiveAction = null;
		var oNegativeAction = null;
		var aButtonList = [];

		var that = this;

		var oItem = this.oModel2.getData(),
		oActionHelper = that._getActionHelper();
			
		if (!this.switchToOutbox()) {
			if (!this._isTaskConfirmable(oItem)) {
				for (var i = 0; i < aDecisionOptions.length; i++) {
					var oDecisionOption = aDecisionOptions[i];
					oDecisionOption.InstanceID = oItem.InstanceID;
					oDecisionOption.SAP__Origin = sOrigin;
					aButtonList.push({
						nature: oDecisionOption.Nature, 
						sBtnTxt: oDecisionOption.DecisionText,
						onBtnPressed: (function(oDecision) {
							return function() {
								that.showDecisionDialog(that.oDataManager.FUNCTION_IMPORT_DECISION, oDecision, true);
							};
						})(oDecisionOption)
					});
				}
			} else {
				// add the confirm button
				oPositiveAction = {
					sI18nBtnTxt: "XBUT_CONFIRM",
					onBtnPressed: (function(oDecision) {
						return function() {
							that.showConfirmationDialog(that.oDataManager.FUNCTION_IMPORT_CONFIRM, oItem);
						};
					})(oItem)
				};
			}
			
			//add the log button
			if ((!that.bNavToFullScreenFromLog) && (oItem.TaskSupports.ProcessingLogs || oItem.TaskSupports.WorkflowLog) && that.oDataManager.getShowLogEnabled()) {
				aButtonList.push({
					sI18nBtnTxt: that.bShowLogs ? "XBUT_HIDELOG" : "XBUT_SHOWLOG",
					onBtnPressed: jQuery.proxy(this.onLogBtnPress, this)
				});
			}
			
			// add the claim button
			if (that.fnFormatterSupportsProperty(oItem.TaskSupports.Claim, oItem.SupportsClaim)) {
				// add the claim button to the end
				aButtonList.push({
					sI18nBtnTxt: "XBUT_CLAIM",
					onBtnPressed: function(oEvent) {
						if (sap.ui.Device.system.phone) {
							that.stayOnDetailScreen = true;
						}
						that.sendAction("Claim", oItem, null);
					}
				});
			}

			// add the release button
			if (that.fnFormatterSupportsProperty(oItem.TaskSupports.Release, oItem.SupportsRelease)) {
				// add the release button to the end
				aButtonList.push({
					sI18nBtnTxt: "XBUT_RELEASE",
					onBtnPressed: function(oEvent) {
						if (sap.ui.Device.system.phone) {
							that.stayOnDetailScreen = true;
						}
						that.sendAction("Release", oItem, null);
					}
				});
			}

			// add the forward button 
			if (that.fnFormatterSupportsProperty(oItem.TaskSupports.Forward, oItem.SupportsForward)) {
				aButtonList.push({
					sI18nBtnTxt: "XBUT_FORWARD",
					onBtnPressed: jQuery.proxy(this.onForwardPopUp, this)
				});
			}

			// add the resubmit button 
			if (oItem.TaskSupports) { // If task does not support TaskSupports
				if (oItem.TaskSupports.Resubmit) {
					aButtonList.push({
						sI18nBtnTxt: "XBUT_RESUBMIT",
						onBtnPressed: jQuery.proxy(this.showResubmitPopUp, this)
					});
				}

			}

			var oParsedParams = this._getParsedParamsForIntent(oUIExecutionLink.GUI_Link);
			var xNavService = this._getCrossNavigationService();
			if (oParsedParams && xNavService) {
				var aIntents = this._getIntentParam(oParsedParams);
				xNavService.isNavigationSupported(aIntents).done(
					function(aResponses) {
						var supportedOpenMode = that._getSupportedOpenMode(aResponses);
						//Display Open Task button if 
						//- intent is supported with valid openMode OR openMode is not maintained at all
						//- button display is allowed (only for openMode 'external' and 'replaceDetails')
						//- openMode is not configured
						if (oActionHelper.isOpenTaskEnabled(oItem, (supportedOpenMode === "embedIntoDetails" || supportedOpenMode === "genericEmbedIntoDetails"))) {
							aButtonList.push({
								sI18nBtnTxt: "XBUT_OPEN",
								onBtnPressed: function(oEvent) {
									that.checkStatusAndOpenTaskUI();
								}
							});
							that.refreshHeaderFooterOptions();
						}
					}
				).fail(function() {
					jQuery.sap.log.error("Error while creating open task buttons");
				});
			} else {
				if (!that.oDataManager.isUIExecnLinkNavProp() && oItem.GUI_Link && oActionHelper.isOpenTaskEnabled(oItem, false)) {
					aButtonList.push({
						sI18nBtnTxt: "XBUT_OPEN",
						onBtnPressed: function(oEvent) {
							that.checkStatusAndOpenTaskUI();
						}
					});
				} else {
					if (oItem.TaskSupports.UIExecutionLink && oItem.UIExecutionLink && oItem.UIExecutionLink.GUI_Link && oActionHelper.isOpenTaskEnabled(oItem, false)) {
						aButtonList.push({
							sI18nBtnTxt: "XBUT_OPEN",
							onBtnPressed: function(oEvent) {
								that.checkStatusAndOpenTaskUI();
							}
						});
					}
				}
			}

			//add calendar integration button if supported
			if (window.plugins && window.plugins.calendar) {
				var oData = this.oModel2.getData();
				var oDeadLine = oData.CompletionDeadLine;
				if (oDeadLine) {
					var fnAddReminderWithCheck = function(deadline) {
						if (deadline < new Date()) {
							this.oConfirmationDialogManager.showDecisionDialog({
								question: this.i18nBundle.getText("dialog.warning.mq.CalendarEventInThePast"),
								title: this.i18nBundle.getText("dialog.warning.mq.CalendarEventInThePast.title"),
								confirmButtonLabel: this.i18nBundle.getText("XBUT_OK"),
								noteMandatory: false,
								confirmActionHandler: jQuery.proxy(this.createCalendarEvent, this)
							});
						} else {
							this.createCalendarEvent();
						}
						// Display confirmation dialog for reminder in the past
					};
					aButtonList.push({
						sI18nBtnTxt: "XBUT_CALENDAR",
						onBtnPressed: jQuery.proxy(fnAddReminderWithCheck, this, oDeadLine)
					});
				}
			}
		} else {
			//Outbox buttons:

			//add the log button
			if ((!that.bNavToFullScreenFromLog) && (oItem.TaskSupports.ProcessingLogs || oItem.TaskSupports.WorkflowLog) && that.oDataManager.getShowLogEnabled()) {
				aButtonList.push({
					sI18nBtnTxt: that.bShowLogs ? "XBUT_HIDELOG" : "XBUT_SHOWLOG",
					onBtnPressed: jQuery.proxy(this.onLogBtnPress, this)
				});
			}

			//add the resume button if the task is suspended
			if (oItem.TaskSupports.CancelResubmission) {
				aButtonList.push({
					sI18nBtnTxt: "XBUT_RESUME",
					onBtnPressed: function(oEvent) {
						that.sendAction("CancelResubmission", oItem, null);
					}
				});
			}
		}

		var oButtonList = {};
		oButtonList.oPositiveAction = oPositiveAction;
		oButtonList.oNegativeAction = oNegativeAction;
		oButtonList.aButtonList = aButtonList;
		
		// add email settings and jam share settings
		this.addShareOnJamAndEmail(oButtonList);

		/**
		 * @ControllerHook Modify the footer buttons
		 * This hook method can be used to add and change buttons for the detail view footer
		 * It is called when the decision options for the detail item are fetched successfully
		 * @callback cross.fnd.fiori.inbox.view.S3~extHookChangeFooterButtons
		 * @param {object} oButtonList - contains the positive, negative buttons and the additional button list.
		 * @return {void}
		 */
		if (this.extHookChangeFooterButtons) {
			this.extHookChangeFooterButtons(oButtonList);

			oPositiveAction = oButtonList.oPositiveAction;
			oNegativeAction = oButtonList.oNegativeAction;
			aButtonList = oButtonList.aButtonList;
		}

		this.oHeaderFooterOptions = jQuery.extend(this.oHeaderFooterOptions, {
			oPositiveAction: oPositiveAction,
			oNegativeAction: oNegativeAction,
			buttonList: aButtonList,
			oJamOptions: oButtonList.oJamOptions,
			oEmailSettings: oButtonList.oEmailSettings,
			// remove bookmark button
			bSuppressBookmarkButton: true
		});
		this.refreshHeaderFooterOptions();
	},
	startForwardFilter: function(oListItem, sQuery) {
		sQuery = sQuery.toLowerCase();
		var sFullName = oListItem.getBindingContext().getProperty("DisplayName").toLowerCase();
		var sDepartment = oListItem.getBindingContext().getProperty("Department").toLowerCase();

		return (sFullName.indexOf(sQuery) != -1) ||
			(sDepartment.indexOf(sQuery) != -1);
	},
	closeForwardPopUp: function(oResult) {
		if (oResult && oResult.bConfirmed) {
			var oItem = this.oModel2.getData();
			var sOrigin = oItem.SAP__Origin;
			var sInstanceID = oItem.InstanceID;

			this.oDataManager.doForward(sOrigin, sInstanceID,
				oResult.oAgentToBeForwarded.UniqueName, oResult.sNote, jQuery.proxy(function() {
					sap.ca.ui.message.showMessageToast(this.i18nBundle.getText("dialog.success.forward", oResult.oAgentToBeForwarded.DisplayName));
				}, this));
		}
	},
	onForwardPopUp: function() {
		var oItem = this.oModel2.getData();
		var sOrigin = oItem.SAP__Origin;
		var sInstanceID = oItem.InstanceID;

		//Number of items parameter is omitted here - S3 contains a single item.
		if(this.oDataManager.userSearch){
			cross.fnd.fiori.inbox.util.Forward.open(
				jQuery.proxy(this.startForwardFilter, this),
				jQuery.proxy(this.closeForwardPopUp, this)
			);
			
			var bHasPotentialOwners = cross.fnd.fiori.inbox.Conversions.formatterTaskSupportsValue(oItem.TaskSupports.PotentialOwners, oItem.HasPotentialOwners);
			if (bHasPotentialOwners) {
				this.oDataManager.readPotentialOwners(sOrigin, sInstanceID,
					jQuery.proxy(this._PotentialOwnersSuccess, this));
			} else {
				this._PotentialOwnersSuccess({
					results: []
				});
			}
		}
		else{
			cross.fnd.fiori.inbox.util.ForwardSimple.open(jQuery.proxy(this.closeForwardPopUp, this));
		}
	},
	_getSupportedOpenMode: function(aResponses) {
		// If all responses are "true" this might mean either that all open modes are configured in different catalogs
		// or none of them is set anywhere. Regardless of this an open mode is supported only if there is exactly ONE open mode set:
		var supportedModes = [];
		for(var i = 0; i < aResponses.length; i++) {
			if(aResponses[i].supported) {
				supportedModes.push(this.OPEN_MODES[i]);
			}
		}
		return (supportedModes.length === 1) ? supportedModes[0] : null;
	},
	_getParsedParamsForIntent: function(sURL) {
		var oParsedParams = null;
		this.oURLParsingService = this.oURLParsingService || sap.ushell && sap.ushell.Container && sap.ushell.Container.getService && sap.ushell
			.Container.getService("URLParsing");
		if (this.oURLParsingService && this.oURLParsingService.isIntentUrl(sURL)) {
			oParsedParams = this.oURLParsingService.parseShellHash(sURL);
		}
		return oParsedParams;
	},
	_getCrossNavigationService: function() {
		if(!this.oCrossNavigationService) {
			if(sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				this.oCrossNavigationService = sap.ushell.Container.getService("CrossApplicationNavigation");
			}
		}
		return this.oCrossNavigationService;
	},
	_PotentialOwnersSuccess: function(oResult) {
		cross.fnd.fiori.inbox.util.Forward.setAgents(oResult.results);
		cross.fnd.fiori.inbox.util.Forward.setOrigin(this.oModel2.getData().SAP__Origin);
	},
	showResubmitPopUp: function() {
		cross.fnd.fiori.inbox.util.Resubmit.open(
			this.sResubmitUniqueId,
			this,
			this.getView()
		);
	},
	handleResubmitPopOverOk: function(oEvent) {
		var oItem = this.oModel2.getData();
		var sOrigin = oItem.SAP__Origin;
		var sInstanceID = oItem.InstanceID;
		var oCalendar = sap.ui.core.Fragment.byId(this.sResubmitUniqueId, "DATE_RESUBMIT");
		var aSelectedDates = oCalendar.getSelectedDates();
		if (aSelectedDates.length > 0) {
			var oDate = aSelectedDates[0].getStartDate();
			var oFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "YYYY-MM-ddTHH:mm:ss"
			});
			this.oDataManager.doResubmit(sOrigin, sInstanceID, "datetime'" + oFormat.format(oDate) + "'", jQuery.proxy(function() {
				sap.ca.ui.message.showMessageToast(this.i18nBundle.getText("dialog.success.resubmit"));
			}, this));
			cross.fnd.fiori.inbox.util.Resubmit.close();
		}
	},
	showEmployeeCard: function(sOrigin, sCreatedBy, oSelectedControl) {
		this._setBusyIncdicatorOnDetailControls(this.getView(), true);
		this.oDataManager.readUserInfo(sOrigin, sCreatedBy, jQuery.proxy(function(oResult) {
			this._setBusyIncdicatorOnDetailControls(this.getView(), false);
			cross.fnd.fiori.inbox.util.EmployeeCard.displayEmployeeCard(oSelectedControl, oResult);
		}, this), jQuery.proxy(function(oError) {
			this._setBusyIncdicatorOnDetailControls(this.getView(), false);
		}, this), true);
	},
	onEmployeeLaunchTask: function(oEvent) {
		var oItem = this.oModel2.getData();
		this.showEmployeeCard(oItem.SAP__Origin, oItem.CreatedBy, cross.fnd.fiori.inbox.Conversions.getSelectedControl(oEvent));
	},
	onEmployeeLaunchCommentSender: function(sChannel, sEventName, oEvent) {
		this.showEmployeeCard(this.oModel2.getData().SAP__Origin,
			oEvent.getSource().getBindingContext("detail").getProperty("CreatedBy"),
			cross.fnd.fiori.inbox.Conversions.getSelectedControl(oEvent));
	},
	handleLogNavigation: function(oEvent) {
		var oBindingContext =  oEvent.getSource().getBindingContext("detail");
		var sSAP__Origin = oBindingContext.getProperty("SAP__Origin");
		var sReferenceID = oBindingContext.getProperty("ReferenceInstanceID");
		var sContextPath = "TaskCollection(SAP__Origin='"+sSAP__Origin+"',InstanceID='"+sReferenceID+"')";
		this.bNavToFullScreenFromLog = true;
		var oParameters = {
								SAP__Origin: sSAP__Origin,
								InstanceID: sReferenceID,
								contextPath: sContextPath
							};
		
		//Check if information of navigated task is available in loaded user's task list
		var oView = this.getView();
		this.oContext = new sap.ui.model.Context(oView.getModel(), sContextPath);
		oView.setBindingContext(this.oContext);
		var oItem = jQuery.extend(true, {}, oView.getModel().getData(this.oContext.getPath(), this.oContext));
		if (jQuery.isEmptyObject(oItem)) {
			//Load task information as task is viewed by navigating from Workflow Log and is not part of user's current inbox list
			var that = this;
			var oDataManager = sap.ca.scfld.md.app.Application.getImpl().getComponent().getDataManager();
			oDataManager.oDataRead("/TaskCollection(SAP__Origin='" + sSAP__Origin +
					"',InstanceID='" + sReferenceID + "')", null,
					function(oDetailData) {
						if (oDetailData !== undefined && !jQuery.isEmptyObject(oDetailData)) {
							//Perform routing
							that.oRouter.navTo("detail_deep", oParameters, false);
						}
					},
					function(oError) {
						jQuery.sap.log.error(oError);
						return;
					}
			);
		} else {
			//Perform routing
			this.oRouter.navTo("detail_deep", oParameters, false);
		}
	},
	onEmployeeLaunchCommentIcon: function(oEvent) {
		// Business card on Notes
		var sOrigin = oEvent.getSource().getBindingContext().getProperty("SAP__Origin");
		var sCreatedBy = oEvent.getSource().getBindingContext("detail").getModel().getProperty(oEvent.getSource().getBindingContext("detail").getPath())
			.CreatedBy;
		if (!sOrigin) {
			//Deep link scenario
			var oItem = this.oModel2.getData();
			sOrigin = oItem.SAP__Origin;
		}
		this.showEmployeeCard(sOrigin, sCreatedBy, cross.fnd.fiori.inbox.Conversions.getSelectedControl(oEvent));
	},
	onAttachmentShow: function(oEvent) {
		var oContext = oEvent.getSource().getBindingContext("detail");
		var sMediaSrc = cross.fnd.fiori.inbox.attachment.getRelativeMediaSrc(oContext.getProperty().__metadata.media_src);
		sap.m.URLHelper.redirect(sMediaSrc, true);
	},
	showDecisionDialog: function(sFunctionImportName, oDecision, bShowNote) {
		this.oConfirmationDialogManager.showDecisionDialog({
			question: this.i18nBundle.getText("XMSG_DECISION_QUESTION", oDecision.DecisionText),
			showNote: bShowNote,
			title: this.i18nBundle.getText("XTIT_SUBMIT_DECISION"),
			confirmButtonLabel: this.i18nBundle.getText("XBUT_SUBMIT"),
			noteMandatory: oDecision.CommentMandatory,
			confirmActionHandler: jQuery.proxy(function(oDecision, sNote) {
					this.sendAction(sFunctionImportName, oDecision, sNote);
				},
				this, oDecision)
		});
	},
	fnOnNavBackFromLogDescription: function(oEvent) {
		this.bNavToFullScreenFromLog = false;
		this.setShowMainContent();
		window.history.back();
	},
	
	showConfirmationDialog: function(sFunctionImportName, oItem) {
		this.oConfirmationDialogManager.showDecisionDialog({
			question: this.i18nBundle.getText("XMSG_CONFIRM_QUESTION"),
			showNote: false,
			title: this.i18nBundle.getText("XTIT_SUBMIT_CONFIRM"),
			confirmButtonLabel: this.i18nBundle.getText("XBUT_CONFIRM"),
			confirmActionHandler: jQuery.proxy(function(oItem, sNote) {
					this.sendAction(sFunctionImportName, oItem, sNote);
				},
				this, oItem)
		});
	},
	// executed when the event CommentAdded is fired from the Comment Component
	onCommentPost: function(sChannel, sEventName, oEvent) {
		var sComment = oEvent.getParameter("value");
		if (sComment && sComment.length > 0) {
			this.sendAction('AddComment', null, sComment);
		}
	},
	sendAction: function(sFunctionImportName, oDecision, sNote) {
		var that = this;
		var sSuccessMessage;

		switch (sFunctionImportName) {
			case "Release":
				sSuccessMessage = "dialog.success.release";
				break;
			case "Claim":
				sSuccessMessage = "dialog.success.reserve";
				break;
			case "AddComment":
				sSuccessMessage = "dialog.success.addComment";
				break;
			case "Confirm":
				sSuccessMessage = "dialog.success.completed";
				break;
			case "CancelResubmission":
				sSuccessMessage = "dialog.success.cancelResubmission";
				break;
			default:
				sSuccessMessage = "dialog.success.complete";
		}

		switch (sFunctionImportName) {
			case 'AddComment':
				{
					var oItem = this.oModel2.getData();
					var oCommentsControl = this._getIconTabControl("Comments");
					this._setBusyIncdicatorOnDetailControls(oCommentsControl, true);
					this.oDataManager.addComment(oItem.SAP__Origin, oItem.InstanceID, sNote, jQuery.proxy(function(data, response) {

						// update the comments data and comments count 
						if (oItem.Comments && oItem.Comments.results) {
							oItem.Comments.results.push(data);
						} else {
							oItem.Comments = {
								results: [data]
							};
						}
						oItem.CommentsCount = oItem.Comments.results.length;
						this._setBusyIncdicatorOnDetailControls(oCommentsControl, false);
						this._updateDetailModel(oItem);
						
						jQuery.sap.delayedCall(500, this, function() {
							sap.ca.ui.message.showMessageToast(this.i18nBundle.getText(sSuccessMessage));
						});

						// update the counter on history tab
						//this.fnCountUpdater("ProcessingLogs", oItem.SAP__Origin, oItem.InstanceID);

					}, this), jQuery.proxy(function(oError) {
						this._setBusyIncdicatorOnDetailControls(oCommentsControl, false);
					}, this));

					break;
				}
			default:
				{
					this.oDataManager.sendAction(sFunctionImportName, oDecision, sNote,
						jQuery.proxy(function(oData) {
							jQuery.sap.delayedCall(500, this, function() {
								sap.ca.ui.message.showMessageToast(this.i18nBundle.getText(sSuccessMessage));
							});
						}, this, oDecision)
					);
				}
		}
	},
	refreshHeaderFooterOptions: function() {
		this._oHeaderFooterOptions = jQuery.extend(this._oHeaderFooterOptions, this.oHeaderFooterOptions);
		this.setHeaderFooterOptions(this._oHeaderFooterOptions);
	},
	
	// nav back button pressed from table view's detail view
	fnNavBackToTableVw: function() {
		sap.ca.scfld.md.app.Application.getImpl().getComponent()
			.getEventBus().publish("cross.fnd.fiori.inbox", "refreshTask", {
				"contextPath": this.sCtxPath
			});
		this.oRouter.navTo("table_view", {}, true);
	},
	
	//nav button pressed from split-view's detail view in mobile
	fnOnNavBackInMobile: function(){
		this.oRouter.navTo("master", {}, true);
	},
	
	checkStatusAndOpenTaskUI: function() {
		var oTaskData = this.oModel2.getData();
		this.oDataManager.checkStatusAndOpenTask(oTaskData.SAP__Origin, oTaskData.InstanceID, jQuery.proxy(this.openTaskUI, this));
	},
	/*
	 check if the task has an intent configured to open another app either in embed or external mode
	 if yes, then open it in the respective mode
	 if no, open task in the default way
	 */
	openTaskUI: function() {
		var oTaskData = this.oModel2.getData();
		var oActionHelper = this._getActionHelper();
		var sKey = oTaskData.SAP__Origin + "_" + oTaskData.InstanceID;
		var oIntentParams = this.oEmbedModeIntentParams ? this.oEmbedModeIntentParams[sKey] : null;
		if (oIntentParams) { //open app now
			this.fnNavigateToApp(oIntentParams, oIntentParams.OpenInEmbedMode);
		} else {
			var oDataManager = sap.ca.scfld.md.app.Application.getImpl().getComponent().getDataManager();
			oActionHelper.fnValidateOpenTaskURLAndRedirect(this.oModel2.getData().GUI_Link || this.oModel2.getData().UIExecutionLink.GUI_Link, oDataManager.isForwardUserSettings());
		}
	},
	fnEmbedApplicationInDetailView: function(oParsedParams) {
		var sNavigationIntent = "#" + oParsedParams.semanticObject + "-" + oParsedParams.action;
		var oIntentModel = new sap.ui.model.json.JSONModel({
			NavigationIntent: sNavigationIntent,
			params: oParsedParams.params
		});
		this.getOwnerComponent().setModel(oIntentModel, "intentModel");
		var oParameters = {
			SAP__Origin: this.oRoutingParameters.SAP__Origin,
			InstanceID: this.oRoutingParameters.InstanceID,
			contextPath: this.oRoutingParameters.contextPath
		};
		this.oRouter.navTo("replace_detail", oParameters, true);
	},
	
	//Toggle current breakpoint for Dynamic Side Content - required for mobile
	updateToggleButtonState: function(oEvent) {		
		this.sCurrentBreakpoint = oEvent.getParameter("currentBreakpoint");		
		this.setShowMainContent();
	},

	//Event handler for the log btn
	onLogBtnPress: function(oEvent) {
		var oTaskBtn = oEvent.getSource();
		this.bShowLogs = false;
		if(oTaskBtn.getText() === this.i18nBundle.getText("XBUT_SHOWLOG")) {
			//Show side content and logs, modify button tooltip, show/hide segmented button based on TaskSupports data
			oTaskBtn.setText(this.i18nBundle.getText("XBUT_HIDELOG"));
			this.bShowLogs = true;
			this.createLogs();
			this.setShowSideContent(true);
		} else {
			//Hide side content and modify button tooltip
			oTaskBtn.setText(this.i18nBundle.getText("XBUT_SHOWLOG"));
			this.setShowSideContent(false);
		}
		this.setShowMainContent();
		
	},
	
	//Show or hide main content in case of phone
	setShowMainContent: function() {
		var oDynamicSideContent = this.byId("DynamicSideContent");
		if (oDynamicSideContent) {
			if (this.sCurrentBreakpoint === 'S' && this.bShowLogs && !this.bNavToFullScreenFromLog 
						&& this.oModel2 && this.oModel2.getData()) {
				var sTaskSupports = this.oModel2.getData().TaskSupports;
				if (sTaskSupports && (sTaskSupports.WorkflowLog || sTaskSupports.ProcessingLogs)) {
					oDynamicSideContent.setShowMainContent(false);
				} else {
					oDynamicSideContent.setShowMainContent(true);
				}
			} else {
				oDynamicSideContent.setShowMainContent(true);
			}
		}
	},
	
	//Show or hide side content
	setShowSideContent: function(sEnable) {
		var oDynamicSideContent = this.byId("DynamicSideContent");
		if (oDynamicSideContent) {
			oDynamicSideContent.setShowSideContent(sEnable);
		}
	},
	
	//Create the task history / workflow log for the selected task
	createLogs: function(sKey) {
		var sLogKey = sKey;
		var oIconTabBar = this.byId("tabBarLogs");
		var oItem = this.oModel2.getData();
		//If input parameter key is empty, get from tab selected key provided both tabs are supported, else get based on task supports
		if (!sLogKey && oItem.TaskSupports) {
			if (oItem.TaskSupports.ProcessingLogs && oItem.TaskSupports.WorkflowLog && oIconTabBar) {
				sLogKey = oIconTabBar.getSelectedKey();
			} else if (oItem.TaskSupports.WorkflowLog) {
				sLogKey = "WORKFLOWLOG";
			} else if (oItem.TaskSupports.ProcessingLogs) {
				sLogKey = "TASKLOG";
			}
		}
		switch (sLogKey) {
			case "TASKLOG":
				this.createTimeLine();
				this.fnHandleNoTextCreation("ProcessingLogs");
				this.fnFetchDataOnLogTabSelect("ProcessingLogs");
				this._getIconTabControl("ProcessingLogs").setGrowingThreshold(10);
				break;
				
			case "WORKFLOWLOG":
				this.createWorkflowLogTimeLine();
				this.fnHandleNoTextCreation("WorkflowLogs");
				this.fnFetchDataOnLogTabSelect("WorkflowLogs");
				this._getIconTabControl("WorkflowLogs").setGrowingThreshold(10);
				break;
		}
	},
	
	//Create timeline entries for Workflow Log
	createWorkflowLogTimeLine: function() {
		var that = this;
		var oTimeline = that._getIconTabControl("WorkflowLogs");
		if (oTimeline) {
			var oTimelineItemTemplate = new sap.suite.ui.commons.TimelineItem({
				icon: {
					parts: [{
						path: "detail>Status"
					}, {
						path: "detail>ResultType"
					}],
					formatter: cross.fnd.fiori.inbox.Conversions.formatterWorkflowLogStatusIcon
				},
				userName: {
					parts: [{
						path: "detail>PerformedByName"
					}, {
						path: "detail>Status"
					}],
					formatter: cross.fnd.fiori.inbox.Conversions.formatterWorkflowLogStatusUsername
				},
				userNameClickable: true,
				userPicture: {
					parts: [{
						path: "detail>SAP__Origin"
					}, {
						path: "detail>PerformedByName"
					}],
					formatter: cross.fnd.fiori.inbox.Conversions.formatterWorkflowLogUserPicture
				},
				title: {
					path: "detail>Status",
					formatter: cross.fnd.fiori.inbox.Conversions.formatterWorkflowLogStatusText
				},
				dateTime:"{detail>Timestamp}",
				embeddedControl: new sap.m.VBox({
					items: [
						new sap.m.ObjectAttribute({
							text: "{detail>Description}",
							active: "{detail>SupportsNavigation}",
							press: jQuery.proxy(this.handleLogNavigation, this)
						}),
						new sap.m.ObjectStatus({
							text: "{detail>Result}",
							state: { 
								path: "detail>ResultType",
								formatter: cross.fnd.fiori.inbox.Conversions.formatterWorkflowLogResultState
							}
						})
					]
				})
			});
			oTimelineItemTemplate.attachUserNameClicked(function(oEvent) { 		
					var oBindingContext = oEvent.getSource().getBindingContext("detail");		
		  			that.showEmployeeCard(oBindingContext.getProperty("SAP__Origin"), oBindingContext.getProperty("PerformedBy")		
		  				, cross.fnd.fiori.inbox.Conversions.getSelectedControl(oEvent));		
			});
			oTimeline.bindAggregation("content", {
				path: "detail>/WorkflowLogs/results",
				template: oTimelineItemTemplate
			});
		}
	},
	
	onLogTabSelect: function(oControlEvent) {
		var sSelectedKey = oControlEvent.getParameters().selectedKey;
		this.createLogs(sSelectedKey);
	},
	
	fnFetchDataOnLogTabSelect: function(sNavProperty) {

		var oParameters = null;
		if (sNavProperty === "ProcessingLogs") {
			oParameters = {
				$orderby: "OrderID desc"
			};
		}
		var sPath = this.sCtxPath + "/" + sNavProperty;
		var oTabControl = this._getIconTabControl(sNavProperty);
		this._setBusyIncdicatorOnDetailControls(oTabControl, true);

		// success handler of read data request
		var fnSuccess = function(data) {
			var oModelData = this.oModel2.getData();
			var bDataPresent = (oModelData[sNavProperty] && oModelData[sNavProperty].results) ? true : false;
			// if data is already present in the model, merge the new response with existing data
			this.fnUpdateDataAfterFetchComplete(oModelData, bDataPresent, sNavProperty, data);
			this._setBusyIncdicatorOnDetailControls(oTabControl, false);
			//Set proper text in case no log data exist 
			if(data.results.length === 0) {
				var oTimeline = this._getIconTabControl(sNavProperty);
				var i18nTextKey;
				if (sNavProperty === "ProcessingLogs") {
					i18nTextKey = "view.ProcessLogs.noData";
				} else if (sNavProperty === "WorkflowLogs") {
					i18nTextKey = "view.WorkflowLogs.noData";
				}
				oTimeline.setNoDataText(this.i18nBundle.getText(i18nTextKey));
			}
		};

		// error handler for read request
		var fnError = function(oError) {
			this._setBusyIncdicatorOnDetailControls(oTabControl, false);
			this.oDataManager.oDataRequestFailed(oError);
		};

		// send the request to fetch data for selected tab
		this.oDataManager.oDataRead(sPath, oParameters, jQuery.proxy(fnSuccess, this), jQuery.proxy(fnError, this));

	},
	
	onTabSelect: function(oControlEvent) {
		var sSelectedTab = oControlEvent.getParameters().selectedKey;

		switch (sSelectedTab) {
			case "NOTES":
				this.fnDelegateCommentsCreation();
				this.fnFetchDataOnTabSelect("Comments");
				this.fnSetIconForCommentsFeedInput();
				this.fnHandleNoTextCreation("Comments");
				break;

			case "ATTACHMENTS":
				this.fnDelegateAttachmentsCreation();
				this.fnFetchDataOnTabSelect("Attachments");
				this.fnHandleNoTextCreation("Attachments");
				break;

			case "OBJECTLINKS":
				var oModelData = this.oModel2 ? this.oModel2.getData() : "";
				if (oModelData.TaskSupports.TaskObject === true) {
					this.fnFetchObjectLinks();
				}
				break;
		}
	},
	fnDelegateCommentsCreation: function() {
		if (this.isGenericComponentRendered) {
			return;
		}
		var oItemData = this.oModel2.getData();
		if (this.getView().byId("commentsContainer") &&
			this.fnFormatterSupportsProperty(oItemData.TaskSupports.Comments, oItemData.SupportsComments)) {
			this.createGenericCommentsComponent(this.getView());
		}
	},
	fnDelegateAttachmentsCreation: function() {
		var oItemData = this.oModel2.getData();
		if (this.getView().byId("attachmentComponent") &&
			this.fnFormatterSupportsProperty(oItemData.TaskSupports.Attachments, oItemData.SupportsAttachments)) {
			this.createGenericAttachmentComponent(this.getView());
		}
	},
	createTimeLine: function() {
		/*jQuery.sap.require("sap.suite.ui.commons.Timeline");
		 jQuery.sap.require("sap.suite.ui.commons.TimelineItem");*/
		var oTimeline = this.byId("timeline");
		if (oTimeline) {
			oTimeline.setSort(false);
			var oTimelineItemTemplate = new sap.suite.ui.commons.TimelineItem({
				icon: {
					path: "detail>ActionName",
					formatter: cross.fnd.fiori.inbox.Conversions.formatterActionIcon
				},
				userName: {
					parts: [{
						path: "detail>PerformedByName"
					}, {
						path: "detail>ActionName"
					}],
					formatter: cross.fnd.fiori.inbox.Conversions.formatterActionUsername
				},
				title: {
					path: "detail>ActionName",
					formatter: cross.fnd.fiori.inbox.Conversions.formatterActionText
				},
				dateTime: "{detail>Timestamp}"
			});
			oTimeline.bindAggregation("content", {
				path: "detail>/ProcessingLogs/results",
				template: oTimelineItemTemplate
			});
		}
	},
	// TODO move this to the comments component
	fnSetIconForCommentsFeedInput: function() {
		if (this.oGenericCommentsComponent && this.oGenericCommentsComponent.fnIsFeedInputPresent() && !this.oGenericCommentsComponent.fnGetFeedInputIcon()) {
			if (sap.ushell.Container != undefined) {
				var sSAP__Origin = this.oModel2.getData().SAP__Origin;
				var sUserId = sap.ushell.Container.getUser().getId();
				// TODO write all the code related to user pictures at one single place
				this.oDataManager.getCurrentUserImage(sSAP__Origin, sUserId, jQuery.proxy(this.oGenericCommentsComponent.fnSetFeedInputIcon, this.oGenericCommentsComponent));
			}
		}

	},
	/* Updates the count in the model */
	fnCountUpdater: function(sKey, sSAP__Origin, sInstanceID) {
		var that = this;		
		var oItemData = this.oModel2.getData();
		switch (sKey) {
			case "Attachments":
				if (that.fnFormatterSupportsProperty(oItemData.TaskSupports.Attachments, oItemData.SupportsAttachments)) {
					this.oDataManager.fnGetCount(sSAP__Origin, sInstanceID, function(sNumberOFAttachments) {
						that.oModel2.setProperty("/AttachmentsCount", sNumberOFAttachments);
					}, "Attachments");
				}
				break;
			case "Comments":
				if (that.fnFormatterSupportsProperty(oItemData.TaskSupports.Comments, oItemData.SupportsComments)) {
					this.oDataManager.fnGetCount(sSAP__Origin, sInstanceID, function(sNumberOFComments) {
						that.oModel2.setProperty("/CommentsCount", sNumberOFComments);
					}, "Comments");
				}
				break;
			/*case "ProcessingLogs":
				if (oItemData.TaskSupports.ProcessingLogs && !that.isGenericComponentRendered) {
					this.oDataManager.fnGetCount(sSAP__Origin, sInstanceID, function(sNumberOfLogs) {
						that.oModel2.setProperty("/ProcessingLogsCount", sNumberOfLogs);
						that.fnHandleNoTextCreation("ProcessingLogs");
					}, "ProcessingLogs");
				}
				break;*/
			case "ObjectLinks":
				if (oItemData.TaskSupports.TaskObject && that.oDataManager.bShowTaskObjects) {
					this.oDataManager.fnGetCount(sSAP__Origin, sInstanceID, function(sNumberOfLinks) {
						that.oModel2.setProperty("/ObjectLinksCount", sNumberOfLinks);
						that.fnHandleNoTextCreation("ObjectLinks");
					}, "TaskObjects");
				}
				break;
		}
	},
	fnHandleNoTextCreation: function(sEntity) {
		var oModelData = this.oModel2.getData();

		switch (sEntity) {
			case "Comments":
				if(this.oGenericCommentsComponent) {
					if (oModelData.hasOwnProperty("CommentsCount") && oModelData.CommentsCount > 0) {
						this.oGenericCommentsComponent.setNoDataText(this.i18nBundle.getText("XMSG_LOADING"));
					} else if (oModelData.hasOwnProperty("CommentsCount") && oModelData.CommentsCount == 0) {
						this.oGenericCommentsComponent.setNoDataText(this.i18nBundle.getText("view.CreateComment.noComments"));
					}
				}
				break;
			case "Attachments":
				var oGenericUploadControl = this._getUploadCollectionControl();
				if (oGenericUploadControl) {
					if (oModelData.hasOwnProperty("AttachmentsCount") && oModelData.AttachmentsCount > 0) {
						oGenericUploadControl.setNoDataText(this.i18nBundle.getText("XMSG_LOADING"));
					} else if (oModelData.hasOwnProperty("AttachmentsCount") && oModelData.AttachmentsCount == 0) {
						oGenericUploadControl.setNoDataText(this.i18nBundle.getText("view.Attachments.noAttachments"));
					}
				}
				break;
			case "ProcessingLogs":
				var oTaskLogTab = this._getIconTabControl("ProcessingLogs");
				oTaskLogTab.setNoDataText(this.i18nBundle.getText("XMSG_LOADING"));
				break;
			case "WorkflowLogs":
				var oWorkflowLogTab = this._getIconTabControl("WorkflowLogs");
				oWorkflowLogTab.setNoDataText(this.i18nBundle.getText("XMSG_LOADING"));
				break;
			case "ObjectLinks":
				var oObjectLinksTab = this.byId("MIBObjectLinksList");
				if (oModelData.ObjectLinksCount && oModelData.ObjectLinksCount > 0) {
					oObjectLinksTab.setNoDataText(this.i18nBundle.getText("XMSG_LOADING"));
				} else if (oModelData.ObjectLinksCount && oModelData.ObjectLinksCount == 0) {
					oObjectLinksTab.setNoDataText(this.i18nBundle.getText("view.ObjectLinks.noObjectLink"));
				}
				break;
			default:
				break;
		}
	},
	fnClearCachedData: function() {
		this.oModel2.setProperty("/AttachmentsCount", "");
		this.oModel2.setProperty("/CommentsCount", "");
		// this.oModel2.setProperty("/ProcessingLogsCount", "");
		this.oModel2.setProperty("/ObjectLinksCount", "");
		this.oModel2.setProperty("/ProcessingLogs", ""); // to fetch new data on every refresh for processing logs
		this.oModel2.setProperty("/Attachments", ""); // to fetch new attachments on every refresh
		this.oModel2.setProperty("/Comments", ""); // to fetch new comments on every refresh
		this.oModel2.setProperty("/ObjectLinks", ""); // clear data from the model on every task selection
		this.oModel2.setProperty("/StatusText", ""); 
		this.oModel2.setProperty("/WorkflowLogs", ""); // to fetch new data on every refresh for workflow logs
	},
	// Fetch data on select of comments, attachments or history tab. On select of these tabs, update the data.
	fnFetchDataOnTabSelect: function(sNavProperty) {

		var sPath = this.sCtxPath + "/" + sNavProperty;
		var oParameters = null;
		if (sNavProperty === "Attachments" || sNavProperty === "Comments") {
			oParameters = {
				$orderby: "CreatedAt desc"
			};
		}
		var oModelData = this.oModel2.getData();
		var bDataPresent = (oModelData[sNavProperty] && oModelData[sNavProperty].results) ? true : false;
		var oTabControl = this._getIconTabControl(sNavProperty);

		// success handler of read data request
		var fnSuccess = function(data) {
			// if data is already present in the model, merge the new response with existing data
			this.fnUpdateDataAfterFetchComplete(oModelData, bDataPresent, sNavProperty, data);
			this._setBusyIncdicatorOnDetailControls(oTabControl, false);
		};

		// error handler for read request
		var fnError = function(oError) {
			this._setBusyIncdicatorOnDetailControls(oTabControl, false);
			this.oDataManager.oDataRequestFailed(oError);
		};

		// show busy loader only if loading for the first time and count on tab is not 0
		if (!bDataPresent && oModelData[this.oMapCountProperty[sNavProperty]] > 0) {
			this._setBusyIncdicatorOnDetailControls(oTabControl, true);
		}

		// send the request to fetch data for selected tab
		this.oDataManager.oDataRead(sPath, oParameters, jQuery.proxy(fnSuccess, this), jQuery.proxy(fnError, this));

	},
	fnUpdateDataAfterFetchComplete: function(oModelData, bDataPresent, sNavProperty, data) {
		var bAllGone = false;
		if (bDataPresent && data.results.length > 0) {
			jQuery.extend(true, oModelData[sNavProperty], data);
		} else {
			bAllGone = oModelData[sNavProperty].results != null && oModelData[sNavProperty].results.length > 0 && data.results != null && data.results.length === 0;
			oModelData[sNavProperty] = data;
		}
		// update the count on comments tab
		oModelData[this.oMapCountProperty[sNavProperty]] = data.results.length;
		if(bAllGone) {
			this.fnHandleNoTextCreation(sNavProperty);
		}
		this._updateDetailModel(oModelData);
	},
	_getIconTabControl: function(sNavProperty) {
		switch (sNavProperty) {
			case "Comments":
				if(this.oGenericCommentsComponent) {
					return this.oGenericCommentsComponent.getAggregation("rootControl").byId("MIBCommentList");
				}
				return null;
			case "Attachments":
				return this._getUploadCollectionControl();
			case "ProcessingLogs":
				return this.getView().byId("timeline");
			case "WorkflowLogs":
				return this.getView().byId("timelineWorkflowLog");
			case "TaskObjects":
				return this.getView().byId("MIBObjectLinksList");
		}
	},
	fnFetchObjectLinks: function() {
		var iObjectLinkNumber = 0;
		var oTaskObjectsControl = this._getIconTabControl("TaskObjects");
		this._setBusyIncdicatorOnDetailControls(oTaskObjectsControl, true);

		var fnSuccess = function(data) {
			for (var i = 0; i < data.results.length; i++) {
				if (!data.results[i].Label) {
					iObjectLinkNumber = iObjectLinkNumber + 1;
					data.results[i].Label = this.i18nBundle.getText("object.link.label") + " " + iObjectLinkNumber;
				}
			}
			this._setBusyIncdicatorOnDetailControls(oTaskObjectsControl, false);
			this.oModel2.setProperty("/ObjectLinks", data);
			this.oModel2.setProperty("/ObjectLinksCount", data.results.length);
		};

		var fnError = function(oError) {
			this._setBusyIncdicatorOnDetailControls(oTaskObjectsControl, false);
		};

		this.oDataManager.oDataRead(this.sCtxPath + "/" + "TaskObjects", null, jQuery.proxy(fnSuccess, this), jQuery.proxy(fnError, this));
	},
	onSupportInfoOpenEvent: function(sChannelId, sEventId, oSupportInfoOpenEvent) {
		if (oSupportInfoOpenEvent.source === "MAIN") {
			//To support info
			var oCustomAttributeDefinition = null;
			var oItem = this.oModel2.getData();

			if (this.aTaskDefinitionData) {
				for (var i = 0; i < this.aTaskDefinitionData.length; i++) {
					if (oItem && (oItem.TaskDefinitionID === this.aTaskDefinitionData[i].TaskDefinitionID)) {
						if (this.aTaskDefinitionData[i].CustomAttributeDefinitionData.results) {
							oCustomAttributeDefinition = this.aTaskDefinitionData[i].CustomAttributeDefinitionData.results;
						}
					}
				}
			}

			cross.fnd.fiori.inbox.util.SupportInfo.setTask(oItem, oCustomAttributeDefinition);
		}
	},

	/*
		mandatory parameters: oAction, fnFunction
		optional parameters:  oListener - A Context object to call event handler with.
		if there are only two parameters provided, then first is oAction and second is considered as fnFunction.
		if there are three parameters given, then oAction, fnFunction, oListener is considered in that order.
	*/

	addAction: function(oAction,fnFunction){
		
		var oListener;
		
		if(arguments.length < 2) {
			throw "Should have two arguments, Action object and listener function";
		}

		if(arguments.length === 3) {
			if(typeof arguments[1] === "function") {
				fnFunction  = arguments[1];
			} else {
				throw "Second argument is not a listener function";
			}
			
			if(typeof arguments[2] === "object") {
				oListener = arguments[2];
			} 
		}
		
		if(!oAction) {
			throw "Provide Action object with action name, label and optionally type (Accept/Reject)";
		} 
		if(!fnFunction){
			throw "Provide listener function for the Action";
		}

		var bSuccess = false;
		if(this.oHeaderFooterOptions) {
		 	var id = oAction.action;
		 	var btnText = oAction.label;
		 	var btnObject = {
		 		actionId:id,
		 		sBtnTxt: btnText,
		 		onBtnPressed: oListener ? jQuery.proxy(fnFunction,oListener):fnFunction
		 	};
			if (oAction.type && (oAction.type.toUpperCase() === "ACCEPT" || oAction.type.toUpperCase() === "POSITIVE")) {
				btnObject.nature = "POSITIVE";
				var i = 0;
				// Place it after the last positive button if any:
				while (i < this.oHeaderFooterOptions.buttonList.length && this.oHeaderFooterOptions.buttonList[i].nature && this.oHeaderFooterOptions.buttonList[i].nature === "POSITIVE") {
					i++;
				}
				this.oHeaderFooterOptions.buttonList.splice(i, 0, btnObject);
			} else if (oAction.type && (oAction.type.toUpperCase() === "REJECT" || oAction.type.toUpperCase() === "NEGATIVE")) {
				btnObject.nature = "NEGATIVE";
				var i = 0;
				// Place it after the last negative button if any:
				while (i < this.oHeaderFooterOptions.buttonList.length && this.oHeaderFooterOptions.buttonList[i].nature && (this.oHeaderFooterOptions.buttonList[i].nature === "POSITIVE" || this.oHeaderFooterOptions.buttonList[i].nature === "NEGATIVE")) {
					i++;
				}
				this.oHeaderFooterOptions.buttonList.splice(i, 0, btnObject);
		 	} else {
		 		this.oHeaderFooterOptions.buttonList.push(btnObject);
		 	}
		 	this.refreshHeaderFooterOptions();
		 	bSuccess = true;
		}
		return bSuccess;
	},
	
		
	removeAction: function(sAction) {
		
		var bSuccess = false;
		var btnList = [];
		var btnListLength;

		if(!sAction) {
			throw "Provide Action string to be removed";
		}
		
		if(this.oHeaderFooterOptions) {
			if(this.oHeaderFooterOptions.oPositiveAction && this.oHeaderFooterOptions.oPositiveAction.actionId == sAction) {
				this.oHeaderFooterOptions.oPositiveAction = null;
				this.refreshHeaderFooterOptions();
				bSuccess = true;
			} else if(this.oHeaderFooterOptions.oNegativeAction && this.oHeaderFooterOptions.oNegativeAction.actionId == sAction) {
				this.oHeaderFooterOptions.oNegativeAction = null;
				this.refreshHeaderFooterOptions();
				bSuccess = true;
			} else {
				btnList = this.oHeaderFooterOptions.buttonList;
				btnListLength = btnList.length;
				for(var i=0; i<btnListLength; i++) {
					if(sAction == btnList[i].actionId) {
						btnList.splice(i,1);
						this.oHeaderFooterOptions.buttonList = btnList;
						this.refreshHeaderFooterOptions();
						bSuccess = true;
						break;
					}
				}
			}
		}
		
		return bSuccess;
		
	},

	/** The disableAction function is used by the inboxAPI to make a button related to an item action inactive 
	 * params {action} The actions which button will be disabled
	*/
	disableAction: function(sAction) {
		
		var bSuccess = false;
		var btnList = [];
		
		if(this.oHeaderFooterOptions) {
			if(this.oHeaderFooterOptions.oPositiveAction && this.oHeaderFooterOptions.oPositiveAction.actionId == sAction) {
				this.oHeaderFooterOptions.oPositiveAction.bDisabled=true;
				this.refreshHeaderFooterOptions();
				bSuccess = true;
			} else if(this.oHeaderFooterOptions.oNegativeAction && this.oHeaderFooterOptions.oNegativeAction.actionId == sAction) {
				this.oHeaderFooterOptions.oNegativeAction.bDisabled=true;
				this.refreshHeaderFooterOptions();
				bSuccess = true;
			} else {
					btnList = this.oHeaderFooterOptions.buttonList;
					for(var i=0; i<btnList.length; i++) {
						if(sAction && sAction == btnList[i].actionId) {
							btnList[i].bDisabled=true;
							this.oHeaderFooterOptions.buttonList = btnList;
							this.refreshHeaderFooterOptions();
							bSuccess = true;
							break;
						}
					}
			}
		}
		return bSuccess;
	},
	
	/** The disableAllActions function is used by the inboxAPI to make all buttons related to the item actions inactive 
	*/
	disableAllActions: function() {
		
		var bSuccess = false;
		var btnList = [];
		
		if(this.oHeaderFooterOptions) {
			bSuccess = true;
			if(this.oHeaderFooterOptions.oPositiveAction && this.oHeaderFooterOptions.oPositiveAction.actionId) {
				this.oHeaderFooterOptions.oPositiveAction.bDisabled=true;
			}
			if(this.oHeaderFooterOptions.oNegativeAction && this.oHeaderFooterOptions.oNegativeAction.actionId) {
				this.oHeaderFooterOptions.oNegativeAction.bDisabled=true;
			}
			btnList = this.oHeaderFooterOptions.buttonList;
			if(btnList){
				for(var i=0; i<btnList.length; i++) {
					if(btnList[i].actionId){
						btnList[i].bDisabled=true;
					}	
				}
				this.oHeaderFooterOptions.buttonList = btnList;
			}
			this.refreshHeaderFooterOptions();
		}
		return bSuccess;		
	},
	
	/** The enableAction function is used by the inboxAPI to make a button related to an item action active 
	 * params {action} The actions which button will be enabled
	*/
	enableAction: function(sAction) {
		
		var bSuccess = false;
		var btnList = [];
		
		if(this.oHeaderFooterOptions) {
			if(this.oHeaderFooterOptions.oPositiveAction && this.oHeaderFooterOptions.oPositiveAction.actionId == sAction) {
				this.oHeaderFooterOptions.oPositiveAction.bDisabled=false;
				this.refreshHeaderFooterOptions();
				bSuccess = true;
			} else if(this.oHeaderFooterOptions.oNegativeAction && this.oHeaderFooterOptions.oNegativeAction.actionId == sAction) {
				this.oHeaderFooterOptions.oNegativeAction.bDisabled=false;
				this.refreshHeaderFooterOptions();
				bSuccess = true;
			} else {
					btnList = this.oHeaderFooterOptions.buttonList;
					for(var i=0; i<btnList.length; i++) {
						if(sAction && sAction == btnList[i].actionId) {
							btnList[i].bDisabled=false;
							this.oHeaderFooterOptions.buttonList = btnList;
							this.refreshHeaderFooterOptions();
							bSuccess = true;
							break;
						}
					}
			}
		}
		return bSuccess;
	},
	
	/** The enableAllActions function is used by the inboxAPI to make all buttons related to the item actions active 
	*/
	enableAllActions: function() {
		
		var bSuccess = false;
		var btnList = [];
		
		if(this.oHeaderFooterOptions) {
			bSuccess = true;
			if(this.oHeaderFooterOptions.oPositiveAction && this.oHeaderFooterOptions.oPositiveAction.actionId) {
				this.oHeaderFooterOptions.oPositiveAction.bDisabled=false;
			}
			if(this.oHeaderFooterOptions.oNegativeAction && this.oHeaderFooterOptions.oNegativeAction.actionId) {
				this.oHeaderFooterOptions.oNegativeAction.bDisabled=false;
			}
			btnList = this.oHeaderFooterOptions.buttonList;
			if(btnList){
				for(var i=0; i<btnList.length; i++) {
					if(btnList[i].actionId){
						btnList[i].bDisabled=false;
					}	
				}
				this.oHeaderFooterOptions.buttonList = btnList;
			}
			this.refreshHeaderFooterOptions();
		}
		return bSuccess;
	},
	
	_createCustomAttributesElements: function(oDetailData, oCustomAttributeDefinition) {

		var oCustomAttributesContainer = this.getView().byId("customAttributesContainer"); //getting parent element for dynamic child element creation
		var aCustomAttributeElements = this.aCA;

		for (var i = 0; i < oCustomAttributeDefinition.length; i++) { // iterate each custom attribute

			var sAttributeName = oCustomAttributeDefinition[i].Name;
			var sLabelType = oCustomAttributeDefinition[i].Type;
			var sDefinitionLabelName = oCustomAttributeDefinition[i].Label;
			var oCustomAttributeData;
			var bShowAttribute = true;

			// do not show the additional attributes if they are already being displayed in the header
			if ((sAttributeName.toLowerCase() === this.sCustomTaskTitleAttribute.toLowerCase() ||
					sAttributeName.toLowerCase() === this.sCustomNumberValueAttribute.toLowerCase() ||
					sAttributeName.toLowerCase() === this.sCustomNumberUnitValueAttribute.toLowerCase() ||
					sAttributeName.toLowerCase() === this.sCustomObjectAttributeValue.toLowerCase())) {
				bShowAttribute = false;
			}

			if (bShowAttribute) {
				if (sAttributeName && sLabelType && sDefinitionLabelName) {
					for (var j = 0; j < oDetailData.CustomAttributeData.length; j++) {
						if (this._getShowAdditionalAttributes() === true) {
							oCustomAttributeData = this.getView().getModel().getProperty("/" + oDetailData.CustomAttributeData[j]);
						} else {
							oCustomAttributeData = oDetailData.CustomAttributeData[j];
						}
						if (oCustomAttributeData.Name === sAttributeName) {
							var oNewFormElement = new sap.ui.layout.form.FormElement("", {});
							oNewFormElement.setLayoutData(new sap.ui.layout.ResponsiveFlowLayoutData("", {
								linebreak: true,
								margin: false
							}));
							var oLabel = new sap.m.Label("", {
								text: sDefinitionLabelName
							});
							oLabel.setLayoutData(new sap.ui.layout.ResponsiveFlowLayoutData("", {
								weight: 3,
								minWidth: 192
							}));
							oNewFormElement.setLabel(oLabel);
							var sValue = cross.fnd.fiori.inbox.Conversions.fnCustomAttributeTypeFormatter(oCustomAttributeData.Value, sLabelType);
							var oText = new sap.m.Text("", {
								text: sValue
							});
							oText.setLayoutData(new sap.ui.layout.ResponsiveFlowLayoutData("", {
								weight: 5
							}));
							oNewFormElement.addField(oText);
							oCustomAttributesContainer.addFormElement(oNewFormElement);
							aCustomAttributeElements.push(oNewFormElement);
							break;
						}
					}
				}
			}

		}
		this.byId("DescriptionContent").rerender();
	},
	// create custom attributes contect if Custom Attribiute's definition as well as data is available and not empty
	_createCustomAttributesOnDataLoaded: function(oCustomAttributeDefinition) {
		if (this.aCA.length === 0 &&
			this.oModel2.getData().CustomAttributeData &&
			this.oModel2.getData().CustomAttributeData.length > 0 &&
			oCustomAttributeDefinition &&
			oCustomAttributeDefinition.length > 0) {
			jQuery.proxy(this._createCustomAttributesElements(this.oModel2.getData(), oCustomAttributeDefinition), this);
		}
	},
	_getUploadCollectionControl: function() {
		var oUploadControl;
		if (this.isGenericComponentRendered && this.oAttachmentComponentView) {
			oUploadControl = this.oAttachmentComponentView.byId("uploadCollection");
		} else if (this.oGenericAttachmentComponent && !this.isGenericComponentRendered) {
			oUploadControl = this.oGenericAttachmentComponent.view.byId("uploadCollection");
		}
		return oUploadControl;
	},
	_setBusyIncdicatorOnDetailControls: function(oControl, bShowBusy) {
		if (oControl) {
			if (bShowBusy) {
				oControl.setBusyIndicatorDelay(1000);
			}
			oControl.setBusy(bShowBusy);
		}
	},
	_processCustomAttributesData: function(oItem) {
		if (oItem.CustomAttributeData && oItem.CustomAttributeData.__list) {
			oItem.CustomAttributeData = oItem.CustomAttributeData.__list;
		}
		var oDefinitionData = this.oDataManager.getCustomAttributeDefinitions()[oItem.TaskDefinitionID];
		if (oDefinitionData && oDefinitionData instanceof Array) {
			oItem.CustomAttributeDefinitionData = oDefinitionData;
		}
		return oItem;
	},
	_getShowAdditionalAttributes: function() {
		if (this.bShowAdditionalAttributes == null) {
			this.bShowAdditionalAttributes = this.oDataManager.getShowAdditionalAttributes();
		}
		return this.bShowAdditionalAttributes;
	},
	//Calendar integration
	createCalendarEvent: function() {
		var that = this;
		//get deadline
		var oData = this.oModel2.getData();
		var oDeadLine = oData.CompletionDeadLine;
		if (oDeadLine) {
			//we would like to warn the user the day before the deadline occurs
			oDeadLine.setDate(oDeadLine.getDate() - 1); //this takes care of the changing of the months and years when decreasing from first day of the month
			var nYear = oDeadLine.getFullYear();
			var nMonth = oDeadLine.getMonth();
			var nDay = oDeadLine.getDate();
			var nHours = oDeadLine.getHours();
			var nMinutes = oDeadLine.getMinutes();
			var nSeconds = oDeadLine.getSeconds();

			//startDate - the day before the given date
			var startDate = new Date(nYear, nMonth, nDay, nHours, nMinutes, nSeconds);

			//endDate - 60 minutes later
			var endDate = new Date(nYear, nMonth, nDay, nHours, nMinutes + 60, nSeconds);

			var title = oData.TaskTitle;

			//link that navigates back to the fiori application - uses default browser
			var notes = this.getMailBody();
			var createSuccess = function(message) {
				sap.m.MessageToast.show(that.i18nBundle.getText("dialog.success.mq.calendarEventCreated")); //new i18n item in the _en version
			};
			var createError = function(message) {
				var sErrorText = that.i18nBundle.getText("dialog.error.mq.calendarPluginError");
				sap.ca.ui.message.showMessageBox({
					type: sap.ca.ui.message.Type.ERROR,
					message: sErrorText,
					details: message
				});
			};

			//if there is already an event with this information, don't create another one.
			var findSuccess = function(message) {
				if (typeof(message) === "string" || message.length == 0) { // message = "No matching event exists" instead of an object when it did not find an event with the information provided on windows 8
					//create a new event with the obtained information
					window.plugins.calendar.createEvent(title, null, notes, startDate, endDate, createSuccess, createError);
				} else { //don't create an event because there is already an event with this info.
					sap.m.MessageToast.show(that.i18nBundle.getText("dialog.error.mq.calendarThereIsAnEventAlready")); //new i18n item in the _en version
				}
			};
			var findError = function(message) { //on Android and iOS, this part will be invoked if there are no events by the information provided
				//create a new event with the obtained information
				window.plugins.calendar.createEvent(title, null, notes, startDate, endDate, createSuccess, createError);
			};

			//check if there is an event in the calendar with the provided information and create if not
			window.plugins.calendar.findEvent(title, null, null, startDate, endDate, findSuccess, findError);

			//set the day back to normal. Remember, that we decreased the date by one day, because this is a reminder of the event. now we have to inscrease the date back to normal, to fix it.
			oDeadLine.setDate(oDeadLine.getDate() + 1);
		}
	},
	_getActionHelper: function() {
		if (!this._oActionHelper) {
			jQuery.sap.require("cross.fnd.fiori.inbox.util.ActionHelper");
			this._oActionHelper = new cross.fnd.fiori.inbox.util.ActionHelper(this, this.getView());
		}
		return this._oActionHelper;
	}

});