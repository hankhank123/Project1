/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("sap.ca.scfld.md.controller.BaseFullscreenController");

sap.ca.scfld.md.controller.BaseFullscreenController.extend("cross.fnd.fiori.inbox.view.ReplaceDetail", {
  onInit: function(){
  	var oMyInboxComponent = this.getOwnerComponent();
    oMyInboxComponent.getRouter().attachRoutePatternMatched(this.fnHandleNavToTaskUIDetail, this);
    oMyInboxComponent.getDataManager().fnShowReleaseLoader(false);
  },

  fnHandleNavToTaskUIDetail: function(oEvent){
        if (oEvent.getParameter("name") === "replace_detail") {
    		this.oEventParameters = oEvent.getParameters().arguments;
        	this.oDataManager = this.getOwnerComponent().getDataManager();
    		this.fnCreateIntentBasedComponent();
        }   
  },
  
  fnCreateIntentBasedComponent: function(){
	  	var oIntentModel = this.getOwnerComponent().getModel("intentModel");
		var oIntentData = oIntentModel? oIntentModel.getData() : null;
  	   	var that = this;
  	   	
 		this.fnDestroyIntentBasedComponent(); // destroy existing component if present
  	   	var oNavigationService = sap.ushell.Container.getService("CrossApplicationNavigation");
  	   	var oComponentData = {
  	   		onTaskUpdate : jQuery.proxy(that.fnDelegateTaskRefresh,that)
  	   	};
  	   	var sParameters = oIntentData.params ? "?" + that.fnCreateURLParameters(oIntentData.params) : "";
  	   	var sIntent = oIntentData.params.openMode? oIntentData.NavigationIntent + sParameters : oIntentData.NavigationIntent;
  	   	oNavigationService.createComponentInstance(sIntent ,{componentData:oComponentData}, that.getOwnerComponent())
	    .done(function (oComponent) {
	    	that.byId("appContent").setComponent(oComponent);
	    })
	    .fail(function (oError) {
	        jQuery.sap.log.error(oError);
	    });
	},
	
	fnCreateURLParameters: function(data){
		return Object.keys(data).map(function(key) {
        	return [key, data[key]].map(encodeURIComponent).join("=");
    	}).join("&");
	},
	
	fnDelegateTaskRefresh: function(){
		var oNavigationParameters = this.oEventParameters;
		var sSAPOrigin = oNavigationParameters.SAP__Origin;
		var sInstanceId = oNavigationParameters.InstanceID;
		
		if(oNavigationParameters && sSAPOrigin && sInstanceId){
			this.oDataManager.fnUpdateSingleTask(sSAPOrigin, sInstanceId);
		}
	},
	
	fnDestroyIntentBasedComponent: function(){
		var oIntentBasedComponent = this.byId("appContent").getComponentInstance();
		if(oIntentBasedComponent){
			oIntentBasedComponent.destroy();
		}
	}
	
});