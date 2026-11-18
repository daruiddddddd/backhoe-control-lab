const assert=require('node:assert/strict');const C=require('./core.js');
const expected={vertical:{KeyW:'swingRight',KeyS:'swingLeft',KeyA:'armOut',KeyD:'armIn'},horizontal:{KeyW:'armOut',KeyS:'armIn',KeyA:'swingLeft',KeyD:'swingRight'}};
const sign={swingRight:['yaw',-1],swingLeft:['yaw',1],armOut:['arm',1],armIn:['arm',-1],boomDown:['boom',-1],boomUp:['boom',1],bucketIn:['bucket',-1],bucketOut:['bucket',1]};
for(const p of ['vertical','horizontal']){
 const m=C.mapping(p);assert.deepEqual(m,{...expected[p],ArrowUp:'boomDown',ArrowDown:'boomUp',ArrowLeft:'bucketIn',ArrowRight:'bucketOut'});
 for(const [key,act] of Object.entries(m)){const a=C.fresh(),b={...a};C.step(b,C.actions(p,new Set([key])),.05,1);const [axis,sgn]=sign[act];assert.equal(Math.sign(b[axis]-a[axis]),sgn,p+' '+key+' '+act);for(const k of Object.keys(a))if(k!==axis)assert.equal(b[k],a[k]);}
}
const a=C.fresh();C.step(a,[],.05,1);assert.deepEqual(a,C.fresh());
const b=C.fresh();C.step(b,['swingLeft','swingRight','boomUp','boomDown','armIn','armOut','bucketIn','bucketOut'],.05,1);assert.deepEqual(b,C.fresh());
for(const act of Object.keys(sign)){const s=C.fresh();for(let i=0;i<10000;i++)C.step(s,[act],.05,1);for(const [k,[min,max]]of Object.entries(C.limits))assert(s[k]>=min&&s[k]<=max);assert(Math.abs(s.yaw)<=Math.PI);}
const together=C.fresh();C.step(together,['boomUp','armOut'],.05,1);assert(together.boom>C.fresh().boom&&together.arm>C.fresh().arm);
console.log('PASS: official 16 input mappings, motion signs, neutral stop, opposite cancellation, joint limits, simultaneous controls.');
