/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("cross.fnd.fiori.inbox.annotationBasedTaskUI.util.navigationUtil");
cross.fnd.fiori.inbox.annotationBasedTaskUI.util.navigationUtil = {
	navigateForward: function(e, c) {
		var v = c.getView();
		var a = v.getParent();
		var p = e.getParameter("listItem");
		var b = p.getBindingContext().getPath();
		var d = b.match(/\w*\b/)[0];
		var f = a.getPage(d);
		if (!f) {
			f = this.createNewDetailView(d, b, c);
			f.setModel(c.getView().getModel());
			a.addPage(f);
		}
		var t = e.getSource();
		var g = f.getModel("detailModel");
		var h = t.getHeaderToolbar().getContent()[0].getText();
		g.setProperty("/collectionName", h.substring(0, h.lastIndexOf("(")).trim());
		g.setProperty("/itemIndex", t.indexOfItem(p));
		g.setProperty("/collection", t.getItems());
		g.setProperty("/isReady", true);
		a.to(d);
	},
	createNewDetailView: function(v, b, c) {
		var a = c.getView();
		var m = a.getModel().getMetaModel();
		return sap.ui.view(v, {
			preprocessors: {
				xml: {
					bindingContexts: {
						meta: m.getMetaContext(b)
					},
					models: {
						meta: m
					}
				}
			},
			type: sap.ui.core.mvc.ViewType.XML,
			viewName: "cross.fnd.fiori.inbox.annotationBasedTaskUI.view.Detail",
			viewData: a.oViewData
		});
	}
};