const assert=require('node:assert/strict'),C=require('./core.js'),{SoilField,excavate}=require('./soil.js');
const near=(a,b,epsilon=1e-9)=>assert(Math.abs(a-b)<epsilon,`${a} != ${b}`);
for(const pattern of ['vertical','horizontal']){
 const map=C.mapping(pattern);
 for(const [side,codes]of [[0,['KeyW','KeyS','KeyA','KeyD']],[1,['ArrowUp','ArrowDown','ArrowLeft','ArrowRight']]]){
  for(const [i,[x,y]]of [[0,[0,-1]],[1,[0,1]],[2,[-1,0]],[3,[1,0]]]){const sticks=[{x:0,y:0},{x:0,y:0}];sticks[side]={x,y};assert.deepEqual(C.inputs(pattern,[],sticks),{[map[codes[i]]]:1});}
 }
}
assert.deepEqual(C.stickAxes(2,2,50),{x:0,y:0});
for(const p of [[500,0],[0,-500],[500,500],[-500,-500]]){const s=C.stickAxes(...p,50);near(Math.hypot(s.x,s.y),1);}
const light=C.fresh(),full=C.fresh();C.step(light,{boomUp:.5},.05,1);C.step(full,{boomUp:1},.05,1);near(light.boom-C.fresh().boom,(full.boom-C.fresh().boom)/2);
const both=C.inputs('horizontal',[],[{x:1,y:0},{x:0,y:1}]);assert.deepEqual(both,{swingRight:1,boomUp:1});
const noEarth=new SoilField();near(noEarth.dig({x:0,y:3,z:-4},1,1),0);near(noEarth.volume(),0);
const capped=new SoilField(),amount=capped.dig({x:.5,y:-.15,z:-4},1,.02);near(amount,.02);near(capped.volume(),-.02);near(capped.dig({x:.5,y:-.8,z:-4},1,0),0);
const allResults=[];
for(const pattern of ['vertical','horizontal']){
 const field=new SoilField();let state=C.fresh(),cargo=0,dropped=0,contact=false;const capacity=.28;
 function drive(actions,seconds){const map=C.mapping(pattern),keys=actions.map(a=>Object.keys(map).find(k=>map[k]===a));for(let t=0;t<seconds;t+=1/30){const out=excavate(C,field,state,C.inputs(pattern,keys),1/30,.8,cargo,capacity);state=out.state;cargo=out.cargo;contact||=out.contact;if(out.dropped){near(field.deposit(out.tip.x,out.tip.z,out.dropped),out.dropped);dropped+=out.dropped;}near(field.volume()+cargo,0,1e-8);assert(cargo>=0&&cargo<=capacity+1e-9);}}
 drive(['boomDown'],2);assert(contact,'Ground must block simple downward tunneling');near(field.volume(),0);
 drive(['boomDown','armIn','bucketIn'],3);assert(cargo>.03,'Scoop must collect soil');const holeDepth=field.deepest();assert(holeDepth>.07,'A visible hole must remain');const carried=cargo;
 drive(['boomUp'],2.5);near(cargo,carried);drive(['swingRight'],2);near(cargo,carried);
 drive(['bucketOut'],6);near(cargo,0,1e-8);assert(dropped>.03);assert(field.heights.some(h=>h>.025),'Dump must leave a mound');assert(field.heights.some(h=>h<-.05),'Original hole must persist');near(field.volume(),0,1e-8);
 allResults.push({state,carried,depth:holeDepth,dropped});field.reset();near(field.deepest(),0);near(field.volume(),0);
}
assert.deepEqual(allResults[0],allResults[1]);
console.log('PASS: both touch layouts, two-stick input, proportional speed, dead zone, ground contact, capacity, scoop-carry-slew-dump, persistent hole/mound, conserved soil volume, reset.');
console.log(JSON.stringify(allResults[0]));
