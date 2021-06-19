/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["cross/fnd/fiori/inbox/annotationBasedTaskUI/util/i18n", "cross/fnd/fiori/inbox/annotationBasedTaskUI/util/util",
	"cross/fnd/fiori/inbox/annotationBasedTaskUI/util/GUILinkParser", "sap/m/Button", "sap/m/ButtonType", "sap/m/Dialog", "sap/m/DialogType",
	"sap/m/MessageBox", "sap/m/MessageToast"
], function(I, U, G, B, a, D, b, M, c) {
	"use strict";
	var d = function(p) {
		this.oParentView = p;
		this.bWaitingForCallFunctionResponse = false;
	};
	d.prototype.setModels = function(m, e) {
		this.oCachedModels = m;
		this.oErrorSuppressionInfo = e;
	};
	d.prototype.setSubmissionCallback = function(C) {
		this.fnSubmissionCallback = C;
	};
	d.prototype.setTaskInstanceId = function(t) {
		this.sTaskInstanceId = t;
	};
	d.prototype.modifyFooterButtons = function(h, g, e) {
		var m = this.oCachedModels;
		var A = function(f) {
			var i = {
				onBtnPressed: this.createDecisionDialog.bind(this, f),
				sBtnTxt: f.Label
			};
			if (f.Nature === "POSITIVE") {
				if (h.oPositiveAction) {
					jQuery.sap.log.error("[Decision Dialog] There were multiple positive actions. New button '" + f.Label +
						"' displaced existing button '" + h.oPositiveAction.sBtnTxt + "'");
					h.buttonList.unshift(h.oPositiveAction);
				}
				h.oPositiveAction = i;
			} else if (f.Nature === "NEGATIVE") {
				if (h.oNegativeAction) {
					jQuery.sap.log.error("[Decision Dialog] There were multiple negative actions. New button '" + f.Label +
						"' displaced existing button '" + h.oNegativeAction.sBtnTxt + "'");
					h.buttonList.unshift(h.oNegativeAction);
				}
				h.oNegativeAction = i;
			} else {
				h.buttonList.unshift(i);
			}
		}.bind(this);
		var o = g.getDecisionActions();
		this.collectButtonDataFromAnnotations(o).reverse().forEach(function(f) {
			f.BindingPath = U.standardizeEntityKey(m.businessModel, f.EntitySet, e);
			A(f);
		});
		return h;
	};
	d.prototype.collectButtonDataFromAnnotations = function(A) {
		var m = this.oCachedModels;
		var e = [];
		A.forEach(function(o) {
			var f = m.businessMetaModel.getODataEntityType(o.entityName);
			var s = "com.sap.vocabularies.UI.v1.FieldGroup" + o.qualifier;
			if (!f) {
				jQuery.sap.log.error("[Decision Dialog] The entity type '" + o.entityName +
					"' from the GUI_Link decision actions could not be resolved");
			} else if (f.hasOwnProperty(s)) {
				var g = f[s];
				g.forEach(function(h) {
					if (h.RecordType !== "com.sap.vocabularies.UI.v1.DataFieldForAction") {
						return;
					}
					var l = (h.Label && h.Label.String) || "[MISSING LABEL]";
					var i = (h.Action && h.Action.String) || "[MISSING ACTION]";
					if (l === "[MISSING LABEL]") {
						jQuery.sap.log.error("[Decision Dialog] Missing property 'Label' in SubmitActions for entity '" + f.name + "'");
					}
					if (i === "[MISSING ACTION]") {
						jQuery.sap.log.error("[Decision Dialog] Missing property 'Action' in SubmitActions for entity '" + f.name + "'");
					}
					e.push({
						Entity: f.namespace + "." + f.name,
						Label: l,
						Action: i,
						Nature: (h.Nature && h.Nature.String) || "",
						DialogFieldsAnnotation: g
					});
				});
			} else {
				jQuery.sap.log.error("[Decision Dialog] Entity '" + o.entityName + "' is not annotated with a UI.FieldGroup that has qualifier '" +
					o.qualifier + "'");
			}
		});
		var E = m.businessMetaModel.getODataEntityContainer();
		if (E.entitySet) {
			E.entitySet.forEach(function(o) {
				e.forEach(function(f) {
					if (o.entityType === f.Entity) {
						f.EntitySet = o.name;
					}
				});
			});
		}
		e.forEach(function(o) {
			if (!o.EntitySet) {
				jQuery.sap.log.error("[Decision Dialog] EntitySet for entity '" + o.Entity + "' could not be found");
			}
			if (jQuery.sap.startsWith(o.Action, "/")) {
				jQuery.sap.log.error("[Decision Dialog] FunctionImport name '" + o.Action + "' annotated on DataFieldForAction on entity '" + o.Entity +
					"' should not start with a leading slash");
			}
			var f = m.businessMetaModel.getODataFunctionImport(o.Action);
			if (f) {
				o.FunctionImportParameters = f.parameter || [];
				o.Action = f.name;
			} else {
				jQuery.sap.log.error("[Decision Dialog] FunctionImport '" + o.Action + "' annotated on DataFieldForAction on entity '" + o.Entity +
					"' could not be resolved");
			}
		});
		return e;
	};
	d.prototype.createDecisionDialog = function(o) {
		var A = new sap.ui.model.json.JSONModel({
			dialogFields: o.DialogFieldsAnnotation
		});
		var e = sap.ui.view("DecisionDialogView", {
			viewName: "cross.fnd.fiori.inbox.annotationBasedTaskUI.view.DecisionDialog",
			type: sap.ui.core.mvc.ViewType.XML,
			preprocessors: {
				xml: {
					models: {
						meta: A
					}
				}
			}
		});
		this.oParentView.addDependent(e);
		var m = this.oCachedModels;
		e.setModel(m.businessModel);
		e.bindElement(o.BindingPath);
		if (m.businessModel.hasPendingChanges()) {
			m.businessModel.resetChanges();
		}
		var f = e.byId("DecisionDialog");
		var g = e.byId("SubmitBtn");
		var h = e.byId("CancelBtn");
		f.setTitle(o.Label);
		f.attachAfterClose(this.destroyDecisionDialog.bind(this));
		g.setText(o.Label);
		h.setText(I.getText("DECISION_DIALOG.CANCEL"));
		g.attachPress(this.onSubmitDecisionDialog.bind(this, o));
		h.attachPress(this.onCancelDecisionDialog.bind(this));
		f.setInitialFocus(h);
		this.oDialog = f;
		this.oDialogView = e;
		this.oDialog.open();
	};
	d.prototype.onSubmitDecisionDialog = function(o) {
		if (this.bWaitingForCallFunctionResponse) {
			jQuery.sap.log.debug("[Decision Dialog] Prevented submit, because a function import call is already in progress");
			return;
		}
		var e = this.oDialogView.byId("DecisionForm").check();
		if (e.length > 0) {
			var f = this.oDialogView.byId(e[0]);
			this.showErrorMessage(I.getText("DECISION_DIALOG.ERROR.FORM"), true, f);
			jQuery.sap.log.debug("[Decision Dialog] Tried to submit action '" + o.Label + "' but the SmartForm contained errors");
			return;
		}
		var m = this.oCachedModels;
		var p = m.businessModel.getObject(o.BindingPath);
		if (p === undefined) {
			jQuery.sap.log.fatal("[Decision Dialog] Unable to retrieve the values entered by the user.");
		}
		var A = {};
		o.FunctionImportParameters.forEach(function(P) {
			if (P.name === "TaskInstanceID") {
				A.TaskInstanceID = this.sTaskInstanceId;
			} else if (p[P.name] === undefined) {
				jQuery.sap.log.error("[Decision Dialog] Parameter '" + P.name + "' for FunctionImport '" + o.Action +
					"' is missing from the data contained in the decision dialog");
			} else {
				A[P.name] = p[P.name];
			}
		}.bind(this));
		var C = function(r, R) {
			this.oDialog.setBusy(false);
			this.oDialog.close();
			this.bWaitingForCallFunctionResponse = false;
			c.show((typeof r === "string" && r) || I.getText("DECISION_DIALOG.SUCCESS.GENERIC", [o.Label]));
			if (this.fnSubmissionCallback) {
				this.fnSubmissionCallback();
			}
		}.bind(this);
		var g = function(E) {
			jQuery.sap.log.debug("[Decision Dialog] Function import '" + o.Action + "' failed with status code " + E.statusCode);
			var s;
			var h = "SERVER_ERROR";
			if (E.responseText && typeof E.responseText === "string") {
				try {
					var r = JSON.parse(E.responseText);
					if (r.error.code === "INVALID_DATA" || r.error.code === "SERVER_ERROR") {
						h = r.error.code;
					}
					if (r.error.message.value && typeof r.error.message.value === "string") {
						s = r.error.message.value;
						jQuery.sap.log.debug("[Decision Dialog] Function import '" + o.Action + "' returned error message: " + s);
					}
				} catch (i) {
					jQuery.sap.log.error("[Decision Dialog] Error returned by function import '" + o.Action + "' could not be parsed");
					s = null;
				}
			}
			s = s || I.getText("DECISION_DIALOG.ERROR." + h);
			this.oDialog.setBusy(false);
			this.bWaitingForCallFunctionResponse = false;
			this.showErrorMessage(s, h === "INVALID_DATA");
		}.bind(this);
		this.oDialog.setBusyIndicatorDelay(100);
		this.oDialog.setBusy(true);
		this.bWaitingForCallFunctionResponse = true;
		m.businessModel.callFunction("/" + o.Action, {
			method: "POST",
			urlParameters: A,
			success: C,
			error: g
		});
	};
	d.prototype.onCancelDecisionDialog = function() {
		this.oDialog.close();
	};
	d.prototype.destroyDecisionDialog = function() {
		this.oDialogView.destroy();
	};
	d.prototype.showErrorMessage = function(e, i, f) {
		this.oDialog.setVisible(false);
		this.oErrorSuppressionInfo.bHandleErrors = false;
		var r;
		var C = M.Action.CANCEL;
		if (i) {
			r = I.getText("DECISION_DIALOG.ERROR.VALIDATION.BUTTON");
		} else {
			r = I.getText("DECISION_DIALOG.ERROR.TECHNICAL.BUTTON");
		}
		M.show(e, {
			icon: M.Icon.ERROR,
			title: I.getText("DECISION_DIALOG.ERROR.TITLE"),
			actions: [r, C],
			initialFocus: r,
			onClose: function(A) {
				this.oErrorSuppressionInfo.bHandleErrors = true;
				if (A === C) {
					this.oDialog.close();
				} else if (A === r) {
					if (f) {
						this.oDialog.setInitialFocus(f);
					} else {
						this.oDialog.setInitialFocus(this.oDialogView.byId("CancelBtn"));
					}
					this.oDialog.setVisible(true);
				} else {
					this.oDialog.close();
				}
			}.bind(this)
		});
	};
	return d;
}, true);