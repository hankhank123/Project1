/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/model/Filter","sap/ui/model/FilterOperator","sap/ui/model/Sorter","sap/m/Token","cross/fnd/fiori/inbox/util/EmployeeCard"],function(F,a,S,T,E){"use strict";sap.ui.controller("cross.fnd.fiori.inbox.view.S2_FilterBar",{onInit:function(){this.getView().setModel(sap.ca.scfld.md.app.Application.getImpl().AppI18nModel,"i18n");this._oTaskListController=this.getView().getViewData().parentController;this._oTableOperations=this.getView().getViewData().oTableOperations;this._tableHelper=this.getView().getViewData().oTableHelper;this._oResourceBundle=this.getView().getModel("i18n").getResourceBundle();this._oFilterBar=this.byId("filterBar");this._tableHelper.setFilterbar(this,this._oFilterBar);this._oTaskListController.setFilterBar(this._oFilterBar);this._addSearchField();this._initializeFilterModel();this._oFilterBar.registerFetchData(this._fetchData);this._oFilterBar.registerApplyData(this._applyData);this._oFilterBar.registerGetFiltersWithValues(this._getFiltersWithValues);this._oFilterBar.fireInitialise();this.sCreatedByUniqueId=this.createId()+"DLG_CREATED_BY";this.oDataManager=sap.ca.scfld.md.app.Application.getImpl().getComponent().getDataManager();this._MAX_CREATED_BY=100;$.when(this._oTaskListController._loadCustomAttributesDeferredForTasks,this._oTaskListController._loadCustomAttributesDeferredForTaskDefs).then($.proxy(function(){var m=this.byId("taskdefinitionFilter");var t=this._oTaskListController._getTaskDefinitionFilters();if(t){t=[t];}m.bindItems({path:"taskDefinitions>/TaskDefinitionCollection",filters:t,factory:this._taskDefinitionListFactory});this._oFilterBar.setStandardItemText(this._oTaskListController._getScenrio());this._oFilterBar.setPersistencyKey(this._oTaskListController._getScenrioId());this._oFilterBar._initPersonalizationService();this._applyData.call(this._oFilterBar,{filter:[{name:"taskdefinition",selectedKeys:this._oTaskListController._getTaskDefinitions()}]});this._oFilterBar.fireSearch();},this));},_taskDefinitionListFactory:function(i,c){var e=new sap.ui.core.Item({key:"{taskDefinitions>TaskDefinitionID}",text:"{taskDefinitions>TaskName}"});return e;},onExit:function(){this._customColumns={previousVariantId:undefined};this._customFilters={};},_addSearchField:function(){var s=this._oFilterBar.getBasicSearch();if(!s){this._oBasicSearch=new sap.m.SearchField({showSearchButton:true,search:[this.onSearchPressed,this]});this._oFilterBar.setBasicSearch(this._oBasicSearch);}},_initializeFilterModel:function(){var v=new sap.ui.model.json.JSONModel({StatusCollection:[{statusKey:"READY",statusText:this._oResourceBundle.getText("filter.status.new"),rank:"1"},{statusKey:"IN_PROGRESS",statusText:this._oResourceBundle.getText("filter.status.inProgress"),rank:"2"},{statusKey:"RESERVED",statusText:this._oResourceBundle.getText("filter.status.reserved"),rank:"3"},{statusKey:"EXECUTED",statusText:this._oResourceBundle.getText("filter.status.awaitingConfirmation"),rank:"4"}],PriorityCollection:[{priorityKey:"VERY_HIGH",priorityText:this._oResourceBundle.getText("view.Workflow.priorityVeryHigh"),rank:"1"},{priorityKey:"HIGH",priorityText:this._oResourceBundle.getText("view.Workflow.priorityHigh"),rank:"2"},{priorityKey:"MEDIUM",priorityText:this._oResourceBundle.getText("view.Workflow.priorityMedium"),rank:"3"},{priorityKey:"LOW",priorityText:this._oResourceBundle.getText("view.Workflow.priorityLow"),rank:"4"}],DueDateDateDp:{valueFormat:"yyyy/MM/dd"},CreationDateDrs:{delimiter:"-",valueFormat:"yyyy/MM/dd"}});v.setDefaultBindingMode("TwoWay");this.getView().setModel(v,"filter");},_setinitialStatusFilters:function(){this._oTableOperations.addFilter(new F({path:"Status",operator:sap.ui.model.FilterOperator.EQ,value1:"READY"}),"Status");this._oTableOperations.addFilter(new F({path:"Status",operator:sap.ui.model.FilterOperator.EQ,value1:"RESERVED"}),"Status");this._oTableOperations.addFilter(new F({path:"Status",operator:sap.ui.model.FilterOperator.EQ,value1:"IN_PROGRESS"}),"Status");this._oTableOperations.addFilter(new F({path:"Status",operator:sap.ui.model.FilterOperator.EQ,value1:"EXECUTED"}),"Status");},onChange:function(e){if(this._oTaskListController._loadCustomAttributesDeferredForTasks.state()==="resolved"&&this._oTaskListController._loadCustomAttributesDeferredForTaskDefs.state()==="resolved"){this._onChangeInternal(e);}else{$.when(this._oTaskListController._loadCustomAttributesDeferredForTasks,this._oTaskListController._loadCustomAttributesDeferredForTaskDefs).then($.proxy(function(){this._onChangeInternal(e);},this));}},_onChangeInternal:function(e){var f=e.getSource().getName();if(f==="taskdefinition"){this._tableHelper.hideCustomAttributeColumns(false);var c=this._oFilterBar.determineControlByName(f);this._tableHelper.showCustomAttributeColumns(c.getSelectedKeys());}this._oFilterBar.fireFilterChange(e);},onFBFilterChange:function(){this._oTableOperations.resetFilters();var f=this._oFilterBar.getAllFilterItems(true);var c;if(f){for(var i=0;i<f.length;i++){c=this._oFilterBar.determineControlByFilterItem(f[i]);this._addFilterFor(c,f[i].getName());}}this._oTableOperations.applyTableOperations();this._oFilterBar._updateToolbarText();},_addFilterFor:function(c,n){if(n==="status"||n==="priority"||n==="taskdefinition"){var k=c.getSelectedKeys();if(k.length>0){var p="Status";if(n==="priority"){p="Priority";}else if(n==="taskdefinition"){p="TaskDefinitionID";}for(var i=0;i<k.length;i++){this._oTableOperations.addFilter(new F({path:p,operator:a.EQ,value1:k[i]}),p);this._oTableOperations.addTDKey(k[i]);}}else{if(n==="status"){this._setinitialStatusFilters();}}}else if(n==="duedate"){var d=c.getDateValue();if(d!==null){d.setDate(d.getDate()+1);this._oTableOperations.addFilter(new F({path:"CompletionDeadLine",operator:a.LT,value1:d}),"CompletionDeadLine");this._oTableOperations.addFilter(new F({path:"CompletionDeadLine",operator:a.NE,test:function(V){return(V!=null&&V.toString().trim()!=null);}}),"CompletionDeadLine");}}else if(n==="tasktitle"){var o;if(c.getValue()!==""){o=a.Contains;this._oTableOperations.addFilter(new F({path:"TaskTitle",operator:o,value1:c.getValue()}),"TaskTitle");}var t=c.getTokens();for(var j=0;j<t.length;j++){if(t[j].data().range.exclude){o=a.NE;}else{o=t[j].data().range.operation;}this._oTableOperations.addFilter(new F({path:"TaskTitle",operator:o,value1:t[j].data().range.value1,value2:t[j].data().range.value2}),"TaskTitle");}}else if(n==="creationdate"){var f=c.getDateValue();var s=c.getSecondDateValue();if(f!==null){s.setDate(s.getDate()+1);this._oTableOperations.addFilter(new F({path:"CreatedOn",operator:a.BT,value1:f,value2:s}),"CreatedOn");}}else if(n==="createdby"){var v=c.getValue();if(v!==null&&v!==""){var C=new F({path:"CreatedBy",operator:a.Contains,value1:v});var b=new F({path:"CreatedByName",operator:a.Contains,value1:v});this._oTableOperations.addFilter(C,"CreatedBy");this._oTableOperations.addFilter(b,"CreatedBy");}var t=c.getTokens();for(var j=0;j<t.length;j++){v=t[j].data().range.value1;var e=new F({path:"CreatedBy",operator:a.EQ,value1:v});this._oTableOperations.addFilter(e,"CreatedBy");}}else{if(c.sCustomAttributeType==="Edm.DateTime"){var g=c.getDateValue();var h=c.getSecondDateValue();if(g!==null){h.setDate(h.getDate()+1);g=g.getTime();h=h.getTime();this._oTableOperations.addFilter(new F({path:c.getName(),operator:a.BT,value1:g,value2:h,comparator:c.fnCustomAttributeComparator}),c.getName());}}else if(c.sCustomAttributeType==="Edm.Time"){if(c.getDateValue()!=null){var l=c.getDateValue().getTime()-(c.getDateValue().getTimezoneOffset()-(new Date()).getTimezoneOffset())*60000;this._oTableOperations.addFilter(new F({path:c.getName(),operator:a.EQ,value1:l,comparator:c.fnCustomAttributeComparator}),c.getName());}}else{var o;if(c.getValue()!==""){o=a.Contains;this._oTableOperations.addFilter(new F({path:c.getName(),operator:o,value1:c.getValue()}),c.getName());}var m=c.getTokens();for(var j=0;j<m.length;j++){if(m[j].data().range.exclude){o=a.NE;}else{o=m[j].data().range.operation;}if(c.fnCustomAttributeComparator!=null){this._oTableOperations.addFilter(new F({path:m[j].data().range.keyField,operator:o,value1:m[j].data().range.value1,value2:m[j].data().range.value2,comparator:c.fnCustomAttributeComparator}),m[j].data().range.keyField);}else{this._oTableOperations.addFilter(new F({path:m[j].data().range.keyField,operator:o,value1:m[j].data().range.value1,value2:m[j].data().range.value2}),m[j].data().range.keyField);}}}}},onSearchPressed:function(e){var s=this._oBasicSearch.getValue();this._oTableOperations.setSearchTerm(s.trim());this.onFBFilterChange();},_fetchData:function(){var g;var J;var o=[];var I=this.getFilterGroupItems();for(var i=0;i<I.length;i++){J={};g=null;if(I[i].getGroupName){g=I[i].getGroupName();J.group_name=g;}J.name=I[i].getName();var c=this.determineControlByFilterItem(I[i]);if(c){if(J.name==="status"||J.name==="priority"||J.name==="taskdefinition"){J.selectedKeys=c.getSelectedKeys();}else if(J.name==="duedate"){J.dueDate=c.getDateValue();}else if(J.name==="creationdate"){J.firstDate=c.getDateValue();J.secondDate=c.getSecondDateValue();}else{if(c.sCustomAttributeType==="Edm.DateTime"){J.date1=c.getDateValue();J.date2=c.getSecondDateValue();}else if(c.sCustomAttributeType==="Edm.Time"){J.date=c.getDateValue();}else{var t=c.getTokens();var b=[];for(var j=0;j<t.length;j++){b[j]={selected:t[j].getSelected(),key:t[j].getKey(),text:t[j].getText(),data:t[j].data()};}J.tokens=b;J.value=c.getValue();}}}o.push(J);}var s=this.getParent().getController()._oTableOperations.getSorter();var d;if(s.length>0){d={path:s[0].sPath,desc:s[0].bDescending};}return{filter:o,sort:d};},_applyData:function(d){var J;if(d instanceof Array){J=d;}else if(d.filter){J=d.filter;}else{J=d;}var g;var o;for(var i=0;i<J.length;i++){g=null;o=J[i];if(o.group_name){g=o.group_name;}var c=this.determineControlByName(o.name,g);if(c){if(o.name==="status"||o.name==="priority"||o.name==="taskdefinition"){c.setSelectedKeys(o.selectedKeys);c.fireSelectionFinish();}else if(o.name==="duedate"){if(o.dueDate!==null){c.setDateValue(new Date(o.dueDate));}else{c.setDateValue(null);}}else if(o.name==="creationdate"){if(o.firstDate!==null&&o.secondDate!==null){c.setDateValue(new Date(o.firstDate));c.setSecondDateValue(new Date(o.secondDate));}else{c.setDateValue(null);c.setSecondDateValue(null);}}else{if(c.sCustomAttributeType==="Edm.DateTime"){if(o.date1!==null&&o.date2!==null){c.setDateValue(new Date(o.date1));c.setSecondDateValue(new Date(o.date2));}else{c.setDateValue(null);c.setSecondDateValue(null);}}else if(c.sCustomAttributeType==="Edm.Time"){if(o.date!==null){c.setDateValue(new Date(o.date));}else{c.setDateValue(null);}}else{var t=[];for(var j=0;j<o.tokens.length;j++){t[j]=new sap.m.Token({selected:o.tokens[j].selected,key:o.tokens[j].key,text:o.tokens[j].text}).data(o.tokens[j].data);}c.setTokens(t);c.setValue(o.value);}}}}if(!(d instanceof Array)&&d.sort){this.getParent().getController()._oTableOperations.addSorter(new S(d.sort.path,d.sort.desc));}},_getFiltersWithValues:function(){var i;var c;var f=this.getFilterGroupItems();var b=[];var n;for(i=0;i<f.length;i++){n=f[i].getName();c=this.determineControlByFilterItem(f[i]);if(c){if((n==="status"||n==="priority"||n==="taskdefinition")){if(c.getSelectedKeys().length>0){b.push(f[i]);}}else if(n==="duedate"){if(c.getDateValue()){b.push(f[i]);}}else if(n==="creationdate"){if(c.getDateValue()&&c.getSecondDateValue()){b.push(f[i]);}}else if(n==="tasktitle"){if((c.getTokens()&&c.getTokens().length>0)||c.getValue()){b.push(f[i]);}}else if(c.sCustomAttributeType==="Edm.DateTime"){if(c.getDateValue()&&c.getSecondDateValue()){b.push(f[i]);}}else if(c.sCustomAttributeType==="Edm.Time"){if(c.getDateValue()){b.push(f[i]);}}else if((c.getTokens()&&c.getTokens().length>0)||c.getValue()){b.push(f[i]);}}}return b;},onFBVariantLoaded:function(e){var c=e.getSource().getCurrentVariantId();if(c===""){e.getSource().fireSearch(e);return;}},onValueHelpRequest:function(e,d){var s=e.getSource();var D=(s.getName()==="tasktitle")?this._oResourceBundle.getText("filter.taskTitle"):d;var v=new sap.ui.comp.valuehelpdialog.ValueHelpDialog({title:D,supportRanges:true,supportRangesOnly:true,key:s.getName(),descriptionKey:D,stretch:sap.ui.Device.system.phone,ok:function(C){var f=C.getParameter("tokens");s.setTokens(f);s.setValue("");v.close();},cancel:function(C){v.close();},afterClose:function(){v.destroy();}});v.setRangeKeyFields([{label:D,key:s.getName()}]);var t=s.getTokens();if(s.getValue()!==""){var b=new T({key:"range_"+t.length,selected:false,text:"*"+s.getValue()+"*"});b.data({range:{exclude:false,keyField:s.getName(),operation:a.Contains,value1:s.getValue()}});t.push(b);}v.setTokens(t);var o=[];var c=s.getName()==="tasktitle"?"Edm.String":s.data().type;switch(c){case"Edm.Boolean":o.push(sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation.EQ);break;case"Edm.DateTime":case"Edm.Time":case"Edm.DateTimeOffset":case"Edm.Decimal":case"Edm.Double":case"Edm.Int16":case"Edm.Int32":case"Edm.Int64":case"Edm.Single":o.push(sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation.BT);o.push(sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation.EQ);o.push(sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation.GE);o.push(sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation.GT);o.push(sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation.LE);o.push(sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation.LT);break;case"Edm.String":o.push(sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation.Contains);o.push(sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation.StartsWith);o.push(sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation.EndsWith);o.push(sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation.EQ);break;default:o.push(sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation.BT);o.push(sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation.Contains);o.push(sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation.StartsWith);o.push(sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation.EndsWith);o.push(sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation.EQ);o.push(sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation.GE);o.push(sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation.GT);o.push(sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation.LE);o.push(sap.ui.comp.valuehelpdialog.ValueHelpRangeOperation.LT);break;}v.setIncludeRangeOperations(o,"text");if(s.$().closest(".sapUiSizeCompact").length>0){v.addStyleClass("sapUiSizeCompact");}else{v.addStyleClass("sapUiSizeCozy");}v.open();},onValueHelpCreatedBy:function(e,d){if(!this.oDialog){this.oDialog=sap.ui.xmlfragment(this.sCreatedByUniqueId,"cross.fnd.fiori.inbox.frag.UserPickerDialog",this);this.getView().addDependent(this.oDialog);}var s=sap.ui.core.Fragment.byId(this.sCreatedByUniqueId,"LST_SEARCH_USERS");if(s){s.setMode("MultiSelect");s.setIncludeItemInSelection(true);s.setRememberSelections(false);}this.oDialog.open();},onSearchOfCreatedBy:function(e){var s=e.getSource().getValue();this.searchUsers(s);},searchUsers:function(s){var c=sap.ui.core.Fragment.byId(this.sCreatedByUniqueId,"LST_SEARCH_USERS");if(s==undefined||s.trim().length==0){if(c.getModel("userModel")){c.getModel("userModel").setProperty("/users",[]);}return;}var o=sap.ui.core.Fragment.byId(this.sCreatedByUniqueId,"LST_SEARCH_USERS");var u=o.getModel("userModel");if(!u){o.setModel(new sap.ui.model.json.JSONModel(),"userModel");}var O;var t=this;var f=function(r){O=r[0].SAP__Origin;if(O){t._oTaskListController._oTable.setBusyIndicatorDelay(50000);o.setBusyIndicatorDelay(0);o.setBusy(true);o.removeSelections();this.oDataManager.searchUsers(O,s,this._MAX_CREATED_BY,jQuery.proxy(function(r){c.getModel("userModel").setProperty("/users",r);o.setBusy(false);t._oTaskListController._oTable.setBusyIndicatorDelay(0);},this));}};var b=function(e){this.oDataManager.oDataRequestFailed(e);};this.oDataManager.readSystemInfoCollection(jQuery.proxy(f,this),jQuery.proxy(b,this));},putUserTokenIntoCreatedByFilter:function(u){if(u){var c=u.getBindingContext("userModel");var d=c.getProperty("DisplayName");var U=c.getProperty("UniqueName");var b=this.byId("createdbyFilter");var t=b.getTokens();for(var i=0;i<t.length;i++){if(t[i].userUniqueName===U){return;}}var e=new T({key:"range_"+t.length,selected:false,text:d});e.data({range:{exclude:false,keyField:"CreatedBy",operation:a.EQ,value1:U}});t.push(e);b.setTokens(t);}},resetCreatedByValueHelp:function(){var s=sap.ui.core.Fragment.byId(this.sCreatedByUniqueId,"search_createdby_field");s.setValue("");var o=sap.ui.core.Fragment.byId(this.sCreatedByUniqueId,"LST_SEARCH_USERS");if(o.getModel("userModel")){o.getModel("userModel").setProperty("/users",{});}},handleCreatedByPopOverOk:function(e){var s=sap.ui.core.Fragment.byId(this.sCreatedByUniqueId,"LST_SEARCH_USERS");var b=s.getSelectedItems();for(var i=0;i<b.length;i++){this.putUserTokenIntoCreatedByFilter(b[i]);}this.handleCreatedByPopOverCancel(e);},handleCreatedByPopOverCancel:function(e){var d=e.getSource().getParent();this.resetCreatedByValueHelp();if(d){d.close();}},handleLiveChange:function(e){if(e.getSource().getValue()===""){var s=sap.ui.core.Fragment.byId(this.sCreatedByUniqueId,"LST_SEARCH_USERS");s.removeSelections();if(s.getModel("userModel")){s.getModel("userModel").setProperty("/users",{});}}},handleUserDetailPress:function(e){var s=e.getSource();var p=s.getBindingContextPath();var c=p.substring(7,p.length);var b=s.getParent().getModel("userModel").getData().users[c];if(sap.ui.Device.system.tablet&&sap.ui.Device.orientation.portrait){E.displayEmployeeCard(e.getSource()._detailIcon,b);}else{E.displayEmployeeCard(e.getSource(),b);}},onClearPressed:function(e){this._oFilterBar.setCurrentVariantId(e.getSource().getCurrentVariantId());}});});
