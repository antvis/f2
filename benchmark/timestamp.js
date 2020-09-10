const Benchmark = require('benchmark');
const suite = new Benchmark.Suite();

const util = require('../lib/util/common');


// add tests
suite
  .add('timestamp', function() {
    util.toTimeStamp(1599486051334);
  })
  .add('YYYY-MM-DD', function() {
    util.toTimeStamp('2020-09-07');
  })
  .add('YYYY/MM/DD', function() {
    util.toTimeStamp('2020/09/07');
  })
  .add('new Date(2020, 8, 7)', function() {
    new Date(2020, 8, 7).getTime();
  })
  // add listeners
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run();
