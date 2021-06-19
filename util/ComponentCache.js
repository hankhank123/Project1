/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object", "sap/ui/Device", "sap/ui/core/UIComponent"], function(O, D, U) {
	"use strict";
	return O.extend("cross.fnd.fiori.inbox.ComponentCache", {
		constructor: function(c) {
			O.prototype.constructor.call(this);
			var _ = 0;
			var a = {};
			var b = 0;
			var C;
			if (jQuery.isNumeric(c)) {
				C = parseInt(c, 10);
				C = C >= 0 ? C : undefined;
			} else {
				C = undefined;
			}
			if (D.system.desktop) {
				_ = (C) ? C : 20;
			} else {
				_ = (C) ? C : 3;
			}
			this.destroyCacheContent = function() {
				var k;
				for (k in a) {
					a[k].destroy();
				}
				a = {};
			};
			this.getComponentByKey = function(k) {
				return a[k];
			};
			this.getComponentById = function(i) {
				var k;
				for (k in a) {
					if (a[k].getId() === i) {
						return a[k];
					}
				}
			};
			this.cacheComponent = function(k, o) {
				if (o instanceof U) {
					if (b < _) {
						if (!a.hasOwnProperty(k)) {
							b++;
						}
						a[k] = o;
					} else {
						throw "Max cache size exceeded for device.";
					}
				} else {
					throw "Cannot cache object: Type mismatch.";
				}
			};
		}
	});
});