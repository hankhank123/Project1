/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.controller("cross.fnd.fiori.inbox.Main", {

	onInit : function() {
        jQuery.sap.require("sap.ca.scfld.md.Startup");
        jQuery.sap.require("sap.ca.ui.model.type.Date");
        jQuery.sap.require("cross.fnd.fiori.inbox.util.Conversions");
        jQuery.sap.require("cross.fnd.fiori.inbox.util.SupportInfo");
        jQuery.sap.require("cross.fnd.fiori.inbox.util.oDataReadExtension"); //TODO: remove it if this workaround not needed
        jQuery.sap.require("sap.ca.ui.model.format.FormattingLibrary");
        jQuery.sap.require("sap.ca.ui.dialog.factory");
        jQuery.sap.require("cross.fnd.fiori.inbox.util.AddInbox");
        jQuery.sap.require("cross.fnd.fiori.inbox.util.DataManager");
        jQuery.sap.require("cross.fnd.fiori.inbox.util.FooterButtonExtension");
        
        /*
        	The unloadResources is required because Configuration.js is cached in Scaffolding and
        	it is not reinitialized/recalculated after second tile is opened in Fiori Launchpad.
        	Thus My Inbox application cannot use different configuration for the different tiles.
        */
        jQuery.sap.unloadResources("cross/fnd/fiori/inbox/Configuration.js", false, true, true);
        
        sap.ca.scfld.md.Startup.init('cross.fnd.fiori.inbox', this);
        var oAppImpl = sap.ca.scfld.md.app.Application.getImpl();
        var oModelList = oAppImpl.oConnectionManager ? oAppImpl.oConnectionManager.modelList : {};
        var oOwnerComponent = oAppImpl.getComponent();
        
        //Setting the models to the view
        for (var sModelName in oModelList) {
		  if (oModelList.hasOwnProperty(sModelName)) {
		  	if (sModelName !== "undefined") {
		  		this.getView().setModel(oModelList[sModelName], sModelName);
		  	} else {
		  		this.getView().setModel(oModelList[sModelName]);
		  	}
		  } 
		}
		var oOriginalModel = this.getView().getModel();
		//Initialization of DataManager
		/*global cross:true*/
		/*eslint no-undef: 2*/
		var oDataManager = new cross.fnd.fiori.inbox.util.DataManager(oOriginalModel, this);
		oOwnerComponent.setDataManager(oDataManager);
		cross.fnd.fiori.inbox.FooterButtonExtension.overrideEnsureButton();
		
		if (oDataManager.bOutbox) { 
			this.getOwnerComponent().getService("ShellUIService").then(
            	function (oService) {
                	oService.setTitle(sap.ca.scfld.md.app.Application.getImpl().AppI18nModel.getResourceBundle().getText("SHELL_TITLE_OUTBOX"));
            	},
            	function (oError) {
            		jQuery.sap.log.error("Cannot get ShellUIService", oError, "cross.fnd.fiori.inbox");
            	}
        	);			
		}			
    		
    if(typeof sap.ushell!=='undefined' && typeof sap.ushell.renderers !== 'undefined' && typeof sap.ushell.renderers.fiori2 !== 'undefined'){
				var rendererExt = sap.ushell.renderers.fiori2.RendererExtensions;
        	}else{
        		rendererExt=undefined;
       	}
    	if(rendererExt){
	        var oBundle = sap.ca.scfld.md.app.Application.getImpl().AppI18nModel.getResourceBundle();
	       	this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
	       	if(oDataManager.getSubstitutionEnabled()){
		        this.oSubstButton = new sap.m.Button({
		        		text: oBundle.getText("substn.navigation_button"),
		        		icon: "sap-icon://citizen-connect",
		        		tooltip:oBundle.getText("userdrop.manage_my_substitutes_tooltip"),
		        		press: (jQuery.proxy(function() {
		        			this.oRouter.navTo('substitution', {} , false);
		        		}, this))
		        	});
		        	
		        rendererExt.addOptionsActionSheetButton(this.oSubstButton,rendererExt.LaunchpadState.App);
		
		        this.oAddInboxButton = new sap.m.Button({
		        	text: oBundle.getText("XBUT_SUBSTITUTE_FOR"),
		        	icon: "sap-icon://personnel-view",
		        	tooltip:oBundle.getText("userdrop.substitute_for_tooltip"),
		        	press: function(oEvent){
		        		cross.fnd.fiori.inbox.util.AddInbox.open();
		        	}
		        });
		        rendererExt.addOptionsActionSheetButton(this.oAddInboxButton,rendererExt.LaunchpadState.App);
	       	}
	        this.oSupportInfoButton = new sap.m.Button({
	        	text: oBundle.getText("supportinfo.navigation_button"),
	        	icon: "sap-icon://message-information",
	        	tooltip:oBundle.getText("userdrop.support_information_tooltip"),
	        	press: function(oEvent){
	        				sap.ca.scfld.md.app.Application.getImpl().getComponent().getEventBus().publish("cross.fnd.fiori.inbox", "open_supportinfo",{source:"MAIN"});
	        				cross.fnd.fiori.inbox.util.SupportInfo.open();
	        			}
	        });
	        rendererExt.addOptionsActionSheetButton(this.oSupportInfoButton,rendererExt.LaunchpadState.App);
		}else{
			jQuery.sap.log.error("sap.ushell.renderers.fiori2.RendererExtensions not found. My Inbox menu options will not be added");
		}
	},
	
	/**
	 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
	 * 
	 * @memberOf MainXML
	 */
	onExit : function() {
		//exit cleanup code here
		if (cross.fnd.fiori.inbox.Conversions) {
			cross.fnd.fiori.inbox.Conversions.setDataManager(null);
		}
		var rendererExt = sap.ushell.renderers?sap.ushell.renderers.fiori2.RendererExtensions:undefined;
		if(rendererExt){
			if(this.oSubstButton) {
				rendererExt.removeOptionsActionSheetButton(this.oSubstButton,rendererExt.LaunchpadState.App);	
			}
			
			if(this.oAddInboxButton) {
				rendererExt.removeOptionsActionSheetButton(this.oAddInboxButton,rendererExt.LaunchpadState.App);	
			}
			
			if(this.oSupportInfoButton) {
				rendererExt.removeOptionsActionSheetButton(this.oSupportInfoButton,rendererExt.LaunchpadState.App);	
			}
		}
	}	
});