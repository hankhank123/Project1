/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("cross.fnd.fiori.inbox.util.AddInbox");
jQuery.sap.require("cross.fnd.fiori.inbox.util.Substitution");

cross.fnd.fiori.inbox.util.AddInbox = (function() {
	var _oXmlView = null;
	var _oDialog = null;
	var _oList = null;
	var _sModeTakeOver = "TAKE_OVER";
	var _oDataManager = null;
	
	return {
		open: function() {
			if (!_oXmlView) {
				_oXmlView = new sap.ui.view({
					id: 		"MIB_VIEW_ADD_INBOX",
					viewName: 	"cross.fnd.fiori.inbox.view.AddInbox",
					type:		sap.ui.core.mvc.ViewType.XML
				});
			}
			
			if (!_oDialog) {
				_oDialog = _oXmlView.byId("DLG_ADD_INBOX");
			}
			
			if (!_oList) {
				_oList = _oXmlView.byId("LST_USERS");
			}
			
			if (!_oDataManager) {
				_oDataManager = sap.ca.scfld.md.app.Application.getImpl().getComponent().getDataManager();
			}
			
			var oModel = new sap.ui.model.json.JSONModel();
			_oDialog.setModel(oModel);
			_oList.setShowNoData(false);
			_oList.removeSelections(true);
			_oDialog.open();
			
			// read substitutes rule collection and extract out relevant rules to display
			this.refreshDataAfterUpdateSubstitutionRule();
			
		},
		
		_setAgents: function(aAgents) {
			_oDialog.getModel().setProperty("/agents", aAgents);
			_oDialog.rerender();
		},
		
		refreshDataAfterUpdateSubstitutionRule: function() {
			_oList.setBusyIndicatorDelay(1000);
			_oList.setBusy(true);
			_oDataManager.readAddInboxUsers(
					jQuery.proxy(this._addInboxUsersReadSuccess, this),
					function() {
						_oList.setBusy(false);
						_oDialog.close();
					}
			);
		},
		
		_addInboxUsersReadSuccess: function(oResult) {
			
	 		var aData = [];
	 		var bNewEntry;
	 		var that = this;
	 		_oList.setBusy(false);
	 		
	 		jQuery.each(oResult.results, function(i, oOriginalRule) {
	 			if (oOriginalRule.Mode === _sModeTakeOver && !cross.fnd.fiori.inbox.Substitution.isRuleOutdated(oOriginalRule.EndDate)) {
	 				bNewEntry = true;
	 				oOriginalRule.User = oOriginalRule.User.toUpperCase();
	 				jQuery.each(aData, function(index, oProcessedRule) {
	 					if (oProcessedRule.User === oOriginalRule.User) {
	 						that._mergeRule(oProcessedRule, oOriginalRule);
	 						bNewEntry = false;
    						return false;
	 					}
	 				});
	 				if(bNewEntry) {
	 					aData.push(that._getProcessedRuleObject(oOriginalRule));
	 				}
	 			}
	 		});
	 		
	 		if (aData.length > 0) {
	 			this._setStatus(aData);
	 			this._setAgents(aData);
	 		} else {
	 			_oList.setShowNoData(true);
	 			_oList.rerender();
	 		}
		},
		
		_mergeRule: function(oMasterRule, oChildRule) {
			
			// Even if the rule is enabled in a single back end, overall status for the user should be active
			if (!oMasterRule.IsEnabled && oChildRule.IsEnabled) {
				oMasterRule.IsEnabled = true;
			}
			
			var aKeysArray = oChildRule.IsEnabled ? oMasterRule.aEnabledRules: oMasterRule.aDisabledRules;
			aKeysArray.push({
				subRuleId: oChildRule.SubstitutionRuleID,
				sOrigin: oChildRule.SAP__Origin
			});
		},
		
		_getProcessedRuleObject: function(oRule) {
			
			var oNewRule = {
					User : oRule.User,
					FullName : oRule.FullName,
					SupportsEnableSubstitutionRule: oRule.SupportsEnableSubstitutionRule,
					IsEnabled : oRule.IsEnabled,
					SAP__Origin: oRule.SAP__Origin,
					aEnabledRules : [],
					aDisabledRules : []
			};
			
			var aKeysArray = oRule.IsEnabled ? oNewRule.aEnabledRules: oNewRule.aDisabledRules;
			aKeysArray.push({
				subRuleId: oRule.SubstitutionRuleID,
				sOrigin: oRule.SAP__Origin
			});
			
			return oNewRule;
			
		},
		
		_setStatus: function(aData) {
			jQuery.each(aData, function(i, oRule) {
				oRule.bShowWarning = (oRule.aEnabledRules.length > 0 && oRule.aDisabledRules.length > 0) ? true : false;
			});
		}
		
	};
}());