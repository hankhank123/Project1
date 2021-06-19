/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
jQuery.sap.declare("cross.fnd.fiori.inbox.util.Parser");

cross.fnd.fiori.inbox.util.Parser = {

	fnParseComponentParameters: function(sRawString) {
		
		var oComponentParameters = {};
		
		// process only if the sapui5 scheme is sent
		if(this.isGUILink_sapUi5_scheme(sRawString)){
			oComponentParameters = this.getComponentParameters(sRawString);
		}

		return oComponentParameters;
	},
	
	getComponentParameters : function(sString){
		var sAnnotationURL = "";
		var sServiceURL = "";
		var sDynamicComponentDetails = "";
		var oComponentParameters = {};
		
		//get the data and the annotation details
		var oURIParameters = this.getURIParametersForComponent(sString);
		if(oURIParameters){
			//Params are now decoded, but here they will be part of URL, so need to be encoded
			sServiceURL = encodeURI((oURIParameters.data && oURIParameters.data[0]) ? oURIParameters.data[0] : sServiceURL);
			sAnnotationURL = encodeURI((oURIParameters.annotations && oURIParameters.annotations[0]) ? oURIParameters.annotations[0] : sAnnotationURL);
		}
		
		//get the applicationPath and the component name
		sDynamicComponentDetails = this.stripURLParams(sString, oURIParameters);
		sDynamicComponentDetails = this.stripScheme(sDynamicComponentDetails, "sapui5://");
			
		var sApplicationPath = sDynamicComponentDetails.substring(0, sDynamicComponentDetails.lastIndexOf("/"));
		var sComponentName = sDynamicComponentDetails.substring(sDynamicComponentDetails.lastIndexOf("/") + 1);
		
		//create the Component parameter object with all the details required for Dynamic Component rendering.	
		return oComponentParameters = {
			ComponentName: sComponentName,
			ApplicationPath: sApplicationPath,
			ServiceURL: sServiceURL,
			AnnotationURL: sAnnotationURL,
			QueryParameters:oURIParameters 
		};	
		
	},
	
	stripScheme : function(sString, scheme){
		//Assumption is that the scheme is always in the beginning of the GUI_Link
		return sString.split(scheme)[1];
	},
	
	stripURLParams : function(sString, oURIParameters){
		if(!jQuery.isEmptyObject(oURIParameters)){
			return sString.substring(0, sString.indexOf("?"));
		}
		return sString;
	},
	
	isGUILink_sapUi5_scheme: function(sString){
		return sString && sString.indexOf("sapui5://") === 0;
	},

	getURIParametersForComponent: function(sUri) {
		var mParams = {};
		var sQueryString = sUri;
		if (sQueryString.indexOf('#') >= 0) {
			sQueryString = sQueryString.slice(0, sQueryString.indexOf('#'));
		}
		if (sQueryString.indexOf("?") >= 0) {
			sQueryString = sQueryString.slice(sQueryString.indexOf("?") + 1);
			var aParameters = sQueryString.split("&"),
				aParameter,
				sName,
				sValue;
			for (var i = 0; i < aParameters.length; i++) {
				var index = aParameters[i].indexOf("=");
				if (index == -1) {
					//console.log("Invalid Parameter :" + aParameters[i]);
					continue;
				}
				aParameter = [aParameters[i].slice(0, index), aParameters[i].slice(index + 1)];
				sName = decodeURIComponent(aParameter[0]);
				sValue = aParameter.length > 1 ? decodeURIComponent(aParameter[1].replace(/\+/g, ' ')) : "";
				if (sName) {
					if (!Object.prototype.hasOwnProperty.call(mParams, sName)) {
						mParams[sName] = [];
					}
					mParams[sName].push(sValue);
				}
			}
		}

		return mParams;
	}
};