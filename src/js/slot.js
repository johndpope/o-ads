'use strict';
var utils = require('./utils');
var config = require('./config');

var attributeParsers = {
	sizes: function(value, sizes){
		if (value === false || value === 'false'){
			return false;
		} else if (utils.isArray(sizes)) {
			value.replace(/(\d+)x(\d+)/g, function (match, width, height) {
				sizes.push([ parseInt(width, 10), parseInt(height, 10)]);
			});
		}
		return sizes;
	},
	'formats' : function(value, sizes) {
		if (value === false || value === 'false') {
			sizes = false;
		} else {
			var mapping = config().formats;
			var formats = utils.isArray(value) ? value : value.split(',');
			formats.forEach(function (format) {
				format = mapping[format];
				if (utils.isArray(format.sizes[0])) {
					for (var j = 0; j < format.sizes.length; j++){
						sizes.push(format.sizes[j]);
					}
				}
				else {
					sizes.push(format.sizes);
				}
			});
		}
		return sizes;
	},
	responsiveSizes: function(name, value, sizes){
		var screenName = name.replace(/^sizes/, '').toLowerCase();
		if (!utils.isPlainObject(sizes)) {
			sizes = {};
		}
		sizes[screenName] = attributeParsers.sizes(value, sizes[screenName] || []);
		return sizes;
	},
	responsiveFormats: function(name, value, sizes){
		var screenName = name.replace(/^formats/, '').toLowerCase();
		if (!utils.isPlainObject(sizes)) {
			sizes = {};
		}
		sizes[screenName] = attributeParsers.formats(value, []);
		return sizes;
	},
	targeting: function (value, targeting) {
		value = utils.hash(value, ';', '=');
		utils.extend(targeting, value);
		return targeting;
	},
	"default": function (value) {
		if (value === '' || value === 'true'){
			value = true;
		} else if (value === 'false') {
			value = false;
		}
		return value;
	}
};

/**
* The Slot class.
* @class
* @constructor
*/
function Slot(container) {
	var slotConfig = config('slots') || {};
	// store the container
	this.container = container;
	// setup slot dom structure
	this.outer = this.addContainer(container, { class: 'outer' });
	this.inner = this.addContainer(this.outer, { class: 'inner'});
	// make sure the slot has a name
	this.setName();
	slotConfig = slotConfig[this.name] || {};

	// default configuration properties
	this.server = 'gpt';
	this.render = true;

	// global slots configuration
	this.targeting = slotConfig.targeting || {};
	this.sizes = slotConfig.sizes || [];
	this.center = slotConfig.center || false;
	this.outOfPage = slotConfig.outOfPage || false;
	this.lazyLoad = slotConfig.lazyLoad || false;
	this.collapseEmpty = slotConfig.collapseEmpty || false;

	if(utils.isArray(slotConfig.formats)){
		attributeParsers.formats(slotConfig.formats, this.sizes);
	}	else if (utils.isPlainObject(slotConfig.formats)) {
		this.sizes = {};
		Object.keys(slotConfig.formats).forEach(function (screenName) {
			this.sizes[screenName] = attributeParsers.formats(slotConfig.formats[screenName], []);
		}.bind(this));
	}

	// extend with imperative configuration options
	this.parseAttributeConfig();

	if (!this.sizes.length && !utils.isPlainObject(this.sizes)) {
		utils.log.error('slot %s has no configured sizes!', this.name);
		return false;
	}

	this.centerContainer();
	if (this.lazyLoad){
		this.render = false;
	} else {
		utils.once('inview', this.fire.bind(this, 'render'), this.container);
	}
	this.fire('ready');
}

/**
* parse slot attribute config
*/
Slot.prototype.parseAttributeConfig = function(){
	[].slice.call(this.container.attributes).forEach(function (attribute) {
		var name = utils.parseAttributeName(attribute.name);
		var value = attribute.value;
		if(name === 'formats'){
			this[name] = attributeParsers[name](value, this.sizes);
		} else if (attributeParsers[name]){
			this[name] = attributeParsers[name](value, this[name]);
		} else if (/^formats\w*/.test(name)) {
			this.sizes = attributeParsers.responsiveFormats(name, value, this.sizes);
		} else if (/^sizes\w*/.test(name)) {
			this.sizes = attributeParsers.responsiveSizes(name, value, this.sizes);
		} else if(this.hasOwnProperty(name)) {
			this[name] = attributeParsers.default(value);
		}
	}.bind(this));
};


/**
*	If the slot doesn't have a name give it one
*/
Slot.prototype.setName = function () {
	this.name = this.container.getAttribute('data-o-ads-name') || this.container.getAttribute('o-ads-name');
	if(!this.name) {
		this.name = 'o-ads-slot-' + (document.querySelectorAll('[data-o-ads-name],[o-ads-name]').length + 1);
		this.container.setAttribute('data-o-ads-name', this.name);
	}
};

/**
* add the empty class to the slot signifying there was no ad to load into the slot
*/
Slot.prototype.collapse = function(){
	utils.addClass(this.container, 'empty');
	utils.addClass(document.body, 'no-' + this.name);
};

/**
* remove the empty class from the slot
*/
Slot.prototype.uncollapse = function(){
	utils.removeClass(this.container, 'empty');
	utils.removeClass(document.body, 'no-' + this.name);
};

/**
*	fire an event on the slot
*/
Slot.prototype.fire = function(name, data){
	var details = {
		name: this.name,
		slot: this
	};

	if(utils.isPlainObject(data)) {
		utils.extend(details, data);
	}

	utils.broadcast(name, details, this.container);
};

/**
*	fire the complete event on the slot
* this should be fired by the ad server module
* when it's finished rendering the slot
*/
Slot.prototype.complete = function(){
	utils.broadcast('complete', {
		name: this.name,
		slot: this
	}, this.container);
};

/**
*	add a div tag into the current slot container
**/
Slot.prototype.addContainer = function(node, attrs){
	var container = '<div ';
	Object.keys(attrs || {}).forEach(function (attr) {
		var value = attrs[attr];
		container += attr + '=' + value + ' ';
	});

	container += '></div>';
	node.insertAdjacentHTML('beforeend', container);
	return node.lastChild;
};

/**
* Add a data-attribute for chartbeat tracking to the div element which contains the slot
* @name addChartBeatTracking
* @memberof Slot
* @lends Slot
*/
Slot.prototype.centerContainer = function () {
	if(this.center){
		utils.addClass(this.container, 'center');
	}
};


//TODO: Remove reference to FT.com newssub / searchbox ad position.
// if (slotName === "searchbox") {slotName = "newssubs";}
module.exports = Slot;
