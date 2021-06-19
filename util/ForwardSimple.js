/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("cross.fnd.fiori.inbox.util.ForwardSimple");cross.fnd.fiori.inbox.util.ForwardSimple=(function(){var _=null;return{open:function(c,n){if(!_){_=new sap.ui.view({id:"MIB_VIEW_FORWARD_SIMPLE",viewName:"cross.fnd.fiori.inbox.view.ForwardSimple",type:sap.ui.core.mvc.ViewType.XML});}var m=new sap.ui.model.json.JSONModel({closeDlg:c,numberOfItems:n});var d=_.byId("DLG_FORWARD_SIMPLE");d.setModel(m);d.open();}};}());
