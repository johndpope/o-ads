/* global sinon: false, $: false, QUnit: false */

'use strict'; //eslint-disable-line

import oViewport from 'o-viewport';
import utils from '../../src/js/utils/index.js';
import gptMock from './mocks/gpt-mock.js';

import userFixtures from '../fixtures/user-api-response.json';
import userAnonymousFixtures from '../fixtures/user-api-anonymous-response.json';
import contentFixtures from '../fixtures/content-api-response.json';
import anotherContentFixtures from '../fixtures/another-content-api-response.json';
import conceptFixtures from '../fixtures/concept-api-response.json';

export const gpt = gptMock.googletag;

/* a URL that can be used in tests without causing 404 errors */
export const nullUrl = 'base/test/qunit/mocks/null.js';

/* container for fixtures */
export const fixturesContainer = {
	get: () => document.getElementById('qunit-fixtures'),
	add: (html) => {
		fixturesContainer.get().insertAdjacentHTML('beforeend', html);
		return fixturesContainer.get().lastChild;
	}
};


/* create an iframe and return it's context for testing post message */
export const createDummyFrame = function (content, target) {
	target = target || document.getElementById('qunit-fixtures');
	const iframe = document.createElement('iframe');
	iframe.id = 'postMessage';
	target.appendChild(iframe);
	if (content) {
		iframe.contentDocument.body.insertAdjacentHTML('beforeEnd', content);
	}

	return {
		node: iframe,
		window: iframe.contentWindow
	};
};

export const fixtures = {
	user: userFixtures,
	userAnonymous: userAnonymousFixtures,
	content: contentFixtures,
	anotherContent: anotherContentFixtures,
	concept: conceptFixtures
};

/* A method for logging warnings about tests that didn't run for some reason */
/* such as tests that mock read only properties in a browser that doesn't allow this */
export const warn = function(message) {
	/* jshint devel: true */
	if (console) {
		const log = console.warn || console.log;
		log.call(console, message);
	}
};

/* trigger a dom event */
export const trigger = function(element, eventType, bubble, cancelable, data) {
	let event;
	element = element || document.body;
	element = $.type(element) === 'string' ? document.querySelector(element) : element;
	if (document.createEvent) {
		event = document.createEvent('HTMLEvents');
		event.initEvent(eventType, bubble || true, cancelable || true);
		if(data) {
			utils.extend(event, data);
		}
		element.dispatchEvent(event);
	} else {
		event = document.createEventObject();
		event.eventType = eventType;
		event.cancelBubble = bubble ? false : true ;
		if(data) {
			utils.extend(event, {}, data);
		}
		element.fireEvent('on' + event.eventType, event);
	}
	return event;
};

/* Setup a sinon sandbox to easily clear mocks */
export const sandbox = QUnit.sandbox = sinon.sandbox.create();
/* Shortcuts to Sinon sandbox methods */
export const spy = function() {
	return sandbox.spy.apply(sandbox, [].slice.call(arguments));
};

export const stub = function() {
	return sandbox.stub.apply(sandbox, [].slice.call(arguments));
};

export const mock = function() {
	return sandbox.mock.apply(sandbox, [].slice.call(arguments));
};

/* decorate document.body add/remove EventListener so we can remove any attached events */
const _addEventListener = document.body.addEventListener;
const _removeEventListener = document.body.removeEventListener;
sandbox._eventListeners = [];
document.body.addEventListener = function(type, listener) {
	sandbox._eventListeners.push({type: type, listener: listener});
	_addEventListener(type, listener);
};

document.body.removeEventListener = function(type, listener) {
	let remove;
	sandbox._eventListeners.forEach(function(item, index) {
		if (item.type === type && listener === listener) { //eslint-disable-line no-self-compare
			remove = index;
		}
	});

	if (remove) {
		sandbox._eventListeners.splice(remove, 1);
	}

	_removeEventListener(type, listener);
};

const _addWindowEventListener = window.addEventListener;
const _removeWindowEventListener = window.removeEventListener;
sandbox._windowEventListeners = [];
window.addEventListener = function(type, listener) {
	sandbox._windowEventListeners.push({type: type, listener: listener});
	_addWindowEventListener(type, listener);
};

window.removeEventListener = function(type, listener) {
	let remove;
	sandbox._windowEventListeners.forEach(function(item, index) {
		if (item.type === type && listener === listener) { //eslint-disable-line no-self-compare
			remove = index;
		}
	});

	if (remove) {
		sandbox._windowEventListeners.splice(remove, 1);
	}

	_removeWindowEventListener(type, listener);
};

/* mock dates */
export const date = function(time) {
	let clock;
	if (isNaN(time)) {
		clock = sandbox.useFakeTimers();
	} else {
		clock = sandbox.useFakeTimers(time);
	}

	return clock;
};

/* mock xml http requests */
export const server = function(clock) {
	if (clock) {
		return sandbox.useFakeServerWithClock();
	} else {
		return sandbox.useFakeServer();
	}
};

/* mock viewport dimensions */

// In order to mock the results from oViewport.getSize we stub Math.max
// and return the mocked width or height when the actual width and height are provided as arguments
// this could go bad if your code is using Math.max and happens to provide the window width/height as an argument
export const viewport = function(width, height) {

	if (oViewport.getSize.restore) {
		oViewport.getSize.restore();
	}

	this.stub(oViewport, 'getSize', function() {
		return {
			height: height,
			width: width
		};
	});

};

/* Add meta data to the page */
export const meta = function(data) {
	let name;
	let attr;
	let metatag;
	let attrs = '';
	if ($.isPlainObject(data)) {
		for (name in data) {
			if (data.hasOwnProperty(name)) {
				if ($.type(data[name]) === 'string') {
					attrs += 'content="' + data[name] + '"';
				} else if ($.isPlainObject(data[name])) {
					for (attr in data[name]) {
						if (data[name].hasOwnProperty(attr)) {
							attrs += attr + '=\'' + data[name][attr] + '\' ';
						}
					}
				}

				metatag = '<meta name="' + name + '" ' + attrs + ' remove>';
				$(metatag).appendTo('head');
			}
		}
	} else {
		throw new MetaException('invalid data to build meta tags');
	}

	return data;
};

/* Mock localStorage */
export const localStorage = function(data) {
	let canMock = Boolean(window.localStorage);
	let fake;
	if (canMock) {
		// remember original local storage
		sandbox._localStorage = window.localStorage;
		if ($.isPlainObject(data)) {
			const fakes = {
				getItem: function(key) {
					return data[key] || null;
				},
				setItem: function(key, value) {
					data[key] = value;

				},
				removeItem: function(key) {
					delete data[key];
				},
				key: function(index) {
					const keys = Object.keys(data);
					index = index || 0;
					return data[keys[index]] || null;
				}
			};

			try {
				// remove the original
				delete window.localStorage;
				// set up mock
				Object.defineProperty(window, 'localStorage', { value: fakes, configurable: true, writable: true });
			} catch (err) {
				// this will fail in some browsers where you can't override host properties (Safari)
				// localStorage tests need to be skipped in those browsers
				canMock = false;
				delete sandbox._localStorage;
			}

			// replaces the original set of fakes with stubs
			for (fake in fakes) {
				if (fakes.hasOwnProperty(fake)) {
					sandbox.stub(window.localStorage, fake, fakes[fake]);
				}
			}
		} else {
			new LocalStorageException('Invalid data for localStorage');
		}
	}

	return canMock;
};

/* clear out anyting added to the page by tests */
/* and reset all the sinon mocks in the sandbox */
export const clear = function() {
	// remove any tags added during testing
	$('[remove],[o-ads]').remove();

	// empty the fixtures container
	$('#qunit-fixtures').empty();

	// clear localStorage mock
	if (sandbox._localStorage) {
		window.localStorage = sandbox._localStorage;
		delete sandbox._localStorage;
	}

	// delete global vars
	if (sandbox._globals) {
		Object.keys(sandbox._globals).forEach(function(name) {
			delete window[name];
		});
	}

	// remove attached events
	sandbox._eventListeners.forEach(function(item) {
		_removeEventListener(item.type, item.listener);
	});
	sandbox._eventListeners = [];

	oViewport.stopListeningTo('all');

	// remove attached events
	sandbox._windowEventListeners.forEach(function(item) {
		_removeWindowEventListener(item.type, item.listener);
	});
	sandbox._windowEventListeners = [];
	// restore stubs & mocks
	gptMock.restore();
	sandbox.restore();
};

export const deleteCookie = function(name) {
	document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

/* exception to be thrown by meta if invalid data is supplied */
function MetaException(message) {
	this.message = message;
	this.name = 'MetaException';
}

/* exception to be thrown by localStorage if invalid data is supplied */
function LocalStorageException(message) {
	this.message = message;
	this.name = 'LocalStorageException';
}

export default {
	gpt,
	nullUrl,
	fixturesContainer,
	createDummyFrame,
	fixtures,
	warn,
	trigger,
	sandbox,
	spy,
	stub,
	mock,
	date,
	server,
	viewport,
	meta,
	localStorage,
	clear,
	deleteCookie
};