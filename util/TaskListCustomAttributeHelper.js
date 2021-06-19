/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object","sap/m/Column"],function(O,C){return O.extend("cross.fnd.fiori.inbox.util.TaskListCustomAttributeHelper",{constructor:function(c,v,t,g,s,T){this._oView=v;this._oController=c;this._oTable=t;this._oGrouping=g;this._oSorting=s;this._oTableOperations=T;this._customColumns={};this._customFilters={};this._visibleCustomColumns=[];this._visibleCustomFilters=[];},showCustomAttributeColumns:function(t){var c=this._getCustomAttributes(t);var a,b;for(var i=0;i<c.length;i++){a=this._addColumn(c[i]);if(a===null){continue;}this._oTableOperations.addSearchableField(encodeURIComponent(c[i].Name));this._visibleCustomColumns.push({name:c[i].Name,columnObj:a});b=this._addCustomFilterItem(c[i]);b.setVisible(true);this._visibleCustomFilters.push(b);this._oGrouping.showCustomGroupItem(c[i].Name);this._oSorting.showCustomSortItem(c[i].Name);}if(sap.ushell.Container){this._oController._oTablePersoController.refresh();}if(c.length>0&&!sap.ui.Device.system.phone){this._oController.byId("statusColumn").setWidth("7%");this._oController.byId("priorityColumn").setWidth("7%");this._oController.byId("createdByColumn").setWidth("10%");this._oController.byId("createdOnColumn").setWidth("9%");this._oController.byId("dueDateColumn").setWidth("9%");}this._oTable.bindItems(this._oTable.getBindingInfo("items"));this._oTable.getBinding("items").refresh();},hideCustomAttributeColumns:function(r){var c,a;if(this._visibleCustomColumns.length>0&&!sap.ui.Device.system.phone){this._oController.byId("statusColumn").setWidth("");this._oController.byId("priorityColumn").setWidth("");this._oController.byId("createdByColumn").setWidth("");this._oController.byId("createdOnColumn").setWidth("");this._oController.byId("dueDateColumn").setWidth("");}while(this._visibleCustomColumns.length){c=this._visibleCustomColumns.pop();this._oTable.removeColumn(c.columnObj.column);this._oTableOperations.removeSearchableField(encodeURIComponent(c.name));var t=this._oTable.getBindingInfo("items").template;t.removeCell(c.columnObj.cell);a=this._visibleCustomFilters.pop();var o=this._oFilterBar.determineControlByName(a.getName());if(typeof o.setTokens==="function")o.setTokens([]);o.setValue("");a.setVisible(false);this._oGrouping.hideCustomGroupItem(c.name);this._oSorting.hideCustomSortItem(c.name);}if(r){if(sap.ushell.Container){this._oController._oTablePersoController.refresh();}this._oTable.bindItems(this._oTable.getBindingInfo("items"));this._oTable.getBinding("items").refresh();}},setFilterbar:function(f,a){this._filterbarController=f;this._oFilterBar=a;},destroy:function(){var c;for(var k in this._customColumns){c=this._customColumns[k];c.column.destroy();c.cell.destroy();}for(k in this._customFilters){this._customFilters[k].destroy();}this._oGrouping.destroy();this._oSorting.destroy();},getVisibleCustomFilters:function(){return this._visibleCustomFilters;},_getCustomAttributes:function(t){var c=[];var m=[];var a=this._oView.getModel("taskDefinitions");for(var i=0;i<t.length;i++){c=a.getProperty("/Columns/"+t[i].toUpperCase());if(c){if(i===0){m=m.concat(c);}else{var d=false;for(var j=0;j<c.length;j++){for(var k=0;k<m.length;k++){if(c[j].Name===m[k].Name){d=true;break;}}if(!d){m.push(c[j]);}else{d=false;}}}}}return m;},_addColumn:function(c){var i=["CustomNumberValue","CustomNumberUnitValue","CustomObjectAttributeValue"];if(i.indexOf(c.Name)===-1){var a=this._customColumns[c.Name];if(!a){a=this._addCustomAttributeColumn(c);this._customColumns[c.Name]=a;}this._oTable.addColumn(a.column);var t=this._oTable.getBindingInfo("items").template;t.addCell(a.cell);return a;}else{return null;}},_addCustomFilterItem:function(c){var a=this._customFilters[c.Name];if(!a){a=this._addCustomFilter(c);this._customFilters[c.Name]=a;}return a;},_addCustomAttributeColumn:function(c){var i=(decodeURIComponent(c.TaskDefinitionID)+c.Name).replace(/\//g,"");var o=new C(i+"Column",{header:new sap.m.Label(i+"Lbl",{text:c.Label}),popinDisplay:sap.m.PopinDisplay.Inline,minScreenWidth:"Tablet",demandPopin:true});var a=new sap.m.Text(i+"Txt",{text:"{parts:[{path:'taskList>"+encodeURIComponent(c.Name)+"'}], formatter:'cross.fnd.fiori.inbox.Conversions.fnCustomAttributeFormatter'}"});a.data({Type:c.Type});this._oGrouping.addCustomGroupItem(i,c.Name,c.Label);this._oSorting.addCustomSortItem(i,c.Name,c.Label);return{cell:a,column:o};},_addCustomFilter:function(c){var i=(decodeURIComponent(c.TaskDefinitionID)+c.Name).replace(/\//g,"");var t=c.Type;if(t!=null&&t.indexOf("Edm.")!==0)t=cross.fnd.fiori.inbox.util.CustomAttributeComparator.fnMapBPMTypes(t);var a,o;if(t==="Edm.DateTime"){o=new sap.m.DateRangeSelection(i+"Filter",{name:encodeURIComponent(c.Name),delimiter:"-",change:[this._filterbarController.onChange,this._filterbarController]});o.sCustomAttributeType=t;o.fnCustomAttributeComparator=cross.fnd.fiori.inbox.util.CustomAttributeComparator.getCustomAttributeComparator(t);a=new sap.ui.comp.filterbar.FilterItem(i+"FI",{label:c.Label,name:encodeURIComponent(c.Name),partOfCurrentVariant:true,control:o});}else if(t==="Edm.Time"){o=new sap.m.TimePicker(i+"Filter",{name:encodeURIComponent(c.Name),change:[this._filterbarController.onChange,this._filterbarController]});o.sCustomAttributeType=t;o.fnCustomAttributeComparator=cross.fnd.fiori.inbox.util.CustomAttributeComparator.getCustomAttributeComparator(t);a=new sap.ui.comp.filterbar.FilterItem(i+"FI",{label:c.Label,name:encodeURIComponent(c.Name),partOfCurrentVariant:true,control:o});}else{o=new sap.m.MultiInput(i+"Filter",{name:encodeURIComponent(c.Name),valueHelpRequest:[c.Label,this._filterbarController.onValueHelpRequest],valueHelpOnly:false,change:[this._filterbarController.onChange,this._filterbarController],tokenChange:[this._filterbarController.onChange,this._filterbarController]}).data({type:t});o.sCustomAttributeType=t;o.fnCustomAttributeComparator=cross.fnd.fiori.inbox.util.CustomAttributeComparator.getCustomAttributeComparator(t);a=new sap.ui.comp.filterbar.FilterItem(i+"FI",{label:c.Label,name:encodeURIComponent(c.Name),partOfCurrentVariant:true,control:o});}this._oFilterBar.addFilterItem(a);return a;}});});
