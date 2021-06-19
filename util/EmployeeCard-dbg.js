/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("cross.fnd.fiori.inbox.util.EmployeeCard");
jQuery.sap.require("cross.fnd.fiori.inbox.util.QuickView");
jQuery.sap.require("cross.fnd.fiori.inbox.util.Conversions");

cross.fnd.fiori.inbox.util.EmployeeCard = {
		displayEmployeeCard: function(oControl, oResult){
			var oi18Bundle = sap.ca.scfld.md.app.Application.getImpl().getComponent().oDataManager.oi18nResourceBundle;
			var oPageSettings = {
					pages:{
						header: oi18Bundle.getText("bc.title.employee"),
						icon: cross.fnd.fiori.inbox.Conversions.formatterUserCardIcon(oResult.__metadata.media_src),
						title: oResult.DisplayName,
						description: oResult.Department,
						groups: [
							{	heading:  oi18Bundle.getText("bc.title.employee.contactDetails"),
								elements:[
									{
										label: oi18Bundle.getText("bc.label.employee.contactDetails.mobile"),
										value: oResult.MobilePhone,
										type: sap.m.QuickViewGroupElementType.mobile
									},
									{
										label: oi18Bundle.getText("bc.label.employee.contactDetails.phone"),
										value: oResult.WorkPhone,
										type: sap.m.QuickViewGroupElementType.phone
									},
									{
										label: oi18Bundle.getText("bc.label.employee.contactDetails.email"),
										value: oResult.Email,
										type: sap.m.QuickViewGroupElementType.email
									}
								          
								]
							},
							{	heading: oi18Bundle.getText("bc.title.employee.company"),
								elements:[
									{
										label: oi18Bundle.getText("bc.label.employee.company.name"),
										value: oResult.Company
									},
									{
										label: oi18Bundle.getText("bc.label.employee.company.address"),
										value: cross.fnd.fiori.inbox.Conversions.getEmployeeAddress(oResult.Address)
									}
								]
							}
						]
					}
			};

//			var oEmployeeBusinessCard = new sap.m.QuickView(oPageSettings);
			var oEmployeeBusinessCard = new cross.fnd.fiori.inbox.util.QuickView(oPageSettings);
			oEmployeeBusinessCard.setContact(oResult);
			oEmployeeBusinessCard.setPlacement("Auto");
			
			oEmployeeBusinessCard.attachAfterClose(function(oEvent){
				//destroy the control everytime it closes
				this.destroy();
			});
			
			//Fix to align display of employee card next to username link instead of timeline item - not handled in  SAPUI5 versions lower than 1.45.0-snapshot
			if (oControl.$("username").length > 0) {
				oEmployeeBusinessCard.openBy(oControl.$("username"));
			} else {
				oEmployeeBusinessCard.openBy(oControl);
			}
		
		}
};