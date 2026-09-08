import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Persistent furniture only. Content, display locations and camera framing
// belong to the caller. A screen's origin is its exact front reading plane;
// its housing and support remain behind that plane, at negative local z.
export function createRoomExhibits(scene){
  const root=new THREE.Group();root.name='room-exhibits';scene.add(root);
  const exhibits=new Map(),activeIds=new Set();
  const up=new THREE.Vector3(0,1,0);
  const material=(color,roughness,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  const graphite=material('#1c282c',.68,.24);
  const bronze=material('#b49c75',.46,.7);
  const rubber=material('#151b1c',.98);
  const walnut=material('#715039',.84);
  const stone=material('#758084',.91);

  function checkId(id){
    if(typeof id!=='string'||!id.length)throw new TypeError('An exhibit needs a non-empty string id.');
    if(exhibits.has(id))throw new Error('Duplicate exhibit id: '+id);
  }
  function positive(value,name){
    if(!Number.isFinite(value)||value<=0)throw new RangeError(name+' must be a positive finite number.');
  }
  function frame(position,quaternion=new THREE.Quaternion()){
    if(!position?.isVector3||!position.toArray().every(Number.isFinite))throw new TypeError('Exhibit position must be a finite THREE.Vector3.');
    if(!quaternion?.isQuaternion||!quaternion.toArray().every(Number.isFinite)||quaternion.lengthSq()===0)throw new TypeError('Exhibit quaternion must be a finite nonzero THREE.Quaternion.');
    const group=new THREE.Group();group.position.copy(position);group.quaternion.copy(quaternion).normalize();
    return group;
  }
  function box(parent,m,size,position,radius=.012,quaternion){
    const mesh=new THREE.Mesh(new RoundedBoxGeometry(...size,2,radius),m);
    mesh.position.copy(position);if(quaternion)mesh.quaternion.copy(quaternion);
    parent.add(mesh);return mesh;
  }
  function perimeter(parent,m,width,height,thickness,depth,z){
    for(const side of [-1,1]){
      box(parent,m,[width,thickness,depth],new THREE.Vector3(0,side*(height-thickness)/2,z),Math.min(.012,thickness/2));
      box(parent,m,[thickness,height-thickness*2,depth],new THREE.Vector3(side*(width-thickness)/2,0,z),Math.min(.012,thickness/2));
    }
  }
  function roundedPhoneRim(parent,m,width,height,thickness,depth,z){
    const outline=(w,h,r,Target)=>{
      const p=new Target(),x=-w/2,y=-h/2;
      p.moveTo(x+r,y);p.lineTo(x+w-r,y);p.quadraticCurveTo(x+w,y,x+w,y+r);
      p.lineTo(x+w,y+h-r);p.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
      p.lineTo(x+r,y+h);p.quadraticCurveTo(x,y+h,x,y+h-r);
      p.lineTo(x,y+r);p.quadraticCurveTo(x,y,x+r,y);p.closePath();return p;
    };
    const radius=Math.min(.14,width*.07,height*.07);
    const shape=outline(width,height,radius,THREE.Shape);
    shape.holes.push(outline(width-thickness*2,height-thickness*2,Math.max(.015,radius-thickness),THREE.Path));
    const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:8}),m);
    mesh.position.z=z-depth/2;parent.add(mesh);
  }
  // All component transforms are baked once. Only materials change later;
  // each room display adds five draw calls; phone displays add four.
  function consolidate(group){
    const buckets=new Map();
    for(const mesh of [...group.children]){
      mesh.updateMatrix();mesh.geometry.applyMatrix4(mesh.matrix);
      if(!buckets.has(mesh.material))buckets.set(mesh.material,[]);
      buckets.get(mesh.material).push(mesh.geometry);group.remove(mesh);
    }
    for(const [m,geometries] of buckets){
      const geometry=geometries.length===1?geometries[0]:mergeGeometries(geometries,false);
      if(geometries.length>1)for(const old of geometries)old.dispose();
      const mesh=new THREE.Mesh(geometry,m);mesh.castShadow=!m.transparent;mesh.receiveShadow=true;group.add(mesh);
    }
  }
  function emission(record,t=0,still=true){
    const active=activeIds.has(record.id);
    const breath=active&&!still?Math.sin(t*.7)*.012:0;
    record.trim.emissiveIntensity=active?.035:0;
    if(record.edge)record.edge.emissiveIntensity=active?.29+breath:.045;
    record.active=active;
  }
  function appearance(record){
    if(!record.face)return;
    const active=activeIds.has(record.id);
    record.face.color.set(active?'#101c21':'#477d83');
    record.face.opacity=active?.96:.12;
    record.face.depthWrite=active;
  }

  function addScreen(id,{position,quaternion,width,height,floorY,accent='#83c9c4',kind='room'}){
    checkId(id);positive(width,'Screen width');positive(height,'Screen height');
    if(kind!=='room'&&kind!=='phone')throw new TypeError('Screen kind must be room or phone.');
    floorY??=kind==='phone'?-18:-.03;
    if(!Number.isFinite(floorY))throw new TypeError('Screen floorY must be finite.');
    const group=frame(position,quaternion);group.name='exhibit-screen-'+id;
    const q=group.quaternion,inverse=q.clone().invert(),normal=new THREE.Vector3(0,0,1).applyQuaternion(q);
    const local=(p)=>p.clone().sub(position).applyQuaternion(inverse);
    const world=(p)=>p.clone().applyQuaternion(q).add(position);
    const trim=bronze.clone();trim.emissive.set(accent);trim.emissiveIntensity=0;
    const edge=material(accent,.56,.25);edge.emissive.set(accent);edge.emissiveIntensity=.045;
    const face=material('#477d83',.61,.04);face.transparent=true;face.opacity=.12;face.depthWrite=false;
    const depth=kind==='phone'?.085:.105;

    // Open rims have no opaque middle. One independently controlled smoked
    // pane lets the inhabited room remain visible through inactive displays.
    const rim=kind==='phone'?roundedPhoneRim:perimeter;
    rim(group,graphite,width+.15,height+.15,.033,depth,-depth/2-.016);
    rim(group,trim,width+.124,height+.124,.020,.026,-.023);
    box(group,face,[width+.083,height+.083,.018],new THREE.Vector3(0,0,-.024),.008);
    box(group,edge,[Math.min(width*.34,1),.008,.006],new THREE.Vector3(0,-height/2-.054,-.006),.002);

    let support={floorY,floating:kind==='phone'};
    if(kind==='room'){
    // The upright and base use a horizontal world frame, independent of the
    // panel's pitch/roll. A short bracket meets the rear of the display.
    const right=new THREE.Vector3(1,0,0).applyQuaternion(q);right.y=0;
    if(right.lengthSq()<.0001)right.set(normal.z,0,-normal.x);
    if(right.lengthSq()<.0001)right.set(1,0,0);right.normalize();
    const front=new THREE.Vector3(-right.z,0,right.x);
    const baseQ=new THREE.Quaternion().setFromAxisAngle(up,Math.atan2(-right.z,right.x));
    const localBaseQ=inverse.clone().multiply(baseQ);
    const baseWidth=THREE.MathUtils.clamp(width*.34,.64,1.18);
    const baseDepth=THREE.MathUtils.clamp(width*.18,.48,.68),baseHeight=.065;
    const mastWidth=THREE.MathUtils.clamp(width*.023,.055,.085),mastDepth=.068;
    const mount=world(new THREE.Vector3(0,-height*.30,-depth-.063));
    const base=new THREE.Vector3(mount.x,floorY+baseHeight/2,mount.z);
    const mastTop=new THREE.Vector3(base.x,Math.max(mount.y,floorY+baseHeight+.12),base.z);

    // Keep the complete footprint behind a tilted reading plane, including
    // the corners of the foot. Both ends of the vertical mast move together.
    const footprintExtent=baseWidth/2*Math.abs(right.dot(normal))+baseDepth/2*Math.abs(front.dot(normal))+baseHeight/2*Math.abs(normal.y);
    const mastExtent=mastWidth/2*Math.abs(right.dot(normal))+mastDepth/2*Math.abs(front.dot(normal));
    const clearance=Math.max(base.clone().sub(position).dot(normal)+footprintExtent,mastTop.clone().sub(position).dot(normal)+mastExtent)+.026;
    const horizontalNormalSq=normal.x*normal.x+normal.z*normal.z;
    if(clearance>0&&horizontalNormalSq>.0001){
      const setback=new THREE.Vector3(-normal.x,0,-normal.z).multiplyScalar(clearance/horizontalNormalSq);
      base.add(setback);mastTop.add(setback);
    }
    box(group,rubber,[baseWidth,baseHeight,baseDepth],local(base),.025,localBaseQ);
    box(group,trim,[baseWidth-.016,.011,baseDepth-.016],local(base.clone().addScaledVector(up,.027)),.005,localBaseQ);
    const mastBottom=new THREE.Vector3(base.x,floorY+baseHeight,base.z);
    const mastHeight=mastTop.y-mastBottom.y;
    box(group,graphite,[mastWidth,mastHeight,mastDepth],local(mastTop.clone().add(mastBottom).multiplyScalar(.5)),.012,localBaseQ);
    const arm=mount.clone().sub(mastTop),armLength=arm.length();
    if(armLength>.008){
      const armQ=new THREE.Quaternion().setFromUnitVectors(up,arm.normalize());
      box(group,graphite,[mastWidth,armLength+.014,mastDepth],local(mount.clone().add(mastTop).multiplyScalar(.5)),.012,inverse.clone().multiply(armQ));
    }
    box(group,graphite,[.24,.14,.084],new THREE.Vector3(0,-height*.30,-depth-.04),.024);
    support={floorY,floating:false,baseCenter:base.toArray(),mount:mount.toArray()};
    }
    consolidate(group);root.add(group);
    const record={id,type:'screen',kind,group,position:group.position,quaternion:group.quaternion,width,height,floorY,trim,edge,face,active:false};
    group.userData.readingPlane={width,height,localZ:0};
    group.userData.support=support;
    exhibits.set(id,record);appearance(record);emission(record);return record;
  }

  function addPlinth(id,{position,width,depth,height,quaternion}){
    checkId(id);positive(width,'Plinth width');positive(depth,'Plinth depth');positive(height,'Plinth height');
    const group=frame(position,quaternion);group.name='exhibit-plinth-'+id;
    const trim=bronze.clone();trim.emissive.set('#d7b990');trim.emissiveIntensity=0;
    const topThickness=Math.min(.075,height*.16),footThickness=Math.min(.028,height*.05);
    const stoneThickness=topThickness*.30;
    // The exact top is local y=0. A stone insert, walnut edge and two recessed
    // trestles give the symbolic needs sculptures a low, tactile display table.
    box(group,stone,[width,stoneThickness,depth],new THREE.Vector3(0,-stoneThickness/2,0),Math.min(.018,stoneThickness/2));
    box(group,walnut,[width,topThickness-stoneThickness,depth],new THREE.Vector3(0,-(topThickness+stoneThickness)/2,0),.016);
    box(group,trim,[width*.985,.006,depth*.985],new THREE.Vector3(0,-topThickness-.003,0),.002);
    const legHeight=height-topThickness-footThickness;
    for(const side of [-1,1]){
      const x=side*width*.32;
      box(group,walnut,[width*.135,legHeight,depth*.64],new THREE.Vector3(x,-topThickness-legHeight/2,0),.018);
      box(group,rubber,[width*.16,footThickness,depth*.70],new THREE.Vector3(x,-height+footThickness/2,0),Math.min(.009,footThickness/2));
    }
    consolidate(group);root.add(group);
    const record={id,type:'plinth',group,position:group.position,quaternion:group.quaternion,width,depth,height,trim,active:false};
    group.userData.topPlane={width,depth,localY:0};exhibits.set(id,record);emission(record);return record;
  }

  function setActive(ids=[]){
    activeIds.clear();for(const id of ids)if(exhibits.has(id))activeIds.add(id);
    for(const record of exhibits.values()){appearance(record);emission(record);}
  }
  function update(t=0,still=false){
    for(const record of exhibits.values())if(record.active)emission(record,Number.isFinite(t)?t:0,still);
  }
  function getState(){
    const all=[...exhibits.values()];
    return {
      activeIds:[...activeIds],screenCount:all.filter(r=>r.type==='screen').length,plinthCount:all.filter(r=>r.type==='plinth').length,
      meshCount:all.reduce((sum,r)=>sum+r.group.children.length,0),
      screens:all.filter(r=>r.type==='screen').map(r=>({id:r.id,kind:r.kind,width:r.width,height:r.height,floorY:r.floorY,position:r.position.toArray(),quaternion:r.quaternion.toArray(),active:r.active,faceOpacity:r.face.opacity,floating:r.group.userData.support.floating})),
      plinths:all.filter(r=>r.type==='plinth').map(r=>({id:r.id,width:r.width,depth:r.depth,height:r.height,position:r.position.toArray(),quaternion:r.quaternion.toArray(),active:r.active}))
    };
  }
  return {addScreen,addPlinth,setActive,update,getState};
}
