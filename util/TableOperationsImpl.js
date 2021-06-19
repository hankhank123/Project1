/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object","sap/ui/model/Sorter","sap/ui/model/Filter","sap/ui/model/FilterOperator"],function(O,S,F,a){"use strict";return O.extend("cross.fnd.fiori.inbox.util.TableOperationsImpl",{constructor:function(s){this.sSearchTerm="";this.oGrouper=null;this.aSearchFilter=[];this.aFilterList=[];this.oFixedFilter=s.oFixedFilter;this.bGroupingChanged=false;this.bSearchChanged=false;this.bFilterChanged=!!this.oFixedFilter;this.bSortChanged=true;this.aSortList=[s.oDefaultSorter||new S("CreatedOn",true)];this.oTable=s.oTable;this.oView=s.oView;this.oFilterDict={};this.aSearchableFields=s.aSearchableFields||[];this.aTDKeys=[];},addTDKey:function(f){this.aTDKeys[this.aTDKeys.length]=f;},getTDKeys:function(){return this.aTDKeys;},addFilter:function(f,s){if(f&&s){if(this.oFilterDict[s]){if(f.sOperator===a.NE){this.oFilterDict[s].excludingFilters.push(f);}else{this.oFilterDict[s].includingFilters.push(f);}}else{this.oFilterDict[s]={includingFilters:[],excludingFilters:[]};if(f.sOperator===a.NE){this.oFilterDict[s].excludingFilters=[f];}else{this.oFilterDict[s].includingFilters=[f];}}this.aFilterList.length=0;for(var p in this.oFilterDict){if(this.oFilterDict.hasOwnProperty(p)){var b=[];if(this.oFilterDict[p].includingFilters.length>0){b.push(new F(this.oFilterDict[p].includingFilters,false));}if(this.oFilterDict[p].excludingFilters.length>0){b.push(new F(this.oFilterDict[p].excludingFilters,true));}this.aFilterList.push(new F(b,true));}}this.bFilterChanged=true;}},addSorter:function(s){var i=this._getSortListIndexByPath(s.sPath);if(i!==-1){this.aSortList.splice(i,1);}this.aSortList.unshift(s);if(this.oGrouper&&this.oGrouper.sPath===s.sPath){this.oGrouper.bDescending=s.bDescending;}this.bSortChanged=true;},applyTableOperations:function(){var A=[],b=this.oFixedFilter?[this.oFixedFilter]:[],t=this.oTable.getBinding("items");if(t){if(this.bGroupingChanged||this.bSortChanged){if(this.oGrouper){A.push(this.oGrouper);}if(this.aSortList.length>0){A=A.concat(this.aSortList);}t.sort(A);}if(this.bSearchChanged||this.bFilterChanged){if(this.aSearchFilter.length>0){b.push(new F(this.aSearchFilter,false));}if(this.aFilterList.length>0){b.push(new F(this.aFilterList,true));}if(b.length>0){t.filter(new F(b,true));}else{t.filter();}}this._resetChangeIndicators();}},getSearchFilters:function(){return this.aSearchFilter;},getSearchTerm:function(){return this.sSearchTerm;},_getSortListIndexByPath:function(p){var i;for(i=0;i<this.aSortList.length;i++){if(this.aSortList[i].sPath===p){return i;}}return-1;},getGrouping:function(){return this.oGrouper;},getSorters:function(){return this.aSortList;},getFilterTable:function(){return(this.aFilterList&&this.aFilterList.length>0)?this.aFilterList:null;},resetFilters:function(){this.aFilterList.length=0;this.aTDKeys.length=0;this.oFilterDict={};this.bFilterChanged=true;this.bSortChanged=true;},removeGrouping:function(){this.oGrouper=null;this.bGroupingChanged=true;},setGrouping:function(n){var i=this._getSortListIndexByPath(n.sPath);if(i!==-1){this.aSortList[i].bDescending=n.bDescending;}this.oGrouper=n;this.bGroupingChanged=true;},setSearchTerm:function(n){this.aSearchFilter.length=0;if(n&&n.length>0){this.sSearchTerm=n;for(var i=0;i<this.aSearchableFields.length;i++){if(this.aSearchableFields[i]==="CompletionDeadLine"||this.aSearchableFields[i]==="CreatedOn"){this.aSearchFilter.push(new F({path:this.aSearchableFields[i],test:$.proxy(function(v){var f=cross.fnd.fiori.inbox.Conversions.formatterDate(new Date(v));return f.toLowerCase().search(this.sSearchTerm.toLowerCase())!==-1;},this),value1:n}));}else if(this.aSearchableFields[i]==="Status"){this.aSearchFilter.push(new F({path:this.aSearchableFields[i],test:$.proxy(function(v){var d=cross.fnd.fiori.inbox.Conversions.formatterStatus.call(this.oView,"TODO",v);return d.toLowerCase().search(this.sSearchTerm.toLowerCase())!==-1;},this),value1:n}));}else if(this.aSearchableFields[i]==="Priority"){this.aSearchFilter.push(new F({path:this.aSearchableFields[i],test:$.proxy(function(v){var d=cross.fnd.fiori.inbox.Conversions.formatterPriority.call(this.oView,"TODO",v);return d.toLowerCase().search(this.sSearchTerm.toLowerCase())!==-1;},this),value1:n}));}else{this.aSearchFilter.push(new F(this.aSearchableFields[i],a.Contains,n));}}}else{this.sSearchTerm="";this.aSearchFilter.length=0;}this.bSearchChanged=true;},_resetChangeIndicators:function(){this.bGroupingChanged=false;this.bSearchChanged=false;this.bFilterChanged=false;this.bSortChanged=false;},addSearchableField:function(n){this.aSearchableFields.push(n);},removeSearchableField:function(n){var i=this.aSearchableFields.indexOf(n);if(i>-1){this.aSearchableFields.splice(i,1);}}});});
