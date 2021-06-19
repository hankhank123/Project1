/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("sap.ca.ui.utils.resourcebundle");jQuery.sap.require("cross.fnd.fiori.inbox.util.EmployeeCard");sap.ui.controller("cross.fnd.fiori.inbox.view.AddInbox",{_oDialog:null,_oDataManager:null,_bRefreshOnCloseDialog:null,_oList:null,onInit:function(){this.getView().setModel(sap.ca.scfld.md.app.Application.getImpl().AppI18nModel,"i18n");this._oDialog=this.getView().byId("DLG_ADD_INBOX");this._oList=this.getView().byId("LST_USERS");this._oDataManager=sap.ca.scfld.md.app.Application.getImpl().getComponent().getDataManager();if(sap.ui.Device.system.phone){this._oDialog.setStretch(true);}},onCancelDialog:function(e){if(this._bRefreshOnCloseDialog){this._oDataManager.refreshListOnAddInboxDone(e);}this._oDialog.close();},updateSubstitutionRuleSuccess:function(s){if(s>0){this._bRefreshOnCloseDialog=true;}this._setListBusyLoader(false);cross.fnd.fiori.inbox.util.AddInbox.refreshDataAfterUpdateSubstitutionRule();},updateSubstitutionRuleError:function(){this._setListBusyLoader(false);},handleChange:function(e){var b=e.getSource().getBindingContext();var a=this._oDialog.getModel();var A=a.getProperty(b.getPath(),b);var E=(e.getParameter('state'))?true:false;if(A.aDisabledRules.length>0||A.aEnabledRules.length>0){this._setListBusyLoader(true);this._oDataManager.updateSubstitutionRule(A,E,jQuery.proxy(this.updateSubstitutionRuleSuccess,this),jQuery.proxy(this.updateSubstitutionRuleError,this));}},onBeforeOpenDialog:function(){this._bRefreshOnCloseDialog=null;},onSelectUserLink:function(e){var b=e.getSource().getBindingContext();var d=this._oDialog.getModel();var s=cross.fnd.fiori.inbox.Conversions.getSelectedControl(e);this._setListBusyLoader(true);this._oDataManager.readUserInfo(d.getProperty("SAP__Origin",b),d.getProperty("User",b),jQuery.proxy(this._showEmployeeCard,this,s),jQuery.proxy(function(){this._setListBusyLoader(false);},this),true);},_showEmployeeCard:function(c,r){this._setListBusyLoader(false);cross.fnd.fiori.inbox.util.EmployeeCard.displayEmployeeCard(c,r);},_setListBusyLoader:function(s){if(s){this._oList.setBusyIndicatorDelay(1000);}this._oList.setBusy(s);}});