(() => {
 const {chapters,escape:e}=window.CONVERSATION, facts=window.SOURCE_FACTS.facts;
 window.FULL_CONVERSATION={chapters:structuredClone(chapters)};
 const fact=(f)=>{if(!facts[f.id])throw Error('Unknown focused fact: '+f.id);return facts[f.id];};
 const number=f=>`<bdi dir="ltr" data-fact="${e(f.id)}">${e(fact(f).display)}</bdi>`;
 function data(s,slide){
  const fs=s.facts||[];if(!fs.length)return '';
  if(s.kind==='bars'&&fs.length>1){
   const values=fs.map(f=>Number(fact(f).value));
   if(values.some(v=>!Number.isFinite(v)||v<0))throw Error('Invalid bar values');
   const percent=fs.every(f=>fact(f).display.includes('%'));
   const min=!percent&&slide===17?1:0,max=percent?100:slide===17?7:4;
   return `<div class="focus-bars" data-rows="${fs.length}">${fs.map((f,i)=>`<div class="focus-row"><div class="focus-row-head"><span>${e(f.label)}</span>${number(f)}</div><div class="focus-track"><i style="width:${(values[i]-min)/(max-min)*100}%"></i></div></div>`).join('')}<div class="focus-axis"><span>${min}</span><span>${max}${percent?'%':''}</span></div></div>`;
  }
  return `<div class="focus-stats ${fs.length===1?'solo':''} ${fs.length>2?'multi':''}">${fs.map(f=>`<div class="focus-stat">${number(f)}<span>${e(f.label)}</span></div>`).join('')}</div>`;
 }
 function stage(s,i,slide){
  const note=s.note?`<p class="focus-note">${e(s.note)}</p>`:'';
  const headingTag=slide===13?'h3':'h2';
  let body=`<${headingTag}>${e(s.heading)}</${headingTag}><p class="focus-body">${e(s.body||'')}</p>${data(s,slide)}${note}`;
  if(s.kind==='perspectives')body=`<h2>${e(s.heading)}</h2><p class="focus-body">בחרו דמות כדי לעבור אליה. להיכרות עם המחקר, לחצו על ״המשך״.</p>`;
  if(s.kind==='perspectives')body+=`<div class="focus-choices"><button data-perspective-go="5"><b>האדם ←</b><span>מי פונה, ולמה?</span></button><button data-perspective-go="10"><b>הבינה ←</b><span>מה מקבלים מהשיחה?</span></button><button data-perspective-go="16"><b>המטפלת ←</b><span>מה רואים בטיפול?</span></button></div>`;
  if(slide===13&&i===0)body+=`<div class="focus-measure" role="img" aria-label="טווח התשובות בשאלון: מאפס, כלל לא, עד ארבע, במידה רבה מאוד"><div class="focus-scale">${[0,1,2,3,4].map(n=>`<bdi>${n}</bdi>`).join('')}</div><div class="focus-scale-ends"><span>כלל לא</span><span>במידה רבה מאוד</span></div></div>`;
  return `<section class="focus-stage focus-kind-${s.kind}" data-reveal="${i}"${i?' hidden':''}><div class="focus-kicker">${slide===14?'אותם אנשים · ארבעה חודשים':slide===15?'חוזרים אל האדם':slide>=16&&slide<=17?'אל המטפלת':'בתוך השיחה'}<span>${i+1}</span></div>${body}<span class="focus-open-hint">לחיצה להרחבה ולתוכן המלא ↗</span></section>`;
 }
 for(const [i,c] of chapters.entries()){
  const full=window.FULL_CONVERSATION.chapters[i];
  const copy=window.FOCUS_COPY[i];if(copy.slide!==c.slide)throw Error('Focused slide order differs');
  c.focus=copy;c.title=copy.title;c.purpose=copy.purpose;c.short=copy.title;
  c.sourceFactIds=[...new Set([...(full.sourceFactIds||[]),...full.labels.flatMap(l=>[...l.html.matchAll(/data-fact="([^"]+)"/g)].map(m=>m[1]))])];
  if([1,20].includes(c.slide))continue;
  if(c.slide===12){
   c.labels=full.labels.map((l,j)=>({...l,html:l.html.replace('needs-exhibit ',`needs-exhibit focus-needs focus-role-${j} `)}));continue;
  }
  if(c.slide===21){
   c.layout='single';c.labels=[{pos:[0,0,0],width:700,slot:'data',tone:'data',html:`<div class="focus-surface focus-credits">${full.labels.map((l,j)=>`<section class="focus-stage" data-reveal="${j}"${j?' hidden':''}>${l.html}</section>`).join('')}</div>`}];continue;
  }
  const screenHeading=c.slide===13?`<h2 class="focus-screen-title">${e(copy.title)}</h2>`:'';
  c.layout='single';c.labels=[{pos:[0,0,0],width:760,slot:'data',tone:'data',html:`<div class="focus-surface${screenHeading?' focus-needs-screen':''}">${screenHeading}${copy.steps.map((s,j)=>stage(s,j,c.slide)).join('')}</div>`}];
 }
})();
