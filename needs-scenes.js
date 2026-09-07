import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Symbolic sculptures, not additional observations or measured quantities.
// Exposed frames use x right, y up, z toward the viewer. Their centres are the
// centres of the compositions, so they can be placed in a projected panel slot.
export function createNeedsScenes(scene){
  const group=new THREE.Group();group.name='needs-illustrations';group.visible=false;scene.add(group);
  const relational=new THREE.Group(),agentic=new THREE.Group();
  relational.name='relational-needs';agentic.name='agentic-needs';group.add(relational,agentic);
  const bronze=new THREE.MeshStandardMaterial({color:'#c6a773',roughness:.48,metalness:.32,emissive:'#8e754c',emissiveIntensity:.13});
  const bronzeShade=new THREE.MeshStandardMaterial({color:'#85724e',roughness:.78,metalness:.12});
  const teal=new THREE.MeshStandardMaterial({color:'#4eaaa8',roughness:.48,metalness:.24,emissive:'#246e72',emissiveIntensity:.13});
  const tealShade=new THREE.MeshStandardMaterial({color:'#315d65',roughness:.72,metalness:.10});
  const plinthMaterial=new THREE.MeshStandardMaterial({color:'#ccd0c5',roughness:.86,metalness:0});
  const stepMaterial=new THREE.MeshStandardMaterial({color:'#99bbb3',roughness:.77,metalness:.08});
  const goldLine=new THREE.MeshBasicMaterial({color:'#b29563',transparent:true,opacity:.66,depthWrite:false});
  const tealLine=new THREE.MeshBasicMaterial({color:'#357b7e',transparent:true,opacity:.85,depthWrite:false});
  const sphere=new THREE.SphereGeometry(1,24,18);
  const upright=new THREE.Vector3(0,1,0);
  function ellipsoid(parent,m,p,scale){const o=new THREE.Mesh(sphere,m);o.position.set(...p);o.scale.set(...scale);parent.add(o);return o;}
  function rounded(parent,m,p,size,radius=.04){const o=new THREE.Mesh(new RoundedBoxGeometry(...size,3,radius),m);o.position.set(...p);parent.add(o);return o;}
  function limb(parent,m,a,b,r1=.037,r2=r1*.86){
    const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),delta=to.clone().sub(from),length=delta.length();
    const o=new THREE.Mesh(new THREE.CylinderGeometry(r2,r1,length,16),m);o.position.copy(from).add(to).multiplyScalar(.5);o.quaternion.setFromUnitVectors(upright,delta.normalize());parent.add(o);
    for(const [p,r] of [[a,r1],[b,r2]])ellipsoid(parent,m,p,[r,r,r]);return o;
  }
  function line(parent,m,points,radius=.008){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const o=new THREE.Mesh(new THREE.TubeGeometry(curve,64,radius,6,false),m);parent.add(o);return o;}
  function body(parent,m,hip,shoulder,lean=0){
    const height=shoulder-hip,profile=[[0,0],[.087,0],[.119,.055],[.111,.15],[.104,.25],[.145,.72],[.143,.82],[.112,.95],[.047,1],[0,1]].map(([r,y])=>new THREE.Vector2(r,y*height));
    const o=new THREE.Mesh(new THREE.LatheGeometry(profile,32),m);o.position.y=hip;o.rotation.z=lean;parent.add(o);
    limb(parent,m,[0,shoulder-.01,0],[0,shoulder+.067,0],.044,.042);
    const head=new THREE.Group();head.position.set(0,shoulder+.17,.012);parent.add(head);
    ellipsoid(head,m,[0,0,0],[.099,.128,.098]);
    ellipsoid(head,m,[0,-.015,.094],[.018,.026,.025]);
    return {torso:o,head};
  }
  function seated(parent,x,turn){
    const figure=new THREE.Group();figure.position.x=x;figure.rotation.y=turn;parent.add(figure);
    const {head}=body(figure,bronze,.42,.75);head.rotation.x=.065;
    rounded(figure,bronzeShade,[0,.345,-.009],[.35,.065,.32],.028);
    rounded(figure,bronzeShade,[0,.53,-.145],[.34,.36,.058],.027);
    for(const side of [-1,1]){
      limb(figure,bronzeShade,[side*.135,.32,-.105],[side*.145,.035,-.13],.018,.020);
      limb(figure,bronzeShade,[side*.135,.32,.11],[side*.145,.035,.12],.018,.020);
      limb(figure,bronze,[side*.077,.445,.015],[side*.095,.37,.19],.066,.053);
      limb(figure,bronze,[side*.095,.37,.19],[side*.099,.092,.215],.041,.033);
      ellipsoid(figure,bronze,[side*.099,.057,.251],[.052,.045,.094]);
      limb(figure,bronze,[side*.124,.714,.012],[side*.175,.548,.093],.037,.031);
      limb(figure,bronze,[side*.175,.548,.093],[side*.106,.496,.208],.031,.025);
      ellipsoid(figure,bronze,[side*.099,.495,.228],[.031,.023,.048]);
    }
    return figure;
  }
  function presentationFrame(frame){
    const sculpture=new THREE.Group();sculpture.rotation.x=.23;sculpture.position.y=-.53;frame.add(sculpture);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(.96,.98,.036,72),plinthMaterial);base.scale.z=.54;base.position.y=.008;sculpture.add(base);return sculpture;
  }
  const connection=presentationFrame(relational),agency=presentationFrame(agentic);
  seated(connection,-.51,.77);seated(connection,.51,-.77);
  // The shared arc occupies the space between the two people, gently below
  // their heads, so the people remain the first thing the viewer recognises.
  line(connection,goldLine,[[-.30,.70,.18],[-.20,.81,.19],[0,.85,.20],[.20,.81,.19],[.30,.70,.18]],.010);
  line(connection,goldLine,[[-.38,.042,.13],[-.21,.044,.28],[0,.044,.32],[.21,.044,.28],[.38,.042,.13]],.009);

  // A person acts from the first step; the next steps and a second route make
  // both progress and choice visible. Step heights are purely illustrative.
  for(const [x,h,z] of [[-.47,.10,0],[.03,.22,-.015],[.54,.34,-.045]]){
    rounded(agency,stepMaterial,[x,h/2+.035,z],[.46,h,.36],.025);
    rounded(agency,tealShade,[x,h+.039,z+.152],[.40,.007,.015],.003);
  }
  const actor=new THREE.Group();actor.position.set(-.43,.135,.032);agency.add(actor);
  const {head:agentHead}=body(actor,teal,.48,.82,-.065);agentHead.rotation.y=.36;
  limb(actor,teal,[-.068,.501,0],[-.085,.273,.01],.051,.042);
  limb(actor,teal,[-.085,.273,.01],[-.085,.057,.038],.042,.028);
  ellipsoid(actor,teal,[-.078,.039,.060],[.058,.035,.085]);
  limb(actor,teal,[.068,.501,0],[.167,.308,.041],.051,.040);
  limb(actor,teal,[.167,.308,.041],[.234,.166,.036],.040,.028);
  const steppingFoot=ellipsoid(actor,teal,[.254,.150,.05],[.075,.034,.062]);steppingFoot.rotation.y=-.20;
  limb(actor,teal,[-.125,.773,0],[-.193,.63,.043],.037,.028);
  limb(actor,teal,[-.193,.63,.043],[-.177,.474,.087],.029,.024);
  ellipsoid(actor,teal,[-.174,.454,.093],[.026,.04,.030]);
  limb(actor,teal,[.125,.773,0],[.232,.699,.044],.037,.028);
  limb(actor,teal,[.232,.699,.044],[.337,.735,.053],.028,.023);
  ellipsoid(actor,teal,[.357,.743,.055],[.036,.022,.028]);
  line(agency,tealLine,[[-.43,.042,.28],[-.21,.042,.37],[.09,.042,.38],[.37,.042,.35],[.82,.042,.32]],.011);
  line(agency,tealLine,[[.09,.042,.38],[.39,.042,.18],[.75,.042,-.31]],.007);
  // Rounded arrowheads are large enough to read at a small presentation size.
  for(const [x,z,angle] of [[.82,.32,Math.PI/2],[.75,-.31,2.52]]){
    const arrow=new THREE.Mesh(new THREE.ConeGeometry(.034,.085,20),tealShade);arrow.position.set(x,.045,z);arrow.rotation.set(Math.PI/2,0,-angle);agency.add(arrow);
  }
  // These are static sculptures. Bake the detailed limbs into one mesh per
  // material so both illustrations together need only nine draw calls.
  for(const frame of [relational,agentic]){
    frame.updateMatrixWorld(true);const inverse=frame.matrixWorld.clone().invert(),batches=new Map();
    frame.traverse(o=>{if(!o.isMesh)return;const geometry=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geometry.applyMatrix4(inverse.clone().multiply(o.matrixWorld));if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(geometry);});
    frame.clear();
    for(const [material,geometries] of batches){const geometry=mergeGeometries(geometries,false);for(const part of geometries)part.dispose();geometry.computeBoundingSphere();frame.add(new THREE.Mesh(geometry,material));}
  }
  let enabled=false;
  return {
    group,relational,agentic,
    setEnabled(value){enabled=!!value;group.visible=enabled;},
    update(t,still=false){
      // Only the connection breathes, very slightly. The figures remain still
      // sculptures and the choice paths retain stable, legible shapes.
      goldLine.opacity=still?.66:.66+Math.sin(t*.7)*.045;
    },
    getState(){return {enabled,relationalFigures:2,agenticFigures:1,illustrativeSteps:3};}
  };
}
