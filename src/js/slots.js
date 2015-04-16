"use strict";
var utils = require('./utils');
var config = require('./config');
var Slot = require('./slot');
var oViewport = require('o-viewport');
var screensize = null;
var total = 0;
var complete = 0;
var deffered = 0;
/**
* The Slots class defines an slots instance.
* the instance tracks all ad slots on the page
* @class
* @constructor
*/
function Slots() {
}

/**
* Given a slot name or an array of slot names will collapse the slots using the collapse method on the slot
*/
Slots.prototype.collapse = function (names) {
	if (!utils.isArray(names)){
		names = [names];
	}

	names.forEach(function(name){
		if(this[name] && utils.isFunction(this[name].collapse)) {
			this[name].collapse();
		} else {
			utils.log.warn('Attempted to collapse non-existant slot %s', name);
		}
	});
};

/**
* Given a slot name or an array of slot names will uncollapse the slots using the uncollapse method on the slot
*/
Slots.prototype.uncollapse = function (names) {
	if (!utils.isArray(names)){
		names = [names];
	}

	names.forEach(function(name){
		if(this[name] && utils.isFunction(this[name].collapse)) {
			this[name].collapse();
		} else {
			utils.log.warn('Attempted to uncollapse non-existant slot %s', name);
		}
	});
};

/**
* Given a slot name or an array of slot names of slotnames will refresh the slots using the refresh method on the slot
*/
Slots.prototype.refresh = function (names) {
	names = names || Object.keys(this);
	if (!utils.isArray(names)){
		names = [names];
	}

	names.forEach(function(slots, name){
		var slot = slots[name];
		if(slot && utils.isFunction(slot.refresh)) {
			slot.refresh();
		} else {
			utils.log.warn('Attempted to refresh non-existant slot %s', name);
		}
	}.bind(null, this));
};

/**
* Confirms a container in the page exists and creates a Slot object
*/
Slots.prototype.initSlot = function (container) {
	// if container is a string this is a legacy implementation using ids
	// find the element and remove the ID in favour of a data attribute
	if (utils.isString(container)){
		container = document.getElementById(container) ||document.querySelector('[data-o-ads-name="'+ container +'"]');
		if (container && container.id) {
			container.setAttribute('data-o-ads-name', container.id);
			container.removeAttribute('id');
		}
	}

	// if not an element or we can't find it in the DOM exit
	if (!utils.isElement(container)) {
		utils.log.error('slot container must be an element!', container);
		return false;
	}

	var slot = new Slot(container, screensize);
	if (slot){
		this[slot.name] = slot;
		total++;
		if (slot.deffer){
			deffered++;
		}
		oViewport.trackElements('[data-o-ads-name="' + slot.name + '"]');
	}
	return slot;
};


Slots.prototype.initRefresh = function (){
	if(config('flags').refresh && config('refresh')){
		var data = config('refresh');
		if (data.time && !data.inview) {
			this.timers.refresh = utils.timers.create(data.time, this.refresh.bind(this), data.max || 0);
		}
	}
};

Slots.prototype.initInview = function() {
	if(config('flags').inview){
		document.documentElement.addEventListener('oViewport.inView', function (slots, event){
			var element = event.detail.element;
			var name = element.getAttribute('data-o-ads-name');
			if (name) {
				var slot = slots[name];
				slot.inview = event.detail.inViewPercentage;
				if(slot.inview > 0){
					slots[name].fire('inview');
				}
			}
		}.bind(null, this));
	}
};

Slots.prototype.initRendered = function(){
	utils.on('rendered', function(slots, event){
		complete++;

		var slot = slots[event.detail.name];
		if(slot) {
			utils.extend(slot[slot.server], event.detail[slot.server]);
			slot.fire('complete', event.detail, slot.container);
		}

		if (total === (complete + deffered)) {
			utils.broadcast('all-complete', { slots: slots });
		}
	}.bind(null, this));


	utils.on('rendered', function(slots, event){
		var slot = slots[event.detail.name];
		if(slot) {
			utils.extend(slot[slot.server], event.detail[slot.server]);
			slot.fire('complete', event.detail, slot.container);
		}
	}.bind(null, this));
};

/*
* if responsive configurations exist start listening for breakpoint changes
*/
Slots.prototype.initResponsive = function() {
	var breakpoints = config('responsive');
	if (utils.isObject(breakpoints) ) {
		screensize = utils.responsive(breakpoints, onBreakpointChange.bind(null, this));
	}
};

function onBreakpointChange(slots, screensize) {
	Object.keys(slots).forEach(function(name){
		var slot = slots[name];
		if(slot) {
			slot.screensize = screensize;
			slot.fire('breakpoint', {
				name: name,
				slot: slot,
				screensize: screensize
			}, slot.container);
		}
	});
}

Slots.prototype.init = function () {
	this.initRefresh();
	this.initInview();
	this.initRendered();
	this.initResponsive();
};

Slots.prototype.screensize = null;

Slots.prototype.timers = {};

module.exports = new Slots();
