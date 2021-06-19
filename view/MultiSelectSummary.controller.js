/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("sap.ca.scfld.md.controller.BaseDetailController");
sap.ca.scfld.md.controller.BaseDetailController.extend("cross.fnd.fiori.inbox.view.MultiSelectSummary", {
	_CUSTOM_ATTRIBUTE_NUMBER: "CustomNumber",
	_CUSTOM_ATTRIBUTE_NUMBER_UNIT: "CustomNumberUnit",
	_CUSTOM_ATTRIBUTE_OBJECT: "CustomObjectAttribute",
	onInit: function() {
		sap.ca.scfld.md.controller.BaseDetailController.prototype.onInit.call(this);
		sap.ca.scfld.md.app.Application.getImpl().getComponent().getEventBus().subscribe("cross.fnd.fiori.inbox", "multiselect", this.onMultiSelectEvent,
			this);
		this.oRouter.attachRouteMatched(this.handleNavToDetail, this);
		this.bInited = false;
	},
	onMultiSelectEvent: function(c, e, m) {
		if (m.Source === "S2" || m.Source === "action") {
			if (m.reInitialize) {
				this.aWorkItems = m.WorkItems;
			}
			if (m.Selected || m.WorkItems.length > 0) {
				for (var i = 0; i < m.WorkItems.length; i++) {
					var w = this.lookUpWorkItem(m.WorkItems[i]);
					w.Selected = m.Selected;
					this.updateTableHeader(w);
				}
			} else {
				for (var i = 0; i < this.aWorkItems.length; i++) {
					this.aWorkItems[i].Selected = false;
				}
			}
			this.refreshModel();
		}
	},
	lookUpWorkItem: function(w) {
		for (var i = 0; i < this.aWorkItems.length; i++) {
			if (this.aWorkItems[i].SAP__Origin == w.SAP__Origin && this.aWorkItems[i].InstanceID == w.InstanceID) return this.aWorkItems[i];
		}
		var W = Object.create(w);
		if (W.CustomAttributeData && W.CustomAttributeData.__list) {
			W.CustomAttributeData = W.CustomAttributeData.__list;
		}
		this.aWorkItems.push(W);
		return W;
	},
	refreshModel: function() {
		var m = new sap.ui.model.json.JSONModel(this.aWorkItems);
		this.getView().byId("idMultiSelectTable").setModel(m, "multiSelectSummaryModel");
	},
	handleNavToDetail: function(e) {
		if (e.getParameter("name") === "multi_select_summary") {
			this.aWorkItems = [];
			this.refreshModel();
			this.initTableHeader();
			if (!this.bInited) {
				this.bInited = true;
				var v = this.getView();
				v.byId("idMultiSelectTable").bindItems("multiSelectSummaryModel>/", v.byId("LIST_ITEM"));
			}
		}
	},
	onItemSelect: function(e) {
		var m = {};
		m.Source = "MultiSelectSummary";
		m.Selected = e.getParameter("selected");
		m.WorkItems = [e.getSource().getBindingContext("multiSelectSummaryModel").getProperty()];
		sap.ca.scfld.md.app.Application.getImpl().getComponent().getEventBus().publish("cross.fnd.fiori.inbox", "multiselect", m);
	},
	updateTableHeader: function(w) {
		var t = this.oView.byId("idMultiSelectTable");
		if (w.CustomNumberValue && !this.oCustomAttributes.Number) {
			if (!this.oCustomerNumberCol) {
				this.oCustomerNumberCol = new sap.m.Column({
					header: new sap.m.Label({
						text: w.CustomNumberLabel
					})
				});
			} else if (this.oCustomerNumberCol.getHeader().getText() !== w.CustomNumberLabel) {
				this.oCustomerNumberCol.getHeader().setText(w.CustomNumberLabel);
			}
			t.addColumn(this.oCustomerNumberCol);
			this.oCustomAttributes.Number = true;
		}
		if (w.CustomNumberUnitValue && !this.oCustomAttributes.NumberUnit) {
			if (!this.oCustomerNumberUnitCol) {
				this.oCustomerNumberUnitCol = new sap.m.Column({
					header: new sap.m.Label({
						text: w.CustomNumberUnitLabel
					})
				});
			} else if (this.oCustomerNumberUnitCol.getHeader().getText() !== w.CustomNumberUnitLabel) {
				this.oCustomerNumberUnitCol.getHeader().setText(w.CustomNumberUnitLabel);
			}
			t.addColumn(this.oCustomerNumberUnitCol);
			this.oCustomAttributes.NumberUnit = true;
		}
		if (w.CustomObjectAttributeValue && !this.oCustomAttributes.Object) {
			if (!this.oCustomObjectAttributeCol) {
				this.oCustomObjectAttributeCol = new sap.m.Column({
					header: new sap.m.Label({
						text: w.CustomObjectAttributeLabel
					})
				});
			} else if (this.oCustomObjectAttributeCol.getHeader().getText() !== w.CustomObjectAttributeLabel) {
				this.oCustomObjectAttributeCol.getHeader().setText(w.CustomObjectAttributeLabel);
			}
			t.addColumn(this.oCustomObjectAttributeCol);
			this.oCustomAttributes.Object = true;
		}
	},
	initTableHeader: function() {
		if (this.oCustomAttributes) {
			if (this.oCustomAttributes.Number || this.oCustomAttributes.Unit || this.oCustomAttributes.Object) {
				var t = this.oView.byId("idMultiSelectTable");
				var c = t.getColumns();
				for (var i = 0; i < c.length; i++) {
					if (c[i] === this.oCustomerNumberCol || c[i] === this.oCustomerNumberUnitCol || c[i] === this.oCustomObjectAttributeCol) {
						t.removeColumn(c[i]);
					}
				}
			}
		}
		this.oCustomAttributes = {};
	}
});