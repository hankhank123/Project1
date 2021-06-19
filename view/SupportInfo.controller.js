/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.require("cross.fnd.fiori.inbox.util.SupportInfo");sap.ui.controller("cross.fnd.fiori.inbox.view.SupportInfo",{_SUPPORT_INFO_DIALOG_ID:"DLG_SUPPORTINFO",onInit:function(){this.getView().setModel(sap.ca.scfld.md.app.Application.getImpl().AppI18nModel,"i18n");},onCancelDialog:function(){var s=this.getView().byId(this._SUPPORT_INFO_DIALOG_ID);s.close();}});
