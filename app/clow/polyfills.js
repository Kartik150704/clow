// Create this as a new file called "polyfills.js" in your project root
// You MUST import this file at the very top of your index.js before any other imports

// EventEmitter polyfill
import { EventEmitter } from 'events';

// Make EventEmitter available globally
if (!global.EventEmitter) {
  global.EventEmitter = EventEmitter;
}

// Ensure global.process exists
if (!global.process) {
  global.process = {};
}

// Add required process methods if missing
if (!global.process.nextTick) {
  global.process.nextTick = setImmediate;
}

// Ensure other required globals
if (!global.Buffer) {
  global.Buffer = require('buffer').Buffer;
}

// Fix setTimeout/clearTimeout issues that sometimes occur
global.setTimeout = global.setTimeout || setTimeout;
global.clearTimeout = global.clearTimeout || clearTimeout;

// Fix setInterval/clearInterval issues that sometimes occur
global.setInterval = global.setInterval || setInterval;
global.clearInterval = global.clearInterval || clearInterval;

// Ensure the navigator object exists
if (!global.navigator) {
  global.navigator = {};
}

// Add required navigator properties
if (!global.navigator.product) {
  global.navigator.product = 'ReactNative';
}

// Fix exports object
if (typeof exports === 'undefined') {
  global.exports = {};
}