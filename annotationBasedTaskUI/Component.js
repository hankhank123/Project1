/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("cross.fnd.fiori.inbox.annotationBasedTaskUI.util.sapUshellUtil");
sap.ui.define(["sap/ui/core/UIComponent", "sap/ui/core/BusyIndicator", "sap/ui/core/mvc/ViewType", "sap/m/MessageBox",
	"sap/ui/model/odata/v2/ODataModel", "sap/ui/model/odata/CountMode", "sap/ui/model/BindingMode",
	"cross/fnd/fiori/inbox/annotationBasedTaskUI/util/util", "cross/fnd/fiori/inbox/annotationBasedTaskUI/util/GUILinkParser",
	"cross/fnd/fiori/inbox/annotationBasedTaskUI/view/DecisionDialogManager", "cross/fnd/fiori/inbox/annotationBasedTaskUI/util/i18n"
], function(U, B, V, M, O, C, a, T, G, D, i) {
	"use strict";
	return U.extend("cross.fnd.fiori.inbox.annotationBasedTaskUI.Component", {
		metadata: {
			properties: {
				"oParameters": "any",
				"isCacheable": {
					"name": "isCacheable",
					"type": "boolean",
					"defaultValue": false
				}
			},
			publicMethods: ["updateBinding"]
		},
		init: function() {
			this.setIsCacheable(true);
			this.oCachedTemplateView = null;
			this.bCreatingOrUpdatingContent = false;
			this.oPendingUpdateBinding = null;
			U.prototype.init.apply(this, arguments);
		},
		exit: function() {},
		createContent: function() {
			jQuery.sap.log.debug("[AnnotationBasedTaskUI] createContent for " + this.getId() + " started");
			B.show();
			this.bCreatingOrUpdatingContent = true;
			var s = this._parseComponentData(this.getComponentData());
			this.oViewContainer = sap.ui.view(this.createId("appView"), {
				type: V.XML,
				viewName: "cross.fnd.fiori.inbox.annotationBasedTaskUI.view.App"
			});
			this._createModel(s).then(function(m) {
				var b = s.getBindingPath();
				var t = sap.ui.view(this.createId("templateView"), {
					preprocessors: {
						xml: {
							bindingContexts: {
								meta: m.businessMetaModel.getMetaContext(b)
							},
							models: {
								meta: m.businessMetaModel
							}
						}
					},
					type: V.XML,
					viewName: "cross.fnd.fiori.inbox.annotationBasedTaskUI.view.TaskUI_S3",
					viewData: {
						component: this
					}
				});
				t.setModel(m.businessModel);
				t.setModel(s.getTcmModel(), "detail");
				var c = i.getResourceModel();
				t.setModel(c, "annoI18n");
				t.bindElement(b, s.getBindingParameters());
				this.oViewContainer.byId("rootControl").addPage(t);
				this.oCachedTemplateView = t;
				this.sCachedServiceUrl = s.getServiceUrl();
				this.oDecisionDialogManager = new D(t);
				this.oDecisionDialogManager.setModels(m, s.getErrorSuppressionInfo());
				this._updateDecisionDialog(s);
				jQuery.sap.log.debug("[AnnotationBasedTaskUI] createContent for " + this.getId() + " finished");
				this.bCreatingOrUpdatingContent = false;
				if (this.oPendingUpdateBinding) {
					var p = this.oPendingUpdateBinding;
					this.oPendingUpdateBinding = null;
					this.updateBinding(p);
				} else {
					B.hide();
				}
			}.bind(this));
			return this.oViewContainer;
		},
		updateBinding: function(u) {
			if (this.bCreatingOrUpdatingContent) {
				jQuery.sap.log.debug("[AnnotationBasedTaskUI] updateBinding for " + this.getId() +
					" is pending because another createContent/updateBinding is still in progress");
				this.oPendingUpdateBinding = u;
				return;
			}
			jQuery.sap.log.debug("[AnnotationBasedTaskUI] updateBinding for " + this.getId() + " started");
			B.show();
			this.bCreatingOrUpdatingContent = true;
			var c = this.getComponentData();
			T.cleanObject(c);
			jQuery.extend(c, u);
			var s = this._parseComponentData(jQuery.extend({}, c));
			var t = this.oCachedTemplateView;
			t.setModel(s.getTcmModel(), "detail");
			var f = function() {
				t.bindElement(s.getBindingPath(), s.getBindingParameters());
				var r = this.oViewContainer.byId("rootControl");
				r.to(t, "show");
				r.setInitialPage(t);
				var o = t.byId("tabBar");
				var b = o ? o.getItems()[0] : null;
				if (b) {
					o.setSelectedItem(b);
				}
				this._updateDecisionDialog(s);
				jQuery.sap.log.debug("[AnnotationBasedTaskUI] updateBinding for " + this.getId() + " finished");
				this.bCreatingOrUpdatingContent = false;
				if (this.oPendingUpdateBinding) {
					var p = this.oPendingUpdateBinding;
					this.oPendingUpdateBinding = null;
					this.updateBinding(p);
				} else {
					B.hide();
				}
			}.bind(this);
			var n = s.getServiceUrl();
			if (n !== this.sCachedServiceUrl) {
				this._createModel(s).then(function(m) {
					this.sCachedServiceUrl = n;
					t.setModel(m.businessModel);
					this.oDecisionDialogManager.setModels(m, s.getErrorSuppressionInfo());
					f();
				}.bind(this));
			} else {
				f();
			}
		},
		_parseComponentData: function(c) {
			var p = c.startupParameters.oParameters,
				s = p.sServiceUrl,
				A = p.sAnnoFileURI || undefined,
				e = p.sErrorMessageNoData,
				q = p.oQueryParameters,
				t = c.inboxHandle.attachmentHandle.detailModel,
				b = "",
				S = "",
				d = {};
			if (s) {
				b = T.getBindingPath(s);
				S = T.getServiceUrl(s);
			} else {
				if (q && q.entity && q.service) {
					b = q.entity[0];
					S = q.service[0];
					var E = q.expand && q.expand[0];
					if (E) {
						d = {
							expand: E
						};
					}
				} else {
					jQuery.sap.log.error("OData service URL was not specified in GUI Link");
				}
			}
			var f = t.getProperty("/InstanceID");
			b = b.replace("[[taskInstanceId]]", f);
			S = S.replace("[[taskInstanceId]]", f);
			var o = {
				bHandleErrors: true
			};
			var g = function(k) {
				if (o.bHandleErrors) {
					B.hide();
					M.error(k);
				}
			};
			var h = t.getProperty("/GUI_Link");
			if (!h) {
				h = t.getProperty("/UIExecutionLink/GUI_Link");
			}
			var j = new G(h);
			return {
				getBindingPath: function() {
					return b;
				},
				getBindingParameters: function() {
					return d;
				},
				getServiceUrl: function() {
					return S;
				},
				getAnnotationUrl: function() {
					return A;
				},
				getTcmModel: function() {
					return t;
				},
				getODataErrorHandler: function() {
					return g.bind(undefined, e);
				},
				getErrorSuppressionInfo: function() {
					return o;
				},
				getGUILinkParser: function() {
					return j;
				},
				getInboxHandle: function() {
					return c.inboxHandle;
				}
			};
		},
		_createModel: function(s) {
			var l = sap.ui.getCore().getConfiguration().getLanguageTag();
			var A = T.appendUrlParameter(s.getAnnotationUrl(), "sap-language", l);
			var m = new O(s.getServiceUrl(), {
				annotationURI: A,
				json: true,
				defaultCountMode: C.Inline,
				useBatch: true,
				loadAnnotationsJoined: true,
				metadataUrlParams: {
					"sap-language": l
				}
			});
			m.setDefaultBindingMode(a.TwoWay);
			var e = s.getODataErrorHandler();
			m.attachMetadataFailed(e);
			m.attachBatchRequestFailed(e);
			m.attachAnnotationsFailed(e);
			var o = m.getMetaModel();
			return new Promise(function(r) {
				o.loaded().then(function() {
					r({
						businessModel: m,
						businessMetaModel: o
					});
				});
			});
		},
		_updateDecisionDialog: function(s) {
			var b = s.getInboxHandle().inboxDetailView;
			var t = s.getTcmModel();
			var g = s.getGUILinkParser();
			var c = t.getProperty("/InstanceID");
			this.oDecisionDialogManager.setTaskInstanceId(c);
			this.oDecisionDialogManager.setSubmissionCallback(this._refreshTaskList.bind(this, s));
			var e = s.getBindingPath().match(/\(([^)]+)\)/)[1];
			var o = this.oDecisionDialogManager.modifyFooterButtons(b.oHeaderFooterOptions, g, e);
			b.oHeaderFooterOptions = o;
			b.setHeaderFooterOptions(o);
			b.refreshHeaderFooterOptions();
		},
		_refreshTaskList: function(s) {
			var t = s.getTcmModel();
			var d = s.getInboxHandle().inboxDetailView.oDataManager;
			var S = t.getProperty("/SAP__Origin");
			var b = t.getProperty("/InstanceID");
			d.fnUpdateSingleTask(S, b);
		}
	});
}, true);