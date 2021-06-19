/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("cross.fnd.fiori.inbox.util.SupportInfo");


cross.fnd.fiori.inbox.util.SupportInfo = (function() {
	var _oXmlView = null;
	var oModel = null;
	var oDataManager = null;
	return {
		open: function() {
			if (!_oXmlView) {
				_oXmlView = new sap.ui.view({
					id: 		"MIB_VIEW_SUPPORT_INFO",
					viewName: 	"cross.fnd.fiori.inbox.view.SupportInfo",
					type:		sap.ui.core.mvc.ViewType.XML
				});
			}
			this.oModel = cross.fnd.fiori.inbox.util.SupportInfo.getJSONModel();
			cross.fnd.fiori.inbox.util.SupportInfo.setScenarioConfig();
			var sCompVersion = cross.fnd.fiori.inbox.Component.getMetadata().getVersion();
			cross.fnd.fiori.inbox.util.SupportInfo.getJSONModel().setProperty("/compversion", sCompVersion);
			cross.fnd.fiori.inbox.util.SupportInfo.getJSONModel().setProperty("/sapui5version", sap.ui.version);
			var oDialog = _oXmlView.byId("DLG_SUPPORTINFO");
			oDialog.setModel(this.oModel);
			oDialog.open();
		},
		setGroup: function(sGroup){
			cross.fnd.fiori.inbox.util.SupportInfo.getJSONModel().setProperty("/groupby", sGroup);
		},
		
		setFilters: function(sFilters){
			var sFilterString = "";
			for (var key in sFilters) 
			{
			    if (sFilters.hasOwnProperty(key))
			    {
			    	sFilterString = sFilterString+key + "\n";
			    }
			}
			cross.fnd.fiori.inbox.util.SupportInfo.getJSONModel().setProperty("/filters", sFilterString);
			
		},
		
		setSorters: function(oSorters){
			cross.fnd.fiori.inbox.util.SupportInfo.getJSONModel().setProperty("/orderby", oSorters);
		},
		
		setSearchPattern: function(oPattern){
			cross.fnd.fiori.inbox.util.SupportInfo.getJSONModel().setProperty("/searchby", oPattern);
		},
		
		setTask: function(oTask, oCustomAttributeDefinition){
			cross.fnd.fiori.inbox.util.SupportInfo.getJSONModel().setProperty("/Task", oTask);
			if(oCustomAttributeDefinition){
				var oMod = cross.fnd.fiori.inbox.util.SupportInfo.getJSONModel().getProperty("/Task");
				
				if (oMod && oMod.CustomAttributeData) {
					
					for(var iCustAttrCount=0; iCustAttrCount < oMod.CustomAttributeData.length; iCustAttrCount++) {
						for(var iCustAttrDefCount=0; iCustAttrDefCount < oCustomAttributeDefinition.length; iCustAttrDefCount++)
						if(oMod.CustomAttributeData[iCustAttrCount].Name === oCustomAttributeDefinition[iCustAttrDefCount].Name){
							oMod.CustomAttributeData[iCustAttrCount].Type = oCustomAttributeDefinition[iCustAttrDefCount].Type;
						}
					}
				}
				
				cross.fnd.fiori.inbox.util.SupportInfo.getJSONModel().setProperty("/Task", oMod);
			}
		},
		
		setScenarioConfig: function() {
			var oComponent = sap.ca.scfld.md.app.Application.getImpl().getComponent();
			oDataManager = oComponent.getDataManager();
			var scenarioConfig = oDataManager.getScenarioConfig();
			cross.fnd.fiori.inbox.util.SupportInfo.getJSONModel().setProperty("/ScenarioConfig", scenarioConfig);
		},
		getJSONModel: function() {
			if(!this.oModel){
				this.oModel = new sap.ui.model.json.JSONModel(); 
				return this.oModel;
			} else {
				return this.oModel;
			}
		},
		
		format_visibility:function (value){
			if(value){
				return true;
			} else {
				return false;
			}
		},

		decodeString: function(str) {
			return str != null ? decodeURIComponent(str) : "";
		}
	};
}());