/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("cross.fnd.fiori.inbox.util.FilterItemsCreator");cross.fnd.fiori.inbox.util.FilterItemsCreator={createFilterCategory:function(t,m){var i=true;if(arguments.length==2){i=m;}return new sap.m.ViewSettingsFilterItem({text:t,multiSelect:i});},createFilterItem:function(k,t,c){var f=new sap.m.ViewSettingsItem({text:t,key:k});if(this._findFilterKey(k,c)){f.setSelected(true);}return f;},_findFilterKey:function(f,c){for(var a in c){var b=c[a];for(var i=0;i<b.length;i++){if(b[i]===f){return true;}}}return false;}};
