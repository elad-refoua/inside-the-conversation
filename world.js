import * as THREE from 'three';
import {CSS3DRenderer,CSS3DObject} from 'three/addons/renderers/CSS3DRenderer.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {createHuman} from './human.js';

const V=(x,y,z)=>new THREE.Vector3(x,y,z);
export async function createWorld(container,chapters){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#08161e');scene.fog=new THREE.FogExp2('#08161e',.021);
 const camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.06,150);
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
 chair([-1.7,0,.15],.68);
 const therapistFabric=mat('#3f6366',.96);therapistFabric.bumpMap=fabricNoise;therapistFabric.bumpScale=.018;
 const therapistChair=chair([3.3,0,-3.1],-.72,therapistFabric);
 const human=await createHuman();human.group.position.set(-1.7,0,.15);human.group.rotation.y=.68;scene.add(human.group);
 // Desk objects hold the scene in everyday life.
 cyl(.43,.43,.045,wood,[-3.1,.69,.63]);cyl(.035,.055,.63,brass,[-3.1,.34,.63]);cyl(.25,.25,.025,brass,[-3.1,.03,.63]);
 const mug=cyl(.083,.071,.13,mat('#eee3cd',.35),[-3.12,.77,.64]);mesh(new THREE.TorusGeometry(.052,.015,10,24),mat('#eee3cd',.35),[-3.03,.78,.64]);cyl(.073,.073,.005,mat('#392418',.3),[-3.12,.837,.64]);
 for(let i=0;i<3;i++){const book=box(.36,.035,.23,mat(['#b18063','#24444d','#c2b59a'][i]),[-3.06,.73+i*.036,.30],scene,.004);book.rotation.y=.2-i*.15;}
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
 // Each piece of text belongs to a location in the world. The camera reveals it.
 const labelScene=new THREE.Scene(),labelSets=[];
 for(let ci=0;ci<chapters.length;ci++){const group=new THREE.Group();labelScene.add(group);const chapter=chapters[ci];const labels=[];for(const spec of chapter.labels){const el=document.createElement('div');el.className='world-label '+(spec.tone||'');el.dataset.chapter=ci;el.innerHTML=spec.html;if(spec.width)el.style.width=spec.width+'px';const object=new CSS3DObject(el);el.style.pointerEvents='none';object.position.set(...spec.pos);object.scale.setScalar(spec.scale||.004);const aim=V(...chapter.camera);object.lookAt(aim);group.add(object);labels.push({el,object,spec});}group.visible=false;labelSets.push({group,labels});}
 // Fit each exhibition plane at its destination, then leave it anchored in
 // world space. Travelling or orbiting the camera creates real parallax.
 function layoutLabels(index){
  const ch=chapters[index],w=innerWidth,h=innerHeight;if(w<h)return;
  const director=new THREE.PerspectiveCamera(43,w/h,.06,150);director.position.copy(cameraDestination(ch));director.lookAt(V(...ch.target));director.updateMatrixWorld();
  const d=5.5,unit=2*d*Math.tan(THREE.MathUtils.degToRad(43/2))/h;
  const forward=V(0,0,-1).applyQuaternion(director.quaternion),right=V(1,0,0).applyQuaternion(director.quaternion),up=V(0,1,0).applyQuaternion(director.quaternion),center=director.position.clone().addScaledVector(forward,d);
  const top=h<780?185:224,bottom=h-123,available=bottom-top;
  for(const [i,l] of labelSets[index].labels.entries()){
   let maxWidth=w*.50,maxHeight=available,cx=w*.282,cy=(top+bottom)/2;
   const slot=l.spec.slot;
   if(slot==='insight'){maxWidth=w*.30;maxHeight=Math.min(available,h*.37);cx=w*.814;cy=bottom-maxHeight/2;}
   if(ch.layout==='paired'){maxWidth=w*.36;maxHeight=available;cx=w*(i===0?.227:.773);cy=(top+bottom)/2;}
   if(ch.layout==='triptych'){maxWidth=w*.287;maxHeight=available*.58;cx=w*(.178+i*.322);cy=bottom-maxHeight/2;}
   if(slot==='speech-left'){maxWidth=w*.30;maxHeight=h*.15;cx=w*.243;cy=top+h*.07;}
   if(slot==='speech-right'){maxWidth=w*.33;maxHeight=h*.29;cx=w*.79;cy=bottom-h*.13;}
   const naturalWidth=l.spec.width||520,naturalHeight=l.el.offsetHeight||300,ratio=Math.min(maxWidth/naturalWidth,maxHeight/naturalHeight);
   l.object.scale.setScalar(unit*ratio);l.object.position.copy(center).addScaledVector(right,(cx-w/2)*unit).addScaledVector(up,(h/2-cy)*unit);l.object.quaternion.copy(director.quaternion);
  }
 }
 const chartGroup=new THREE.Group();scene.add(chartGroup);
 let current=-1,transition=null,still=matchMedia('(prefers-reduced-motion: reduce)').matches,exploring=false;let currentTarget=V(0,1.2,0);let tick=0;const clock=new THREE.Clock();
 function chart(ch){while(chartGroup.children.length){const o=chartGroup.children[0];chartGroup.remove(o);o.traverse(x=>{x.geometry?.dispose();if(x.material?.dispose)x.material.dispose();});}
  if(ch.visual==='population'){const f=window.SOURCE_FACTS.facts,n=f.n_w1.value,lit=f.n_users.value;const geo=new THREE.SphereGeometry(.034,6,4),m=new THREE.MeshStandardMaterial({color:'#e7d5a9',emissive:'#bea078',emissiveIntensity:.25}),off=mat('#315260',.6);const active=new THREE.InstancedMesh(geo,m,lit),inactive=new THREE.InstancedMesh(geo.clone(),off,n-lit);const dummy=new THREE.Object3D();for(let i=0;i<n;i++){const a=(i%40)/40*Math.PI*2,r=4.3+Math.floor(i/40)*.045;dummy.position.set(Math.cos(a)*r,.28+Math.floor(i/40)*.13,Math.sin(a)*r);dummy.updateMatrix();(i<lit?active:inactive).setMatrixAt(i<lit?i:i-lit,dummy.matrix);}chartGroup.add(active,inactive);}
  if(ch.visual==='needs'){const ids=['need_com_users','need_con_users','need_pred_users','need_tru_users','need_acc_users'];ids.forEach((id,i)=>{const h=window.SOURCE_FACTS.facts[id].value*.80;const c=i<3?'#7ccddb':'#d2a58e';const o=box(.24,h,.24,new THREE.MeshStandardMaterial({color:c,metalness:.3,roughness:.3,emissive:c,emissiveIntensity:.1}),[-.55+i*.48,h/2,-2.65],chartGroup);ring(.18,.04,new THREE.MeshBasicMaterial({color:c}),chartGroup,[-.55+i*.48,-2.65]);});}
  if(ch.visual==='paths'){const colors=['#8dcacf','#e2bc79','#e68e7e'];[[0,.2,2.8],[-1.8,.2,3.3],[2.8,.2,3.3]].forEach((p,i)=>{tube([[-1,.08,.9],[-.6,.12,1.8],p,[p[0],.2,p[2]+1.5]],colors[i],.018,chartGroup);});}
 }
 function cameraDestination(ch){const p=V(...ch.camera);if(innerWidth<innerHeight){const center=V(...ch.target);p.sub(center).multiplyScalar(1.7).add(center);}return p;}
 function setChapter(index,immediate=false){const ch=chapters[index];exploring=false;controls.enabled=false;const fromPos=camera.position.clone(),fromTarget=currentTarget.clone();if(current<0||immediate||still){camera.position.copy(cameraDestination(ch));currentTarget.set(...ch.target);camera.lookAt(currentTarget);transition=null;}else{transition={start:performance.now(),duration:2400,fromPos,fromTarget,toPos:cameraDestination(ch),toTarget:V(...ch.target)};}
 current=index;therapistLight.intensity=ch.therapist?32:13;labelSets.forEach((set,i)=>{set.group.visible=i===index;set.labels.forEach(x=>{x.el.style.opacity=(immediate||still)?'1':'0';x.el.setAttribute('aria-hidden',i===index?'false':'true');});});chart(ch);controls.target.copy(currentTarget);resize();
 }
 function resize(reframe=false){const w=innerWidth,h=innerHeight;camera.aspect=w/h;camera.fov=w<h?62:43;camera.updateProjectionMatrix();renderer.setSize(w,h);composer.setSize(w,h);css.setSize(w,h);if(current>=0){layoutLabels(current);requestAnimationFrame(()=>layoutLabels(current));}if(reframe&&current>=0&&!exploring){camera.position.copy(cameraDestination(chapters[current]));currentTarget.set(...chapters[current].target);camera.lookAt(currentTarget);transition=null;}}
 addEventListener('resize',()=>resize(true));
 function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);if(!document.hidden&&!still)tick+=dt;const t=tick;
  if(transition){let p=Math.min((performance.now()-transition.start)/transition.duration,1),e=p*p*p*(p*(p*6-15)+10);camera.position.lerpVectors(transition.fromPos,transition.toPos,e);currentTarget.lerpVectors(transition.fromTarget,transition.toTarget,e);camera.lookAt(currentTarget);for(const l of labelSets[current].labels)l.el.style.opacity=String(Math.max(0,(p-.55)/.45));if(p===1){transition=null;controls.target.copy(currentTarget);}}
  else if(current>=0){labelSets[current].labels.forEach(l=>l.el.style.opacity='1');if(!exploring){camera.lookAt(currentTarget);}else controls.update();}
  human.update(t,still);therapist.update(t,still);if(!still){ai.position.y=1.75+Math.sin(t*.65)*.035;aiCore.rotation.y=t*.08;dots.rotation.y=t*.04;rings.forEach((r,i)=>{r.rotation.z=t*(i%2?-.04:.04)+i*.21;});pulses.forEach((p,i)=>p.position.copy(flows[i%3].getPoint((t*.10+i/10)%1)));}
  renderer.info.reset();composer.render();css.render(labelScene,camera);
 }
 setChapter(0,true);animate();
 return {setChapter,setMotion(value){still=value;},setExplore(value){exploring=value;controls.enabled=value;controls.target.copy(currentTarget);transition=null;},getState(){return {chapter:current,modelLoaded:true,modelMeshes:human.group.children.length,camera:camera.position.toArray(),target:currentTarget.toArray(),render:renderer.info.render,labels:labelSets[current]?.labels.map(l=>({html:l.el.textContent,position:l.object.position.toArray()}))};},scene,camera,human};
}
