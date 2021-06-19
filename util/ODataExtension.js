/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object", "sap/ui/model/odata/v2/ODataModel", "cross/fnd/fiori/inbox/util/pagination/ODataListBindingExtension"],
	function(O, a, b) {
		"use strict";
		return O.extend("cross.fnd.fiori.inbox.ODataExtension", {
			overrideBindList: function(d) {
				if (d) {
					d.bindList = function(p, c, s, f, P) {
						var B = new b(this, p, c, s, f, P);
						return B;
					};
				}
				return this;
			},
			overrideProcessSuccess: function(d) {
				if (d) {
					d._processSuccess = function(r, R, s, g, c, e) {
						var u, U;
						u = r.requestUri;
						U = u.replace(this.sServiceUrl, "");
						if (!jQuery.sap.startsWith(U, '/')) {
							U = '/' + U;
						}
						U = this._normalizePath(U);
						if ("/Forward" === U && R.data) {
							R.data.Status = "Forwarded";
						}
						a.prototype._processSuccess.apply(this, arguments);
						var f = parseFloat(sap.ui.version);
						if (!isNaN(f) && f <= 1.40 && u.indexOf("TaskCollection") > -1 && u.indexOf("$expand") > -1) {
							try {
								var E = decodeURIComponent(u.substring(u.indexOf("$expand"))).split("&");
								var h = E[0].substring(E[0].indexOf("=") + 1).split(",");
								var m = sap.ca.scfld.md.app.Application.getImpl().oCurController.MasterCtrl;
								var k = m._oMasterListBinding;
								var C = k._getContexts(k.iLastStartIndex, k.iLastLength, k.iLastThreshold);
								for (var i = 0; i < C.length; i++) {
									if (C[i].sPath === U) {
										if (JSON.stringify(C[i].getObject()) !== k.aLastContextData[i]) {
											var o = jQuery.extend(true, {}, C[i].getObject());
											for (var j = 0; j < h.length; j++) {
												delete o[h[j]];
											}
											if (JSON.stringify(o) === k.aLastContextData[i]) {
												k.aLastContextData[i] = JSON.stringify(C[i].getObject());
											}
										}
										break;
									}
								}
							} catch (l) {}
						}
					};
				}
				return this;
			},
			overrideImportData: function(d) {
				if (d) {
					d._doNotoverwriteNullPropertyValue = true;
					d._importData = function(D, c) {
						var t = this,
							l, k, r, e;
						if (D.results) {
							l = [];
							jQuery.each(D.results, function(i, f) {
								var k = t._importData(f, c);
								if (k) {
									l.push(k);
								}
							});
							return l;
						} else {
							k = this._getKey(D);
							if (!k) {
								return k;
							}
							e = this.oData[k];
							if (!e) {
								e = D;
								this.oData[k] = e;
							}
							jQuery.each(D, function(n, p) {
								if (p && (p.__metadata && p.__metadata.uri || p.results) && !p.__deferred) {
									r = t._importData(p, c);
									if (jQuery.isArray(r)) {
										e[n] = {
											__list: r
										};
									} else {
										e[n] = {
											__ref: r
										};
									}
								} else if (!p || !p.__deferred) {
									if (t._doNotoverwriteNullPropertyValue) {
										if (p != null) {
											if (n === "CompletionDeadLine" && !e.IsOverdue) {
												if (p - (new Date()) < 0) {
													e.IsOverdue = true;
												}
											}
											e[n] = p;
										}
									} else {
										e[n] = p;
									}
								}
							});
							c[k] = true;
							return k;
						}
					};
				}
				return this;
			}
		});
	});