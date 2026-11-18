(()=>{
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)], C=BackhoeCore, F=BackhoeFlight, T=THREE;
const keys=new Set(), pointerKeys=new Map(), blockedKeys=new Set();
const sticks=[{x:0,y:0,id:null},{x:0,y:0,id:null}],stickElements=[];
const soil=new BackhoeSoil.SoilField(),capacity=.28,falling=[];
let cargo=0,deposited=0,terrainMesh,terrainLines,soilVersion=-1,dugFrame=0,dumpedFrame=0,groundContact=false,controlsVisible=true;
let pattern='vertical', running=false, paused=false, state=C.fresh(), speed=.45, lookX=0,lookY=-.16, guide=-1,guideTime=0,toastTimer, flight=null;
const order=['swingLeft','swingRight','armOut','armIn','boomUp','boomDown','bucketIn','bucketOut'];
const v=(x=0,y=0,z=0)=>new T.Vector3(x,y,z), lerp=T.MathUtils.lerp, smooth=t=>t*t*(3-2*t), clamp=T.MathUtils.clamp;
const mats=BackhoeVisuals.materials;
function box(parent,w,h,d,x,y,z,mat=mats.dark){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function cylinder(parent,a,b,r,mat=mats.dark,r2=r){const delta=b.clone().sub(a),m=new T.Mesh(new T.CylinderGeometry(r2,r,delta.length(),10),mat);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(v(0,1,0),delta.normalize());m.castShadow=true;parent.add(m);return m;}
function link(parent,a,b,width,depth,mat=mats.orange){const d=b.clone().sub(a),m=box(parent,width,depth,d.length(),0,0,0,mat);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(v(0,0,1),d.normalize());return m;}
function pin(parent,y,z,w=.55){return cylinder(parent,v(-w/2,y,z),v(w/2,y,z),.105,mats.steel);}
function label(parent,text,pos,size=1,color='#e8f1ec'){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#18252a';ctx.fillRect(0,0,512,128);ctx.fillStyle=color;ctx.font='bold 54px sans-serif';ctx.textAlign='center';ctx.fillText(text,256,84);const tex=new T.CanvasTexture(c),m=new T.Sprite(new T.SpriteMaterial({map:tex}));m.position.copy(pos);m.scale.set(size,size/4,1);parent.add(m);return m;}
function bucket(parent){
 const group=new T.Group();parent.add(group);
 const p=[[0,0],[.38,-.12],[.55,-.55],[.33,-.9],[-.58,-.85],[-.7,-.68],[-.12,-.48]];
 const shape=new T.Shape(p.map(a=>new T.Vector2(...a)));
 for(const x of [-.36,.32]){const geo=new T.ExtrudeGeometry(shape,{depth:.04,bevelEnabled:false});geo.rotateY(Math.PI/2);const m=new T.Mesh(geo,mats.dark);m.position.x=x;m.castShadow=true;group.add(m);}
 for(let i=0;i<4;i++){const a=p[i],b=p[i+1];link(group,v(0,a[1],-a[0]),v(0,b[1],-b[0]),.68,.055,mats.grey);}
 for(let i=0;i<5;i++){const tooth=box(group,.095,.075,.28,-.27+i*.135,-.83,.65,mats.steel);tooth.rotation.x=-.1;}
 pin(group,0,0,.85);return group;
}
function model(color){return BackhoeVisuals.machine(color);}
function pose(m,s){m.upper.rotation.y=s.yaw;m.boomPivot.rotation.x=s.boom;m.armPivot.rotation.x=s.arm;m.bucketPivot.rotation.x=.95+s.bucket;}
function renderer(canvas){const r=new T.WebGLRenderer({canvas,antialias:true,alpha:false});r.setPixelRatio(Math.min(devicePixelRatio,1.25));r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.05;return r;}
let render,scene,camera,machine,preview=[];
function buildTerrain(){
 const n=soil.n,pos=new Float32Array(n*n*3),colors=new Float32Array(n*n*3),indices=[];
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const k=j*n+i;pos[k*3]=i*soil.spacing-soil.size/2;pos[k*3+2]=j*soil.spacing-soil.size/2;if(i<n-1&&j<n-1){const a=k,b=k+1,c=k+n,d=c+1;indices.push(a,c,b,b,c,d);}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('color',new T.BufferAttribute(colors,3));geo.setIndex(indices);const uv=new Float32Array(n*n*2);for(let k=0;k<n*n;k++){uv[k*2]=(k%n)/(n-1);uv[k*2+1]=Math.floor(k/n)/(n-1);}geo.setAttribute('uv',new T.BufferAttribute(uv,2));
 terrainMesh=new T.Mesh(geo,BackhoeVisuals.groundMaterial(true));terrainMesh.receiveShadow=true;scene.add(terrainMesh);
 const lineIds=[];for(let j=0;j<n;j+=4)for(let i=0;i<n-1;i++)lineIds.push(j*n+i,j*n+i+1);for(let i=0;i<n;i+=4)for(let j=0;j<n-1;j++)lineIds.push(j*n+i,(j+1)*n+i);
 const lg=new T.BufferGeometry();lg.setAttribute('position',new T.BufferAttribute(new Float32Array(lineIds.length*3),3));terrainLines=new T.LineSegments(lg,new T.LineBasicMaterial({color:0x76694f,transparent:true,opacity:.06}));terrainLines.userData.ids=lineIds;scene.add(terrainLines);syncTerrain();
}
function syncTerrain(){
 if(soilVersion===soil.version)return;soilVersion=soil.version;const pos=terrainMesh.geometry.attributes.position,col=terrainMesh.geometry.attributes.color,c=new T.Color();
 for(let k=0;k<soil.heights.length;k++){const h=soil.heights[k];pos.setY(k,h);const patch=pos.getX(k)>-1.6&&pos.getX(k)<2.6&&pos.getZ(k)>-6.5&&pos.getZ(k)<-1.7;c.setHex(patch?0xcfbd9c:0xd8c9ad);if(h<-.025)c.setHex(0x9b714b).multiplyScalar(Math.max(.48,1+h*.18));else if(h>.025)c.setHex(0xc09a67);col.setXYZ(k,c.r,c.g,c.b);}
 pos.needsUpdate=col.needsUpdate=true;terrainMesh.geometry.computeVertexNormals();terrainMesh.geometry.computeBoundingSphere();const lp=terrainLines.geometry.attributes.position;terrainLines.userData.ids.forEach((id,k)=>lp.setXYZ(k,pos.getX(id),pos.getY(id)+.012,pos.getZ(id)));lp.needsUpdate=true;terrainLines.geometry.computeBoundingSphere();
}
const earthMaterial=new T.MeshStandardMaterial({color:0x9f783f,flatShading:true,roughness:1}),earthGeometry=new T.DodecahedronGeometry(1,0);
function dropEarth(volume,point){
 const mesh=new T.Mesh(earthGeometry,earthMaterial),r=Math.cbrt(volume)*.65;mesh.scale.set(r,r*.8,r);mesh.position.set(point.x+(Math.random()-.5)*.26,point.y+.15,point.z+(Math.random()-.5)*.16);mesh.castShadow=true;scene.add(mesh);falling.push({mesh,volume,vx:-Math.sin(state.yaw)*.3,vz:-Math.cos(state.yaw)*.3,vy:-.3});
}
function simulateSoil(weights,dt){
 const result=BackhoeSoil.excavate(C,soil,state,weights,dt,speed,cargo,capacity);state=result.state;cargo=result.cargo;dugFrame+=result.taken;groundContact=groundContact||result.contact;dumpedFrame+=result.dropped;if(result.dropped>0)dropEarth(result.dropped,result.tip);
 for(let i=falling.length-1;i>=0;i--){const p=falling[i];p.vy-=9.8*dt;p.mesh.position.x+=p.vx*dt;p.mesh.position.y+=p.vy*dt;p.mesh.position.z+=p.vz*dt;p.mesh.rotation.x+=dt*2;p.mesh.rotation.z+=dt;
  if(p.mesh.position.y<=soil.sample(p.mesh.position.x,p.mesh.position.z)+.03){const amount=soil.deposit(p.mesh.position.x,p.mesh.position.z,p.volume);deposited+=amount;scene.remove(p.mesh);falling.splice(i,1);}
 }
}
function updateSoilHud(){
 const ratio=clamp(cargo/capacity,0,1);machine.soilLoad.visible=ratio>.005;machine.soilLoad.scale.y=.07+ratio*.55;$('#soil-meter').value=ratio;$('#soil-amount').textContent=Math.round(ratio*100)+'%';$('#soil-total').textContent='排土 '+(deposited/capacity).toFixed(1)+'杯';
 $('#soil-status').textContent=dumpedFrame>0?'土を落としています — 地面に土が積もります':ratio>.98?'バケットがいっぱい。持ち上げて運ぼう':dugFrame>.00001?'土をすくっています — 穴が掘れました':groundContact?'接地中。アーム・バケットをかき込もう':ratio>.01?'土を保持中。上げる → 旋回 → ダンプ':falling.length?'土が地面に落ちています':'バケットを下げ、土に当ててかき込もう';
}
try{
 render=renderer($('#scene'));scene=new T.Scene();scene.background=new T.Color(0xa9c7cd);scene.fog=new T.Fog(0xa9c7cd,25,100);camera=new T.PerspectiveCamera(72,1,.025,170);machine=model();scene.add(machine.root);machine.upper.add(camera);camera.position.set(-.51,2.17,.28);camera.rotation.order='YXZ';
 BackhoeVisuals.site(scene);buildTerrain();
 for(const type of ['vertical','horizontal']){
  const r=renderer($('#preview-'+type)),s=new T.Scene();s.background=new T.Color(0x0b151c);const cam=new T.PerspectiveCamera(34,1,.1,60);cam.position.set(7,4.6,8);cam.lookAt(0,1,-.7);const m=model(type==='vertical'?0xe66c22:0x258cb6);pose(m,{yaw:0,boom:.47,arm:-1.5,bucket:.05});s.add(m.root);s.add(new T.HemisphereLight(0xc1d8e9,0x17222e,.7));const fill=new T.DirectionalLight(0x7798b7,1.1);fill.position.set(-5,3,-3);s.add(fill);const spot=new T.SpotLight(0xffdc9c,type===pattern?220:0,25,.57,.6,1.4);spot.position.set(0,8,2);spot.target.position.set(0,0,-.5);spot.castShadow=true;spot.shadow.mapSize.set(512,512);s.add(spot,spot.target);const floor=new T.Mesh(new T.CylinderGeometry(3.9,3.9,.12,48),new T.MeshStandardMaterial({color:0x26313a,roughness:.8}));floor.position.y=-.08;floor.receiveShadow=true;s.add(floor);
  const beam=new T.Mesh(new T.ConeGeometry(3.1,8,32,1,true),new T.MeshBasicMaterial({color:0xffdf9a,transparent:true,opacity:.045,side:T.DoubleSide,depthWrite:false}));beam.position.set(0,4,.2);beam.material.opacity=type===pattern?.04:0;s.add(beam);const rim=new T.Mesh(new T.TorusGeometry(3.7,.015,6,100),new T.MeshBasicMaterial({color:0x88b4c1}));rim.rotation.x=Math.PI/2;rim.position.y=.01;s.add(rim);preview.push({type,r,s,cam,spot,beam,m});
 }
}catch(err){const el=document.createElement('div');el.className='error';el.textContent='3D画面を開けませんでした。WebGL対応のEdge / ChromeでHTMLを開いてください。 '+err.message;document.body.appendChild(el);console.error(err);return;}
function toast(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,2600);}
function clearInput(){for(const k of keys)blockedKeys.add(k);keys.clear();pointerKeys.clear();drag=null;sticks.forEach((s,i)=>{s.x=s.y=0;s.id=null;const el=stickElements[i];if(el){el.classList.remove('engaged');el.querySelector('.stick-knob').style.transform='translate(0px,0px)';}});$$('.key').forEach(b=>b.classList.remove('held'));}
function activeKeys(){return new Set([...keys,...pointerKeys.values()]);}
const inputMode=new BackhoeInput.Mode({coarse:matchMedia('(pointer:coarse)').matches,fine:matchMedia('(pointer:fine)').matches,touchPoints:navigator.maxTouchPoints||0},()=>applyInputMode());
function updateInputHint(){const touch=inputMode.mode==='touch';$('#input-hint').textContent=(inputMode.preference==='auto'?'自動：':'固定：')+(touch?'指操作':'PC操作');$('#view-tip').textContent=touch?(controlsVisible?'左右の丸を指で操作 / 中央で見回す':'下の左右をなぞると操作 / 中央で見回す'):'WASD＋矢印キー / マウスでもレバー操作';}
function applyInputMode(){const touch=inputMode.mode==='touch';$('#game').classList.toggle('touch-mode',touch);$('#game').classList.toggle('pc-mode',!touch);updateInputHint();resize();}
addEventListener('pointerdown',e=>inputMode.down(e,performance.now()),{capture:true,passive:true});
for(const event of ['pointerup','pointercancel','lostpointercapture'])addEventListener(event,e=>queueMicrotask(()=>inputMode.up(e.pointerId)),{capture:true,passive:true});
addEventListener('pointermove',e=>inputMode.move(e,performance.now()),{capture:true,passive:true});
addEventListener('keydown',e=>{if(!e.isComposing&&!['Shift','Control','Alt','Meta','CapsLock'].includes(e.key))inputMode.keyboard();},{capture:true});
addEventListener('blur',()=>inputMode.cancel());
$('#input-preference').onchange=e=>{clearInput();inputMode.prefer(e.target.value);applyInputMode();};

for(const [i,id] of ['#touch-left','#touch-right'].entries()){
 const el=$(id),s=sticks[i];stickElements.push(el);
 function update(e){const r=el.getBoundingClientRect(),radius=r.width*.35,dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,axis=C.stickAxes(dx,dy,radius);s.x=axis.x;s.y=axis.y;const len=Math.hypot(dx,dy),scale=Math.min(1,radius/Math.max(1,len));el.querySelector('.stick-knob').style.transform='translate('+dx*scale+'px,'+dy*scale+'px)';}
 el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(paused||(flight&&!flight.controllable)||s.id!==null||document.querySelector('dialog[open]'))return;s.id=e.pointerId;el.setPointerCapture(e.pointerId);el.classList.add('engaged');update(e);});
 el.addEventListener('pointermove',e=>{if(s.id===e.pointerId){e.preventDefault();update(e);}});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(event,e=>{if(s.id!==e.pointerId)return;s.id=null;s.x=s.y=0;el.classList.remove('engaged');el.querySelector('.stick-knob').style.transform='translate(0px,0px)';});
}
function setControlsVisible(visible){clearInput();controlsVisible=visible;$('#game').classList.toggle('controls-hidden',!visible);$('#controls-toggle').textContent=visible?'操作を隠す':'操作を表示';$('#controls-toggle').setAttribute('aria-expanded',String(visible));$('#view-tip').textContent=visible?'左右の丸をドラッグ：レバー　中央をドラッグ：見回す':'画面下の左右をなぞる：レバー　中央：見回す';updateInputHint();resize();if(!visible)toast('操作表示を隠しました。下の左右で指操作は続けられます。');}
function makePad(id,defs){const el=$(id);for(const [key,dir,cap] of defs){const b=document.createElement('button');b.className='key';b.dataset.key=key;b.dataset.dir=dir;b.innerHTML='<kbd>'+cap+'</kbd><span></span>';b.addEventListener('pointerdown',e=>{e.preventDefault();if(paused||(flight&&!flight.controllable))return;b.setPointerCapture(e.pointerId);pointerKeys.set(e.pointerId,key);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,e=>pointerKeys.delete(e.pointerId));el.appendChild(b);}const center=document.createElement('div');center.className='lever-center';center.textContent='⊕';el.appendChild(center);}
makePad('#left-pad',[['KeyW','up','W'],['KeyA','left','A'],['KeyD','right','D'],['KeyS','down','S']]);makePad('#right-pad',[['ArrowUp','up','↑'],['ArrowLeft','left','←'],['ArrowRight','right','→'],['ArrowDown','down','↓']]);
function updateLabels(){const inFlight=!!flight,map=inFlight?F.mapping:C.mapping(pattern),labels=inFlight?F.labels:C.labels;$('#panel-title').textContent=inFlight?'飛行操作':'レバー操作';$$('.key').forEach(b=>{b.querySelector('span').textContent=labels[map[b.dataset.key]];b.setAttribute('aria-label',b.querySelector('kbd').textContent+' '+labels[map[b.dataset.key]]);});[['KeyW','KeyS','KeyA','KeyD'],['ArrowUp','ArrowDown','ArrowLeft','ArrowRight']].forEach((codes,i)=>codes.forEach((code,j)=>stickElements[i].querySelector('.stick-label.'+['up','down','left','right'][j]).textContent=labels[map[code]]));$$('[data-set-pattern]').forEach(b=>{const yes=b.dataset.setPattern===pattern;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',yes);});$$('.choice').forEach(b=>{const yes=b.dataset.pattern===pattern;b.classList.toggle('selected',yes);b.setAttribute('aria-pressed',yes);});$('#start').textContent=C.patterns[pattern].name+'で運転席へ →';$('#pattern-badge').textContent=C.patterns[pattern].name+' / '+(pattern==='vertical'?'C':'ISO');updateGuide();}
function setPattern(p){if(flight)return;clearInput();pattern=p;machine.paint.color.setHex(p==='vertical'?0xe66c22:0x258cb6);guide=-1;guideTime=0;updateLabels();if(running)toast(C.patterns[p].name+'に切替。キーを離してから操作してください。');}
function updateGuide(){const done=guide===order.length;$('#guide-toggle').textContent=guide<0?'練習を始める':done?'もう一度':'練習を終える';$('#guide-title').textContent=guide<0?'まずは自由に動かそう':done?'８方向、すべて確認できました。':(guide+1)+' / 8　'+C.labels[order[guide]];let key=Object.keys(C.mapping(pattern)).find(k=>C.mapping(pattern)[k]===order[guide]);let name=key?.replace('Key','').replace('ArrowUp','↑').replace('ArrowDown','↓').replace('ArrowLeft','←').replace('ArrowRight','→');const direction={KeyW:'前へ',KeyS:'手前へ',KeyA:'左へ',KeyD:'右へ',ArrowUp:'前へ',ArrowDown:'手前へ',ArrowLeft:'左へ',ArrowRight:'右へ'};$('#guide-hint').textContent=guide<0?'丸いレバーを指でずらすと操作できます。離せば停止。２本の指で左右同時に操作できます。':done?'もう一方の方式に切り替えて、同じ動きを試してみよう。':(key?.startsWith('Key')?'左':'右')+'レバーを'+direction[key]+'。キーなら '+name+'。動きを見ながら短く続けよう。';$('#guide-progress').hidden=guide<0||done;$('#guide-progress').value=0;$('#steps').innerHTML=guide<0?'':order.map((_,i)=>'<i class="'+(i<guide?'done':'')+'"></i>').join('');$$('.key').forEach(b=>b.classList.toggle('recommend',guide>=0&&!done&&b.dataset.key===key));}
function pause(on){clearInput();paused=on;$('#pause-overlay').hidden=!on;$('#pause').textContent=on?'再開':'一時停止';}
function resetPose(){clearInput();state=C.fresh();lookX=0;lookY=-.16;guideTime=0;}
function openDialog(id){clearInput();$(id).showModal();}
$$('.choice').forEach(b=>b.onclick=()=>setPattern(b.dataset.pattern));$$('[data-set-pattern]').forEach(b=>b.onclick=()=>setPattern(b.dataset.setPattern));
$('#start').onclick=()=>{running=true;$('#selection').hidden=true;$('#game').hidden=false;resetPose();pause(false);resize();$('#scene').focus();};
$('#pause').onclick=()=>pause(!paused);$('#resume').onclick=()=>pause(false);$('#reset').onclick=()=>{resetPose();toast('最初の姿勢に戻しました');};$('#look-reset').onclick=()=>{lookX=0;lookY=-.16;};$('#speed').onchange=e=>{speed=Number(e.target.value);clearInput();};
$('#controls-toggle').onclick=()=>setControlsVisible(!controlsVisible);
$('#panel-toggle').onclick=()=>{clearInput();const show=!$('#game').classList.contains('panel-open');$('#game').classList.toggle('panel-open',show);$('#panel-toggle').textContent=show?'閉じる':'詳しく';$('#panel-toggle').setAttribute('aria-expanded',String(show));if(show&&!controlsVisible)setControlsVisible(true);resize();};
for(const el of [$('#scene'),...stickElements])el.addEventListener('contextmenu',e=>e.preventDefault());

$('#soil-reset').onclick=()=>{clearInput();soil.reset();cargo=deposited=0;for(const p of falling)scene.remove(p.mesh);falling.length=0;resetPose();syncTerrain();updateSoilHud();toast('土と穴を最初の状態に戻しました');};
$('#help').onclick=$('#intro-help').onclick=()=>openDialog('#help-dialog');$('#secret').onclick=()=>openDialog('#secret-dialog');$$('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
$('#guide-toggle').onclick=()=>{guide=guide<0||guide===order.length?0:-1;guideTime=0;resetPose();updateGuide();};
$('#back-select').onclick=()=>{running=false;clearInput();pause(false);$('#game').hidden=true;$('#selection').hidden=false;guide=-1;updateLabels();resize();};
const controlCodes=new Set([...Object.keys(C.mapping('vertical')),'Space','KeyV']);
addEventListener('keydown',e=>{if(!running||!controlCodes.has(e.code)||document.querySelector('dialog[open]')||/SELECT|INPUT|TEXTAREA/.test(e.target.tagName))return;e.preventDefault();if(e.code==='Space'){if(!e.repeat)pause(!paused);return;}if(e.code==='KeyV'){lookX=0;lookY=-.16;return;}if(paused||(flight&&!flight.controllable)||blockedKeys.has(e.code))return;keys.add(e.code);});
addEventListener('keyup',e=>{keys.delete(e.code);blockedKeys.delete(e.code);});addEventListener('blur',()=>{clearInput();blockedKeys.clear();if(running)pause(true);});document.addEventListener('visibilitychange',()=>{if(document.hidden&&running)pause(true);});
let drag=null;$('#scene').addEventListener('pointerdown',e=>{if(paused||(flight&&!flight.controllable))return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};$('#scene').setPointerCapture(e.pointerId);});$('#scene').addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;lookX=clamp(lookX-(e.clientX-drag.x)*.003,-1.25,1.25);lookY=clamp(lookY-(e.clientY-drag.y)*.003,-.7,.5);drag.x=e.clientX;drag.y=e.clientY;});for(let event of ['pointerup','pointercancel','lostpointercapture'])$('#scene').addEventListener(event,()=>drag=null);
let savedState=null;
function startFlight(type){if(flight)return;$('#secret-dialog').close();pause(false);clearInput();savedState={...state};flight={type,t:0,clock:0,reverse:false,returning:false,controllable:false,air:F.fresh()};scene.attach(camera);$('#flight-ui').hidden=false;$('#game').classList.add('aircraft');$('.panel').inert=true;$('#secret').disabled=true;$('#view-label').textContent='秘密の格納庫 / 外観視点';$('.reticle').hidden=true;$$('[data-set-pattern]').forEach(b=>b.disabled=true);$('#return-machine').disabled=false;$('#return-machine').textContent='バックホーへ戻る';updateLabels();}
$$('[data-form]').forEach(b=>b.onclick=()=>startFlight(b.dataset.form));$('#return-machine').onclick=()=>{if(!flight||flight.returning||flight.reverse)return;clearInput();flight.controllable=false;$('.panel').inert=true;$('#game').classList.remove('flying');$('#return-machine').disabled=true;$('#return-machine').textContent='元の場所へ戻っています';if(flight.t>=8.5){flight.returning=true;}else{flight.reverse=true;}flight.t=Math.min(flight.t,8.5);};
function animateFlight(dt,time){
 const f=flight;if(!f)return;f.clock+=dt;const steps=Math.max(1,Math.ceil(dt/.05));let flightWeights={};if(f.controllable){flightWeights=F.inputs(activeKeys(),sticks);for(let i=0;i<steps;i++)f.air=F.step(f.air,flightWeights,dt/steps);}if(f.returning){let home;for(let i=0;i<steps;i++){home=F.returnHome(f.air,dt/steps);f.air=home.state;}if(home.done){f.returning=false;f.reverse=true;f.t=8.5;}}if(!f.reverse&&!f.returning&&!f.controllable&&f.t>=8.5){f.controllable=true;clearInput();$('.panel').inert=false;$('#game').classList.add('flying');toast('飛行操作へ。左レバー：移動・旋回／右：昇降・横移動');}f.t=clamp(f.t+(f.reverse?-dt:dt),0,10);
 const stage=(start,length)=>smooth(clamp((f.t-start)/length,0,1));
 const fold=stage(.3,2.7),deploy=stage(2,3.5),lift=stage(5.5,3)*3.5,p=stage(0,5.5);
 state.yaw=lerp(savedState.yaw,0,fold);state.boom=lerp(savedState.boom,1.28,fold);state.arm=lerp(savedState.arm,-2.48,fold);state.bucket=lerp(savedState.bucket,-.65,fold);pose(machine,state);
 machine.undercarriage.scale.set(1-.3*fold,1-.48*fold,1-.28*fold);
 machine.trackPods.forEach((track,i)=>{const sign=i===0?-1:1;track.rotation.z=sign*fold*.9;track.position.x=sign*(.84+.1*Math.sin(fold*Math.PI));});
 machine.cabin.position.x=lerp(-.5,0,fold);machine.cabin.position.y=-.52*fold;machine.cabin.scale.set(1-.7*fold,1-.75*fold,1-.55*fold);machine.boomPivot.scale.setScalar(1-.9*fold);
 machine.root.scale.setScalar(1-.45*deploy);const form=f.type==='heli'?machine.heli:machine.jet;machine.heli.visible=f.type==='heli';machine.jet.visible=f.type==='jet';form.scale.setScalar(Math.max(.001,deploy));
 const cruising=f.controllable||f.returning;machine.root.position.set(cruising?f.air.x:0,cruising?f.air.y:lift,cruising?f.air.z:0);machine.root.position.y+=Math.sin(time*1.5)*.025*(lift/3.5);machine.root.rotation.y=cruising?f.air.heading:0;machine.root.rotation.z=f.type==='jet'?((flightWeights.turnLeft||0)-(flightWeights.turnRight||0))*.12:0;
 machine.rotor.rotation.y+=dt*(1+stage(4,2)*38);machine.tailRotor.rotation.x+=dt*(2+stage(4,2)*50);machine.rotorDisk.material.opacity=.12*stage(5,2);machine.rotorBlades.forEach(b=>b.scale.x=.18+.82*stage(2.6,2.5));machine.tail.scale.z=.35+.65*deploy;machine.tailRotor.position.z=lerp(1.44,4.12,deploy);
 for(let i=0;i<2;i++){machine.wings[i].rotation.z=(i===0?-1:1)*(1-deploy)*Math.PI*.49;machine.exhausts[i].scale.y=(.15+stage(4.5,2)*1.1)*(1+Math.sin(time*29+i)*.12);machine.exhausts[i].material.opacity=stage(4.5,2)*.6;}
 const angle=(cruising?f.air.heading:0)+.65,dist=cruising?7.4:9.6;const target=machine.root.position;camera.position.set(target.x+Math.sin(angle)*dist,target.y+(cruising?4.2:4.9),target.z+Math.cos(angle)*dist);camera.lookAt(target.x,target.y+.7,target.z);
 const stageName=f.t<1.5?'01 / アーム・バケット収納':f.t<3?'02 / キャビン・足回り収納':f.t<5.5?'03 / '+(f.type==='heli'?'ローター展開':'主翼・尾翼を展開'):f.t<8.5?'04 / 離陸シーケンス':f.type==='heli'?'HELICOPTER / 自由飛行':'FIGHTER / 自由飛行';
 const homeDistance=Math.hypot(f.air.x,f.air.z);$('#flight-name').textContent=f.returning?'AUTO RETURN / 元の位置へ帰還':f.reverse?'RETURN / バックホーへ復帰中':stageName;const actions=Object.keys(flightWeights).filter(k=>flightWeights[k]>.025);$('#motion').textContent=f.returning?'自動帰還中 / あと '+homeDistance.toFixed(1)+' m':f.reverse?'元の位置で機体を復元しています':f.t<5.5?'TRANSFORM / 機構を展開中':f.controllable?(actions.length?actions.map(k=>F.labels[k]).join(' ＋ '):'飛行レバー中立 / 指・キーで移動'):'離陸シーケンス';$('#flight-progress-bar').style.width=(clamp(f.t/8.5,0,1)*100)+'%';$('#flight-altitude').textContent=(cruising?f.air.y:lift).toFixed(1)+' m';$('#flight-position').textContent='X '+f.air.x.toFixed(1)+' / Z '+f.air.z.toFixed(1);$('#flight-help').hidden=!f.controllable;

 if(f.reverse&&f.t<=0){flight=null;state={...savedState};machine.root.position.set(0,0,0);machine.root.scale.setScalar(1);machine.root.rotation.set(0,0,0);machine.undercarriage.scale.set(1,1,1);machine.undercarriage.rotation.set(0,0,0);machine.trackPods.forEach((q,i)=>{q.rotation.set(0,0,0);q.position.x=i===0?-.84:.84;});machine.cabin.position.set(-.5,0,0);machine.cabin.scale.set(1,1,1);machine.boomPivot.scale.setScalar(1);machine.heli.visible=machine.jet.visible=false;machine.upper.add(camera);camera.position.set(-.51,2.17,.28);camera.rotation.order='YXZ';lookX=0;lookY=-.16;$('#flight-ui').hidden=true;$('#game').classList.remove('aircraft','flying');$('#flight-help').hidden=true;updateLabels();$('.panel').inert=false;$('#secret').disabled=false;$('#view-label').textContent='運転席 / 主観視点';$('.reticle').hidden=false;$$('[data-set-pattern]').forEach(b=>b.disabled=false);pose(machine,state);clearInput();toast('バックホーに復帰。土と穴もそのままです。');}
}
function resize(){const compact=inputMode.mode==='touch'||innerWidth<=1100;$('#game').classList.toggle('compact',compact);if(running){const el=$('#viewport'),w=el.clientWidth,h=el.clientHeight;render.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<h?Math.min(108,72+(1-w/h)*64):72;camera.updateProjectionMatrix();}else for(const p of preview){const w=p.r.domElement.clientWidth,h=p.r.domElement.clientHeight;p.r.setSize(w,h,false);p.cam.aspect=w/h;p.cam.updateProjectionMatrix();}}
addEventListener('resize',()=>{clearInput();resize();});if(window.visualViewport)visualViewport.addEventListener('resize',()=>{clearInput();resize();});new ResizeObserver(()=>resize()).observe($('#viewport'));
$('#speed').value=String(speed);updateLabels();applyInputMode();let last=performance.now(),elapsed=0,frameCount=0;
function frame(now){const dt=Math.min(1,Math.max(0,(now-last)/1000));last=now;const dialog=!!document.querySelector('dialog[open]');if(!paused&&!dialog)elapsed+=dt;
 if(!running){for(const p of preview){const selected=p.type===pattern;p.spot.intensity=lerp(p.spot.intensity,selected?220:0,.12);p.beam.material.opacity=lerp(p.beam.material.opacity,selected?.045:0,.12);p.r.render(p.s,p.cam);}return;}
 const active=activeKeys(),weights=paused||flight||dialog?{}:C.inputs(pattern,active,sticks),acts=Object.keys(weights).filter(a=>weights[a]>.025);dugFrame=dumpedFrame=0;groundContact=false;
 if(flight){animateFlight(paused||dialog?0:dt,elapsed);}else{
  if(!paused&&!dialog){const steps=Math.max(1,Math.ceil(dt/.05));for(let i=0;i<steps;i++)simulateSoil(weights,dt/steps);}pose(machine,state);camera.rotation.set(lookY,lookX,0,'YXZ');syncTerrain();updateSoilHud();
  for(let i=0;i<2;i++){const left=i===0;machine.joysticks[i].rotation.x=(((active.has(left?'KeyS':'ArrowDown')?1:0)-(active.has(left?'KeyW':'ArrowUp')?1:0))+sticks[i].y)*.22;machine.joysticks[i].rotation.z=(((active.has(left?'KeyA':'ArrowLeft')?1:0)-(active.has(left?'KeyD':'ArrowRight')?1:0))-sticks[i].x)*.22;}
  $('#motion').textContent=paused?'一時停止中':acts.length?acts.map(a=>C.labels[a]).join(' ＋ '):'レバー中立 / 指・キーで操作';
  if(guide>=0&&guide<order.length&&!paused&&!dialog){if(acts.length===1&&acts[0]===order[guide])guideTime+=dt;else if(acts.length)guideTime=0;$('#guide-progress').value=guideTime;if(guideTime>=.7){guide++;guideTime=0;clearInput();updateGuide();if(guide===order.length)toast('８方向の練習完了！');}}
 }
 $('#heading').textContent='旋回 '+Math.abs(Math.round(state.yaw*180/Math.PI))+'° '+(state.yaw>.01?'左':state.yaw<-.01?'右':'');$$('.key').forEach(b=>b.classList.toggle('held',active.has(b.dataset.key)&&!paused&&(!flight||flight.controllable)&&!dialog));render.render(scene,camera);frameCount++;
}
// A 30 Hz timer keeps the training clock moving in embedded WebViews that
// suspend requestAnimationFrame while the preview is temporarily occluded.
setInterval(()=>frame(performance.now()),1000/30);
// Read-only diagnostics for prototype verification.
window.backhoeDiagnostics=()=>({pattern,state:{...state},running,paused,flight:flight?{...flight}:null,guide,pressed:[...activeKeys()],sticks:sticks.map(s=>({...s})),controlsVisible,soil:{cargo,deposited,deepest:soil.deepest(),volume:soil.volume(),falling:falling.reduce((s,p)=>s+p.volume,0)},frameCount,view:flight?'external':'cockpit',camera:camera.position.toArray(),webgl:!!render.getContext(),inputMode:{mode:inputMode.mode,preference:inputMode.preference},version:'field-edition-03.1'});
})();
