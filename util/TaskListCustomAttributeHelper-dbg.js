/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/Column"
], function(Object, Column) {
	return Object.extend("cross.fnd.fiori.inbox.util.TaskListCustomAttributeHelper", {

		constructor: function(oController, oView, oTable, oGrouping, oSorting, oTableOperations) {
			this._oView = oView;
			this._oController = oController;
			this._oTable = oTable;
			this._oGrouping = oGrouping;
			this._oSorting = oSorting;
			this._oTableOperations = oTableOperations;
			this._customColumns = {};
			this._customFilters = {};
			this._visibleCustomColumns = [];
			this._visibleCustomFilters = [];
		},
		
		showCustomAttributeColumns: function(taskDefinitions){
			var customAttributeList = this._getCustomAttributes(taskDefinitions);
			var column, customFilter;
			for (var i=0; i<customAttributeList.length; i++) {
				column = this._addColumn(customAttributeList[i]);
				if(column === null){
					continue;
				}
				//Add to searchable fields
				this._oTableOperations.addSearchableField(encodeURIComponent(customAttributeList[i].Name));
				this._visibleCustomColumns.push({name:customAttributeList[i].Name, columnObj:column});
				customFilter = this._addCustomFilterItem(customAttributeList[i]);
				customFilter.setVisible(true);
				this._visibleCustomFilters.push(customFilter);
				//Make Visible the grouping for custom attributes
				this._oGrouping.showCustomGroupItem(customAttributeList[i].Name);
				//Make Visible the sorting for custom attributes
				this._oSorting.showCustomSortItem(customAttributeList[i].Name);
			}
			if (sap.ushell.Container) {
				this._oController._oTablePersoController.refresh();
			}
			//Adjust width of standrad attribute column based on whether custom attributes are visible or not.
			if(customAttributeList.length > 0 && !sap.ui.Device.system.phone){
			    this._oController.byId("statusColumn").setWidth("7%");
			    this._oController.byId("priorityColumn").setWidth("7%");
			    this._oController.byId("createdByColumn").setWidth("10%");
			    this._oController.byId("createdOnColumn").setWidth("9%");
			    this._oController.byId("dueDateColumn").setWidth("9%");
			}
			this._oTable.bindItems(this._oTable.getBindingInfo("items")); 
			this._oTable.getBinding("items").refresh();
		},

		hideCustomAttributeColumns: function(refresh){
			var column, customFilter;
			//Adjust width of standrad attribute columns based on whether custom attributes are visible or not.
			if(this._visibleCustomColumns.length > 0 && !sap.ui.Device.system.phone){
			    this._oController.byId("statusColumn").setWidth("");
			    this._oController.byId("priorityColumn").setWidth("");
			    this._oController.byId("createdByColumn").setWidth("");
			    this._oController.byId("createdOnColumn").setWidth("");
			    this._oController.byId("dueDateColumn").setWidth("");
			}
			while (this._visibleCustomColumns.length){
				column = this._visibleCustomColumns.pop();
				this._oTable.removeColumn(column.columnObj.column);
				//Remove custom attribute from searchable fields.
				this._oTableOperations.removeSearchableField(encodeURIComponent(column.name));
				var oTemplate = this._oTable.getBindingInfo("items").template;
				oTemplate.removeCell(column.columnObj.cell);
				customFilter = this._visibleCustomFilters.pop();
				var oControl = this._oFilterBar.determineControlByName(customFilter.getName());
				if (typeof oControl.setTokens === "function")
					oControl.setTokens([]);
			    oControl.setValue("");
				customFilter.setVisible(false);
				//Hide the grouping for custom attributes
				this._oGrouping.hideCustomGroupItem(column.name);
				//Hide the sorting for custom attributes
				this._oSorting.hideCustomSortItem(column.name);
			}
			if(refresh){
				if (sap.ushell.Container) {
					this._oController._oTablePersoController.refresh();
				}
				this._oTable.bindItems(this._oTable.getBindingInfo("items")); 
				this._oTable.getBinding("items").refresh();
			}
		},

		setFilterbar: function(filterbarController, filterbar){
			this._filterbarController = filterbarController;
			this._oFilterBar = 	filterbar;
		},
		
		destroy: function(){
			var columnObj;
			for (var key in this._customColumns) {
				columnObj = this._customColumns[key];
				columnObj.column.destroy();
				columnObj.cell.destroy();
			}		
			for (key in this._customFilters) {
				this._customFilters[key].destroy();
			}
			this._oGrouping.destroy();
			this._oSorting.destroy();
		},
		
		getVisibleCustomFilters: function(){
		    return this._visibleCustomFilters;	
		},
		
		//Look up custom attribute columns for each task definiton
		_getCustomAttributes:function(taskDefinitions){
			var columns = [];
			var mergedColumns = [];
			var taskDefinitionsModel = this._oView.getModel("taskDefinitions");
			for (var i=0; i<taskDefinitions.length; i++) {
				columns = taskDefinitionsModel.getProperty("/Columns/"+taskDefinitions[i].toUpperCase());
				if(columns){	
					if(i === 0){
						mergedColumns = mergedColumns.concat(columns);
					}else{
						var duplicateColumn = false;
						for (var j=0; j<columns.length; j++) {
							for (var k=0; k<mergedColumns.length; k++) {
								if(columns[j].Name === mergedColumns[k].Name){
									duplicateColumn = true;
									break;
								}
							}
							if(!duplicateColumn){
								mergedColumns.push(columns[j]);
							}else{
								duplicateColumn = false;
							}
						}
					}
				}
			}
			return mergedColumns;
		},

		//add cached column if available, else create a new column
		_addColumn: function(customAttribute){
			var ignoreAttributes = ["CustomNumberValue", "CustomNumberUnitValue", "CustomObjectAttributeValue"];
			if(ignoreAttributes.indexOf(customAttribute.Name) === -1){
				var columnObj = this._customColumns[customAttribute.Name];
				if(!columnObj){
					columnObj = this._addCustomAttributeColumn(customAttribute);
					this._customColumns[customAttribute.Name] = columnObj;
				}
				this._oTable.addColumn(columnObj.column);
				var oTemplate = this._oTable.getBindingInfo("items").template;
				oTemplate.addCell(columnObj.cell);
				return columnObj;
			}else{
				return null;
			}
		},
		
		//add cached filter if available, else create a new filter
		_addCustomFilterItem: function(customAttribute){
			var customFilterItem = this._customFilters[customAttribute.Name];
			if(!customFilterItem){
				customFilterItem = this._addCustomFilter(customAttribute);
				this._customFilters[customAttribute.Name] = customFilterItem;
			}
			return customFilterItem;
		},
		
		//Add custom attribute column to the task list table. Returns added ui columns objects
		_addCustomAttributeColumn:function(customAttribute){
			var id = (decodeURIComponent(customAttribute.TaskDefinitionID) + customAttribute.Name).replace(/\//g, "");
			var oColumn = new Column(id+"Column",{
					header : new sap.m.Label(id+"Lbl",{text : customAttribute.Label}),
					popinDisplay: sap.m.PopinDisplay.Inline,
					minScreenWidth: "Tablet",
					demandPopin: true
				});
			var oCell = new sap.m.Text(id+"Txt",
				{
				 	text:"{parts:[{path:'taskList>"+encodeURIComponent(customAttribute.Name)+"'}], formatter:'cross.fnd.fiori.inbox.Conversions.fnCustomAttributeFormatter'}"
				});
			oCell.data({
				Type : customAttribute.Type
			});
			//Add columns to grouping dialog
			this._oGrouping.addCustomGroupItem(id, customAttribute.Name, customAttribute.Label);
			//Add columns to sorting dialog
			this._oSorting.addCustomSortItem(id, customAttribute.Name, customAttribute.Label);
			return {cell:oCell,column:oColumn};
		},
		
		//Add custom filters to the filter bar
		_addCustomFilter:function(customAttribute){
			var id = (decodeURIComponent(customAttribute.TaskDefinitionID) + customAttribute.Name).replace(/\//g, "");
			var sType = customAttribute.Type;
			if (sType != null && sType.indexOf("Edm.") !== 0)
				sType = cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnMapBPMTypes(sType);
			var customFilterItem, oControl;
			if (sType === "Edm.DateTime") {
				oControl = new sap.m.DateRangeSelection(id+"Filter",
							       { 
							        name:encodeURIComponent(customAttribute.Name),
							        delimiter: "-",
							        //valueFormat:"yyyy/MM/dd", displayFormat: "dd.MM.yyyy", 
							        change: [this._filterbarController.onChange,this._filterbarController]
							       });
				oControl.sCustomAttributeType = sType;	
				oControl.fnCustomAttributeComparator = cross.fnd.fiori.inbox.util.CustomAttributeComparator.getCustomAttributeComparator(sType);                         
				customFilterItem = new sap.ui.comp.filterbar.FilterItem(id+"FI", 
							    {
							     label:customAttribute.Label,
							     name:encodeURIComponent(customAttribute.Name),
							     partOfCurrentVariant:true,
							     control: oControl
							    });
			} else if (sType === "Edm.Time") {
				oControl = new sap.m.TimePicker(id+"Filter",
							       { 
							        name:encodeURIComponent(customAttribute.Name),
							        change: [this._filterbarController.onChange,this._filterbarController]
							       });	
				oControl.sCustomAttributeType = sType;	
				oControl.fnCustomAttributeComparator = cross.fnd.fiori.inbox.util.CustomAttributeComparator.getCustomAttributeComparator(sType);                         
				customFilterItem = new sap.ui.comp.filterbar.FilterItem(id+"FI", 
							    {
							     label:customAttribute.Label,
							     name:encodeURIComponent(customAttribute.Name),
							     partOfCurrentVariant:true,
							     control: oControl
							    });							       
			} else {
				oControl =new sap.m.MultiInput(id+"Filter",
									{
										name:encodeURIComponent(customAttribute.Name),
										valueHelpRequest:[customAttribute.Label,this._filterbarController.onValueHelpRequest],
										valueHelpOnly:false,
										change:[this._filterbarController.onChange,this._filterbarController],
										tokenChange:[this._filterbarController.onChange,this._filterbarController]
									}).data({type:sType});
				oControl.sCustomAttributeType = sType;	
				oControl.fnCustomAttributeComparator = cross.fnd.fiori.inbox.util.CustomAttributeComparator.getCustomAttributeComparator(sType);                             
        		customFilterItem = new sap.ui.comp.filterbar.FilterItem(id+"FI",
								{
									label:customAttribute.Label,
									name:encodeURIComponent(customAttribute.Name),
									partOfCurrentVariant:true,
									control: oControl
								});				
			}
			this._oFilterBar.addFilterItem(customFilterItem);
			return customFilterItem;
		}
	});
});