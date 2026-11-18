/* Procedural, offline artwork. All geometry and textures are generated locally. */
(()=>{
'use strict';
const T=THREE,V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const material=(color,roughness=.55,metalness=.12)=>new T.MeshStandardMaterial({color,roughness,metalness});
const M={orange:material(0xe66c22,.36,.28),dark:material(0x202a31,.47,.3),grey:material(0x657079,.47,.45),steel:material(0xc4d4d9,.23,.85),rubber:material(0x161b1d,.98,0),glass:new T.MeshStandardMaterial({color:0x76b9c3,transparent:true,opacity:.16,roughness:.18,metalness:.3,depthWrite:false,side:T.DoubleSide}),cyan:new T.MeshStandardMaterial({color:0x84dfe4,emissive:0x36bdd5,emissiveIntensity:1.4}),white:material(0xe4e5dc,.55,.15),yellow:material(0xf4b63e,.45,.2),soil:material(0x8c633b,1,0),blue:material(0x375566,.75,.15)};
function mesh(p,g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;}
function box(p,w,h,d,x,y,z,m=M.dark){return mesh(p,new T.BoxGeometry(w,h,d),m,x,y,z);}
function tube(p,a,b,r,m=M.dark,r2=r){const d=b.clone().sub(a),o=mesh(p,new T.CylinderGeometry(r2,r,d.length(),12),m);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());return o;}
function round(p,w,h,d,x,y,z,m=M.orange,r=.06){
 r=Math.min(r,w/3,h/3);const s=new T.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
 const g=new T.ExtrudeGeometry(s,{depth:Math.max(.01,d-.03),bevelEnabled:true,bevelThickness:.015,bevelSize:.015,bevelSegments:1,steps:1,curveSegments:3});g.translate(0,0,-d/2+.015);return mesh(p,g,m,x,y,z);
}
function line(p,pts,r=.016,m=M.rubber){return mesh(p,new T.TubeGeometry(new T.CatmullRomCurve3(pts),16,r,6,false),m);}
function canvasTexture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}
function plaque(p,text,w,h,x,y,z,bg='#17272e',fg='#dce9e8',ry=0){const tex=canvasTexture(512,128,(c,W,H)=>{c.fillStyle=bg;c.fillRect(0,0,W,H);c.fillStyle=fg;c.font='700 55px Arial';c.textAlign='center';c.fillText(text,W/2,85);});const o=mesh(p,new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:tex,roughness:.65}),x,y,z);o.rotation.y=ry;return o;}
let seed=411;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const groundTexture=canvasTexture(512,512,(c,w,h)=>{c.fillStyle='#b1a18b';c.fillRect(0,0,w,h);for(let i=0;i<18000;i++){const q=Math.floor(80+rand()*95);c.fillStyle='rgba('+q+','+(q*.88|0)+','+(q*.7|0)+','+(.07+rand()*.3)+')';const r=rand()*2.4;c.fillRect(rand()*w,rand()*h,r+.4,r+.4);}for(let i=0;i<65;i++){c.strokeStyle='#554b3912';c.beginPath();let x=rand()*w,y=rand()*h;c.moveTo(x,y);c.lineTo(x+rand()*40,y+rand()*4);c.stroke();}});
groundTexture.wrapS=groundTexture.wrapT=T.RepeatWrapping;
function groundMaterial(vertexColors=false){const t=groundTexture.clone();t.repeat.set(vertexColors?9:100,vertexColors?9:100);return new T.MeshStandardMaterial({map:t,vertexColors,roughness:1,color:vertexColors?0xffffff:0xc8bda9});}
function pin(p,y,z,w=.52,r=.1){tube(p,V(-w/2,y,z),V(w/2,y,z),r,M.dark);for(let side of [-1,1]){tube(p,V(side*w/2,y,z),V(side*(w/2+.026),y,z),r*.65,M.steel);}}
function section(p,points,width,m){const shape=new T.Shape(points.map(([z,y])=>new T.Vector2(-z,y)));const g=new T.ExtrudeGeometry(shape,{depth:width,bevelEnabled:true,bevelThickness:.015,bevelSize:.02,bevelSegments:1});g.rotateY(Math.PI/2);g.translate(-width/2,0,0);return mesh(p,g,m);}
const displayTex=canvasTexture(512,384,c=>{
 c.fillStyle='#091b23';c.fillRect(0,0,512,384);c.fillStyle='#81dadd';c.font='bold 25px Arial';c.fillText('CONTROL LAB',28,45);c.fillStyle='#2a444e';c.fillRect(24,65,464,2);
 c.lineWidth=17;c.strokeStyle='#304954';c.beginPath();c.arc(256,204,104,Math.PI*.8,Math.PI*2.2);c.stroke();c.strokeStyle='#ffb54c';c.beginPath();c.arc(256,204,104,Math.PI*.8,Math.PI*1.95);c.stroke();
 c.fillStyle='#f1f5ef';c.font='bold 55px Arial';c.textAlign='center';c.fillText('READY',256,213);c.fillStyle='#88c7ce';c.font='23px Arial';c.fillText('HYDRAULIC / ONLINE',256,252);c.font='22px Arial';c.fillText('C / ISO       RX-506 REF.',256,343);
});
function machine(color=0xe66c22){
 const paint=M.orange.clone();paint.color.setHex(color);
 const root=new T.Group(),undercarriage=new T.Group(),upper=new T.Group();root.add(undercarriage,upper);const trackPods=[];
 round(undercarriage,1.65,.25,2.1,0,.38,0,M.grey);tube(upper,V(0,.48,0),V(0,.74,0),.52,M.dark);
 for(const sign of [-1,1]){const track=new T.Group();track.position.set(sign*.84,.39,0);undercarriage.add(track);trackPods.push(track);
  const s=new T.Shape();s.moveTo(-.85,-.29);s.lineTo(.85,-.29);s.absarc(.85,0,.29,-Math.PI/2,Math.PI/2,false);s.lineTo(-.85,.29);s.absarc(-.85,0,.29,Math.PI/2,Math.PI*1.5,false);
  const hole=new T.Path();hole.moveTo(-.83,-.2);hole.lineTo(.83,-.2);hole.absarc(.83,0,.2,-Math.PI/2,Math.PI/2,false);hole.lineTo(-.83,.2);hole.absarc(-.83,0,.2,Math.PI/2,Math.PI*1.5,false);s.holes.push(hole);
  const g=new T.ExtrudeGeometry(s,{depth:.4,bevelEnabled:false,curveSegments:9});g.rotateY(Math.PI/2);g.translate(-.2,0,0);mesh(track,g,M.rubber);
  for(const signY of [-1,1])for(let z=-.82;z<=.83;z+=.18)box(track,.46,.038,.13,0,signY*.29,z,M.dark);
  for(const end of [-1,1])for(let i=0;i<7;i++){const t=-Math.PI/2+i*Math.PI/6;const q=box(track,.46,.038,.13,0,Math.sin(t)*.29,end*(.85+Math.cos(t)*.29),M.dark);q.rotation.x=end*(Math.PI/2-t);}
  for(let z=-.83;z<=.84;z+=.415){tube(track,V(-.21,0,z),V(.21,0,z),.19,M.grey);tube(track,V(sign*.22,0,z),V(sign*.24,0,z),.085,M.dark);}
 }
 round(upper,1.82,.35,1.85,0,.84,0);round(upper,1.7,.7,.63,0,1.22,.85,paint,.16);round(upper,.63,.57,1.25,.61,1.2,.15,paint);
 for(let i=0;i<8;i++)box(upper,.012,.32,.035,.945,1.27,.12+i*.074,M.dark);
 plaque(upper,'CONTROL LAB',1.15,.2,0,1.28,1.19);plaque(upper,'RX-506 / REF',.5,.125,.58,1.49,-.49);
 for(const x of [-.72,.72]){box(upper,.17,.07,.035,x,1.02,1.19,M.rubber);box(upper,.11,.04,.04,x,1.03,1.22,new T.MeshStandardMaterial({color:0xc64824,emissive:0x771500}));}
 const cabin=new T.Group();cabin.position.x=-.5;upper.add(cabin);
 round(cabin,1.16,.11,1.6,.1,1,0,M.grey);round(cabin,1.18,.11,1.65,.1,2.55,-.02,M.dark);
 for(const x of [-.48,.68])for(const z of [-.8,.76])tube(cabin,V(x,1,z),V(x*.94,2.52,z+(z<0?.07:0)),.035,M.dark);
 for(const y of [1.25,2.4])tube(cabin,V(-.47,y,-.8),V(.67,y,-.8),.026,M.dark);
 for(const z of [-.78,.74])tube(cabin,V(-.45,2.49,z),V(.64,2.49,z),.04,M.dark);
 // Glazing remains optically clear in front of the operator.
 box(cabin,1.07,1.07,.007,.1,1.87,.755,M.glass);const sideWindow=box(cabin,.007,1.14,1.36,-.47,1.85,0,M.glass);
 tube(cabin,V(-.49,1.3,.68),V(-.49,2.12,.68),.025,M.steel);tube(cabin,V(-.5,1.72,.25),V(-.5,1.72,.55),.025,M.dark);
 for(const x of [-.37,.37]){round(cabin,.21,.34,.77,x,1.21,.02,M.grey);round(cabin,.21,.075,.52,x,1.41,.13,M.rubber);}
 round(cabin,.51,.12,.52,0,1.23,.28,M.rubber);round(cabin,.51,.59,.11,0,1.57,.56,M.rubber);
 for(let i=0;i<5;i++)box(cabin,.44,.012,.015,0,1.39+i*.09,.493,M.grey);
 round(cabin,.28,.16,.12,0,1.96,.56,M.dark);for(let i=0;i<9;i++)box(cabin,.9,.007,.012,.02,1.066,-.63+i*.12,M.rubber);
 const joysticks=[];
 for(const x of [-.35,.35]){for(let i=0;i<4;i++)round(cabin,.17-i*.018,.026,.16-i*.016,x,1.42+i*.031,-.19,M.rubber,.015);const j=new T.Group();j.position.set(x,1.51,-.19);cabin.add(j);tube(j,V(),V(0,.22,-.04),.022,M.steel);const grip=round(j,.075,.17,.075,0,.26,-.045,M.rubber,.025);grip.rotation.x=-.16;box(j,.03,.012,.025,0,.348,-.05,M.yellow);joysticks.push(j);}
 for(const x of [-.11,.11]){tube(cabin,V(x,1.07,-.51),V(x,1.51,-.61),.013,M.steel);round(cabin,.15,.035,.07,x,1.52,-.61,M.rubber,.01);box(cabin,.14,.035,.26,x,1.075,-.62,M.dark);}
 round(cabin,.26,.31,.055,.57,1.43,-.65,M.dark,.025);mesh(cabin,new T.PlaneGeometry(.205,.205),new T.MeshBasicMaterial({map:displayTex}),.57,1.455,-.617);
 for(const x of [.5,.57,.64])mesh(cabin,new T.SphereGeometry(.013,8,5),x===.57?M.cyan:M.grey,x,1.32,-.609);
 for(let i=0;i<5;i++)box(cabin,.025,.025,.03,.39,1.43,.05+i*.09,i===0?M.yellow:M.dark);
 tube(cabin,V(.62,1.3,-.78),V(.63,1.95,-.78),.007,M.dark);tube(cabin,V(.63,1.95,-.78),V(.3,2.12,-.78),.007,M.dark);
 round(cabin,.1,.06,.24,-.37,1.5,.3,material(0xb23d2e));
 for(const x of [-.34,.51]){round(cabin,.18,.09,.12,x,2.55,-.85,M.dark,.02);box(cabin,.145,.047,.012,x,2.55,-.918,M.white);}
 tube(cabin,V(-.32,2.6,.53),V(-.32,2.69,.53),.065,M.rubber);const beacon=mesh(cabin,new T.CylinderGeometry(.057,.067,.12,12),new T.MeshStandardMaterial({color:0xffa922,emissive:0xea6d12,emissiveIntensity:.6}),-.32,2.75,.53);
 // Boom and arm use the same pivots and lengths as the verified control core.
 const boomPivot=new T.Group();boomPivot.position.set(.46,1.16,-.63);upper.add(boomPivot);
 section(boomPivot,[[.12,-.17],[-.45,-.05],[-1.17,.18],[-2.66,-.15],[-2.72,.13],[-1.2,.48],[-.1,.16]],.29,paint);pin(boomPivot,0,0);pin(boomPivot,0,-2.65,.46);
 tube(boomPivot,V(.17,.11,-.4),V(.17,.4,-1.58),.064,M.grey);tube(boomPivot,V(.17,.4,-1.58),V(.17,.12,-2.46),.032,M.steel);
 for(const x of [-.1,-.045])line(boomPivot,[V(x,.17,-.1),V(x,.47,-.7),V(x,.56,-1.2),V(x,.29,-2.15),V(x,.16,-2.47)],.014);
 for(const z of [-.5,-1.2,-2.1])box(boomPivot,.18,.025,.08,-.02,z===-1.2?.54:.28,z,M.grey);
 plaque(boomPivot,'CONTROL LAB',1.03,.15,.166,.19,-1.35,'#e97528','#202b30',Math.PI/2);
 const armPivot=new T.Group();armPivot.position.z=-2.65;boomPivot.add(armPivot);section(armPivot,[[.08,-.13],[-1.6,-.13],[-2.08,-.075],[-2.05,.13],[-.3,.19],[.08,.12]],.22,paint);pin(armPivot,0,-2,.44,.08);
 tube(armPivot,V(0,.2,-.1),V(0,.25,-1.25),.054,M.grey);tube(armPivot,V(0,.25,-1.25),V(0,.13,-1.85),.026,M.steel);
 line(armPivot,[V(-.13,.15,-.1),V(-.18,.28,-.37),V(-.16,.21,-1.4),V(-.13,.12,-1.75)],.014);
 const bucketPivot=new T.Group();bucketPivot.position.z=-2;armPivot.add(bucketPivot);
 const pts=[[0,0],[.38,-.12],[.55,-.55],[.33,-.9],[-.58,-.85],[-.7,-.68],[-.12,-.48]],shape=new T.Shape(pts.map(p=>new T.Vector2(...p)));
 for(const x of [-.36,.32]){const g=new T.ExtrudeGeometry(shape,{depth:.04,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:1});g.rotateY(Math.PI/2);mesh(bucketPivot,g,M.dark,x,0,0);}
 for(let i=0;i<4;i++){const a=V(0,pts[i][1],-pts[i][0]),b=V(0,pts[i+1][1],-pts[i+1][0]),d=b.clone().sub(a),q=box(bucketPivot,.68,.05,d.length(),0,0,0,M.grey);q.position.copy(a).add(b).multiplyScalar(.5);q.quaternion.setFromUnitVectors(V(0,0,1),d.normalize());}
 for(let i=0;i<5;i++){const tooth=box(bucketPivot,.095,.075,.28,-.27+i*.135,-.83,.65,M.steel);tooth.rotation.x=-.1;}
 pin(bucketPivot,0,0,.81,.085);for(const x of [-.24,.24])tube(bucketPivot,V(x,.05,0),V(x,-.25,-.22),.028,M.steel);
 const soilLoad=mesh(bucketPivot,new T.DodecahedronGeometry(.43,1),M.soil,0,-.61,.03);soilLoad.scale.set(.78,.35,1);soilLoad.visible=false;
 const heli=new T.Group(),jet=new T.Group();upper.add(heli,jet);heli.visible=jet.visible=false;
 const canopyMat=new T.MeshStandardMaterial({color:0x184556,metalness:.65,roughness:.18});
 function shell(p){const hull=mesh(p,new T.SphereGeometry(1,12,8),paint,0,1.28,-.24);hull.scale.set(.72,.57,1.64);const canopy=mesh(p,new T.SphereGeometry(1,12,8,0,Math.PI*2,0,Math.PI*.64),canopyMat,0,1.48,-.69);canopy.scale.set(.58,.54,1.08);tube(p,V(0,1.64,-1.68),V(0,2.02,-.5),.023,M.grey);for(const x of [-.67,.67])box(p,.05,.12,.85,x,1.23,-.5,M.white);}
 shell(heli);shell(jet);
 const tail=new T.Group();heli.add(tail);tube(tail,V(0,1.3,.6),V(0,1.72,4.3),.23,paint,.08);section(tail,[[3.72,1.65],[4.4,1.65],[4.35,2.75],[4.0,2.62]],.08,M.dark);box(tail,1.4,.07,.36,0,1.7,3.65,paint);
 tube(heli,V(0,1.7,.1),V(0,2.8,.1),.065,M.steel);round(heli,.4,.17,.55,0,2.51,.1,M.dark);const rotor=new T.Group();rotor.position.set(0,2.84,.1);heli.add(rotor);const rotorBlades=[];
 for(let i=0;i<4;i++){const blade=new T.Group();blade.rotation.y=i*Math.PI/2;rotor.add(blade);box(blade,3.25,.034,.18,1.66,0,0,M.dark);box(blade,.22,.037,.18,3.15,0,0,M.yellow);rotorBlades.push(blade);}tube(rotor,V(0,-.07,0),V(0,.08,0),.17,M.grey);
 const rotorDisk=mesh(heli,new T.RingGeometry(.45,3.3,64),new T.MeshBasicMaterial({color:0xcee8e8,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}),0,2.84,.1);rotorDisk.rotation.x=-Math.PI/2;
 const tailRotor=new T.Group();tailRotor.position.set(.16,2.05,4.12);heli.add(tailRotor);box(tailRotor,.04,1.05,.075,0,0,0,M.dark);box(tailRotor,.04,.075,1.05,0,0,0,M.dark);tube(tailRotor,V(-.03,0,0),V(.05,0,0),.1,M.steel);
 for(const x of [-.82,.82]){line(heli,[V(x,.25,1.4),V(x,.22,-.9),V(x,.39,-1.4)],.045,M.grey);for(const z of [-.65,.7])tube(heli,V(x,.25,z),V(x*.75,.91,z),.035,M.steel);}
 const wings=[];for(const sign of [-1,1]){const wing=new T.Group();jet.add(wing);wing.position.set(sign*.5,1.1,.15);const sh=new T.Shape([new T.Vector2(0,-.8),new T.Vector2(3.05,1.2),new T.Vector2(3.3,1.74),new T.Vector2(.02,.95)]);const g=new T.ExtrudeGeometry(sh,{depth:.065,bevelEnabled:false});g.rotateX(Math.PI/2);g.scale(sign,1,1);const w=mesh(wing,g,paint);box(wing,.13,.04,.55,sign*2.7,.07,1.25,M.white);wings.push(wing);
  const stabilizer=section(jet,[[.6,1.23],[1.9,1.2],[1.6,2.5],[1.15,2.65]],.07,M.dark);stabilizer.position.x=sign*.58;stabilizer.rotation.z=-sign*.23;
 }
 const nose=mesh(jet,new T.ConeGeometry(.55,2.3,6),M.grey,0,1.26,-2.0);nose.rotation.x=-Math.PI/2;
 box(jet,2.5,.065,.6,0,1.15,1.7,paint);
 const exhausts=[];for(const x of [-.43,.43]){tube(jet,V(x,1.14,.5),V(x,1.14,1.9),.24,M.dark);tube(jet,V(x,1.14,1.87),V(x,1.14,2.04),.2,M.steel);tube(jet,V(x,1.14,2.03),V(x,1.14,2.06),.15,M.cyan);const flame=mesh(jet,new T.ConeGeometry(.145,1.15,12,1,true),new T.MeshBasicMaterial({color:0x66cfff,transparent:true,opacity:.65,depthWrite:false,side:T.DoubleSide}),x,1.14,2.57);flame.rotation.x=Math.PI/2;exhausts.push(flame);}
 return {root,upper,undercarriage,cabin,boomPivot,armPivot,bucketPivot,soilLoad,joysticks,heli,jet,rotor,tailRotor,wings,trackPods,rotorBlades,rotorDisk,tail,beacon,exhausts,paint};
}
function site(scene){
 const sky=mesh(scene,new T.SphereGeometry(140,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color(0x79a8c2)},bottom:{value:new T.Color(0xe8d2b2)}},vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 vP;uniform vec3 top;uniform vec3 bottom;void main(){float h=clamp(normalize(vP).y,0.0,1.0);gl_FragColor=vec4(mix(bottom,top,pow(h,.55)),1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}));sky.castShadow=false;sky.receiveShadow=false;
 const sun=mesh(scene,new T.SphereGeometry(2.4,16,8),new T.MeshBasicMaterial({color:0xffedbc}),-55,35,-85);sun.castShadow=false;
 scene.fog=new T.Fog(0xc0bca8,32,115);scene.add(new T.HemisphereLight(0xc5e2f6,0x6e5740,2.15));const light=new T.DirectionalLight(0xffdfad,3.7);light.position.set(-16,24,-24);light.castShadow=true;light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:1,far:75});light.shadow.bias=-.0003;light.shadow.normalBias=.018;scene.add(light);const fill=new T.DirectionalLight(0xa8d4e9,.55);fill.position.set(12,8,10);scene.add(fill);
 const groundShape=new T.Shape([new T.Vector2(-120,-120),new T.Vector2(120,-120),new T.Vector2(120,120),new T.Vector2(-120,120)]);groundShape.holes.push(new T.Path([new T.Vector2(-9,-9),new T.Vector2(-9,9),new T.Vector2(9,9),new T.Vector2(9,-9)]));const ground=mesh(scene,new T.ShapeGeometry(groundShape),groundMaterial());ground.rotation.x=-Math.PI/2;ground.castShadow=false;
 // A clear working area, with the site detail placed beyond the digging field.
 for(const x of [-3,4])for(const z of [-7,-4,-1,3]){box(scene,.35,.06,.35,x,.03,z,M.rubber);mesh(scene,new T.ConeGeometry(.15,.57,12),M.orange,x,.33,z);mesh(scene,new T.CylinderGeometry(.07,.1,.1,12),M.white,x,.35,z);}
 for(let x=-18;x<19;x+=3){box(scene,2.88,.95,.12,x,.62,-16,M.grey);for(const dx of [-1.4,1.4])tube(scene,V(x+dx,0,-16),V(x+dx,1.3,-16),.035,M.dark);box(scene,2.88,.1,.14,x,1.1,-16,M.white);}
 plaque(scene,'01   /   DIGGING YARD',4,.8,0,1.4,-15.9);plaque(scene,'CONTROL LAB',3,.65,-12,1.65,-15.9);
 function container(x,z,color){const group=new T.Group();group.position.set(x,0,z);scene.add(group);const mat=material(color,.7,.25);round(group,5,2.3,2.6,0,1.15,0,mat);for(let i=0;i<18;i++)box(group,.035,2.13,.06,-2.38+i*.28,1.15,1.34,mat);box(group,5.08,.1,2.67,0,2.3,0,M.grey);plaque(group,'FIELD / 01',1.5,.34,0,1.65,1.39);return group;}
 container(-10,-12,0x415c62);container(-11,-21,0x7b7970);
 const office=new T.Group();office.position.set(11,0,-19);scene.add(office);round(office,7,2.8,3.4,0,1.4,0,M.white);box(office,7.3,.16,3.7,0,2.83,0,M.grey);for(const x of [-2.2,0,2.2]){box(office,1.65,.97,.08,x,1.55,1.74,M.dark);box(office,1.5,.82,.1,x,1.55,1.78,M.glass);}
 for(const x of [9,13])for(const z of [-10,-6]){tube(scene,V(x,0,z),V(x,4.5,z),.055,M.grey);}for(const y of [1.5,3,4.5]){for(const z of [-10,-6])tube(scene,V(9,y,z),V(13,y,z),.04,M.grey);for(const x of [9,13])tube(scene,V(x,y,-10),V(x,y,-6),.04,M.grey);}
 for(let i=0;i<5;i++)box(scene,2.5,.12,.16,8,.12+i*.14,3,M.orange);
 for(let i=0;i<7;i++){const rock=mesh(scene,new T.DodecahedronGeometry(.28+i%3*.12),M.soil,-6+(i%3)*.55,.22,-5+Math.floor(i/3)*.6);rock.rotation.set(rand(),rand(),rand());}
 // A lattice crane and an unfinished frame give the yard a recognizable horizon.
 const crane=new T.Group();crane.position.set(-19,0,-32);scene.add(crane);
 for(const x of [-.45,.45])for(const z of [-.45,.45])tube(crane,V(x,0,z),V(x,16,z),.07,M.yellow);
 for(let y=0;y<16;y+=2){tube(crane,V(-.45,y,-.45),V(.45,y+2,-.45),.035,M.yellow);tube(crane,V(-.45,y,.45),V(.45,y+2,.45),.035,M.yellow);box(crane,1,.07,1,0,y,0,M.yellow);}
 tube(crane,V(-4,16,0),V(16,16,0),.13,M.yellow);tube(crane,V(-4,17,0),V(16,17,0),.08,M.yellow);for(let x=-4;x<16;x+=2)tube(crane,V(x,16,0),V(x+2,17,0),.05,M.yellow);tube(crane,V(11,16,0),V(11,8,0),.018,M.dark);box(crane,.25,.4,.22,11,7.8,0,M.grey);box(crane,1.5,1.5,1.4,-3,15.5,0,M.grey);
 for(let x=15;x<=27;x+=4)for(let z=-31;z>=-39;z-=4)box(scene,.28,9,.28,x,4.5,z,M.grey);
 for(const y of [3,6,9]){for(const z of [-31,-35,-39])box(scene,12,.22,.27,21,y,z,M.grey);for(let x=15;x<=27;x+=4)box(scene,.27,.22,8,x,y,-35,M.grey);}
 const hillMat=material(0x617b76,1,0);for(let i=0;i<14;i++){const a=i/14*Math.PI*2,r=74+rand()*14;const hill=mesh(scene,new T.IcosahedronGeometry(1,1),hillMat,Math.sin(a)*r,-1,Math.cos(a)*r);hill.scale.set(12+rand()*12,8+rand()*8,10+rand()*12);}
 const treeMat=material(0x4b6559,1,0);for(let i=0;i<24;i++){const a=i/24*Math.PI*2,r=43+rand()*14,x=Math.sin(a)*r,z=Math.cos(a)*r;const tree=mesh(scene,new T.ConeGeometry(1.2,5,6),treeMat,x,3,z);tube(scene,V(x,0,z),V(x,1.5,z),.15,M.dark);}
 // Low contrast track impressions outside the deforming soil.
 const marks=new T.Group();scene.add(marks);for(const x of [-7.4,-5.8])for(let z=4;z<15;z+=.38){const m=box(marks,.5,.006,.14,x,.009,z,material(0x796b58,1,0));m.castShadow=false;}
 return {light};
}
globalThis.BackhoeVisuals={materials:M,machine,site,groundMaterial,plaque};
})();
