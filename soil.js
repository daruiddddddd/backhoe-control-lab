(function(root){
  'use strict';
  // A deformable sandbox heightfield. Volumes are game units, not machine specifications.
  class SoilField{
    constructor(size=18,segments=72){this.size=size;this.segments=segments;this.n=segments+1;this.spacing=size/segments;this.area=this.spacing**2;this.heights=new Float64Array(this.n*this.n);this.version=0;this.minimum=-2.3;}
    inside(x,z){const edge=this.size/2-this.spacing;return Math.abs(x)<edge&&Math.abs(z)<edge;}
    index(x,z){return z*this.n+x;}
    sample(x,z){
      if(!this.inside(x,z))return 0;
      const fx=(x+this.size/2)/this.spacing,fz=(z+this.size/2)/this.spacing,i=Math.floor(fx),j=Math.floor(fz),u=fx-i,v=fz-j;
      const a=this.heights[this.index(i,j)],b=this.heights[this.index(i+1,j)],c=this.heights[this.index(i,j+1)],d=this.heights[this.index(i+1,j+1)];
      // Match the two actual mesh triangles, including their shared diagonal.
      return u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);
    }
    cells(x,z,radius){
      const out=[],half=this.size/2,n=this.segments,step=this.spacing;
      const i0=Math.max(1,Math.floor((x-radius+half)/step)),i1=Math.min(n-1,Math.ceil((x+radius+half)/step));
      const j0=Math.max(1,Math.floor((z-radius+half)/step)),j1=Math.min(n-1,Math.ceil((z+radius+half)/step));
      for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const px=i*step-half,pz=j*step-half,q=((px-x)**2+(pz-z)**2)/radius**2;if(q<1)out.push({i:this.index(i,j),x:px,z:pz,w:(1-q)**1.2});}return out;
    }
    dig(point,dt,available,strength=1){
      if(available<=0||strength<=0||!this.inside(point.x,point.z)||point.y>this.sample(point.x,point.z)+.13)return 0;
      const changes=[];let volume=0;
      for(const c of this.cells(point.x,point.z,.64)){
        if(Math.hypot(c.x,c.z)<1.65)continue;
        const target=Math.max(this.minimum,point.y-.18*c.w);
        const delta=Math.max(0,Math.min(this.heights[c.i]-target,.95*dt*strength*c.w));
        if(delta>0){changes.push({i:c.i,delta});volume+=delta*this.area;}
      }
      if(volume<=0)return 0;const fraction=Math.min(1,available/volume);
      for(const c of changes)this.heights[c.i]-=c.delta*fraction;
      this.version++;return volume*fraction;
    }
    deposit(x,z,volume){
      if(volume<=0||!this.inside(x,z))return 0;
      const cells=this.cells(x,z,.55),total=cells.reduce((s,c)=>s+c.w,0);if(!total)return 0;
      for(const c of cells)this.heights[c.i]+=volume*c.w/(total*this.area);
      this.version++;return volume;
    }
    volume(){return this.heights.reduce((a,b)=>a+b,0)*this.area;}
    deepest(){return -Math.min(0,...this.heights);}
    reset(){this.heights.fill(0);this.version++;}
  }
  function excavate(C,field,state,weights,dt,speed,cargo,capacity){
    const oldTip=C.bucketPoint(state),next={...state};C.step(next,weights,dt,speed);let tip=C.bucketPoint(next);
    const cut=Math.max(weights.bucketIn||0,weights.armIn||0),taken=field.dig(tip,dt,Math.max(0,capacity-cargo),cut);cargo+=taken;
    const penetration=field.sample(tip.x,tip.z)-tip.y,oldPenetration=field.sample(oldTip.x,oldTip.z)-oldTip.y;
    const contact=penetration>.14&&penetration>oldPenetration+.0001;
    const resultState=contact?state:next;if(contact)tip=oldTip;
    let dropped=0;
    if((weights.bucketOut||0)>0&&tip.angle>.25&&cargo>0&&tip.y>field.sample(tip.x,tip.z)+.05){dropped=Math.min(cargo,capacity*.9*dt*weights.bucketOut);cargo=Math.max(0,cargo-dropped);}
    return {state:resultState,cargo,taken,dropped,tip,contact};
  }
  root.BackhoeSoil={SoilField,excavate};if(typeof module!=='undefined')module.exports=root.BackhoeSoil;
})(typeof globalThis==='undefined'?this:globalThis);
