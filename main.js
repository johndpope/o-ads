function Ads() {
}

// bung all our modules on the protoype
Ads.prototype.config = require('./src/js/config');
Ads.prototype.slots = require('./src/js/slots');
Ads.prototype.gpt = require('./src/js/ad-servers/gpt');
Ads.prototype.krux = require('./src/js/data-providers/krux');
Ads.prototype.cb = require('./src/js/data-providers/chartbeat');
Ads.prototype.rubicon = require('./src/js/data-providers/rubicon');
Ads.prototype.admantx = require('./src/js/data-providers/admantx');
Ads.prototype.targeting = require('./src/js/targeting');
<<<<<<< HEAD
Ads.prototype.metadata = require('./src/js/metadata');
Ads.prototype.version = require('./src/js/version');
Ads.prototype.buildURLForVideo = require('./src/js/video');
Ads.prototype.moat = require('./src/js/data-providers/moat');
var utils = Ads.prototype.utils = require('./src/js/utils');
=======
Ads.prototype.utils = require('./src/js/utils');
>>>>>>> origin/es6

/**
* Initialises the ads library and all sub modules
* @param config {object} a JSON object containing configuration for the current page
*/

Ads.prototype.init = function(config) {
	this.config.init();
	this.config(config);
	this.slots.init();
	this.gpt.init();
	this.krux.init();
	this.cb.init();
	this.moat.init();
	this.rubicon.init();
	this.admantx.init();
	this.utils.on('debug', this.debug.bind(this));
	return this;
};

const ads = new Ads();
const initAll = function() {
	const metas = Array.from(document.getElementsByTagName('meta'));
	const stop = metas.filter(function(meta) {
		return meta.name === 'o-ads-stop';
	});
	/* istanbul ignore else  */
	if (!stop.length) {
		ads.init();
		const slots = Array.from(document.querySelectorAll('.o-ads, [data-o-ads-name]'));
		slots.forEach(ads.slots.initSlot.bind(ads.slots));
	}

	document.documentElement.removeEventListener('o.DOMContentLoaded', initAll);
};

Ads.prototype.debug = function (){
	let remove = true;
	if (localStorage.getItem('oAds')) {
		remove = false;
	} else {
		localStorage.setItem('oAds', true);
	}
	this.admantx.debug();
	this.cb.debug();
	this.gpt.debug();
	this.krux.debug();
	this.slots.debug();
	this.targeting.debug();

	if (remove) {
		localStorage.removeItem('oAds');
	}
};

document.documentElement.addEventListener('o.DOMContentLoaded', initAll);

module.exports = ads;
