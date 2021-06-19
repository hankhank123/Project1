/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
// define a root UIComponent which exposes the main view
jQuery.sap.declare("cross.fnd.fiori.inbox.Component");
jQuery.sap.require("sap.ui.core.UIComponent");
jQuery.sap.require("sap.ca.scfld.md.ConfigurationBase");
jQuery.sap.require("sap.ui.core.routing.Router");
jQuery.sap.require("sap.ca.scfld.md.ComponentBase");

// new Component
sap.ca.scfld.md.ComponentBase.extend("cross.fnd.fiori.inbox.Component", {
	
	metadata : sap.ca.scfld.md.ComponentBase.createMetaData("MD", {
		"manifest": "json",
		// Navigation related properties
		viewPath : "cross.fnd.fiori.inbox.view",
		
		detailPageRoutes : {
			"detail" : {
                "pattern" : "detail/{SAP__Origin}/{InstanceID}/{contextPath}",
                "view" : "S3"
			},
			"multi_select_summary" : {
                "pattern" : "multi_select_summary",
                "view" : "MultiSelectSummary"
			},
			"replace_detail": {
				"pattern" : "replaceDetail/{SAP__Origin}/{InstanceID}/{contextPath}",
                "view" : "ReplaceDetail"
			}
		},
		
		fullScreenPageRoutes : {
            "detail_deep" : {
               "pattern" : "detail_deep/{SAP__Origin}/{InstanceID}/{contextPath}",
               "view" : "S3"
            },
            "substitution" : {
                "pattern" : "substitution",
                "view" : "ViewSubstitution"
             },
            "table_view" : {
                "pattern" : "table_view",
                "view" : "S2_TaskList"
             }            
             }
	}),
	
	initShellUIService: function(){
		if(sap.ushell && sap.ushell.ui5service && sap.ushell.ui5service.ShellUIService) {
			this.getService("ShellUIService").then(
				jQuery.proxy(function (oService) {
					// Keep the reference to the ShellUIService in the Component context for global use:
					this.oShellUIService = oService;
				},this),
				function (oError) {
					jQuery.sap.log.error("Cannot get ShellUIService", oError, "cross.fnd.fiori.inbox.Component");
				}
			);	
		}
	},
	
	/**
	 * Initialize the application
	 * 
	 * @returns {sap.ui.core.Control} the content
	 */
	createContent : function() {
		// The ShellUIService is used for modifying the Fiori header bar, which is only available in desktop full screen mode.
		// ShellUIService is available only in UI5 versions >= 1.40 (Fiori 2.0):
		this.initShellUIService();
		var oViewData = {component: this};
		
		var oRootView = new sap.ui.view({
			viewName : "cross.fnd.fiori.inbox.Main",
			type : sap.ui.core.mvc.ViewType.XML,
			viewData : oViewData
		});
		
		oRootView.addStyleClass(this.getContentDensityClass());
		
		var sInstanceID = this.getDataManager().sTaskInstanceID;
		var sSAP__Origin = this.getDataManager().sSapOrigin;
		
		if(sInstanceID && sSAP__Origin) {
			var sURL = this._getAppSpecificURL(sInstanceID,sSAP__Origin);
		}
		
		if(sURL) {
			var oHashChanger = sap.ui.core.routing.HashChanger.getInstance();
			oHashChanger.replaceHash(sURL);
			var sURLWithHash = this._getFullHash(sURL);
			
			if(window.history.replaceState) {
			    window.history.replaceState({fromExternal:true}, null, '#'+sURLWithHash);
			}
		}

        if(this.getDataManager().getTableView() && (!sap.ui.Device.system.phone || this.getDataManager().getTableViewOnPhone())){
	        var oHashChanger = sap.ui.core.routing.HashChanger.getInstance();
	        var currentHash = oHashChanger.getHash();
	        if(!jQuery.sap.startsWith(currentHash, "detail_deep")){
		    	var oRouter = this.getRouter();
		        //to construct the correct URL all parameters defined in the routes's pattern have to be provided to the getURL function:
		    	var sUrl = oRouter.getURL("table_view",{});    //adopt to your route
		        if (sUrl) {
					oHashChanger.replaceHash(sUrl);
		        }
	        }
        }
		return oRootView;
	},
	
	setDataManager : function(oDataManager) {
		this.oDataManager = oDataManager;
	},

	getDataManager : function() {
		return this.oDataManager;
	},
	
	/**
	 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
	 * design mode class should be set, which influences the size appearance of some controls.
	 * @public
	 * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
	 */
	getContentDensityClass: function() {
		if (this._sContentDensityClass === undefined) {
			// check whether FLP has already set the content density class; do nothing in this case
			if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
				this._sContentDensityClass = "";
			} else if (!sap.ui.Device.support.touch) { // apply "compact" mode if touch is not supported
				this._sContentDensityClass = "sapUiSizeCompact";
			} else {
				// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
				this._sContentDensityClass = "sapUiSizeCozy";
			}
		}
		return this._sContentDensityClass;
	},
	
	_getAppSpecificURL: function (sInstID, sSOrigin) {
			if (sInstID && sSOrigin) {
				// task has been called from notification service
				var oRouter = this.getRouter();
				var sURL = oRouter.getURL("detail", {
					SAP__Origin: sSOrigin,
					InstanceID: sInstID,
					contextPath:  "TaskCollection(SAP__Origin='" + sSOrigin +"',InstanceID='" + sInstID+"')"
				});
			}
			return sURL;		
	},
	
	_getFullHash: function (appSpecificHash) {
			var sURLWithHash = "";
			if (appSpecificHash) {
				if(sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
					var xnavservice = sap.ushell.Container.getService("CrossApplicationNavigation");
					sURLWithHash = xnavservice.hrefForAppSpecificHash(appSpecificHash);
					
					var urlParser = sap.ushell.Container.getService("URLParsing");
					var oShellHash = urlParser.parseShellHash(sURLWithHash);
					
					delete oShellHash.params.InstanceID;
					delete oShellHash.params.SAP__Origin;
					sURLWithHash = urlParser.constructShellHash(oShellHash);
				} else {
					jQuery.sap.log.error("sap.ushell.Container.getService is not found.");
				}
			}
			return sURLWithHash;
	}
	
});