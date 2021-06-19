/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object", "cross/fnd/fiori/inbox/util/TableOperationsImpl"], function(O, T) {
	"use strict";
	return O.extend("cross.fnd.fiori.inbox.util.TableOperations", {
		constructor: function(t, v, s, d, f) {
			var o = new T({
				oTable: t,
				oView: v,
				aSearchableFields: s,
				oDefaultSorter: d,
				oFixedFilter: f
			});
			this.addTDKey = function(F) {
				o.addTDKey(F);
			};
			this.getTDKeys = function() {
				return o.getTDKeys();
			};
			this.addSorter = function(S) {
				o.addSorter(S);
			};
			this.setGrouping = function(n) {
				o.setGrouping(n);
			};
			this.removeGrouping = function() {
				o.removeGrouping();
			};
			this.getGrouping = function() {
				return o.getGrouping();
			};
			this.getSorter = function() {
				return o.getSorters();
			};
			this.addFilter = function(F, a) {
				o.addFilter(F, a);
			};
			this.getFilterTable = function() {
				return o.getFilterTable();
			};
			this.resetFilters = function() {
				o.resetFilters();
			};
			this.setSearchTerm = function(n) {
				o.setSearchTerm(n);
			};
			this.getSearchTerm = function() {
				return o.getSearchTerm();
			};
			this.applyTableOperations = function() {
				o.applyTableOperations();
			};
			this.addSearchableField = function(n) {
				o.addSearchableField(n);
			};
			this.removeSearchableField = function(n) {
				o.removeSearchableField(n);
			};
		}
	});
});