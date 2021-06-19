/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("sap.ca.scfld.md.controller.BaseDetailController");
sap.ca.scfld.md.controller.BaseDetailController.extend("cross.fnd.fiori.inbox.view.MultiSelectSummary", {
	_CUSTOM_ATTRIBUTE_NUMBER: "CustomNumber",
	_CUSTOM_ATTRIBUTE_NUMBER_UNIT: "CustomNumberUnit",
	_CUSTOM_ATTRIBUTE_OBJECT: "CustomObjectAttribute",
	
	onInit : function() {
        sap.ca.scfld.md.controller.BaseDetailController.prototype.onInit.call(this);
		sap.ca.scfld.md.app.Application.getImpl().getComponent()
		.getEventBus().subscribe("cross.fnd.fiori.inbox", "multiselect", this.onMultiSelectEvent, this);
		
        this.oRouter.attachRouteMatched(this.handleNavToDetail, this);
        
        this.bInited = false;
	},
	
	onMultiSelectEvent : function(sChannelId, sEventId, oMultiSelectEvent) {
		if (oMultiSelectEvent.Source === "S2" || oMultiSelectEvent.Source === "action") {
			if(oMultiSelectEvent.reInitialize){
				this.aWorkItems = oMultiSelectEvent.WorkItems;
			}
			
			if (oMultiSelectEvent.Selected || oMultiSelectEvent.WorkItems.length > 0) {
				for (var i = 0; i < oMultiSelectEvent.WorkItems.length; i++) {
					var oWorkItem = this.lookUpWorkItem(oMultiSelectEvent.WorkItems[i]);
					oWorkItem.Selected = oMultiSelectEvent.Selected;
					this.updateTableHeader(oWorkItem);
				}
			}else {
				for (var i = 0; i < this.aWorkItems.length; i++){
					this.aWorkItems[i].Selected = false;
				}				
			}
			
			this.refreshModel();
		}
	},
	
	lookUpWorkItem: function(oWorkItem) {
		for (var i = 0; i < this.aWorkItems.length; i++){
			if (this.aWorkItems[i].SAP__Origin == oWorkItem.SAP__Origin &&
					this.aWorkItems[i].InstanceID == oWorkItem.InstanceID)
				return this.aWorkItems[i];
		}
		var oWorkItemCopy = Object.create(oWorkItem);
		if (oWorkItemCopy.CustomAttributeData && oWorkItemCopy.CustomAttributeData.__list) {
			oWorkItemCopy.CustomAttributeData = oWorkItemCopy.CustomAttributeData.__list;
		}
		this.aWorkItems.push(oWorkItemCopy);
		return oWorkItemCopy;
	},
	
	refreshModel: function() {
		var oModel = new sap.ui.model.json.JSONModel(this.aWorkItems);
		this.getView().byId("idMultiSelectTable").setModel(oModel, "multiSelectSummaryModel");		
	},
	
    handleNavToDetail: function(oEvent){
    	if (oEvent.getParameter("name") === "multi_select_summary") {
    		this.aWorkItems = [];
    		this.refreshModel();
    		this.initTableHeader();
    		
    		if (!this.bInited) {
    			this.bInited = true;
    			
        		var oView = this.getView();
        		oView.byId("idMultiSelectTable").bindItems("multiSelectSummaryModel>/", oView.byId("LIST_ITEM"));        		
    		}    		
    	}
    },
    
    onItemSelect: function(oEvent) {
		var oMultiSelectEvent = { };
		oMultiSelectEvent.Source = "MultiSelectSummary";
		oMultiSelectEvent.Selected = oEvent.getParameter("selected");
		oMultiSelectEvent.WorkItems = [oEvent.getSource().getBindingContext("multiSelectSummaryModel").getProperty()]; 
		sap.ca.scfld.md.app.Application.getImpl().getComponent().getEventBus().publish("cross.fnd.fiori.inbox", "multiselect", oMultiSelectEvent);	
    },
    
    updateTableHeader: function(oWorkItem) {
    	var oTable = this.oView.byId("idMultiSelectTable");
    	if (oWorkItem.CustomNumberValue && !this.oCustomAttributes.Number) {
    		if (!this.oCustomerNumberCol) {
    			this.oCustomerNumberCol = new sap.m.Column({header : new sap.m.Label({text : oWorkItem.CustomNumberLabel})});	
    		} else if (this.oCustomerNumberCol.getHeader().getText() !== oWorkItem.CustomNumberLabel) {
    			this.oCustomerNumberCol.getHeader().setText(oWorkItem.CustomNumberLabel);
    		}
    		oTable.addColumn(this.oCustomerNumberCol);
			this.oCustomAttributes.Number = true;
    	}
    	if (oWorkItem.CustomNumberUnitValue && !this.oCustomAttributes.NumberUnit) {
    		if (!this.oCustomerNumberUnitCol) {
    			this.oCustomerNumberUnitCol = new sap.m.Column({header : new sap.m.Label({text : oWorkItem.CustomNumberUnitLabel})});	
    		} else if (this.oCustomerNumberUnitCol.getHeader().getText() !== oWorkItem.CustomNumberUnitLabel) {
    			this.oCustomerNumberUnitCol.getHeader().setText(oWorkItem.CustomNumberUnitLabel);
    		}
    		oTable.addColumn(this.oCustomerNumberUnitCol);
			this.oCustomAttributes.NumberUnit = true;
    	}
    	if (oWorkItem.CustomObjectAttributeValue && !this.oCustomAttributes.Object) {
    		if (!this.oCustomObjectAttributeCol) {
    			this.oCustomObjectAttributeCol = new sap.m.Column({header : new sap.m.Label({text : oWorkItem.CustomObjectAttributeLabel})});	
    		} else if (this.oCustomObjectAttributeCol.getHeader().getText() !== oWorkItem.CustomObjectAttributeLabel) {
    			this.oCustomObjectAttributeCol.getHeader().setText(oWorkItem.CustomObjectAttributeLabel);
    		}
    		oTable.addColumn(this.oCustomObjectAttributeCol);
			this.oCustomAttributes.Object = true;
    	}    	
    },
    
    initTableHeader: function() {
    	if (this.oCustomAttributes) {	
    		if (this.oCustomAttributes.Number || this.oCustomAttributes.Unit || this.oCustomAttributes.Object) {
    			var oTable = this.oView.byId("idMultiSelectTable");
    			var aColumns = oTable.getColumns();
    			for (var i = 0; i < aColumns.length; i++) {
    				if (aColumns[i] === this.oCustomerNumberCol || aColumns[i] === this.oCustomerNumberUnitCol || 
    						aColumns[i] === this.oCustomObjectAttributeCol) {
    					oTable.removeColumn(aColumns[i]);
    				}
    			}
    		}
    	}
    	this.oCustomAttributes = {};
    }
});