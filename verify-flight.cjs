const assert=require('node:assert/strict');
const F=require('./flight.js');
const input=F.inputs(new Set(['KeyW','ArrowUp']),[{x:-1,y:0},{x:1,y:0}]);
assert.deepEqual(input,{forward:1,up:1,turnLeft:1,slideRight:1});
let a=F.fresh();for(let i=0;i<20;i++)a=F.step(a,{forward:1,up:1},.05);
assert(a.z<-3.4&&a.y>5.4);assert.equal(a.x,0);
assert.deepEqual(F.step(a,{},.05),a);
let left=F.step(F.fresh(),{turnLeft:1},.05);assert(left.heading>0);left=F.step(left,{forward:1},.05);assert(left.x<0);
let side=F.step(F.fresh(),{slideRight:1},.05);assert(side.x>0);
let slow=F.step(F.fresh(),{forward:.5},.05),fast=F.step(F.fresh(),{forward:1},.05);assert.equal(slow.z*2,fast.z);
for(let i=0;i<1000;i++)a=F.step(a,{forward:1,slideRight:1,up:1},.05);
assert.equal(a.x,11);assert.equal(a.z,-11);assert.equal(a.y,8);
for(let i=0;i<1000;i++)a=F.step(a,{down:1},.05);assert.equal(a.y,2.5);
a.heading=9;let result;for(let i=0;i<400;i++){result=F.returnHome(a,.05);a=result.state;if(result.done)break;}
assert(result.done);assert.deepEqual(a,F.fresh());
console.log('PASS: flight keys and two touch sticks, heading, proportional speed, neutral stop, map/altitude limits, exact automatic home return.');
