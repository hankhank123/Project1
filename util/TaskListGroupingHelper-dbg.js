/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/Sorter",
	"sap/m/ViewSettingsItem"
], function(Object, Sorter, ViewSettingsItem) {
	return Object.extend("cross.fnd.fiori.inbox.util.TaskListGroupingHelper", {
		_oResourceBundle: null,
		_oTableOperations: null,
		_oView: null,
		_oGroupDialog: null,
		_oCustomGroupItems:{},

		constructor: function(oTableOperations, oView) {
			this._oResourceBundle = oView.getModel("i18n").getResourceBundle();
			this._oTableOperations = oTableOperations;
			this._oView = oView;
		},

		addCustomGroupItem: function(id, sKey, sText){
			var encodedKey = encodeURIComponent(sKey);
			var oGroupItem = new ViewSettingsItem(id+"Grouper",{key:encodedKey,text:sText});
			this._getGroupingDialog().addGroupItem(oGroupItem);
			this._oCustomGroupItems[sKey] = oGroupItem;
			//add group function for the custom attribute
			this._oGroupFunctions[encodedKey] = function(oKey, oListItemContext){
				return {
					key: oListItemContext.getProperty(oKey),
					text: oListItemContext.getProperty(oKey)
				};
			};
		},
		
		hideCustomGroupItem: function(sKey) {
			var oGroupItem = 	this._oCustomGroupItems[sKey];
			if(oGroupItem){
				this._getGroupingDialog().removeGroupItem(oGroupItem);
			}
		},
		
		showCustomGroupItem: function(sKey) {
			var oGroupItem = this._oCustomGroupItems[sKey];
			if(oGroupItem){
				this._getGroupingDialog().addGroupItem(oGroupItem);
			}
		},
		
		destroy: function(){
			for(var key in this._oCustomGroupItems){
				this._oCustomGroupItems[key].destroy();
			}
		},
		
		openGroupingDialog: function() {
			this._getGroupingDialog().open();
		},

		// Handler for the Confirm button of the grouping dialog. Depending on the selections made in the
		// dialog, the respective sorters are created and stored in the _oTableOperations object.
		// The actual setting of the sorters on the binding is done in function applyTableOperations of the
		// TableSearchHelper object.
		onGroupingDialogConfirmed: function(oEvent) {
			var mParams = oEvent.getParameters(),
				sSortPath, sFunctionName, groupDescending;
			if (mParams.groupItem && mParams.groupItem.getKey() !== "") {
				sSortPath = mParams.groupItem.getKey();
				sFunctionName = sSortPath;
				groupDescending = mParams.groupDescending;
				if(sSortPath === "PriorityNumber"){
					groupDescending = !mParams.groupDescending;
				}
				this._oTableOperations.setGrouping(new Sorter(sSortPath, groupDescending, (this._oGroupFunctions[sFunctionName].bind(this, sFunctionName))));
			} else {
				this._oTableOperations.removeGrouping();
			}
			this._oTableOperations.applyTableOperations();
		},
		
		_getGroupingDialog: function(){
			if (!this._oGroupDialog) {
				this._oGroupDialog = sap.ui.xmlfragment("cross.fnd.fiori.inbox.frag.TaskGroupingDialog", this);
				this._oView.getController().attachControl(this._oGroupDialog);
			}
			return this._oGroupDialog;
		},
		
		// This is a generic grouping function for columns that contain strings. For those columns, the property's value is
		// used as the grouping key and the group header text is built using the column's label and the property's value.
		_getNameGrouper: function(sLabel, sFormattedValue, sKey) {
			var sText = sLabel+": "+sFormattedValue;
			return {
				key: sKey,
				text: sText
			};
		},

		// The group functions are called during grouping for each item in the list. They determine which group
		// each list item belongs to. Items with the same key form a group. A new key
		// means a new group. The returned text is used as the label of the group item header.
		_oGroupFunctions: {
			// Grouping function for grouping by Task Definitions
			TaskDefinitionID: function(oKey, oListItemContext) {
				var key = oListItemContext.getProperty("TaskDefinitionID");
				var formattedValue = oListItemContext.getProperty("TaskDefinitionName");      
				return this._getNameGrouper(this._oResourceBundle.getText("group.taskType"),formattedValue, key);
			},
			// Grouping function for grouping by status
			Status: function(oKey, oListItemContext) {
				var key = oListItemContext.getProperty("Status");
				var formattedValue = cross.fnd.fiori.inbox.Conversions.formatterStatus.call(this._oView, oListItemContext.getProperty("SAP__Origin"), key);                         
				return this._getNameGrouper(this._oResourceBundle.getText("group.status"), formattedValue,  key);
			},
			// Grouping function for grouping by priority
			PriorityNumber: function(oKey, oListItemContext) {
				var key = oListItemContext.getProperty("Priority");
				var formattedValue = cross.fnd.fiori.inbox.Conversions.formatterPriority.call(this._oView, oListItemContext.getProperty("SAP__Origin"), key);                         
				return this._getNameGrouper(this._oResourceBundle.getText("group.priority"), formattedValue,  key);
			},
			// Grouping function for grouping by due date
			CompletionDeadLine: function(oKey, oListItemContext) {
				var dueDate = oListItemContext.getProperty("CompletionDeadLine");
				var formattedValue = this._oResourceBundle.getText("group.duedate.none");
				if(dueDate !== null){
					var dateFormatter = sap.ui.core.format.DateFormat.getDateInstance({pattern:"dd/MM/yyyy", relative:true, relativeScale:"auto"}, sap.ui.getCore().getConfiguration().getLocale());
					formattedValue = dateFormatter.format(new Date(dueDate));
				}
				return this._getNameGrouper(this._oResourceBundle.getText("filter.dueDate"), formattedValue, formattedValue);
			},
			// Grouping function for grouping by creation date
			CreatedOn: function(oKey, oListItemContext) {
				var createdOn = oListItemContext.getProperty("CreatedOn");
				var dateFormatter = sap.ui.core.format.DateFormat.getDateInstance({pattern:"dd/MM/yyyy", relative:true, relativeScale:"auto"}, sap.ui.getCore().getConfiguration().getLocale());
				var formattedValue = dateFormatter.format(new Date(createdOn));
				return this._getNameGrouper(this._oResourceBundle.getText("view.Information.createdOn"), formattedValue, formattedValue);
			},
			// Grouping function for grouping by created by
			CreatedBy: function(oKey, oListItemContext){
				var createdBy = oListItemContext.getProperty("CreatedByName");
				return this._getNameGrouper(this._oResourceBundle.getText("multi.summary.createdBy"), createdBy, createdBy);
			}
		}
	});
});