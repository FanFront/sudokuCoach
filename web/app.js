import {lessons, starterPuzzle, analyze, initialCandidates} from './engine/coach.js';
import {icon, esc, motif, rc} from './ui.js';

const app=document.querySelector('#app'), dialog=document.querySelector('#modal'), nav=document.querySelector('#nav');
const levelNames={L1:'入门',L4:'进阶',L5:'挑战'};
const lessonKey='jiuge.lessons.v1', playKey='jiuge.play.v1';
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
const emptyNotes=()=>Array.from({length:81},()=>[]);
function newGame(puzzle,level){return {puzzle,board:puzzle,level,selection:-1,notes:emptyNotes(),removed:emptyNotes(),history:[],pencil:false,auto:false,seconds:0};}
let game=read(playKey,null);
if(!game || !/^[0-9]{81}$/.test(game.puzzle)||!/^[0-9]{81}$/.test(game.board)||!Array.isArray(game.removed)||game.removed.length!==81)game=newGame(starterPuzzle,'L4');
let completed=read(lessonKey,{}),activeRoute='',hintDepth=0,hintStep=null,lessonState=null,solver=null,solverInput='',solverError='',generating=false,solving=false,dialogLevel='L4',requestSeq=0,toastTimer;
const analysed=new Map();
function analysis(board){if(!analysed.has(board)){if(analysed.size>12)analysed.clear();analysed.set(board,analyze(board));}return analysed.get(board);}
const original=()=>analysis(game.puzzle);
const row=i=>Math.floor(i/9),box=i=>Math.floor(i/27)*3+Math.floor(i%9/3);
const peer=(a,b)=>row(a)===row(b)||a%9===b%9||box(a)===box(b);
function toast(msg){const t=document.querySelector('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2300);}
const btn=(action,label,ic='',cls='btn',extra='')=>`<button type="button" class="${cls}" data-action="${action}" ${extra}>${ic?icon(ic):''}${label}</button>`;
function heroArt(){return `<div class="coach-art" aria-hidden="true"><svg viewBox="0 0 140 158" fill="none"><g stroke="#b0c9a3" stroke-width="1.15"><path d="M15 20h101v101H15zM15 53h101M15 87h101M49 20v101M82 20v101"/><path d="M5 10h121v121H5z" opacity=".28" stroke-dasharray="3 5"/></g><path d="M50 54h31v32H50z" fill="#debd78"/><g font-family="Georgia,serif" text-anchor="middle" font-size="25"><text x="32" y="46" fill="#cfdec0">3</text><text x="65" y="80" fill="#2f503c">7</text><text x="98" y="113" fill="#cfdec0">9</text></g></svg></div>`;}
function mast(title,sub,action=''){return `<div class="mast"><div><h1>${title}</h1><p>${sub}</p></div>${action}</div>`;}
function cardHead(title,end=''){return `<div class="section-head"><h2>${title}</h2>${end}</div>`;}
function buttonBar(i){return `<div class="keys" aria-label="数字键">${Array.from({length:9},(_,n)=>btn('digit',String(n+1),'','key',`data-digit="${n+1}" aria-label="${i} ${n+1}"`)).join('')}</div>`;}
function showDialog(html){document.querySelector('#dialog-body').innerHTML=html;if(!dialog.open)dialog.showModal();}
function dialogHead(title){return `<div class="section-head"><h2>${title}</h2>${btn('close','','close','icon-btn','aria-label="关闭"')}</div>`;}
function formatTime(s){return [Math.floor(s/60),s%60].map(x=>String(x).padStart(2,'0')).join(':');}
function selectedOptions(step,depth){return {region:depth>0?step?.region:[],focus:depth>1?step?.focus:[],updates:depth>2?step?.updates:[]};}
function boardHTML(board, opts={}){
 const {given=board,selection=-1,region=[],focus=[],updates=[],candidates,markErrors,readOnly=false}=opts;
 const value=board[selection];
 return `<div class="board" role="group" aria-label="九行九列数独棋盘">${[...board].map((d,i)=>{
 const target=updates.filter(u=>u.index===i),cand=candidates?.[i]||[];
 const flags=['cell',given[i]==='0'&&d!=='0'?'entry':'',selection>=0&&peer(i,selection)?'peer':'',value&&value!=='0'&&d===value?'same':'',region?.includes(i)?'region':'',focus?.includes(i)?'focus':'',target.length?'mark':'',selection===i?'selected':'',markErrors&&d!=='0'&&markErrors[i]!==d?'bad':''].join(' ');
 const notes=cand.length ? `<span class="notes">${Array.from({length:9},(_,k)=>`<i class="${target.some(u=>u.digit===k+1)?'accent':''}">${cand.includes(k+1)?k+1:''}</i>`).join('')}</span>`:'';
 const label=`${rc(i)}，${d==='0'?'空格'+(cand.length?'，候选 '+cand.join('、'):''):'数字 '+d}`;
 return `<button type="button" class="${flags}" ${readOnly?'tabindex="-1"':''} data-cell="${i}" aria-label="${label}" aria-pressed="${selection===i}">${d==='0'?notes:d}</button>`;
 }).join('')}</div>`;
}
function legend(){return '<div class="legend"><span><i class="swatch f"></i>推理依据</span><span><i class="swatch m"></i>本步操作</span></div>';}
function go(path){if(location.hash==='#'+path)render();else location.hash=path;}
function route(){
 let [page,id]=location.hash.slice(1).split('/');
 if(!['play','lessons','solver'].includes(page))page='play';
 const lesson=page==='lessons'&&lessons.find(l=>l.id===id);
 return {page,lesson};
}
function render(){
 const {page,lesson}=route();activeRoute=page;
 nav.innerHTML=[['play','grid','研习台'],['lessons','book','技巧课程'],['solver','solve','解题器']].map(([id,ic,name])=>`<a class="nav-link ${page===id?'current':''}" href="#${id}" ${page===id?'aria-current="page"':''}>${icon(ic,17)}${name}</a>`).join('');
 if(page==='play')app.innerHTML=playHTML();
 if(page==='lessons')app.innerHTML=lesson?lessonHTML(lesson):libraryHTML();
 if(page==='solver')app.innerHTML=solverHTML();
}
function progress(){
 const total=[...game.puzzle].filter(x=>x==='0').length;
 const filled=[...game.board].filter((x,i)=>game.puzzle[i]==='0'&&x===original().solution[i]).length;
 return {total,filled,done:total===filled};
}
function possible(){try{return initialCandidates(game.board).map((arr,i)=>arr.filter(d=>!game.removed[i].includes(d)));}catch{return emptyNotes();}}
function playHTML(){
 const p=progress(), step=hintStep;
 const candidates=game.auto||hintDepth?possible():game.notes;
 const numbered=`<div class="panel-head"><div class="head-info"><strong>经典数独</strong><span class="pill">${levelNames[game.level]||'自选'}</span></div><span class="clock">${icon('clock',15)}<span id="time">${formatTime(game.seconds)}</span></span></div>`;
 const tools=`<div class="tools">${btn('undo','撤销','undo','tool',game.history.length?'':'disabled')}${btn('erase','擦除','erase','tool')}${btn('pencil','笔记','pen','tool '+(game.pencil?'active':''),`aria-pressed="${game.pencil}"`)}${btn('auto','候选','eye','tool '+(game.auto?'active':''),`aria-pressed="${game.auto}"`)}${btn('hint','提示','bulb','tool')}</div>`;
 const coach=p.done?`<section class="coach">${heroArt()}<div class="coach-label">${icon('check')} 完成研习</div><h2>这盘解开了</h2><p>用时 ${formatTime(game.seconds)}，所有空格均已填对。</p>${btn('new','再来一局','plus','btn coach-btn')}</section>`:
 `<section class="coach ${step?'':'intro'}" id="coach">${!step?heroArt():''}<div class="coach-label">${icon('bulb',17)} 随盘教练</div><h2>${!step?'下一步，从哪里看？':hintDepth===1?'先看这个区域':esc(step.title)}</h2><p>${!step?'卡住时，先要一点线索。':esc(hintDepth<3?step.clue:step.reason)}</p>${btn(hintDepth>=3?'apply-hint':'hint',hintDepth===0?'给我一点提示':hintDepth===1?'揭示技巧':hintDepth===2?'查看推理':'应用这一步','', 'btn coach-btn').replace('</button>',icon('arrow',16)+'</button>')}</section>`;
 const recommended=[lessons[3],lessons[4]];
 return mast('数独研习台','在棋盘上推理，跟着教练练好每一步。',btn('new','换一题','plus','btn primary'))+`<div class="work-area"><section class="panel board-panel">${numbered}${boardHTML(game.board,{given:game.puzzle,selection:game.selection,candidates,markErrors:original().solution,...selectedOptions(step,hintDepth)})}${buttonBar(game.pencil?'切换笔记':'填入数字')}${tools}</section><aside class="side">${coach}<section class="panel side-card">${cardHead('技巧速练','<a class="text-link" href="#lessons">全部课程'+icon('right',14)+'</a>')}${recommended.map(l=>lessonRow(l)).join('')}</section><section class="panel side-card"><div class="statline"><span>${icon('flag',14)} 本盘进度</span><b>${p.filled}<small> / ${p.total} 格</small></b></div><div class="track"><span style="width:${100*p.filled/p.total}%"></span></div></section></aside></div>`;
}
function lessonRow(l){return `<a class="lesson-row" href="#lessons/${l.id}">${motif(lessons.indexOf(l))}<span><strong>${l.title}</strong><small>${l.subtitle}</small></span>${icon('right',15)}</a>`;}
function resetHint(){hintDepth=0;hintStep=null;}
function persistPlay(){save(playKey,game);}
function keepUndo(){game.history.push({board:game.board,notes:structuredClone(game.notes),removed:structuredClone(game.removed),selection:game.selection});if(game.history.length>80)game.history.shift();}
function setValue(i,d){game.board=game.board.slice(0,i)+d+game.board.slice(i+1);game.notes[i]=[];game.removed=emptyNotes();if(d!=='0')game.notes.forEach((a,j)=>{if(peer(i,j))game.notes[j]=a.filter(n=>n!==+d);});}
function enterDigit(d){
 const i=game.selection;if(i<0){toast('先点选一个空格');return;}
 if(game.puzzle[i]!=='0'){toast('题面给定的数字已锁定');return;}
 if(game.pencil){
 if(game.board[i]!=='0'){toast('只能在空格中记候选');return;}
 keepUndo();const used=game.notes[i].includes(d);game.notes[i]=used?game.notes[i].filter(n=>n!==d):[...game.notes[i],d];game.auto=false;
 }else{if(game.board[i]===String(d))return;keepUndo();setValue(i,String(d));}
 resetHint();persistPlay();render();
 if(progress().done)toast('完成！所有数字均已填对。');
}
function hint(){
 if(progress().done)return;
 if([...game.board].some((d,i)=>d!=='0'&&d!==original().solution[i])){toast('先检查棋盘上标红的数字');return;}
 if(!hintStep){hintStep=analysis(game.board).steps.find(s=>s.updates.some(u=>u.kind==='place'||!game.removed[u.index].includes(u.digit)));if(!hintStep){toast('当前技巧库还找不到可解释的下一步');return;}}
 hintDepth=Math.min(3,hintDepth+1);render();
 if(matchMedia('(max-width:660px)').matches)document.querySelector('#coach')?.scrollIntoView({block:'center'});
}
function applyHint(){
 if(!hintStep||hintDepth!==3)return;
 keepUndo();for(const u of hintStep.updates){if(u.kind==='place')setValue(u.index,String(u.digit));else if(!game.removed[u.index].includes(u.digit)){game.removed[u.index].push(u.digit);game.notes[u.index]=game.notes[u.index].filter(n=>n!==u.digit);}}
 game.selection=hintStep.updates[0].index;game.auto=true;resetHint();persistPlay();render();toast('这一步已应用');
}
function libraryHTML(){
 const done=lessons.filter(l=>completed[l.id]).length;
 return mast('技巧课程',`从填定一个数，到排除一组候选。已完成 ${done} / ${lessons.length} 门。`)+`<section class="lesson-library">${lessons.map((l,i)=>`<a class="panel lesson-tile" href="#lessons/${l.id}">${motif(i)}<small class="eyebrow">${i<3?'基础填数':'候选排除'} · ${completed[l.id]?'已掌握':'示范与练习'}</small><h2>${l.title}</h2><p>${l.subtitle}</p><span class="text-link">${completed[l.id]?'再练一次':'进入课程'}${icon('arrow',14)}</span></a>`).join('')}</section>`;
}
function startLesson(id,index=0){lessonState={id,index,phase:'observe',selection:-1,hits:[],feedback:'',wrong:false,reveal:false};}
function lessonHTML(l){
 if(!lessonState||lessonState.id!==l.id)startLesson(l.id);
 const s=lessonState,x=l.examples[s.index],guide=s.phase==='observe',win=s.phase==='done',guided=s.index===0;
 const explicit=guide||s.reveal||win;
 const candidates=x.candidates.map((a,i)=>a.filter(d=>!s.hits.includes(i+'-'+d)));
 const current=[...x.board];for(const u of x.updates)if(u.kind==='place'&&s.hits.includes(u.index+'-'+u.digit))current[u.index]=String(u.digit);
 const removing=x.updates[0].kind==='remove';
 const stepLabel=guide?'观察示范':win?'练习完成':guided?'引导练习':'独立练习';
 const progressText=`${s.hits.length} / ${x.updates.length}`;
 const board=boardHTML(current.join(''),{given:x.puzzle,selection:s.selection,candidates,focus:explicit?x.focus:[],region:explicit?x.region:[],updates:win?x.updates:[]});
 const aside=`<div class="side"><section class="coach"><div class="coach-label">${icon('book',16)} ${stepLabel}</div><h2>${guide?'先读懂这条规则':win?'这一步做对了':removing?'删去哪几个候选？':'哪一格可以填数？'}</h2><p>${esc(guide?l.rule:win?x.reason:l.action)}</p>${guide?btn('lesson-start','在棋盘上试一试','pointer','btn coach-btn'):win?btn('lesson-next','换一个局面','rotate','btn coach-btn'):btn('lesson-help',s.reveal?'收起线索':'给我一点线索','bulb','btn coach-btn')}</section><section class="panel side-card">${cardHead(guide?'观察棋盘':win?'回顾推理':'练习提示')}<p class="rule-text">${esc(guide||s.reveal?x.clue:win?l.rule:l.observation)}</p>${s.feedback?`<div role="status" class="status-msg ${s.wrong?'warn':''}">${esc(s.feedback)}</div>`:''}<div class="read-actions">${btn('lesson-replay','在解题器中回放','solve','btn')}</div></section></div>`;
 return `<a href="#lessons" class="backlink">${icon('back',15)} 课程目录</a>`+mast(l.title,l.subtitle)+`<div class="work-area"><section class="panel board-panel"><div class="panel-head"><div class="head-info"><strong>${stepLabel}</strong><span class="pill">例题 ${s.index+1} / ${l.examples.length}</span></div><span class="small">${guide?'观察':removing?'删除候选':'填入数字'} ${guide?'':progressText}</span></div>${board}${!guide&&!win?buttonBar(removing?'删除候选':'填入数字'):legend()}</section>${aside}</div>`;
}
function lessonDigit(d){
 const l=route().lesson,s=lessonState;if(!l||s.phase!=='practice')return;
 if(s.selection<0){toast('先选中要操作的格子');return;}
 const x=l.examples[s.index],key=s.selection+'-'+d;
 if(s.hits.includes(key)){toast('这个候选已经处理过了');return;}
 if(x.updates.some(u=>u.index===s.selection&&u.digit===d)){
 s.hits.push(key);s.wrong=false;
 if(s.hits.length===x.updates.length){s.phase='done';s.feedback=s.index===0?'引导练习完成。换一个局面，独立试一次。':'独立练习完成，已记录本课进度。';if(s.index!==0){completed[l.id]=true;save(lessonKey,completed);}}
 else s.feedback='这一步正确。再找找同组中其余可排除的候选。';
 }else{s.feedback='这个操作不能由本课技巧推出。'+l.observation;s.wrong=true;}
 render();toast(s.wrong?'再观察一下':s.phase==='done'?'这一步做对了':'正确，继续寻找');
}
function solverHTML(){
 if(!solver)return mast('分步解题器','带上你自己的题面，查看每一步的观察区域、技巧和依据。')+`<section class="panel solver-start"><label for="import">导入经典数独</label><p class="small">输入 81 个数字，空格用 0 或英文句点代替。可以分行粘贴。</p><textarea id="import" spellcheck="false" placeholder="在此粘贴题面">${esc(solverInput)}</textarea>${solverError?`<p class="form-error" role="alert">${esc(solverError)}</p>`:''}<div class="split">${btn('analyze',solving?'正在分析…':'分析题面','solve','btn primary',solving?'disabled':'')}${btn('sample','使用示例题','grid','btn')}${btn('use-game','导入研习台原题','book','btn')}</div></section>`;
 const {result,puzzle,index}=solver, step=result.steps[index],atEnd=!step;
 const previous=result.steps.at(-1);
 let state=step?.board||result.solution,candidates=step?.candidates;
 if(atEnd&&!result.logicalComplete){state=previous?.board||puzzle;candidates=previous?.candidates?.map(a=>[...a]);if(previous)for(const u of previous.updates){if(u.kind==='place')state=state.slice(0,u.index)+u.digit+state.slice(u.index+1);else candidates[u.index]=candidates[u.index].filter(x=>x!==u.digit);}}
 const subtitle=result.logicalComplete?'逐步查看逻辑解法，绿色标出依据，金色标出本步操作。':'当前技巧库可解释到下方位置。';
 return mast('分步解题器',subtitle,btn('solver-reset','更换题面','plus'))+`<div class="work-area"><section class="panel board-panel"><div class="panel-head"><strong>推理回放</strong><span class="pill">${atEnd?'回放结束':'第 '+(index+1)+' / '+result.steps.length+' 步'}</span></div>${boardHTML(state,{given:puzzle,candidates,readOnly:true,...selectedOptions(step,3)})}${legend()}<div class="read-actions"><span>共 ${result.steps.length} 个逻辑步骤</span>${btn('prev','上一步','back','btn',index===0?'disabled':'')}${btn('next','下一步','right','btn primary',atEnd?'disabled':'')}</div></section><aside class="side"><section class="coach"><div class="coach-label">${icon('solve')} 推理说明</div><h2>${esc(step?.title||(result.logicalComplete?'棋盘已解开':'已到当前技巧边界'))}</h2><p>${esc(step?.reason||(result.logicalComplete?'已完成全部逻辑步骤。':'此题有唯一解，后续步骤暂时无法逐步讲解。'))}</p></section>${step?`<section class="panel side-card">${cardHead('本步操作')}<p class="rule-text">${step.updates.map(u=>rc(u.index)+(u.kind==='place'?' 填入 ':' 删去候选 ')+u.digit).join('，')}</p>${lessons.some(l=>l.id===step.technique)?`<a class="text-link" href="#lessons/${step.technique}">练习这个技巧 ${icon('arrow',15)}</a>`:''}</section>`:''}</aside></div>`;
}
function runWorker(type,payload){return new Promise((resolve,reject)=>{
 const w=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});const timer=setTimeout(()=>{w.terminate();reject(Error('操作超时，请重试'));},20000);
 w.onmessage=e=>{clearTimeout(timer);w.terminate();e.data.error?reject(Error(e.data.error)):resolve(e.data.result);};
 w.onerror=e=>{clearTimeout(timer);w.terminate();reject(Error(e.message||'计算失败'));};
 w.postMessage({type,payload});
});}
async function importPuzzle(text){
 const token=++requestSeq;solverInput=text;solverError='';solving=true;render();
 try{const result=await runWorker('analyze',text);if(token!==requestSeq)return;
 if(result.status==='unique'){solver={puzzle:text.replace(/\s/g,'').replace(/\./g,'0'),result,index:0};}
 else solverError={invalid:'题面格式有误，或已知数字在行、列、宫内重复。',none:'这个题面没有解，请核对已知数字。',multiple:'这个题面有多个解，请补充已知数字后再分析。'}[result.status];
 }catch{if(token===requestSeq)solverError='分析未完成，请再试一次。';}finally{if(token===requestSeq){solving=false;render();}}
}
function openNew(){
 dialogLevel=game.level in levelNames?game.level:'L4';
 const paint=()=>showDialog(dialogHead('换一局数独')+`<p>选择练习难度，开始后将替换研习台上的当前题目。</p>${Object.entries(levelNames).map(([key,name],n)=>btn('level',`<span>${name}</span><small>${['最后一格','宫内区块排除','显性数对'][n]}</small>`,'','choice '+(dialogLevel===key?'active':''),`data-level="${key}" aria-pressed="${dialogLevel===key}"`)).join('')}<div class="read-actions">${btn('generate',generating?'正在出题…':'开始新题','play','btn primary',generating?'disabled':'')}</div>`);
 paint();return paint;
}
let paintNew;
async function fresh(){
 if(generating)return;generating=true;paintNew();const level=dialogLevel;
 try{let puzzle=await runWorker('generate',level);if(puzzle===game.puzzle)puzzle=await runWorker('generate',level);game=newGame(puzzle,level);resetHint();persistPlay();dialog.close();render();toast('新题已就绪');}
 catch{toast('出题未完成，请再试一次');}finally{generating=false;if(dialog.open)paintNew();}
}
function selectCell(i){
 if(activeRoute==='play'){game.selection=i;persistPlay();render();}
 else if(route().lesson){lessonState.selection=i;render();}
}
document.addEventListener('click',e=>{
 const cell=e.target.closest('[data-cell]');if(cell){selectCell(Number(cell.dataset.cell));return;}
 const b=e.target.closest('[data-action]');if(!b||b.disabled)return;
 const a=b.dataset.action,l=route().lesson,s=lessonState;
 switch(a){
 case 'help':showDialog(dialogHead('操作指南')+'<p><b>填数</b>　先选一个空格，再点数字。桌面上也可以用方向键移动，按 1–9 填数。</p><p><b>笔记</b>　切换后可手动记录候选；「候选」显示自动计算结果。按 N 切换笔记、退格键擦除。</p><p><b>提示</b>　分三次揭示观察区域、技巧和具体推理。当前棋局自动保存在此设备。</p>');break;
 case 'close':dialog.close();break;
 case 'new':paintNew=openNew();break;
 case 'level':if(!generating){dialogLevel=b.dataset.level;paintNew();}break;
 case 'generate':fresh();break;
 case 'digit':if(activeRoute==='play')enterDigit(+b.dataset.digit);else lessonDigit(+b.dataset.digit);break;
 case 'undo':if(game.history.length){Object.assign(game,game.history.pop());resetHint();persistPlay();render();}break;
 case 'erase':{const i=game.selection;if(i<0||game.puzzle[i]!=='0'){toast('先选择可编辑的格子');break;}if(game.board[i]==='0'&&!game.notes[i].length)break;keepUndo();setValue(i,'0');resetHint();persistPlay();render();break;}
 case 'pencil':game.pencil=!game.pencil;if(game.pencil)game.auto=false;resetHint();persistPlay();render();break;
 case 'auto':game.auto=!game.auto;if(game.auto)game.pencil=false;resetHint();persistPlay();render();break;
 case 'hint':hint();break;
 case 'apply-hint':applyHint();break;
 case 'lesson-start':s.phase='practice';s.reveal=s.index===0;render();break;
 case 'lesson-help':s.reveal=!s.reveal;render();break;
 case 'lesson-next':startLesson(l.id,(s.index+1)%l.examples.length);lessonState.phase='practice';render();break;
 case 'lesson-replay':{const x=l.examples[s.index];solver={puzzle:x.puzzle,result:analysis(x.puzzle),index:x.stepIndex};go('solver');break;}
 case 'solver-reset':solver=null;solverError='';render();break;
 case 'sample':importPuzzle(starterPuzzle);break;
 case 'use-game':importPuzzle(game.puzzle);break;
 case 'analyze':importPuzzle(document.querySelector('#import').value);break;
 case 'prev':solver.index--;render();break;
 case 'next':solver.index++;render();break;
 }
});
document.addEventListener('input',e=>{if(e.target.id==='import')solverInput=e.target.value;});
document.addEventListener('keydown',e=>{
 if(dialog.open||e.target.matches('textarea,input,select')||e.ctrlKey||e.metaKey||e.altKey)return;
 const l=route().lesson;if(activeRoute!=='play'&&!l)return;
 if(/^[1-9]$/.test(e.key)){e.preventDefault();if(l)lessonDigit(+e.key);else enterDigit(+e.key);return;}
 const i=(l?lessonState.selection:game.selection);
 const shifts={ArrowLeft:-1,ArrowRight:1,ArrowUp:-9,ArrowDown:9};
 if(e.key in shifts){e.preventDefault();selectCell(Math.max(0,Math.min(80,i<0?0:i+shifts[e.key])));return;}
 if(!l){const action={n:'pencil',N:'pencil',Backspace:'erase',Delete:'erase'}[e.key];if(action){e.preventDefault();document.querySelector(`[data-action="${action}"]`)?.click();}}
});
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);});
dialog.addEventListener('cancel',e=>{if(generating)e.preventDefault();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)persistPlay();});
window.addEventListener('pagehide',persistPlay);
setInterval(()=>{if(activeRoute==='play'&&!document.hidden&&!dialog.open&&!progress().done){game.seconds++;const t=document.getElementById('time');if(t)t.textContent=formatTime(game.seconds);if(game.seconds%10===0)persistPlay();}},1000);
document.querySelector('.help').innerHTML=icon('help',20);render();

