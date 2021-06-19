/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/comp/filterbar/FilterBar", "sap/ui/comp/smartvariants/PersonalizableInfo",
	"sap/ui/comp/smartvariants/SmartVariantManagement"
], function(F, P, S) {
	var m = F.extend("cross.fnd.fiori.inbox.filterbar.MyFilterBar", {
		renderer: "sap.ui.comp.filterbar.FilterBarRenderer"
	});
	m.prototype._createVariantManagement = function() {
		this._oSmartVM = new S({
			showExecuteOnSelection: true,
			showShare: true
		});
		return this._oSmartVM;
	};
	m.prototype._initPersonalizationService = function() {
		var p = new P({
			type: "filterBar",
			keyName: "persistencyKey"
		});
		p.setControl(this);
		this._oSmartVM.addPersonalizableControl(p);
		this._fInitialiseVariants = jQuery.proxy(this._initialiseVariants, this);
		this._oSmartVM.attachInitialise(this._fInitialiseVariants);
		this._oSmartVM.initialise();
	};
	m.prototype.fetchVariant = function() {
		var f;
		var v = {};
		f = this._determineVariantFiltersInfo(undefined, true);
		v.filterbar = (!f) ? [] : f;
		v.filterBarVariant = this._fetchVariantFiltersData();
		return v;
	};
	m.prototype.applyVariant = function(v) {
		this._applyVariant(v);
	};
	m.prototype.setStandardItemText = function(t) {
		this._oSmartVM.setStandardItemText(t);
	};
});