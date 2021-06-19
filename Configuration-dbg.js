/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("cross.fnd.fiori.inbox.Configuration");
jQuery.sap.require("sap.ca.scfld.md.ConfigurationBase");
jQuery.sap.require("sap.ca.scfld.md.app.Application");

 
sap.ca.scfld.md.ConfigurationBase.extend("cross.fnd.fiori.inbox.Configuration", {

	oServiceParams: {
        serviceList: [
            {
                name: "TASKPROCESSING",
                masterCollection: "TaskCollection",
                serviceUrl: (function() {
    		    	var tcmURL = "";
			    	//Get tcmURL from component data
			    	var sComponentData = sap.ca.scfld.md.app.Application.getImpl().getComponent().getComponentData();
			    	if (sComponentData && sComponentData.startupParameters && sComponentData.startupParameters.tcmURL) {
			    		tcmURL = sComponentData.startupParameters.tcmURL[0];
			    	}
			    	//If tcmURL exists in component data, consider it, else consder default from manifest entry
			    	if(tcmURL){
			     		return tcmURL;
			    	} else {
			    		return cross.fnd.fiori.inbox.Component.getMetadata().getManifestEntry("sap.app").dataSources["TASKPROCESSING"].uri;
			    	}
                })(),
                isDefault: true,
                mockedDataSource: jQuery.sap.getModulePath("cross.fnd.fiori.inbox") + "/" + cross.fnd.fiori.inbox.Component.getMetadata().getManifestEntry("sap.app").dataSources["TASKPROCESSING"].settings.localUri,
                useBatch: true,
                useV2ODataModel:true,
                noBusyIndicator:true,
                fRequestFailed: function(oEvent) {
                	var oComponent = sap.ca.scfld.md.app.Application.getImpl().getComponent();
                	oComponent.getDataManager().handleRequestFailed(oEvent);
                }
            },
            {
                name: "POSTACTION",
                masterCollection: "TaskCollection",
                serviceUrl: (function () {
			    	var tcmURL = "";
			    	//Get tcmURL from component data
			    	var sComponentData = sap.ca.scfld.md.app.Application.getImpl().getComponent().getComponentData();
			    	if (sComponentData && sComponentData.startupParameters && sComponentData.startupParameters.tcmURL) {
			    		tcmURL = sComponentData.startupParameters.tcmURL[0];
			    	}
			    	//If tcmURL exists in component data, consider it, else consder default from manifest entry
			    	if(tcmURL){
			     		return tcmURL;
			    	} else {
			    		return cross.fnd.fiori.inbox.Component.getMetadata().getManifestEntry("sap.app").dataSources["TASKPROCESSING"].uri;
			    	}
			    })(),
                isDefault: false,
                useBatch: true,
                useV2ODataModel:true,
                noBusyIndicator:true,
                fRequestFailed: function(oEvent) {
                	var oComponent = sap.ca.scfld.md.app.Application.getImpl().getComponent();
                	oComponent.getDataManager().handleRequestFailed(oEvent);
                }
            }
        ]
    },

    getServiceParams: function () {
        return this.oServiceParams;
    },

    /**
     * @inherit
     */
    getServiceList: function () {
        return this.oServiceParams.serviceList;
    },

    getMasterKeyAttributes : function() {
        return ["Id"];
    }

});