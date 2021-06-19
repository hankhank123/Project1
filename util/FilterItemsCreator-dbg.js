/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("cross.fnd.fiori.inbox.util.FilterItemsCreator");

cross.fnd.fiori.inbox.util.FilterItemsCreator = {
	/**
	 *
	 * @param sText - label text of the filter category
	 * @param bMultiSelect - optional, default: true
	 * @returns {sap.m.ViewSettingsFilterItem}
	 * @public
	 */
	createFilterCategory: function(sText, bMultiSelect) {
		var isMultiSelect = true;
		if (arguments.length == 2) {
			isMultiSelect = bMultiSelect;
		}
		return new sap.m.ViewSettingsFilterItem({
			text: sText,
			multiSelect: isMultiSelect
		});
	},

	/**
	 *
	 * @param sKey
	 * @param sText
	 * @returns {sap.m.ViewSettingsItem}
	 * @public
	 */
	createFilterItem: function(sKey, sText,complexFilter) {
		var oFilterItem = new sap.m.ViewSettingsItem({
			text: sText,
			key: sKey
		});

		if (this._findFilterKey(sKey,complexFilter)) {
			oFilterItem.setSelected(true);
		}
		return oFilterItem;
	},

	/**
	 *
	 * @param sFilterKey - key of filter item
	 * @returns true in case key  exists.
	 * @private
	 */
	_findFilterKey: function(sFilterKey,complexFilter) {
		for (var firstLevelFilter in complexFilter) {
			var filterKeys = complexFilter[firstLevelFilter];
			for (var i = 0; i < filterKeys.length; i++) {
				if (filterKeys[i] === sFilterKey) {
					return true;
				}
			}
		}
		return false;
	}
};