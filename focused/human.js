import * as THREE from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';

// Pose the actual skinned character using bone directions in world space.
export async function createHuman(therapist=false){
  const manager=new THREE.LoadingManager();
  manager.setURLModifier(u=>/\.tga$/i.test(u)?'./assets/humans/'+u.split(/[\\/]/).pop().replace(/\.tga$/i,'.webp'):u);
  const model=await new FBXLoader(manager).setResourcePath('./assets/humans/').loadAsync(therapist?'./assets/humans/Female_Adult_01.fbx':'./assets/humans/Male_Adult_02.fbx');
  const group=new THREE.Group();
  group.add(model);
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;o.material=(Array.isArray(o.material)?o.material:[o.material]).map(old=>{
    const hair=old.name.includes('opacity'),head=old.name.includes('head');
    if(old.map){old.map.colorSpace=THREE.SRGBColorSpace;old.map.anisotropy=8;}
    const m=new THREE.MeshStandardMaterial({map:old.map,color:0xffffff,normalMap:old.normalMap,normalScale:new THREE.Vector2(.5,.5),roughness:head?.70:.86,metalness:0,side:hair?THREE.DoubleSide:THREE.FrontSide,transparent:false,alphaTest:hair?.4:0});
    if(therapist&&old.name.includes('body')){m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float shirt = smoothstep(0.025,0.10,diffuseColor.r-diffuseColor.g) * smoothstep(0.004,0.03,diffuseColor.b-diffuseColor.g);
      float textileLight = dot(diffuseColor.rgb,vec3(0.299,0.587,0.114));
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.21,0.34,0.40)*sqrt(textileLight)*1.7,shirt);`);};m.customProgramCacheKey=()=> 'blue-shirt-v1';}
    return m;});}});
  model.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(model),height=box.max.y-box.min.y;
  model.scale.multiplyScalar(2.15/height);model.updateMatrixWorld(true);
  const bones={},map={Bip01_Pelvis:'Hips',Bip01_Spine:'Spine',Bip01_Spine1:'Spine1',Bip01_Spine2:'Spine2',Bip01_Neck:'Neck',Bip01_Head:'Head'};
  for(const [side,short] of [['Left','L'],['Right','R']]){for(const [a,b] of [['Thigh','UpLeg'],['Calf','Leg'],['Foot','Foot'],['Toe0','ToeBase'],['Clavicle','Shoulder'],['UpperArm','Arm'],['Forearm','ForeArm'],['Hand','Hand']])map['Bip01_'+short+'_'+a]=side+b;for(let d=0;d<5;d++)for(let j=0;j<3;j++)map['Bip01_'+short+'_Finger'+d+(j?j:'')]=side+'Hand'+['Thumb','Index','Middle','Ring','Pinky'][d]+(j+1);}
  model.traverse(o=>{if(o.isBone&&map[o.name])bones[map[o.name]]=o;});
  const pos=b=>b.getWorldPosition(new THREE.Vector3());
  let hip=pos(bones.Hips);model.position.y+=.84-hip.y;model.updateMatrixWorld(true);
  function aim(name,child,target){
    const b=bones[name],c=bones[child];if(!b||!c)return;
    model.updateMatrixWorld(true);
    const origin=pos(b),a=pos(c).sub(origin).normalize(),d=new THREE.Vector3(...target).sub(origin).normalize();
    const q=new THREE.Quaternion().setFromUnitVectors(a,d).multiply(b.getWorldQuaternion(new THREE.Quaternion()));
    b.quaternion.copy(b.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q));
    model.updateMatrixWorld(true);
  }
  hip=pos(bones.Hips);
  for(const side of ['Left','Right']){
    const sign=side==='Left'?1:-1;
    aim(side+'UpLeg',side+'Leg',[sign*.16,.71,.48]);
    aim(side+'Leg',side+'Foot',[sign*.17,.12,.55]);
    aim(side+'Foot',side+'ToeBase',[sign*.17,.055,.77]);
  }
  // A quiet, slightly forward-leaning posture, with both hands near the phone.
  bones.Spine.rotateX(.10);model.updateMatrixWorld(true);
  for(const side of ['Left','Right']){
    const sign=side==='Left'?1:-1;
    aim(side+'Arm',side+'ForeArm',[sign*.29,1.07,.17]);
    aim(side+'ForeArm',side+'Hand',[sign*.105,1.12,.44]);
    aim(side+'Hand',side+'HandMiddle1',[sign*.07,1.15,.50]);
    for(const digit of ['Index','Middle','Ring','Pinky'])for(let j=1;j<4;j++){const b=bones[side+'Hand'+digit+j];if(b)b.rotateX(-.22);}
  }
  model.updateMatrixWorld(true);
  const headWorld=bones.Head.getWorldQuaternion(new THREE.Quaternion());headWorld.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),therapist?.04:.22));bones.Head.quaternion.copy(bones.Head.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(headWorld));
  const phone=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(.17,.30,.018),new THREE.MeshStandardMaterial({color:0x101518,metalness:.65,roughness:.3}));phone.add(body);
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(.151,.276),new THREE.MeshBasicMaterial({color:0x9ecdc8}));screen.position.z=.010;phone.add(screen);
  for(let i=0;i<6;i++){const msg=new THREE.Mesh(new THREE.PlaneGeometry(i%2?.09:.115,.015),new THREE.MeshBasicMaterial({color:i%2?0x347778:0xdae9dd}));msg.position.set(i%2?-.017:.005,.085-i*.03,.011);phone.add(msg);}
  phone.position.set(0,1.15,.49);phone.rotation.set(.5,Math.PI,0);phone.scale.setScalar(.8);if(!therapist)group.add(phone);
  if(therapist){const notebook=new THREE.Mesh(new THREE.BoxGeometry(.30,.025,.24),new THREE.MeshStandardMaterial({color:0xddd0b6,roughness:.94}));notebook.position.set(0,1.10,.42);notebook.rotation.x=.18;group.add(notebook);}
  const light=new THREE.PointLight(0x91e8f0,.12,1.2,2);light.position.set(0,1.36,.48);if(!therapist)group.add(light);
  const baseSpine=bones.Spine.quaternion.clone(),baseHead=bones.Head.quaternion.clone();
  const animated=['LeftHand','RightHand','LeftHandThumb1','RightHandThumb1','LeftHandThumb2','RightHandThumb2'];
  const rest=Object.fromEntries(animated.filter(k=>bones[k]).map(k=>[k,bones[k].quaternion.clone()]));
  const xAxis=new THREE.Vector3(1,0,0),yAxis=new THREE.Vector3(0,1,0),q=new THREE.Quaternion();
  const typingDots=[];for(let i=0;i<3;i++){const dot=new THREE.Mesh(new THREE.CircleGeometry(.005,16),new THREE.MeshBasicMaterial({color:0x225c62}));dot.position.set(-.015+i*.015,-.105,.012);phone.add(dot);typingDots.push(dot);}
  let activity=0;
  return {group,bones,phone,screen,get activity(){return activity;},update(t,still,typing=false){if(still)return;activity+=(Number(typing)-activity)*.07;
   bones.Spine.quaternion.copy(baseSpine).multiply(q.setFromAxisAngle(xAxis,Math.sin(t*.9)*.006));
   bones.Head.quaternion.copy(baseHead).multiply(q.setFromAxisAngle(yAxis,Math.sin(t*.33)*.018*(1-activity*.65)));
   for(const side of ['Left','Right']){const tap=Math.pow(Math.max(0,Math.sin(t*7+(side==='Left'?0:Math.PI))),3)*activity;
    for(const [part,angle] of [['Hand',.038],['HandThumb1',.24],['HandThumb2',.32]]){const name=side+part;if(rest[name])bones[name].quaternion.copy(rest[name]).multiply(q.setFromAxisAngle(xAxis,tap*angle));}
   }
   if(!therapist){phone.rotation.x=.5+Math.sin(t*7)*.009*activity;light.intensity=.12+.08*activity;typingDots.forEach((dot,i)=>{dot.visible=activity>.1;dot.scale.setScalar(.65+.35*Math.sin(t*6-i*1.2));});}
  }};
}
