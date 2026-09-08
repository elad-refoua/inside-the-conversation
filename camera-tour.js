import * as THREE from 'three';
import {PHONE_STOPS} from './phone-space.js?v=b171ca8a44';

// An authored walk through this room, in the existing PowerPoint order.
// Coordinates refer to the actual person, phone, table, AI and therapist.
export const TOUR_STOPS = [
  {id:'arrival',place:'בתוך השיחה',reason:'אדם, בינה ומטפלת באותו מרחב',eye:[-.8,2.3,5.5],focus:[-.5,1.35,-.25],frame:.48},
  {id:'world',place:'החלון אל העולם',reason:'השיחה הפרטית היא חלק מתופעה רחבה',eye:[1.5,4.6,9],focus:[.1,1.5,-1],frame:.45},
  {id:'scales',place:'מן החדר אל המסך',reason:'אדם אחד יכול לנהל הרבה שיחות שונות',eye:[.3,3,6],focus:[-.4,1.4,0]},
  {id:'room-map',place:'מבט על החדר',reason:'כמה זוויות מחקר על אותה שיחה',eye:[3.8,6,6.2],focus:[.3,.9,-1],frame:.43},
  {id:'person',place:'פנים אל פנים עם האדם',reason:'מתקרבים אל מי שפונה לעזרה',eye:[0,1.95,3.4],focus:[-1.7,1.35,.15],via:[[2.3,4.6,5.5],[1.2,2.8,4.2]]},
  {id:'phone',place:'מעל הכתף, אל הטלפון',reason:'רואים היכן השיחה עצמה מתרחשת',eye:[-.55,2.6,-1.9],focus:[-1.39,1.17,.53],via:[[.65,2.35,1.8],[.3,2.95,-.8]],activity:'type'},
  {id:'night',place:'השולחן והאור בלילה',reason:'מה הופך את הצ׳אט לכתובת זמינה',eye:[-4.7,1.65,2.1],focus:[-3.25,.96,.35],via:[[-2.8,2.65,-2.8],[-4.7,2.2,-1.1]],activity:'type'},
  {id:'response',place:'חוזרים אל פניו אחרי התשובה',reason:'מה הוא מרגיש שקיבל מן השיחה',eye:[-4.1,1.7,2.65],focus:[-1.55,1.38,.38]},
  {id:'distress',place:'מבט קרוב על האדם',reason:'ממקדים את המבט במצוקה שמביאים לשיחה',eye:[-2.1,1.85,2.75],focus:[-1.7,1.45,.15],frame:.39},
  {id:'contexts',place:'אותה שיחה, הקשרים שונים',reason:'מרחיבים שוב את המבט מעבר לאדם היחיד',eye:[-.1,3.3,6],focus:[.3,1.4,-.7],via:[[-1.4,2.5,4.4]]},
  {id:'ai-relationship',place:'אל הבינה, מן הצד של האדם',reason:'איך המערכת הופכת בעיניו לצד בשיחה',eye:[-1.85,1.68,1.62],focus:[.5,1.75,0],via:[[-1.2,2.5,4.2],[-2,1.9,2.8]]},
  {id:'two-paths',place:'המרחב שבין האדם לבינה',reason:'קשר ויכולת לפעול כשני מסלולים אפשריים',eye:[.85,3.05,3.6],focus:[.3,1.35,0],frame:.5,via:[[-.75,2.4,2.75]]},
  {id:'ai-workspace',place:'מן הצד של הבינה',reason:'מה המשתמש מרגיש שהכלי מאפשר לו',eye:[2.8,2,2.25],focus:[.5,1.65,0],activity:'type'},
  {id:'time',place:'החדר במבט לאורך זמן',reason:'מתרחקים מן הרגע היחיד כדי לראות שינוי',eye:[4.6,4.8,4.8],focus:[.4,.8,-1],via:[[4,3.3,3.3]]},
  {id:'remaining-need',place:'האדם שמאחורי הדיווח',reason:'גם כשהדיווח משתנה, חוזרים לשאול על הצורך',eye:[2.6,2.2,-2],focus:[-1.7,1.35,.15],via:[[4.3,3.4,1.2],[3.8,2.7,-.8]]},
  {id:'therapist',place:'אל כיסא המטפלת',reason:'מכניסים את השימוש בבינה אל המפגש הטיפולי',eye:[5,2.15,2.1],focus:[3.3,1.35,-3.1],via:[[4.6,2.5,-.8],[5.2,2.3,.6]]},
  {id:'professional-work',place:'לצד המטפלת והמחברת',reason:'בוחנים את תפקידי הבינה בעבודה המקצועית',eye:[5.75,2.25,-1.1],focus:[3.1,1.28,-2.9]},
  {id:'shared-responsibility',place:'כל החדר בתמונה',reason:'אחריות המשתמשים, המטפלים ומפתחי הכלים',eye:[7.7,5.3,8.4],focus:[.3,.8,-.7],frame:.5,via:[[7,3.6,3.5]]},
  {id:'shared-workspace',place:'מרחב העבודה המשותף',reason:'מקום לתרגול, לחשיבה ולבדיקה עם אדם נוסף',eye:[6.2,3.1,2.8],focus:[1.45,1.25,-1.4],activity:'type'},
  {id:'beyond-chat',place:'מעבר למסך, אל החיים',reason:'מסיימים עם האדם ועם מי שיכול ללוות אותו',eye:[4.3,3.4,6.5],focus:[.2,1.4,-.6],frame:.5,via:[[5.6,3.2,4.6]]},
  {id:'departure',place:'מבט אחרון על המסע',reason:'האדם, הכלי והצוות בתוך תמונה רחבה',eye:[5.8,6.5,10],focus:[.3,.8,-.9],frame:.5}
];

// One continuous conversation inside the phone, then back to the person.
for(let i=0;i<3;i++)Object.assign(TOUR_STOPS[i+5],PHONE_STOPS[i],{activity:'type',via:[]});
// The therapist uses the same physical research display for these two stops.
Object.assign(TOUR_STOPS[12],{eye:[1.0244,2.70,-.9639],focus:[-5.36,3.4,-4.575],frame:.665,via:[[2.65,2.6,2.3]]});
Object.assign(TOUR_STOPS[15],{eye:[1.293,1.6,2.355],focus:[6.7,3.3,-3.81],frame:.70,via:[[3.6,2.3,-.5],[2.7,1.95,1.35]]});
Object.assign(TOUR_STOPS[16],{eye:[1.293,1.6,2.355],focus:[6.7,3.3,-3.81],frame:.70,via:[]});
export const isPhoneStop=index=>index>=5&&index<=7;

const v = a => new THREE.Vector3(...a);

// Only changes of conversational focus need an audience-facing signpost.
const focusGroups=['room','room','room','room','person','person','person','person','person','room','ai','ai','ai','room','person','therapist','therapist','room','room','room','room'];
export function transitionCaption(fromIndex,toIndex){
  if(isPhoneStop(toIndex)&&!isPhoneStop(fromIndex))return 'אל תוך השיחה';
  if(isPhoneStop(fromIndex)&&!isPhoneStop(toIndex))return 'בחזרה אל החדר';
  const group=focusGroups[toIndex];
  if(fromIndex<0||focusGroups[fromIndex]===group)return '';
  return ({person:'אל האדם',ai:'אל הבינה',therapist:'אל המטפלת'})[group]||'';
}

export function cameraStop(index,aspect=16/9){
  const stop=TOUR_STOPS[index],focus=v(stop.focus),position=v(stop.eye);
  const portrait=aspect<1,fov=portrait?62:43;
  if(portrait)position.sub(focus).multiplyScalar(1.7).add(focus);
  // Fit the entire relationship into compact landscape panels as well as
  // presentation screens; preserve the authored close-up distances.
  const ensemble=['arrival','world','room-map','time','shared-responsibility','beyond-chat','departure'].includes(stop.id);
  if(!portrait&&ensemble)position.sub(focus).multiplyScalar(Math.max(1,1.6/aspect)).add(focus);
  if(!portrait&&[5,6,7,11,12,15,16].includes(index))position.sub(focus).multiplyScalar(Math.max(1,1.6/aspect)).add(focus);
  // Keep the physical subject in the open area between the reading panels.
  const director=new THREE.PerspectiveCamera(fov,aspect,.06,150);
  director.position.copy(position);director.lookAt(focus);
  const right=new THREE.Vector3(1,0,0).applyQuaternion(director.quaternion);
  const up=new THREE.Vector3(0,1,0).applyQuaternion(director.quaternion);
  const halfHeight=position.distanceTo(focus)*Math.tan(THREE.MathUtils.degToRad(fov/2));
  const frame=portrait?.5:(stop.frame??.415);
  const target=focus.clone().addScaledVector(right,(1-2*frame)*halfHeight*aspect).addScaledVector(up,-.06*halfHeight);
  return {...stop,position,target,focus};
}

export function cameraJourney(fromPosition,fromTarget,fromIndex,toIndex,aspect,phonePose){
  const destination=cameraStop(toIndex,aspect);
  const fromPhone=fromPosition.y < -8,toPhone=isPhoneStop(toIndex);
  if(fromPhone!==toPhone&&phonePose)return phoneJourney(fromPosition,fromTarget,fromIndex,toIndex,destination,phonePose,fromPhone);
  const adjacent=fromIndex>=0&&Math.abs(toIndex-fromIndex)===1;
  let via=[];
  if(aspect>=1&&adjacent){
    via=toIndex>fromIndex?(TOUR_STOPS[toIndex].via||[]):[...(TOUR_STOPS[fromIndex].via||[])].reverse();
  }
  const distance=fromPosition.distanceTo(destination.position);
  // Direct map jumps travel above the furniture; adjacent stages use the
  // authored walk. Back navigation traverses the same authored waypoints.
  if(!adjacent&&distance>2&&!toPhone){
    const middle=fromPosition.clone().lerp(destination.position,.5);
    middle.y=Math.max(4.8,fromPosition.y,destination.position.y)+.45;
    via=[middle.toArray()];
  }
  const points=[fromPosition.clone(),...via.map(v),destination.position.clone()];
  const curve=new THREE.CatmullRomCurve3(points,false,'centripetal');
  const length=curve.getLength();
  const duration=THREE.MathUtils.clamp(1200+length*300,1600,4700);
  const lookAt=fromTarget.clone(),position=new THREE.Vector3();
  return {duration,length,destination,elapsed:0,fromIndex,toIndex,
    sample(progress){
      const p=THREE.MathUtils.clamp(progress,0,1),e=p*p*p*(p*(p*6-15)+10);
      curve.getPointAt(e,position);lookAt.lerpVectors(fromTarget,destination.target,e);
      return {position,target:lookAt};
    }
  };
}

function phoneJourney(fromPosition,fromTarget,fromIndex,toIndex,destination,phonePose,leaving){
  const center=phonePose.center.clone(),normal=phonePose.normal.clone();
  const shoulder=v([-.55,2.6,-1.9]),aligned=center.clone().addScaledVector(normal,.24),screen=center.clone().addScaledVector(normal,.045);
  const interiorGate=leaving?fromPosition.clone().lerp(fromTarget,.62):destination.position.clone().lerp(destination.target,.58);
  const outsidePoints=leaving?[screen,aligned,shoulder,destination.position.clone()]:[fromPosition.clone(),shoulder,aligned,screen];
  const curve=new THREE.CatmullRomCurve3(outsidePoints,false,'centripetal');
  const smooth=x=>{x=THREE.MathUtils.clamp(x,0,1);return x*x*x*(x*(x*6-15)+10);};
  const band=(a,b,p)=>smooth((p-a)/(b-a));
  const position=new THREE.Vector3(),target=new THREE.Vector3();
  return {duration:leaving?4600:5000,length:curve.getLength(),destination,elapsed:0,fromIndex,toIndex,portal:true,
    sample(progress){
      const p=THREE.MathUtils.clamp(progress,0,1),first=p<.5,q=smooth(first?p/.5:(p-.5)/.5);
      if(leaving){
        if(first){position.lerpVectors(fromPosition,interiorGate,q);target.copy(fromTarget);}
        else {curve.getPointAt(q,position);target.lerpVectors(center,destination.target,smooth(q));}
      }else{
        if(first){curve.getPointAt(q,position);target.lerpVectors(fromTarget,center,Math.min(1,q*1.8));}
        else {position.lerpVectors(interiorGate,destination.position,q);target.copy(destination.target);}
      }
      return {position,target,cover:band(.40,.475,p)*(1-band(.535,.65,p)),portal:true};
    }
  };
}
