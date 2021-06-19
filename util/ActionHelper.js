/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object", "cross/fnd/fiori/inbox/util/Parser"], function(O, P) {
	return O.extend("cross.fnd.fiori.inbox.util.ActionHelper", {
		GUILinkProperty: "GUI_Link",
		_oURLParsingService: null,
		constructor: function(c, v) {
			this._oView = v;
			this._oController = c;
			this._oResourceBundle = v.getModel("i18n").getResourceBundle();
		},
		isIntentURL: function(u) {
			this._oURLParsingService = this._oURLParsingService || sap.ushell && sap.ushell.Container && sap.ushell.Container.getService && sap
				.ushell.Container.getService("URLParsing");
			return this._oURLParsingService && this._oURLParsingService.isIntentUrl(u) ? true : false;
		},
		isAnnotationBasedTask: function(u) {
			var p = P.fnParseComponentParameters(u);
			return (!jQuery.isEmptyObject(p)) ? true : false;
		},
		getURLParsingService: function() {
			return this._oURLParsingService;
		},
		fnValidateOpenTaskURLAndRedirect: function(u, p) {
			if (sap.ushell.Container) {
				var a = sap.ushell.Container.getService("URLParsing");
				if (a) {
					if (a.isIntentUrl(u)) {
						sap.m.URLHelper.redirect(encodeURI(u), true);
					} else if (jQuery.sap.validateUrl(u)) {
						sap.m.URLHelper.redirect(this.addOrReplaceParameters(u, p ? this._getSapURLParameters() : {}), true);
					} else {
						if (jQuery.sap.validateUrl(encodeURI(u))) {
							u = encodeURI(u);
							sap.m.URLHelper.redirect(this.prependParameters(u, p ? this._getSapURLParameters() : {}), true);
						} else {
							sap.ca.ui.message.showMessageBox({
								type: sap.ca.ui.message.Type.ERROR,
								message: this._oResourceBundle.getText("dialog.error.taskExecutionUI")
							});
						}
					}
				} else {
					jQuery.sap.log.error("URL Parsing service look up failed as a result Open Task action will not work.");
				}
			} else {
				jQuery.sap.log.error("ushell container does not exist as a result Open Task action will not work.");
			}
		},
		addOrReplaceParameters: function(u, a) {
			var b = sap.ushell.Container.getService("URLParsing");
			var h = b.getHash(u);
			var r = u;
			if (h) {
				r = u.substring(0, u.indexOf(h) - 1);
			}
			var p;
			if (r.indexOf("?") !== -1) {
				p = r.substring(r.indexOf("?"));
				r = r.substring(0, r.indexOf("?"));
			}
			var c = b.parseParameters(p);
			for (var d in a) {
				c[d] = a[d];
			}
			p = b.paramsToString(c);
			var e = r + "?" + p;
			if (h) {
				e += "#" + h;
			}
			return e;
		},
		prependParameters: function(u, a) {
			var b = sap.ushell.Container.getService("URLParsing");
			var h = b.getHash(u);
			var r = u;
			if (h) {
				r = u.substring(0, u.indexOf(h) - 1);
			}
			var p;
			if (r.indexOf("?") !== -1) {
				p = r.substring(r.indexOf("?") + 1);
				r = r.substring(0, r.indexOf("?"));
			}
			var c = b.paramsToString(a);
			if (p) {
				p = c + "&" + p;
			} else {
				p = c;
			}
			var d = r + "?" + p;
			if (h) {
				d += "#" + h;
			}
			return d;
		},
		isOpenTaskEnabled: function(i, e) {
			if (!i.TaskSupports.UIExecutionLink) {
				return false;
			} else if ((i.GUI_Link || (i.UIExecutionLink && i.UIExecutionLink.GUI_Link)) && (this.isAnnotationBasedTask(i.GUI_Link ? i.GUI_Link :
					i.UIExecutionLink.GUI_Link))) {
				return false;
			} else if (i.TaskSupports.UIExecutionLink && !i.GUI_Link && i.UIExecutionLink && !i.UIExecutionLink.GUI_Link) {
				return false;
			} else if (e) {
				return false;
			} else {
				return true;
			}
		},
		_getSapURLParameters: function() {
			var p = this._getThemeandLanguageLocaleParams();
			jQuery.extend(p, this._getUI5LegacyFormatParams());
			jQuery.extend(p, this._getSapAccessibilityParam());
			jQuery.extend(p, this._getSapStatisticsParam());
			return p;
		},
		_getUI5LegacyFormatParams: function() {
			var o = {};
			var l = sap.ui.getCore().getConfiguration().getFormatSettings().getLegacyDateFormat();
			var L = sap.ui.getCore().getConfiguration().getFormatSettings().getLegacyTimeFormat();
			var s = sap.ui.getCore().getConfiguration().getFormatSettings().getLegacyNumberFormat();
			if (l) {
				o["sap-ui-legacy-date-format"] = l;
			}
			if (L) {
				o["sap-ui-legacy-time-format"] = L;
			}
			if (s) {
				o["sap-ui-legacy-number-format"] = s;
			}
			return o;
		},
		_getSapAccessibilityParam: function() {
			var a = {};
			var A = sap.ushell.Container.getUser().getAccessibilityMode();
			if (A) {
				a["sap-accessibility"] = "X";
			}
			return a;
		},
		_getSapStatisticsParam: function() {
			var s = {};
			var S = sap.ui.getCore().getConfiguration().getStatistics();
			if (S) {
				s["sap-statistics"] = S;
			}
			return s;
		},
		_getThemeandLanguageLocaleParams: function() {
			var a = sap.ui.getCore().getConfiguration().getTheme();
			var l = sap.ui.getCore().getConfiguration().getSAPLogonLanguage() || "";
			var L = sap.ui.getCore().getConfiguration().getLocale();
			var t = sap.ushell.Container ? sap.ushell.Container.getUser().getTheme(sap.ushell.User.prototype.constants.themeFormat.NWBC) : null;
			var p = {};
			var r = /^sap_hcb/i;
			var T = {
				sap_hcb: {
					WDJ: "/com.sap.ui.lightspeed/themes/sap_hcb",
					WDA: "sap_hcb"
				}
			};
			if (a) {
				if (r.test(a)) {
					p["sap-ui-theme"] = a;
					p["sap-theme-name"] = a;
					var o = T[a];
					if (o) {
						if (o['WDJ']) {
							p["sap-cssurl"] = location.protocol + "//" + location.host + ":" + location.port + o['WDJ'];
						}
						if (o['WDA']) {
							p["sap-theme"] = o['WDA'];
						}
					}
				} else {
					p["sap-ui-theme"] = a;
					p["sap-theme-name"] = a;
				}
			}
			if (l) {
				p["sap-language"] = l;
			}
			if (L) {
				p["sap-locale"] = L;
			}
			if (t) {
				p["sap-theme-NWBC"] = t;
			}
			return p;
		},
		openTaskInNewWindow: function(u) {
			if (u && u.GUI_Link && u.GUI_Link !== "") {
				var U = u.GUI_Link;
				var d = sap.ca.scfld.md.app.Application.getImpl().getComponent().getDataManager();
				this.fnValidateOpenTaskURLAndRedirect(U, d.isForwardUserSettings());
			} else {
				this.showErrorOnOpenTask();
			}
		},
		showErrorOnOpenTask: function() {
			jQuery.sap.require("sap.m.MessageToast");
			sap.m.MessageToast.show(this.i18nBundle.getText("dialog.error.taskExecutionUI"));
		},
		getSelectedTasksDetails: function(s) {
			var S = {
				aSelectedTaskTypes: [],
				oSelectedTaskTypes: {},
				aItems: [],
				SupportsClaim: true,
				SupportsRelease: true,
				SupportsForward: true,
				SupportsResubmit: true,
				SupportsConfirm: true,
				bContainsConfirmableItem: false
			};
			var I, b, t, T, a, o;
			for (var i in s) {
				b = s[i];
				t = b.getProperty("TaskSupports");
				T = b.getProperty("TaskDefinitionID");
				a = b.getProperty("InstanceID");
				o = b.getProperty("SAP__Origin");
				I = {
					InstanceID: a,
					SAP__Origin: o,
					sContextPath: b.getPath()
				};
				S.aItems.push(I);
				if (!S.oSelectedTaskTypes[T]) {
					S.oSelectedTaskTypes[T] = {
						TaskDefinitionID: T,
						InstanceID: a,
						SAP__Origin: o
					};
					S.aSelectedTaskTypes.push(T);
				}
				if (S.SupportsClaim && !t.Claim) {
					S.SupportsClaim = false;
				}
				if (S.SupportsRelease && !t.Release) {
					S.SupportsRelease = false;
				}
				if (S.SupportsForward && !t.Forward) {
					S.SupportsForward = false;
				}
				if (S.SupportsResubmit && !t.Resubmit) {
					S.SupportsResubmit = false;
				}
				if (S.SupportsConfirm && !t.Confirm) {
					S.SupportsConfirm = false;
				}
				if (!S.bContainsConfirmableItem && t.Confirm) {
					S.bContainsConfirmableItem = true;
				}
			}
			return S;
		},
		getCommonDecisionsForMultipleTasks: function(l) {
			if (l.length === 0) {
				return [];
			} else if (l.length === 1) {
				return l[0];
			}
			var I = l[0];
			for (var i = 1; i < l.length; i++) {
				I = this._getCommonDecisionsForTwoTasks(I, l[i]);
				if (I.length === 0) {
					break;
				}
			}
			return I;
		},
		_getCommonDecisionsForTwoTasks: function(a, A) {
			var r = [];
			var i, j;
			var b = a.length;
			var c = A.length;
			for (i = 0; i < b; i++) {
				for (j = 0; j < c; j++) {
					if (a[i].DecisionKey === A[j].DecisionKey && a[i].Nature === A[j].Nature) {
						r.push(a[i]);
					}
				}
			}
			return r;
		},
		getEncodedURL: function(u) {
			var U = u.split("?");
			u = U[0] + "?" + jQuery.sap.encodeURLParameters(this.getQueryObject(U[1]));
			return u;
		},
		getQueryObject: function(q) {
			var p = {},
				Q, t;
			Q = q.split("&");
			jQuery.each(Q, jQuery.proxy(function(i, s) {
				t = this.splitString(s, "=");
				p[t[0]] = t[1];
			}, this));
			return p;
		},
		splitString: function(s, S) {
			var p = [],
				i = s.indexOf(S) + 1;
			if (i) {
				p[0] = s.split(S, 1)[0];
				p[1] = s.substring(i);
			}
			return p;
		},
		fnCheckGUILinkPropertySupported: function() {
			if (this._bGUILinkPropertyInMetadata == null) {
				this._bGUILinkPropertyInMetadata = false;
				var t = this.oDataManager.oServiceMetaModel.getODataEntityType("TASKPROCESSING.Task");
				if (t) {
					if (this.oDataManager.oServiceMetaModel.getODataProperty(t, this.GUILinkProperty)) {
						this._bGUILinkPropertyInMetadata = true;
					}
				}
			}
			return this._bGUILinkPropertyInMetadata;
		}
	});
});