/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var ChainDisposable = require('../disposable/ChainDisposable');
var EmptyDisposable = require('../disposable/EmptyDisposable');

exports.switch = switchLatest;

function switchLatest(stream) {
	return new Stream(new Switch(stream.source));
}

function Switch(source) {
	this.source = source;
}

Switch.prototype.run = function(sink) {
	var switchSink = new SwitchSink(sink);
	return new ChainDisposable(switchSink, this.source.run(switchSink));
};

function SwitchSink(sink) {
	this.sink = sink;
	this.current = null;
	this.ended = false;
}

SwitchSink.prototype.event = function(t, stream) {
	this._disposeCurrent(t); // TODO: capture the result of this dispose
	this.current = new Segment(t, Infinity, this, this.sink);
	this.current.disposable = stream.source.run(this.current);
};

SwitchSink.prototype.end = function(t, x) {
	this.ended = true;
	this._checkEnd(t, x);
};

SwitchSink.prototype.dispose = function() {
	return this._disposeCurrent(0);
};

SwitchSink.prototype._disposeCurrent = function(t) {
	if(this.current !== null) {
		return this.current._dispose(t);
	}
};

SwitchSink.prototype._checkEnd = function(t, x) {
	if(this.ended && this.current === null) {
		this.sink.end(t, x);
	}
};

SwitchSink.prototype._endInner = function(t, x, inner) {
	inner._dispose(t); // TODO: capture the result of this dispose
	if(inner === this.current) {
		this.current = null;
	}
	this._checkEnd(t, x);
};

function Segment(min, max, outer, sink) {
	this.min = min;
	this.max = max;
	this.outer = outer;
	this.sink = sink;
	this.disposable = new EmptyDisposable();
}

Segment.prototype.event = function(t, x) {
	if(t < this.max) {
		this.sink.event(Math.max(t, this.min), x);
	}
};

Segment.prototype.end = function(t, x) {
	this.outer._endInner(Math.max(t, this.min), x, this);
};

Segment.prototype._dispose = function(t) {
	this.max = t;
	return this.disposable.dispose();
};