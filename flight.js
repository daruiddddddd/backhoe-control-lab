/* Arcade flight inside the existing practice yard. No excavator controls change. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.BackhoeFlight=api;})(globalThis,function(){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mapping={KeyW:'forward',KeyS:'back',KeyA:'turnLeft',KeyD:'turnRight',ArrowUp:'up',ArrowDown:'down',ArrowLeft:'slideLeft',ArrowRight:'slideRight'};
const labels={forward:'前進',back:'後退',turnLeft:'左旋回',turnRight:'右旋回',up:'上昇',down:'下降',slideLeft:'左へ移動',slideRight:'右へ移動'};
function inputs(keys,sticks=[{},{}]){const out={};for(const key of keys){if(mapping[key])out[mapping[key]]=1;}const axes=[[sticks[0].y,'back','forward'],[sticks[0].x,'turnRight','turnLeft'],[sticks[1].y,'down','up'],[sticks[1].x,'slideRight','slideLeft']];for(const [axis,positive,negative] of axes){const n=Number(axis)||0;if(Math.abs(n)>.01){const a=n>0?positive:negative;out[a]=Math.max(out[a]||0,Math.min(1,Math.abs(n)));}}return out;}
function fresh(){return {x:0,y:3.5,z:0,heading:0};}
function step(previous,w,dt){const s={...previous},d=clamp(dt,0,.05),forward=(w.forward||0)-(w.back||0),side=(w.slideRight||0)-(w.slideLeft||0),turn=(w.turnLeft||0)-(w.turnRight||0);s.heading+=turn*d*1.1;const length=Math.max(1,Math.hypot(forward,side));const f=forward/length*3.5*d,r=side/length*3.5*d;s.x=clamp(s.x-Math.sin(s.heading)*f+Math.cos(s.heading)*r,-11,11);s.z=clamp(s.z-Math.cos(s.heading)*f-Math.sin(s.heading)*r,-11,11);s.y=clamp(s.y+((w.up||0)-(w.down||0))*d*2,2.5,8);return s;}
function returnHome(previous,dt){const s={...previous},d=clamp(dt,0,.05),length=Math.hypot(s.x,s.z),travel=Math.min(length,5*d);if(length>0){s.x*=1-travel/length;s.z*=1-travel/length;}s.y+=clamp(3.5-s.y,-3*d,3*d);s.heading=Math.atan2(Math.sin(s.heading),Math.cos(s.heading));s.heading+=clamp(-s.heading,-2*d,2*d);const done=Math.hypot(s.x,s.z)<.001&&Math.abs(s.y-3.5)<.001&&Math.abs(s.heading)<.001;return {state:done?fresh():s,done};}
return {mapping,labels,inputs,fresh,step,returnHome};
});
