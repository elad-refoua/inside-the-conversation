import * as THREE from 'three';
import {CSS3DRenderer,CSS3DObject} from 'three/addons/renderers/CSS3DRenderer.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {createHuman} from './human.js?v=69bd803d1d';
import {formatInlineBidi} from './bidi.js?v=69bd803d1d';
import {cameraStop,cameraJourney,TOUR_STOPS,transitionCaption,isPhoneStop} from './camera-tour.js?v=69bd803d1d';
import {createPhoneSpace} from './phone-space.js?v=69bd803d1d';
import {createRoomExhibits} from './room-exhibits.js?v=69bd803d1d';
import {finishRoom} from './room-finish.js?v=69bd803d1d';
import {createAIFace} from './ai-face.js?v=69bd803d1d';
import {createNeedsScenes} from './needs-scenes.js?v=69bd803d1d';

const V=(x,y,z)=>new THREE.Vector3(x,y,z);
export async function createWorld(container,chapters){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#08161e');scene.fog=new THREE.FogExp2('#08161e',.021);
 const camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.008,150);
 let renderDirty=true;
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.info.autoReset=false;
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;container.appendChild(renderer.domElement);
 const sceneShade=document.querySelector('.vignette');container.appendChild(sceneShade);sceneShade.style.zIndex='1';
 const css=new CSS3DRenderer();css.setSize(innerWidth,innerHeight);css.domElement.style.cssText='position:absolute;inset:0;pointer-events:none;overflow:hidden;direction:ltr;z-index:2';container.appendChild(css.domElement);
 const pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromScene(new RoomEnvironment(),.04);scene.environment=env.texture;scene.environmentIntensity=.22;
 const target=new THREE.WebGLRenderTarget(innerWidth,innerHeight,{type:THREE.HalfFloatType,samples:4});
 const composer=new EffectComposer(renderer,target);composer.addPass(new RenderPass(scene,camera));const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.28,.55,1.5);composer.addPass(bloom);composer.addPass(new OutputPass());
 const controls=new OrbitControls(camera,renderer.domElement);controls.enabled=false;controls.enableDamping=true;controls.minDistance=2;controls.maxDistance=26;controls.maxPolarAngle=Math.PI*.49;controls.target.set(0,1.3,0);
 const mat=(c,r=.7,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
 function microtexture(repeat){const side=512,data=new Uint8Array(side*side*4);for(let y=0;y<side;y++)for(let x=0;x<side;x++){let i=(y*side+x)*4,v=128+Math.sin(x*2.5)*Math.sin(y*2.1)*45+Math.sin(x*1.7+y*2.9)*20;data[i]=data[i+1]=data[i+2]=v;data[i+3]=255;}const tx=new THREE.DataTexture(data,side,side);tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(repeat,repeat);tx.magFilter=THREE.LinearFilter;tx.minFilter=THREE.LinearMipmapLinearFilter;tx.generateMipmaps=true;tx.anisotropy=8;tx.needsUpdate=true;return tx;}
 const fabricNoise=microtexture(3),stoneNoise=microtexture(5);
 const dark=mat('#10252b',.42,.25),wood=mat('#523c2a',.75),brass=mat('#b99961',.3,.7),fabric=mat('#c5ac88',.98),cyan=new THREE.MeshBasicMaterial({color:new THREE.Color('#76deeb').multiplyScalar(2.4)}),amber=new THREE.MeshBasicMaterial({color:new THREE.Color('#e9b573').multiplyScalar(2)});
 fabric.bumpMap=fabricNoise;fabric.bumpScale=.017;
 function mesh(geo,m,p,parent=scene){const o=new THREE.Mesh(geo,m);o.position.set(...p);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function box(w,h,d,m,p,parent=scene,r=.05){return mesh(new RoundedBoxGeometry(w,h,d,3,r),m,p,parent);}
 function cyl(r1,r2,h,m,p,parent=scene){return mesh(new THREE.CylinderGeometry(r1,r2,h,64),m,p,parent);}
 function tube(points,color,r=.009,parent=scene){const curve=new THREE.CatmullRomCurve3(points.map(p=>V(...p)));const o=mesh(new THREE.TubeGeometry(curve,96,r,6,false),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.62}),[0,0,0],parent);o.castShadow=false;return {o,curve};}
 function ring(radius,y,material,parent=scene,center=[0,0]){const o=mesh(new THREE.TorusGeometry(radius,.009,6,150),material,[center[0],y,center[1]],parent);o.rotation.x=Math.PI/2;o.castShadow=false;return o;}
 // A real room becomes a shared mental space. Materials stay human and tactile.
 const stone=mat('#283034',.52,.15);stone.bumpMap=stoneNoise;stone.bumpScale=.025;
 const floor=cyl(10.8,10.8,.20,stone,[0,-.16,0]);
 ring(10.6,-.048,brass);ring(8.8,-.045,mat('#547575',.4,.5));
 const rug=cyl(2.6,2.6,.027,mat('#615748',1),[-.9,-.038,.45]);rug.scale.z=.74;
 const rugRing=ring(2.44,-.019,mat('#c5a785',1),scene,[-.9,.45]);rugRing.scale.y=.74;
 // Broad curved backdrop and vertical timber fins, opening onto the night.
 const wall=mesh(new THREE.CylinderGeometry(7.8,7.8,5.4,70,1,true,Math.PI*1.07,Math.PI*.38),mat('#15303a',.85),[0,2.5,0]);wall.material.side=THREE.DoubleSide;
 wall.material.color.set('#3a3933');wall.material.bumpMap=stoneNoise;wall.material.bumpScale=.022;
 for(let i=0;i<5;i++){const a=Math.PI*1.07+i/4*Math.PI*.38;const o=box(.012,5.1,.03,brass,[Math.sin(a)*7.66,2.5,Math.cos(a)*7.66],scene,.005);o.rotation.y=a;}
 const cornice=[];for(let i=0;i<90;i++){const a=Math.PI*1.07+i/89*Math.PI*.38;cornice.push([Math.sin(a)*7.66,4.9,Math.cos(a)*7.66]);}tube(cornice,'#e5b071',.024);
 for(let i=0;i<2;i++){const a=Math.PI*1.07+i*Math.PI*.38;box(.035,5.4,.035,amber,[Math.sin(a)*7.7,2.5,Math.cos(a)*7.7]);}
 // A window-like architectural frame; the view remains open to the virtual city.
 for(const x of [-5.8,4.6])box(.065,5.2,.065,brass,[x,2.6,-5.4]);box(10.4,.065,.065,brass,[-.6,5.2,-5.4]);
 const rand=(n)=>{const a=Math.sin(n*127.1+311.7)*43758.5453;return a-Math.floor(a);};
 const nightTexture=await new THREE.TextureLoader().loadAsync('./assets/night-panorama.png');nightTexture.colorSpace=THREE.SRGBColorSpace;nightTexture.anisotropy=16;nightTexture.wrapS=THREE.RepeatWrapping;nightTexture.repeat.x=2;
 const panorama=new THREE.Mesh(new THREE.CylinderGeometry(40,40,30,128,1,true),new THREE.MeshBasicMaterial({map:nightTexture,side:THREE.BackSide,fog:false,color:0xaab5c4}));panorama.position.y=9.7;panorama.rotation.y=.65;scene.add(panorama);
 // Lounge chair: sculpted upholstery, separate cushions, wood base and brass seams.
 function chair(position,rotation,colour=fabric){const g=new THREE.Group();scene.add(g);g.position.set(...position);g.rotation.y=rotation;box(.89,.22,.89,wood,[0,.48,0],g,.07);box(.80,.24,.80,colour,[0,.66,.03],g,.10);const back=box(.92,1.02,.22,colour,[0,1.09,-.35],g,.10);back.rotation.x=-.13;for(const x of [-.49,.49]){box(.15,.43,.91,colour,[x,.87,.03],g,.075);for(const z of [-.30,.33]){const leg=box(.055,.42,.055,brass,[x*.75,.24,z],g,.01);leg.rotation.z=x*.12;}}return g;}
 const patientChair=chair([-1.7,0,.15],.68);
 const therapistFabric=mat('#3f6366',.96);therapistFabric.bumpMap=fabricNoise;therapistFabric.bumpScale=.018;
 const therapistChair=chair([3.3,0,-3.1],-.72,therapistFabric);
 const human=await createHuman();human.group.position.set(-1.7,0,.15);human.group.rotation.y=.68;scene.add(human.group);
 // Desk objects hold the scene in everyday life.
 cyl(.43,.43,.045,wood,[-3.1,.69,.63]);cyl(.035,.055,.63,brass,[-3.1,.34,.63]);cyl(.25,.25,.025,brass,[-3.1,.03,.63]);
 const mug=cyl(.083,.071,.13,mat('#eee3cd',.35),[-3.12,.77,.64]);mesh(new THREE.TorusGeometry(.052,.015,10,24),mat('#eee3cd',.35),[-3.03,.78,.64]);cyl(.073,.073,.005,mat('#392418',.3),[-3.12,.837,.64]);
 for(let i=0;i<3;i++){const book=box(.36,.035,.23,mat(['#b18063','#24444d','#c2b59a'][i]),[-3.06,.73+i*.036,.30],scene,.004);book.rotation.y=.2-i*.15;}
 // The late-night stop has an ordinary landmark beside the phone: a small
 // analog clock resting on the books. Its time belongs to the fictional room.
 const bedsideClock=new THREE.Group();bedsideClock.position.set(-3.25,.96,.35);bedsideClock.lookAt(V(-4.7,1.65,2.1));scene.add(bedsideClock);
 const clockBody=cyl(.145,.145,.035,brass,[0,0,0],bedsideClock);clockBody.rotation.x=Math.PI/2;
 mesh(new THREE.CircleGeometry(.132,64),mat('#132b32',.55),[0,0,.019],bedsideClock);
 for(let i=0;i<12;i++){const a=i*Math.PI/6;const mark=box(.007,.015,.003,mat('#ecdfc5'),[Math.sin(a)*.115,Math.cos(a)*.115,.022],bedsideClock,.001);mark.rotation.z=-a;}
 for(const [angle,length,width] of [[(2+17/60)*Math.PI/6,.067,.008],[17*Math.PI/30,.101,.005]]){const hand=new THREE.Group();hand.rotation.z=-angle;bedsideClock.add(hand);box(width,length,.004,mat('#f3e6cc'),[0,length/2,.025],hand,.002);}
 mesh(new THREE.SphereGeometry(.009,12,8),brass,[0,0,.030],bedsideClock);
 // Lamp: warm, restrained practical light on face and hands.
 cyl(.20,.24,.035,brass,[-3.55,.025,-.9]);cyl(.019,.019,2.5,brass,[-3.55,1.27,-.9]);const shade=mesh(new THREE.LatheGeometry([new THREE.Vector2(.30,0),new THREE.Vector2(.29,.10),new THREE.Vector2(.25,.22),new THREE.Vector2(.17,.30),new THREE.Vector2(.065,.34)],64),brass,[-3.55,2.35,-.9]);shade.material.side=THREE.DoubleSide;const bulb=mesh(new THREE.SphereGeometry(.09,16,12),amber,[-3.55,2.40,-.9]);
 const lamp=new THREE.PointLight('#ffcd92',16,7,2);lamp.position.set(-3.55,2.4,-.9);scene.add(lamp);
 const key=new THREE.SpotLight('#ffe0b5',27,16,.65,.65,1.5);key.position.set(-3,5,4);key.target.position.set(-1.6,1,.2);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.0007;scene.add(key,key.target);
 const fill=new THREE.DirectionalLight('#b9d4e9',.8);fill.position.set(2,5,5);scene.add(fill);scene.add(new THREE.HemisphereLight('#91c5db','#34342a',.6));
 const backLight=new THREE.PointLight('#6ac7e8',20,10,2);backLight.position.set(2.7,3,-2);scene.add(backLight);
 // Plant with individually shaped leaves and stems.
 cyl(.29,.22,.48,mat('#aa8664',.94),[-4.4,.24,-2.45]);
 for(let i=0;i<14;i++){const a=i*2.399,h=.85+rand(i+70)*1.15,end=[-4.4+Math.cos(a)*.42,h,-2.45+Math.sin(a)*.42];tube([[-4.4,.3,-2.45],[-4.4,.7,-2.45],end],'#587266',.014);const leaf=mesh(new THREE.SphereGeometry(1,12,8),mat(i%2?'#41675c':'#66816a',.8),end);leaf.scale.set(.13,.31,.025);leaf.rotation.set(.4,a,.65);}
 // AI has a computational form, visibly different from a human being.
 const ai=new THREE.Group();ai.position.set(.50,1.75,.0);ai.scale.setScalar(.75);scene.add(ai);
 const veil=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,vertexShader:'varying vec3 vN;varying vec3 vV;void main(){vec4 p=modelViewMatrix*vec4(position,1.0);vN=normalize(normalMatrix*normal);vV=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 vN;varying vec3 vV;void main(){float rim=pow(1.0-abs(dot(normalize(vN),normalize(vV))),3.0);gl_FragColor=vec4(.23,.68,.8,rim*.16);}'});
 const aiCore=mesh(new THREE.SphereGeometry(.64,64,40),veil,[0,0,0],ai);
 const rings=[];
 for(let j=0;j<7;j++){const pts=[];for(let i=0;i<=180;i++){const a=i/180*Math.PI*2,r=.70+.07*Math.sin(a*3+j);pts.push([Math.cos(a)*r,Math.sin(a)*r,Math.sin(a*2+j)*.14]);}const line=tube(pts,j%3?'#8bd9e8':'#e4c094',.004,ai).o;line.rotation.set(j*.31,j*.46,j*.21);rings.push(line);}
 const spriteCanvas=document.createElement('canvas');spriteCanvas.width=spriteCanvas.height=64;const sctx=spriteCanvas.getContext('2d'),grad=sctx.createRadialGradient(32,32,0,32,32,31);grad.addColorStop(0,'#fff');grad.addColorStop(.2,'#fff');grad.addColorStop(1,'#ffffff00');sctx.fillStyle=grad;sctx.fillRect(0,0,64,64);const sprite=new THREE.CanvasTexture(spriteCanvas);
 const particles=new Float32Array(1600*3);for(let i=0;i<1600;i++){const u=rand(i+400)*2-1,a=rand(i+800)*Math.PI*2,r=.63+rand(i+1200)*.27;particles.set([Math.sqrt(1-u*u)*Math.cos(a)*r,u*r,Math.sqrt(1-u*u)*Math.sin(a)*r],i*3);}const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(particles,3));const dots=new THREE.Points(pg,new THREE.PointsMaterial({color:'#b6ecf2',map:sprite,size:.013,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}));ai.add(dots);
 const aiLight=new THREE.PointLight('#76ddf4',7,5,2);ai.add(aiLight);
 ring(.65,.025,new THREE.MeshBasicMaterial({color:'#619398',transparent:true,opacity:.28}),scene,[.5,0]);
 // Light carries the exchange from the phone into the artificial presence.
 const flows=[];for(let i=0;i<4;i++){let c=tube([[-1.39,1.15,.57],[-.8,1.25+i*.085,.35],[-.2,1.40+i*.1,.15],[.08,1.7+i*.05,.02]],i%2?'#a6e7ec':'#e3b780',.0035);flows.push(c.curve);}
 const pulses=Array.from({length:10},(_,i)=>mesh(new THREE.SphereGeometry(.010,12,8),i%2?cyan:amber,[0,0,0]));
 // A second point of view: therapist's chair, notes and a standing lamp.
 const therapist=await createHuman(true);therapist.group.position.set(3.3,0,-3.1);therapist.group.rotation.y=-.72;scene.add(therapist.group);
 const therapistLight=new THREE.SpotLight('#d1d4c3',23,12,.60,.85,1.5);therapistLight.position.set(4.1,4.2,-.7);therapistLight.target.position.set(3.3,1,-3.1);scene.add(therapistLight,therapistLight.target);
 const secondRug=cyl(1.3,1.3,.023,mat('#655d50',1),[3.3,-.038,-3.1]);secondRug.scale.z=.82;
 cyl(.44,.44,.035,wood,[2.25,.65,-2.95]);cyl(.032,.032,.62,brass,[2.25,.32,-2.95]);box(.29,.03,.38,mat('#e4d8bd'),[2.25,.69,-2.95]);
 // Constellation and paths are physical parts of the room, not background slides.
 const floating=new THREE.Group();scene.add(floating);
 for(let i=0;i<85;i++){const a=i*2.399,r=6+rand(i+90)*5;const p=mesh(new THREE.SphereGeometry(.012+rand(i+200)*.009,6,6),i%6?cyan:amber,[Math.cos(a)*r,.7+rand(i+330)*6,Math.sin(a)*r],floating);p.castShadow=false;}
 const footpath=tube([[-1.7,.015,1],[.5,.015,3.1],[3,.015,2.1],[4.7,.015,-1],[3.2,.015,-4]],'#a68d61',.012);
 const roomFinish=await finishRoom({scene,renderer,wood,brass,fabric,therapistFabric,stone,wall,rug,secondRug,ai,aiCore,dots,rings,panorama,key,fill,backLight,footpath,floating,patientChair,therapistChair});
 const aiFace=createAIFace(ai);
 const needsScenes=createNeedsScenes(scene);
 const roomRoot=new THREE.Group();roomRoot.name='physical-room';for(const object of [...scene.children])roomRoot.add(object);scene.add(roomRoot);
 const phoneSpace=createPhoneSpace(scene),exhibits=createRoomExhibits(scene);
 const needsBounds=[needsScenes.relational,needsScenes.agentic].map(o=>{const b=new THREE.Box3().setFromObject(o);return {center:b.getCenter(V(0,0,0)),size:b.getSize(V(0,0,0))};});
 // Each piece of text belongs to a location in the world. The camera reveals it.
 const labelScene=new THREE.Scene(),labelSets=[];
 // Use CSS-sized coordinates for browser compositing. The scene and camera
 // receive the same scale, so projected positions and parallax are unchanged.
 // This avoids nesting pixel borders/text inside transforms near scale(.004).
 const cssWorldScale=100,cssCamera=camera.clone();labelScene.scale.setScalar(cssWorldScale);
 for(let ci=0;ci<chapters.length;ci++){const group=new THREE.Group();labelScene.add(group);const chapter=chapters[ci];const labels=[];for(const spec of chapter.labels){const el=document.createElement('div');el.className='world-label '+(spec.tone||'');el.dir='rtl';el.dataset.chapter=ci;el.innerHTML=spec.html;formatInlineBidi(el);if(spec.width)el.style.width=spec.width+'px';const object=new CSS3DObject(el);el.style.pointerEvents='auto';el.dataset.label=labels.length;if(!el.querySelector('button')){el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label','הגדלה: '+(el.querySelector('h2')?.textContent||chapter.title));}el.title='לחצו להגדלה';object.position.set(...spec.pos);object.scale.setScalar(spec.scale||.004);const aim=V(...chapter.camera);object.lookAt(aim);group.add(object);labels.push({el,object,spec});}group.visible=false;labelSets.push({group,labels});}
 const fixedPlacements=new Map(),chapterExhibits=new Map();
 function measureLabel(label){
  const el=label.el.cloneNode(true),width=label.spec.width||520;
  el.style.cssText=`position:fixed;left:-20000px;top:0;width:${width}px;visibility:hidden;transform:none;display:block`;
  document.body.appendChild(el);const slot=el.querySelector('.needs-window');
  const result={width,height:el.offsetHeight||300,slot:slot?{x:slot.offsetLeft,w:slot.offsetWidth,y:slot.offsetTop,h:slot.offsetHeight}:null};el.remove();return result;
 }
 function designPlane(index){
  const shot=cameraStop(index,1.6),director=new THREE.PerspectiveCamera(43,1.6,.008,150);director.position.copy(shot.position);director.lookAt(shot.target);director.updateMatrixWorld();
  const unit=2*5.5*Math.tan(THREE.MathUtils.degToRad(43/2))/900;
  const forward=V(0,0,-1).applyQuaternion(director.quaternion),right=V(1,0,0).applyQuaternion(director.quaternion),up=V(0,1,0).applyQuaternion(director.quaternion);
  const point=(cx,cy,d=5.5)=>director.position.clone().addScaledVector(forward,d).addScaledVector(right,(cx-720)*unit*d/5.5).addScaledVector(up,(450-cy)*unit*d/5.5);
  return {director,unit,point};
 }
 function prepareExhibits(){
  // Dimensions and addresses are authored at one design viewport. Resizing
  // changes camera framing, never the furniture's location or size.
  for(const index of [5,6,7,12,15,16]){
   const source=index===16?15:index,plane=designPlane(source),ids=[];
   for(const [i,label] of labelSets[index].labels.entries()){
    if(i>0&&!isPhoneStop(index))continue;
    const id=index===16?'room-15-0':`${isPhoneStop(index)?'phone':'room'}-${index}-${i}`;
    const width=i===0?3.49:2.26,height=i===0?2.57:2.35;
    const position=plane.point(1440*(i===0?.718:.186),i===0?494:505);
    const m=measureLabel(label),scale=Math.min((width-.16)/m.width,(height-.16)/m.height);
    const frameWidth=isPhoneStop(index)?m.width*scale+.055:width,frameHeight=isPhoneStop(index)?m.height*scale+.055:height;
    if(index!==16)exhibits.addScreen(id,{position,quaternion:plane.director.quaternion.clone(),width:frameWidth,height:frameHeight,floorY:isPhoneStop(index)?-18:-.03,kind:isPhoneStop(index)?'phone':'room'});
    if(!fixedPlacements.has(index))fixedPlacements.set(index,new Map());
    fixedPlacements.get(index).set(i,{position:position.clone(),quaternion:plane.director.quaternion.clone(),scale,exhibit:id});ids.push(id);
    label.el.classList.add('mounted-evidence');
   }
   chapterExhibits.set(index,ids);
  }
  const index=11,plane=designPlane(index),placements=new Map();
  for(const [i,label] of labelSets[index].labels.entries()){
   const m=measureLabel(label),cx=1440*(i===0?.773:.227),cy=494,ratio=Math.min(1440*.36/m.width,540/m.height),scale=plane.unit*ratio;
   placements.set(i,{position:plane.point(cx,cy),quaternion:plane.director.quaternion.clone(),scale});
   if(!m.slot)continue;
   const model=i===0?needsScenes.relational:needsScenes.agentic,b=needsBounds[i],s=m.slot;
   const sx=cx+(s.x+s.w/2-m.width/2)*ratio,sy=cy+(s.y+s.h/2-m.height/2)*ratio;
   const modelScale=plane.unit*2.3/5.5*ratio*Math.min(s.w*.9/b.size.x,s.h*.86/b.size.y);
   model.quaternion.copy(plane.director.quaternion);model.scale.setScalar(modelScale);
   model.position.copy(plane.point(sx,sy,2.3)).sub(b.center.clone().multiplyScalar(modelScale).applyQuaternion(model.quaternion));
   model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model),center=bounds.getCenter(V(0,0,0)),size=bounds.getSize(V(0,0,0));
   exhibits.addPlinth(`needs-${i}`,{position:V(center.x,bounds.min.y-.018,center.z),width:size.x*.88,depth:Math.max(.43,size.z*.73),height:Math.max(.1,bounds.min.y+.012)});
  }
  fixedPlacements.set(index,placements);chapterExhibits.set(index,['needs-0','needs-1']);
 }
 prepareExhibits();
 // Fit each exhibition plane at its destination, then leave it anchored in
 // world space. Travelling or orbiting the camera creates real parallax.
 function layoutLabels(index){
  renderDirty=true;const ch=chapters[index],w=innerWidth,h=innerHeight;if(w<h)return;
  const shot=cameraStop(index,w/h),director=new THREE.PerspectiveCamera(43,w/h,.06,150);director.position.copy(shot.position);director.lookAt(shot.target);director.updateMatrixWorld();
  const d=5.5,unit=2*d*Math.tan(THREE.MathUtils.degToRad(43/2))/h;
  const forward=V(0,0,-1).applyQuaternion(director.quaternion),right=V(1,0,0).applyQuaternion(director.quaternion),up=V(0,1,0).applyQuaternion(director.quaternion),center=director.position.clone().addScaledVector(forward,d);
  const headingBottom=document.querySelector('#chapter-heading').getBoundingClientRect().bottom;const top=Math.max(h<780?185:224,headingBottom+18),bottom=h-136,available=bottom-top;
  for(const [i,l] of labelSets[index].labels.entries()){
   const fixed=fixedPlacements.get(index)?.get(i);
   if(fixed){l.object.position.copy(fixed.position);l.object.quaternion.copy(fixed.quaternion);l.object.scale.setScalar(fixed.scale);continue;}
   let maxWidth=w*.50,maxHeight=available,cx=w*.718,cy=(top+bottom)/2;
   const slot=l.spec.slot;
   if(slot==='viewpoints'){maxWidth=w*.32;maxHeight=available;cx=w*.194;cy=(top+bottom)/2;}
   if(slot==='insight'){maxWidth=w*.30;maxHeight=Math.min(available,h*.37);cx=w*.186;cy=bottom-maxHeight/2;}
   if(ch.layout==='paired'){maxWidth=w*.36;maxHeight=available;cx=w*(i===0?.773:.227);cy=(top+bottom)/2;}
   if(ch.layout==='triptych'){maxWidth=w*.287;maxHeight=available*.58;cx=w*(.822-i*.322);cy=bottom-maxHeight/2;}
   if(slot==='speech-left'){maxWidth=w*.26;maxHeight=h*.15;cx=w*.18;cy=top+h*.07;}
   if(slot==='speech-right'){maxWidth=w*.33;maxHeight=h*.29;cx=w*.79;cy=bottom-h*.13;}
   if(w/h<1.5&&slot?.startsWith('speech-')){maxWidth=w*.31;maxHeight=h*.15;cx=w*(slot==='speech-left'?.18:.81);cy=bottom-h*.06;}
   const naturalWidth=l.spec.width||520,naturalHeight=l.el.offsetHeight||300,ratio=Math.min(maxWidth/naturalWidth,maxHeight/naturalHeight);
   l.object.scale.setScalar(unit*ratio);l.object.position.copy(center).addScaledVector(right,(cx-w/2)*unit).addScaledVector(up,(h/2-cy)*unit);l.object.quaternion.copy(director.quaternion);
   if(index===11){
    const slotEl=l.el.querySelector('.needs-window');
    if(slotEl){
     const model=i===0?needsScenes.relational:needsScenes.agentic,b=needsBounds[i],nearD=2.3,nearUnit=unit*nearD/d;
     const sx=cx+(slotEl.offsetLeft+slotEl.offsetWidth/2-naturalWidth/2)*ratio,sy=cy+(slotEl.offsetTop+slotEl.offsetHeight/2-naturalHeight/2)*ratio;
     const modelScale=nearUnit*ratio*Math.min(slotEl.offsetWidth*.9/b.size.x,slotEl.offsetHeight*.86/b.size.y);
     model.quaternion.copy(director.quaternion);model.scale.setScalar(modelScale);
     model.position.copy(director.position).addScaledVector(forward,nearD).addScaledVector(right,(sx-w/2)*nearUnit).addScaledVector(up,(h/2-sy)*nearUnit).sub(b.center.clone().multiplyScalar(modelScale).applyQuaternion(director.quaternion));
    }
   }
  }
 }
 const chartGroup=new THREE.Group();roomRoot.add(chartGroup);
 // Finding cues are symbolic, never additional data encodings.
 const cueGroup=new THREE.Group();roomRoot.add(cueGroup);
 const cueMaterial=new THREE.MeshBasicMaterial({color:'#a4e7df',transparent:true,opacity:.5,depthWrite:false});
 const patientHalo=ring(.83,.033,cueMaterial,cueGroup,[-1.7,.15]);
 const aiHalo=ring(.8,.042,cueMaterial.clone(),cueGroup,[.5,0]);
 const bridge=tube([[-1.7,.055,.15],[-.2,.08,-1.2],[1.7,.08,-2],[3.3,.055,-3.1]],'#b4e6df',.017,cueGroup).o;
 const steps=[];for(let i=0;i<4;i++){const step=ring(.10,.038,cueMaterial.clone(),cueGroup,[-1.4+i*.40,1.25+i*.24]);steps.push(step);}
 let cueKind='';
 function setCue(ch){cueKind=ch.sceneCue?.kind||'';cueGroup.visible=!!cueKind;patientHalo.visible=['availability','ambivalence','change','gap'].includes(cueKind);aiHalo.visible=['availability','ambivalence','change'].includes(cueKind);bridge.visible=cueKind==='bridge';steps.forEach(x=>x.visible=cueKind==='agency');patientHalo.material.color.set(cueKind==='gap'?'#eac68b':cueKind==='ambivalence'?'#e3a898':'#a4e7df');aiHalo.material.color.set('#a4e7df');}
 let current=-1,transition=null,still=matchMedia('(prefers-reduced-motion: reduce)').matches,exploring=false,paused=false;let currentTarget=V(0,1.2,0);let tick=0,settledAt=0;const clock=new THREE.Clock();
 const homeCamera=V(0,0,0),pointer=new THREE.Vector2(),drag=new THREE.Vector2(),sway=new THREE.Vector2();let grab=null;
 const liveRight=V(1,0,0),liveUp=V(0,1,0),desiredSway=new THREE.Vector2();
 const clamp=THREE.MathUtils.clamp;
 function resetSway(){pointer.set(0,0);drag.set(0,0);sway.set(0,0);grab=null;settledAt=tick;}
 container.addEventListener('pointerdown',e=>{if(exploring||still||paused||transition||e.button!==0||e.target.closest('button,a'))return;grab={id:e.pointerId,x:e.clientX,y:e.clientY,base:drag.clone(),moved:false};});
 container.addEventListener('pointermove',e=>{if(exploring||still||paused||transition)return;if(grab?.id===e.pointerId){if(Math.hypot(e.clientX-grab.x,e.clientY-grab.y)>6){grab.moved=true;container.setPointerCapture(e.pointerId);}drag.set(clamp(grab.base.x+(e.clientX-grab.x)/Math.min(innerWidth*.20,240),-1,1),clamp(grab.base.y+(e.clientY-grab.y)/Math.min(innerHeight*.22,180),-1,1));}else if(e.pointerType==='mouse'){pointer.set(clamp((e.clientX/innerWidth-.5)*2,-1,1),clamp((e.clientY/innerHeight-.5)*2,-1,1));}});
 function release(e){if(grab?.id===e.pointerId){if(grab.moved)container.dataset.suppressClickUntil=performance.now()+400;grab=null;if(container.hasPointerCapture(e.pointerId))container.releasePointerCapture(e.pointerId);}}
 container.addEventListener('pointerup',release);container.addEventListener('pointercancel',release);
 container.addEventListener('pointerleave',()=>{if(!grab)pointer.set(0,0);});
 container.addEventListener('dblclick',()=>{if(!exploring){drag.set(0,0);pointer.set(0,0);}});
 function chart(ch){while(chartGroup.children.length){const o=chartGroup.children[0];chartGroup.remove(o);o.traverse(x=>{x.geometry?.dispose();if(x.material?.dispose)x.material.dispose();});}
  if(ch.visual==='population'){const f=window.SOURCE_FACTS.facts,n=f.n_w1.value,lit=f.n_users.value;const geo=new THREE.SphereGeometry(.034,6,4),m=new THREE.MeshStandardMaterial({color:'#e7d5a9',emissive:'#bea078',emissiveIntensity:.25}),off=mat('#315260',.6);const active=new THREE.InstancedMesh(geo,m,lit),inactive=new THREE.InstancedMesh(geo.clone(),off,n-lit);const dummy=new THREE.Object3D();for(let i=0;i<n;i++){const a=(i%40)/40*Math.PI*2,r=4.3+Math.floor(i/40)*.045;dummy.position.set(Math.cos(a)*r,.28+Math.floor(i/40)*.13,Math.sin(a)*r);dummy.updateMatrix();(i<lit?active:inactive).setMatrixAt(i<lit?i:i-lit,dummy.matrix);}chartGroup.add(active,inactive);}
  if(ch.visual==='needs'){const ids=['need_com_users','need_con_users','need_pred_users','need_tru_users','need_acc_users'];ids.forEach((id,i)=>{const h=window.SOURCE_FACTS.facts[id].value*.80;const c=i<3?'#7ccddb':'#d2a58e';const o=box(.24,h,.24,new THREE.MeshStandardMaterial({color:c,metalness:.3,roughness:.3,emissive:c,emissiveIntensity:.1}),[-.55+i*.48,h/2,-2.65],chartGroup);ring(.18,.04,new THREE.MeshBasicMaterial({color:c}),chartGroup,[-.55+i*.48,-2.65]);});}
  if(ch.visual==='paths'){const colors=['#8dcacf','#e2bc79','#e68e7e'];[[0,.2,2.8],[-1.8,.2,3.3],[2.8,.2,3.3]].forEach((p,i)=>{tube([[-1,.08,.9],[-.6,.12,1.8],p,[p[0],.2,p[2]+1.5]],colors[i],.018,chartGroup);});}
 }
 const journeyCue=document.createElement('div');journeyCue.className='journey-cue';journeyCue.hidden=true;
 const portalCover=document.createElement('div');portalCover.className='phone-portal-cover';portalCover.setAttribute('aria-hidden','true');container.appendChild(portalCover);
 const journeyPlace=document.createElement('strong'),journeyReason=document.createElement('span');journeyCue.append(journeyPlace,journeyReason);container.appendChild(journeyCue);
 function shotAt(index){return cameraStop(index,innerWidth/innerHeight);}
 function setChapter(index,immediate=false){
  renderDirty=true;const ch=chapters[index],shot=shotAt(index),previous=current,interrupted=!!transition;
  exploring=false;controls.enabled=false;
  const fromPos=camera.position.clone(),fromTarget=currentTarget.clone();resetSway();homeCamera.copy(shot.position);
  if(current<0||immediate||still){camera.position.copy(homeCamera);currentTarget.copy(shot.target);camera.lookAt(currentTarget);transition=null;}
  else {human.group.updateMatrixWorld(true);const phonePose={center:human.screen.getWorldPosition(V(0,0,0)),normal:V(0,0,1).applyQuaternion(human.screen.getWorldQuaternion(new THREE.Quaternion()))};transition=cameraJourney(fromPos,fromTarget,interrupted?-1:previous,index,innerWidth/innerHeight,phonePose);transition.lastTime=performance.now();}
  current=index;therapistLight.intensity=ch.therapist?32:13;lamp.intensity=shot.id==='night'?23:16;
  controls.minDistance=isPhoneStop(index)?3:2;controls.maxDistance=isPhoneStop(index)?8.5:26;
  controls.enablePan=!isPhoneStop(index);
  controls.minPolarAngle=isPhoneStop(index)?1.05:0;controls.maxPolarAngle=Math.PI*.49;
  controls.minAzimuthAngle=isPhoneStop(index)?-.6:-Infinity;controls.maxAzimuthAngle=isPhoneStop(index)?.6:Infinity;
  aiFace.setEnabled(index===10,immediate||still);
  journeyPlace.textContent=transitionCaption(previous,index);journeyReason.textContent='';journeyCue.hidden=!transition||!journeyPlace.textContent;
  container.classList.toggle('travelling',!!transition);
  labelSets.forEach((set,i)=>{set.group.visible=i===index;set.labels.forEach(x=>{x.el.style.opacity='1';x.el.style.visibility=transition?'hidden':'visible';x.el.setAttribute('aria-hidden',i===index?'false':'true');});});
  chart(ch);setCue(ch);controls.target.copy(currentTarget);resize();
  exhibits.setActive(chapterExhibits.get(index)||[]);portalCover.style.opacity='0';
 }
 function resize(reframe=false){renderDirty=true;const w=innerWidth,h=innerHeight;camera.aspect=w/h;camera.fov=w<h?62:43;camera.updateProjectionMatrix();renderer.setSize(w,h);composer.setSize(w,h);css.setSize(w,h);if(current>=0){layoutLabels(current);requestAnimationFrame(()=>layoutLabels(current));}if(reframe&&current>=0&&!exploring){resetSway();const shot=shotAt(current);homeCamera.copy(shot.position);camera.position.copy(homeCamera);currentTarget.copy(shot.target);camera.lookAt(currentTarget);transition=null;portalCover.style.opacity='0';journeyCue.hidden=true;container.classList.remove('travelling');}}
 addEventListener('resize',()=>resize(true));
 addEventListener('visibilitychange',()=>{renderDirty=true;if(transition)transition.lastTime=performance.now();});
 function setExplore(value){
  renderDirty=true;
  // Free view starts at the selected destination, including if the user opens
  // it before the phone crossing has reached its destination realm.
  if(value&&transition){const shot=shotAt(current);homeCamera.copy(shot.position);camera.position.copy(homeCamera);currentTarget.copy(shot.target);camera.lookAt(currentTarget);settledAt=tick;}
  exploring=value;controls.enabled=value;controls.target.copy(currentTarget);transition=null;portalCover.style.opacity='0';journeyCue.hidden=true;container.classList.remove('travelling');resetSway();
 }
 function animate(){requestAnimationFrame(animate);const rawDt=clock.getDelta(),dt=Math.min(rawDt,.05),active=!document.hidden&&!still&&!paused;if(document.hidden)return;if(!renderDirty&&!transition&&!exploring&&(still||paused))return;renderDirty=false;if(active)tick+=dt;const t=tick;
  if(transition){const now=performance.now();if(!document.hidden&&!paused)transition.elapsed+=now-transition.lastTime;transition.lastTime=now;const p=Math.min(transition.elapsed/transition.duration,1),pose=transition.sample(p);camera.position.copy(pose.position);currentTarget.copy(pose.target);camera.lookAt(currentTarget);portalCover.style.opacity=String(pose.cover||0);if(p===1){transition=null;portalCover.style.opacity='0';settledAt=tick;controls.target.copy(currentTarget);journeyCue.hidden=true;container.classList.remove('travelling');}}
  else if(current>=0){labelSets[current].labels.forEach(l=>l.el.style.visibility='visible');if(!exploring){
   if(active){const ease=Math.min((tick-settledAt)/1.3,1);desiredSway.set((pointer.x*.075+drag.x*.095)*ease,(-pointer.y*.025-drag.y*.025)*ease);sway.lerp(desiredSway,1-Math.exp(-dt*3.8));camera.position.copy(homeCamera);camera.lookAt(currentTarget);liveRight.set(1,0,0).applyQuaternion(camera.quaternion);liveUp.set(0,1,0).applyQuaternion(camera.quaternion);camera.position.addScaledVector(liveRight,sway.x).addScaledVector(liveUp,sway.y);camera.lookAt(currentTarget);}
   else if(still){camera.position.copy(homeCamera);camera.lookAt(currentTarget);}
  }else controls.update();}
  const writing=TOUR_STOPS[current]?.activity==='type',atStop=tick-settledAt;human.update(t,!active,chapters[current]?.typing&&(!!transition||(writing&&(atStop<6||(atStop>12&&atStop<16)))));therapist.update(t,!active);if(active){patientHalo.material.opacity=.34+Math.sin(t*1.4)*.12;aiHalo.material.opacity=.35+Math.sin(t*1.4+Math.PI)*.13;steps.forEach((step,i)=>step.material.opacity=.28+.25*(1+Math.sin(t*1.7-i*.9))/2);bridge.material.opacity=.45+Math.sin(t*.8)*.09;ai.position.y=1.75+Math.sin(t*.65)*.035;aiCore.rotation.y=t*.08;dots.rotation.y=t*.04;rings.forEach((r,i)=>{r.rotation.z=t*(i%2?-.04:.04)+i*.21;});pulses.forEach((p,i)=>p.position.copy(flows[i%3].getPoint((t*.10+i/10)%1)));}
  const inPhone=camera.position.y < -8;roomRoot.visible=!inPhone;phoneSpace.setEnabled(inPhone);phoneSpace.update(t,!active);exhibits.update(t,!active);document.body.dataset.realm=inPhone?'phone':'room';
  for(const group of scene.getObjectByName('room-exhibits').children)group.visible=group.name.includes('phone-')===inPhone;
  const mounted=fixedPlacements.get(current),primary=mounted?.values().next().value;
  let reveal=transition?0:1;
  if(transition&&primary){const facing=V(0,0,1).applyQuaternion(primary.quaternion).dot(camera.position.clone().sub(primary.position).normalize()),distance=camera.position.distanceTo(primary.position);const p=transition.elapsed/transition.duration;reveal=clamp((9-distance)/3,0,1)*clamp((facing-.55)/.3,0,1);if(transition.portal)reveal*=clamp((p-.76)/.18,0,1);}
  else if(transition)reveal=transition.elapsed/transition.duration>.95?1:0;
  for(const l of labelSets[current].labels){l.el.style.visibility=reveal>.015?'visible':'hidden';l.el.style.opacity=String(reveal);l.el.style.pointerEvents=reveal>.98?'auto':'none';l.el.setAttribute('aria-hidden',reveal>.98?'false':'true');}
  needsScenes.setEnabled(!inPhone&&innerWidth>=innerHeight);needsScenes.update(t,!active);
  roomFinish.update(t);aiFace.update(dt,!active);renderer.info.reset();composer.render();
  cssCamera.copy(camera);cssCamera.position.multiplyScalar(cssWorldScale);cssCamera.near*=cssWorldScale;cssCamera.far*=cssWorldScale;cssCamera.updateProjectionMatrix();cssCamera.updateMatrixWorld();css.render(labelScene,cssCamera);
 }
 setChapter(0,true);animate();
 return {setChapter,setExplore,setMotion(value){renderDirty=true;still=value;resetSway();},setPaused(value){renderDirty=true;paused=value;pointer.set(0,0);if(transition)transition.lastTime=performance.now();},getState(){return {chapter:current,shot:TOUR_STOPS[current]?.id,place:TOUR_STOPS[current]?.place,realm:camera.position.y < -8?'phone':'room',exhibits:exhibits.getState(),phoneInterior:phoneSpace.getState(),journey:transition?{from:transition.fromIndex,to:transition.toIndex,progress:transition.elapsed/transition.duration,duration:transition.duration,length:transition.length,portal:!!transition.portal}:null,modelLoaded:true,modelMeshes:human.group.children.length,camera:camera.position.toArray(),homeCamera:homeCamera.toArray(),target:currentTarget.toArray(),liveMotion:!still&&!paused&&!exploring,sway:sway.toArray(),drag:drag.toArray(),typingActivity:human.activity,thumb:human.bones.RightHandThumb2.quaternion.toArray(),sceneCue:cueKind,transitioning:!!transition,render:renderer.info.render,labels:labelSets[current]?.labels.map(l=>({html:l.el.textContent,position:l.object.position.toArray()}))};},scene,camera,human};
}
