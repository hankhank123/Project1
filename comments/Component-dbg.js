/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("jquery.sap.global");
jQuery.sap.require("sap/ui/core/UIComponent");
jQuery.sap.require("sap/ui/core/mvc/View");
jQuery.sap.require("cross.fnd.fiori.inbox.comments.util.Formatters");
jQuery.sap.declare("cross.fnd.fiori.inbox.comments.Component");

sap.ui.core.UIComponent.extend("cross.fnd.fiori.inbox.comments.Component", {

	metadata : {
		properties : {
			mainView : {name:"mainView", type:"sap.ui.view"}, // contains the comments view reference
		},
		publicMethods: ["fnShowLoaderForComments", "fnSetFeedInputIcon", "fnGetFeedInputIcon","fnIsFeedInputPresent", "setNoDataText"],
		rootView: "cross.fnd.fiori.inbox.comments.view.Comments",
	},
	
	init : function() {
		sap.ui.core.UIComponent.prototype.init.apply(this, arguments);
	},
	
	exit : function() {
	},
	
	 fnShowLoaderForComments: function(bShow){
		var oView = this.getAggregation("rootControl");
		oView.byId("MIBCommentList").setBusyIndicatorDelay(1000);
		oView.byId("MIBCommentList").setBusy(bShow);
	 },
	 
	 fnSetFeedInputIcon: function(url){
		 var oFeedInput = this.getAggregation("rootControl").byId("commentsFeedInput");
		 oFeedInput.setIcon(url);
	 },
	 
	 fnGetFeedInputIcon: function(){
		 var oFeedInput = this.getAggregation("rootControl").byId("commentsFeedInput");
		 return oFeedInput.getIcon();
	 },
	 
	 fnIsFeedInputPresent: function(){
		 var oFeedInput = this.getAggregation("rootControl").byId("commentsFeedInput");
		 if(oFeedInput){
			 return true;
		 }
		 else{
			 return false;
		 }
	 },
	 
	 setNoDataText: function(sText){
		 var oCommentsTab = this.getAggregation("rootControl").byId("MIBCommentList");
		 oCommentsTab.setNoDataText(sText);
	 },

	createContent : function() {
		var oViewData = {component: this};
		return sap.ui.view({
			type : sap.ui.core.mvc.ViewType.XML,
			viewName : "cross.fnd.fiori.inbox.comments.view.Comments",
			viewData : oViewData
		}) ;
	}
});