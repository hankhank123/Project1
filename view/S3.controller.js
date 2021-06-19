/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("cross.fnd.fiori.inbox.util.Forward");
jQuery.sap.require("cross.fnd.fiori.inbox.util.ForwardSimple");
jQuery.sap.require("cross.fnd.fiori.inbox.util.SupportInfo");
jQuery.sap.require("cross.fnd.fiori.inbox.util.Conversions");
jQuery.sap.require("cross.fnd.fiori.inbox.attachment.util.AttachmentFormatters");
jQuery.sap.require("cross.fnd.fiori.inbox.util.DataManager");
jQuery.sap.require("sap.ca.scfld.md.controller.BaseDetailController");
jQuery.sap.require("sap.ca.ui.message.message");
jQuery.sap.require("sap.ca.ui.model.type.DateTime");
jQuery.sap.require("cross.fnd.fiori.inbox.util.Resubmit");
jQuery.sap.require("cross.fnd.fiori.inbox.util.Parser");
jQuery.sap.require("cross.fnd.fiori.inbox.util.ConfirmationDialogManager");
jQuery.sap.require("cross.fnd.fiori.inbox.util.EmployeeCard");
jQuery.sap.require("cross.fnd.fiori.inbox.util.ComponentCache");
sap.ca.scfld.md.controller.BaseDetailController.extend("cross.fnd.fiori.inbox.view.S3", {
	extHookOnDataLoaded: null,
	extHookGetEntitySetsToExpand: null,
	extHookChangeFooterButtons: null,
	oModel2: null,
	oDetailData2: null,
	oGenericComponent: null,
	oGenericAttachmentComponent: null,
	oConfirmationDialogManager: cross.fnd.fiori.inbox.util.ConfirmationDialogManager,
	fnFormatterSupportsProperty: cross.fnd.fiori.inbox.Conversions.formatterSupportsProperty,
	oMapCountProperty: {
		"Comments": "CommentsCount",
		"Attachments": "AttachmentsCount",
		"ProcessingLogs": "ProcessingLogsCount"
	},
	bShowAdditionalAttributes: null,
	sCustomTaskTitleAttribute: "CustomTaskTitle",
	sCustomNumberValueAttribute: "CustomNumberValue",
	sCustomNumberUnitValueAttribute: "CustomNumberUnitValue",
	sCustomObjectAttributeValue: "CustomObjectAttributeValue",
	oCrossNavigationService: null,
	OPEN_MODES: ["embedIntoDetails", "replaceDetails", "external", "genericEmbedIntoDetails"],
	onExit: function() {
		this.oComponentCache.destroyCacheContent();
		delete this.oComponentCache;
		if (sap.ca.scfld.md.controller.BaseDetailController.prototype.onExit) {
			sap.ca.scfld.md.controller.BaseDetailController.prototype.onExit.call(this);
		}
	},
	onInit: function() {
		sap.ca.scfld.md.controller.BaseDetailController.prototype.onInit.call(this);
		var v = this.getView();
		this.i18nBundle = v.getModel("i18n").getResourceBundle();
		this.sResubmitUniqueId = this.createId() + "DLG_RESUBMIT";
		var e = sap.ca.scfld.md.app.Application.getImpl().getComponent().getEventBus();
		e.subscribe("cross.fnd.fiori.inbox", "open_supportinfo", this.onSupportInfoOpenEvent, this);
		e.subscribe("cross.fnd.fiori.inbox.dataManager", "taskCollectionFailed", jQuery.proxy(this.onTaskCollectionFailed, this));
		e.subscribe("cross.fnd.fiori.inbox.dataManager", "showReleaseLoaderOnInfoTab", jQuery.proxy(this.onShowReleaseLoaderOnInfoTab, this));
		e.subscribe("cross.fnd.fiori.inbox.dataManager", "showReleaseLoader", jQuery.proxy(this.onShowReleaseLoader, this));
		e.subscribe("cross.fnd.fiori.inbox.dataManager", "UIExecutionLinkRequest", jQuery.proxy(this.onShowReleaseLoader, this));
		this.aCA = [];
		this.aTaskDefinitionData = [];
		this.aUIExecutionLinkCatchedData = [];
		this.oRouter.attachRoutePatternMatched(this.handleNavToDetail, this);
		this.oHeaderFooterOptions = {};
		this.oTabBar = v.byId("tabBar");
		if (this.oTabBar) {
			this.oTabBar.bindProperty("visible", "detail>/showGenericComponent", function(V) {
				if (V === undefined) {
					return false;
				}
				return !V;
			});
		}
		var d = sap.ca.scfld.md.app.Application.getImpl().getComponent().getDataManager();
		if (d) {
			var c = d.getCacheSize();
			if (c) {
				this.oComponentCache = new cross.fnd.fiori.inbox.ComponentCache(c);
			} else {
				this.oComponentCache = new cross.fnd.fiori.inbox.ComponentCache();
			}
		} else {
			this.oComponentCache = new cross.fnd.fiori.inbox.ComponentCache();
		}
		this._setScaffoldingExtension(false);
	},
	onTaskCollectionFailed: function() {
		this.getView().setBusy(false);
	},
	onShowReleaseLoaderOnInfoTab: function(c, e, v) {
		var i = this.getView().byId("infoTabContent");
		if (i) {
			i.setBusyIndicatorDelay(0).setBusy(v.bValue);
		}
	},
	onShowReleaseLoader: function(c, e, v) {
		this.getView().setBusyIndicatorDelay(1000);
		this.getView().setBusy(v.bValue);
	},
	createGenericAttachmentComponent: function(v) {
		var a = v.byId("attachmentComponent");
		if (!jQuery.isEmptyObject(this.oGenericAttachmentComponent)) {
			this.oGenericAttachmentComponent.destroy();
			delete this.oGenericAttachmentComponent;
		}
		this.oGenericAttachmentComponent = sap.ui.getCore().createComponent({
			name: "cross.fnd.fiori.inbox.attachment",
			settings: {
				attachmentHandle: this.fnCreateAttachmentHandle(this.sCtxPath)
			}
		});
		this.oGenericAttachmentComponent.uploadURL(this.fnGetUploadUrl(this.sCtxPath));
		a.setPropagateModel(true);
		a.setComponent(this.oGenericAttachmentComponent);
	},
	createGenericCommentsComponent: function(v) {
		var c = v.byId("commentsContainer");
		if (!jQuery.isEmptyObject(this.oGenericCommentsComponent)) {
			this.oGenericCommentsComponent.destroy();
			delete this.oGenericCommentsComponent;
		}
		this.oGenericCommentsComponent = sap.ui.getCore().createComponent({
			name: "cross.fnd.fiori.inbox.comments",
			componentData: {
				oModel: this.oModel2
			}
		});
		this.oGenericCommentsComponent.setContainer(c);
		c.setComponent(this.oGenericCommentsComponent);
		this.oGenericCommentsComponent.getEventBus().subscribe(null, "commentAdded", jQuery.proxy(this.onCommentPost, this));
		this.oGenericCommentsComponent.getEventBus().subscribe(null, "businessCardRequested", jQuery.proxy(this.onEmployeeLaunchCommentSender,
			this));
	},
	handleNavToDetail: function(e) {
		this.oRoutingParameters = e.getParameters().arguments;
		if (e.getParameter("name") === "detail" || e.getParameter("name") === "detail_deep") {
			this.bIsTableViewActive = (e.getParameter("name") === "detail_deep" && !this.bNavToFullScreenFromLog);
			var i = e.getParameter("arguments").InstanceID;
			var c = e.getParameters().arguments.contextPath;
			var o = e.getParameter("arguments").SAP__Origin;
			if (i && i.lastIndexOf(":") === (i.length - 1)) {
				return;
			}
			if (jQuery.isEmptyObject(this.getView().getModel().oData)) {
				var t = this;
				var d = sap.ca.scfld.md.app.Application.getImpl().getComponent().getDataManager();
				d.setCallFromDeepLinkURL(true);
				d.oDataRead("/TaskCollection(SAP__Origin='" + jQuery.sap.encodeURL(e.getParameter("arguments").SAP__Origin) + "',InstanceID='" +
					jQuery.sap.encodeURL(i) + "')", null,
					function(D) {
						d = sap.ca.scfld.md.app.Application.getImpl().getComponent().getDataManager();
						if (D === undefined || jQuery.isEmptyObject(D)) {
							d.setDetailPageLoadedViaDeepLinking(false);
						} else {
							var I = jQuery.extend(true, {}, D);
							if (t.fnIsTaskInstanceAllowed(I, d)) {
								d.setDetailPageLoadedViaDeepLinking(true);
								t.fnPerpareToRefreshData(c, i, o);
							} else {
								d.setDetailPageLoadedViaDeepLinking(false);
							}
						}
					},
					function(E) {
						sap.ca.scfld.md.app.Application.getImpl().getComponent().getDataManager().setDetailPageLoadedViaDeepLinking(false);
						return;
					});
			} else {
				this.fnPerpareToRefreshData(c, i, o);
			}
		}
	},
	fnPerpareToRefreshData: function(c, i, s) {
		if (!this.stayOnDetailScreen || sap.ui.Device.system.phone) {
			var d = this.oTabBar.getItems()[0];
			this.oTabBar.setSelectedItem(d);
		} else {
			this.stayOnDetailScreen = false;
		}
		var r = {
			sCtxPath: "/" + c,
			sInstanceID: i,
			sSAP__Origin: s,
			bCommentCreated: false
		};
		this.refreshData(r);
		var D = sap.ca.scfld.md.app.Application.getImpl().getComponent().getDataManager();
		if (D != null && D.bOutbox) {
			this.getOwnerComponent().getService("ShellUIService").then(function(S) {
				S.setTitle(sap.ca.scfld.md.app.Application.getImpl().AppI18nModel.getResourceBundle().getText("SHELL_TITLE_OUTBOX"));
			}, function(e) {
				jQuery.sap.log.error("Cannot get ShellUIService", e, "cross.fnd.fiori.inbox");
			});
		}
	},
	fnIsTaskInstanceAllowed: function(i, d) {
		if (d.bOutbox && (i.Status === "COMPLETED" || i.Status === "FOR_RESUBMISSION")) {
			return true;
		} else if (!(d.bOutbox) && (i.Status === "READY" || i.Status === "RESERVED" || i.Status === "IN_PROGRESS" || i.Status === "EXECUTED")) {
			return true;
		} else {
			return false;
		}
	},
	fnGetUploadUrl: function(c) {
		return this.oContext.getModel().sServiceUrl + c + "/Attachments";
	},
	fnCreateAttachmentHandle: function(c) {
		var a = {
			fnOnAttachmentChange: jQuery.proxy(this.onAttachmentChange, this),
			fnOnAttachmentUploadComplete: jQuery.proxy(this.onAttachmentUploadComplete, this),
			fnOnAttachmentDeleted: jQuery.proxy(this.onAttachmentDeleted, this),
			detailModel: this.oModel2,
			uploadUrl: this.fnGetUploadUrl(this.sCtxPath)
		};
		return a;
	},
	fnRenderComponent: function(c) {
		if (this.oDataManager.bDebug) {
			this.oComponentCache.destroyCacheContent();
		}
		var d = this.oModel2.getData();
		var t = d ? d["TaskDefinitionID"] : "";
		var s = d ? d["SAP__Origin"] : "";
		var k = t.concat(s);
		var p = cross.fnd.fiori.inbox.Conversions.formatterPriority.call(this.getView(), s, d ? d["Priority"] : "");
		var S = d ? d["StatusText"] : "";
		if (!S) {
			S = cross.fnd.fiori.inbox.Conversions.formatterStatus.call(this.getView(), s, d ? d["Status"] : "");
		}
		this.oModel2.setProperty("/PriorityText", p);
		this.oModel2.setProperty("/StatusText", S);
		var C = this.oComponentCache.getComponentByKey(k);
		var T = {
			updateTask: jQuery.proxy(this.updateTask, this)
		};
		var P = {
			sServiceUrl: c.ServiceURL,
			sAnnoFileURI: c.AnnotationURL,
			sErrorMessageNoData: this.i18nBundle.getText("annotationcomponent.load.error"),
			sApplicationPath: c.ApplicationPath,
			oTaskModel: this.fnCloneTaskModel(d),
			oQueryParameters: c.QueryParameters
		};
		var o = {
			startupParameters: {
				oParameters: P,
				taskModel: this.fnCloneTaskModel(d),
				inboxAPI: {
					addAction: jQuery.proxy(this.addAction, this),
					removeAction: jQuery.proxy(this.removeAction, this),
					updateTask: jQuery.proxy(this.updateTask, this),
					getDescription: jQuery.proxy(this.getDescription, this),
					setShowFooter: jQuery.proxy(this.setShowFooter, this),
					setShowNavButton: jQuery.proxy(this.setShowNavButton, this),
					disableAction: jQuery.proxy(this.disableAction, this),
					disableAllActions: jQuery.proxy(this.disableAllActions, this),
					enableAction: jQuery.proxy(this.enableAction, this),
					enableAllActions: jQuery.proxy(this.enableAllActions, this)
				}
			},
			inboxHandle: {
				attachmentHandle: this.fnCreateAttachmentHandle(this.sCtxPath),
				tabSelectHandle: {
					fnOnTabSelect: jQuery.proxy(this.onTabSelect, this)
				},
				inboxDetailView: this
			}
		};
		var v = this.getView();
		if (!jQuery.isEmptyObject(this.oGenericComponent)) {
			if (!this.oComponentCache.getComponentById(this.oGenericComponent.getId())) {
				this.oGenericComponent.destroy();
			}
		}
		if (jQuery.isEmptyObject(C)) {
			if (c.ApplicationPath && c.ApplicationPath != "") {
				jQuery.sap.registerModulePath(c.ComponentName, c.ApplicationPath[0] == "/" ? c.ApplicationPath : "/" + c.ApplicationPath);
			}
			try {
				C = sap.ui.getCore().createComponent({
					name: c.ComponentName,
					componentData: o
				});
				if (C && C.getIsCacheable && C.getIsCacheable() === true) {
					try {
						this.oComponentCache.cacheComponent(k, C);
					} catch (e) {
						$.sap.log.error(e);
					}
				}
			} catch (E) {
				$.sap.log.error("Cannot create component" + c.ComponentName +
					"for smart template rendering. Showing standard task in the detail screen as a fallback: " + E.message);
				return false;
			}
		} else {
			if (C && C.updateBinding) {
				C.updateBinding(o);
			}
		}
		v.byId("genericComponentContainer").setComponent(C);
		this.oGenericComponent = C;
		return true;
	},
	fnParseComponentParameters: function(r) {
		var p = cross.fnd.fiori.inbox.util.Parser.fnParseComponentParameters(r);
		this.isGenericComponentRendered = !jQuery.isEmptyObject(p) ? this.fnRenderComponent(p) : false;
		this.oModel2.setProperty("/showGenericComponent", this.isGenericComponentRendered);
		this.fnShowHideDetailScrollBar(!this.isGenericComponentRendered);
	},
	fnCloneTaskModel: function(t) {
		var a = ["SAP__Origin", "InstanceID", "TaskDefinitionID", "TaskDefinitionName", "TaskTitle", "Priority", "PriorityText", "Status",
			"StatusText", "CreatedOn", "CreatedBy", "CreatedByName", "Processor", "ProcessorName", "SubstitutedUser", "SubstitutedUserName",
			"StartDeadLine", "CompletionDeadLine", "ExpiryDate", "IsEscalated", "PriorityNumber"
		];
		var c = {};
		for (var i = 0; i < a.length; i++) {
			if (t.hasOwnProperty(a[i])) {
				c[a[i]] = t[a[i]];
			}
		}
		var v = this.getView();
		var b = v.getModel("detailClone");
		if (!b) {
			b = new sap.ui.model.json.JSONModel();
			v.setModel(b, "detailClone");
		}
		b.setData(c, false);
		return b;
	},
	fnShowHideDetailScrollBar: function(s) {
		if (s) {
			this.byId("mainPage").setEnableScrolling(true);
		} else {
			this.byId("mainPage").setEnableScrolling(false);
		}
	},
	switchToOutbox: function() {
		return this.oDataManager.bOutbox ? true : false;
	},
	_updateDetailModel: function(i, m) {
		if (this.oModel2) {
			this.oModel2.setData(i, m);
			this.fnCloneTaskModel(this.oModel2.getData());
		} else {
			jQuery.sap.log.error("Detail Model is null.");
		}
	},
	refreshData: function(r, d) {
		if (d !== undefined) {
			this.aTaskDefinitionData = d;
		} else {
			var t = this.getView().getModel("taskDefinitionsModel");
			this.aTaskDefinitionData = t ? t.getData() : [];
		}
		if (!this.bIsControllerInited) {
			var c = sap.ca.scfld.md.app.Application.getImpl().getComponent();
			this.oDataManager = c.getDataManager();
			if (!this.oDataManager) {
				var o = this.getView().getModel();
				this.oDataManager = new cross.fnd.fiori.inbox.util.DataManager(o, this);
				c.setDataManager(this.oDataManager);
			}
			this.oDataManager.attachItemRemoved(jQuery.proxy(this._handleItemRemoved, this));
			this.oDataManager.attachRefreshDetails(jQuery.proxy(this._handleDetailRefresh, this));
			this.bIsControllerInited = true;
		}
		this.clearCustomAttributes();
		var v = this.getView();
		this.oContext = new sap.ui.model.Context(v.getModel(), r.sCtxPath);
		v.setBindingContext(this.oContext);
		this.sCtxPath = r.sCtxPath;
		var i = jQuery.extend(true, {}, v.getModel().getData(this.oContext.getPath(), this.oContext));
		if (jQuery.isEmptyObject(i)) {
			i = jQuery.extend(true, {}, v.getModel().getData(encodeURI(this.oContext.getPath()), this.oContext));
		}
		var a = this._getActionHelper();
		sap.ca.scfld.md.app.Application.getImpl().getComponent().getEventBus().publish("cross.fnd.fiori.inbox", "storeNextItemsToSelect", {
			"sOrigin": i.SAP__Origin,
			"sInstanceID": i.InstanceID
		});
		if (this._getShowAdditionalAttributes() === true) {
			i = this._processCustomAttributesData(i);
		}
		if (i.TaskSupports && !i.TaskSupports.WorkflowLog) {
			i.TaskSupports.WorkflowLog = false;
		}
		if (!this.oModel2) {
			this.oModel2 = new sap.ui.model.json.JSONModel();
			v.setModel(this.oModel2, "detail");
		}
		this._updateDetailModel(i, true);
		this.oModel2.setProperty("/CustomAttributeData", i.CustomAttributeData ? i.CustomAttributeData : []);
		this.oModel2.setProperty("/sServiceUrl", v.getModel().sServiceUrl);
		this.oModel2.setProperty("/SapUiTheme", a._getThemeandLanguageLocaleParams()["sap-ui-theme"]);
		var R = jQuery.sap.delayedCall(1000, this, this._resetCountandDescription);
		this._updateHeaderTitle(i);
		var C = v.byId("genericComponentContainer");
		var s = C && C.getComponent() ? C.getComponent() : null;
		if (s) {
			var b = this.oComponentCache.getComponentById(s) || null;
			if (!b) {
				var g = sap.ui.getCore().getComponent(s);
				if (g) {
					g.destroy();
				}
			}
		}
		var e = this;
		var S = function(d, j) {
			if (e.extHookOnDataLoaded) {
				e.extHookOnDataLoaded(d);
			}
			if (e.aCA.length > 0) {
				e.clearCustomAttributes();
			}
			e._updateDetailModel(d, true);
			e.oDetailData2 = d;
			var l = e.byId("tabBar").getSelectedKey();
			if (l === "NOTES") {
				e.fnSetIconForCommentsFeedInput();
				this.fnFetchDataOnTabSelect("Comments");
			} else if (l === "ATTACHMENTS") {
				this.fnFetchDataOnTabSelect("Attachments");
			} else if (l === "OBJECTLINKS") {
				e.fnFetchObjectLinks();
			} else if (l === "DESCRIPTION") {
				e.byId("DescriptionContent").rerender();
			}
			if (!this._getShowAdditionalAttributes()) {
				if (d.CustomAttributeData.results && d.CustomAttributeData.results.length > 0) {
					e.oModel2.setProperty("/CustomAttributeData", d.CustomAttributeData.results);
				}
			} else if (this._getShowAdditionalAttributes() === true) {
				if (e.oModel2.getData().CustomAttributeDefinitionData == null && j) {
					e.oModel2.setProperty("/CustomAttributeDefinitionData", j);
				}
			}
			jQuery.proxy(e._createCustomAttributesOnDataLoaded(j), e);
		};
		var f = null;
		if (this.bIsTableViewActive) {
			f = jQuery.proxy(this.fnNavBackToTableVw, this);
		} else {
			if (sap.ui.Device.system.phone && !this.bNavToFullScreenFromLog) {
				f = jQuery.proxy(this.fnOnNavBackInMobile, this);
			} else if (this.bNavToFullScreenFromLog) {
				f = jQuery.proxy(this.fnOnNavBackFromLogDescription, this);
			}
		}
		if (this.getOwnerComponent().oShellUIService && f) {
			this.getOwnerComponent().oShellUIService.setBackNavigation(f);
		}
		if (this.oHeaderFooterOptions) {
			this.oHeaderFooterOptions = jQuery.extend(this.oHeaderFooterOptions, {
				oPositiveAction: null,
				oNegativeAction: null,
				buttonList: [],
				oJamOptions: null,
				oEmailSettings: null,
				oUpDownOptions: null,
				onBack: (this.getOwnerComponent().oShellUIService ? null : f)
			});
			this.refreshHeaderFooterOptions();
		}
		if (this.oModel2 != null) {
			this.fnClearCachedData();
		}
		var k = r.sSAP__Origin + r.sInstanceID;
		var D = false;
		var u = false;
		var I = i.TaskSupports.UIExecutionLink;
		var h = $.Deferred();
		$.when(h).then($.proxy(function() {
			this.oDataManager.fetchUIExecutionLink(i, jQuery.proxy(function(U) {
				u = true;
				i.UIExecutionLink = U;
				this.oModel2.getData().UIExecutionLink = U;
				var j = this.oDataManager.getDataFromCache("DecisionOptions", i);
				U = I ? U : {};
				jQuery.sap.clearDelayedCall(R);
				this.fnHandleIntentValidationAndNavigation(U, j, D, I, r, S);
			}, this), jQuery.proxy(function(E) {
				u = true;
				var j = this.oDataManager.getDataFromCache("DecisionOptions", i);
				if (D) {
					j = j ? j : [];
					this.createDecisionButtons(j, {}, r.sSAP__Origin);
				}
				jQuery.sap.clearDelayedCall(R);
				this.fnHandleIntentValidationAndNavigation({}, j, D, I, r, S);
			}, this));
		}, this));
		if (this.bNavToFullScreenFromLog) {
			this.setShowSideContent(false);
			if (i.Status === "COMPLETED") {
				h.resolve();
				return;
			}
		} else {
			if ((i.TaskSupports.ProcessingLogs || i.TaskSupports.WorkflowLog) && this.oDataManager.getShowLogEnabled() && this.bShowLogs) {
				this.createLogs();
				this.setShowSideContent(true);
			} else {
				e.setShowSideContent(false);
			}
		}
		this.oDataManager.readDecisionOptions(i.SAP__Origin, i.InstanceID, i.TaskDefinitionID, jQuery.proxy(function(j) {
			D = true;
			var U = this.oDataManager.getDataFromCache("UIExecutionLink", i);
			if (u) {
				if (I) {
					U = U ? U : {};
					this.createDecisionButtons(j, U, r.sSAP__Origin);
				} else {
					this.createDecisionButtons(j, {}, r.sSAP__Origin);
				}
			}
			h.resolve();
		}, this), jQuery.proxy(function(E) {
			jQuery.sap.log.error("Error while loading decision options");
			var U = this.oDataManager.getDataFromCache("UIExecutionLink", i);
			D = true;
			if (u) {
				if (I) {
					U = U ? U : {};
					this.createDecisionButtons([], U, r.sSAP__Origin);
				} else {
					this.createDecisionButtons([], {}, r.sSAP__Origin);
				}
			}
			h.resolve();
		}, this), false);
	},
	fnHandleIntentValidationAndNavigation: function(U, d, D, i, r, s) {
		var t = this;
		var u = U.GUI_Link;
		var p = this._getParsedParamsForIntent(u);
		var x = this._getCrossNavigationService();
		if (p && x) {
			var I = this._getIntentParam(p);
			x.isNavigationSupported(I, sap.ca.scfld.md.app.Application.getImpl().getComponent()).done(function(R) {
				var a = t._getSupportedOpenMode(R);
				if (a) {
					t.fnHandleIntentNavigation(p, a, U, r, s);
				} else {
					t.fnViewTaskInDefaultView(U, r, s);
				}
				if (a === "genericEmbedIntoDetails") {
					t.setShowFooter(false);
				} else {
					t.fnValidateDecisionOptionsAndCreatButtons(D, i, d, U, r.sSAP__Origin);
				}
			}).fail(function() {
				t.fnViewTaskInDefaultView(U, r, s);
				t.fnValidateDecisionOptionsAndCreatButtons(D, i, d, U, r.sSAP__Origin);
			});
		} else {
			this.fnValidateDecisionOptionsAndCreatButtons(D, i, d, U, r.sSAP__Origin);
			this.fnViewTaskInDefaultView(U, r, s);
		}
	},
	fnHandleIntentNavigation: function(p, s, U, r, S) {
		p.params.openMode = s;
		switch (s) {
			case "embedIntoDetails":
			case "genericEmbedIntoDetails":
				this.fnRenderIntentBasedApp(p, U, r, S);
				break;
			case "replaceDetails":
			case "external":
				this.oEmbedModeIntentParams = {};
				this.oEmbedModeIntentParams[r.sSAP__Origin + "_" + r.sInstanceID] = jQuery.extend({
					"OpenInEmbedMode": (s === "replaceDetails")
				}, p);
				this.fnViewTaskInDefaultView(U, r, S);
		}
	},
	fnRenderIntentBasedApp: function(p, U, r, s) {
		var t = this;
		var n = "#" + p.semanticObject + "-" + p.action;
		var c = this.byId("genericComponentContainer");
		var C = c && c.getComponent() ? c.getComponent() : null;
		if (C) {
			var o = this.oComponentCache.getComponentById(C) || null;
			if (!o) {
				var g = sap.ui.getCore().getComponent(C);
				if (g) {
					g.destroy();
				}
			}
		}
		var N = this._getCrossNavigationService();
		var a = {
			startupParameters: {
				taskModel: this.fnGetTaskModelClone(r),
				queryParameters: p.params,
				inboxAPI: {
					addAction: jQuery.proxy(this.addAction, this),
					removeAction: jQuery.proxy(this.removeAction, this),
					updateTask: jQuery.proxy(this.updateTask, this),
					getDescription: jQuery.proxy(this.getDescription, this),
					setShowFooter: jQuery.proxy(this.setShowFooter, this),
					setShowNavButton: jQuery.proxy(this.setShowNavButton, this),
					disableAction: jQuery.proxy(this.disableAction, this),
					disableAllActions: jQuery.proxy(this.disableAllActions, this),
					enableAction: jQuery.proxy(this.enableAction, this),
					enableAllActions: jQuery.proxy(this.enableAllActions, this)
				}
			},
			onTaskUpdate: jQuery.proxy(t.fnDelegateTaskRefresh, t)
		};
		var P = "?" + t.fnCreateURLParameters(p.params);
		N.createComponentInstance(n + P, {
			componentData: a
		}, t.getOwnerComponent()).done(function(b) {
			t.byId("genericComponentContainer").setComponent(b);
			t.oModel2.setProperty("/showGenericComponent", true);
		}).fail(function(e) {
			t.oModel2.setProperty("/showGenericComponent", false);
			jQuery.sap.log.error(e);
			t.fnViewTaskInDefaultView(U, r, s);
		});
	},
	updateTask: function(S, T) {
		var d = new jQuery.Deferred();
		if (!S || !T) {
			d.reject("Input parameters SAP__Origin and TaskInstanceId are mandatory");
			return d.promise();
		}
		var s = function(D) {
			d.resolve();
		};
		var e = function(E) {
			d.reject(E.message);
		};
		this.oDataManager.fnUpdateSingleTask(S, T, s, e);
		return d.promise();
	},
	getDescription: function(S, T) {
		var d = new jQuery.Deferred();
		if (!S || !T) {
			d.reject("Input parameters SAP__Origin and TaskInstanceId are mandatory");
			return d.promise();
		}
		var s = function(a) {
			d.resolve(a);
		};
		var e = function(E) {
			d.reject(E.message);
		};
		this.oDataManager.readDescription(S, T, s, e);
		return d.promise();
	},
	_setScaffoldingExtension: function(s) {
		if (s) {
			this._isScaffoldingExtended = true;
		} else {
			this._isScaffoldingExtended = false;
		}
	},
	_getScaffoldingExtension: function() {
		if (this._isScaffoldingExtended) {
			return true;
		} else {
			return false;
		}
	},
	isMainScreen: function() {
		if (this._getScaffoldingExtension()) {
			return false;
		} else {
			return sap.ca.scfld.md.controller.BaseDetailController.prototype.isMainScreen.call(this);
		}
	},
	setShowFooter: function(s) {
		if (s) {
			this.oHeaderFooterOptions = jQuery.extend(this.oHeaderFooterOptions, this._oPreviousHeaderFooterOptions);
			this.refreshHeaderFooterOptions();
			this._setScaffoldingExtension(false);
		} else {
			this._setScaffoldingExtension(true);
			this._oPreviousHeaderFooterOptions = jQuery.extend({}, this.oHeaderFooterOptions);
			this.oHeaderFooterOptions = jQuery.extend(this.oHeaderFooterOptions, {
				oPositiveAction: null,
				oNegativeAction: null,
				buttonList: null,
				oJamOptions: null,
				oEmailSettings: null,
				bSuppressBookmarkButton: true
			});
			this.refreshHeaderFooterOptions();
			if (this.getView().getContent()[0].getShowFooter()) {
				jQuery.sap.log.error("Hiding footer failed");
			}
		}
	},
	setShowNavButton: function(s, n) {
		if (s) {
			if (n) {
				this._backButtonHandler = n;
			} else {
				this._backButtonHandler = jQuery.proxy(this.onNavButtonPress, this);
			}
		} else {
			this._backButtonHandler = null;
		}
		this.oHeaderFooterOptions = jQuery.extend(this.oHeaderFooterOptions, {
			onBack: this._backButtonHandler
		});
		this.refreshHeaderFooterOptions();
	},
	onNavButtonPress: function(e) {
		if (window.history.length > 0) {
			window.history.back();
		} else {
			jQuery.sap.log.error(
				"Navigation history does not exist. Ensure that navigation history is maintained or provide custom event handler for back navigation button through setShowNavButton API"
			);
		}
	},
	fnGetTaskModelClone: function(r) {
		var v = this.getView();
		var c = new sap.ui.model.Context(v.getModel(), r.sCtxPath);
		var i = jQuery.extend(true, {}, v.getModel().getData(c.getPath(), c));
		return this.fnCloneTaskModel(i);
	},
	fnCreateURLParameters: function(d) {
		return Object.keys(d).map(function(k) {
			return [k, d[k]].map(encodeURIComponent).join("=");
		}).join("&");
	},
	fnValidateDecisionOptionsAndCreatButtons: function(d, i, D, U, s) {
		if (d) {
			if (i) {
				D = D ? D : [];
				this.createDecisionButtons(D, U, s);
			} else {
				D = D ? D : [];
				this.createDecisionButtons(D, {}, s);
			}
		}
	},
	fnDelegateTaskRefresh: function() {
		var n = this.oRoutingParameters;
		var s = n.SAP__Origin;
		var i = n.InstanceID;
		if (n && s && i) {
			this.oDataManager.fnUpdateSingleTask(s, i);
		}
	},
	fnNavigateToApp: function(p, e) {
		if (!e) {
			this._getCrossNavigationService().toExternal({
				target: {
					semanticObject: p.semanticObject,
					action: p.action
				},
				params: p.params,
				appSpecificRoute: p.appSpecificRoute
			});
		} else {
			var o = p.params.openMode;
			this.fnEmbedApplicationInDetailView(p, o);
		}
	},
	_resetCountandDescription: function() {
		this._updateDetailModel({
			Description: ""
		}, true);
		this.fnClearCachedData();
	},
	fnViewTaskInDefaultView: function(U, r, s) {
		this.oModel2.setProperty("/showGenericComponent", false);
		this.fnGetDetailsForSelectedTask(U, r, s);
	},
	fnGetDetailsForSelectedTask: function(U, r, s) {
		var t = this;
		var T = t.oModel2.getData().TaskSupports;
		var i = (T && T.UIExecutionLink) ? T.UIExecutionLink : false;
		t.fnParseComponentParameters(i ? U.GUI_Link : "");
		var e = [];
		if (T && T.Description) {
			e.push("Description");
		}
		if (!this._getShowAdditionalAttributes() && T && T.CustomAttributeData) {
			e.push("CustomAttributeData");
		}
		if (this.extHookGetEntitySetsToExpand) {
			var E = this.extHookGetEntitySetsToExpand();
			e.push.apply(e, E);
		}
		if (!U.GUI_Link) {
			U.GUI_Link = "";
		}
		var I = t.oModel2.getData();
		if (!t.isGenericComponentRendered) {
			var a = [];
			if (this.fnFormatterSupportsProperty(I.TaskSupports.Comments, I.SupportsComments)) {
				a.push("Comments");
			}
			if (this.fnFormatterSupportsProperty(I.TaskSupports.Attachments, I.SupportsAttachments)) {
				a.push("Attachments");
			}
			if (I.TaskSupports.TaskObject && this.oDataManager.bShowTaskObjects) {
				a.push("TaskObjects");
			}
			t.oDataManager.readDataOnTaskSelection(r.sCtxPath, e, a, r.sSAP__Origin, r.sInstanceID, I.TaskDefinitionID, function(d, c, o) {
				if (o.sCommentsCount != null && o.sCommentsCount !== "") {
					t.oModel2.setProperty("/CommentsCount", o.sCommentsCount);
				}
				if (o.sAttachmentsCount != null && o.sAttachmentsCount !== "") {
					t.oModel2.setProperty("/AttachmentsCount", o.sAttachmentsCount);
				}
				if (o.sTaskObjectsCount != null && o.sTaskObjectsCount !== "") {
					t.oModel2.setProperty("/ObjectLinksCount", o.sTaskObjectsCount);
					t.fnHandleNoTextCreation("ObjectLinks");
				}
				d.UIExecutionLink = U;
				s.call(t, d, c);
			});
		} else {
			t.oDataManager.setDetailPageLoaded(true);
			if (t.byId("attachmentComponent")) {
				t.fnCountUpdater("Attachments", t.oModel2.getData().SAP__Origin, t.oModel2.getData().InstanceID);
			}
			if (t.byId("commentsContainer")) {
				t.fnCountUpdater("Comments", t.oModel2.getData().SAP__Origin, t.oModel2.getData().InstanceID);
			}
			if (t.byId("MIBObjectLinksList")) {
				t.fnCountUpdater("ObjectLinks", t.oModel2.getData().SAP__Origin, t.oModel2.getData().InstanceID);
			}
		}
	},
	clearCustomAttributes: function() {
		if (this.aCA.length > 0) {
			for (var i = 0; i < this.aCA.length; i++) {
				this.aCA[i].destroy();
			}
			this.aCA = [];
		}
	},
	onAttachmentChange: function(e) {
		var u = e.getSource();
		var f = e.getParameters().getParameters().files[0].name;
		if (u.getHeaderParameters()) {
			u.destroyHeaderParameters();
		}
		var l = f.lastIndexOf(".");
		var a = "";
		if (l != -1) {
			a = f.substr(l + 1);
			f = f.substr(0, l);
		}
		u.addHeaderParameter(new sap.m.UploadCollectionParameter({
			name: "x-csrf-token",
			value: this.getXsrfToken()
		}));
		u.addHeaderParameter(new sap.m.UploadCollectionParameter({
			name: "slug",
			value: encodeURIComponent(f)
		}));
		u.addParameter(new sap.m.UploadCollectionParameter({
			name: "x-csrf-token",
			value: this.getXsrfToken()
		}));
		u.addParameter(new sap.m.UploadCollectionParameter({
			name: "slug",
			value: f
		}));
		u.addHeaderParameter(new sap.m.UploadCollectionParameter({
			name: "Accept",
			value: "application/json"
		}));
		u.addParameter(new sap.m.UploadCollectionParameter({
			name: "Accept",
			value: "application/json"
		}));
		if (a !== "") {
			u.addHeaderParameter(new sap.m.UploadCollectionParameter({
				name: "extension",
				value: a
			}));
			u.addParameter(new sap.m.UploadCollectionParameter({
				name: "extension",
				value: a
			}));
		}
	},
	onAttachmentUploadComplete: function(e) {
		var i = this.oModel2.getData();
		var t = this;
		t.oEventSource = e.getSource();
		var c = function() {
			this.oEventSource.updateAggregation("items");
			this.oEventSource.rerender();
		};
		if (e.getParameters().getParameters().status == 201) {
			var f = jQuery.parseJSON(e.getParameters().files[0].responseRaw).d;
			if (i.Attachments && i.Attachments.results) {
				i.Attachments.results.unshift(f);
			} else {
				i.Attachments = {
					results: [f]
				};
			}
			i.AttachmentsCount = i.Attachments.results.length;
			this._updateDetailModel(i);
			sap.ca.ui.message.showMessageToast(this.i18nBundle.getText("dialog.success.attachmentUpload"));
		} else {
			var E = this.i18nBundle.getText("dialog.error.attachmentUpload");
			sap.ca.ui.message.showMessageBox({
				type: sap.ca.ui.message.Type.ERROR,
				message: E,
				details: ""
			}, jQuery.proxy(c, t));
		}
	},
	onAttachmentDeleted: function(e) {
		var a = e.getParameters().documentId;
		var I = this.oModel2.getData();
		var u = this._getUploadCollectionControl();
		this._setBusyIncdicatorOnDetailControls(u, true);
		this.oDataManager.deleteAttachment(I.SAP__Origin, I.InstanceID, a, $.proxy(function() {
			var A = I.Attachments.results;
			$.each(A, function(i, o) {
				if (o.ID === a) {
					A.splice(i, 1);
					return false;
				}
			});
			I.Attachments.results = A;
			I.AttachmentsCount = A.length;
			if (I.AttachmentsCount === 0) {
				u.setNoDataText(this.i18nBundle.getText("view.Attachments.noAttachments"));
			}
			this._setBusyIncdicatorOnDetailControls(u, false);
			this._updateDetailModel(I);
			sap.ca.ui.message.showMessageToast(this.i18nBundle.getText("dialog.success.attachmentDeleted"));
		}, this), $.proxy(function(E) {
			this._setBusyIncdicatorOnDetailControls(u, false);
			var s = this.i18nBundle.getText("dialog.error.attachmentDelete");
			sap.ca.ui.message.showMessageBox({
				type: sap.ca.ui.message.Type.ERROR,
				message: s,
				details: ""
			});
		}, this));
	},
	getXsrfToken: function() {
		var t = this.getView().getModel().getHeaders()['x-csrf-token'];
		if (!t) {
			this.getView().getModel().refreshSecurityToken(function(e, o) {
				t = o.headers['x-csrf-token'];
			}, function() {
				sap.ca.ui.message.showMessageBox({
					type: sap.ca.ui.message.Type.ERROR,
					message: 'Could not get XSRF token',
					details: ''
				});
			}, false);
		}
		return t;
	},
	onFileUploadFailed: function(e) {
		var E = this.i18nBundle.getText("dialog.error.attachmentUpload");
		sap.ca.ui.message.showMessageBox({
			type: sap.ca.ui.message.Type.ERROR,
			message: E,
			details: e.getParameters().exception
		});
	},
	addShareOnJamAndEmail: function(b) {
		if (this.oDataManager.bOutbox === true) {
			return;
		}
		var j = {
			fGetShareSettings: jQuery.proxy(this.getJamSettings, this)
		};
		var e = {
			sSubject: this.getMailSubject(),
			fGetMailBody: jQuery.proxy(this.getMailBody, this)
		};
		b.oJamOptions = j;
		b.oEmailSettings = e;
		this.oHeaderFooterOptions = jQuery.extend(this.oHeaderFooterOptions, {
			oJamOptions: b.oJamOptions,
			oEmailSettings: b.oEmailSettings
		});
	},
	_getDescriptionForShare: function(d) {
		var D = this.oModel2.getData();
		var b = "\n\n" + this.i18nBundle.getText("share.email.body.detailsOfTheItem") + "\n\n";
		var o = sap.ui.core.format.DateFormat.getDateInstance();
		if (D.TaskTitle && D.TaskTitle.trim() !== "") {
			b += this.i18nBundle.getText("item.taskTitle", D.TaskTitle.trim()) + "\n";
		}
		if (D.Priority && D.Priority !== "") {
			b += this.i18nBundle.getText("item.priority", cross.fnd.fiori.inbox.Conversions.formatterPriority.call(this.getView(), D.SAP__Origin,
				D.Priority)) + "\n";
		}
		if (D.CompletionDeadLine) {
			b += this.i18nBundle.getText("item.dueDate", o.format(D.CompletionDeadLine, true)) + "\n";
		}
		if (d && d.trim() !== "") {
			b += this.i18nBundle.getText("item.description", d) + "\n";
		} else if ((D.Description) && (D.Description.Description) && (D.Description.Description.trim() !== "")) {
			b += this.i18nBundle.getText("item.description", this._getTrimmedString(D.Description.Description)) + "\n";
		}
		var c = D.CreatedByName;
		if (!c || c.trim() === "") {
			c = D.CreatedBy;
		}
		if (c && c.trim() !== "") {
			b += this.i18nBundle.getText("item.createdBy", c) + "\n";
		}
		if (D.CreatedOn) {
			b += this.i18nBundle.getText("item.createdOn", o.format(D.CreatedOn, true)) + "\n";
		}
		if (D.CompletedOn) {
			b += this.i18nBundle.getText("item.completedOn", o.format(D.CompletedOn, true)) + "\n";
		}
		return b;
	},
	_getDescriptionForShareInMail: function(d) {
		var b = this._getDescriptionForShare(d);
		b += this.i18nBundle.getText("share.email.body.link", window.location.href.split("(").join("%28").split(")").join("%29")) + "\n";
		return b;
	},
	getJamSettings: function() {
		return {
			object: {
				id: window.location.href,
				share: this.getJamDescription()
			}
		};
	},
	getJamDescription: function() {
		var b = this._getDescriptionForShare();
		return b;
	},
	getMailSubject: function() {
		var d = this.oModel2.getData();
		var p = cross.fnd.fiori.inbox.Conversions.formatterPriority.call(this.getView(), d.SAP__Origin, d.Priority);
		var c = d.CreatedByName;
		var t = d.TaskTitle;
		return cross.fnd.fiori.inbox.Conversions.formatterMailSubject.call(this, p, c, t);
	},
	getMailBody: function() {
		if (jQuery.browser.msie) {
			return window.location.href.split("(").join("%28").split(")").join("%29");
		}
		var f = this._getDescriptionForShareInMail();
		var m = this.getMailSubject();
		var F = sap.m.URLHelper.normalizeEmail(null, m, f);
		if (F.length > 2000) {
			var d = this.oModel2.getData();
			var M = this._getDescriptionForShareInMail(" ");
			var s = sap.m.URLHelper.normalizeEmail(null, m, M);
			var i = 2000 - s.length;
			var D = "";
			if (d.Description && d.Description.Description) {
				D = window.encodeURIComponent(this._getTrimmedString(d.Description.Description));
			}
			D = D.substring(0, i);
			var b = false;
			while (!b || D.length == 0) {
				b = true;
				try {
					D = window.decodeURIComponent(D);
				} catch (e) {
					D = D.substring(0, D.length - 1);
					b = false;
				}
			}
			D = D.substring(0, D.length - 3) + "...";
			var t = this._getDescriptionForShareInMail(D);
			return t;
		}
		return f;
	},
	_getIntentParam: function(p) {
		var m = [];
		for (var i = 0; i < this.OPEN_MODES.length; i++) {
			m.push({
				target: {
					semanticObject: p.semanticObject,
					action: p.action
				},
				params: jQuery.extend({}, p.params, {
					"openMode": this.OPEN_MODES[i]
				})
			});
		}
		return m;
	},
	_getIntentWithOutParam: function(p) {
		var m = [{
			target: {
				semanticObject: p.semanticObject,
				action: p.action
			},
			params: p.params
		}];
		return m;
	},
	_getTrimmedString: function(t) {
		return t.replace(/\s+/g, " ").trim();
	},
	_handleItemRemoved: function(e) {
		if (sap.ui.Device.system.phone && !this.getView().getParent().getParent().isMasterShown()) {
			if (!this.stayOnDetailScreen) {
				this.oRouter.navTo("master", {}, sap.ui.Device.system.phone);
				window.history.back();
			} else {
				var r = {
					sCtxPath: this.getView().getBindingContext().getPath(),
					sInstanceID: this.oModel2.getData().InstanceID,
					sSAP__Origin: this.oModel2.getData().SAP__Origin,
					bCommentCreated: true
				};
				this.refreshData(r);
				this.stayOnDetailScreen = false;
			}
		}
	},
	_handleDetailRefresh: function(e) {
		var i = e.getParameter('bIsTableViewActive');
		var v = this.getView();
		if (i) {
			var I = jQuery.extend(true, {}, v.getModel().getData(this.oContext.getPath(), this.oContext));
			var a = e.getParameter('sAction');
			var s = e.getParameter('sStatus');
			if (I.Status === 'COMPLETED' || I.Status === 'FOR_RESUBMISSION' || ((a && a === "FORWARD") && (s && s === "Success"))) {
				this.fnNavBackToTableVw();
			} else {
				this._updateDetailModel(I, true);
				var d = this.oDataManager.getDataFromCache("DecisionOptions", I);
				d = d ? d : [];
				var u = this.oDataManager.getDataFromCache("UIExecutionLink", I);
				u = u ? u : {};
				var b = I.TaskSupports.UIExecutionLink;
				u = b ? u : {};
				this.createDecisionButtons(d, u, this.oModel2.getData().SAP__Origin);
			}
		} else {
			var r = {
				sCtxPath: this.getView().getBindingContext().getPath(),
				sInstanceID: this.oModel2.getData().InstanceID,
				sSAP__Origin: this.oModel2.getData().SAP__Origin,
				bCommentCreated: true
			};
			this.refreshData(r);
		}
	},
	_updateHeaderTitle: function(d) {
		if (d) {
			var c = this.getOwnerComponent().getComponentData();
			this.oHeaderFooterOptions = jQuery.extend(this.oHeaderFooterOptions, {
				sDetailTitle: d.TaskDefinitionName ? d.TaskDefinitionName : this.i18nBundle.getText("ITEM_DETAIL_DISPLAY_NAME")
			});
			this.refreshHeaderFooterOptions();
		}
	},
	_isTaskConfirmable: function(i) {
		if (i.Status == 'EXECUTED') {
			return true;
		} else {
			return false;
		}
	},
	createDecisionButtons: function(d, u, o) {
		var p = null;
		var n = null;
		var b = [];
		var t = this;
		var I = this.oModel2.getData(),
			a = t._getActionHelper();
		if (!this.switchToOutbox()) {
			if (!this._isTaskConfirmable(I)) {
				for (var i = 0; i < d.length; i++) {
					var D = d[i];
					D.InstanceID = I.InstanceID;
					D.SAP__Origin = o;
					b.push({
						nature: D.Nature,
						sBtnTxt: D.DecisionText,
						onBtnPressed: (function(g) {
							return function() {
								t.showDecisionDialog(t.oDataManager.FUNCTION_IMPORT_DECISION, g, true);
							};
						})(D)
					});
				}
			} else {
				p = {
					sI18nBtnTxt: "XBUT_CONFIRM",
					onBtnPressed: (function(g) {
						return function() {
							t.showConfirmationDialog(t.oDataManager.FUNCTION_IMPORT_CONFIRM, I);
						};
					})(I)
				};
			}
			if ((!t.bNavToFullScreenFromLog) && (I.TaskSupports.ProcessingLogs || I.TaskSupports.WorkflowLog) && t.oDataManager.getShowLogEnabled()) {
				b.push({
					sI18nBtnTxt: t.bShowLogs ? "XBUT_HIDELOG" : "XBUT_SHOWLOG",
					onBtnPressed: jQuery.proxy(this.onLogBtnPress, this)
				});
			}
			if (t.fnFormatterSupportsProperty(I.TaskSupports.Claim, I.SupportsClaim)) {
				b.push({
					sI18nBtnTxt: "XBUT_CLAIM",
					onBtnPressed: function(E) {
						if (sap.ui.Device.system.phone) {
							t.stayOnDetailScreen = true;
						}
						t.sendAction("Claim", I, null);
					}
				});
			}
			if (t.fnFormatterSupportsProperty(I.TaskSupports.Release, I.SupportsRelease)) {
				b.push({
					sI18nBtnTxt: "XBUT_RELEASE",
					onBtnPressed: function(E) {
						if (sap.ui.Device.system.phone) {
							t.stayOnDetailScreen = true;
						}
						t.sendAction("Release", I, null);
					}
				});
			}
			if (t.fnFormatterSupportsProperty(I.TaskSupports.Forward, I.SupportsForward)) {
				b.push({
					sI18nBtnTxt: "XBUT_FORWARD",
					onBtnPressed: jQuery.proxy(this.onForwardPopUp, this)
				});
			}
			if (I.TaskSupports) {
				if (I.TaskSupports.Resubmit) {
					b.push({
						sI18nBtnTxt: "XBUT_RESUBMIT",
						onBtnPressed: jQuery.proxy(this.showResubmitPopUp, this)
					});
				}
			}
			var P = this._getParsedParamsForIntent(u.GUI_Link);
			var x = this._getCrossNavigationService();
			if (P && x) {
				var c = this._getIntentParam(P);
				x.isNavigationSupported(c).done(function(r) {
					var s = t._getSupportedOpenMode(r);
					if (a.isOpenTaskEnabled(I, (s === "embedIntoDetails" || s === "genericEmbedIntoDetails"))) {
						b.push({
							sI18nBtnTxt: "XBUT_OPEN",
							onBtnPressed: function(E) {
								t.checkStatusAndOpenTaskUI();
							}
						});
						t.refreshHeaderFooterOptions();
					}
				}).fail(function() {
					jQuery.sap.log.error("Error while creating open task buttons");
				});
			} else {
				if (!t.oDataManager.isUIExecnLinkNavProp() && I.GUI_Link && a.isOpenTaskEnabled(I, false)) {
					b.push({
						sI18nBtnTxt: "XBUT_OPEN",
						onBtnPressed: function(E) {
							t.checkStatusAndOpenTaskUI();
						}
					});
				} else {
					if (I.TaskSupports.UIExecutionLink && I.UIExecutionLink && I.UIExecutionLink.GUI_Link && a.isOpenTaskEnabled(I, false)) {
						b.push({
							sI18nBtnTxt: "XBUT_OPEN",
							onBtnPressed: function(E) {
								t.checkStatusAndOpenTaskUI();
							}
						});
					}
				}
			}
			if (window.plugins && window.plugins.calendar) {
				var e = this.oModel2.getData();
				var f = e.CompletionDeadLine;
				if (f) {
					var A = function(g) {
						if (g < new Date()) {
							this.oConfirmationDialogManager.showDecisionDialog({
								question: this.i18nBundle.getText("dialog.warning.mq.CalendarEventInThePast"),
								title: this.i18nBundle.getText("dialog.warning.mq.CalendarEventInThePast.title"),
								confirmButtonLabel: this.i18nBundle.getText("XBUT_OK"),
								noteMandatory: false,
								confirmActionHandler: jQuery.proxy(this.createCalendarEvent, this)
							});
						} else {
							this.createCalendarEvent();
						}
					};
					b.push({
						sI18nBtnTxt: "XBUT_CALENDAR",
						onBtnPressed: jQuery.proxy(A, this, f)
					});
				}
			}
		} else {
			if ((!t.bNavToFullScreenFromLog) && (I.TaskSupports.ProcessingLogs || I.TaskSupports.WorkflowLog) && t.oDataManager.getShowLogEnabled()) {
				b.push({
					sI18nBtnTxt: t.bShowLogs ? "XBUT_HIDELOG" : "XBUT_SHOWLOG",
					onBtnPressed: jQuery.proxy(this.onLogBtnPress, this)
				});
			}
			if (I.TaskSupports.CancelResubmission) {
				b.push({
					sI18nBtnTxt: "XBUT_RESUME",
					onBtnPressed: function(E) {
						t.sendAction("CancelResubmission", I, null);
					}
				});
			}
		}
		var B = {};
		B.oPositiveAction = p;
		B.oNegativeAction = n;
		B.aButtonList = b;
		this.addShareOnJamAndEmail(B);
		if (this.extHookChangeFooterButtons) {
			this.extHookChangeFooterButtons(B);
			p = B.oPositiveAction;
			n = B.oNegativeAction;
			b = B.aButtonList;
		}
		this.oHeaderFooterOptions = jQuery.extend(this.oHeaderFooterOptions, {
			oPositiveAction: p,
			oNegativeAction: n,
			buttonList: b,
			oJamOptions: B.oJamOptions,
			oEmailSettings: B.oEmailSettings,
			bSuppressBookmarkButton: true
		});
		this.refreshHeaderFooterOptions();
	},
	startForwardFilter: function(l, q) {
		q = q.toLowerCase();
		var f = l.getBindingContext().getProperty("DisplayName").toLowerCase();
		var d = l.getBindingContext().getProperty("Department").toLowerCase();
		return (f.indexOf(q) != -1) || (d.indexOf(q) != -1);
	},
	closeForwardPopUp: function(r) {
		if (r && r.bConfirmed) {
			var i = this.oModel2.getData();
			var o = i.SAP__Origin;
			var I = i.InstanceID;
			this.oDataManager.doForward(o, I, r.oAgentToBeForwarded.UniqueName, r.sNote, jQuery.proxy(function() {
				sap.ca.ui.message.showMessageToast(this.i18nBundle.getText("dialog.success.forward", r.oAgentToBeForwarded.DisplayName));
			}, this));
		}
	},
	onForwardPopUp: function() {
		var i = this.oModel2.getData();
		var o = i.SAP__Origin;
		var I = i.InstanceID;
		if (this.oDataManager.userSearch) {
			cross.fnd.fiori.inbox.util.Forward.open(jQuery.proxy(this.startForwardFilter, this), jQuery.proxy(this.closeForwardPopUp, this));
			var h = cross.fnd.fiori.inbox.Conversions.formatterTaskSupportsValue(i.TaskSupports.PotentialOwners, i.HasPotentialOwners);
			if (h) {
				this.oDataManager.readPotentialOwners(o, I, jQuery.proxy(this._PotentialOwnersSuccess, this));
			} else {
				this._PotentialOwnersSuccess({
					results: []
				});
			}
		} else {
			cross.fnd.fiori.inbox.util.ForwardSimple.open(jQuery.proxy(this.closeForwardPopUp, this));
		}
	},
	_getSupportedOpenMode: function(r) {
		var s = [];
		for (var i = 0; i < r.length; i++) {
			if (r[i].supported) {
				s.push(this.OPEN_MODES[i]);
			}
		}
		return (s.length === 1) ? s[0] : null;
	},
	_getParsedParamsForIntent: function(u) {
		var p = null;
		this.oURLParsingService = this.oURLParsingService || sap.ushell && sap.ushell.Container && sap.ushell.Container.getService && sap.ushell
			.Container.getService("URLParsing");
		if (this.oURLParsingService && this.oURLParsingService.isIntentUrl(u)) {
			p = this.oURLParsingService.parseShellHash(u);
		}
		return p;
	},
	_getCrossNavigationService: function() {
		if (!this.oCrossNavigationService) {
			if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService) {
				this.oCrossNavigationService = sap.ushell.Container.getService("CrossApplicationNavigation");
			}
		}
		return this.oCrossNavigationService;
	},
	_PotentialOwnersSuccess: function(r) {
		cross.fnd.fiori.inbox.util.Forward.setAgents(r.results);
		cross.fnd.fiori.inbox.util.Forward.setOrigin(this.oModel2.getData().SAP__Origin);
	},
	showResubmitPopUp: function() {
		cross.fnd.fiori.inbox.util.Resubmit.open(this.sResubmitUniqueId, this, this.getView());
	},
	handleResubmitPopOverOk: function(e) {
		var i = this.oModel2.getData();
		var o = i.SAP__Origin;
		var I = i.InstanceID;
		var c = sap.ui.core.Fragment.byId(this.sResubmitUniqueId, "DATE_RESUBMIT");
		var s = c.getSelectedDates();
		if (s.length > 0) {
			var d = s[0].getStartDate();
			var f = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "YYYY-MM-ddTHH:mm:ss"
			});
			this.oDataManager.doResubmit(o, I, "datetime'" + f.format(d) + "'", jQuery.proxy(function() {
				sap.ca.ui.message.showMessageToast(this.i18nBundle.getText("dialog.success.resubmit"));
			}, this));
			cross.fnd.fiori.inbox.util.Resubmit.close();
		}
	},
	showEmployeeCard: function(o, c, s) {
		this._setBusyIncdicatorOnDetailControls(this.getView(), true);
		this.oDataManager.readUserInfo(o, c, jQuery.proxy(function(r) {
			this._setBusyIncdicatorOnDetailControls(this.getView(), false);
			cross.fnd.fiori.inbox.util.EmployeeCard.displayEmployeeCard(s, r);
		}, this), jQuery.proxy(function(e) {
			this._setBusyIncdicatorOnDetailControls(this.getView(), false);
		}, this), true);
	},
	onEmployeeLaunchTask: function(e) {
		var i = this.oModel2.getData();
		this.showEmployeeCard(i.SAP__Origin, i.CreatedBy, cross.fnd.fiori.inbox.Conversions.getSelectedControl(e));
	},
	onEmployeeLaunchCommentSender: function(c, e, E) {
		this.showEmployeeCard(this.oModel2.getData().SAP__Origin, E.getSource().getBindingContext("detail").getProperty("CreatedBy"), cross.fnd
			.fiori.inbox.Conversions.getSelectedControl(E));
	},
	handleLogNavigation: function(e) {
		var b = e.getSource().getBindingContext("detail");
		var s = b.getProperty("SAP__Origin");
		var r = b.getProperty("ReferenceInstanceID");
		var c = "TaskCollection(SAP__Origin='" + s + "',InstanceID='" + r + "')";
		this.bNavToFullScreenFromLog = true;
		var p = {
			SAP__Origin: s,
			InstanceID: r,
			contextPath: c
		};
		var v = this.getView();
		this.oContext = new sap.ui.model.Context(v.getModel(), c);
		v.setBindingContext(this.oContext);
		var i = jQuery.extend(true, {}, v.getModel().getData(this.oContext.getPath(), this.oContext));
		if (jQuery.isEmptyObject(i)) {
			var t = this;
			var d = sap.ca.scfld.md.app.Application.getImpl().getComponent().getDataManager();
			d.oDataRead("/TaskCollection(SAP__Origin='" + s + "',InstanceID='" + r + "')", null, function(D) {
				if (D !== undefined && !jQuery.isEmptyObject(D)) {
					t.oRouter.navTo("detail_deep", p, false);
				}
			}, function(E) {
				jQuery.sap.log.error(E);
				return;
			});
		} else {
			this.oRouter.navTo("detail_deep", p, false);
		}
	},
	onEmployeeLaunchCommentIcon: function(e) {
		var o = e.getSource().getBindingContext().getProperty("SAP__Origin");
		var c = e.getSource().getBindingContext("detail").getModel().getProperty(e.getSource().getBindingContext("detail").getPath()).CreatedBy;
		if (!o) {
			var i = this.oModel2.getData();
			o = i.SAP__Origin;
		}
		this.showEmployeeCard(o, c, cross.fnd.fiori.inbox.Conversions.getSelectedControl(e));
	},
	onAttachmentShow: function(e) {
		var c = e.getSource().getBindingContext("detail");
		var m = cross.fnd.fiori.inbox.attachment.getRelativeMediaSrc(c.getProperty().__metadata.media_src);
		sap.m.URLHelper.redirect(m, true);
	},
	showDecisionDialog: function(f, d, s) {
		this.oConfirmationDialogManager.showDecisionDialog({
			question: this.i18nBundle.getText("XMSG_DECISION_QUESTION", d.DecisionText),
			showNote: s,
			title: this.i18nBundle.getText("XTIT_SUBMIT_DECISION"),
			confirmButtonLabel: this.i18nBundle.getText("XBUT_SUBMIT"),
			noteMandatory: d.CommentMandatory,
			confirmActionHandler: jQuery.proxy(function(d, n) {
				this.sendAction(f, d, n);
			}, this, d)
		});
	},
	fnOnNavBackFromLogDescription: function(e) {
		this.bNavToFullScreenFromLog = false;
		this.setShowMainContent();
		window.history.back();
	},
	showConfirmationDialog: function(f, i) {
		this.oConfirmationDialogManager.showDecisionDialog({
			question: this.i18nBundle.getText("XMSG_CONFIRM_QUESTION"),
			showNote: false,
			title: this.i18nBundle.getText("XTIT_SUBMIT_CONFIRM"),
			confirmButtonLabel: this.i18nBundle.getText("XBUT_CONFIRM"),
			confirmActionHandler: jQuery.proxy(function(i, n) {
				this.sendAction(f, i, n);
			}, this, i)
		});
	},
	onCommentPost: function(c, e, E) {
		var C = E.getParameter("value");
		if (C && C.length > 0) {
			this.sendAction('AddComment', null, C);
		}
	},
	sendAction: function(f, d, n) {
		var t = this;
		var s;
		switch (f) {
			case "Release":
				s = "dialog.success.release";
				break;
			case "Claim":
				s = "dialog.success.reserve";
				break;
			case "AddComment":
				s = "dialog.success.addComment";
				break;
			case "Confirm":
				s = "dialog.success.completed";
				break;
			case "CancelResubmission":
				s = "dialog.success.cancelResubmission";
				break;
			default:
				s = "dialog.success.complete";
		}
		switch (f) {
			case 'AddComment':
				{
					var i = this.oModel2.getData();
					var c = this._getIconTabControl("Comments");this._setBusyIncdicatorOnDetailControls(c, true);this.oDataManager.addComment(i.SAP__Origin,
						i.InstanceID, n, jQuery.proxy(function(a, r) {
							if (i.Comments && i.Comments.results) {
								i.Comments.results.push(a);
							} else {
								i.Comments = {
									results: [a]
								};
							}
							i.CommentsCount = i.Comments.results.length;
							this._setBusyIncdicatorOnDetailControls(c, false);
							this._updateDetailModel(i);
							jQuery.sap.delayedCall(500, this, function() {
								sap.ca.ui.message.showMessageToast(this.i18nBundle.getText(s));
							});
						}, this), jQuery.proxy(function(e) {
							this._setBusyIncdicatorOnDetailControls(c, false);
						}, this));
					break;
				}
			default:
				{
					this.oDataManager.sendAction(f, d, n, jQuery.proxy(function(D) {
						jQuery.sap.delayedCall(500, this, function() {
							sap.ca.ui.message.showMessageToast(this.i18nBundle.getText(s));
						});
					}, this, d));
				}
		}
	},
	refreshHeaderFooterOptions: function() {
		this._oHeaderFooterOptions = jQuery.extend(this._oHeaderFooterOptions, this.oHeaderFooterOptions);
		this.setHeaderFooterOptions(this._oHeaderFooterOptions);
	},
	fnNavBackToTableVw: function() {
		sap.ca.scfld.md.app.Application.getImpl().getComponent().getEventBus().publish("cross.fnd.fiori.inbox", "refreshTask", {
			"contextPath": this.sCtxPath
		});
		this.oRouter.navTo("table_view", {}, true);
	},
	fnOnNavBackInMobile: function() {
		this.oRouter.navTo("master", {}, true);
	},
	checkStatusAndOpenTaskUI: function() {
		var t = this.oModel2.getData();
		this.oDataManager.checkStatusAndOpenTask(t.SAP__Origin, t.InstanceID, jQuery.proxy(this.openTaskUI, this));
	},
	openTaskUI: function() {
		var t = this.oModel2.getData();
		var a = this._getActionHelper();
		var k = t.SAP__Origin + "_" + t.InstanceID;
		var i = this.oEmbedModeIntentParams ? this.oEmbedModeIntentParams[k] : null;
		if (i) {
			this.fnNavigateToApp(i, i.OpenInEmbedMode);
		} else {
			var d = sap.ca.scfld.md.app.Application.getImpl().getComponent().getDataManager();
			a.fnValidateOpenTaskURLAndRedirect(this.oModel2.getData().GUI_Link || this.oModel2.getData().UIExecutionLink.GUI_Link, d.isForwardUserSettings());
		}
	},
	fnEmbedApplicationInDetailView: function(p) {
		var n = "#" + p.semanticObject + "-" + p.action;
		var i = new sap.ui.model.json.JSONModel({
			NavigationIntent: n,
			params: p.params
		});
		this.getOwnerComponent().setModel(i, "intentModel");
		var P = {
			SAP__Origin: this.oRoutingParameters.SAP__Origin,
			InstanceID: this.oRoutingParameters.InstanceID,
			contextPath: this.oRoutingParameters.contextPath
		};
		this.oRouter.navTo("replace_detail", P, true);
	},
	updateToggleButtonState: function(e) {
		this.sCurrentBreakpoint = e.getParameter("currentBreakpoint");
		this.setShowMainContent();
	},
	onLogBtnPress: function(e) {
		var t = e.getSource();
		this.bShowLogs = false;
		if (t.getText() === this.i18nBundle.getText("XBUT_SHOWLOG")) {
			t.setText(this.i18nBundle.getText("XBUT_HIDELOG"));
			this.bShowLogs = true;
			this.createLogs();
			this.setShowSideContent(true);
		} else {
			t.setText(this.i18nBundle.getText("XBUT_SHOWLOG"));
			this.setShowSideContent(false);
		}
		this.setShowMainContent();
	},
	setShowMainContent: function() {
		var d = this.byId("DynamicSideContent");
		if (d) {
			if (this.sCurrentBreakpoint === 'S' && this.bShowLogs && !this.bNavToFullScreenFromLog && this.oModel2 && this.oModel2.getData()) {
				var t = this.oModel2.getData().TaskSupports;
				if (t && (t.WorkflowLog || t.ProcessingLogs)) {
					d.setShowMainContent(false);
				} else {
					d.setShowMainContent(true);
				}
			} else {
				d.setShowMainContent(true);
			}
		}
	},
	setShowSideContent: function(e) {
		var d = this.byId("DynamicSideContent");
		if (d) {
			d.setShowSideContent(e);
		}
	},
	createLogs: function(k) {
		var l = k;
		var i = this.byId("tabBarLogs");
		var I = this.oModel2.getData();
		if (!l && I.TaskSupports) {
			if (I.TaskSupports.ProcessingLogs && I.TaskSupports.WorkflowLog && i) {
				l = i.getSelectedKey();
			} else if (I.TaskSupports.WorkflowLog) {
				l = "WORKFLOWLOG";
			} else if (I.TaskSupports.ProcessingLogs) {
				l = "TASKLOG";
			}
		}
		switch (l) {
			case "TASKLOG":
				this.createTimeLine();
				this.fnHandleNoTextCreation("ProcessingLogs");
				this.fnFetchDataOnLogTabSelect("ProcessingLogs");
				this._getIconTabControl("ProcessingLogs").setGrowingThreshold(10);
				break;
			case "WORKFLOWLOG":
				this.createWorkflowLogTimeLine();
				this.fnHandleNoTextCreation("WorkflowLogs");
				this.fnFetchDataOnLogTabSelect("WorkflowLogs");
				this._getIconTabControl("WorkflowLogs").setGrowingThreshold(10);
				break;
		}
	},
	createWorkflowLogTimeLine: function() {
		var t = this;
		var T = t._getIconTabControl("WorkflowLogs");
		if (T) {
			var o = new sap.suite.ui.commons.TimelineItem({
				icon: {
					parts: [{
						path: "detail>Status"
					}, {
						path: "detail>ResultType"
					}],
					formatter: cross.fnd.fiori.inbox.Conversions.formatterWorkflowLogStatusIcon
				},
				userName: {
					parts: [{
						path: "detail>PerformedByName"
					}, {
						path: "detail>Status"
					}],
					formatter: cross.fnd.fiori.inbox.Conversions.formatterWorkflowLogStatusUsername
				},
				userNameClickable: true,
				userPicture: {
					parts: [{
						path: "detail>SAP__Origin"
					}, {
						path: "detail>PerformedByName"
					}],
					formatter: cross.fnd.fiori.inbox.Conversions.formatterWorkflowLogUserPicture
				},
				title: {
					path: "detail>Status",
					formatter: cross.fnd.fiori.inbox.Conversions.formatterWorkflowLogStatusText
				},
				dateTime: "{detail>Timestamp}",
				embeddedControl: new sap.m.VBox({
					items: [new sap.m.ObjectAttribute({
						text: "{detail>Description}",
						active: "{detail>SupportsNavigation}",
						press: jQuery.proxy(this.handleLogNavigation, this)
					}), new sap.m.ObjectStatus({
						text: "{detail>Result}",
						state: {
							path: "detail>ResultType",
							formatter: cross.fnd.fiori.inbox.Conversions.formatterWorkflowLogResultState
						}
					})]
				})
			});
			o.attachUserNameClicked(function(e) {
				var b = e.getSource().getBindingContext("detail");
				t.showEmployeeCard(b.getProperty("SAP__Origin"), b.getProperty("PerformedBy"), cross.fnd.fiori.inbox.Conversions.getSelectedControl(
					e));
			});
			T.bindAggregation("content", {
				path: "detail>/WorkflowLogs/results",
				template: o
			});
		}
	},
	onLogTabSelect: function(c) {
		var s = c.getParameters().selectedKey;
		this.createLogs(s);
	},
	fnFetchDataOnLogTabSelect: function(n) {
		var p = null;
		if (n === "ProcessingLogs") {
			p = {
				$orderby: "OrderID desc"
			};
		}
		var P = this.sCtxPath + "/" + n;
		var t = this._getIconTabControl(n);
		this._setBusyIncdicatorOnDetailControls(t, true);
		var s = function(d) {
			var m = this.oModel2.getData();
			var D = (m[n] && m[n].results) ? true : false;
			this.fnUpdateDataAfterFetchComplete(m, D, n, d);
			this._setBusyIncdicatorOnDetailControls(t, false);
			if (d.results.length === 0) {
				var T = this._getIconTabControl(n);
				var i;
				if (n === "ProcessingLogs") {
					i = "view.ProcessLogs.noData";
				} else if (n === "WorkflowLogs") {
					i = "view.WorkflowLogs.noData";
				}
				T.setNoDataText(this.i18nBundle.getText(i));
			}
		};
		var e = function(E) {
			this._setBusyIncdicatorOnDetailControls(t, false);
			this.oDataManager.oDataRequestFailed(E);
		};
		this.oDataManager.oDataRead(P, p, jQuery.proxy(s, this), jQuery.proxy(e, this));
	},
	onTabSelect: function(c) {
		var s = c.getParameters().selectedKey;
		switch (s) {
			case "NOTES":
				this.fnDelegateCommentsCreation();
				this.fnFetchDataOnTabSelect("Comments");
				this.fnSetIconForCommentsFeedInput();
				this.fnHandleNoTextCreation("Comments");
				break;
			case "ATTACHMENTS":
				this.fnDelegateAttachmentsCreation();
				this.fnFetchDataOnTabSelect("Attachments");
				this.fnHandleNoTextCreation("Attachments");
				break;
			case "OBJECTLINKS":
				var m = this.oModel2 ? this.oModel2.getData() : "";
				if (m.TaskSupports.TaskObject === true) {
					this.fnFetchObjectLinks();
				}
				break;
		}
	},
	fnDelegateCommentsCreation: function() {
		if (this.isGenericComponentRendered) {
			return;
		}
		var i = this.oModel2.getData();
		if (this.getView().byId("commentsContainer") && this.fnFormatterSupportsProperty(i.TaskSupports.Comments, i.SupportsComments)) {
			this.createGenericCommentsComponent(this.getView());
		}
	},
	fnDelegateAttachmentsCreation: function() {
		var i = this.oModel2.getData();
		if (this.getView().byId("attachmentComponent") && this.fnFormatterSupportsProperty(i.TaskSupports.Attachments, i.SupportsAttachments)) {
			this.createGenericAttachmentComponent(this.getView());
		}
	},
	createTimeLine: function() {
		var t = this.byId("timeline");
		if (t) {
			t.setSort(false);
			var T = new sap.suite.ui.commons.TimelineItem({
				icon: {
					path: "detail>ActionName",
					formatter: cross.fnd.fiori.inbox.Conversions.formatterActionIcon
				},
				userName: {
					parts: [{
						path: "detail>PerformedByName"
					}, {
						path: "detail>ActionName"
					}],
					formatter: cross.fnd.fiori.inbox.Conversions.formatterActionUsername
				},
				title: {
					path: "detail>ActionName",
					formatter: cross.fnd.fiori.inbox.Conversions.formatterActionText
				},
				dateTime: "{detail>Timestamp}"
			});
			t.bindAggregation("content", {
				path: "detail>/ProcessingLogs/results",
				template: T
			});
		}
	},
	fnSetIconForCommentsFeedInput: function() {
		if (this.oGenericCommentsComponent && this.oGenericCommentsComponent.fnIsFeedInputPresent() && !this.oGenericCommentsComponent.fnGetFeedInputIcon()) {
			if (sap.ushell.Container != undefined) {
				var s = this.oModel2.getData().SAP__Origin;
				var u = sap.ushell.Container.getUser().getId();
				this.oDataManager.getCurrentUserImage(s, u, jQuery.proxy(this.oGenericCommentsComponent.fnSetFeedInputIcon, this.oGenericCommentsComponent));
			}
		}
	},
	fnCountUpdater: function(k, s, i) {
		var t = this;
		var I = this.oModel2.getData();
		switch (k) {
			case "Attachments":
				if (t.fnFormatterSupportsProperty(I.TaskSupports.Attachments, I.SupportsAttachments)) {
					this.oDataManager.fnGetCount(s, i, function(n) {
						t.oModel2.setProperty("/AttachmentsCount", n);
					}, "Attachments");
				}
				break;
			case "Comments":
				if (t.fnFormatterSupportsProperty(I.TaskSupports.Comments, I.SupportsComments)) {
					this.oDataManager.fnGetCount(s, i, function(n) {
						t.oModel2.setProperty("/CommentsCount", n);
					}, "Comments");
				}
				break;
			case "ObjectLinks":
				if (I.TaskSupports.TaskObject && t.oDataManager.bShowTaskObjects) {
					this.oDataManager.fnGetCount(s, i, function(n) {
						t.oModel2.setProperty("/ObjectLinksCount", n);
						t.fnHandleNoTextCreation("ObjectLinks");
					}, "TaskObjects");
				}
				break;
		}
	},
	fnHandleNoTextCreation: function(e) {
		var m = this.oModel2.getData();
		switch (e) {
			case "Comments":
				if (this.oGenericCommentsComponent) {
					if (m.hasOwnProperty("CommentsCount") && m.CommentsCount > 0) {
						this.oGenericCommentsComponent.setNoDataText(this.i18nBundle.getText("XMSG_LOADING"));
					} else if (m.hasOwnProperty("CommentsCount") && m.CommentsCount == 0) {
						this.oGenericCommentsComponent.setNoDataText(this.i18nBundle.getText("view.CreateComment.noComments"));
					}
				}
				break;
			case "Attachments":
				var g = this._getUploadCollectionControl();
				if (g) {
					if (m.hasOwnProperty("AttachmentsCount") && m.AttachmentsCount > 0) {
						g.setNoDataText(this.i18nBundle.getText("XMSG_LOADING"));
					} else if (m.hasOwnProperty("AttachmentsCount") && m.AttachmentsCount == 0) {
						g.setNoDataText(this.i18nBundle.getText("view.Attachments.noAttachments"));
					}
				}
				break;
			case "ProcessingLogs":
				var t = this._getIconTabControl("ProcessingLogs");
				t.setNoDataText(this.i18nBundle.getText("XMSG_LOADING"));
				break;
			case "WorkflowLogs":
				var w = this._getIconTabControl("WorkflowLogs");
				w.setNoDataText(this.i18nBundle.getText("XMSG_LOADING"));
				break;
			case "ObjectLinks":
				var o = this.byId("MIBObjectLinksList");
				if (m.ObjectLinksCount && m.ObjectLinksCount > 0) {
					o.setNoDataText(this.i18nBundle.getText("XMSG_LOADING"));
				} else if (m.ObjectLinksCount && m.ObjectLinksCount == 0) {
					o.setNoDataText(this.i18nBundle.getText("view.ObjectLinks.noObjectLink"));
				}
				break;
			default:
				break;
		}
	},
	fnClearCachedData: function() {
		this.oModel2.setProperty("/AttachmentsCount", "");
		this.oModel2.setProperty("/CommentsCount", "");
		this.oModel2.setProperty("/ObjectLinksCount", "");
		this.oModel2.setProperty("/ProcessingLogs", "");
		this.oModel2.setProperty("/Attachments", "");
		this.oModel2.setProperty("/Comments", "");
		this.oModel2.setProperty("/ObjectLinks", "");
		this.oModel2.setProperty("/StatusText", "");
		this.oModel2.setProperty("/WorkflowLogs", "");
	},
	fnFetchDataOnTabSelect: function(n) {
		var p = this.sCtxPath + "/" + n;
		var P = null;
		if (n === "Attachments" || n === "Comments") {
			P = {
				$orderby: "CreatedAt desc"
			};
		}
		var m = this.oModel2.getData();
		var d = (m[n] && m[n].results) ? true : false;
		var t = this._getIconTabControl(n);
		var s = function(a) {
			this.fnUpdateDataAfterFetchComplete(m, d, n, a);
			this._setBusyIncdicatorOnDetailControls(t, false);
		};
		var e = function(E) {
			this._setBusyIncdicatorOnDetailControls(t, false);
			this.oDataManager.oDataRequestFailed(E);
		};
		if (!d && m[this.oMapCountProperty[n]] > 0) {
			this._setBusyIncdicatorOnDetailControls(t, true);
		}
		this.oDataManager.oDataRead(p, P, jQuery.proxy(s, this), jQuery.proxy(e, this));
	},
	fnUpdateDataAfterFetchComplete: function(m, d, n, a) {
		var A = false;
		if (d && a.results.length > 0) {
			jQuery.extend(true, m[n], a);
		} else {
			A = m[n].results != null && m[n].results.length > 0 && a.results != null && a.results.length === 0;
			m[n] = a;
		}
		m[this.oMapCountProperty[n]] = a.results.length;
		if (A) {
			this.fnHandleNoTextCreation(n);
		}
		this._updateDetailModel(m);
	},
	_getIconTabControl: function(n) {
		switch (n) {
			case "Comments":
				if (this.oGenericCommentsComponent) {
					return this.oGenericCommentsComponent.getAggregation("rootControl").byId("MIBCommentList");
				}
				return null;
			case "Attachments":
				return this._getUploadCollectionControl();
			case "ProcessingLogs":
				return this.getView().byId("timeline");
			case "WorkflowLogs":
				return this.getView().byId("timelineWorkflowLog");
			case "TaskObjects":
				return this.getView().byId("MIBObjectLinksList");
		}
	},
	fnFetchObjectLinks: function() {
		var o = 0;
		var t = this._getIconTabControl("TaskObjects");
		this._setBusyIncdicatorOnDetailControls(t, true);
		var s = function(d) {
			for (var i = 0; i < d.results.length; i++) {
				if (!d.results[i].Label) {
					o = o + 1;
					d.results[i].Label = this.i18nBundle.getText("object.link.label") + " " + o;
				}
			}
			this._setBusyIncdicatorOnDetailControls(t, false);
			this.oModel2.setProperty("/ObjectLinks", d);
			this.oModel2.setProperty("/ObjectLinksCount", d.results.length);
		};
		var e = function(E) {
			this._setBusyIncdicatorOnDetailControls(t, false);
		};
		this.oDataManager.oDataRead(this.sCtxPath + "/" + "TaskObjects", null, jQuery.proxy(s, this), jQuery.proxy(e, this));
	},
	onSupportInfoOpenEvent: function(c, e, s) {
		if (s.source === "MAIN") {
			var C = null;
			var I = this.oModel2.getData();
			if (this.aTaskDefinitionData) {
				for (var i = 0; i < this.aTaskDefinitionData.length; i++) {
					if (I && (I.TaskDefinitionID === this.aTaskDefinitionData[i].TaskDefinitionID)) {
						if (this.aTaskDefinitionData[i].CustomAttributeDefinitionData.results) {
							C = this.aTaskDefinitionData[i].CustomAttributeDefinitionData.results;
						}
					}
				}
			}
			cross.fnd.fiori.inbox.util.SupportInfo.setTask(I, C);
		}
	},
	addAction: function(a, f) {
		var l;
		if (arguments.length < 2) {
			throw "Should have two arguments, Action object and listener function";
		}
		if (arguments.length === 3) {
			if (typeof arguments[1] === "function") {
				f = arguments[1];
			} else {
				throw "Second argument is not a listener function";
			}
			if (typeof arguments[2] === "object") {
				l = arguments[2];
			}
		}
		if (!a) {
			throw "Provide Action object with action name, label and optionally type (Accept/Reject)";
		}
		if (!f) {
			throw "Provide listener function for the Action";
		}
		var s = false;
		if (this.oHeaderFooterOptions) {
			var b = a.action;
			var c = a.label;
			var d = {
				actionId: b,
				sBtnTxt: c,
				onBtnPressed: l ? jQuery.proxy(f, l) : f
			};
			if (a.type && (a.type.toUpperCase() === "ACCEPT" || a.type.toUpperCase() === "POSITIVE")) {
				d.nature = "POSITIVE";
				var i = 0;
				while (i < this.oHeaderFooterOptions.buttonList.length && this.oHeaderFooterOptions.buttonList[i].nature && this.oHeaderFooterOptions
					.buttonList[i].nature === "POSITIVE") {
					i++;
				}
				this.oHeaderFooterOptions.buttonList.splice(i, 0, d);
			} else if (a.type && (a.type.toUpperCase() === "REJECT" || a.type.toUpperCase() === "NEGATIVE")) {
				d.nature = "NEGATIVE";
				var i = 0;
				while (i < this.oHeaderFooterOptions.buttonList.length && this.oHeaderFooterOptions.buttonList[i].nature && (this.oHeaderFooterOptions
						.buttonList[i].nature === "POSITIVE" || this.oHeaderFooterOptions.buttonList[i].nature === "NEGATIVE")) {
					i++;
				}
				this.oHeaderFooterOptions.buttonList.splice(i, 0, d);
			} else {
				this.oHeaderFooterOptions.buttonList.push(d);
			}
			this.refreshHeaderFooterOptions();
			s = true;
		}
		return s;
	},
	removeAction: function(a) {
		var s = false;
		var b = [];
		var c;
		if (!a) {
			throw "Provide Action string to be removed";
		}
		if (this.oHeaderFooterOptions) {
			if (this.oHeaderFooterOptions.oPositiveAction && this.oHeaderFooterOptions.oPositiveAction.actionId == a) {
				this.oHeaderFooterOptions.oPositiveAction = null;
				this.refreshHeaderFooterOptions();
				s = true;
			} else if (this.oHeaderFooterOptions.oNegativeAction && this.oHeaderFooterOptions.oNegativeAction.actionId == a) {
				this.oHeaderFooterOptions.oNegativeAction = null;
				this.refreshHeaderFooterOptions();
				s = true;
			} else {
				b = this.oHeaderFooterOptions.buttonList;
				c = b.length;
				for (var i = 0; i < c; i++) {
					if (a == b[i].actionId) {
						b.splice(i, 1);
						this.oHeaderFooterOptions.buttonList = b;
						this.refreshHeaderFooterOptions();
						s = true;
						break;
					}
				}
			}
		}
		return s;
	},
	disableAction: function(a) {
		var s = false;
		var b = [];
		if (this.oHeaderFooterOptions) {
			if (this.oHeaderFooterOptions.oPositiveAction && this.oHeaderFooterOptions.oPositiveAction.actionId == a) {
				this.oHeaderFooterOptions.oPositiveAction.bDisabled = true;
				this.refreshHeaderFooterOptions();
				s = true;
			} else if (this.oHeaderFooterOptions.oNegativeAction && this.oHeaderFooterOptions.oNegativeAction.actionId == a) {
				this.oHeaderFooterOptions.oNegativeAction.bDisabled = true;
				this.refreshHeaderFooterOptions();
				s = true;
			} else {
				b = this.oHeaderFooterOptions.buttonList;
				for (var i = 0; i < b.length; i++) {
					if (a && a == b[i].actionId) {
						b[i].bDisabled = true;
						this.oHeaderFooterOptions.buttonList = b;
						this.refreshHeaderFooterOptions();
						s = true;
						break;
					}
				}
			}
		}
		return s;
	},
	disableAllActions: function() {
		var s = false;
		var b = [];
		if (this.oHeaderFooterOptions) {
			s = true;
			if (this.oHeaderFooterOptions.oPositiveAction && this.oHeaderFooterOptions.oPositiveAction.actionId) {
				this.oHeaderFooterOptions.oPositiveAction.bDisabled = true;
			}
			if (this.oHeaderFooterOptions.oNegativeAction && this.oHeaderFooterOptions.oNegativeAction.actionId) {
				this.oHeaderFooterOptions.oNegativeAction.bDisabled = true;
			}
			b = this.oHeaderFooterOptions.buttonList;
			if (b) {
				for (var i = 0; i < b.length; i++) {
					if (b[i].actionId) {
						b[i].bDisabled = true;
					}
				}
				this.oHeaderFooterOptions.buttonList = b;
			}
			this.refreshHeaderFooterOptions();
		}
		return s;
	},
	enableAction: function(a) {
		var s = false;
		var b = [];
		if (this.oHeaderFooterOptions) {
			if (this.oHeaderFooterOptions.oPositiveAction && this.oHeaderFooterOptions.oPositiveAction.actionId == a) {
				this.oHeaderFooterOptions.oPositiveAction.bDisabled = false;
				this.refreshHeaderFooterOptions();
				s = true;
			} else if (this.oHeaderFooterOptions.oNegativeAction && this.oHeaderFooterOptions.oNegativeAction.actionId == a) {
				this.oHeaderFooterOptions.oNegativeAction.bDisabled = false;
				this.refreshHeaderFooterOptions();
				s = true;
			} else {
				b = this.oHeaderFooterOptions.buttonList;
				for (var i = 0; i < b.length; i++) {
					if (a && a == b[i].actionId) {
						b[i].bDisabled = false;
						this.oHeaderFooterOptions.buttonList = b;
						this.refreshHeaderFooterOptions();
						s = true;
						break;
					}
				}
			}
		}
		return s;
	},
	enableAllActions: function() {
		var s = false;
		var b = [];
		if (this.oHeaderFooterOptions) {
			s = true;
			if (this.oHeaderFooterOptions.oPositiveAction && this.oHeaderFooterOptions.oPositiveAction.actionId) {
				this.oHeaderFooterOptions.oPositiveAction.bDisabled = false;
			}
			if (this.oHeaderFooterOptions.oNegativeAction && this.oHeaderFooterOptions.oNegativeAction.actionId) {
				this.oHeaderFooterOptions.oNegativeAction.bDisabled = false;
			}
			b = this.oHeaderFooterOptions.buttonList;
			if (b) {
				for (var i = 0; i < b.length; i++) {
					if (b[i].actionId) {
						b[i].bDisabled = false;
					}
				}
				this.oHeaderFooterOptions.buttonList = b;
			}
			this.refreshHeaderFooterOptions();
		}
		return s;
	},
	_createCustomAttributesElements: function(d, c) {
		var C = this.getView().byId("customAttributesContainer");
		var a = this.aCA;
		for (var i = 0; i < c.length; i++) {
			var A = c[i].Name;
			var l = c[i].Type;
			var D = c[i].Label;
			var o;
			var s = true;
			if ((A.toLowerCase() === this.sCustomTaskTitleAttribute.toLowerCase() || A.toLowerCase() === this.sCustomNumberValueAttribute.toLowerCase() ||
					A.toLowerCase() === this.sCustomNumberUnitValueAttribute.toLowerCase() || A.toLowerCase() === this.sCustomObjectAttributeValue.toLowerCase()
				)) {
				s = false;
			}
			if (s) {
				if (A && l && D) {
					for (var j = 0; j < d.CustomAttributeData.length; j++) {
						if (this._getShowAdditionalAttributes() === true) {
							o = this.getView().getModel().getProperty("/" + d.CustomAttributeData[j]);
						} else {
							o = d.CustomAttributeData[j];
						}
						if (o.Name === A) {
							var n = new sap.ui.layout.form.FormElement("", {});
							n.setLayoutData(new sap.ui.layout.ResponsiveFlowLayoutData("", {
								linebreak: true,
								margin: false
							}));
							var L = new sap.m.Label("", {
								text: D
							});
							L.setLayoutData(new sap.ui.layout.ResponsiveFlowLayoutData("", {
								weight: 3,
								minWidth: 192
							}));
							n.setLabel(L);
							var v = cross.fnd.fiori.inbox.Conversions.fnCustomAttributeTypeFormatter(o.Value, l);
							var t = new sap.m.Text("", {
								text: v
							});
							t.setLayoutData(new sap.ui.layout.ResponsiveFlowLayoutData("", {
								weight: 5
							}));
							n.addField(t);
							C.addFormElement(n);
							a.push(n);
							break;
						}
					}
				}
			}
		}
		this.byId("DescriptionContent").rerender();
	},
	_createCustomAttributesOnDataLoaded: function(c) {
		if (this.aCA.length === 0 && this.oModel2.getData().CustomAttributeData && this.oModel2.getData().CustomAttributeData.length > 0 && c &&
			c.length > 0) {
			jQuery.proxy(this._createCustomAttributesElements(this.oModel2.getData(), c), this);
		}
	},
	_getUploadCollectionControl: function() {
		var u;
		if (this.isGenericComponentRendered && this.oAttachmentComponentView) {
			u = this.oAttachmentComponentView.byId("uploadCollection");
		} else if (this.oGenericAttachmentComponent && !this.isGenericComponentRendered) {
			u = this.oGenericAttachmentComponent.view.byId("uploadCollection");
		}
		return u;
	},
	_setBusyIncdicatorOnDetailControls: function(c, s) {
		if (c) {
			if (s) {
				c.setBusyIndicatorDelay(1000);
			}
			c.setBusy(s);
		}
	},
	_processCustomAttributesData: function(i) {
		if (i.CustomAttributeData && i.CustomAttributeData.__list) {
			i.CustomAttributeData = i.CustomAttributeData.__list;
		}
		var d = this.oDataManager.getCustomAttributeDefinitions()[i.TaskDefinitionID];
		if (d && d instanceof Array) {
			i.CustomAttributeDefinitionData = d;
		}
		return i;
	},
	_getShowAdditionalAttributes: function() {
		if (this.bShowAdditionalAttributes == null) {
			this.bShowAdditionalAttributes = this.oDataManager.getShowAdditionalAttributes();
		}
		return this.bShowAdditionalAttributes;
	},
	createCalendarEvent: function() {
		var t = this;
		var d = this.oModel2.getData();
		var D = d.CompletionDeadLine;
		if (D) {
			D.setDate(D.getDate() - 1);
			var n = D.getFullYear();
			var a = D.getMonth();
			var b = D.getDate();
			var c = D.getHours();
			var e = D.getMinutes();
			var f = D.getSeconds();
			var s = new Date(n, a, b, c, e, f);
			var g = new Date(n, a, b, c, e + 60, f);
			var h = d.TaskTitle;
			var i = this.getMailBody();
			var j = function(o) {
				sap.m.MessageToast.show(t.i18nBundle.getText("dialog.success.mq.calendarEventCreated"));
			};
			var k = function(o) {
				var E = t.i18nBundle.getText("dialog.error.mq.calendarPluginError");
				sap.ca.ui.message.showMessageBox({
					type: sap.ca.ui.message.Type.ERROR,
					message: E,
					details: o
				});
			};
			var l = function(o) {
				if (typeof(o) === "string" || o.length == 0) {
					window.plugins.calendar.createEvent(h, null, i, s, g, j, k);
				} else {
					sap.m.MessageToast.show(t.i18nBundle.getText("dialog.error.mq.calendarThereIsAnEventAlready"));
				}
			};
			var m = function(o) {
				window.plugins.calendar.createEvent(h, null, i, s, g, j, k);
			};
			window.plugins.calendar.findEvent(h, null, null, s, g, l, m);
			D.setDate(D.getDate() + 1);
		}
	},
	_getActionHelper: function() {
		if (!this._oActionHelper) {
			jQuery.sap.require("cross.fnd.fiori.inbox.util.ActionHelper");
			this._oActionHelper = new cross.fnd.fiori.inbox.util.ActionHelper(this, this.getView());
		}
		return this._oActionHelper;
	}
});