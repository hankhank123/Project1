/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("sap.ca.scfld.md.controller.ScfldMasterController");
jQuery.sap.require("cross.fnd.fiori.inbox.util.MultiSelect");
jQuery.sap.require("cross.fnd.fiori.inbox.util.Forward");
jQuery.sap.require("cross.fnd.fiori.inbox.util.ForwardSimple");
jQuery.sap.require("cross.fnd.fiori.inbox.util.SupportInfo");
jQuery.sap.require("cross.fnd.fiori.inbox.util.Resubmit");
jQuery.sap.require("cross.fnd.fiori.inbox.util.TaskStatusFilterProvider");
jQuery.sap.require("cross.fnd.fiori.inbox.util.InboxFilterContributor");
jQuery.sap.require("cross.fnd.fiori.inbox.util.OutboxFilterContributor");
jQuery.sap.require("cross.fnd.fiori.inbox.util.ConfirmationDialogManager");
jQuery.sap.require("cross.fnd.fiori.inbox.util.Substitution");
jQuery.sap.require("cross.fnd.fiori.inbox.util.ODataExtension");
sap.ca.scfld.md.controller.ScfldMasterController.extend("cross.fnd.fiori.inbox.view.S2", {
	extHookChangeFilterItems: null,
	extHookChangeSortConfig: null,
	extHookChangeGroupConfig: null,
	extHookGetCustomFilter: null,
	extHookChangeMassApprovalButtons: null,
	extHookGetPropertiesToSelect: null,
	_FILTER_CATEGORY_PRIORITY: "Priority",
	_FILTER_PRIORITY_VERY_HIGH: "VERY_HIGH",
	_FILTER_PRIORITY_HIGH: "HIGH",
	_FILTER_PRIORITY_MEDIUM: "MEDIUM",
	_FILTER_PRIORITY_LOW: "LOW",
	_FILTER_CATEGORY_COMPLETION_DEADLINE: "CompletionDeadLine",
	_FILTER_EXPIRY_DATE_OVERDUE: "Overdue",
	_FILTER_EXPIRY_DATE_DUE_IN_7_DAYS: "DueIn7days",
	_FILTER_EXPIRY_DATE_DUE_IN_30_DAYS: "DueIn30days",
	_FILTER_EXPIRY_DATE_ALL: "All",
	_FILTER_CATEGORY_STATUS: "Status",
	_FILTER_CATEGORY_CREATION_DATE: "CreatedOn",
	_FILTER_CATEGORY_COMPLETED: "Completed",
	_FILTER_CATEGORY_SNOOZED: "ResumeIn",
	_FILTER_CATEGORY_TASK_DEFINITION_ID: "TaskDefinitionID",
	_FILTER_CATEGORY_SUBSTITUTED_USER: "SubstitutedUser",
	_SORT_CREATEDON: "CreatedOn",
	_SORT_CREATEDONREVERSE: "CreatedOnReverse",
	_SORT_CREATEDBYNAME: "CreatedByName",
	_SORT_PRIORITY: "Priority",
	_SORT_PRIORITY_NUMBER: "PriorityNumber",
	_SORT_TASKTITLE: "TaskTitle",
	_SORT_COMPLETIONDEADLINE: "CompletionDeadLine",
	_SORT_COMPLETEDON: "CompletedOn",
	_SORT_SAPORIGIN: "SAP__Origin",
	_SORT_INSTANCEID: "InstanceID",
	_SORT_TASKDEFINITIONID: "TaskDefinitionID",
	_SORT_TASKDEFINITIONNAME: "TaskDefinitionName",
	_SORT_STATUS: "Status",
	_SORT_CREATEDBY: "CreatedBy",
	_SORT_PROCESSOR: "Processor",
	_SORT_STARTDEADLINE: "StartDeadLine",
	_SORT_EXPIRYDATE: "ExpiryDate",
	_SORT_ISESCALATED: "IsEscalated",
	_SORT_HASCOMMENTS: "HasComments",
	_SORT_HASATTACHMENTS: "HasAttachments",
	_SORT_HASPOTENTIALOWNERS: "HasPotentialOwners",
	_SORT_CONTEXTSERVICEURL: "ContextServiceURL",
	_CUSTOM_NUMBER_LABEL: "CustomNumberLabel",
	_CUSTOM_NUMBER_VALUE: "CustomNumberValue",
	_CUSTOM_NUMBER_UNIT_LABEL: "CustomNumberUnitLabel",
	_CUSTOM_NUMBER_UNIT_VALUE: "CustomNumberUnitValue",
	_CUSTOM_OBJECT_ATTRIBUTE_LABEL: "CustomObjectAttributeLabel",
	_CUSTOM_OBJECT_ATTRIBUTE_VALUE: "CustomObjectAttributeValue",
	_GUI_LINK_SELECT_PROPERTY: "GUI_Link",
	_FUNCTION_IMPORT_DECISION: "Decision",
	_GROUP_SUPPORTSRELEASE: "SupportsRelease",
	_GROUP_STATUS_ORDER: [{
		Status: "READY",
		TextKey: "group.status.ready"
	}, {
		Status: "IN_PROGRESS",
		TextKey: "group.status.in_progress"
	}, {
		Status: "RESERVED",
		TextKey: "group.status.reserved"
	}, {
		Status: "EXECUTED",
		TextKey: "group.status.executed"
	}, {
		Status: "FOR_RESUBMISSION",
		TextKey: "group.status.suspended"
	}, {
		Status: "COMPLETED",
		TextKey: "group.status.completed"
	}],
	aItemContextPathsToSelect: [],
	complexFilter: {
		Priority: [],
		CompletionDeadLine: [],
		TaskDefinitionID: [],
		SubstitutedUser: [],
		Status: [],
		CreatedOn: [],
		CustomNumberValue: [],
		CustomNumberUnitValue: [],
		CustomObjectAttributeValue: []
	},
	sSearchPattern_Support: "",
	sFilterKey_Support: "",
	sSortKey_Support: "",
	sGroupkey_Support: "",
	oConfirmationDialogManager: cross.fnd.fiori.inbox.util.ConfirmationDialogManager,
	oDataExtension: new cross.fnd.fiori.inbox.ODataExtension(),
	bHideHeaderFooterOptions: null,
	aSelectProperties: ["SAP__Origin", "InstanceID", "TaskDefinitionID", "TaskDefinitionName", "TaskTitle", "CreatedByName", "CreatedBy",
		"CompletionDeadLine", "SubstitutedUserName", "Status", "Priority", "PriorityNumber", "HasComments", "HasAttachments",
		"HasPotentialOwners", "CreatedOn", "TaskSupports", "SupportsClaim", "SupportsRelease", "SupportsForward", "SupportsComments",
		"SupportsAttachments"
	],
	aSelectPropertiesOutbox: ["CompletedOn", "ResumeOn"],
	sCustomObjectAttributeValue: "CustomObjectAttributeValue",
	sCustomAttributeDataProperty: "CustomAttributeData",
	onInit: function() {
		if (this.getList().getItems().length > 0) {
			this.getList().removeItem(0);
		}
		this.bInitList = true;
		var o = sap.ca.scfld.md.app.Application.getImpl().getComponent();
		o.setModel(new sap.ui.model.json.JSONModel([]), "taskDefinitionsModel");
		sap.ca.scfld.md.controller.ScfldMasterController.prototype.onInit.call(this);
		var e = o.getEventBus();
		e.subscribe("cross.fnd.fiori.inbox", "multiselect", this.onMultiSelectEvent, this);
		e.subscribe("cross.fnd.fiori.inbox", "open_supportinfo", this.onSupportInfoOpenEvent, this);
		e.subscribe("cross.fnd.fiori.inbox.dataManager", "multiSelectFilterCompleted", jQuery.proxy(this.onMultiSelectFilterCompleted, this));
		e.subscribe("cross.fnd.fiori.inbox.dataManager", "multiSelectFilterFailed", jQuery.proxy(this.onMultiSelectFilterFailed, this));
		e.subscribe("cross.fnd.fiori.inbox.dataManager", "taskCollectionFailed", jQuery.proxy(this.onTaskCollectionFailed, this));
		e.subscribe("cross.fnd.fiori.inbox.dataManager", "showReleaseLoader", jQuery.proxy(this.onShowReleaseLoader, this));
		e.subscribe("cross.fnd.fiori.inbox.dataManager", "refreshOnError", jQuery.proxy(this.onRefreshOnError, this));
		e.subscribe("cross.fnd.fiori.inbox", "storeNextItemsToSelect", jQuery.proxy(this.findNextVisibleItem, this));
		this.iTotalFilteredItems = 0;
		this.sResubmitUniqueId = this.createId() + "DLG_RESUBMIT";
		this.oDataManager = o.getDataManager();
		var O = this.getView().getModel();
		if (!this.oDataManager) {
			jQuery.sap.require("cross.fnd.fiori.inbox.util.DataManager");
			this.oDataManager = new cross.fnd.fiori.inbox.util.DataManager(O, this);
			o.setDataManager(this.oDataManager);
		}
		var d = this.getView().getModel();
		cross.fnd.fiori.inbox.oDataReadExtension.overrideRead(d);
		this.oDataExtension.overrideBindList(d).overrideProcessSuccess(d).overrideImportData(d);
		this.overrideMHFHelperSetMasterTitle();
		this.overrideMHFHelperFooterHandling();
		this.overrideMHFHelperListRefresh();
		this.getView().getModel().attachRequestFailed(jQuery.proxy(this.handleRequestFailed, this));
		this.getView().getModel().attachRequestCompleted(jQuery.proxy(this.handleRequestCompleted, this));
		this.getView().getModel().attachMetadataFailed(jQuery.proxy(this.handleMetadataFailed, this));
		this.getView().getModel().setSizeLimit(this.oDataManager.getListSize());
		if (this.oDataManager.getPagingEnabled()) {
			this.getList().setGrowing(true).setGrowingScrollToLoad(true).setGrowingThreshold(this.oDataManager.getPageSize());
		}
		this.oRouter.attachRouteMatched(function(E) {
			if (E.getParameter("name") === "master") {
				if (this.bIsMasterInited) {
					if (sap.ui.Device.system.phone) {
						var l = this.getList();
						l.removeSelections(true);
						this.sBindingContextPath = null;
					}
					return;
				}
				var c = this;
				this.oDataManager.attachItemRemoved($.proxy(this._handleItemRemoved, this));
				this.oDataManager.attachActionPerformed($.proxy(this.fnHandleActionPerformed, this));
				this.sInfoHeaderGroupString = null;
				this.sInfoHeaderFilterString = null;
				this.bDisplaySortOption = false;
				this.sDefaultSortKey = this.oDataManager.bOutbox ? this._SORT_COMPLETEDON : this._SORT_CREATEDON;
				this.sSortKey = null;
				this.aVisibleSortItems = [];
				var I = function(k) {
					return (function() {
						return c.sBackendDefaultSortKey === k;
					});
				};
				this.oSortConfig = {};
				this.oSortConfig[this._SORT_CREATEDONREVERSE] = {
					text: "{i18n>sort.createdOnReverse}",
					getVisible: I(this._SORT_CREATEDONREVERSE)
				};
				this.oSortConfig[this._SORT_CREATEDBYNAME] = {
					text: "{i18n>sort.createdByName}"
				};
				this.oSortConfig[this._SORT_PRIORITY] = {
					text: "{i18n>sort.priority}",
					descending: true
				};
				this.oSortConfig[this._SORT_TASKTITLE] = {
					text: "{i18n>sort.taskTitle}"
				};
				this.oSortConfig[this._SORT_SAPORIGIN] = {
					text: "{i18n>sort.sapOrigin}",
					getVisible: I(this._SORT_SAPORIGIN)
				};
				this.oSortConfig[this._SORT_INSTANCEID] = {
					text: "{i18n>sort.instanceID}",
					getVisible: I(this._SORT_INSTANCEID)
				};
				this.oSortConfig[this._SORT_TASKDEFINITIONID] = {
					text: "{i18n>sort.taskDefinitionID}",
					getVisible: I(this._SORT_TASKDEFINITIONID)
				};
				this.oSortConfig[this._SORT_TASKDEFINITIONNAME] = {
					text: "{i18n>sort.taskDefinitionName}",
					getVisible: I(this._SORT_TASKDEFINITIONNAME)
				};
				this.oSortConfig[this._SORT_STATUS] = {
					text: "{i18n>sort.status}",
					getVisible: I(this._SORT_STATUS)
				};
				this.oSortConfig[this._SORT_CREATEDBY] = {
					text: "{i18n>sort.createdBy}",
					getVisible: I(this._SORT_CREATEDBY)
				};
				this.oSortConfig[this._SORT_PROCESSOR] = {
					text: "{i18n>sort.processor}",
					getVisible: I(this._SORT_PROCESSOR)
				};
				this.oSortConfig[this._SORT_STARTDEADLINE] = {
					text: "{i18n>sort.startDeadLine}",
					getVisible: I(this._SORT_STARTDEADLINE)
				};
				this.oSortConfig[this._SORT_EXPIRYDATE] = {
					text: "{i18n>sort.expiryDate}",
					getVisible: I(this._SORT_EXPIRYDATE)
				};
				this.oSortConfig[this._SORT_ISESCALATED] = {
					text: "{i18n>sort.isEscalated}",
					descending: true,
					getVisible: I(this._SORT_ISESCALATED)
				};
				this.oSortConfig[this._SORT_HASCOMMENTS] = {
					text: "{i18n>sort.hasComments}",
					descending: true,
					getVisible: I(this._SORT_HASCOMMENTS)
				};
				this.oSortConfig[this._SORT_HASATTACHMENTS] = {
					text: "{i18n>sort.hasAttachments}",
					descending: true,
					getVisible: I(this._SORT_HASATTACHMENTS)
				};
				this.oSortConfig[this._SORT_HASPOTENTIALOWNERS] = {
					text: "{i18n>sort.hasPotentialOwners}",
					getVisible: I(this._SORT_HASPOTENTIALOWNERS)
				};
				this.oSortConfig[this._SORT_CONTEXTSERVICEURL] = {
					text: "{i18n>sort.contextServiceURL}",
					getVisible: I(this._SORT_CONTEXTSERVICEURL)
				};
				if (!this.oDataManager.bOutbox) {
					this.oSortConfig[this._SORT_CREATEDON] = {
						text: "{i18n>sort.createdOn}",
						descending: true,
						getVisible: I(this._SORT_CREATEDON)
					};
					this.oSortConfig[this._SORT_COMPLETIONDEADLINE] = {
						text: "{i18n>sort.completionDeadLine}"
					};
				} else {
					this.oSortConfig[this._SORT_COMPLETEDON] = {
						text: "{i18n>sort.completedOn}",
						descending: true
					};
				}
				if (this.extHookChangeSortConfig) {
					this.extHookChangeSortConfig(this.oSortConfig);
				}
				this.oGroupConfigItem = null;
				this.bGroupDescending = false;
				this.aGroupConfig = [];
				this.aGroupConfig.push({
					key: this._SORT_PRIORITY,
					textKey: "group.priority",
					formatter: function(C) {
						var s = C.getProperty(c._SORT_SAPORIGIN);
						var p = C.getProperty(c._SORT_PRIORITY);
						return cross.fnd.fiori.inbox.Conversions.formatterPriority.call(c.getView(), s, p);
					}
				});
				this.aGroupConfig.push({
					key: this._SORT_TASKDEFINITIONNAME,
					textKey: "group.taskType",
					formatter: function(C) {
						var t = C.getProperty(c._SORT_TASKDEFINITIONNAME);
						return t;
					}
				});
				this.aGroupConfig.push({
					key: this._SORT_STATUS,
					textKey: "group.status",
					formatter: function(C) {
						var a = c.getView().getModel("i18n").getResourceBundle();
						var s = C.getProperty(c._SORT_STATUS);
						var t;
						for (var i = 0; i < c._GROUP_STATUS_ORDER.length; i++) {
							var g = c._GROUP_STATUS_ORDER[i];
							if (g.Status == s) {
								t = g.TextKey;
								break;
							}
						}
						return a.getText(t);
					}
				});
				if (!this.oDataManager.bOutbox) {
					this.aGroupConfig.push({
						key: this._GROUP_SUPPORTSRELEASE,
						textKey: "group.reservation",
						formatter: function(C) {
							var i = c.getView().getModel("i18n").getResourceBundle();
							var k = C.getProperty(c._GROUP_SUPPORTSRELEASE) ? "group.reservation.reserved" : "group.reservation.notReserved";
							return i.getText(k);
						}
					});
				}
				if (this.extHookChangeGroupConfig) {
					this.extHookChangeGroupConfig(this.aGroupConfig);
				}
				this.bDisplayMultiSelectButton = false;
				this.clearDecisionButtons();
				this.oSubHeader = this.getPage().getSubHeader();
				if (O) {
					if (!this.oDataManager.oModel.getServiceMetadata()) {
						this.oDataManager.oModel.attachMetadataLoaded(jQuery.proxy(function() {
							this.loadInitialAppData();
						}, this));
					} else {
						this.loadInitialAppData();
					}
				}
				this.bIsMasterInited = true;
			} else if (E.getParameter("name") === "detail") {
				this.sBindingContextPath = this.getBindingContextPathFor(E.getParameter("arguments"));
			}
		}, this);
		this.iRequestCountStart++;
		this.aTaskTypeFilterItemsOrigins = [];
		this.bGUILinkSelectPropertySupported = false;
	},
	noItemFoundForContext: function() {
		if (!this.oDataManager.getDetailPageLoadedViaDeepLinking()) {
			sap.ca.scfld.md.controller.ScfldMasterController.prototype.noItemFoundForContext.call(this);
		}
	},
	_areItemsUniqueByTaskType: function() {
		var l = this.getList().getItems();
		if (!l || l.length === 0) {
			return false;
		}
		var a = 0;
		var b = l[a].getBindingContext();
		if (!b) {
			if (l.length === 1) {
				return false;
			}
			a += 1;
			b = l[a].getBindingContext();
		}
		var B;
		var i, c;
		for (i = a + 1, c = l.length; i < c; i++) {
			B = l[i].getBindingContext();
			if (B && B.getProperty("TaskDefinitionID") != b.getProperty("TaskDefinitionID")) {
				return false;
			}
		}
		return true;
	},
	_handleItemRemoved: function(e) {
		if (!sap.ui.Device.system.phone) {
			var l = this.getList().getSelectedItem();
			var p = this.getDetailNavigationParameters(l);
			p.InstanceID += ":";
			this.oRouter.navTo(this.getDetailRouteName(), p, true);
		}
	},
	handleRequestFailed: function(e) {
		var l = this.getList();
		var n = this.oApplicationFacade.getUiLibResourceModel().getText("NO_ITEMS_AVAILABLE");
		l.setNoDataText(n);
	},
	getTotalTaskCount: function(e) {
		if (this.oDataManager.getPagingEnabled()) {
			var t = new RegExp("TaskCollection[?]");
			if (t.test(e.getParameter('url'))) {
				var T = JSON.parse([e.getParameter('response').responseText]);
				if (T && T.d) {
					this.iTaskCount = parseInt(T.d.__count);
					this.bTaskCountFromTaskCollectionCall = true;
				}
			}
		}
	},
	handleRequestCompleted: function(e) {
		this.getTotalTaskCount(e);
	},
	fnHandleActionPerformed: function(e) {
		this.isActionPerformed = true;
	},
	fnFindAndSelectNextTaskAfterAction: function(e) {
		var m = this.getView().getModel();
		if (this.isMultiSelectActive()) {
			this._handleMultiSelectProcessing();
			return;
		}
		var l = this.getList().getItems();
		var s = this.getList().getSelectedItem();
		if (this.aItemContextPathsToSelect.length != 0 && l.length > 0 && !sap.ui.Device.system.phone) {
			var i = false;
			for (var c in this.aItemContextPathsToSelect) {
				var C = this.aItemContextPathsToSelect[c];
				if (i) {
					break;
				}
				for (var L in l) {
					var a = l[L].getBindingContext();
					if (a && a == C) {
						i = true;
						if (s !== null) {
							var S = s.getBindingContext();
							if (C == S) {
								if (!this.bInitList) {
									var A = {},
										I;
									I = this.oDataManager.getTableView() && (!sap.ui.Device.system.phone || this.oDataManager.getTableViewOnPhone());
									A.bIsTableViewActive = I;
									this.oDataManager.fireRefreshDetails(A);
								}
							} else {
								this.setListItem(l[L]);
							}
						} else {
							this.setListItem(l[L]);
						}
						break;
					}
				}
			}
			this.bInitList = false;
			if (!i) {
				if (this.aItemContextPathsToSelect.length == 2 && this.aItemContextPathsToSelect[0] === this.aItemContextPathsToSelect[1]) {
					if (this.iTotalFilteredItems == 0) {
						this.noItemFoundForContext();
					} else {
						for (var L in l) {
							if ((l[L].getVisible())) {
								this.setListItem(l[L]);
								break;
							}
						}
					}
				} else {
					this.selectIteminListforDeepLink();
				}
			}
		} else {
			if (l.length > 0) {
				this.selectIteminListforDeepLink();
			} else {
				if (!this.oDataManager.getCallFromDeepLinkURL()) {
					this.oRouter.navTo("master", null, true);
					this.navToEmptyView();
				} else {
					this.oDataManager.setCallFromDeepLinkURL(false);
				}
			}
		}
	},
	selectIteminListforDeepLink: function() {
		if (this.getList().getItems().length > 0) {
			this._selectItemByCtxtPath();
			return true;
		}
		return false;
	},
	_handleMultiSelectProcessing: function() {
		if (this.isMultiSelectActive()) {
			var l = this.getList().getItems();
			if (l.length !== 0) {
				var c = undefined;
				var i = 0;
				do {
					c = l[i].getBindingContext();
					i++;
				} while (!c);
				this.downloadDecisionOptions(c.getProperty("SAP__Origin"), c.getProperty("InstanceID"), c.getProperty("TaskDefinitionID"));
			} else {
				this.setMultiSelectButtonActive(true);
				if (!sap.ui.Device.system.phone) this.oRouter.navTo("multi_select_summary", {}, true);
			}
			return;
		}
	},
	_selectItemByCtxtPath: function() {
		if (this.sBindingContextPath) {
			var i = this.findItemByContextPath(this.sBindingContextPath);
			var l = this.getList().getItems();
			var I = (this.getView().getModel().getProperty(this.sBindingContextPath)) ? true : false;
			if (i && jQuery.isEmptyObject(i.getBindingContext())) {
				var c = new sap.ui.model.Context(this.getView().getModel(), this.sBindingContextPath);
				i.setBindingContext(c);
			}
			if (i && I) {
				this.setListItem(i);
				this.oDataManager.setCallFromDeepLinkURL(false);
				return true;
			} else if (!this.oDataManager.getCallFromDeepLinkURL()) {
				this.fnSelectFirstItem();
			}
		} else {
			if (!sap.ui.Device.system.phone) this.fnSelectFirstItem();
		}
		this.oDataManager.setCallFromDeepLinkURL(false);
	},
	fnSelectFirstItem: function() {
		var l = this.getList().getItems();
		if (l.length > 0) {
			var v = undefined;
			var i = 0;
			do {
				v = l[i];
				i++;
			} while (!v.getBindingContext());
			this.setListItem(v);
		}
	},
	findNextVisibleItem: function(c, e, i) {
		var s = this.getList();
		var I = -1;
		var a = -1;
		this.aItemContextPathsToSelect = [];
		for (var l in s.getItems()) {
			var C = s.getItems()[l].getBindingContextPath();
			if (C) {
				var S = s.getItems()[l].getBindingContext().getProperty("SAP__Origin");
				var b = s.getItems()[l].getBindingContext().getProperty("InstanceID");
				if (S === i.sOrigin && b === i.sInstanceID) {
					I = l;
					this.aItemContextPathsToSelect.push(C);
				}
			}
			if ((s.getItems()[l].getVisible()) && ((a <= I) || (I == -1))) {
				a = l;
				if (I !== -1 && a !== I) {
					break;
				}
			}
		}
		if ((a == -1) && (s.getItems().length > 0)) {
			a = 0;
		}
		if (a >= 0) {
			this.aItemContextPathsToSelect.push(s.getItems()[a].getBindingContextPath());
		}
	},
	overrideMHFHelperSetMasterTitle: function() {
		var t = this;
		sap.ca.scfld.md.app.Application.getImpl().oMHFHelper.setMasterTitle = function(c, C) {
			if (!c._oControlStore.oMasterTitle) {
				return;
			}
			var o = sap.ca.scfld.md.app.Application.getImpl().getComponent();
			this.oDataManager = o.getDataManager();
			if (!this.oDataManager) {
				return;
			}
			if (t._oControlStore.oMasterSearchField.getValue().length == 0) {
				var l = t.getList();
				if (l && l.getItems()) {
					var i = l.getBinding("items");
					if (i && i.aKeys) {
						C = i.aKeys.length;
					}
					if (t._oControlStore.oMasterSearchField.getValue() == "" && t.oDataManager.getPagingEnabled()) {
						t.bTaskCountFromTaskCollectionCall = true;
					} else if (!t.oDataManager.getPagingEnabled()) {
						t.bTaskCountFromTaskCollectionCall = false;
					}
				}
			} else {
				t.bTaskCountFromTaskCollectionCall = false;
			}
			var T = (t.iTaskCount && t.bTaskCountFromTaskCollectionCall) ? t.iTaskCount : C;
			t.iTotalFilteredItems = T;
			if (!this.oDataManager.getScenarioConfig() || !this.oDataManager.getScenarioConfig().DisplayName) {
				var b = this.oApplicationImplementation.AppI18nModel.getResourceBundle();
				this.sTitle = b.getText(c._oHeaderFooterOptions.sI18NMasterTitle, [T]);
			} else {
				this.sTitle = this.oDataManager.getScenarioConfig().DisplayName + " (" + T + ")";
			}
			c._oControlStore.oMasterTitle.setText(this.sTitle);
		};
	},
	overrideMHFHelperFooterHandling: function() {
		var m = sap.ca.scfld.md.app.Application.getImpl().oMHFHelper;
		var t = this;
		var o = m.defineFooterRight;
		m.defineFooterRight = function(c) {
			var f = this.getFooterRightCount(c);
			if (c._oHeaderFooterOptions.oPositiveAction) {
				var b = {};
				jQuery.extend(b, c._oHeaderFooterOptions.oPositiveAction);
				b.style = sap.m.ButtonType.Accept;
				c._oControlStore.oButtonListHelper.ensureButton(b, "b", f);
			}
			if (c._oHeaderFooterOptions.oNegativeAction) {
				var b = {};
				jQuery.extend(b, c._oHeaderFooterOptions.oNegativeAction);
				b.style = sap.m.ButtonType.Reject;
				c._oControlStore.oButtonListHelper.ensureButton(b, "b", f);
			}
			o.call(this, c);
		};
		var O = m.getFooterRightCount;
		m.getFooterRightCount = function(c) {
			var C;
			if (t.isMultiSelectActive()) {
				C = 2;
			} else {
				C = O.call(this, c);
			}
			return C;
		};
	},
	overrideMHFHelperListRefresh: function() {
		var m = sap.ca.scfld.md.app.Application.getImpl().oMHFHelper;
		var t = this;
		var o = m.refreshList;
		m.refreshList = function(c, i) {
			t.oDataManager.fetchTaskDefinitionsandCustomAttributeDefinitions(jQuery.proxy(t.initTaskDefnandCustomAttrDefnnModel, t));
			o.call(this, c, i);
		};
	},
	applySearchPatternToListItem: function(i, f) {
		this.sSearchPattern_Support = f;
		if ((i.getIntro() && i.getIntro().toLowerCase().indexOf(f) != -1) || (i.getTitle() && i.getTitle().toLowerCase().indexOf(f) != -1) ||
			(i.getNumber() && i.getNumber().toLowerCase().indexOf(f) != -1) || (i.getNumberUnit() && i.getNumberUnit().toLowerCase().indexOf(f) !=
				-1) || (i.getFirstStatus() && i.getFirstStatus().getText().toLowerCase().indexOf(f) != -1) || (i.getSecondStatus() && i.getSecondStatus()
				.getText().toLowerCase().indexOf(f) != -1)) {
			if (this.searchListFlag === 0 || this.searchListFlag === undefined) {
				this.searchListFlag = 1;
				this.searchListFirstItem = this.getDetailNavigationParameters(i);
			}
			return true;
		}
		var a = i.getAttributes();
		for (var j = 0; j < a.length; j++) {
			if (a[j].getText().toLowerCase().indexOf(f) != -1) {
				if (this.searchListFlag === 0 || this.searchListFlag === undefined) {
					this.searchListFlag = 1;
					this.searchListFirstItem = this.getDetailNavigationParameters(i);
				}
				return true;
			}
		}
		return false;
	},
	createSubstitutesUserFilterOption: function() {
		if (this.oDataManager.getSubstitutionEnabled()) {
			var i = this.getView().getModel("i18n").getResourceBundle();
			var s = this.createSubstitutedUserFilterCategory(i);
			this.getSubstitutedUsers(s);
			if (this.oSubstitutedUserFilterKeys) {
				this.resetSubstitutedUserFilterCategoryCount(Object.keys(this.oSubstitutedUserFilterKeys).length);
			}
			this.aFilterItems.push(s);
		}
	},
	getHeaderFooterOptions: function() {
		var t = this;
		var h = {
			sI18NMasterTitle: "MASTER_TITLE"
		};
		if (this.bHideHeaderFooterOptions) {
			return {};
		}
		if (!this.isMultiSelectActive()) {
			h.oFilterOptions = {
				onFilterPressed: jQuery.proxy(function() {
					if (!t.oDataManager.bOutbox) {
						var i = this.getView().getModel("i18n").getResourceBundle();
						this.aFilterItems = cross.fnd.fiori.inbox.util.InboxFilterContributor.getAllFilters(i, this.complexFilter);
						t.createSubstitutesUserFilterOption();
					}
					t.onShowFilter();
				}, t)
			};
			if (this.bDisplaySortOption) {
				h.oSortOptions = {
					aSortItems: this.aVisibleSortItems,
					sSelectedItemKey: this.sSortKey,
					onSortSelected: jQuery.proxy(t.handleSort, t)
				};
				h.oGroupOptions = {
					onGroupPressed: jQuery.proxy(t.onShowGroup, t)
				};
			}
		}
		if (!this.oDataManager.bOutbox) {
			h.oEditBtn = {
				onBtnPressed: jQuery.proxy(function() {
					if (!this.isMultiSelectActive()) {
						this.prepareMultiSelect();
					} else {
						this.dismissMultiSelect();
					}
				}, t),
				bDisabled: !this.bDisplayMultiSelectButton
			};
		}
		if (this.oMultiSelectActions) {
			h.oPositiveAction = this.oMultiSelectActions.positiveAction;
			h.oNegativeAction = this.oMultiSelectActions.negativeAction;
			h.buttonList = this.oMultiSelectActions.additionalActions;
		}
		return h;
	},
	_findFilterKey: function(f) {
		for (var a in this.complexFilter) {
			var b = this.complexFilter[a];
			for (var i = 0; i < b.length; i++) {
				if (b[i] === f) {
					return true;
				}
			}
		}
		return false;
	},
	_resetFilterState: function() {
		this.complexFilterBackup = this.complexFilter;
		this.complexFilter = {
			Priority: [],
			CompletionDeadLine: [],
			TaskDefinitionID: [],
			Status: [],
			CreatedOn: [],
			CustomNumberValue: [],
			CustomNumberUnitValue: [],
			CustomObjectAttributeValue: [],
			SubstitutedUser: []
		};
	},
	_saveFilterState: function(f) {
		this._resetFilterState();
		for (var k in f) {
			var a = k.split(":");
			if (!this.complexFilter[a[0]]) {
				this.complexFilter[a[0]] = [];
			}
			this.complexFilter[a[0]].push(k);
		}
	},
	_createFilterCategory: function(t, m) {
		var i = true;
		if (arguments.length == 2) {
			i = m;
		}
		return new sap.m.ViewSettingsFilterItem({
			text: t,
			multiSelect: i
		});
	},
	_createFilterItem: function(k, t) {
		var f = new sap.m.ViewSettingsItem({
			text: t,
			key: k
		});
		if (this._findFilterKey(k)) {
			f.setSelected(true);
		}
		return f;
	},
	fnCreateSubstitutedUserFilterKeys: function(e) {
		var t = this;
		var s = e.getSource().getSelectedItems();
		var f = {};
		t.sSelectedSubstitutesNameForFilterString = "";
		var k = null;
		for (var i = 0; i < s.length; i++) {
			k = s[i].data("key");
			f[k] = true;
			t.sSelectedSubstitutesNameForFilterString = (s.length === 1) ? s[i].getTitle() : t.sSelectedSubstitutesNameForFilterString + s[i].getTitle() +
				", ";
		}
		t.oSubstitutedUserFilterKeys = f;
		t.resetSubstitutedUserFilterCategoryCount(s.length);
	},
	createSubstitutedUserFilterCategory: function(i) {
		var s = new sap.m.ViewSettingsCustomItem({
			text: i.getText("filter.substitutingUserList")
		});
		return s;
	},
	resetSubstitutesListSelection: function(e) {
		var f = e.getSource();
		var i = this.getView().getModel("i18n").getResourceBundle();
		var s = null;
		jQuery.each(f.getAggregation('filterItems'), function(a, F) {
			if (F.getText() == i.getText("filter.substitutingUserList")) {
				s = F;
				return;
			}
		});
		if (s) {
			var S = s.getCustomControl();
			S.removeSelections(true);
		}
		this.oSubstitutedUserFilterKeys = null;
	},
	storeSubstitutedUserKeysInListItem: function(s, S) {
		if (s) {
			for (var i = 0; i < s.length; i++) {
				s[i].data("key", S.oData.oItems[i].key);
			}
		}
	},
	createDynamicSubstiutedUserList: function(s, S) {
		var d = s;
		var t = this;
		var n = this.getView().getModel("i18n").getResourceBundle().getText("view.SubstitutedUserList.noRecipients");
		var o = sap.ui.getCore().byId("substituesUser");
		if (!o) {
			o = new sap.m.List({
				id: "substituesUser",
				mode: "MultiSelect"
			});
		}
		var u = new sap.m.StandardListItem({
			title: "{substitutedUserModel>text}"
		});
		o.attachSelectionChange(function(e) {
			t.fnCreateSubstitutedUserFilterKeys(e);
		});
		d.setCustomControl(o);
		d.setModel(S, "substitutedUserModel");
		o.setModel(S, "substitutedUserModel");
		o.bindAggregation("items", "substitutedUserModel>/oItems", u);
		t.storeSubstitutedUserKeysInListItem(o.getAggregation("items"), S);
		o.setNoDataText(n);
		if (t.oSubstitutedUserFilterKeys) {
			for (var i = 0; i < t.aSubstitutedUserFilterItemList.length; i++) {
				if (t.oSubstitutedUserFilterKeys[t.aSubstitutedUserFilterItemList[i].key]) {
					o.setSelectedItem(o.getItems()[i]);
				}
			}
		}
		return d;
	},
	createSubstitutedUserFilterItems: function(u, U) {
		var s = {
			text: U,
			key: u,
			selected: false
		};
		if (this._findFilterKey(u)) {
			s.selected = true;
		}
		return s;
	},
	getSubstitutedUsers: function(s) {
		var S = new sap.ui.model.json.JSONModel({});
		S.setData({
			oItems: []
		});
		this.createDynamicSubstiutedUserList(s, S);
		this.aSubstitutedUserFilterItemList = [];
		this.oSubstitutedUserDynamicFilter = s;
		var f = function(d) {
			var u = d.results,
				t = this;
			var o = [];
			var n;
			if (u && u.length && u.length > 0) {
				var b = this.getView().getModel("i18n").getResourceBundle();
				var m = b.getText("filter.substitutingUserList.myTasks");
				var a = {
					UniqueName: "",
					DisplayName: m
				};
				o.push(cross.fnd.fiori.inbox.Substitution._processSubstitutedUsersCollection(a));
			}
			jQuery.each(u, function(g, h) {
				if (!jQuery.isEmptyObject(u)) {
					n = true;
					jQuery.each(o, function(g, p) {
						if (p.UniqueName === h.UniqueName) {
							n = false;
							return false;
						}
					});
				}
				if (n) {
					o.push(cross.fnd.fiori.inbox.Substitution._processSubstitutedUsersCollection(h));
				}
			});
			for (var i = 0; i < o.length; i++) {
				var c = t._FILTER_CATEGORY_SUBSTITUTED_USER + ":" + o[i].UniqueName;
				var e = this.createSubstitutedUserFilterItems(c, o[i].DisplayName);
				t.aSubstitutedUserFilterItemList.push(e);
			}
			S.setData({
				oItems: t.aSubstitutedUserFilterItemList
			});
			S.checkUpdate(true);
			t.createDynamicSubstiutedUserList(s, S);
		};
		this.oDataManager.readSubstitutedUserList(jQuery.proxy(f, this));
	},
	resetSubstitutedUserFilterCategoryCount: function(c) {
		if (this.oSubstitutedUserDynamicFilter !== undefined) {
			this.oSubstitutedUserDynamicFilter.setFilterCount(c);
		}
	},
	onShowFilter: function() {
		var t = this;
		t.aTaskTypeFilterItemsOrigins = [];
		var a = t.getView().getModel("i18n").getResourceBundle();
		var b = this._createFilterCategory(a.getText("filter.taskType"));
		this.aTaskTypeFilterItems = new Array();
		var s = function(r) {
			if (!this.oDataManager.bAllItems) {
				var S = this.oDataManager.getScenarioConfig().ScenarioServiceInfos;
			}
			for (var i = 0; i < r.length; i++) {
				var p = false;
				if (this.oDataManager.bAllItems) {
					p = true;
				} else {
					for (var j = 0; j < S.length; j++) {
						for (var k = 0; k < S[j].TaskDefinitionIDs.length; k++) {
							if (r[i].TaskDefinitionID.toUpperCase().indexOf(S[j].TaskDefinitionIDs[k].toUpperCase()) == 0 && (S[j].Origin === r[i].SAP__Origin ||
									this.oDataManager.sClientScenario)) {
								p = true;
								break;
							}
						}
					}
				}
				if (p) {
					var d = {
						taskTitle: r[i].TaskName,
						taskDefinitionID: r[i].TaskDefinitionID,
						SAP__Origin: r[i].SAP__Origin
					};
					this.aTaskTypeFilterItems.push(d);
				}
			}
			this.aTaskTypeFilterItems.sort(function(h, m) {
				if (h.taskTitle < m.taskTitle) {
					return -1;
				}
				if (h.taskTitle > m.taskTitle) {
					return 1;
				}
				return 0;
			});
			for (var i = 0; i < this.aTaskTypeFilterItems.length; i++) {
				var e = this._FILTER_CATEGORY_TASK_DEFINITION_ID + ":" + this.aTaskTypeFilterItems[i].taskDefinitionID + ":" + this.aTaskTypeFilterItems[
					i].SAP__Origin;
				var f = this._createFilterItem(e, this.aTaskTypeFilterItems[i].taskTitle);
				b.addItem(f);
			}
			if (this.oDataManager.bOutbox) {
				this.aFilterItems = cross.fnd.fiori.inbox.util.OutboxFilterContributor.getAllFilters(a, this.complexFilter);
				this.aFilterItems.push(b);
			} else {
				this.aFilterItems.push(b);
			}
			if (this._areItemsUniqueByTaskType()) {
				var C = null;
				var l = this.getList().getItems();
				if (l && l.length > 0) {
					C = l[0].getBindingContext();
				}
				if (!C) {
					C = l[1].getBindingContext();
				}
			}
			if (this.extHookChangeFilterItems) {
				this.extHookChangeFilterItems(this.aFilterItems);
			}
			var g = new sap.m.ViewSettingsDialog({
				title: a.getText("filter.dialog.title"),
				filterItems: this.aFilterItems,
				confirm: function(E) {
					this.destroy();
					t.oFilterKeys = E.getParameter("filterKeys");
					if (t.oSubstitutedUserFilterKeys) {
						jQuery.extend(t.oFilterKeys, t.oSubstitutedUserFilterKeys);
					}
					if (Object.keys(t.oFilterKeys).length === 0) {
						t.sInfoHeaderFilterString = null;
					} else {
						var a = t.getView().getModel("i18n").getResourceBundle();
						var h = null;
						var F = E.getParameter("filterString");
						if (t.oSubstitutedUserFilterKeys) {
							h = t.addFilterTextForSubstitutionFilter(F, a);
						}
						t.sInfoHeaderFilterString = h ? h : F;
					}
					t.refreshInfoHeaderToolbar();
					t._saveFilterState(t.oFilterKeys);
					t.handleFilter(t.oFilterKeys);
				},
				cancel: function(E) {
					if (t.resetInitiated) {
						t.complexFilter = t.complexFilterBackup;
						t.resetInitiated = false;
					}
					this.destroy();
				},
				resetFilters: function(E) {
					t.resetInitiated = true;
					t._resetFilterState();
					t.resetSubstitutedUserFilterCategoryCount(0);
					t.resetSubstitutesListSelection(E);
				}
			});
			g.open();
		};
		if (this.getView().getModel("taskDefinitionsModel")) {
			var c = jQuery.proxy(s, this);
			c((this.getView().getModel("taskDefinitionsModel").getData()));
		} else {
			this.oDataManager.readTaskDefinitionCollection(jQuery.proxy(s, this), jQuery.proxy(s, this));
		}
	},
	addFilterTextForSubstitutionFilter: function(f, i) {
		var s;
		if (f) {
			s = f + ", " + i.getText("filter.substitutingUserList") + " (" + this.sSelectedSubstitutesNameForFilterString + ")";
		} else {
			s = i.getText("multi.header", i.getText("filter.substitutingUserList") + " (" + this.sSelectedSubstitutesNameForFilterString + ")");
		}
		return s;
	},
	_createGroupSettingItem: function(g, t) {
		var i = this.getView().getModel("i18n").getResourceBundle();
		if (!t) {
			t = i.getText(g.textKey);
		}
		var G = new sap.m.ViewSettingsItem({
			key: g.key,
			text: t
		});
		return G;
	},
	onShowGroup: function() {
		var t = this;
		var g = [];
		for (var i = 0; i < this.aGroupConfig.length; i++) {
			var G = this._createGroupSettingItem(this.aGroupConfig[i]);
			g.push(G);
		}
		var o = new sap.m.ViewSettingsDialog({
			title: "{i18n>group.dialog.title}",
			groupItems: g,
			groupDescending: this.bGroupDescending,
			selectedGroupItem: this.oGroupConfigItem ? this.oGroupConfigItem.key : null,
			confirm: function(e) {
				o.destroy();
				var G = e.getParameter("groupItem");
				if (G && G.getKey()) {
					var s = G.getKey();
					for (var i = 0; i < t.aGroupConfig.length; i++) {
						var a = t.aGroupConfig[i];
						if (a.key == s) {
							t.oGroupConfigItem = a;
							break;
						}
					}
				} else {
					t.oGroupConfigItem = null;
				}
				t.bGroupDescending = e.getParameter("groupDescending");
				t.handleGroup();
			},
			cancel: function() {
				o.destroy();
			}
		});
		o.open();
	},
	_isListFilteredByTaskType: function(b, l) {
		var i, a;
		for (i = 2, a = l.length; i < a; i++) {
			var B = l[i].getBindingContext();
			if (B && B.getProperty("TaskDefinitionID") != b.getProperty("TaskDefinitionID")) {
				return false;
			}
		}
		return true;
	},
	prepareMultiSelect: function() {
		var t = this;
		this.setMultiSelectButtonActive(false);
		var l = this.getList().getItems();
		if (l.length == 0) {
			return;
		}
		var s = function(r, m) {
			var d = [];
			if (m && this.getView().getModel("taskDefinitionsModel")) {
				this.getView().getModel("taskDefinitionsModel").setData(r, false);
			}
			if (!this.oDataManager.bAllItems) {
				var e = this.oDataManager.getScenarioConfig().ScenarioServiceInfos;
			}
			var g = [];
			for (var c in this.oFilterKeys) {
				if (this.oFilterKeys.hasOwnProperty(c) && c) {
					var K = c.split(":");
					if (K[0] === this._FILTER_CATEGORY_TASK_DEFINITION_ID) {
						g.push(K[1]);
					}
				}
			}
			for (var i = 0; i < r.length; i++) {
				var p = false;
				if (this.oDataManager.bAllItems) {
					p = true;
				} else {
					for (var j = 0; j < e.length; j++) {
						for (var k = 0; k < e[j].TaskDefinitionIDs.length; k++) {
							if (r[i].TaskDefinitionID.toUpperCase().indexOf(e[j].TaskDefinitionIDs[k].toUpperCase()) == 0 && (e[j].Origin === r[i].SAP__Origin ||
									this.oDataManager.sClientScenario)) {
								p = true;
								break;
							}
						}
					}
				}
				if (p && (g.length === 0 || g.indexOf(r[i].TaskDefinitionID) !== -1)) {
					var F = {
						title: r[i].TaskName,
						id: r[i].TaskDefinitionID,
						origin: r[i].SAP__Origin
					};
					d.push(F);
				}
			}
			if (d.length > 1) {
				d.sort(function(a, b) {
					if (a.title < b.title) return -1;
					if (a.title > b.title) return 1;
					return 0;
				});
				var o = cross.fnd.fiori.inbox.util.MultiSelect.openFilterDialog(d, jQuery.proxy(this.multiSelectFilterDialogOK, this), null);
				if (o) {
					if (!m) {
						o.getController().byId("DIALOG").setBusy(true);
					} else {
						o.getController().byId("DIALOG").setBusy(false);
					}
				}
				return true;
			} else {
				var F = d[0];
				this.multiSelectFilterDialogOK(F);
				return false;
			}
		};
		var T = 0;
		for (var c in this.oFilterKeys) {
			if (this.oFilterKeys.hasOwnProperty(c) && c) {
				var K = c.split(":");
				if (K[0] === this._FILTER_CATEGORY_TASK_DEFINITION_ID) {
					T++;
				}
			}
		}
		if (T !== 1) {
			if (this.getView().getModel("taskDefinitionsModel")) {
				var S = jQuery.proxy(s, this);
				var f = S(this.getView().getModel("taskDefinitionsModel").getData());
				if (f) {
					this.oDataManager.readTaskDefinitionCollection(jQuery.proxy(s, this), null, true);
				}
			} else {
				this.oDataManager.readTaskDefinitionCollection(jQuery.proxy(s, this));
			}
		} else {
			var L = this.getList();
			if (L.getItems().length !== 0) {
				var C = {};
				for (var i = 0; i < L.getItems().length; i++) {
					C = L.getItems()[i].getBindingContext();
					if (C) {
						var F = {
							title: C.getProperty("TaskDefinitionName"),
							id: C.getProperty("TaskDefinitionID"),
							origin: C.getProperty("SAP__Origin")
						};
						this.multiSelectFilterDialogOK(F);
						break;
					}
				}
			}
		}
	},
	dismissMultiSelect: function() {
		this.isActionPerformed = true;
		this.sBindingContextPath = undefined;
		this.setMultiSelectButtonActive(false);
		var l = this.getList();
		l.destroyHeaderToolbar();
		l.destroyInfoToolbar();
		this.getPage().setSubHeader(this.oSubHeader);
		if (this._oControlStore.oMasterPullToRefresh) this._oControlStore.oMasterPullToRefresh.setVisible(true);
		this.refreshInfoHeaderToolbar();
		l.setMode(this.getView().getModel("device").getProperty("/listMode"));
		l.removeSelections(true);
		this.filterItemsByTaskDefinitionID(null);
		this.clearDecisionButtons();
	},
	multiSelectFilterDialogOK: function(f) {
		this.isActionPerformed = true;
		this.setProcessingMultiSelect({
			bProcessing: true,
			oFilterItem: f
		});
		this.filterItemsByTaskDefinitionID(f.id, f.origin);
	},
	refreshInfoHeaderToolbar: function(t) {
		if (!t) {
			var t = "";
		}
		if (this.sInfoHeaderGroupString) {
			if (t) t += "; ";
			t += this.sInfoHeaderGroupString;
		}
		if (this.sInfoHeaderFilterString) {
			if (t) t += "; ";
			t += this.sInfoHeaderFilterString;
		}
		this.refreshInfoHeaderToolbarForList(this.getList(), t);
		this.refreshInfoHeaderToolbarForList(this._emptyList, t);
	},
	refreshInfoHeaderToolbarForList: function(l, t) {
		var h = l.getHeaderToolbar();
		if (t) {
			if (!h) {
				h = new sap.m.Toolbar({
					design: sap.m.ToolbarDesign.Info
				});
				l.setHeaderToolbar(h);
			}
			h.destroyContent();
			h.addContent(new sap.m.Label({
				text: t
			}));
		} else {
			if (h) l.destroyHeaderToolbar();
		}
	},
	downloadDecisionOptions: function(s, i, t) {
		this.oDataManager.readDecisionOptions(s, i, t, jQuery.proxy(this.downloadDecisionOptionsSuccess, this), null, true);
	},
	downloadDecisionOptionsSuccess: function(d) {
		this.setMultiSelectButtonActive(true);
		if (!sap.ui.Device.system.phone) this.oRouter.navTo("multi_select_summary", {}, true);
		var l = this.getList();
		var i = this.getView().getModel("i18n").getResourceBundle();
		this.oSelectAllCheckBox = new sap.m.CheckBox({
			select: jQuery.proxy(this.handleSelectAllCheckBoxPress, this)
		});
		var I = new sap.m.Toolbar({
			design: sap.m.ToolbarDesign.Transparent,
			content: [this.oSelectAllCheckBox]
		});
		I.addStyleClass("crossFndFioriInboxInfoToolbarPadding");
		l.setInfoToolbar(I);
		this.getPage().setSubHeader(null);
		if (this._oControlStore.oMasterPullToRefresh) this._oControlStore.oMasterPullToRefresh.setVisible(false);
		l.removeSelections(true);
		this.aMultiSelectDecisionOptions = d;
		this._oApplicationImplementation.oMHFHelper.defineMasterHeaderFooter(this);
		this.updateSelectAllCheckBox();
	},
	_handleSelect: function(e) {
		if (!this.isMultiSelectActive()) {
			sap.ca.scfld.md.controller.ScfldMasterController.prototype._handleSelect.call(this, e);
		} else {
			this.updateMultiSelectState();
			this.publishMultiSelectEvent(e.getParameter("selected"), [e.getParameter("listItem").getBindingContext().getProperty()]);
		}
	},
	updateMultiSelectState: function() {
		var s = this.getList().getSelectedItems().length;
		switch (s) {
			case 0:
				this.hideDecisionButtons();
				break;
			default:
				this.showDecisionButtons();
				break;
		}
		this.updateSelectAllCheckBox();
	},
	publishMultiSelectEvent: function(s, w, r, S) {
		var m = {};
		m.Source = S ? S : "S2";
		m.Selected = s;
		m.WorkItems = w;
		m.reInitialize = r;
		sap.ca.scfld.md.app.Application.getImpl().getComponent().getEventBus().publish("cross.fnd.fiori.inbox", "multiselect", m);
	},
	getActualListItems: function() {
		var l = [];
		if (this.getList().getItems()[0] instanceof sap.m.GroupHeaderListItem) {
			for (var i = 1; i < this.getList().getItems().length; i++) {
				if (!(this.getList().getItems()[i] instanceof sap.m.GroupHeaderListItem)) {
					l.push(this.getList().getItems()[i]);
				}
			}
		} else {
			l = this.getList().getItems();
		}
		return l;
	},
	updateSelectAllCheckBox: function() {
		var i = this.getView().getModel("i18n").getResourceBundle();
		var s = this.getList().getSelectedItems().length < this.getActualListItems().length;
		if (this.oSelectAllCheckBox) {
			this.oSelectAllCheckBox.setText(i.getText(s ? "multi.selectall" : "multi.deselectall"));
			this.oSelectAllCheckBox.setSelected(!s);
		}
	},
	handleSelectAllCheckBoxPress: function() {
		var l = this.getActualListItems();
		if (this.getList().getSelectedItems().length < l.length) {
			var a = [];
			for (var i = 0; i < l.length; i++) {
				var L = l[i];
				if (!L.getBindingContext()) {
					continue;
				}
				if (L.getVisible()) {
					L.setSelected(true);
					a.push(L.getBindingContext().getProperty());
				}
			}
			this.publishMultiSelectEvent(true, a);
		} else {
			this.getList().removeSelections(true);
			this.publishMultiSelectEvent(false, []);
		}
		this.updateMultiSelectState();
	},
	onMultiSelectEvent: function(c, e, m) {
		if (m.Source === "MultiSelectSummary" || m.Source === "action") {
			var l = this.getList();
			var L = l.getItems();
			for (var i = 0; i < m.WorkItems.length; i++) {
				for (var j = 0; j < L.length; j++) {
					var o = L[j];
					var C = o.getBindingContext();
					if (!C) continue;
					if (C.getProperty("SAP__Origin") == m.WorkItems[i].SAP__Origin && C.getProperty("InstanceID") == m.WorkItems[i].InstanceID) o.setSelected(
						m.Selected);
				}
			}
			this.updateMultiSelectState();
		}
	},
	onSupportInfoOpenEvent: function(c, e, s) {
		if (s.source === "MAIN") {
			cross.fnd.fiori.inbox.util.SupportInfo.setSearchPattern(this.sSearchPattern_Support);
			cross.fnd.fiori.inbox.util.SupportInfo.setFilters(this.sFilterKey_Support);
			cross.fnd.fiori.inbox.util.SupportInfo.setSorters(this.sSortKey_Support);
			cross.fnd.fiori.inbox.util.SupportInfo.setGroup(this.sGroupkey_Support);
		}
	},
	filterItemsByTaskDefinitionID: function(t, o) {
		if (t) {
			this.oFilterKeysBeforeMultiSelect = jQuery.extend(true, {}, this.oFilterKeys);
			var f = {};
			var S = o ? o : "";
			f["TaskDefinitionID:" + t + ":" + S] = true;
			var s = false;
			for (var k in this.oFilterKeys) {
				if (this.oFilterKeys.hasOwnProperty(k) && k) {
					var K = k.split(":");
					if (K[0] !== this._FILTER_CATEGORY_TASK_DEFINITION_ID) {
						if (K[0] === this._FILTER_CATEGORY_STATUS && K[1] !== cross.fnd.fiori.inbox.util.InboxFilterContributor._FILTER_STATUS_AWAITING_CONFIRMATION) {
							f[k] = true;
							s = true;
						} else if (K[0] !== this._FILTER_CATEGORY_STATUS) {
							f[k] = true;
						}
					}
				}
			}
			if (!s) {
				f[this._FILTER_CATEGORY_STATUS + ":" + cross.fnd.fiori.inbox.util.InboxFilterContributor._FILTER_STATUS_NEW] = true;
				f[this._FILTER_CATEGORY_STATUS + ":" + cross.fnd.fiori.inbox.util.InboxFilterContributor._FILTER_STATUS_IN_PROGRESS] = true;
				f[this._FILTER_CATEGORY_STATUS + ":" + cross.fnd.fiori.inbox.util.InboxFilterContributor._FILTER_STATUS_RESERVED] = true;
			}
			this.oFilterKeys = f;
			return this.handleFilter(this.oFilterKeys);
		} else {
			if (this.oFilterKeysBeforeMultiSelect) {
				this.oFilterKeys = jQuery.extend(true, {}, this.oFilterKeysBeforeMultiSelect);
				return this.handleFilter(this.oFilterKeys);
			}
		}
	},
	clearDecisionButtons: function() {
		this.oMultiSelectActions = {
			positiveAction: null,
			negativeAction: null,
			additionalActions: []
		};
	},
	hideDecisionButtons: function() {
		this.clearDecisionButtons();
		this._oApplicationImplementation.oMHFHelper.defineMasterHeaderFooter(this);
	},
	checkDecisionSupport: function(s) {
		var c;
		var d = {
			Claim: true,
			Release: true,
			Forward: true,
			Resubmit: true
		};
		for (var i = 0; i < s.length; i++) {
			c = s[i].getBindingContext();
			d.Claim = d.Claim && cross.fnd.fiori.inbox.Conversions.formatterSupportsProperty(c.getProperty("TaskSupports").Claim, c.getProperty(
				"SupportsClaim"));
			d.Release = d.Release && cross.fnd.fiori.inbox.Conversions.formatterSupportsProperty(c.getProperty("TaskSupports").Release, c.getProperty(
				"SupportsRelease"));
			d.Forward = d.Forward && cross.fnd.fiori.inbox.Conversions.formatterSupportsProperty(c.getProperty("TaskSupports").Forward, c.getProperty(
				"SupportsForward"));
			d.Resubmit = d.Resubmit && cross.fnd.fiori.inbox.Conversions.formatterSupportsProperty(c.getProperty("TaskSupports").Resubmit, false);
			if (!d.Claim && !d.Release && !d.Forward && !d.Resubmit) {
				break;
			}
		}
		return d;
	},
	showDecisionButtons: function() {
		this.clearDecisionButtons();
		var t = this,
			T = this.aMultiSelectDecisionOptions ? this.aMultiSelectDecisionOptions.length : 0;
		if (T > 0) {
			for (var i = 0; i < T; i++) {
				var d = this.aMultiSelectDecisionOptions[i];
				var D = d.DecisionText;
				var b = {
					nature: d.Nature,
					sBtnTxt: D,
					onBtnPressed: (function(d) {
						return function() {
							t.showDecisionDialog(d);
						};
					})(d)
				};
				this.oMultiSelectActions.additionalActions.push(b);
			}
		}
		var s = this.getList().getSelectedItems();
		var o = this.checkDecisionSupport(s);
		if (o.Claim === true) {
			var c = {
				sI18nBtnTxt: "XBUT_CLAIM",
				onBtnPressed: jQuery.proxy(this.sendMultiClaimRelease, this, s, this.oDataManager.sClaimAction)
			};
			this.oMultiSelectActions.additionalActions.push(c);
		}
		if (o.Release === true) {
			var r = {
				sI18nBtnTxt: "XBUT_RELEASE",
				onBtnPressed: jQuery.proxy(this.sendMultiClaimRelease, this, s, this.oDataManager.sReleaseAction)
			};
			this.oMultiSelectActions.additionalActions.push(r);
		}
		if (o.Forward === true) {
			var f = {
				sI18nBtnTxt: "XBUT_FORWARD",
				onBtnPressed: jQuery.proxy(this.onForwardPopUp, this)
			};
			this.oMultiSelectActions.additionalActions.push(f);
		}
		if (o.Resubmit === true) {
			var R = {
				sI18nBtnTxt: "XBUT_RESUBMIT",
				onBtnPressed: jQuery.proxy(this.showResubmitPopUp, this)
			};
			this.oMultiSelectActions.additionalActions.push(R);
		}
		var B = {};
		B.oPositiveAction = this.oMultiSelectActions.positiveAction;
		B.oNegativeAction = this.oMultiSelectActions.negativeAction;
		B.aButtonList = this.oMultiSelectActions.additionalActions;
		if (this.extHookChangeMassApprovalButtons) {
			this.extHookChangeMassApprovalButtons(B);
			this.oMultiSelectActions.positiveAction = B.oPositiveAction;
			this.oMultiSelectActions.negativeAction = B.oNegativeAction;
			this.oMultiSelectActions.additionalActions = B.aButtonList;
		}
		this._oApplicationImplementation.oMHFHelper.defineMasterHeaderFooter(this);
	},
	showDecisionDialog: function(d) {
		var s = this.getList().getSelectedItems();
		var i = this.getView().getModel("i18n").getResourceBundle();
		this.oConfirmationDialogManager.showDecisionDialog({
			question: i.getText(s.length > 1 ? "XMSG_MULTI_DECISION_QUESTION_PLURAL" : "XMSG_MULTI_DECISION_QUESTION", [d.DecisionText, s.length]),
			showNote: true,
			title: i.getText("XTIT_SUBMIT_DECISION"),
			confirmButtonLabel: i.getText("XBUT_SUBMIT"),
			noteMandatory: d.CommentMandatory,
			confirmActionHandler: jQuery.proxy(function(D, n) {
				this.sendMultiSelectAction(D, n);
			}, this, d)
		});
	},
	sendMultiClaimRelease: function(i, a) {
		var t = this.getList().getBinding("items").getLength();
		var A = (i.length === t) ? true : false;
		this.oDataManager.doMassClaimRelease(i, a, jQuery.proxy(this.sendMultiClaimReleaseSuccess, this, A, a), null);
	},
	sendMultiClaimReleaseSuccess: function(a, A, s, e) {
		if (e.length == 0) {
			var b, p;
			var i = this.getView().getModel("i18n").getResourceBundle();
			if (A === this.oDataManager.sClaimAction) {
				b = "dialog.success.multi_reserve";
				p = "dialog.success.multi_reserve_plural";
			} else {
				b = "dialog.success.multi_release";
				p = "dialog.success.multi_release_plural";
			}
			jQuery.sap.delayedCall(500, this, function() {
				sap.ca.ui.message.showMessageToast(i.getText(s.length > 1 ? p : b, [s.length]));
			});
			this.getList().removeSelections(true);
			this.sendMultiSelectActionEnd(a);
		} else {
			cross.fnd.fiori.inbox.util.MultiSelect.openMessageDialog(s, e, jQuery.proxy(this.sendMultiSelectActionEnd, this, a, e));
		}
	},
	sendMultiSelectAction: function(d, n) {
		var s = this.getList().getSelectedItems();
		var I = [];
		for (var i = 0; i < s.length; i++) {
			var o = s[i].getBindingContext().getObject();
			I.push(o);
		}
		var t = this.getList().getBinding("items").getLength();
		var a = I.length === t ? true : false;
		this.oDataManager.sendMultiAction(this._FUNCTION_IMPORT_DECISION, I, d, n, jQuery.proxy(this.sendMultiSelectActionSuccess, this, a),
			null, true);
	},
	sendMultiSelectActionSuccess: function(a, s, e) {
		if (e.length == 0) {
			var i = this.getView().getModel("i18n").getResourceBundle();
			jQuery.sap.delayedCall(500, this, function() {
				sap.ca.ui.message.showMessageToast(i.getText(s.length > 1 ? "dialog.success.multi_complete_plural" :
					"dialog.success.multi_complete", s.length));
			});
			this.sendMultiSelectActionEnd(a);
		} else {
			cross.fnd.fiori.inbox.util.MultiSelect.openMessageDialog(s, e, jQuery.proxy(this.sendMultiSelectActionEnd, this, a, e));
		}
	},
	sendMultiSelectActionEnd: function(a, e) {
		if (this.oDataManager.getPagingEnabled()) {
			this.oDataManager.oModel.refresh();
		}
		if (e) {
			this.publishMultiSelectEvent(true, e, true, "action");
		} else if (a) {
			this.dismissMultiSelect();
			this.getView().getModel().bFullRefreshNeeded = true;
			this.getView().getModel().refresh();
		} else {
			this.publishMultiSelectEvent(false, [], true, "action");
		}
	},
	sendMultiSelectForwardSuccess: function(a, s, e, A) {
		if (e.length == 0) {
			var i = this.getView().getModel("i18n").getResourceBundle();
			jQuery.sap.delayedCall(500, this, function() {
				sap.ca.ui.message.showMessageToast(i.getText(s.length > 1 ? "dialog.success.multi_forward_complete_plural" :
					"dialog.success.multi_forward_complete", [s.length, A.DisplayName]));
			});
			this.sendMultiSelectActionEnd(a);
		} else {
			cross.fnd.fiori.inbox.util.MultiSelect.openMessageDialog(s, e, jQuery.proxy(this.sendMultiSelectActionEnd, this, a, e));
		}
	},
	isMultiSelectActive: function() {
		return (this.getList().getMode() == sap.m.ListMode.MultiSelect);
	},
	setProcessingMultiSelect: function(m) {
		this.getView().getModel().oProcessingMultiSelect = jQuery.isEmptyObject(m) ? undefined : m;
	},
	setMultiSelectButtonActive: function(a) {
		this._oControlStore.bEditState = a;
		this._oControlStore.oEditBtn.setIcon(a ? "sap-icon://sys-cancel" : "sap-icon://multi-select");
		this._oControlStore.oEditBtn.setTooltip(this.oApplicationFacade.getUiLibResourceModel().getText(a ? "CANCEL" : "MULTI_SELECT"));
	},
	initTaskDefnandCustomAttrDefnnModel: function(d) {
		if (this.getView().getModel("taskDefinitionsModel")) {
			this.getView().getModel("taskDefinitionsModel").setData(d.results, true);
		}
	},
	loadInitialAppData: function() {
		this.oDataManager.fetchTaskDefinitionsandCustomAttributeDefinitions(jQuery.proxy(this.initTaskDefnandCustomAttrDefnnModel, this));
		if (this.oDataManager.sScenarioId || this.oDataManager.sClientScenario) {
			this.oDataManager.loadInitialAppData(jQuery.proxy(function(s) {
				if (!s) {
					return;
				}
				this.getView().getModel().ScenarioServiceInfos = s.ScenarioServiceInfos;
				var c = this.oDataManager.getScenarioConfig();
				if ((s.ScenarioServiceInfos.length == 1) || (c.AllItems == true)) this.bDisplaySortOption = true;
				this.bDisplayMultiSelectButton = c.IsMassActionEnabled;
				this.sBackendDefaultSortKey = c.SortBy;
				this.fnAddAditionalSelectPropertiesAndInitBinding();
				if (this.bDisplaySortOption) {
					this.setSortItemsToDisplay();
				}
			}, this));
		} else {
			var c = this.oDataManager.getScenarioConfig();
			if (c.AllItems == true) {
				this.bDisplayMultiSelectButton = c.IsMassActionEnabled ? true : false;
				this.bDisplaySortOption = true;
				this.sBackendDefaultSortKey = c.SortBy;
				this.fnAddAditionalSelectPropertiesAndInitBinding();
				if (this.bDisplaySortOption) {
					this.setSortItemsToDisplay();
				}
			}
		}
	},
	fnAddAditionalSelectPropertiesAndInitBinding: function() {
		var t = this;
		t.oDataManager.oModel.getMetaModel().loaded().then(function(m) {
			t.oDataManager.oServiceMetaModel = t.oDataManager.oModel.getMetaModel();
			var T = t.oDataManager.oServiceMetaModel.getODataEntityType("TASKPROCESSING.Task");
			if (T) {
				if (t.oDataManager.oServiceMetaModel.getODataProperty(T, "GUI_Link")) {
					t.bGUILinkSelectPropertySupported = true;
				}
			}
			t.initListBinding(t.configureSorters(t.sBackendDefaultSortKey), t.getAllFilters());
		});
	},
	initListBinding: function(s, f) {
		var p = this.aSelectProperties.concat();
		if (this.extHookGetPropertiesToSelect) {
			var P = this.extHookGetPropertiesToSelect();
			p = p.concat(P);
		}
		if (this.oDataManager.bOutbox) {
			p = p.concat(this.aSelectPropertiesOutbox);
		}
		if (this.oDataManager.getShowAdditionalAttributes() === true) {
			p.push(this.sCustomAttributeDataProperty);
		}
		if (this.bGUILinkSelectPropertySupported) {
			p.push(this._GUI_LINK_SELECT_PROPERTY);
		}
		var o = "";
		var d;
		if (this.oDataManager.getOperationMode() === sap.ui.model.odata.OperationMode.Client) {
			o = sap.ui.model.odata.OperationMode.Client;
		} else {
			o = sap.ui.model.odata.OperationMode.Server;
			if (this.oDataManager.getPagingEnabled() === false) {
				d = true;
			}
		}
		var a = {
			countMode: sap.ui.model.odata.CountMode.InlineRepeat,
			faultTolerant: true,
			operationMode: o,
			doNotLoadNewTasksfterAction: d,
			select: p.join(",")
		};
		if (this.oDataManager.getShowAdditionalAttributes() === true) {
			a.expand = "CustomAttributeData";
		}
		this.getList().bindAggregation("items", {
			path: "/TaskCollection",
			template: this.getView().byId("MAIN_LIST_ITEM"),
			sorter: s,
			filters: f,
			templateShareable: true,
			parameters: a
		});
		this.registerMasterListBind();
	},
	getAllFilters: function(a) {
		var f = [];
		var s = this.oDataManager.getScenarioConfig();
		var A = s.AllItems;
		var m = this.getView().getModel();
		if (A) f = this.getFiltersWithoutScenario(m);
		else f = this.getFiltersWithScenario(m);
		if (a) f.push(a);
		var S = m.aStatusFilterKeys;
		var b = cross.fnd.fiori.inbox.util.TaskStatusFilterProvider.getAllFilters(this.oDataManager.bOutbox, S, f);
		f.push(new sap.ui.model.Filter(b, false));
		return [new sap.ui.model.Filter(f, true)];
	},
	getFiltersWithoutScenario: function(m) {
		var t = this;
		var f = [];
		var T = m.aTaskDefinitionIDFilterKeys || [];
		var s = m.aSubstitutedUserFilterKeys || [];
		var S = m.aStatusFilterKeys;
		if (!T) T = [];
		if (!s) s = [];
		if (!S) S = [];
		var a = [];
		var b = [];
		var c = [];
		var o = [];
		for (var j = 0; j < T.length; j++) {
			var d = new sap.ui.model.Filter({
				path: "TaskDefinitionID",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: T[j]
			});
			a.push(d);
			if (o.indexOf(t.aTaskTypeFilterItemsOrigins[j]) != -1) continue;
			var e = new sap.ui.model.Filter({
				path: "SAP__Origin",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: t.aTaskTypeFilterItemsOrigins[j]
			});
			c.push(e);
			o.push(t.aTaskTypeFilterItemsOrigins[j]);
		}
		b = cross.fnd.fiori.inbox.Substitution._getSubstitutedUserFilters(s);
		if (c.length > 0) f.push(new sap.ui.model.Filter(c, false));
		if (a.length > 0) {
			f.push(new sap.ui.model.Filter(a, false));
		}
		if (b.length > 0) {
			f.push(new sap.ui.model.Filter(b, false));
		}
		return f;
	},
	getFiltersWithScenario: function(m) {
		var f = [];
		var t = m.aTaskDefinitionIDFilterKeys;
		var s = m.aSubstitutedUserFilterKeys;
		var S = m.aStatusFilterKeys;
		var o = this.oDataManager.getScenarioConfig();
		var a = this;
		if (!t) t = [];
		if (!s) s = [];
		if (!S) S = [];
		var b = [];
		var O = [];
		var c = {};
		var I = t.length > 0 ? true : false;
		var T = [];
		var d = [];
		var e = [];
		for (var i = 0; i < o.ScenarioServiceInfos.length; i++) {
			var g = o.ScenarioServiceInfos[i];
			var h = 0;
			var l = false;
			var n = "";
			for (var j = 0; j < g.TaskDefinitionIDs.length; j++) {
				l = false;
				n = "";
				for (var k = 0; k < t.length; k++) {
					if (t[k].toUpperCase().indexOf(g.TaskDefinitionIDs[j].toUpperCase()) == 0) {
						l = true;
						n = t[k];
						if (!this.oDataManager.sClientScenario) {
							if (O.indexOf(a.aTaskTypeFilterItemsOrigins[k]) == -1) {
								c = new sap.ui.model.Filter({
									path: "SAP__Origin",
									operator: sap.ui.model.FilterOperator.EQ,
									value1: a.aTaskTypeFilterItemsOrigins[k]
								});
								b.push(c);
								O.push(a.aTaskTypeFilterItemsOrigins[k]);
							}
						}
						break;
					}
				}
				if (t.length > 0 && !l) continue;
				if (!l) {
					n = g.TaskDefinitionIDs[j];
				}
				if (T.indexOf(n) == -1) {
					h++;
					var p = new sap.ui.model.Filter({
						path: "TaskDefinitionID",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: n
					});
					d.push(p);
				}
			}
			if (!this.oDataManager.sClientScenario) {
				if (!I && O.indexOf(g.Origin) == -1) {
					var c = new sap.ui.model.Filter({
						path: "SAP__Origin",
						operator: sap.ui.model.FilterOperator.EQ,
						value1: g.Origin
					});
					O.push(g.Origin);
					b.push(c);
				}
			}
		}
		e = cross.fnd.fiori.inbox.Substitution._getSubstitutedUserFilters(s);
		if (d.length > 0) {
			f.push(new sap.ui.model.Filter(d, false));
		}
		if (b.length > 0) {
			f.push(new sap.ui.model.Filter(b, false));
		}
		if (e.length > 0) {
			f.push(new sap.ui.model.Filter(e, false));
		}
		return f;
	},
	onForwardPopUp: function() {
		var f = this.getList().getSelectedItems()[0].getBindingContext();
		var o = f.getProperty("SAP__Origin");
		var i = f.getProperty("InstanceID");
		var n = this.getList().getSelectedItems().length;
		if (this.oDataManager.userSearch) {
			cross.fnd.fiori.inbox.util.Forward.open(jQuery.proxy(this.startForwardFilter, this), jQuery.proxy(this.closeForwardPopUp, this), n);
			this.oDataManager.readPotentialOwners(o, i, jQuery.proxy(this._PotentialOwnersSuccess, this));
		} else {
			cross.fnd.fiori.inbox.util.ForwardSimple.open(jQuery.proxy(this.closeForwardPopUp, this), n);
		}
	},
	showResubmitPopUp: function() {
		cross.fnd.fiori.inbox.util.Resubmit.open(this.sResubmitUniqueId, this, this.getView());
	},
	sendMultiSelectResubmitSuccess: function(a, s, e) {
		if (e.length == 0) {
			var i = this.getView().getModel("i18n").getResourceBundle();
			jQuery.sap.delayedCall(500, this, function() {
				sap.ca.ui.message.showMessageToast(i.getText(s.length > 1 ? "dialog.success.multi_resubmit_multiple_tasks" :
					"dialog.success.multi_resubmit_single_task", [s.length]));
			});
			this.sendMultiSelectActionEnd(a);
		} else {
			cross.fnd.fiori.inbox.util.MultiSelect.openMessageDialog(s, e, jQuery.proxy(this.sendMultiSelectActionEnd, this, a, e));
		}
	},
	handleResubmitPopOverOk: function(r) {
		var s = this.getList().getSelectedItems();
		var I = [];
		for (var i = 0; i < s.length; i++) {
			var o = s[i].getBindingContext().getObject();
			I.push(o);
		}
		var t = this.getList().getBinding("items").getLength();
		var a = I.length === t ? true : false;
		var c = sap.ui.core.Fragment.byId(this.sResubmitUniqueId, "DATE_RESUBMIT");
		var S = c.getSelectedDates();
		if (S.length > 0) {
			var d = S[0].getStartDate();
			var f = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "YYYY-MM-ddTHH:mm:ss"
			});
			this.oDataManager.doMassResubmit(I, "datetime'" + f.format(d) + "'", jQuery.proxy(this.sendMultiSelectResubmitSuccess, this, a), null);
			cross.fnd.fiori.inbox.util.Resubmit.close();
		} else {
			this.sendMultiSelectActionEnd();
		}
	},
	_PotentialOwnersSuccess: function(r) {
		cross.fnd.fiori.inbox.util.Forward.setAgents(r.results);
		cross.fnd.fiori.inbox.util.Forward.setOrigin(this.getList().getSelectedItems()[0].getBindingContext().getProperty("SAP__Origin"));
	},
	startForwardFilter: function(l, q) {
		q = q.toLowerCase();
		var f = l.getBindingContext().getProperty("DisplayName").toLowerCase();
		var d = l.getBindingContext().getProperty("Department").toLowerCase();
		return (f.indexOf(q) != -1) || (d.indexOf(q) != -1);
	},
	closeForwardPopUp: function(r) {
		if (r && r.bConfirmed) {
			var s = this.getList().getSelectedItems();
			var I = [];
			for (var i = 0; i < s.length; i++) {
				var o = s[i].getBindingContext().getObject();
				I.push(o);
			}
			var t = this.getList().getBinding("items").getLength();
			var a = I.length === t ? true : false;
			this.oDataManager.doMassForward(I, r.oAgentToBeForwarded, r.sNote, jQuery.proxy(this.sendMultiSelectForwardSuccess, this, a), null);
		} else {
			this.sendMultiSelectActionEnd(a);
		}
	},
	_handleListSwipe: function(e) {
		if (this.isMultiSelectActive()) {
			e.bPreventDefault = true;
			return;
		}
		if (!this.oDataManager.getScenarioConfig().IsQuickActionEnabled) {
			e.bPreventDefault = true;
			$.sap.log.error("Quick Action is not enabled in Scenario Customizing");
		} else {
			var s = e.getParameter("listItem");
			var c = s.getBindingContext();
			var o = c.getProperty("SAP__Origin");
			var I = c.getProperty("InstanceID");
			var d = null;
			if (c.getProperty("Status") === "EXECUTED") {
				var D = {};
				D.selectedListItem = s;
				D.isMandatoryComment = false;
				D.text = this.getView().getModel("i18n").getResourceBundle().getText("XBUT_CONFIRM");
				var S = e.getParameter("swipeContent");
				S.setText(D.text);
				var a = new sap.ui.core.CustomData({
					key: "APPROVE_DECISION",
					value: D
				});
				S.removeAllCustomData();
				S.addCustomData(a);
			} else {
				this.oDataManager.readDecisionOptions(o, I, c.getProperty("TaskDefinitionID"), function(r) {
					d = r;
				}, null, true);
				var A = [];
				if (d) {
					for (var h = 0; h < d.length; h++) {
						var b = {};
						b.decisionKey = d[h].DecisionKey;
						b.buttonText = d[h].DecisionText;
						b.isApprove = d[h].Nature === "POSITIVE" ? true : false;
						b.isReject = d[h].Nature === "NEGATIVE" ? true : false;
						b.isNonNature = d[h].Nature === "" ? true : false;
						b.isMandatoryComment = d[h].CommentMandatory;
						A.push(b);
					}
				}
				for (var i = 0; i < A.length; i++) {
					if (A[i].isApprove) {
						var D = {};
						D.selectedListItem = s;
						D.DecisionKey = A[i].decisionKey;
						D.isMandatoryComment = A[i].isMandatoryComment;
						D.text = A[i].buttonText;
						var S = e.getParameter("swipeContent");
						S.setText(D.text);
						var a = new sap.ui.core.CustomData({
							key: "APPROVE_DECISION",
							value: D
						});
						S.removeAllCustomData();
						S.addCustomData(a);
						return;
					}
				}
				e.bPreventDefault = true;
				$.sap.log.error("No decision option with nature POSITVE found, no swipe possible.");
			}
		}
	},
	_handleSwipeApproved: function(e) {
		var l = this.getList();
		var s = l.getSwipedItem();
		l.swipeOut();
		var d = e.getSource().getCustomData()[0].getValue();
		d.InstanceID = s.getBindingContext().getProperty("InstanceID");
		d.SAP__Origin = s.getBindingContext().getProperty("SAP__Origin");
		if (d.isMandatoryComment) {
			this.showDecisionDialogForQuickAction(this.oDataManager.FUNCTION_IMPORT_DECISION, d, true);
		} else {
			if (s.getBindingContext().getProperty("Status") === "EXECUTED") {
				var f = this.oDataManager.FUNCTION_IMPORT_CONFIRM;
			} else {
				var f = this.oDataManager.FUNCTION_IMPORT_DECISION;
			}
			this.oDataManager.sendAction(f, d, "", jQuery.proxy(function(D) {
				jQuery.sap.delayedCall(500, this, function() {
					sap.ca.ui.message.showMessageToast(this.oApplicationFacade.getResourceBundle().getText("dialog.success.complete"));
				});
			}, this));
		}
	},
	showDecisionDialogForQuickAction: function(f, d, s) {
		var i = this.getView().getModel("i18n").getResourceBundle();
		this.oConfirmationDialogManager.showDecisionDialog({
			question: i.getText("XMSG_DECISION_QUESTION", d.text),
			showNote: s,
			title: i.getText("XTIT_SUBMIT_DECISION"),
			confirmButtonLabel: i.getText("XBUT_SUBMIT"),
			noteMandatory: d.isMandatoryComment,
			confirmActionHandler: jQuery.proxy(function(d, n) {
				this.oDataManager.sendAction(f, d, n);
			}, this, d)
		});
	},
	onUpdateStarted: function(e) {
		var l = e.getSource();
		var n = this.oApplicationFacade.getResourceBundle().getText("XMSG_LOADING");
		l.setNoDataText(n);
		var m = this.getView().getModel();
		var r = e.getParameter("reason");
		if (r == "Refresh" && l.getSelectedItem()) {
			if (m.bFullRefreshNeeded) {
				m.bFullRefreshNeeded = false;
			} else if (!sap.ui.Device.system.phone) {
				this.oDataManager.fireItemRemoved();
			}
		}
		if (r !== "Growing") {
			this._setListBusyIndicator(true);
		}
	},
	onUpdateFinished: function(e) {
		this._setListBusyIndicator(false);
		if (!(this.isMultiSelectActive() && e.getParameter("reason") == "Growing") && (this.isActionPerformed || (this.oDataManager.getCallFromDeepLinkURL() &&
				e.getSource().getItems().length > 0) || e.getParameter("reason") == "Refresh")) {
			this.fnFindAndSelectNextTaskAfterAction(e);
			this.isActionPerformed = false;
		}
		if (this.isMultiSelectActive() && e.getParameter("reason") === "Growing") {
			this.updateMultiSelectState();
		}
		if (e.getParameter('actual') === e.getParameter('total')) {
			this.bTaskCountFromTaskCollectionCall = false;
		}
		var l = e.getSource();
		if (!sap.ui.Device.system.phone && this.isMultiSelectActive() == false && e.getParameter("reason") !== "Growing") {
			if (l.getSelectedItem() && l.getSelectedItem().$().offset() && l.getItems()[0].$().offset()) {
				l.getParent().scrollTo(l.getSelectedItem().$().offset().top - l.getItems()[0].$().offset().top, 0);
			}
		}
		var n = this.oApplicationFacade.getUiLibResourceModel().getText("NO_ITEMS_AVAILABLE");
		l.setNoDataText(n);
		var i = e.getSource().getItems();
		if (i && i[0] && i[0] instanceof sap.m.GroupHeaderListItem && this._oControlStore.oMasterSearchField.getValue() === "") {
			sap.ca.scfld.md.controller.ScfldMasterController.prototype.applySearchPattern.call(this, "");
		}
	},
	onDataLoaded: function() {},
	getDetailNavigationParameters: function(l) {
		var e = this.getView().getModel().getProperty(l.getBindingContext().getPath());
		return {
			SAP__Origin: encodeURIComponent(e.SAP__Origin),
			InstanceID: encodeURIComponent(e.InstanceID),
			contextPath: l.getBindingContext().getPath().substr(1)
		};
	},
	applySearchPattern: function(f) {
		var c = sap.ca.scfld.md.controller.ScfldMasterController.prototype.applySearchPattern.call(this, f);
		var k = (c > 0 || f == "") ? "NO_ITEMS_AVAILABLE" : "NO_MATCHING_ITEMS";
		var n = this.oApplicationFacade.getUiLibResourceModel().getText(k);
		this.getList().setNoDataText(n);
		if (c === 0) {
			this.navToEmptyView();
		} else {
			this.oRouter.navTo("master", null, true);
			this.oRouter.navTo("detail", this.searchListFirstItem, true);
		}
		this.searchListFlag = 0;
		return c;
	},
	_getBindingContextOfFirstItem: function() {
		var l = this.getList().getItems();
		var b = null;
		if (l.length == 1) {
			b = l[0].getBindingContext();
		}
		if (!b) {
			b = l[1].getBindingContext();
		}
		return b;
	},
	setSortItemsToDisplay: function() {
		var c;
		var v;
		this.aVisibleSortItems = [];
		for (var s in this.oSortConfig) {
			c = this.oSortConfig[s];
			v = c.getVisible ? c.getVisible() : true;
			if (v) {
				this.aVisibleSortItems.push({
					key: s,
					text: c.text
				});
			}
		}
	},
	handleFilter: function(f) {
		this.aItemContextPathsToSelect = [];
		this.aTaskTypeFilterItemsOrigins = [];
		var F = this.getFilter(f);
		this.sFilterKey_Support = f;
		var a = this.getAllFilters(F);
		var l = this.getList().getBinding("items");
		l.aApplicationFilters = [];
		this.iTotalFilteredItems = l.filter(a).iLastEndIndex;
		this.isActionPerformed = true;
	},
	onMultiSelectFilterCompleted: function(c, e, p) {
		var l = this.getList();
		l.removeSelections(true);
		this._oControlStore.oMasterSearchField.setValue("");
		var i = this.getView().getModel("i18n").getResourceBundle();
		this.refreshInfoHeaderToolbar(i.getText("multi.header", i.getText("group.taskType") + " (" + p.oFilterItem.title + ")"));
		l.setMode(sap.m.ListMode.MultiSelect);
		this.setProcessingMultiSelect({});
	},
	onMultiSelectFilterFailed: function() {
		this.setProcessingMultiSelect({});
	},
	onTaskCollectionFailed: function() {
		this.removeHeaderFooterOptions();
	},
	onShowReleaseLoader: function(c, e, v) {
		var l = this.getList();
		if (l) {
			l.setEnableBusyIndicator(v.bValue);
		}
		this.getView().setBusyIndicatorDelay(1000);
		this.getView().setBusy(v.bValue);
	},
	onRefreshOnError: function() {
		this.sBindingContextPath = undefined;
		this.oRouter.navTo("master", {}, true);
	},
	handleSort: function(s) {
		this.aItemContextPathsToSelect = [];
		this.sSortKey_Support = s;
		var S = this.configureSorters(s);
		this.getList().getBinding("items").sort(S);
	},
	handleGroup: function() {
		this.aItemContextPathsToSelect = [];
		var s = this.configureSorters(this.sSortKey);
		this.getList().getBinding("items").sort(s);
		this.isActionPerformed = true;
	},
	configureSorters: function(s) {
		var S;
		var a = [];
		var c = null;
		var C = null;
		var r = null;
		var i = this.getView().getModel("i18n").getResourceBundle();
		if (this.oGroupConfigItem) {
			r = this.oGroupConfigItem.key;
			var R = this.bGroupDescending;
			var g = this.oGroupConfigItem.formatter || true;
			switch (this.oGroupConfigItem.key) {
				case this._SORT_PRIORITY:
					r = this._SORT_PRIORITY_NUMBER;
					R = !R;
					break;
				case this._SORT_STATUS:
					C = function(G, o) {
						return this.statusGrouper(G, o, R);
					};
					break;
			}
			S = new sap.ui.model.Sorter(r, R, g);
			a.push(S);
			this.sInfoHeaderGroupString = i.getText("group.header", i.getText(this.oGroupConfigItem.textKey));
		} else {
			this.sInfoHeaderGroupString = null;
		}
		this.refreshInfoHeaderToolbar();
		if (!s) s = this.sDefaultSortKey;
		if (!this.oSortConfig[s]) {
			s = this.sDefaultSortKey;
		}
		var b = s;
		var d = this.oSortConfig[s].descending;
		switch (s) {
			case this._SORT_PRIORITY:
				b = this._SORT_PRIORITY_NUMBER;
				d = !d;
				break;
			case this._SORT_CREATEDONREVERSE:
				b = this._SORT_CREATEDON;
				break;
		}
		if (r != b) {
			S = new sap.ui.model.Sorter(b, d);
			a.push(S);
		}
		var m = this.getView().getModel();
		m.extFnCustomGrouper = C ? $.proxy(C, this) : null;
		m.extFnCustomSorter = c ? $.proxy(c, this) : null;
		m.extSGroupingProperty = r;
		this.sSortKey = s;
		this.sGroupkey_Support = r;
		return a;
	},
	isBackendDefaultSortKeyEqualsTo: function(s) {
		return (this.sBackendDefaultSortKey === s);
	},
	completionDeadLineSorter: function(i, I) {
		if (!i[this._SORT_COMPLETIONDEADLINE]) {
			return 1;
		}
		if (!I[this._SORT_COMPLETIONDEADLINE]) {
			return -1;
		}
		return (i[this._SORT_COMPLETIONDEADLINE] - I[this._SORT_COMPLETIONDEADLINE]);
	},
	statusGrouper: function(g, G, d) {
		var a;
		var b;
		var m = d ? -1 : 1;
		for (var i = 0; i < this._GROUP_STATUS_ORDER.length; i++) {
			var o = this._GROUP_STATUS_ORDER[i];
			if (o.Status == g.GroupingValue) a = i;
			if (o.Status == G.GroupingValue) b = i;
		}
		return (a - b) * m;
	},
	getFilter: function(f) {
		var F = [];
		var p = [];
		var d = null;
		var t = [];
		var T = [];
		var s = [];
		var S = [];
		var a = [];
		var c = null;
		var C = null;
		var r = null;
		for (var k in f) {
			if (f.hasOwnProperty(k) && k) {
				var K = k.split(":");
				switch (K[0]) {
					case this._FILTER_CATEGORY_PRIORITY:
						var b = cross.fnd.fiori.inbox.util.InboxFilterContributor.getFilterForPriorityBykey(K);
						if (b != null) {
							p.push(b);
						}
						break;
					case this._FILTER_CATEGORY_COMPLETION_DEADLINE:
						d = cross.fnd.fiori.inbox.util.InboxFilterContributor.getFilterForDueDateByKey(K);
						break;
					case this._FILTER_CATEGORY_STATUS:
						var e = cross.fnd.fiori.inbox.util.InboxFilterContributor.getFilterForStatusByKey(K);
						if (e != null) {
							S.push(e);
						}
						break;
					case this._FILTER_CATEGORY_CREATION_DATE:
						c = cross.fnd.fiori.inbox.util.InboxFilterContributor.getFilterForCreationDateByKey(K);
						break;
					case this._FILTER_CATEGORY_COMPLETED:
						C = cross.fnd.fiori.inbox.util.OutboxFilterContributor.getCompletedFilterByKey(K);
						break;
					case this._FILTER_CATEGORY_SNOOZED:
						r = cross.fnd.fiori.inbox.util.OutboxFilterContributor.getResumeOnFilterByKey(K);
						break;
					case this._FILTER_CATEGORY_TASK_DEFINITION_ID:
						t.push(new sap.ui.model.Filter(K[0], sap.ui.model.FilterOperator.EQ, K[1]));
						T.push(K[1]);
						this.aTaskTypeFilterItemsOrigins.push(K[2]);
						break;
					case this._FILTER_CATEGORY_SUBSTITUTED_USER:
						s.push(K[1]);
						break;
					default:
						if (K[0] && K[1] && K[0] !== "undefined" && K[1] !== "undefined") {
							a.push(new sap.ui.model.Filter(K[0], sap.ui.model.FilterOperator.EQ, K[1]));
						}
				}
			}
		}
		var o = {
			selectedFilterOptions: f,
			taskDefinitionFilter: T,
			substitutedUserFilter: s,
			statusFilter: S,
			priorityFilter: p,
			dueDateFilter: d,
			creationDateFilter: c,
			completedDateFilter: C,
			resumeDateFilter: r,
			additionalFilters: a
		};
		if (this.extHookGetCustomFilter) {
			this.extHookGetCustomFilter(o);
		}
		this.getView().getModel().aTaskDefinitionIDFilterKeys = o.taskDefinitionFilter;
		this.getView().getModel().aSubstitutedUserFilterKeys = o.substitutedUserFilter;
		this.getView().getModel().aStatusFilterKeys = o.statusFilter;
		if (o.priorityFilter.length > 1) {
			F.push(new sap.ui.model.Filter(o.priorityFilter, false));
		} else if (o.priorityFilter.length === 1) {
			F.push(o.priorityFilter[0]);
		}
		if (o.dueDateFilter) {
			F.push(o.dueDateFilter);
		}
		if (o.creationDateFilter) {
			F.push(o.creationDateFilter);
		}
		if (o.completedDateFilter) {
			F.push(o.completedDateFilter);
		}
		if (o.resumeDateFilter) {
			F.push(o.resumeDateFilter);
		}
		if (o.additionalFilters.length > 1) {
			F.push(new sap.ui.model.Filter(o.additionalFilters, true));
		} else if (o.additionalFilters.length === 1) {
			F.push(o.additionalFilters[0]);
		}
		if (F.length > 1) {
			return new sap.ui.model.Filter(F, true);
		} else if (F.length === 1) {
			return F[0];
		}
		return null;
	},
	handleMetadataFailed: function(e) {
		this.removeHeaderFooterOptions();
		this.oDataManager.handleMetadataFailed(e);
	},
	removeHeaderFooterOptions: function() {
		this.bHideHeaderFooterOptions = true;
		this._oApplicationImplementation.oMHFHelper.defineMasterHeaderFooter(this);
	},
	_setListBusyIndicator: function(v) {
		if (v) {
			this.getList().setBusyIndicatorDelay(1000);
			this.getList().setBusy(true);
		} else {
			this.getList().setBusy(false);
		}
	},
	getNextItemsToSelect: function() {
		return this.aItemContextPathsToSelect;
	}
});