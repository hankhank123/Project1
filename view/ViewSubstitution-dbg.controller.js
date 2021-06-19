/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("cross.fnd.fiori.inbox.util.Substitution");
jQuery.sap.require("cross.fnd.fiori.inbox.util.DataManager");
jQuery.sap.require("sap.ca.scfld.md.controller.BaseFullscreenController");
jQuery.sap.require("sap.ca.ui.message.message");
jQuery.sap.require("sap.ca.ui.model.type.DateTime");
jQuery.sap.require("cross.fnd.fiori.inbox.util.ConfirmationDialogManager");
jQuery.sap.require("cross.fnd.fiori.inbox.util.EmployeeCard");
/*global cross:true*/
/*eslint no-undef: 2*/
sap.ca.scfld.md.controller.BaseFullscreenController.extend("cross.fnd.fiori.inbox.view.ViewSubstitution", {
	_MAX_AGENT: 100,
	
/*	Hook method to add buttons for the Substitution view footer */
	extHookAddFooterButtonsForSubs: null,
	
	oConfirmationDialogManager : cross.fnd.fiori.inbox.util.ConfirmationDialogManager,
	
	
	
    onInit: function() {
        //execute the onInit for the base class BaseFullscreenController
        sap.ca.scfld.md.controller.BaseFullscreenController.prototype.onInit.call(this);
        
        var oView = this.getView();
        
        // creating a unique ID of add substitute fragment for the current instance of view
        this.sAddSubUniqueId = this.createId() + "DLG_ADD_SUBST";
        
        this.oFormatToDisplay = sap.ui.core.format.DateFormat.getDateInstance({ // this format is used to display selected dates in calendar
			pattern : "dd MMM yyyy"
		});
        this.i18nBundle = oView.getModel("i18n").getResourceBundle();
        
        var oComponent = sap.ca.scfld.md.app.Application.getImpl().getComponent();
        this.oDataManager = oComponent.getDataManager();
		if (!this.oDataManager) {
			var oOriginalModel = this.getView().getModel();
			this.oDataManager = new cross.fnd.fiori.inbox.util.DataManager(oOriginalModel, this);
			oComponent.setDataManager(this.oDataManager);
		}
		//this.oDataManager.oSubstitutionView = this.getView();
		oComponent.getEventBus().subscribe("cross.fnd.fiori.inbox.dataManager", "showReleaseLoader", jQuery.proxy(this.onShowReleaseLoader,this));
		oComponent.getEventBus().subscribe("cross.fnd.fiori.inbox.dataManager", "showLoaderInDialogs", jQuery.proxy(this.onShowLoaderInDialogs,this));
		this.oHeaderFooterOptions = {
				sI18NFullscreenTitle : "substn.title",
				bSuppressBookmarkButton: true
		};
		this.oFooterBtnList = {}; //will have all the buttons to be displayed on row selection
		this.oFooterBtnList.AddSubstituteBtn = {
				sI18nBtnTxt  : "substn.create.substitute_button",
				onBtnPressed  : jQuery.proxy(this.onOpenAddSubstituteDialog, this)
			};
		this.oFooterBtnList.resendBtn = {
				sI18nBtnTxt  : "substn.resynchronize.resend_button",
				onBtnPressed  : jQuery.proxy((function () {
					this.showDialogForResynchronize();
				}), this)
			};
		this.oFooterBtnList.deleteRuleBtn = {
				sI18nBtnTxt  : "substn.delete.delete_button",
				onBtnPressed  : jQuery.proxy((function () {
    				this.handleDelete();
    			}), this)
			};
		
		
    	
		//initially display Add new Substitute button
		this.showInitialFooterButtons();
        this.oRouter.attachRouteMatched(this.handleNavToSubstitution, this);
    },
    
    onShowReleaseLoader: function(sChannelId, sEventId, oValue){
		this.getView().setBusyIndicatorDelay(1000);
		this.getView().setBusy(oValue.bValue);
	},
	
	onShowLoaderInDialogs: function(sChannelId, sEventId, oValue){
		var oSubstitutionFragment = this._oAddSubstituteFrag;
		if(oSubstitutionFragment){
			oSubstitutionFragment.setBusyIndicatorDelay(1000).setBusy(oValue.bValue);	
		}
	},
    
    handleNavToSubstitution: function(oEvent){
    	if (oEvent.getParameter("name") === "substitution") {
    		
    		if (!this.oDataManager.oModel.getServiceMetadata()) {
				//Execution can only continue - e.g.: metadata fetch success
				this.oDataManager.oModel.attachMetadataLoaded(jQuery.proxy(function() {
					this.refreshData();
				}, this));
			} else {
				this.refreshData();
			}
    		
    	}
    },
    
    //Group the Rules for a User
    groupBy: function (oModel) {
    	var groups = {};
    	oModel.forEach(function(oRule) {
    		var group = JSON.stringify(oRule.User);
    		groups[group] = groups[group] || [];
    		groups[group].push(oRule);  
    	});
    	return Object.keys(groups).map(function(group) {
    		return groups[group]; 
    	});
    },
    
    // sort and group substitution data in such a way that rules are sorted based on UserName and inactive rules are displayed after all active rules 
    sortAndGroupSubstitutionData: function(oSubstitutionData) {
    	
    	// divide data in to two arrays; one for active and another for inactive rules
    	var aActiveRules = [];
    	var aInactiveRules = [];
    	jQuery.each(oSubstitutionData, function(index, oRule) {
    		if (oRule.bActive) {
    			aActiveRules.push(oRule);
    		} else {
    			aInactiveRules.push(oRule);
    		}
    	});
    	
    	// sort both the arrays separately
    	aActiveRules.sort(function(a, b) {
    		return a.FullName.toLocaleLowerCase().localeCompare(b.FullName.toLocaleLowerCase());
    	});
    	
    	aInactiveRules.sort(function(a, b) { 
    		return a.FullName.toLocaleLowerCase().localeCompare(b.FullName.toLocaleLowerCase());
    	});
    	
    	// join the sorted arrays
    	oSubstitutionData = aActiveRules.concat(aInactiveRules);
    	
    	//Grouping the substitution rules for each user
    	var aSubstitutionDataGroupedByUser = this.groupBy(oSubstitutionData);
    	var oSubstitutionModel = aSubstitutionDataGroupedByUser[0];
    	
    	//Merging the substitution rules grouped by users into a single model
    	for(var i = 1 ; i<aSubstitutionDataGroupedByUser.length ; i++) {
    		oSubstitutionModel = jQuery.merge(oSubstitutionModel,aSubstitutionDataGroupedByUser[i]);
    	}
    	
    	return oSubstitutionModel;
    	
    },
    
    // Check if the rule exists in all back end systems
    findActiveSystems : function (oSubstitutionRule, aSystems) {

    	var aSystemsWithRule = []; // array of systems in which rule exists 
       	var aSystemsWithoutRule = []; // array of systems in which rule doesn't exists 
       	var bSystemFound;
       	
       	jQuery.each(aSystems, function (index, oSystemInfo) {
       			bSystemFound = false;
       			jQuery.each(oSubstitutionRule.aKeys, function (iKeyIndex, oKey) {
       				if (oSystemInfo.SAP__Origin === oKey.SAP__Origin) {
       					aSystemsWithRule.push(oSystemInfo.SAP__Origin);
       					bSystemFound = true;
       					return false;
       				}
       			});
       			if (!bSystemFound) {
       				aSystemsWithoutRule.push(oSystemInfo.SAP__Origin);
       			}
       		});
       		
       	oSubstitutionRule.aSystemsWithoutRule = aSystemsWithoutRule;
       	oSubstitutionRule.bExistInAllSystem = (aSystemsWithoutRule.length < 1);
    },
    //To switch Views between planned and unplanned
    handleIconTabBarSelect : function(oEvent) {
    	var oTable = this.byId('substitutionRules');
    	//remove row selection on switching views
    	oTable.removeSelections(); 
    	var oBinding = oTable.getBinding("items");
    	var oFilter = {};
    	//Model stores the View selected by User Planned or Unplanned
    	var oSubTypeModel = this.getView().getModel("substitutionTypeModel");
    	this.showInitialFooterButtons();
    	if (oEvent.getSource().getSelectedKey() === "UNPLANNED") {
    		if (!oSubTypeModel) {
    			oSubTypeModel = new sap.ui.model.json.JSONModel({data : { bPlanned : false}});
    		}
    		oSubTypeModel.oData.data.bPlanned = false;
    		//Filter to display rules only for unplanned substitutes
    		oFilter = new sap.ui.model.Filter("Mode", "EQ","TAKE_OVER");
    		oBinding.filter([ oFilter ]);
    	} else {
    		if (!oSubTypeModel) {
    			oSubTypeModel = new sap.ui.model.json.JSONModel({data : { bPlanned : true}});
    		}
    		oSubTypeModel.oData.data.bPlanned = true;
    		//Filter to display rules for Planned substitutes
    		oFilter = new sap.ui.model.Filter("Mode", "EQ","RECEIVE_TASKS");
    		oBinding.filter([ oFilter ]);

    	}
    	oSubTypeModel.checkUpdate(false);
    },
   
    
    refreshData: function() {
    
	    var fnSuccess = function(oSubstitutionRuleCollection, oSubstitutionProfileCollection, oSystemInfoCollection) {
	    	
	    	var oSubstitutionCollection = []; //all entries
	    	var oSubstitutionModel = []; // final data after grouping and sorting
	    	var oEndOfCurrentDate = cross.fnd.fiori.inbox.Substitution.getEndOfCurrentDate(); // end of the current day
	    	jQuery.each(oSubstitutionRuleCollection.results, function(i, oSubRule){
	    		if (!cross.fnd.fiori.inbox.Substitution.isRuleOutdated(oSubRule.EndDate)) { // to eliminate outdated rules
	    			var bNewEntry = true; // to check if we need to make a new entry in the model
	    			jQuery.each(oSubstitutionCollection, function(index, oJsonSubsRule){
	    				if (oSubRule.User.toUpperCase() === oJsonSubsRule.User.toUpperCase() &&
	    						oSubRule.BeginDate.getDate() === oJsonSubsRule.BeginDate.getDate() &&
	    						oSubRule.BeginDate.getMonth() === oJsonSubsRule.BeginDate.getMonth() &&
	    						oSubRule.BeginDate.getFullYear() === oJsonSubsRule.BeginDate.getFullYear() &&
	    							oSubRule.EndDate.getDate() === oJsonSubsRule.EndDate.getDate() &&
	    							oSubRule.EndDate.getMonth() === oJsonSubsRule.EndDate.getMonth() &&
		    						oSubRule.EndDate.getFullYear() === oJsonSubsRule.EndDate.getFullYear() &&
	    								oSubRule.Profile === oJsonSubsRule.Profile && 
	    									oSubRule.ProfileText === oJsonSubsRule.ProfileText) 
	    					{
	    						oJsonSubsRule.aKeys.push({SubstitutionRuleId : oSubRule.SubstitutionRuleID, SAP__Origin : oSubRule.SAP__Origin});
	    						bNewEntry = false;
	    						return false;
	    					}
	    			});
	    			
	    			if (bNewEntry) { // make a new entry if the rule with same data does not exist in the new model
	    				oSubstitutionCollection.push({
	    					User : oSubRule.User.toUpperCase(),
	    					BeginDate : oSubRule.BeginDate,
	    					EndDate : oSubRule.EndDate,
	    					Profile : oSubRule.Profile,
	    					ProfileText : oSubRule.ProfileText,
	    					FullName : oSubRule.FullName,
	    					SupportsDeleteSubstitutionRule : oSubRule.SupportsDeleteSubstitutionRule,
	    					Mode : oSubRule.Mode,
	    					bActive : oSubRule.BeginDate <= oEndOfCurrentDate, // Status of the Rule Active or Inactive 
	    					aKeys : [{
	    						SubstitutionRuleId : oSubRule.SubstitutionRuleID,
	    						SAP__Origin : oSubRule.SAP__Origin
	    					}]
	    				});
	    			}
	    		}
	    	});
	    	
	    	if (oSubstitutionCollection.length > 0) {
	    		
	    		// sort and group substitution data in such a way that rules are sorted based on UserName and inactive rules are displayed after all active rules
	    		oSubstitutionModel = this.sortAndGroupSubstitutionData(oSubstitutionCollection);
	    		
	    		// calculating in which all systems the rule exists
	    		jQuery.each(oSubstitutionModel, jQuery.proxy(function (index, oSubstitutionRule) {
	    			
	    			// if profile for a rule is empty, rule should exist in each provider
	    			if (oSubstitutionRule.Profile === "" && oSubstitutionRule.ProfileText === "" ){ 
	    				this.findActiveSystems(oSubstitutionRule, oSystemInfoCollection);
	    			} else { 
	    				//if rule has a specific profile, rule should exist in each provider that has the specific profile 
	    				var aSystemsWithProfile = []; // create an array of the systems containing the specific profile
	    				jQuery.each(oSubstitutionProfileCollection, function (i, oProfileInfo) {
	    					if (oProfileInfo.Profile === oSubstitutionRule.Profile && oProfileInfo.ProfileText === oSubstitutionRule.ProfileText) {
	    						aSystemsWithProfile.push({SAP__Origin : oProfileInfo.SAP__Origin});
	    					}
	    				});
	    				this.findActiveSystems(oSubstitutionRule, aSystemsWithProfile);
	    			}
	    			
	    		}, this));
	    		
	    	}
	    	
	    	// setting the model to the view
	    	
	    	var oView = this.getView();
	    	//model to store if unplanned or planned view was selected by user
	    	var bUnplannedSubstitutesRule = false;
	    	var bViewSubstitutionOnPhone = sap.ui.Device.system.phone ? true : false;
	    	var oSubstitutionTypeModel = {};
	    	//if model is defined
	    	if (oView.getModel("substitutionTypeModel")) {
	    		bUnplannedSubstitutesRule = !oView.getModel("substitutionTypeModel").oData.data.bPlanned;
	    	}

	    	this.oModel2 = new sap.ui.model.json.JSONModel({modelData: oSubstitutionModel});
	    	oView.setModel(this.oModel2, "substitution");

	    	//Filter to show only planned or unplanned substitution rules on refresh
	    	var oBinding = this.byId('substitutionRules').getBinding("items");
	    	if (bUnplannedSubstitutesRule) {
	    		oBinding.filter([ new sap.ui.model.Filter("Mode", "EQ","TAKE_OVER") ]);
	    		oSubstitutionTypeModel = new sap.ui.model.json.JSONModel({data : { bPlanned : false}});
	    	} else {
	    		oBinding.filter([ new sap.ui.model.Filter("Mode", "EQ","RECEIVE_TASKS") ]);
	    		oSubstitutionTypeModel = new sap.ui.model.json.JSONModel({ data : {bPlanned : true}});
	    	}
	    	oSubstitutionTypeModel.setProperty("/bPhone", bViewSubstitutionOnPhone );                 
	    	oView.setModel(oSubstitutionTypeModel,"substitutionTypeModel");
	    	this.substituteStatusModel = new sap.ui.model.json.JSONModel();
	    	this.setSubstituteStatusData();
	    	oView.setModel(this.substituteStatusModel, "userDetails");
	    	this.substituteStatusModel.checkUpdate(true);
	    	// refresh footer buttons 
	    	this.showInitialFooterButtons();
	    };
	  //Execution can only continue - e.g.: metadata fetch success in scaffolding
			this.oDataManager.readSubstitutionData(jQuery.proxy(fnSuccess, this));
   
    },
    
    refreshFooterOptions: function() {
		this._oHeaderFooterOptions = jQuery.extend(this._oHeaderFooterOptions, this.oHeaderFooterOptions);		
   		this.setHeaderFooterOptions(this._oHeaderFooterOptions);
	},
	
	
    setSubstituteStatusData: function() {
    	
    	var oUserDetails = {};
    	
    	jQuery.each(this.oModel2.oData["modelData"], jQuery.proxy(function(index, oSubRule) {
    		if (oSubRule.Mode == "RECEIVE_TASKS"){
    		if (oUserDetails[oSubRule.User] !== undefined) {
    			if(!oUserDetails[oSubRule.User].bActive) { //if flag is false recalculate the value
    				oUserDetails[oSubRule.User].bActive = oSubRule.bActive;
    			}
    		} else {
    			oUserDetails[oSubRule.User] = {bActive : oSubRule.bActive};
    		}
    	}
    	}, this));
    	cross.fnd.fiori.inbox.Substitution.setUserInfo(oUserDetails);
    	this.substituteStatusModel.setData(oUserDetails);
    	
    },
	
    showInitialFooterButtons: function() {
    	this.oHeaderFooterOptions = jQuery.extend(this.oHeaderFooterOptions, {
			buttonList: [this.oFooterBtnList.AddSubstituteBtn]
    	});
		 this.refreshFooterOptions();
    	
    },
    
    // to show employee details on click of substitute user link
    onEmployeeProfileLaunch: function(oEvent) {
    	var oBindingContext = oEvent.getSource().getBindingContext("substitution");
		var sSAP_Origin = this.oModel2.getProperty("aKeys", oBindingContext)[0].SAP__Origin;
		var sUserID = this.oModel2.getProperty("User", oBindingContext);
		
		// get control that triggers the BusinessCard
		var oSelectedControl = cross.fnd.fiori.inbox.Conversions.getSelectedControl(oEvent);
		
		this.oDataManager.readUserInfo(sSAP_Origin, sUserID, jQuery.proxy(cross.fnd.fiori.inbox.util.EmployeeCard.displayEmployeeCard, this, oSelectedControl));
	},
	
	//display success message if substitution rule is created in all the back ends and perform refresh
	refreshOnSubstitutionRuleSuccess: function(aSuccessList,aErrorList){
		  if (aErrorList.length == 0) {                         
            jQuery.sap.delayedCall(500, this, function() {
          	  sap.ca.ui.message.showMessageToast(this.i18nBundle.getText("substn.create.success"));
            }); 
        } 
		  this.refreshData();
	  },
	  
	  //creating substitution rule entry to be added in the model
	  createSubstituionRuleEntry: function(oBindingContext) {
		var oSubRuleEntry = {};
		oSubRuleEntry.BeginDate = "\/Date(" + (this.oModel2.getProperty("BeginDate", oBindingContext)).getTime()+ ")\/";
		oSubRuleEntry.EndDate = "\/Date(" + (this.oModel2.getProperty("EndDate", oBindingContext)).getTime()+ ")\/";
		oSubRuleEntry.User = this.oModel2.getProperty("User", oBindingContext);
		oSubRuleEntry.Mode = this.oModel2.getProperty("Mode", oBindingContext);
		oSubRuleEntry.Profile = this.oModel2.getProperty("Profile", oBindingContext);
		oSubRuleEntry.ProfileText = this.oModel2.getProperty("ProfileText", oBindingContext);
		oSubRuleEntry.IsEnabled = true;
		return oSubRuleEntry;
	},
	
	showDialogForResynchronize: function() {
		var oBindingContext = this.oFooterBtnList.BindingContext;
		var that = this;
		this.oConfirmationDialogManager.showDecisionDialog({
			showNote : false,
			title :that.i18nBundle.getText("substn.resynchronize.title"),
			question: that.i18nBundle.getText("substn.resynchronize.question"),
			confirmButtonLabel: that.i18nBundle.getText("XBUT_OK"),
			noteMandatory : false,
			confirmActionHandler: jQuery.proxy(function(oBindContext, oResult){
				this. showInitialFooterButtons();
				var aSystemsWithoutRule = this.oModel2.getProperty("aSystemsWithoutRule", oBindingContext);
				var oEntry = this.createSubstituionRuleEntry(oBindContext);
				this.oDataManager._createSubstitutionRule(oEntry,aSystemsWithoutRule, jQuery.proxy(this.refreshOnSubstitutionRuleSuccess, this));
			}, this, oBindingContext)
			
		});
	},
	
	updateFooterBtnList: function(bShowResendBtn, oBindingContext) {
		var aButtonList = [];
		aButtonList = bShowResendBtn ? [this.oFooterBtnList.AddSubstituteBtn, this.oFooterBtnList.deleteRuleBtn, this.oFooterBtnList.resendBtn] :
											[this.oFooterBtnList.AddSubstituteBtn,this.oFooterBtnList.deleteRuleBtn];
		
		/**
         * @ControllerHook to add the footer buttons
         * This hook method can be used to add buttons for the substitution view footer
         * @callback cross.fnd.fiori.inbox.view.ViewSubstitution~extHookAddFooterButtonsForSubs
         * @param {object} oButtonList - Buttons which are added by default
         * @return {void}
         */
    	if (this.extHookAddFooterButtonsForSubs) {
    		this.extHookAddFooterButtonsForSubs(aButtonList);
    	}
		
		
		this.oHeaderFooterOptions = jQuery.extend(this.oHeaderFooterOptions, {
			buttonList: aButtonList
    	});
		 this.refreshFooterOptions();

	},
	handleLiveChange: function(oEvent) {
		//clear the list of users if no value is entered
		if(oEvent.getSource().getValue() === "") {
			var oSubstituteUserList = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_SEARCH_USERS"); 
			oSubstituteUserList.getModel("userModel").setProperty("/users", {});
		} 
			
	},
	
	handleRuleSelection: function(oEvent) {
		var oBindingContext = oEvent.getParameter('listItem').getBindingContext("substitution");
		//setting the Binding Context of the selected row
		this.oFooterBtnList.BindingContext = oBindingContext;
		
		//Create Re send button only if rule is erroneous
		var bIsRuleErroneous = !jQuery.isEmptyObject(this.oModel2.getProperty("aSystemsWithoutRule", oBindingContext));
		this.updateFooterBtnList(bIsRuleErroneous,oBindingContext);
	},
	
	handleDelete: function(oEvent) {
		var oTable = this.byId('substitutionRules');
		// Display delete confirmation dialog
		this.oConfirmationDialogManager.showDecisionDialog({
			question: this.i18nBundle.getText("substn.delete.question"),
			title: this.i18nBundle.getText("substn.delete.title"),
			confirmButtonLabel: this.i18nBundle.getText("XBUT_OK"),
			noteMandatory: false,
			confirmActionHandler : jQuery.proxy(function(oResult) {
				var oBindingContext = this.oFooterBtnList.BindingContext;
				var aRulesKeys = this.oModel2.getProperty("aKeys", oBindingContext);
				var fnSuccess = aRulesKeys.length > 1 ? this.successMassDelete : this.successDelete;
				this.oDataManager.deleteSubstitution(aRulesKeys, jQuery.proxy(fnSuccess, this, oBindingContext));
				//TODO check why last row gets selected on rule deletion
				oTable.removeSelections();
			}, this)
		});
	},
	
	successMassDelete: function(oContext, aSuccessList, aErrorList) {
		
		if (aErrorList.length === 0) {
			// if every rule has been deleted successfully
			this.successDelete(oContext);
		} else {
			
			// In case some delete requests have been executed successfully and some have not
			if (aSuccessList.length > 0) {
				var aParts = oContext.getPath().split("/");
				var aRemovedRule = [];
				for (var i = aSuccessList.length -1; i >= 0; i--) {
					
					// removing successfully deleted rule from aKeys and pushing it to aSystemsWithoutRule
					var aRemovedRule = this.oModel2.oData[aParts[1]][aParts[2]].aKeys.splice(aSuccessList[i],1);
					this.oModel2.oData[aParts[1]][aParts[2]].aSystemsWithoutRule.push(aRemovedRule[0].SAP__Origin);
				}
				
				// since rule has been deleted in some backends and not all, changing the value of flag bExistInAllSystem to false
				this.oModel2.oData[aParts[1]][aParts[2]].bExistInAllSystem = false;
				this.oModel2.checkUpdate(false);
			}
			
		}
	},
	
	successDelete : function (oContext) {
		
		// remove the deleted rule from model 
		var aParts = oContext.getPath().split("/");
		this.oModel2.oData[aParts[1]].splice(aParts[2], 1);
		
		// sort and group the data again
		if (this.oModel2.oData[aParts[1]].length > 0) {
			this.oModel2.oData[aParts[1]] = this.sortAndGroupSubstitutionData(this.oModel2.oData[aParts[1]]);
		}
		this.oModel2.checkUpdate(false);
		
		// recalculate substitute's status
		this.setSubstituteStatusData();
		this.substituteStatusModel.checkUpdate(true);
		
		// show toast with success message
		sap.ca.ui.message.showMessageToast(this.i18nBundle.getText("substn.delete.success"));
		
		// refresh footer buttons and mode of the table if required
		this.showInitialFooterButtons();
	},
	
	//Add Substitute related methods
	onOpenAddSubstituteDialog: function (oEvent) {
		//Create Add New Substitute Flag
		if (!this._oAddSubstituteFrag) {
			this._oAddSubstituteFrag = sap.ui.xmlfragment(this.sAddSubUniqueId, "cross.fnd.fiori.inbox.frag.AddSubstitute", this);
			//this.oDataManager.oSubstitutionFragment = this._oAddSubstituteFrag;
			this.getView().addDependent(this._oAddSubstituteFrag);
			this._initializeAddSubstitueDelegates();
			this._changeDetailIconForUserList();
			
			this._oAddSubstituteFrag.setModel(new sap.ui.model.json.JSONModel(), "selectedSubstituteModel");
			this._oAddSubstituteFrag.setModel(new sap.ui.model.json.JSONModel(), "selectedProfileModel");
         }

		this._oAddSubstituteFrag.open();
	},
	
	_initializeAddSubstitueDelegates: function(oEvent){                
  		var that = this; 
  		  		
  		this._addEventDelegateToPage(sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "detail_substitutes"),
  				{onBeforeShow :jQuery.proxy(function() {
  					this._setSaveVisibility(false);
  				},that)}
			);
  		
  		this._addEventDelegateToPage(sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "detail_profiles"), 
				{onBeforeShow :jQuery.proxy(function() {
  					this._setSaveVisibility(false);
  				},that)}
			);
	
  	},
  	
  	_addEventDelegateToPage: function(oPage, oEventDelegate){
  		oPage.addEventDelegate(oEventDelegate, this);
  	},
  	
  	navToSearchForSubstitutes: function(oEvent) {
  	    var oNavCon = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "NAV_ADD_SUBST");
  	    var oDetailPage = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "detail_substitutes");
  	    
  	    var oSubstituteUserList = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_SEARCH_USERS"); 
  	    var oUserModel = oSubstituteUserList.getModel("userModel");
  	    if(!oUserModel){
  	    	oSubstituteUserList.setModel(new sap.ui.model.json.JSONModel(), "userModel");
  	    }
  	  
    }, 
    
    onSearchOfSubstitutes: function(oEvent) {
		var sSearchTerm = oEvent.getSource().getValue();		
		this.searchUsers(sSearchTerm);
    },
    
    searchUsers: function(sSearchTerm){
    	if(sSearchTerm==""){ 
    		this.resetAddSubstituteForm();
    		return;
    	}
    	this.navToSearchForSubstitutes(this);
    	var sOrigin;
    	var fnSuccess = function(oResults){
    		sOrigin = oResults[0].SAP__Origin;
    	};
    	
    	this.oDataManager.readSystemInfoCollection(fnSuccess, jQuery.proxy(fnSuccess, this.searchUsers));
    	
    	if(sOrigin){
	    	this.oDataManager.searchUsers(sOrigin, sSearchTerm, this._MAX_AGENT, jQuery.proxy(function(oResults){
	    		var oSubstituteUsersList = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_SEARCH_USERS");
	    		oSubstituteUsersList.getModel("userModel").setProperty("/users", oResults);
	    	},this));
    	}
    },

    
    navToGetProfiles:function(oEvent, oParameters){
    	var oProfilesTable = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_PROFILES"); 
    	var oSelectedSubInfoList = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_USR_DATA");
    	var oAllTopics = sap.ui.core.Fragment.byId(this.sAddSubUniqueId ,"LST_ALL_TOPICS");
    	
    	var sDisplayName = oParameters.DisplayName;
    	var sCompany = oParameters.Company;
    	var sIcon = cross.fnd.fiori.inbox.Conversions.getRelativeMediaSrc(oParameters.__metadata.media_src);
  	    var oProfilesModel = oProfilesTable.getModel("profiles");
  	    oProfilesTable.removeSelections(); // to unselect any profiles selected initially
  	    oAllTopics.removeSelections();
  	  
  	    oSelectedSubInfoList.setModel(new sap.ui.model.json.JSONModel(), "userDataModel");
  	    var oSelectedSubInfoListModel = oSelectedSubInfoList.getModel("userDataModel");
  	    oSelectedSubInfoListModel.setProperty("/displayName", sDisplayName);
  	    oSelectedSubInfoListModel.setProperty("/company", sCompany);
  	    oSelectedSubInfoListModel.setProperty("/media_src", sIcon);
  	    oSelectedSubInfoListModel.setProperty("/parameters", oParameters);
  	  
  		if(!oProfilesModel){
  			oProfilesTable.setModel(new sap.ui.model.json.JSONModel(), "profiles");
  		}
  		
    	this.oDataManager.readSubstitutionProfiles(jQuery.proxy(function(oResults){
    		
    		var aDataUnique = {};
    		jQuery.each(oResults, function(i, item) {
    			var oItem = {};
    			oItem.Profile = item.Profile;
    			oItem.ProfileText = item.ProfileText;
    			aDataUnique[ item.Profile + " - " + item.ProfileText ] = oItem;
    		});
    		
    		var aProfileDataUnique = [];
    		var k=0;
    		jQuery.each(aDataUnique, function(j, item) {
    			aProfileDataUnique[k++] = item;
    		});
    		
    		var oProfilesTable = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_PROFILES");
    		oProfilesTable.getModel("profiles").setProperty("/profiles", aProfileDataUnique);
    	},this));
	  	    var oNavCon = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "NAV_ADD_SUBST");
		    var oDetailPage = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "detail_profiles");
		    oNavCon.to(oDetailPage);
    },
    
    handleCreateSubstitutionPopOverCancel: function(oEvent){
  	  this._oAddSubstituteFrag.close();
    },
    
    handleUserSelectionChange: function (oEvent) {
    	var oListItem = oEvent.getSource();
  		var oParameters = this.getUserNavigationParameters(oListItem);
  		this.navToGetProfiles( oEvent, oParameters );
  	 },
  	 
  	getUserNavigationParameters: function(oListItem){
  		var oBindingContext = oListItem.getBindingContext("userModel");
  		return oBindingContext.getObject();
  	},
  	
  	geProfileNavigationParameters: function(oListItem){
  		var oBindingContext = oListItem.getBindingContext("profiles");
		return {
			Profile : oBindingContext.getProperty("Profile"),
			ProfileText : oBindingContext.getProperty("ProfileText")
		};
  	},
  	
  	handleUserDetailPress: function(oEvent){
  		var oListItem = oEvent.getSource();
  		var oParameters = this.getUserNavigationParameters(oListItem);
  		 
  		cross.fnd.fiori.inbox.util.EmployeeCard.displayEmployeeCard(oListItem, oParameters);
  	},
  	
  	onNavBack : function (oEvent, oParameters) {
  	    sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "NAV_ADD_SUBST").back(oParameters);
  	    var oListProfiles = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_PROFILES");
  	    var oAllTopics = sap.ui.core.Fragment.byId(this.sAddSubUniqueId ,"LST_ALL_TOPICS");
    	oListProfiles.removeSelections();
  	    oAllTopics.removeSelections();
  	  },
  	  	  
  	navToSubstitutionPeriod : function(oEvent, oParameters){
  		this._setSaveVisibility(true);
  		var bShowPlanned = this._oAddSubstituteFrag.getModel("substitutionTypeModel").oData.data.bPlanned;
  		var oListItem = oEvent.getParameter("listItem");
  		var oUserProfileInfo = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_USR_DATA");
  		var sTitleProfile = oListItem.getProperty("title");
 		var oSelectDatesPage = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "date_selection");
        var oCalendar = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "selectionCalendar");
        var oNavCon = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "NAV_ADD_SUBST");
  	    oCalendar.removeAllSelectedDates();
  	    
  	    
		oUserProfileInfo.getModel("userDataModel").setProperty("/profileTitle", sTitleProfile);
		oSelectDatesPage.setModel( oUserProfileInfo.getModel("userDataModel") , "userDataModel");
		var oSelectDatesPageModel = oSelectDatesPage.getModel("userDataModel");
		if(oParameters){
			oSelectDatesPageModel.setProperty("/profileParameters", oParameters);
		}
		else{
			oSelectDatesPage.getModel("userDataModel").setProperty("/profileParameters", "" );
		}
		
		 if( !oSelectDatesPageModel.getProperty("/period") )
			 oSelectDatesPageModel.setProperty("/period", this.i18nBundle.getText("substn.create.default_date") );
	  	    
		 if(!bShowPlanned){
			 this._setSaveVisibility(true);
			 var oFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern : "yyyyMMdd"
				});
			 var oSelectedDates = {startDate : oFormat.format( new Date() )};
			 oSelectDatesPageModel.setProperty("/selectedDates", oSelectedDates );
			 return;
		 }
		 oCalendar.focusDate( new Date() ); // reset the calender's focus date
		 oNavCon.to(oSelectDatesPage);
  		
  	},
  	
   	onSelectProfile : function (oEvent) {
  		var oListItem = oEvent.getParameter("listItem");
  		var oParameters = this.geProfileNavigationParameters(oListItem);
  		var oAllTopicsList = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_ALL_TOPICS");
  		oAllTopicsList.removeSelections();
  		this.navToSubstitutionPeriod(oEvent, oParameters);
  		
	 },
 	 
 	onSelectAllTopics : function( oEvent ){
 		var oProfilesList = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_PROFILES");
 		oProfilesList.removeSelections();
 		this.navToSubstitutionPeriod(oEvent);
 	},
 	 
 	
 	onChangeRange : function(oEvent){
 		
 		var that = this;
 		var oFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern : "yyyyMMdd"
			});
		var oSelectedDates = oEvent.getSource().getSelectedDates();
 		var oCalendar = sap.ui.core.Fragment.byId( this.sAddSubUniqueId, "selectionCalendar" );
 		var dFromDateRaw = ( oSelectedDates[0].getStartDate() );
 		var oSelectDatesPage = sap.ui.core.Fragment.byId( this.sAddSubUniqueId, "date_selection" );
 		var dCurrentRaw =  new Date();
 		var dCurrent = oFormat.format( ( dCurrentRaw ) );
 		var dFromDate = oFormat.format( dFromDateRaw );
 		var dFromDateToDisplay = that.oFormatToDisplay.format( dFromDateRaw );
 		var dToDateRaw = ( oSelectedDates[0].getEndDate() );
 		var dToDate = null;
 		
 		if(dToDateRaw!=null){ // if to date and from date, both are selected
	 		dToDate = oFormat.format( dToDateRaw );
	 		var dToDateToDisplay = that.oFormatToDisplay.format( dToDateRaw );
	 		if( dFromDate < dCurrent || dToDate < dCurrent ) { // if selected dates are not valid
	 			oCalendar.removeAllSelectedDates(); // unselect all dates
	 			dFromDate = dCurrent; // set current date to from date
	 			dToDate = null; // set to date as null
	 			oSelectDatesPage.getModel("userDataModel").setProperty("/period",that.i18nBundle.getText("substn.dateSelection.from") + " "  + "" ); // donot show any date selected under substitution period
	 			return; // donot process further
	 		};
	 		// display start date and end date under substitution period
	 		oSelectDatesPage.getModel("userDataModel").setProperty("/period", that.i18nBundle.getText("substn.dateSelection.from")+ " "  + dFromDateToDisplay + " " + that.i18nBundle.getText("substn.dateSelection.to")+ " "  + dToDateToDisplay);
	 		
	 	} else { // if only from date is selected
	 		if(dFromDate < dCurrent ){ // if from date is invalid
	 			dFromDate = dCurrent; // set current date as from date
	 			oCalendar.removeAllSelectedDates(); // unselect all selected dates
	 		} else { // if from date is valid
	 			oSelectDatesPage.getModel("userDataModel").setProperty("/period", that.i18nBundle.getText("substn.dateSelection.from")+ " "  + dFromDateToDisplay + ""); //display fromdate under substitution period
	 		}
 		}
 		
 		var oSelectedDates = {startDate : dFromDate, endDate : dToDate};
 		oSelectDatesPage.getModel("userDataModel").setProperty("/selectedDates", oSelectedDates); // set model for selected dates
 		
 	},
 	
 	validateUnplannedSubstitute: function(sUnplannedSubstitute) {
 		var bCreateSubstitution = true;
 		var aSubstituteUserRuleData = this.getView().getModel("substitution").oData.modelData;
 		
 		jQuery.each(aSubstituteUserRuleData, function(index,oSubRule) {
			if (oSubRule.User.toUpperCase() === sUnplannedSubstitute.toUpperCase() && oSubRule.Mode === "TAKE_OVER") {
				bCreateSubstitution = false;
				return;
			} 
		});
 		return bCreateSubstitution;
 	}, 
 	
 	showValidationFailedDialog: function() {
 		var that = this;
 		var sErrorMsg = that.i18nBundle.getText("dialog.substn.create.unplanned.substitute");
 		var dialog = new sap.m.Dialog({
 	        title: that.i18nBundle.getText("substn.dialog.create.unplanned.substitute"),
 	        type: 'Message',
 	        content: new sap.m.Text({
 	          text: sErrorMsg
 	        }),
 	        beginButton: new sap.m.Button({
 	          text: that.i18nBundle.getText("XBUT_OK"),
 	          press: function () {
 	            dialog.close();
 	          }
 	        }),
 	        afterClose: function() {
 	          dialog.destroy();
 	        }
 	      });
 		 dialog.open();
 	},
 	
 	handleCreateSubstitutionPopOverSave : function(oEvent) {
		var oUserProfileInfo = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_USR_DATA");
 		var oSelectDatesPage = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "date_selection");
 		var oDatesSelected = oSelectDatesPage.getModel("userDataModel").getProperty("/selectedDates");
 		var oFormat = sap.ui.core.format.DateFormat.getDateInstance({
 			pattern : "yyyyMMdd"
		});
 		var sFromDate;
 		var sToDate;
 		
 		if(oDatesSelected){
 			sFromDate = oDatesSelected.startDate;
 			sToDate = oDatesSelected.endDate;
 		} else {
 			sFromDate = oFormat.format( new Date() );
 		}

 		var bUnplannedSubstitutesRule = !this._oAddSubstituteFrag.getModel("substitutionTypeModel").oData.data.bPlanned;
 		var oEntry = {};
 		var endDate;
 		var endDateInputValue = sToDate;
 		var startDateInputValue = sFromDate;
 		
 		if (endDateInputValue) {
 			endDate = oFormat.parse(endDateInputValue);
 			endDate.setHours(23, 59, 59, 59);
 		} else {
 			// if no end date chosen, set end date as December 12, 9999.
 			// Time: Start of the day because if it's end of the day, in some timezone conversions, it might convert in to next day (i.e. year 10000, which will be invalid)
 			// 253402300799000
 			var date = new Date();
				date.setUTCFullYear(9999);
				date.setUTCMonth(11);
				date.setUTCDate(31);
				date.setUTCHours(23);
				date.setUTCMinutes(59);
				date.setUTCSeconds(59);
				date.setUTCMilliseconds(0);
 				endDate = date;
 		}
 		oEntry.EndDate = "\/Date(" + endDate.getTime() + ")\/";

		if (startDateInputValue) {
			var startDate = oFormat.parse( startDateInputValue );
			startDate.setHours(0, 0, 0, 0);
			oEntry.BeginDate = "\/Date(" + startDate.getTime() + ")\/";
		} 

		oEntry.FullName = oUserProfileInfo.getModel("userDataModel").getProperty("/parameters").DisplayName;
		oEntry.User = oUserProfileInfo.getModel("userDataModel").getProperty("/parameters").UniqueName;
	
		// setting isEnabled to false when mode is Take_over mode (incase of BPM and BWF)
  		if(bUnplannedSubstitutesRule) {
  			oEntry.Mode = "TAKE_OVER";
  			oEntry.IsEnabled = false;
  			} else {
  				oEntry.Mode = "RECEIVE_TASKS";
  				oEntry.IsEnabled = true;
  		}
  		if (oEntry.Mode == "TAKE_OVER" && !this.validateUnplannedSubstitute(oEntry.User)) {
			this.handleCreateSubstitutionPopOverCancel();
			this.showValidationFailedDialog();
		}  
  		var oSelectedProfile = oUserProfileInfo.getModel("userDataModel").getProperty("/parameters");
		var oProfileParameters = oSelectDatesPage.getModel("userDataModel").getProperty("/profileParameters");
		if(oSelectedProfile && oProfileParameters){
			oEntry.Profile = oSelectDatesPage.getModel("userDataModel").getProperty("/profileParameters").Profile;
			oEntry.ProfileText = oSelectDatesPage.getModel("userDataModel").getProperty("/profileParameters").ProfileText;
		}
		
		var oProvidersForAdd = this._getProvidersForAddSubstitute(oEntry.Profile, oEntry.ProfileText);
		
		if(oProvidersForAdd.length > 0 && 
				( (oEntry.Mode == "RECEIVE_TASKS") || (oEntry.Mode == "TAKE_OVER" && this.validateUnplannedSubstitute(oEntry.User)) )){
			this.oDataManager._createSubstitutionRule(oEntry, 
					oProvidersForAdd,
					jQuery.proxy(this.createSubstitutionSuccess, this), 
					jQuery.proxy(this.handleCreateSubstitutionPopOverCancel,this));
		}
			
  		
 	},
 	
 	createSubstitutionSuccess: function(aSuccessList, aErrorList){
		// Display success or error messages.
		if (aErrorList.length == 0) {			
			var i18nBundle = this.getView().getModel("i18n").getResourceBundle();
			
			jQuery.sap.delayedCall(500, this, function() {
	            sap.ca.ui.message.showMessageToast(i18nBundle.getText("substn.create.success"));
			});	
		} 
		this._oAddSubstituteFrag.close();
		this.refreshData();
 	},
 	
 	_getProvidersForAddSubstitute: function(sProfile, sProfileText){
 		var aSelectedProviders = [];
 		if(sProfileText ){
	 		/* If user selects a SubstitutionProfile, loop though SubstitutionProfileCollection and check which provider has the same Profile and ProfileText
	 		 * pushing the matching provider in to the array  */
 			var fnSuccess = function(oResults){
 				jQuery.each(oResults, function(i, item) {
 		 			if (item.Profile === sProfile && item.ProfileText === sProfileText) {
 		 				aSelectedProviders.push(item.SAP__Origin);
 		 			}
 		 		});
 			};
 			this.oDataManager.readSubstitutionProfiles(fnSuccess, jQuery.proxy(fnSuccess, this._getProvidersForAddSubstitute));
 		}else {
 			var fnSuccess = function(oSystemInfoData){
 				jQuery.each(oSystemInfoData, function(i, item) {
 	 				aSelectedProviders.push(item.SAP__Origin);
 	 			});
 			};
 			this.oDataManager.readSystemInfoCollection(fnSuccess, jQuery.proxy(fnSuccess, this._getProvidersForAddSubstitute));
 		}
 		return aSelectedProviders;
 	},
 	
 	onBeforeCloseDialog : function(oEvent){
 		this.resetAddSubstituteForm();
 	},
 	
 	resetAddSubstituteForm: function(){ 
 		var oSubstituteSearchInput = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "SEARCH_SUBSTITUTE");
 		var sValueState = "None";
 		
 		//Resetting all models
 		this._oAddSubstituteFrag.getModel("selectedSubstituteModel").setProperty("/selectedSubstitute",{});
		this._oAddSubstituteFrag.getModel("selectedProfileModel").setProperty("/selectedProfile",{});
 		
		var oUserModel = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_SEARCH_USERS").getModel("userModel");
 		if(oUserModel){
 			oUserModel.setProperty("/users", {});
 		}
		
 		oSubstituteSearchInput.setValue("");
 		
 		//navigate to the first page
 		sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "NAV_ADD_SUBST").backToTop();
 	},
 	
 	//HACK : DetailIcon can be only changed with the internal variable _detailIcon, no property provided
 	_changeDetailIconForUserList: function(){
 		var oSubstituteUserList = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_SEARCH_USERS"); 
 		oSubstituteUserList.bindProperty("showNoData", {
			path:'userModel>/users',
			formatter: function(aUsers) {
				// By default, the icon is edit, the code changes it to customer icon. But its creating issues. So commented till API is available.
				//Changing the internal Detail icon of the StandardListItem
				/*for (var i=0; i<oSubstituteUserList.getItems().length; i++) {
					var item = oSubstituteUserList.getItems()[i];
					item._detailIcon = new sap.ui.core.Icon(item.getId() + "-imgDet", {src:"sap-icon://customer"}).addStyleClass("sapMLIBIconDet");
				}*/
				return true;
			}
		});
 	},
 	
 	_setSaveVisibility: function(bValue){
 		sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "BTN_SAVE").setVisible(bValue); 
 	}
 	
});