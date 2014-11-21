/**
 * @fileOverview
 * Third party library for use with google publisher tags.
 *
 * @author Robin Marr, robin.marr@com
 */
/**
 * ads.rubicon provides rubicon integration for the FT advertising library
 * @name targeting
 * @memberof ads
*/
var ads;
var proto = Rubicon.prototype;
var _initSlot = null;
var context; // used to store a local copy of ads.slots.initSlot

/**
 * The Rubicon class defines an ads.rubicon instance
 * @class
 * @constructor
*/
function Rubicon() {
	context = this;
	this.insights = {};
	this.attempts = 0;
	// these have to be global
	window.oz_async = true;
	window.oz_cached_only = false;
}

/**
 * initialise rubicon functionality
 * loads dorothy.js from rubicon
 * Decorates the gpt init slot method with rubicon valuation functionality
 * @name init
 * @memberof Rubicon
 * @lends Rubicon
*/
proto.init = function (impl) {
	ads = impl;
	var config = context.config = ads.config('rubicon');
	if (config && config.id && config.site) {
		context.maxAttempts = config.maxAttempts || 10;
		ads.utils.attach('http://tap-cdn.rubiconproject.com/partner/scripts/rubicon/dorothy.js?pc=' + config.id + '/' + config.site);
		context.decorateInitSlot();
	} 
};


/**
 * initialise rubicon valuation for a slot
 * This is called before an ad call is made so a valution can be made for slots that are configured to make one
 * @name initValuation
 * @memberof Rubicon
 * @lends Rubicon
*/
proto.initValuation = function (slotName) {
	var config = context.config;
	if (ads.utils.isFunction(window.RubiconInsight) ) {
		var insight = context.insights[slotName] = new RubiconInsight();
	} else if (context.attempts <= context.maxAttempts) {
		context.attempts++;
		ads.utils.timers.create(0.2, (function (slotName) {
			return function () {
				context.initValuation(slotName);
			};
		}(slotName)), 1);
		return;
	} else {
		// dorothy js has failed to promptly load so undecorate initSlot
		// no calls to the valuation api will be made
		ads.slots.initSlot = _initSlot;
	}


	var zone = (config && config.zones) ? config.zones[slotName] : false;
	var size = (config && config.formats) ? config.formats[slotName] : false;

	if (zone && size) {
		insight.init({
			oz_api: 'valuation',
			oz_callback: context.valuationCallbackFactory(slotName),
			oz_ad_server: 'gpt',
			oz_site: config.id + '/' + config.site,
			oz_ad_slot_size: size,
			oz_zone: zone,
			oz_async: true
		});

		// hopefully temp fix while rubicon sort out their api
		oz_onValuationLoaded = function(H) {
			insight.onValuationLoaded(H); 
		};

		insight.start();
	} else {
		_initSlot.call(ads.slots, slotName);
	}
};

/**
 * Valuation request callback factory
 * This generates the callback that receives the data from a valution request, it keeps the slotname in a closure.
 * @name init
 * @memberof Rubicon
 * @lends Rubicon
*/    
proto.valuationCallbackFactory = function (slotName) {
	return function (results) {
		// add results to slot targeting and run initSlot
		document.getElementById(slotName).setAttribute('data-ftads-rtp', results.estimate.tier);
		_initSlot.call(ads.slots, slotName);
	}
};

/**
 * Decorate initSlot to make a valuation request
 * @name init
 * @memberof Rubicon
 * @lends Rubicon
*/    
proto.decorateInitSlot = function () {
	if (ads.utils.isFunction(ads.slots.initSlot)) {
		_initSlot = ads.slots.initSlot;
		ads.slots.initSlot = context.initValuation;
		return ads.slots.initSlot;
	}
};


module.exports = new Rubicon();
