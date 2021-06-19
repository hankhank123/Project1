/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
cross.fnd.fiori.inbox.comments = (function() {
	var u = {};
	var p = jQuery.sap.getModulePath("cross.fnd.fiori.inbox") + "/img/home/placeholder.jpg";
	return {
		formatterUserIcon: function(o, U) {
			var t = this;
			var s = cross.fnd.fiori.inbox.comments.getRelativeMediaSrc(o, U, this.getModel("detail").getData().sServiceUrl);
			var b = u[s];
			if (b != null) {
				if (b) {
					return s;
				} else {
					return p;
				}
			}
			var S = function() {
				u[s] = true;
				t.setIcon(s);
				t.rerender();
			};
			var e = function() {
				u[s] = false;
			};
			cross.fnd.fiori.inbox.comments.checkImageAvailabilityAsync(s, S, e);
			return p;
		},
		checkImageAvailabilityAsync: function(U, s, e) {
			jQuery.ajax({
				url: U,
				type: 'GET',
				contentType: 'image/jpeg',
				async: true,
				success: function(d, a, j) {
					if (d != "" && d != undefined) {
						s();
					} else {
						e();
					}
				},
				error: function(d, t, c) {
					e();
				}
			});
		},
		getRelativeMediaSrc: function(o, U, s) {
			return s + "/UserInfoCollection(SAP__Origin='" + o + "',UniqueName='" + U + "')/$value";
		}
	};
}());