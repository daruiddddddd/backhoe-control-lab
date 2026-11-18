(function(root){
  'use strict';
  const patterns={
    vertical:{name:'縦旋回',sub:'Cパターン',keys:{KeyW:'swingRight',KeyS:'swingLeft',KeyA:'armOut',KeyD:'armIn'}},
    horizontal:{name:'横旋回',sub:'ISO / クボタパターン',keys:{KeyW:'armOut',KeyS:'armIn',KeyA:'swingLeft',KeyD:'swingRight'}}
  };
  const common={ArrowUp:'boomDown',ArrowDown:'boomUp',ArrowLeft:'bucketIn',ArrowRight:'bucketOut'};
  const labels={swingRight:'右旋回',swingLeft:'左旋回',armOut:'アーム伸ばし',armIn:'アームかき込み',boomDown:'ブーム下げ',boomUp:'ブーム上げ',bucketIn:'バケットかき込み',bucketOut:'バケットダンプ'};
  const limits={boom:[0.08,1.2],arm:[-2.38,-0.48],bucket:[-0.7,1.65]};
  const fresh=()=>({yaw:0,boom:0.68,arm:-1.75,bucket:0.1});
  function mapping(pattern){return {...patterns[pattern].keys,...common};}
  function actions(pattern,keys){const m=mapping(pattern);return [...keys].map(k=>m[k]).filter(Boolean);}
  function stickAxes(dx,dy,radius=50){
    const length=Math.hypot(dx,dy),raw=Math.min(1,length/Math.max(1,radius));
    if(raw<=.16)return {x:0,y:0};
    const amount=(raw-.16)/.84;return {x:dx/length*amount,y:dy/length*amount};
  }
  function inputs(pattern,keys,sticks=[]){
    const map=mapping(pattern),out={};for(const key of keys)if(map[key])out[map[key]]=1;
    sticks.forEach((s,i)=>{if(!s)return;const codes=i===0?['KeyA','KeyD','KeyW','KeyS']:['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];
      for(const [code,value] of [[codes[0],-s.x],[codes[1],s.x],[codes[2],-s.y],[codes[3],s.y]])if(value>0)out[map[code]]=Math.max(out[map[code]]||0,Math.min(1,value));
    });return out;
  }
  function bucketPoint(s,local={x:0,y:-.83,z:.7}){
    const a=s.boom+s.arm,b=a+.95+s.bucket;
    const x=.46+local.x,y=1.16+2.65*Math.sin(s.boom)+2*Math.sin(a)+local.y*Math.cos(b)-local.z*Math.sin(b);
    const z=-.63-2.65*Math.cos(s.boom)-2*Math.cos(a)+local.y*Math.sin(b)+local.z*Math.cos(b);
    return {x:x*Math.cos(s.yaw)+z*Math.sin(s.yaw),y,z:-x*Math.sin(s.yaw)+z*Math.cos(s.yaw),angle:b};
  }
  function step(s,acts,dt,speed=0.45){
    dt=Math.min(0.05,Math.max(0,dt)); const has=x=>Array.isArray(acts)?(acts.includes(x)?1:0):Math.max(0,Math.min(1,acts[x]||0));
    s.yaw+=(has('swingLeft')-has('swingRight'))*dt*speed*0.7;
    s.boom+=(has('boomUp')-has('boomDown'))*dt*speed*0.48;
    s.arm+=(has('armOut')-has('armIn'))*dt*speed*0.65;
    s.bucket+=(has('bucketOut')-has('bucketIn'))*dt*speed*1.0;
    for(const k of Object.keys(limits))s[k]=Math.max(limits[k][0],Math.min(limits[k][1],s[k]));
    s.yaw=Math.atan2(Math.sin(s.yaw),Math.cos(s.yaw)); return s;
  }
  const api={patterns,common,labels,limits,fresh,mapping,actions,stickAxes,inputs,bucketPoint,step};
  root.BackhoeCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis==='undefined'?this:globalThis);
