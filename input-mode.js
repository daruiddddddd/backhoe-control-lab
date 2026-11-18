(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.BackhoeInput=api;})(globalThis,function(){
'use strict';
class Mode {
 constructor({coarse=false,fine=false,touchPoints=0}={},change=()=>{}){this.detected=coarse||touchPoints>0&&!fine?'touch':'pc';this.mode=this.detected;this.preference='auto';this.pointers=new Set();this.ignoreMouseUntil=0;this.change=change;this.lastMouse=null;}
 commit(){const next=this.preference==='auto'?this.detected:this.preference;if(this.pointers.size||next===this.mode)return;this.mode=next;this.change(next);}
 prefer(value){if(!['auto','pc','touch'].includes(value))return;this.preference=value;this.commit();}
 down(e,now){this.pointers.add(e.pointerId);if(e.pointerType==='touch'||e.pointerType==='pen'){this.detected='touch';this.ignoreMouseUntil=now+900;}else if(e.pointerType==='mouse'&&now>=this.ignoreMouseUntil&&!e.sourceCapabilities?.firesTouchEvents){this.detected='pc';}this.commit();}
 up(id){this.pointers.delete(id);this.commit();}
 cancel(){this.pointers.clear();this.commit();}
 move(e,now){if(e.pointerType!=='mouse'||e.buttons||this.pointers.size||now<this.ignoreMouseUntil||e.sourceCapabilities?.firesTouchEvents)return;const previous=this.lastMouse;this.lastMouse={x:e.clientX,y:e.clientY};if(previous&&Math.hypot(e.clientX-previous.x,e.clientY-previous.y)>=8){this.detected='pc';this.commit();}}
 keyboard(){this.detected='pc';this.commit();}
}
return {Mode};
});
