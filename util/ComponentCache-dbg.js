/*
 * Copyright (C) 2009-2018 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/Device",
	"sap/ui/core/UIComponent"
], function(Object, Device, UIComponent) {
	"use strict";
	return Object.extend("cross.fnd.fiori.inbox.ComponentCache", {
		constructor: function(iCacheSize){
			Object.prototype.constructor.call(this);
			var _iCompCacheMaxSize= 0;
			var _oCompCache = {};
			var _iCachedCompCount = 0;
			var iCacheSz;
			if(jQuery.isNumeric(iCacheSize)){
				iCacheSz = parseInt(iCacheSize, 10);
				iCacheSz = iCacheSz >= 0 ? iCacheSz : undefined;
			}else {
				iCacheSz = undefined;
			}
			if(Device.system.desktop){
				_iCompCacheMaxSize = (iCacheSz) ? iCacheSz : 20;
			}else{
				_iCompCacheMaxSize = (iCacheSz) ? iCacheSz : 3;
			}
			
			this.destroyCacheContent = function(){
				var sKey;
				for (sKey in _oCompCache) {
				 _oCompCache[sKey].destroy();
				}
				_oCompCache = {};
			};
			
			
			this.getComponentByKey = function(sKey){
				return _oCompCache[sKey];
			};
			
			
			this.getComponentById = function(sId){
				var sKey;
				for (sKey in _oCompCache) {
				 if(_oCompCache[sKey].getId() === sId){
				 	return _oCompCache[sKey];
				 }
				}
			};
			
			this.cacheComponent = function(key, oComp){
				if(oComp instanceof UIComponent){
					if(_iCachedCompCount < _iCompCacheMaxSize){
						if(!_oCompCache.hasOwnProperty(key)){
							_iCachedCompCount++;
						}
						_oCompCache[key]=oComp;	
					}else {
						throw "Max cache size exceeded for device.";
					}
				}else {
					throw "Cannot cache object: Type mismatch.";
				}
				
			};
		}
	});
});