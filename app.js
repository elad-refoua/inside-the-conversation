import {createWorld} from './world.js?v=882a5dc64d';
import {formatInlineBidi} from './bidi.js?v=882a5dc64d';
const {chapters,escape}=window.CONVERSATION;
const $=s=>document.querySelector(s);let index=0,world,explore=false,still=matchMedia('(prefers-reduced-motion: reduce)').matches;
const dialog=$('#drawer');
const mobilePortrait=matchMedia('(max-width:1024px) and (orientation:portrait)');
const mobileLandscape=matchMedia('(max-width:1100px) and (max-height:700px) and (orientation:landscape) and (pointer:coarse)');
const paperHome=document.createComment('Desktop paper-card position');
$('#paper-card').before(paperHome);
let mobileExpanded=false,mobileScrollSuppressedUntil=0,mobilePointer=null,mobileMeasureFrame=0;
const mobileOptions=document.createElement('button');
mobileOptions.id='mobile-options';mobileOptions.textContent='⋯';mobileOptions.setAttribute('aria-label','אפשרויות המסע');mobileOptions.setAttribute('aria-haspopup','dialog');
$('.tools').append(mobileOptions);
function setMobileExpanded(expanded){
 mobileExpanded=expanded;document.body.classList.toggle('mobile-sheet-expanded',expanded);
 if(expanded)stopTour();world?.setPaused(expanded||dialog.open);
 $('#mobile-sheet-toggle').setAttribute('aria-expanded',String(expanded));
 $('#mobile-sheet-action').textContent=expanded?'חזרה לחדר':'פתיחה';$('#mobile-sheet-content').inert=mobilePortrait.matches&&!expanded;
}
function measureMobileScene(){
 cancelAnimationFrame(mobileMeasureFrame);mobileMeasureFrame=requestAnimationFrame(()=>{
  if(!document.body.classList.contains('mobile-layout'))return;
  document.body.style.setProperty('--mobile-scene-top',Math.ceil($('#chapter-heading').getBoundingClientRect().bottom+8)+'px');
 });
}
function syncMobileLayout(){
 const mobile=mobilePortrait.matches||mobileLandscape.matches;
 document.body.classList.toggle('mobile-layout',mobile);
 document.body.classList.toggle('mobile-landscape',mobile&&mobileLandscape.matches);
 if(mobile)$('#mobile-paper-slot').append($('#paper-card'));else paperHome.after($('#paper-card'));
 $('#previous').innerHTML=mobile?'<span aria-hidden="true">→</span><span>הקודם</span>':'→';
 $('#next').innerHTML=mobile?'<span>הבא</span><span aria-hidden="true">←</span>':'←';
 if(!mobile)setMobileExpanded(false);$('#mobile-sheet-content').inert=mobilePortrait.matches&&!mobileExpanded;
 measureMobileScene();
}
mobilePortrait.addEventListener('change',syncMobileLayout);mobileLandscape.addEventListener('change',syncMobileLayout);
addEventListener('resize',measureMobileScene);window.visualViewport?.addEventListener('resize',measureMobileScene);
new ResizeObserver(measureMobileScene).observe($('#chapter-heading'));
$('#mobile-sheet-toggle').onclick=()=>{stopTour();setMobileExpanded(!mobileExpanded);};
$('#mobile-sheet-zoom').onclick=()=>enlarge();
$('#mobile-notes').addEventListener('pointerdown',e=>{mobilePointer={id:e.pointerId,x:e.clientX,y:e.clientY,scroll:$('#mobile-notes').scrollTop,moved:false};},{passive:true});
$('#mobile-notes').addEventListener('pointermove',e=>{if(mobilePointer&&e.pointerId===mobilePointer.id&&Math.hypot(e.clientX-mobilePointer.x,e.clientY-mobilePointer.y)>8)mobilePointer.moved=true;},{passive:true});
$('#mobile-notes').addEventListener('scroll',()=>{if(mobilePointer)mobilePointer.moved=true;mobileScrollSuppressedUntil=performance.now()+350;},{passive:true});
addEventListener('pointerup',()=>{if(mobilePointer?.moved)mobileScrollSuppressedUntil=performance.now()+500;mobilePointer=null;},{passive:true});
addEventListener('pointercancel',()=>{mobilePointer=null;mobileScrollSuppressedUntil=performance.now()+500;},{passive:true});
mobileOptions.onclick=()=>{
 stopTour();
 const options=[['sources','מקורות והערות','ההגדרות, המאמרים וההסתייגויות'],['datazoom','השקף המלא','כל הממצאים בתצוגה גדולה'],['reading','גרסה לקריאה','המסע כולו, לפי סדר השקפים'],['motion',still?'הפעלת תנועה':'השהיית תנועה','תנועת המצלמה והדמויות'],['explore',explore?'חזרה למסלול':'מבט חופשי','לגלות את המרחב במגע'],['tour','סיור אוטומטי','מעבר לתחנה הבאה בכל 12 שניות']];
 open('<h2>המסע שלכם</h2><div class="mobile-options-grid">'+options.map(([id,title,detail])=>'<button data-mobile-command="'+id+'"><strong>'+title+'</strong><span>'+detail+'</span></button>').join('')+'</div>');
 dialog.querySelectorAll('[data-mobile-command]').forEach(button=>button.onclick=()=>{const id=button.dataset.mobileCommand,target=$('#'+id);if(['motion','explore','tour'].includes(id))setMobileExpanded(false);dialog.close();requestAnimationFrame(()=>target.click());});
};
syncMobileLayout();
$('#route').innerHTML=window.CONVERSATION.groups.map((g,i)=>`<button data-group="${i}" aria-current="false"><b>${i+1}</b><span>${g}</span></button>`).join('');
$('#route').querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>{stopTour();go(chapters.findIndex(c=>c.group===Number(b.dataset.group)));});
let tour=null;
function stopTour(){clearInterval(tour);tour=null;$('#tour').setAttribute('aria-pressed','false');$('#tour').textContent='▷ סיור';}
$('#tour').onclick=()=>{if(tour){stopTour();return;}$('#tour').setAttribute('aria-pressed','true');$('#tour').textContent='Ⅱ עצירה';if(index===chapters.length-1)go(0);tour=setInterval(()=>{if(dialog.open||document.hidden)return;if(index===chapters.length-1){stopTour();return;}go(index+1);},12000);};
function open(html){dialog.classList.remove('data-dialog');$('#drawer-content').innerHTML=html+'<p class="dialog-credit">פרויקט <bdi>AI PSYCH</bdi> בהובלת ד"ר דורית הדר שובל ואלעד רפואה</p>';formatInlineBidi($('#drawer-content'));world?.setPaused(true);if(!dialog.open)dialog.showModal();dialog.scrollTop=0;}
const zoom=document.createElement('button');zoom.id='datazoom';zoom.textContent='הגדלת נתונים';zoom.title='הגדלת נתוני התחנה (G)';$('#sources').before(zoom);
function additional(c){return c.additionalPanels?.length?'<section class="additional-panels"><h3>עוד על התחנה</h3>'+c.additionalPanels.map(html=>'<section class="enlarged-panel">'+html+'</section>').join('')+'</section>':'';}
function enlarge(labelIndex=null){const c=chapters[index];stopTour();const labels=labelIndex===null?c.labels:[c.labels[labelIndex]];const heading=labelIndex!==null&&/<h2[ >]/.test(labels[0].html)?'':'<h2>'+c.title+'</h2>';open('<p class="zoom-context">שקף '+c.slide+' מתוך '+chapters.length+'</p>'+heading+labels.map(l=>'<section class="enlarged-panel">'+l.html+'</section>').join('')+'<p class="zoom-caption">'+c.caption+'</p>'+(labelIndex===null?additional(c):'<button class="expand-whole">הצגת השקף המלא ↗</button>'));dialog.classList.add('data-dialog');dialog.querySelector('.expand-whole')?.addEventListener('click',()=>enlarge());}
zoom.textContent='הגדלת השקף';zoom.title='לחצו על כל גרף או על כותרת השקף להגדלה (G)';zoom.onclick=()=>enlarge();
$('#chapter-title').onclick=()=>enlarge();$('#chapter-title').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();enlarge();}};
function activatePanel(e){if(e.type==='click'&&e.target.closest('#mobile-notes')&&performance.now()<mobileScrollSuppressedUntil)return;const choice=e.target.closest('[data-perspective-go]');if(choice){stopTour();if(dialog.open)dialog.close();go(Number(choice.dataset.perspectiveGo)-1);return;}if(dialog.open)return;const panel=e.target.closest('#world .world-label, #mobile-notes .world-label');if(!panel||panel.getAttribute('aria-hidden')==='true'||performance.now()<Number($('#world').dataset.suppressClickUntil||0))return;if(e.type==='click'&&window.getSelection()?.toString().trim())return;if(e.type==='keydown'){if(!['Enter',' '].includes(e.key)||e.target!==panel)return;e.preventDefault();e.stopPropagation();}enlarge(Number(panel.dataset.label));}
document.addEventListener('click',activatePanel);document.addEventListener('keydown',activatePanel);
$('#paper-card').onclick=()=>{const p=chapters[index].paper;if(!p)return;stopTour();open('<p>'+escape(p.step)+'</p><h2>'+escape(p.title)+'</h2><p dir="auto">'+escape(p.full||p.title)+'</p><p>'+escape(p.authors||'')+'</p><p>'+escape(p.status)+'</p><p>'+escape(p.description||'')+'</p>'+(p.url?'<p><a href="'+p.url+'" target="_blank" rel="noopener">לקריאת המאמר ↗</a></p>':''));};
dialog.querySelector('.close').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
dialog.addEventListener('close',()=>world?.setPaused(mobileExpanded||dialog.open));
function draw(){const c=chapters[index],paperSlot=$('#mobile-paper-slot');$('#mobile-sheet-content').append(paperSlot);document.body.classList.toggle('needs-chapter',c.slide===12);$('#mobile-notes').innerHTML='<p class="mobile-purpose">'+escape(c.purpose||'')+'</p>'+c.labels.map((l,i)=>'<div class="world-label '+(l.tone||'')+'" data-label="'+i+'"'+(l.html.includes('<button')?'':' tabindex="0" role="button" aria-label="הגדלת תוכן השקף"')+'>'+l.html+'</div>').join('')+`<p class="mobile-qualification">${c.caption||''}</p>`;$('#mobile-notes').append(paperSlot);$('#mobile-notes').scrollTop=0;$('#chapter-title').textContent=c.title;$('#chapter-purpose').textContent=c.purpose||'';$('#chapter-section').textContent=c.section;$('#chapter-heading').classList.toggle('opening',false);$('#chapter-short').textContent=c.short;$('#counter').textContent=`שקף ${c.slide} מתוך ${chapters.length}`;$('#caption').textContent=c.caption||'';$('#progress span').style.width=(index+1)/chapters.length*100+'%';$('#previous').disabled=index===0;$('#next').disabled=index===chapters.length-1;$('#route').querySelectorAll('[data-group]').forEach(b=>b.setAttribute('aria-current',String(Number(b.dataset.group)===c.group)));document.title=c.title+' — בתוך השיחה';const p=c.paper;$('#paper-card').hidden=!p;document.body.classList.toggle('has-paper',!!p);if(p){$('#paper-step').textContent=p.step;$('#paper-title').textContent=p.title;$('#paper-status').textContent=p.status;}formatInlineBidi($('#paper-card'));}
function go(i,instant=false){if(document.activeElement?.closest('#world,#mobile-notes'))document.activeElement.blur();index=Math.max(0,Math.min(chapters.length-1,i));explore=false;$('#explore').setAttribute('aria-pressed','false');$('#explore-hint').hidden=true;setMobileExpanded(false);draw();measureMobileScene();for(const root of [$('#mobile-notes'),$('#chapter-heading'),$('#caption')])formatInlineBidi(root);zoom.hidden=false;world?.setChapter(index,instant);history.replaceState(null,'','#'+(index+1));}
$('#next').onclick=()=>{stopTour();go(index+1);};$('#previous').onclick=()=>{stopTour();go(index-1);};
$('#overview').onclick=()=>{open('<h2>המסע לפי המצגת המקורית</h2><div class="map-grid">'+chapters.map((c,i)=>`<button class="map-stop" data-go="${i}" aria-current="${i===index}"><small>שקף ${c.slide} · ${c.section}</small><span>${c.short}</span></button>`).join('')+'</div>');dialog.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{stopTour();dialog.close();go(Number(b.dataset.go));});};
$('#sources').onclick=()=>{const c=chapters[index],ids=[...new Set([...(c.sourceFactIds||[]),...c.labels.flatMap(l=>[...l.html.matchAll(/data-fact="([^"]+)"/g)].map(m=>m[1]))])];open(`<h2>${c.short}</h2><div class="audited-notes">${escape(c.notes||'').split(/\n\n+/).map(p=>'<p>'+p+'</p>').join('')}</div>${c.refs?'<h3>לקריאה</h3>'+c.refs.map(([label,url])=>`<p><a href="${escape(url)}" target="_blank" rel="noopener">${escape(label)}</a></p>`).join(''):''}<h3>נתונים ומקורות</h3><p>המספרים, ההגדרות והפרשנות נבדקו מול טבלאות המחקר, השאלונים והמאמרים ב־7.9.2026. ההערות כאן הן הנוסח שנבדק עבור האתר.</p>${ids.map(id=>{const f=window.SOURCE_FACTS.facts[id];return `<details class="source-item"><summary><bdi>${escape(f.display)}</bdi> · ${escape(f.citation||f.source)}</summary>${f.auditNote?'<p>'+escape(f.auditNote)+'</p>':''}${/^https:\/\//.test(f.source)?'<p><a href="'+escape(f.source)+'" target="_blank" rel="noopener">פתיחת המקור</a></p>':''}<pre>${escape(typeof f.quote==='string'?f.quote:JSON.stringify(f.quote))}</pre><small>מזהה ברשומת העובדות: <bdi>${escape(id)}</bdi></small></details>`;}).join('')}`);};
$('#reading').onclick=()=>open('<h2>בתוך השיחה — גרסה לקריאה</h2>'+chapters.map(c=>`<section class="reading-chapter"><h3>${c.title}</h3>${c.labels.map(l=>`<div class="world-label">${l.html}</div>`).join('')}<p>${c.caption||''}</p>${additional(c)}<p>${c.notes||''}</p></section>`).join(''));
$('#explore').onclick=()=>{explore=!explore;world?.setExplore(explore);$('#explore').setAttribute('aria-pressed',String(explore));$('#explore-hint').hidden=!explore;if(!explore)go(index);};
function motionButton(){const b=$('#motion');b.setAttribute('aria-pressed',String(!still));b.setAttribute('aria-label','תנועה חיה');b.innerHTML=still?'○ <span>תנועה מושהית</span>':'◉ <span>תנועה חיה</span>';b.title=still?'הפעלת תנועה עדינה במרחב':'השהיית התנועה במרחב';$('#gentle-hint').hidden=still;}
motionButton();
$('#motion').onclick=()=>{still=!still;world?.setMotion(still);motionButton();if(still)go(index,true);};
$('#fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>{});};
addEventListener('keydown',e=>{if(dialog.open||e.defaultPrevented||e.target.closest('input,select,textarea')||(e.target.closest('#mobile-notes')&&['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(e.key))||(e.key===' '&&e.target.closest('button,a,[role=button]')))return;if(['ArrowLeft','ArrowDown','PageDown',' '].includes(e.key)){e.preventDefault();stopTour();go(index+1);}if(['ArrowRight','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();stopTour();go(index-1);}if(e.key==='Home'){stopTour();go(0);}if(e.key==='End'){stopTour();go(chapters.length-1);}if(e.key.toLowerCase()==='m')$('#overview').click();if(e.key.toLowerCase()==='n')$('#sources').click();if(e.key.toLowerCase()==='f')$('#fullscreen').click();});
addEventListener('hashchange',()=>go((parseInt(location.hash.slice(1))||1)-1));
addEventListener('keydown',e=>{if(!dialog.open&&e.key.toLowerCase()==='g'&&!zoom.hidden)zoom.click();});
const requested=(parseInt(location.hash.slice(1))||1)-1;go(requested,true);
try{await document.fonts.load('500 30px Assistant');world=await createWorld($('#world'),chapters);world.setMotion(still);go(index,true);$('#loading').classList.add('done');$('#loading').setAttribute('aria-hidden','true');window.CONVERSATION_READY=true;window.getConversationState=()=>world.getState();}catch(error){console.error(error);$('#loading-status').textContent='המרחב לא נטען. אפשר לפתוח את גרסת הקריאה מהכפתור למטה.';$('#loading').style.pointerEvents='none';$('#loading').style.zIndex='3';$('#reading').style.display='block';}
