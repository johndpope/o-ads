/**
 * @fileOverview
 * Third party library for use with google publisher tags.
 *
 * @author Robin Marr, robin.marr@ft.com
 */

/**
 * The FT.ads.config object holds the confiuration properties for an FT.ads.gpt instance.
 * There are four tiers of configuration; cookie level config, default config (set within the constructor), metatag config and global (env) config.
 * Global config, (set in the page FT.env ojbect) takes priority over meta followed by default config with cookie config having the least priority.
 * The FT.ads.config() function acts as an accessor method for the config; allowing getting and setting of configuration values.
 * Calling config() with no parameters returns the entire configuration object.
 * Calling config passing a valid property key will envoke the 'getter' and return the value for that property key.
 * Calling config passing a valid property key and a value will envoke the setter and set the value of the key to the new value.
 * Calling config passing an object of keys and values will envoke a setter that extends the store with the object provided.
 * @name config
 * @memberof FT.ads
 * @function
*/
(function (win, doc, undefined) {
    "use strict";
/**
 * The Config class defines an FT.ads.config instance.
 * @class
 * @constructor
*/
    function Config() {
/**
 * Default configuration set in the constructor.
 */
        var defaults =  {
            network: '5887',
            formats: {
                banlb: {
                    sizes: [[728,90], [468,60], [970,90]]
                },
                mpu: {
                    sizes: [[300,250],[336,280]]
                },
                doublet: {
                    sizes: [[342,200]]
                },
                hlfmpu: {
                    sizes: [[300,600],[336,850],[300,250],[336,280]]
                },
                intro: {
                    outOfPage: true
                },
                newssubs: {
                    sizes: [[239,90]]
                },
                refresh: {
                },
                searchbox: {
                    sizes: [[200,28]]
                },
                tlbxrib: {
                    sizes: [[336,60]]
                }
            },
            audSciLimit : 2,
            collapseEmpty: 'ft'
        };

        var store = {};
/**
 * @private
 * @function
 * fetchMetaConfig pulls out metatag key value pairs into an object returns the object
 */
        var fetchMetaConfig = function() {
            var meta,
                results = {},
                metas = doc.getElementsByTagName('meta');
                for (var i= 0; i < metas.length; i++) {
                    meta = metas[i];
                    if (meta.name) {
                        results[meta.name] = meta.content;
                    }
                }
            return results;
        };

/**
 * @private
 * @function
 * fetchGlobalConfig pulls out the FT.env global config object if it exists and returns it.
 */
        var fetchGlobalConfig = function() {
            return FT._ads.utils.isObject(FT.env) ? FT.env : {};
        };
/**
 * @private
 * @function
 * fetchCookieConfig pulls out all cookie name/value pairs and returns them as an object.
 */
 //TODO update this function to only pull out cookies related to ad config rather than the entire object
        var fetchCookieConfig = function(){
            return FT._ads.utils.cookies;
        };

/**
 * @function
 * access is returned by the Config constructor and acts as an accessor method for getting and setting config values.
 */
        var access = function(k, v){
            var result;
            if (FT._ads.utils.isPlainObject(k)) {
                store = FT._ads.utils.extend(store, k);
                result = store;
            } else if (typeof v === "undefined") {
                if (typeof k === "undefined"){
                    result = store;
                } else {
                    result = store[k];
                }
            } else {
                store[k] = v;
                result = v;
            }

            return result;
        };

        access.clear = function(key){
            if (key) {
                delete store[key];
            } else {
                store = {};
            }
        };

/**
 * if the 'ftads:mode_t' cookie is set with the value 'testuser' then the cookie config takes priority over all over tiers of configuration
 * this allows QA Testers to over-ride global and meta config.
 */
        if (FT._ads.utils.isString(FT._ads.utils.cookie('ftads:mode_t'))) {
            if (FT._ads.utils.cookie('ftads:mode_t')==="testuser"){
                store = FT._ads.utils.extend({}, defaults, fetchMetaConfig(), fetchGlobalConfig(), fetchCookieConfig());
            }
        }
        else {
            store = FT._ads.utils.extend({}, fetchCookieConfig(), defaults, fetchMetaConfig(), fetchGlobalConfig());
        }
        return access;
    }

    FT._ads.utils.extend(FT.ads, {config: new Config()});
}(window, document));