/**
 * @fileOverview
 * Third party library for use with google publisher tags.
 *
 * @author Robin Marr, robin.marr@ft.com
 */

(function (win, doc, undefined) {
    "use strict";

    function Config() {
        var self = this;

        self.defaults = {
          formats:  {
                banlb: [[728,90], [468,60], [970,90]],
                mpu: [[300,250],[336,280]],
                doublet: [[342,200]],
                hlfmpu: [[300,600],[336,850],[300,250],[336,280]],
                intro: [[1,1]],
                newssubs: [[239,90]],
                refresh: [[1,1]],
                searchbox: [[200,28]],
                tlbxrib: [[336,60]]
          }
        };

        self.store = {};
        self.init();

        return self;
    }

    Config.prototype.fetchMetaConfig = function() {
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

    Config.prototype.fetchGlobalConfig = function() {
        return FT._ads.utils.isObject(FT.env) ? FT.env : {};
    };

    Config.prototype.get = function get(key) {
        var result;
        if (key) {
            result = this.store[key];
        } else {
            result = this.store;
        }

        return result;
    };

    Config.prototype.set = function set(key, value) {
        var result;
        if (value) {
            this.store[key] = value;
            result = value;
        }

        return result;
    };

    Config.prototype.clear = function clear() {
        this.store = {};
    };

    Config.prototype.init = function init() {
        this.store = FT._ads.utils.extend({}, this.defaults, this.fetchMetaConfig(), this.fetchGlobalConfig());
    };

    if (!win.FT && FT._ads.utils.isObject(win.FT)) {
        FT = win.FT = {};

    }

    if (!FT.ads) {
        FT.ads = {};
    }

    FT._ads.utils.extend(FT.ads, {config: new Config()});
}(window, document));
