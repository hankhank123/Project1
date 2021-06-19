/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("sap.ui.core.mvc.Controller");
sap.ui.core.mvc.Controller.extend("cross.fnd.fiori.inbox.comments.view.Comments", {
	onInit: function() {
		var c = this.getOwnerComponent().getComponentData();
		this.oModel = c.oModel;
		this.bModelPresent = false;
		if (this.oModel || (c.oContainer && c.oContainer.getPropagateModel())) {
			this.bModelPresent = true;
			if (this.oModel) {
				this.getView().setModel(this.oModel, "detail");
			}
		}
		if (!this.bModelPresent) {
			jQuery.sap.log.error("Data Model not defined for Comments");
		}
	},
	publishEventForCommentsAdded: function(e) {
		if (this.bModelPresent) this.getOwnerComponent().getEventBus().publish(null, "commentAdded", e);
	},
	publishEventForBusinessCard: function(e) {
		this.getOwnerComponent().getEventBus().publish(null, "businessCardRequested", e);
	}
});