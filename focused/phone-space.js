import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// The phone is a separate, enclosed set below the furnished room. All geometry
// is local to this origin; these camera poses are already in world coordinates.
export const PHONE_ORIGIN = Object.freeze([0, -18, 0]);
export const PHONE_STOPS = Object.freeze([
  {id: 'phone-topics', eye: [-7, -14.6, 6.8], focus: [-7, -15.2, -.5], frame: .5},
  {id: 'phone-availability', eye: [0, -14.6, 6.8], focus: [0, -15.2, -.5], frame: .5},
  {id: 'phone-response', eye: [7, -14.6, 6.8], focus: [7, -15.2, -.5], frame: .5}
].map(stop => Object.freeze({...stop,
  eye: Object.freeze(stop.eye), focus: Object.freeze(stop.focus)})));

/** Geometry and local light only. Text, research surfaces and camera travel are
 * owned by the world/display modules. update() expects seconds from their clock.
 */
export function createPhoneSpace(scene) {
  const group = new THREE.Group();
  group.name = 'phone-conversation-interior';
  group.position.set(...PHONE_ORIGIN);
  group.visible = false;
  scene.add(group);

  const surface = (color, roughness = .65, metalness = .12, emissive = '#000000', emissiveIntensity = 0) =>
    new THREE.MeshStandardMaterial({color, roughness, metalness, emissive, emissiveIntensity});
  const materials = {
    shell: surface('#0c2029', .8, .12),
    recess: surface('#102d37', .76, .12),
    floor: surface('#172e36', .43, .22),
    edge: surface('#23434b', .5, .3),
    bronze: surface('#9f8260', .34, .68),
    bronzeDark: surface('#594e3d', .54, .5),
    teal: surface('#6ea8ae', .31, .5, '#1e5963', .22),
    warm: surface('#b99973', .39, .53, '#684324', .10),
    cove: new THREE.MeshBasicMaterial({color: '#427981'}),
    warmCove: new THREE.MeshBasicMaterial({color: '#786a52'}),
    warmDots: new THREE.MeshBasicMaterial({color: '#41382e'}),
    tealDots: new THREE.MeshBasicMaterial({color: '#d0e0de'})
  };
  const animatedForms = [];
  const localLights = [];
  const vector = p => new THREE.Vector3(...p);
  function mesh(geometry, material, position = [0, 0, 0], parent = group, name = '') {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(...position);
    object.name = name;
    object.receiveShadow = false;
    object.castShadow = false;
    parent.add(object);
    return object;
  }
  function rounded(w, h, d, radius, material, position, parent = group, name = '') {
    return mesh(new RoundedBoxGeometry(w, h, d, 5, radius), material, position, parent, name);
  }
  function tube(points, radius, material, parent = group, closed = false, segments = 96) {
    const curve = new THREE.CatmullRomCurve3(points.map(vector), closed, 'centripetal');
    return mesh(new THREE.TubeGeometry(curve, segments, radius, 8, closed), material, [0, 0, 0], parent);
  }
  function ring(radius, y, material, parent = group, thickness = .012) {
    const object = mesh(new THREE.TorusGeometry(radius, thickness, 8, 96), material, [0, y, 0], parent);
    object.rotation.x = Math.PI / 2;
    return object;
  }

  // Keep the rear at z=-9 while extending the front to z=19. Responsive camera
  // fitting reaches roughly z=12, so both compact and portrait reading poses
  // remain enclosed with room for their near plane and bounded movement.
  rounded(26, .38, 28, .17, materials.floor, [0, -.21, 5], group, 'continuous-floor');
  rounded(26, .38, 28, .17, materials.shell, [0, 7.16, 5], group, 'continuous-ceiling');
  rounded(26, 7.25, .42, .2, materials.shell, [0, 3.5, -8.82], group, 'rear-enclosure');
  rounded(26, 7.25, .42, .2, materials.shell, [0, 3.5, 18.82], group, 'entry-enclosure');
  for (const x of [-12.82, 12.82])
    rounded(.42, 7.25, 27.3, .2, materials.shell, [x, 3.5, 5], group, 'side-enclosure');

  // Sweep a curved floor-to-wall/ceiling-to-wall junction along the full width.
  // Analytic normals keep the broad coves smooth without a dense tessellation.
  function cove(top = false) {
    const positions = [], normals = [], indices = [], segments = 32, radius = 1.1;
    for (let i = 0; i <= segments; i++) {
      const angle = i / segments * Math.PI / 2;
      const y = radius * (1 - Math.cos(angle));
      const z = -7.55 - radius * Math.sin(angle);
      for (const x of [-12.6, 12.6]) {
        positions.push(x, top ? 7 - y : y, z);
        normals.push(0, (top ? -1 : 1) * Math.cos(angle), Math.sin(angle));
      }
      if (i < segments) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setIndex(indices);
    const material = materials.recess.clone();
    material.side = THREE.DoubleSide;
    mesh(geometry, material, [0, 0, 0], group, top ? 'upper-cove' : 'floor-cove');
  }
  cove();
  cove(true);
  rounded(25.2, 5.03, .24, .10, materials.recess, [0, 3.5, -8.62]);
  for (const y of [1.11, 5.88])
    tube([[-12.3, y, -8.46], [0, y, -8.46], [12.3, y, -8.46]], .018, materials.cove);

  // Rounded vault ribs mark the boundaries between conversational stations.
  // They are architecture, not screen borders, and leave the transverse route
  // at z=6.8 completely open at the camera's height.
  for (const x of [-10.5, -3.5, 3.5, 10.5]) {
    const rib = [
      [x, .14, -6.55], [x, 1.3, -7.04], [x, 5.58, -7.04],
      [x, 6.29, -6.65], [x, 6.54, -5.7], [x, 6.54, 5.5],
      [x, 6.25, 6.63], [x, 5.58, 7.03], [x, .14, 7.03]
    ];
    tube(rib, .074, materials.edge, group, false, 144);
    tube(rib.map(p => [p[0] + .079, p[1], p[2]]), .010, materials.bronzeDark, group, false, 144);
  }

  // Quiet continuous inlays make the horizontal progress legible. No dots,
  // counts or heights represent research quantities.
  for (const z of [3.92, 4.03])
    tube([[-10.5, .004, z], [-7, .004, z], [0, .004, z], [7, .004, z], [10.5, .004, z]],
      z < 4 ? .014 : .009, z < 4 ? materials.bronzeDark : materials.cove);
  tube([[-10.7, .006, -.5], [-7, .006, .7], [-3.5, .006, -.4], [0, .006, .7],
    [3.5, .006, -.4], [7, .006, .7], [10.7, .006, -.5]], .012, materials.edge);

  // A single continuous contour makes the tail part of the message surface,
  // with a softly beveled edge rather than a triangle pasted onto a box.
  function messageGeometry() {
    const shape = new THREE.Shape();
    const w = .94, h = .48, r = .105, x = w / 2, y = h / 2;
    shape.moveTo(-x + r, y);
    shape.lineTo(x - r, y);
    shape.quadraticCurveTo(x, y, x, y - r);
    shape.lineTo(x, -y + r);
    shape.quadraticCurveTo(x, -y, x - .14, -y);
    shape.quadraticCurveTo(x - .10, -y - .08, x - .03, -y - .15);
    shape.quadraticCurveTo(x - .22, -y - .14, x - .31, -y);
    shape.lineTo(-x + r, -y);
    shape.quadraticCurveTo(-x, -y, -x, -y + r);
    shape.lineTo(-x, y - r);
    shape.quadraticCurveTo(-x, y, -x + r, y);
    shape.closePath();
    return new THREE.ExtrudeGeometry(shape, {depth: .09, bevelEnabled: true,
      bevelSegments: 5, steps: 1, bevelSize: .028, bevelThickness: .035, curveSegments: 18});
  }
  function bezelPoints(width, height, radius, z) {
    const points = [], centreY = 3.5;
    const corners = [[width / 2 - radius, height / 2 - radius],
      [-width / 2 + radius, height / 2 - radius],
      [-width / 2 + radius, -height / 2 + radius],
      [width / 2 - radius, -height / 2 + radius]];
    corners.forEach(([x, y], corner) => {
      for (let i = 0; i <= 16; i++) {
        const a = corner * Math.PI / 2 + i / 16 * Math.PI / 2;
        points.push([x + radius * Math.cos(a), centreY + y + radius * Math.sin(a), z]);
      }
    });
    return points;
  }
  const message = messageGeometry();
  const ellipsis = new THREE.SphereGeometry(.035, 16, 12);

  [-7, 0, 7].forEach((x, index) => {
    const bay = new THREE.Group();
    bay.position.x = x;
    bay.name = PHONE_STOPS[index].id;
    group.add(bay);

    // Low, broad architecture grounds the station without competing with the
    // separate left/right reading surfaces in front of it.
    rounded(5.85, .35, 1.25, .16, materials.edge, [0, .19, -5.8], bay, 'recessed-bench');
    rounded(5.6, .048, 1.01, .021, materials.recess, [0, .38, -5.77], bay);
    rounded(5.6, .026, .032, .012, materials.bronzeDark, [0, .1, -5.16], bay);
    tube([[-2.65, 6.6, -4.8], [0, 6.6, -4.8], [2.65, 6.6, -4.8]], .021, materials.cove, bay);

    // A softly rounded architectural aperture and discreet earpiece recall the
    // phone being entered. This is rear architecture, separate from evidence.
    tube(bezelPoints(5.75, 6.6, .72, -6.93), .115, materials.edge, bay, true, 192);
    tube(bezelPoints(5.54, 6.4, .67, -6.80), .021, materials.cove, bay, true, 192);
    rounded(.84, .105, .07, .034, materials.bronzeDark, [0, 6.40, -6.77], bay, 'phone-earpiece');
    rounded(.95, .035, .065, .016, materials.edge, [0, .42, -6.77], bay, 'phone-home-indicator');

    // Four alternating messages occupy the opening between the left dialogue
    // and right evidence. The stack is shifted left of each camera's focus;
    // its forms stay within +/-0.63 of that stack centre, including bevels.
    const sculpture = new THREE.Group();
    sculpture.name = 'digital-conversation-stack';
    sculpture.position.set(-.45, 0, -.18);
    bay.add(sculpture);
    for (let i = 0; i < 4; i++) {
      const human = i % 2 === 0;
      const material = (human ? materials.warm : materials.teal).clone();
      const form = mesh(message, material,
        [human ? -.105 : .105, 4.02 - i * .83, human ? -.04 : .16], sculpture,
        human ? 'human-conversation-message' : 'ai-conversation-message');
      form.rotation.y = human ? -.11 : .10;
      form.rotation.z = human ? -.025 : .025;
      if (human) form.scale.x = -1;
      for (let dot = -1; dot <= 1; dot++) {
        const object = mesh(ellipsis, human ? materials.warmDots : materials.tealDots,
          [dot * .135, .008, .129], form, 'message-ellipsis');
        object.scale.z = .28;
      }
      animatedForms.push({object: form, baseY: form.position.y,
        baseGlow: material.emissiveIntensity, phase: index * .8 + i * 1.1});
    }

    // Light is local, with no shadow-map or postprocessing dependency.
    const key = new THREE.PointLight('#9ecdd0', 38, 13, 2);
    key.position.set(x + 1.25, 5.8, 2.7);
    const warm = new THREE.PointLight('#d5b488', 17, 10, 2);
    warm.position.set(x - 2.7, 3.8, -.8);
    const back = new THREE.PointLight('#397987', 26, 9, 2);
    back.position.set(x, 3.6, -6.5);
    group.add(key, warm, back);
    localLights.push(key, warm, back);
  });

  // The threshold follows the front wall, behind every responsive reading pose.
  // It echoes a rounded phone aperture without carrying a second screen.
  const portalPoints = [
    [-8.24, .11, 18.5], [-8.24, 4.45, 18.5], [-8.08, 4.95, 18.5],
    [-7.58, 5.14, 18.5], [-6.42, 5.14, 18.5], [-5.92, 4.95, 18.5],
    [-5.76, 4.45, 18.5], [-5.76, .11, 18.5]
  ];
  tube(portalPoints, .075, materials.edge, group, false, 128);
  tube(portalPoints.map(p => [p[0], p[1], p[2] - .082]), .018, materials.cove, group, false, 128);
  rounded(2.48, .04, .74, .018, materials.bronzeDark, [-7, .005, 18.11], group, 'entry-threshold');

  let enabled = false;
  let lastTime = 0;
  let stillState = true;
  return {
    group,
    setEnabled(value) {
      enabled = Boolean(value);
      group.visible = enabled;
    },
    update(t = 0, still = false) {
      stillState = Boolean(still);
      if (!enabled || stillState) return;
      lastTime = Number.isFinite(t) ? t : lastTime;
      // Only millimetres of local movement: the architecture and
      // reading panels remain stationary, and still mode preserves the pose.
      for (const {object, baseY, baseGlow, phase} of animatedForms) {
        const breath = Math.sin(lastTime * .42 + phase);
        object.position.y = baseY + breath * .012;
        object.material.emissiveIntensity = baseGlow + breath * .013;
      }
    },
    getState() {
      return {enabled, still: stillState, time: lastTime, origin: [...PHONE_ORIGIN],
        stations: PHONE_STOPS.map(stop => stop.id), forms: animatedForms.length,
        localLights: localLights.length};
    }
  };
}
