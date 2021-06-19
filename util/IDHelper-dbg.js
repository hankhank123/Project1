/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("cross.fnd.fiori.inbox.util.IDHelper");

/*
	This is an helper to get the IDs generated. 
	
	generateID function -
	If a suffix is provided, 
	.suffix is appended to the namespace. If there is no suffix, then 
	namespace will not get appended with anything just namespace is sent as ID.
	
	getNamespace function -
	It creates a namespace for the string provided as variable(-sNamespace)
*/

cross.fnd.fiori.inbox.util.IDHelper = (function() {

	var _sNamespace = "cross.fnd.fiori.inbox";
	
	return {
		generateID: function(sSuffix) {
			var id;
			if (sSuffix && typeof sSuffix === "string") {
				id = _sNamespace.concat(".").concat(sSuffix);
			} else {
				id = _sNamespace;
			}
		return	id;			
		},
		getNamespace: function() {
			return jQuery.sap.getObject(_sNamespace,0);
		}
	};
}());