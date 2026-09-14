import * as THREE from 'three';

// Art direction: a quiet, inhabited room, with the AI as the single luminous
// sculpture. All details remain geometry/materials in the live Three.js scene.
export async function finishRoom(parts){
  const {scene,renderer,wood,brass,fabric,therapistFabric,stone,wall,rug,secondRug,ai,aiCore,dots,rings,panorama,key,fill,backLight,footpath,floating,patientChair,therapistChair}=parts;
  const loader=new THREE.TextureLoader();
  const [color,normal,rough]=await Promise.all(['oak-color.jpg','oak-normal.jpg','oak-roughness.jpg'].map(n=>loader.loadAsync('./assets/materials/'+n)));
  color.colorSpace=THREE.SRGBColorSpace;
  for(const tx of [color,normal,rough]){tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
  wood.map=color;wood.normalMap=normal;wood.normalScale=new THREE.Vector2(.24,.24);wood.roughnessMap=rough;wood.color.set('#b59879');wood.roughness=.83;wood.needsUpdate=true;
  brass.color.set('#b49c75');brass.roughness=.44;brass.metalness=.7;
  fabric.color.set('#c9baa4');fabric.bumpScale=.006;
  therapistFabric.color.set('#436068');therapistFabric.bumpScale=.006;
  stone.color.set('#263238');stone.roughness=.86;stone.metalness=0;stone.bumpScale=.008;
  const [stoneColor,stoneNormal,stoneRough]=await Promise.all(['stone-color.jpg','stone-normal.jpg','stone-roughness.jpg'].map(n=>loader.loadAsync('./assets/materials/'+n)));
  stoneColor.colorSpace=THREE.SRGBColorSpace;
  for(const tx of [stoneColor,stoneNormal,stoneRough]){tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(12,12);tx.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
  stone.map=stoneColor;stone.normalMap=stoneNormal;stone.normalScale=new THREE.Vector2(.035,.035);stone.roughnessMap=stoneRough;stone.color.set('#697880');stone.bumpMap=null;stone.needsUpdate=true;
  stone.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb=diffuseColor.rgb*.18+vec3(.037,.045,.050);').replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor,.83,.97);');};
  stone.customProgramCacheKey=()=> 'quiet-stone-v2';
  for(const r of [rug,secondRug]){r.material.bumpMap=fabric.bumpMap;r.material.bumpScale=.007;r.material.roughness=1;r.material.color.set('#645f53');r.material.needsUpdate=true;}
  panorama.material.color.set('#707e91');
  key.color.set('#ffe5c8');key.intensity=24;key.penumbra=.9;key.shadow.normalBias=.018;
  fill.color.set('#d5e0e8');fill.intensity=.55;
  backLight.color.set('#a0c5d8');backLight.intensity=12;
  scene.environmentIntensity=.28;
  footpath.o.material.opacity=.19;
  floating.visible=false;

  // Upholstery piping follows the existing cushion contours and back tilt.
  const roundedLoop=(w,h,r)=>{
    const pts=[];
    for(let c=0;c<4;c++){
      const centers=[[w/2-r,h/2-r],[-w/2+r,h/2-r],[-w/2+r,-h/2+r],[w/2-r,-h/2+r]],start=c*Math.PI/2;
      for(let s=0;s<=12;s++){const a=start+s/12*Math.PI/2;pts.push(new THREE.Vector2(centers[c][0]+Math.cos(a)*r,centers[c][1]+Math.sin(a)*r));}
    }
    pts.push(pts[0].clone());return pts;
  };
  for(const [chair,tone] of [[patientChair,'#8d806c'],[therapistChair,'#29434a']]){
    const piping=new THREE.MeshStandardMaterial({color:tone,roughness:1});
    const seat=roundedLoop(.78,.78,.095).map(p=>new THREE.Vector3(p.x,.74,p.y+.03));
    const back=roundedLoop(.87,.95,.095).map(p=>new THREE.Vector3(p.x,p.y,.116).applyAxisAngle(new THREE.Vector3(1,0,0),-.13).add(new THREE.Vector3(0,1.09,-.35)));
    for(const pts of [seat,back])chair.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),160,.0035,5,false),piping));
  }

  // Continuous, finely spaced walnut joinery at the existing wall radius.
  // Instancing keeps the added architecture to one draw call.
  wall.material.color.set('#261d18');
  const slatMaterial=wood.clone();slatMaterial.color.set('#9a704b');slatMaterial.normalScale.set(.12,.12);
  slatMaterial.onBeforeCompile=shader=>{
    shader.vertexShader='varying float vRoomHeight;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRoomHeight=position.y+2.48;');
    shader.fragmentShader='varying float vRoomHeight;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nfloat cove=exp(-max(vRoomHeight,0.0)*1.65)+0.75*exp(-abs(vRoomHeight-4.93)*2.5);totalEmissiveRadiance+=vec3(0.25,0.095,0.025)*cove;');
  };
  slatMaterial.customProgramCacheKey=()=> 'walnut-cove-v1';
  const slats=new THREE.InstancedMesh(new THREE.BoxGeometry(.036,4.96,.055),slatMaterial,148),dummy=new THREE.Object3D();
  for(let i=0;i<148;i++){const a=Math.PI*1.07+(i+.5)/148*Math.PI*.38;dummy.position.set(Math.sin(a)*7.72,2.48,Math.cos(a)*7.72);dummy.rotation.y=a;dummy.updateMatrix();slats.setMatrixAt(i,dummy.matrix);}
  slats.receiveShadow=true;scene.add(slats);
  const covePoints=[];for(let i=0;i<=100;i++){const a=Math.PI*1.07+i/100*Math.PI*.38;covePoints.push(new THREE.Vector3(Math.sin(a)*7.68,.045,Math.cos(a)*7.68));}
  const cove=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(covePoints),100,.012,6,false),new THREE.MeshBasicMaterial({color:new THREE.Color('#e2aa65').multiplyScalar(1.5)}));scene.add(cove);
  const wash=new THREE.PointLight('#edc394',13,11,2);wash.position.set(-4.9,3.4,-3.9);scene.add(wash);

  // Soft contact patches supplement the existing mapped key-light shadow.
  // The technique is intentionally cheap enough for a live presentation.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');
  const grad=ctx.createRadialGradient(128,128,10,128,128,124);grad.addColorStop(0,'rgba(0,0,0,.62)');grad.addColorStop(.35,'rgba(0,0,0,.48)');grad.addColorStop(.7,'rgba(0,0,0,.16)');grad.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,256,256);
  const shadowMap=new THREE.CanvasTexture(canvas);
  for(const [x,z,w,d] of [[-1.7,.3,2.15,2.1],[3.3,-2.95,2.1,2],[-3.1,.63,.95,.9],[2.25,-2.95,.95,.9],[-4.4,-2.45,.9,.9]]){
    const patch=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false,toneMapped:false}));patch.rotation.x=-Math.PI/2;patch.position.set(x,-.019,z);scene.add(patch);
  }

  // A few broad, folded spectral ribbons give the AI a legible silhouette.
  // No transmissive screen-space pass: smooth local geometry works on WebGL2.
  rings.forEach(r=>r.visible=false);dots.material.opacity=.20;dots.material.size=.008;
  aiCore.material.fragmentShader=aiCore.material.fragmentShader.replace('rim*.16','rim*.30');aiCore.material.needsUpdate=true;
  const ribbonGroup=new THREE.Group();ai.add(ribbonGroup);
  for(let j=0;j<4;j++){
    const positions=[],uvs=[],indices=[],segments=240;
    for(let i=0;i<=segments;i++){
      const a=i/segments*Math.PI*2;
      for(let side=0;side<2;side++){
        const width=(side?1:-1)*(.071+.019*Math.sin(a*2+j));
        const radius=.73+width*Math.cos(a*1.5+j*.3);
        positions.push(Math.cos(a)*radius,Math.sin(a)*radius,.10*Math.sin(a*2+j)+width*Math.sin(a*1.5+j*.3));uvs.push(i/segments,side);
      }
      if(i<segments){const n=i*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
    const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{tint:{value:new THREE.Color(j===3?'#c6bba0':'#74bec7')}},vertexShader:'varying vec3 vN;varying vec3 vV;varying vec2 vUv;void main(){vec4 p=modelViewMatrix*vec4(position,1.0);vN=normalize(normalMatrix*normal);vV=normalize(-p.xyz);vUv=uv;gl_Position=projectionMatrix*p;}',fragmentShader:'uniform vec3 tint;varying vec3 vN;varying vec3 vV;varying vec2 vUv;void main(){float rim=pow(clamp(1.0-abs(dot(normalize(vN),normalize(vV))),0.0,1.0),1.4);float edge=pow(clamp(abs(vUv.y-.5)*2.0,0.0,1.0),8.0);vec3 c=tint*(.40+rim*.8+edge*.5);gl_FragColor=vec4(c,.18+rim*.44+edge*.22);}'});
    const ribbon=new THREE.Mesh(geometry,material);ribbon.rotation.set(.30+j*.66,.18+j*.69,j*.65);ribbonGroup.add(ribbon);
  }
  const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=128;const g=glowCanvas.getContext('2d'),glow=g.createRadialGradient(64,64,0,64,64,63);glow.addColorStop(0,'rgba(228,255,255,1)');glow.addColorStop(.12,'rgba(138,223,239,.72)');glow.addColorStop(.4,'rgba(105,198,218,.13)');glow.addColorStop(1,'rgba(76,170,200,0)');g.fillStyle=glow;g.fillRect(0,0,128,128);
  const nucleus=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(glowCanvas),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));nucleus.scale.set(.47,.47,1);ai.add(nucleus);
  return {update(t){ribbonGroup.rotation.y=t*.025;ribbonGroup.rotation.z=Math.sin(t*.15)*.025;},details:{finish:'walnut-and-spectral-ribbons',materialTextures:6,instancedSlats:148,ribbons:4}};
}
