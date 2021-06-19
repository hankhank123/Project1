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
sap.ca.scfld.md.controller.BaseFullscreenController.extend("cross.fnd.fiori.inbox.view.ViewSubstitution", {
	_MAX_AGENT: 100,
	extHookAddFooterButtonsForSubs: null,
	oConfirmationDialogManager: cross.fnd.fiori.inbox.util.ConfirmationDialogManager,
	onInit: function() {
		sap.ca.scfld.md.controller.BaseFullscreenController.prototype.onInit.call(this);
		var v = this.getView();
		this.sAddSubUniqueId = this.createId() + "DLG_ADD_SUBST";
		this.oFormatToDisplay = sap.ui.core.format.DateFormat.getDateInstance({
			pattern: "dd MMM yyyy"
		});
		this.i18nBundle = v.getModel("i18n").getResourceBundle();
		var c = sap.ca.scfld.md.app.Application.getImpl().getComponent();
		this.oDataManager = c.getDataManager();
		if (!this.oDataManager) {
			var o = this.getView().getModel();
			this.oDataManager = new cross.fnd.fiori.inbox.util.DataManager(o, this);
			c.setDataManager(this.oDataManager);
		}
		c.getEventBus().subscribe("cross.fnd.fiori.inbox.dataManager", "showReleaseLoader", jQuery.proxy(this.onShowReleaseLoader, this));
		c.getEventBus().subscribe("cross.fnd.fiori.inbox.dataManager", "showLoaderInDialogs", jQuery.proxy(this.onShowLoaderInDialogs, this));
		this.oHeaderFooterOptions = {
			sI18NFullscreenTitle: "substn.title",
			bSuppressBookmarkButton: true
		};
		this.oFooterBtnList = {};
		this.oFooterBtnList.AddSubstituteBtn = {
			sI18nBtnTxt: "substn.create.substitute_button",
			onBtnPressed: jQuery.proxy(this.onOpenAddSubstituteDialog, this)
		};
		this.oFooterBtnList.resendBtn = {
			sI18nBtnTxt: "substn.resynchronize.resend_button",
			onBtnPressed: jQuery.proxy((function() {
				this.showDialogForResynchronize();
			}), this)
		};
		this.oFooterBtnList.deleteRuleBtn = {
			sI18nBtnTxt: "substn.delete.delete_button",
			onBtnPressed: jQuery.proxy((function() {
				this.handleDelete();
			}), this)
		};
		this.showInitialFooterButtons();
		this.oRouter.attachRouteMatched(this.handleNavToSubstitution, this);
	},
	onShowReleaseLoader: function(c, e, v) {
		this.getView().setBusyIndicatorDelay(1000);
		this.getView().setBusy(v.bValue);
	},
	onShowLoaderInDialogs: function(c, e, v) {
		var s = this._oAddSubstituteFrag;
		if (s) {
			s.setBusyIndicatorDelay(1000).setBusy(v.bValue);
		}
	},
	handleNavToSubstitution: function(e) {
		if (e.getParameter("name") === "substitution") {
			if (!this.oDataManager.oModel.getServiceMetadata()) {
				this.oDataManager.oModel.attachMetadataLoaded(jQuery.proxy(function() {
					this.refreshData();
				}, this));
			} else {
				this.refreshData();
			}
		}
	},
	groupBy: function(m) {
		var g = {};
		m.forEach(function(r) {
			var a = JSON.stringify(r.User);
			g[a] = g[a] || [];
			g[a].push(r);
		});
		return Object.keys(g).map(function(a) {
			return g[a];
		});
	},
	sortAndGroupSubstitutionData: function(s) {
		var A = [];
		var I = [];
		jQuery.each(s, function(a, r) {
			if (r.bActive) {
				A.push(r);
			} else {
				I.push(r);
			}
		});
		A.sort(function(a, b) {
			return a.FullName.toLocaleLowerCase().localeCompare(b.FullName.toLocaleLowerCase());
		});
		I.sort(function(a, b) {
			return a.FullName.toLocaleLowerCase().localeCompare(b.FullName.toLocaleLowerCase());
		});
		s = A.concat(I);
		var S = this.groupBy(s);
		var o = S[0];
		for (var i = 1; i < S.length; i++) {
			o = jQuery.merge(o, S[i]);
		}
		return o;
	},
	findActiveSystems: function(s, S) {
		var a = [];
		var b = [];
		var c;
		jQuery.each(S, function(i, o) {
			c = false;
			jQuery.each(s.aKeys, function(k, K) {
				if (o.SAP__Origin === K.SAP__Origin) {
					a.push(o.SAP__Origin);
					c = true;
					return false;
				}
			});
			if (!c) {
				b.push(o.SAP__Origin);
			}
		});
		s.aSystemsWithoutRule = b;
		s.bExistInAllSystem = (b.length < 1);
	},
	handleIconTabBarSelect: function(e) {
		var t = this.byId('substitutionRules');
		t.removeSelections();
		var b = t.getBinding("items");
		var f = {};
		var s = this.getView().getModel("substitutionTypeModel");
		this.showInitialFooterButtons();
		if (e.getSource().getSelectedKey() === "UNPLANNED") {
			if (!s) {
				s = new sap.ui.model.json.JSONModel({
					data: {
						bPlanned: false
					}
				});
			}
			s.oData.data.bPlanned = false;
			f = new sap.ui.model.Filter("Mode", "EQ", "TAKE_OVER");
			b.filter([f]);
		} else {
			if (!s) {
				s = new sap.ui.model.json.JSONModel({
					data: {
						bPlanned: true
					}
				});
			}
			s.oData.data.bPlanned = true;
			f = new sap.ui.model.Filter("Mode", "EQ", "RECEIVE_TASKS");
			b.filter([f]);
		}
		s.checkUpdate(false);
	},
	refreshData: function() {
		var s = function(S, o, a) {
			var b = [];
			var c = [];
			var e = cross.fnd.fiori.inbox.Substitution.getEndOfCurrentDate();
			jQuery.each(S.results, function(i, f) {
				if (!cross.fnd.fiori.inbox.Substitution.isRuleOutdated(f.EndDate)) {
					var n = true;
					jQuery.each(b, function(g, j) {
						if (f.User.toUpperCase() === j.User.toUpperCase() && f.BeginDate.getDate() === j.BeginDate.getDate() && f.BeginDate.getMonth() ===
							j.BeginDate.getMonth() && f.BeginDate.getFullYear() === j.BeginDate.getFullYear() && f.EndDate.getDate() === j.EndDate.getDate() &&
							f.EndDate.getMonth() === j.EndDate.getMonth() && f.EndDate.getFullYear() === j.EndDate.getFullYear() && f.Profile === j.Profile &&
							f.ProfileText === j.ProfileText) {
							j.aKeys.push({
								SubstitutionRuleId: f.SubstitutionRuleID,
								SAP__Origin: f.SAP__Origin
							});
							n = false;
							return false;
						}
					});
					if (n) {
						b.push({
							User: f.User.toUpperCase(),
							BeginDate: f.BeginDate,
							EndDate: f.EndDate,
							Profile: f.Profile,
							ProfileText: f.ProfileText,
							FullName: f.FullName,
							SupportsDeleteSubstitutionRule: f.SupportsDeleteSubstitutionRule,
							Mode: f.Mode,
							bActive: f.BeginDate <= e,
							aKeys: [{
								SubstitutionRuleId: f.SubstitutionRuleID,
								SAP__Origin: f.SAP__Origin
							}]
						});
					}
				}
			});
			if (b.length > 0) {
				c = this.sortAndGroupSubstitutionData(b);
				jQuery.each(c, jQuery.proxy(function(f, g) {
					if (g.Profile === "" && g.ProfileText === "") {
						this.findActiveSystems(g, a);
					} else {
						var h = [];
						jQuery.each(o, function(i, p) {
							if (p.Profile === g.Profile && p.ProfileText === g.ProfileText) {
								h.push({
									SAP__Origin: p.SAP__Origin
								});
							}
						});
						this.findActiveSystems(g, h);
					}
				}, this));
			}
			var v = this.getView();
			var u = false;
			var V = sap.ui.Device.system.phone ? true : false;
			var d = {};
			if (v.getModel("substitutionTypeModel")) {
				u = !v.getModel("substitutionTypeModel").oData.data.bPlanned;
			}
			this.oModel2 = new sap.ui.model.json.JSONModel({
				modelData: c
			});
			v.setModel(this.oModel2, "substitution");
			var B = this.byId('substitutionRules').getBinding("items");
			if (u) {
				B.filter([new sap.ui.model.Filter("Mode", "EQ", "TAKE_OVER")]);
				d = new sap.ui.model.json.JSONModel({
					data: {
						bPlanned: false
					}
				});
			} else {
				B.filter([new sap.ui.model.Filter("Mode", "EQ", "RECEIVE_TASKS")]);
				d = new sap.ui.model.json.JSONModel({
					data: {
						bPlanned: true
					}
				});
			}
			d.setProperty("/bPhone", V);
			v.setModel(d, "substitutionTypeModel");
			this.substituteStatusModel = new sap.ui.model.json.JSONModel();
			this.setSubstituteStatusData();
			v.setModel(this.substituteStatusModel, "userDetails");
			this.substituteStatusModel.checkUpdate(true);
			this.showInitialFooterButtons();
		};
		this.oDataManager.readSubstitutionData(jQuery.proxy(s, this));
	},
	refreshFooterOptions: function() {
		this._oHeaderFooterOptions = jQuery.extend(this._oHeaderFooterOptions, this.oHeaderFooterOptions);
		this.setHeaderFooterOptions(this._oHeaderFooterOptions);
	},
	setSubstituteStatusData: function() {
		var u = {};
		jQuery.each(this.oModel2.oData["modelData"], jQuery.proxy(function(i, s) {
			if (s.Mode == "RECEIVE_TASKS") {
				if (u[s.User] !== undefined) {
					if (!u[s.User].bActive) {
						u[s.User].bActive = s.bActive;
					}
				} else {
					u[s.User] = {
						bActive: s.bActive
					};
				}
			}
		}, this));
		cross.fnd.fiori.inbox.Substitution.setUserInfo(u);
		this.substituteStatusModel.setData(u);
	},
	showInitialFooterButtons: function() {
		this.oHeaderFooterOptions = jQuery.extend(this.oHeaderFooterOptions, {
			buttonList: [this.oFooterBtnList.AddSubstituteBtn]
		});
		this.refreshFooterOptions();
	},
	onEmployeeProfileLaunch: function(e) {
		var b = e.getSource().getBindingContext("substitution");
		var s = this.oModel2.getProperty("aKeys", b)[0].SAP__Origin;
		var u = this.oModel2.getProperty("User", b);
		var S = cross.fnd.fiori.inbox.Conversions.getSelectedControl(e);
		this.oDataManager.readUserInfo(s, u, jQuery.proxy(cross.fnd.fiori.inbox.util.EmployeeCard.displayEmployeeCard, this, S));
	},
	refreshOnSubstitutionRuleSuccess: function(s, e) {
		if (e.length == 0) {
			jQuery.sap.delayedCall(500, this, function() {
				sap.ca.ui.message.showMessageToast(this.i18nBundle.getText("substn.create.success"));
			});
		}
		this.refreshData();
	},
	createSubstituionRuleEntry: function(b) {
		var s = {};
		s.BeginDate = "\/Date(" + (this.oModel2.getProperty("BeginDate", b)).getTime() + ")\/";
		s.EndDate = "\/Date(" + (this.oModel2.getProperty("EndDate", b)).getTime() + ")\/";
		s.User = this.oModel2.getProperty("User", b);
		s.Mode = this.oModel2.getProperty("Mode", b);
		s.Profile = this.oModel2.getProperty("Profile", b);
		s.ProfileText = this.oModel2.getProperty("ProfileText", b);
		s.IsEnabled = true;
		return s;
	},
	showDialogForResynchronize: function() {
		var b = this.oFooterBtnList.BindingContext;
		var t = this;
		this.oConfirmationDialogManager.showDecisionDialog({
			showNote: false,
			title: t.i18nBundle.getText("substn.resynchronize.title"),
			question: t.i18nBundle.getText("substn.resynchronize.question"),
			confirmButtonLabel: t.i18nBundle.getText("XBUT_OK"),
			noteMandatory: false,
			confirmActionHandler: jQuery.proxy(function(B, r) {
				this.showInitialFooterButtons();
				var s = this.oModel2.getProperty("aSystemsWithoutRule", b);
				var e = this.createSubstituionRuleEntry(B);
				this.oDataManager._createSubstitutionRule(e, s, jQuery.proxy(this.refreshOnSubstitutionRuleSuccess, this));
			}, this, b)
		});
	},
	updateFooterBtnList: function(s, b) {
		var B = [];
		B = s ? [this.oFooterBtnList.AddSubstituteBtn, this.oFooterBtnList.deleteRuleBtn, this.oFooterBtnList.resendBtn] : [this.oFooterBtnList
			.AddSubstituteBtn, this.oFooterBtnList.deleteRuleBtn
		];
		if (this.extHookAddFooterButtonsForSubs) {
			this.extHookAddFooterButtonsForSubs(B);
		}
		this.oHeaderFooterOptions = jQuery.extend(this.oHeaderFooterOptions, {
			buttonList: B
		});
		this.refreshFooterOptions();
	},
	handleLiveChange: function(e) {
		if (e.getSource().getValue() === "") {
			var s = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_SEARCH_USERS");
			s.getModel("userModel").setProperty("/users", {});
		}
	},
	handleRuleSelection: function(e) {
		var b = e.getParameter('listItem').getBindingContext("substitution");
		this.oFooterBtnList.BindingContext = b;
		var i = !jQuery.isEmptyObject(this.oModel2.getProperty("aSystemsWithoutRule", b));
		this.updateFooterBtnList(i, b);
	},
	handleDelete: function(e) {
		var t = this.byId('substitutionRules');
		this.oConfirmationDialogManager.showDecisionDialog({
			question: this.i18nBundle.getText("substn.delete.question"),
			title: this.i18nBundle.getText("substn.delete.title"),
			confirmButtonLabel: this.i18nBundle.getText("XBUT_OK"),
			noteMandatory: false,
			confirmActionHandler: jQuery.proxy(function(r) {
				var b = this.oFooterBtnList.BindingContext;
				var R = this.oModel2.getProperty("aKeys", b);
				var s = R.length > 1 ? this.successMassDelete : this.successDelete;
				this.oDataManager.deleteSubstitution(R, jQuery.proxy(s, this, b));
				t.removeSelections();
			}, this)
		});
	},
	successMassDelete: function(c, s, e) {
		if (e.length === 0) {
			this.successDelete(c);
		} else {
			if (s.length > 0) {
				var p = c.getPath().split("/");
				var r = [];
				for (var i = s.length - 1; i >= 0; i--) {
					var r = this.oModel2.oData[p[1]][p[2]].aKeys.splice(s[i], 1);
					this.oModel2.oData[p[1]][p[2]].aSystemsWithoutRule.push(r[0].SAP__Origin);
				}
				this.oModel2.oData[p[1]][p[2]].bExistInAllSystem = false;
				this.oModel2.checkUpdate(false);
			}
		}
	},
	successDelete: function(c) {
		var p = c.getPath().split("/");
		this.oModel2.oData[p[1]].splice(p[2], 1);
		if (this.oModel2.oData[p[1]].length > 0) {
			this.oModel2.oData[p[1]] = this.sortAndGroupSubstitutionData(this.oModel2.oData[p[1]]);
		}
		this.oModel2.checkUpdate(false);
		this.setSubstituteStatusData();
		this.substituteStatusModel.checkUpdate(true);
		sap.ca.ui.message.showMessageToast(this.i18nBundle.getText("substn.delete.success"));
		this.showInitialFooterButtons();
	},
	onOpenAddSubstituteDialog: function(e) {
		if (!this._oAddSubstituteFrag) {
			this._oAddSubstituteFrag = sap.ui.xmlfragment(this.sAddSubUniqueId, "cross.fnd.fiori.inbox.frag.AddSubstitute", this);
			this.getView().addDependent(this._oAddSubstituteFrag);
			this._initializeAddSubstitueDelegates();
			this._changeDetailIconForUserList();
			this._oAddSubstituteFrag.setModel(new sap.ui.model.json.JSONModel(), "selectedSubstituteModel");
			this._oAddSubstituteFrag.setModel(new sap.ui.model.json.JSONModel(), "selectedProfileModel");
		}
		this._oAddSubstituteFrag.open();
	},
	_initializeAddSubstitueDelegates: function(e) {
		var t = this;
		this._addEventDelegateToPage(sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "detail_substitutes"), {
			onBeforeShow: jQuery.proxy(function() {
				this._setSaveVisibility(false);
			}, t)
		});
		this._addEventDelegateToPage(sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "detail_profiles"), {
			onBeforeShow: jQuery.proxy(function() {
				this._setSaveVisibility(false);
			}, t)
		});
	},
	_addEventDelegateToPage: function(p, e) {
		p.addEventDelegate(e, this);
	},
	navToSearchForSubstitutes: function(e) {
		var n = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "NAV_ADD_SUBST");
		var d = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "detail_substitutes");
		var s = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_SEARCH_USERS");
		var u = s.getModel("userModel");
		if (!u) {
			s.setModel(new sap.ui.model.json.JSONModel(), "userModel");
		}
	},
	onSearchOfSubstitutes: function(e) {
		var s = e.getSource().getValue();
		this.searchUsers(s);
	},
	searchUsers: function(s) {
		if (s == "") {
			this.resetAddSubstituteForm();
			return;
		}
		this.navToSearchForSubstitutes(this);
		var o;
		var S = function(r) {
			o = r[0].SAP__Origin;
		};
		this.oDataManager.readSystemInfoCollection(S, jQuery.proxy(S, this.searchUsers));
		if (o) {
			this.oDataManager.searchUsers(o, s, this._MAX_AGENT, jQuery.proxy(function(r) {
				var a = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_SEARCH_USERS");
				a.getModel("userModel").setProperty("/users", r);
			}, this));
		}
	},
	navToGetProfiles: function(e, p) {
		var P = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_PROFILES");
		var s = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_USR_DATA");
		var a = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_ALL_TOPICS");
		var d = p.DisplayName;
		var c = p.Company;
		var I = cross.fnd.fiori.inbox.Conversions.getRelativeMediaSrc(p.__metadata.media_src);
		var o = P.getModel("profiles");
		P.removeSelections();
		a.removeSelections();
		s.setModel(new sap.ui.model.json.JSONModel(), "userDataModel");
		var S = s.getModel("userDataModel");
		S.setProperty("/displayName", d);
		S.setProperty("/company", c);
		S.setProperty("/media_src", I);
		S.setProperty("/parameters", p);
		if (!o) {
			P.setModel(new sap.ui.model.json.JSONModel(), "profiles");
		}
		this.oDataManager.readSubstitutionProfiles(jQuery.proxy(function(r) {
			var b = {};
			jQuery.each(r, function(i, g) {
				var h = {};
				h.Profile = g.Profile;
				h.ProfileText = g.ProfileText;
				b[g.Profile + " - " + g.ProfileText] = h;
			});
			var f = [];
			var k = 0;
			jQuery.each(b, function(j, i) {
				f[k++] = i;
			});
			var P = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_PROFILES");
			P.getModel("profiles").setProperty("/profiles", f);
		}, this));
		var n = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "NAV_ADD_SUBST");
		var D = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "detail_profiles");
		n.to(D);
	},
	handleCreateSubstitutionPopOverCancel: function(e) {
		this._oAddSubstituteFrag.close();
	},
	handleUserSelectionChange: function(e) {
		var l = e.getSource();
		var p = this.getUserNavigationParameters(l);
		this.navToGetProfiles(e, p);
	},
	getUserNavigationParameters: function(l) {
		var b = l.getBindingContext("userModel");
		return b.getObject();
	},
	geProfileNavigationParameters: function(l) {
		var b = l.getBindingContext("profiles");
		return {
			Profile: b.getProperty("Profile"),
			ProfileText: b.getProperty("ProfileText")
		};
	},
	handleUserDetailPress: function(e) {
		var l = e.getSource();
		var p = this.getUserNavigationParameters(l);
		cross.fnd.fiori.inbox.util.EmployeeCard.displayEmployeeCard(l, p);
	},
	onNavBack: function(e, p) {
		sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "NAV_ADD_SUBST").back(p);
		var l = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_PROFILES");
		var a = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_ALL_TOPICS");
		l.removeSelections();
		a.removeSelections();
	},
	navToSubstitutionPeriod: function(e, p) {
		this._setSaveVisibility(true);
		var s = this._oAddSubstituteFrag.getModel("substitutionTypeModel").oData.data.bPlanned;
		var l = e.getParameter("listItem");
		var u = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_USR_DATA");
		var t = l.getProperty("title");
		var S = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "date_selection");
		var c = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "selectionCalendar");
		var n = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "NAV_ADD_SUBST");
		c.removeAllSelectedDates();
		u.getModel("userDataModel").setProperty("/profileTitle", t);
		S.setModel(u.getModel("userDataModel"), "userDataModel");
		var o = S.getModel("userDataModel");
		if (p) {
			o.setProperty("/profileParameters", p);
		} else {
			S.getModel("userDataModel").setProperty("/profileParameters", "");
		}
		if (!o.getProperty("/period")) o.setProperty("/period", this.i18nBundle.getText("substn.create.default_date"));
		if (!s) {
			this._setSaveVisibility(true);
			var f = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "yyyyMMdd"
			});
			var a = {
				startDate: f.format(new Date())
			};
			o.setProperty("/selectedDates", a);
			return;
		}
		c.focusDate(new Date());
		n.to(S);
	},
	onSelectProfile: function(e) {
		var l = e.getParameter("listItem");
		var p = this.geProfileNavigationParameters(l);
		var a = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_ALL_TOPICS");
		a.removeSelections();
		this.navToSubstitutionPeriod(e, p);
	},
	onSelectAllTopics: function(e) {
		var p = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_PROFILES");
		p.removeSelections();
		this.navToSubstitutionPeriod(e);
	},
	onChangeRange: function(e) {
		var t = this;
		var f = sap.ui.core.format.DateFormat.getDateInstance({
			pattern: "yyyyMMdd"
		});
		var s = e.getSource().getSelectedDates();
		var c = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "selectionCalendar");
		var F = (s[0].getStartDate());
		var S = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "date_selection");
		var C = new Date();
		var d = f.format((C));
		var a = f.format(F);
		var b = t.oFormatToDisplay.format(F);
		var T = (s[0].getEndDate());
		var g = null;
		if (T != null) {
			g = f.format(T);
			var h = t.oFormatToDisplay.format(T);
			if (a < d || g < d) {
				c.removeAllSelectedDates();
				a = d;
				g = null;
				S.getModel("userDataModel").setProperty("/period", t.i18nBundle.getText("substn.dateSelection.from") + " " + "");
				return;
			};
			S.getModel("userDataModel").setProperty("/period", t.i18nBundle.getText("substn.dateSelection.from") + " " + b + " " + t.i18nBundle.getText(
				"substn.dateSelection.to") + " " + h);
		} else {
			if (a < d) {
				a = d;
				c.removeAllSelectedDates();
			} else {
				S.getModel("userDataModel").setProperty("/period", t.i18nBundle.getText("substn.dateSelection.from") + " " + b + "");
			}
		}
		var s = {
			startDate: a,
			endDate: g
		};
		S.getModel("userDataModel").setProperty("/selectedDates", s);
	},
	validateUnplannedSubstitute: function(u) {
		var c = true;
		var s = this.getView().getModel("substitution").oData.modelData;
		jQuery.each(s, function(i, S) {
			if (S.User.toUpperCase() === u.toUpperCase() && S.Mode === "TAKE_OVER") {
				c = false;
				return;
			}
		});
		return c;
	},
	showValidationFailedDialog: function() {
		var t = this;
		var e = t.i18nBundle.getText("dialog.substn.create.unplanned.substitute");
		var d = new sap.m.Dialog({
			title: t.i18nBundle.getText("substn.dialog.create.unplanned.substitute"),
			type: 'Message',
			content: new sap.m.Text({
				text: e
			}),
			beginButton: new sap.m.Button({
				text: t.i18nBundle.getText("XBUT_OK"),
				press: function() {
					d.close();
				}
			}),
			afterClose: function() {
				d.destroy();
			}
		});
		d.open();
	},
	handleCreateSubstitutionPopOverSave: function(e) {
		var u = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_USR_DATA");
		var s = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "date_selection");
		var d = s.getModel("userDataModel").getProperty("/selectedDates");
		var f = sap.ui.core.format.DateFormat.getDateInstance({
			pattern: "yyyyMMdd"
		});
		var F;
		var t;
		if (d) {
			F = d.startDate;
			t = d.endDate;
		} else {
			F = f.format(new Date());
		}
		var U = !this._oAddSubstituteFrag.getModel("substitutionTypeModel").oData.data.bPlanned;
		var E = {};
		var a;
		var b = t;
		var c = F;
		if (b) {
			a = f.parse(b);
			a.setHours(23, 59, 59, 59);
		} else {
			var g = new Date();
			g.setUTCFullYear(9999);
			g.setUTCMonth(11);
			g.setUTCDate(31);
			g.setUTCHours(23);
			g.setUTCMinutes(59);
			g.setUTCSeconds(59);
			g.setUTCMilliseconds(0);
			a = g;
		}
		E.EndDate = "\/Date(" + a.getTime() + ")\/";
		if (c) {
			var h = f.parse(c);
			h.setHours(0, 0, 0, 0);
			E.BeginDate = "\/Date(" + h.getTime() + ")\/";
		}
		E.FullName = u.getModel("userDataModel").getProperty("/parameters").DisplayName;
		E.User = u.getModel("userDataModel").getProperty("/parameters").UniqueName;
		if (U) {
			E.Mode = "TAKE_OVER";
			E.IsEnabled = false;
		} else {
			E.Mode = "RECEIVE_TASKS";
			E.IsEnabled = true;
		}
		if (E.Mode == "TAKE_OVER" && !this.validateUnplannedSubstitute(E.User)) {
			this.handleCreateSubstitutionPopOverCancel();
			this.showValidationFailedDialog();
		}
		var S = u.getModel("userDataModel").getProperty("/parameters");
		var p = s.getModel("userDataModel").getProperty("/profileParameters");
		if (S && p) {
			E.Profile = s.getModel("userDataModel").getProperty("/profileParameters").Profile;
			E.ProfileText = s.getModel("userDataModel").getProperty("/profileParameters").ProfileText;
		}
		var P = this._getProvidersForAddSubstitute(E.Profile, E.ProfileText);
		if (P.length > 0 && ((E.Mode == "RECEIVE_TASKS") || (E.Mode == "TAKE_OVER" && this.validateUnplannedSubstitute(E.User)))) {
			this.oDataManager._createSubstitutionRule(E, P, jQuery.proxy(this.createSubstitutionSuccess, this), jQuery.proxy(this.handleCreateSubstitutionPopOverCancel,
				this));
		}
	},
	createSubstitutionSuccess: function(s, e) {
		if (e.length == 0) {
			var i = this.getView().getModel("i18n").getResourceBundle();
			jQuery.sap.delayedCall(500, this, function() {
				sap.ca.ui.message.showMessageToast(i.getText("substn.create.success"));
			});
		}
		this._oAddSubstituteFrag.close();
		this.refreshData();
	},
	_getProvidersForAddSubstitute: function(p, P) {
		var s = [];
		if (P) {
			var S = function(r) {
				jQuery.each(r, function(i, a) {
					if (a.Profile === p && a.ProfileText === P) {
						s.push(a.SAP__Origin);
					}
				});
			};
			this.oDataManager.readSubstitutionProfiles(S, jQuery.proxy(S, this._getProvidersForAddSubstitute));
		} else {
			var S = function(o) {
				jQuery.each(o, function(i, a) {
					s.push(a.SAP__Origin);
				});
			};
			this.oDataManager.readSystemInfoCollection(S, jQuery.proxy(S, this._getProvidersForAddSubstitute));
		}
		return s;
	},
	onBeforeCloseDialog: function(e) {
		this.resetAddSubstituteForm();
	},
	resetAddSubstituteForm: function() {
		var s = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "SEARCH_SUBSTITUTE");
		var v = "None";
		this._oAddSubstituteFrag.getModel("selectedSubstituteModel").setProperty("/selectedSubstitute", {});
		this._oAddSubstituteFrag.getModel("selectedProfileModel").setProperty("/selectedProfile", {});
		var u = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_SEARCH_USERS").getModel("userModel");
		if (u) {
			u.setProperty("/users", {});
		}
		s.setValue("");
		sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "NAV_ADD_SUBST").backToTop();
	},
	_changeDetailIconForUserList: function() {
		var s = sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "LST_SEARCH_USERS");
		s.bindProperty("showNoData", {
			path: 'userModel>/users',
			formatter: function(u) {
				return true;
			}
		});
	},
	_setSaveVisibility: function(v) {
		sap.ui.core.Fragment.byId(this.sAddSubUniqueId, "BTN_SAVE").setVisible(v);
	}
});