/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(['sap/ui/model/FilterProcessor'], function(F) {
	var C = jQuery.extend({}, F);
	C._resolveMultiFilter = function(m, r, g) {
		var t = this,
			M = false,
			f = m.aFilters;
		if (f) {
			jQuery.each(f, function(i, o) {
				var l = false;
				if (o._bMultiFilter) {
					l = t._resolveMultiFilter(o, r, g);
				} else if (o.sPath !== undefined) {
					if (o.sPath === 'Status') {
						var v = g(r, o.sPath);
						v = t.normalizeFilterValue(v);
						var T = t.getFilterFunction(o);
						if (v !== undefined && T(v)) {
							l = true;
						}
					} else {
						l = true;
					}
				}
				if (l && m.bAnd) {
					M = true;
				} else if (!l && m.bAnd) {
					M = false;
					return false;
				} else if (l) {
					M = true;
					return false;
				}
			});
		}
		return M;
	};
	return C;
}, true);