/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("sap.ca.ui.utils.resourcebundle");
jQuery.sap.require("cross.fnd.fiori.inbox.util.ConfirmationDialogManager");
jQuery.sap.require("cross.fnd.fiori.inbox.util.EmployeeCard");
/*global cross:true*/
/*eslint no-undef: 2*/
sap.ui.controller("cross.fnd.fiori.inbox.view.Forward", {
		_FORWARD_DIALOG_ID: "DLG_FORWARD",
		_SEARCH_FIELD_ID: "SFD_FORWARD",
		_FORWARDER_LIST_ID: "LST_AGENTS",
		_FORWARDER_ITEM_ID: "ITM_AGENT",
		
		iMaxAgent: 100,

//	This hook method can be used to change the number of items shown in the forward screen
//	Called before the forward dialog is opened
	extHookChangeListSizeLimit: null,
	
	oConfirmationDialogManager : cross.fnd.fiori.inbox.util.ConfirmationDialogManager,
	
	onInit: function() {
		this.getView().setModel(sap.ca.scfld.md.app.Application.getImpl().AppI18nModel, "i18n");	
		var oAgentList = this.getView().byId(this._FORWARDER_LIST_ID);
		oAgentList.bindProperty("showNoData", {
			path:'/agents',
			formatter: function(aAgents) {
				
				/* Overriding detail icon in the StandardListItem.
				 * By default, the icon is edit, the code changes it to customer icon. But its creating issues. So commented till API is available.
				//Changing the internal Detail icon of the StandardListItem
				for (var i=0; i<oAgentList.getItems().length; i++) {
					var item = oAgentList.getItems()[i];
					item._detailIcon = new sap.ui.core.Icon("", {src:"sap-icon://customer"}).addStyleClass("sapMLIBIconDet");
				}*/
				return (aAgents === undefined) ? false : true;
			}
		});
		//Subscribe to events
		var oEventBus = sap.ca.scfld.md.app.Application.getImpl().getComponent().getEventBus();
		oEventBus.subscribe("cross.fnd.fiori.inbox.dataManager", "showLoaderInDialogs", jQuery.proxy(this.onShowLoaderInDialogs,this));

		if (sap.ui.Device.system.phone) {
			var oDialog = this.getView().byId(this._FORWARD_DIALOG_ID);
			oDialog.setStretch(true);
		}
	},
	
	onShowLoaderInDialogs: function(sChannelId, sEventId, oValue){
		var oForwardDialog = this.getView().byId(this._FORWARD_DIALOG_ID);
		if(oForwardDialog){
			oForwardDialog.setBusyIndicatorDelay(1000).setBusy(oValue.bValue);	
		}
	},
	
	onCancelDialog: function() {
		var oForwardDlg = this.getView().byId(this._FORWARD_DIALOG_ID);
		oForwardDlg.close(); 
	},
	
	onBeforeOpenDialog: function() {
		//NOTE: the Forward Dialog is currently only opened by APPs, there is NO internal navigation back to this Dialog.
		//e.g. from Forward Confirmation Dialog back to this dialog. 
		//For the internal navigation, need to check if the state of the dialog should be kept.
		
		var oFldSearch = this.getView().byId(this._SEARCH_FIELD_ID);
		var oFwdDlg = this.getView().byId(this._FORWARD_DIALOG_ID);
		
		// setting initial focus to searchField in the forward dialog
		oFwdDlg.setInitialFocus(oFldSearch);
		
		//remove previous search value
		oFldSearch.setValue("");
		
		//remove the previous startExernalSearch function and set it from Dialog model
		this.fnStartSearch = undefined;
		this.fnCloseDlg = undefined;
		var oDlgModel = oFwdDlg.getModel();
		if (oDlgModel) {
			this.fnStartSearch = oDlgModel.getProperty("/startSearch");
			this.fnCloseDlg = oDlgModel.getProperty("/closeDlg");
		}
		
		/**
         * @ControllerHook Change forward list size
         * This hook method can be used to change the number of items shown in the forward screen
         * Called before the forward dialog is opened
         * @callback cross.fnd.fiori.inbox.view.Forward~extHookChangeListSizeLimit
         * @return {integer} The maximum number of entries which are used for for list bindings.
         */
    	if (this.extHookChangeListSizeLimit) {
    		var iSizeLimit = this.extHookChangeListSizeLimit();
    		oDlgModel.setSizeLimit(iSizeLimit);
    		this.iMaxAgent = iSizeLimit;
    	}
	},
	
	onLiveChange: function(oEvent) {
		if (this.getView().byId(this._FORWARD_DIALOG_ID).getModel().getProperty('/isPreloadedAgents')){
			var sSearchTerm = oEvent.getParameters().newValue;
			
			var aListItems = this.getView().byId("LST_AGENTS").getItems();
			for (var i = 0; i < aListItems.length; i++) {
				var bVisibility = this.fnStartSearch(aListItems[i], sSearchTerm);
				aListItems[i].setVisible(bVisibility);
			}
			this.getView().byId("LST_AGENTS").rerender();
		}
	},
	
    onAgentSearch: function(oEvent) {
		if (!this.getView().byId(this._FORWARD_DIALOG_ID).getModel().getProperty('/isPreloadedAgents')){    	
			var sSearchTerm = oEvent.getParameters().query;		
			
			if (sSearchTerm.length != 0 ) {
				this.bSearchUsers = true;
				var oComponent = sap.ca.scfld.md.app.Application.getImpl().getComponent();
	    		var oDataManager = oComponent.getDataManager();
	    		var sOrigin = this.getView().byId(this._FORWARD_DIALOG_ID).getModel().getProperty('/origin');
	    		oDataManager.searchUsers(sOrigin, sSearchTerm, this.iMaxAgent, jQuery.proxy(function(oResults){
	    			var oDialog = this.getView().byId("DLG_FORWARD");
	    			oDialog.getModel().setProperty("/agents", []);
	    			oDialog.getModel().setProperty("/agents", oResults);
	    			this.getView().byId("LST_AGENTS").rerender();
	    		},this));
	    		
	    		var sNoDataText = sap.ca.scfld.md.app.Application.getImpl().getComponent().oDataManager.oi18nResourceBundle.getText("view.Forward.noRecipientsAfterSearch");
	    		this.getView().byId("LST_AGENTS").setNoDataText(sNoDataText);
			}
		}
	},	
	
	_findListItemById: function(sId) {
		var aListItems = this.getView().byId("LST_AGENTS").getItems();
		for(var i = 0; i < aListItems.length; i++) {
			if (aListItems[i].getId() === sId) {
				return aListItems[i];
			}
		}
	},
	
	onSelectAgent: function(oEvent) {
		var oSelectedItem = this._findListItemById(oEvent.getParameters().id);
		if (oSelectedItem && oSelectedItem.getBindingContext()) {
			//1. close the current dialog at first
			this.getView().byId(this._FORWARD_DIALOG_ID).close();
			//2. open the confirmation dialog
			var oSelectedAgent = oSelectedItem.getBindingContext().getObject();
			var oDlgModel = this.getView().byId(this._FORWARD_DIALOG_ID).getModel();
			var iNumberOfSelectedItems = oDlgModel.getProperty("/numberOfItems");
			// number of items is filled only in mass approval mode, so if it's undefined, we are in the normal forward case
			var sQuestion = "";
			if (iNumberOfSelectedItems === undefined) {
				sQuestion = sap.ca.ui.utils.resourcebundle.getText("forward.question", oSelectedAgent.DisplayName);
			} else if (iNumberOfSelectedItems == 1) {
				sQuestion = sap.ca.scfld.md.app.Application.getImpl().getComponent().oDataManager.oi18nResourceBundle.getText("XMSG_MULTI_FORWARD_QUESTION", oSelectedAgent.DisplayName);
			} else {
				sQuestion = sap.ca.scfld.md.app.Application.getImpl().getComponent().oDataManager.oi18nResourceBundle.getText("XMSG_MULTI_FORWARD_QUESTION_PLURAL", [iNumberOfSelectedItems, oSelectedAgent.DisplayName]);
			}
			
			this.oConfirmationDialogManager.showDecisionDialog({
				question : sQuestion,
				showNote : true,
				noteMandatory : false,
				title : sap.ca.ui.utils.resourcebundle.getText("forward.title"),
				confirmButtonLabel : sap.ca.ui.utils.resourcebundle.getText("forward.button"),
				confirmActionHandler: $.proxy(function(sNote) {
					this.forwardConfirmClose(sNote, oSelectedAgent);
				},this)
			});
		}
			
	},	
	
	forwardConfirmClose: function(sNote, oSelectedAgent) {
		var oNewResult = {};
		//call the APP forward close function
		oNewResult = {
					bConfirmed: true,
					sNote: sNote,
					oAgentToBeForwarded: oSelectedAgent //this is the confirmation dialog object
		};
		this.fnCloseDlg(oNewResult);
	},
	
	handleDetailPress: function(oEvent) {
		var oSelectedItem = this._findListItemById(oEvent.getParameters().id);
		var path = oSelectedItem.getBindingContext().getPath();
		var agentIndex = path.substring(8, path.length);
		var agent = this.getView().byId(this._FORWARD_DIALOG_ID).getModel().getData().agents[agentIndex];

		if (sap.ui.Device.system.tablet &&  sap.ui.Device.orientation.portrait) {
			// use special handling for tablets in portrait mode, this case the employee business card does not fit
			// next to the list item
			cross.fnd.fiori.inbox.util.EmployeeCard.displayEmployeeCard(oEvent.getSource()._detailIcon, agent);
		} else {
			cross.fnd.fiori.inbox.util.EmployeeCard.displayEmployeeCard(oEvent.getSource(), agent);
		}
	}
});