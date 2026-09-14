import * as THREE from 'three';

// A perceived human face, revealed only during the anthropomorphism finding.
// It is a sculpted visual metaphor, not a second character or a data encoding.
export function createAIFace(ai){
  const face=new THREE.Group();face.name='anthropomorphism-face';
  face.rotation.y=-.967;face.position.set(0,.018,.018);ai.add(face);
  const materials=[];
  const material=(color,opacity,options={})=>{
    const m=new THREE.MeshStandardMaterial({color,roughness:.66,metalness:.10,
      transparent:true,opacity:0,depthWrite:false,...options});
    materials.push({material:m,opacity});return m;
  };
  const porcelain=material('#cbd8cd',.88,{emissive:'#547c7d',emissiveIntensity:.17});
  const eyeMaterial=material('#244c55',.95,{roughness:.9,metalness:0});
  const lidMaterial=material('#769f9b',.88,{roughness:.85});
  const lipMaterial=material('#6f9290',.76,{roughness:.9,metalness:0});
  const catchMaterial=material('#dceee6',.70,{emissive:'#c1e5de',emissiveIntensity:.25});
  const gaussian=(x,y,cx,cy,sx,sy)=>Math.exp(-.5*((x-cx)**2/sx**2+(y-cy)**2/sy**2));
  const halfHeight=.465;
  function width(y){
    const lower=THREE.MathUtils.smoothstep(-y,.06,.43);
    return .316*(1-lower*.27);
  }
  function relief(x,y){
    // Broad, overlapping forms avoid a separate geometric "button" nose.
    let z=.084*gaussian(x,y,0,.052,.036,.128)+.093*gaussian(x,y,0,-.061,.053,.043);
    z+=.027*(gaussian(x,y,-.142,-.058,.066,.075)+gaussian(x,y,.142,-.058,.066,.075));
    z-=.050*(gaussian(x,y,-.115,.092,.062,.037)+gaussian(x,y,.115,.092,.062,.037));
    z+=.026*(gaussian(x,y,-.115,.155,.076,.028)+gaussian(x,y,.115,.155,.076,.028));
    z+=.026*gaussian(x,y,0,-.184,.09,.032)+.031*gaussian(x,y,0,-.331,.103,.059);
    z-=.010*gaussian(x,y,0,-.234,.10,.021);
    return z;
  }
  function surface(x,y){
    const dome=Math.sqrt(Math.max(0,1-(x/width(y))**2-(y/halfHeight)**2));
    return .195*dome+relief(x,y);
  }
  const geometry=new THREE.SphereGeometry(1,96,64),p=geometry.attributes.position;
  for(let i=0;i<p.count;i++){
    const nx=p.getX(i),ny=p.getY(i),nz=p.getZ(i),y=ny*halfHeight,x=nx*width(y);
    const blend=THREE.MathUtils.smoothstep(nz,0,.32);
    const z=nz*(nz>=0?.195:.139)+relief(x,y)*blend;
    p.setXYZ(i,x,y,z);
  }
  geometry.computeVertexNormals();geometry.computeBoundingSphere();
  const mask=new THREE.Mesh(geometry,porcelain);mask.name='sculpted-face';face.add(mask);

  function contour(points,m,radius=.0023){
    const path=points.map(([x,y])=>new THREE.Vector3(x,y,surface(x,y)+.005));
    const line=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path),48,radius,6,false),m);
    face.add(line);return line;
  }
  for(const center of [-.115,.115]){
    // Small almond-shaped recesses, with restrained catchlights, keep the
    // expression neutral and readable without photorealistic staring eyes.
    const eye=new THREE.Shape();eye.moveTo(center-.055,.089);
    eye.bezierCurveTo(center-.028,.113,center+.025,.114,center+.055,.09);
    eye.bezierCurveTo(center+.026,.071,center-.026,.071,center-.055,.089);
    const eyeGeo=new THREE.ShapeGeometry(eye,20),ep=eyeGeo.attributes.position;
    for(let i=0;i<ep.count;i++)ep.setZ(i,surface(ep.getX(i),ep.getY(i))+.003);
    eyeGeo.computeVertexNormals();face.add(new THREE.Mesh(eyeGeo,eyeMaterial));
    contour([[center-.055,.089],[center-.026,.106],[center,.109],[center+.029,.103],[center+.055,.09]],lidMaterial,.0027);
    const glint=new THREE.Mesh(new THREE.SphereGeometry(.006,12,8),catchMaterial);
    glint.position.set(center-.009,.096,surface(center-.009,.096)+.007);glint.scale.y=.65;face.add(glint);
    // The eyebrow is a soft sculptural accent rather than a dark graphic line.
    contour([[center-.064,.151],[center-.035,.164],[center+.002,.167],[center+.040,.156]],lidMaterial,.0024);
  }
  contour([[-.072,-.183],[-.039,-.179],[0,-.184],[.039,-.179],[.072,-.183]],lipMaterial,.0025);
  contour([[-.038,-.093],[-.026,-.099],[-.019,-.097]],lipMaterial,.0015);
  contour([[.019,-.097],[.026,-.099],[.038,-.093]],lipMaterial,.0015);
  // One thin contour at the lower lip gives the smooth mask depth at a distance.
  contour([[-.044,-.201],[0,-.208],[.044,-.201]],lidMaterial,.0018);

  let target=0,weight=0;
  function apply(){
    face.visible=weight>.002;
    for(const entry of materials)entry.material.opacity=entry.opacity*weight;
    // The form coheres gently out of the centre of the cloud, without rotating
    // to follow the camera. It retains its place during the real camera tour.
    face.scale.setScalar(.74+weight*.06);
  }
  apply();
  return {
    setEnabled(enabled,immediate=false){target=enabled?1:0;if(immediate){weight=target;apply();}},
    update(dt,frozen=false){weight=frozen?target:THREE.MathUtils.lerp(weight,target,1-Math.exp(-dt*3.5));if(Math.abs(weight-target)<.002)weight=target;apply();},
    getState(){return {visible:face.visible,weight,enabled:target===1};}
  };
}
