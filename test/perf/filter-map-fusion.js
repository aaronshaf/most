var Benchmark = require('benchmark');
var most = require('../../most');
var rx = require('rx');
var kefir = require('kefir');
var bacon = require('baconjs');
var lodash = require('lodash');
var highland = require('highland');

var runners = require('./runners');
var kefirFromArray = runners.kefirFromArray;

// Create a stream from an Array of n integers
// filter out odds, map remaining evens by adding 1, then reduce by summing
var n = runners.getIntArg(1000000);
var a = new Array(n);
for(var i = 0; i< a.length; ++i) {
	a[i] = i;
}

var suite = Benchmark.Suite('filter -> map -> reduce ' + n + ' integers');
var options = {
	defer: true,
	onError: function(e) {
		e.currentTarget.failure = e.error;
	}
};

var rfm = rx.Observable.fromArray(a).filter(even).map(add1);
var rffm = rx.Observable.fromArray(a).filter(even).filter(by3).map(add1);
var rfmm = rx.Observable.fromArray(a).filter(even).map(add1).map(add2);
var rffmm = rx.Observable.fromArray(a).filter(even).filter(by3).map(add1).map(add2);

var fm = most.from(a).filter(even).map(add1);
var ffm = most.from(a).filter(even).filter(by3).map(add1);
var fmm = most.from(a).filter(even).map(add1).map(add2);
var ffmm = most.from(a).filter(even).filter(by3).map(add1).map(add2);

suite
	.add('rx', function(deferred) {
		runners.runRx(deferred, rfm.reduce(sum, 0));
	}, options)
	.add('most', function(deferred) {
		runners.runMost(deferred, fm.reduce(sum, 0));
	}, options)

runners.runSuite(suite);

function add1(x) {
	return x + 1;
}

function add2(x) {
	return x + 2;
}

function even(x) {
	return x % 2 === 0;
}

function by3(x) {
	return x % 3 === 0;
}

function sum(x, y) {
	return x + y;
}
