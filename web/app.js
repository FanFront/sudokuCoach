import {lessons, starterPuzzle, analyze, initialCandidates, practiceLevels} from './engine/coach.js';
import {icon, esc, motif, rc} from './ui.js';
import {describeLinks, drawLinks} from './proof.js';
import {changeColour, changeLink, drawingColours, emptyDrawing, nodeKey, removeCandidates} from './play-state.js';

const app=document.querySelector('#app'), dialog=document.querySelector('#modal'), nav=document.querySelector('#nav');
import {lessonGroups} from './data/lessons.js';

const lessonById = new Map(lessons.map(lesson => [lesson.id, lesson]));
const lessonKey='jiuge.lessons.v1', playKey='jiuge.play.v1';
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
let showLinks = true;
const emptyNotes=()=>Array.from({length:81},()=>[]);
function newGame(puzzle,level){return {puzzle,board:puzzle,level,selection:-1,notes:emptyNotes(),removed:emptyNotes(),history:[],drawing:emptyDrawing(),pencil:false,auto:false,seconds:0};}
const playStorage = () => { try{return localStorage.getItem(playKey);} catch{return null;} };
let lastSavedPlay = playStorage();
let game=read(playKey,null);
if(!game || !/^[0-9]{81}$/.test(game.puzzle)||!/^[0-9]{81}$/.test(game.board)||!Array.isArray(game.removed)||game.removed.length!==81)game=newGame(starterPuzzle,'L4');
game.drawing ??= emptyDrawing();
let selectedCells = new Set(game.selection >= 0 ? [game.selection] : []);
let multiSelect = false;
let inputMode = game.pencil ? 'note' : 'value';
let drawingMode = '';
let drawingColour = 'blue';
let strongLink = true;
let linkStart = null;
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
function selectedOptions(step,depth){return {region:depth>0?step?.region:[],focus:depth>1?step?.focus:[],digits:depth>1?step?.digits:[],proof:depth>1?step?.proof:null,updates:depth>2?step?.updates:[]};}
function boardHTML(board, opts={}){
 const {given=board,selection=-1,region=[],focus=[],digits=[],proof=null,updates=[],candidates,markErrors,readOnly=false,chosen=null,drawing=emptyDrawing(),pending=null}=opts;
 const markByCandidate = new Map(proof?.nodes.map((node, index) => [
  node.cell * 10 + node.digit,
  proof.kind === 'colour' ? 'proof-colour-' + node.colour
   : index === 0 || index === proof.nodes.length - 1 ? 'proof-end' : 'proof-node'
 ]));
 const value=board[selection];
 const links = drawing.links.filter(({from,to}) =>
   candidates?.[from.cell].includes(from.digit) && candidates?.[to.cell].includes(to.digit));
 const linked = new Set(links.flatMap(({from,to})=>[nodeKey(from),nodeKey(to)]));
 return `<div class="board" role="group" aria-label="九行九列数独棋盘">${[...board].map((d,i)=>{
 const target=updates.filter(u=>u.index===i),cand=candidates?.[i]||[];
 const selected = chosen ? chosen.has(i) : selection === i;
 const cellColour = drawing.colours[nodeKey({cell:i,digit:0})];
 const flags=['cell',cellColour ? 'user-cell-'+cellColour : '', given[i]==='0'&&d!=='0'?'entry':'',selection>=0&&peer(i,selection)?'peer':'',value&&value!=='0'&&d===value?'same':'',region?.includes(i)?'region':'',focus?.includes(i)?'focus':'',target.length?'mark':'',selected?'selected':'',markErrors&&d!=='0'&&markErrors[i]!==d?'bad':''].join(' ');
 const evidence=focus?.includes(i)?digits:[];
 const notes = cand.length ? `<span class="notes">${Array.from({length:9}, (_, k) => {
  const digit = k + 1;
  const update = target.find(update => update.digit === digit);
  const key = nodeKey({cell:i,digit});
  const mark = markByCandidate.get(key);
  const colour = drawing.colours[key];
  const drawingClass = colour && cand.includes(digit) ? 'user-colour-'+colour : '';
  const className = [mark, drawingClass, linked.has(key) ? 'user-node' : '', pending===key ? 'user-pending' : '', update ? 'accent ' + update.kind : !proof && evidence?.includes(digit) ? 'evidence' : ''].filter(Boolean).join(' ');
  return `<i class="${className}" ${cand.includes(digit) ? `data-candidate="${digit}"` : ''}>${cand.includes(digit) ? digit : ''}</i>`;
 }).join('')}</span>` : '';
 const label=`${rc(i)}，${d==='0'?'空格'+(cand.length?'，候选 '+cand.join('、'):''):'数字 '+d}`;
 return `<button type="button" class="${flags}" ${readOnly?'tabindex="-1"':''} data-cell="${i}" aria-label="${label}" aria-pressed="${selected}">${d==='0'?notes:d}</button>`;
 }).join('')}${(proof&&showLinks)||links.length?drawLinks(showLinks?proof:null,links):''}</div>`;
}
function legend(proof, includeAction = true) {
 const action = includeAction ? '<span><i class="swatch m"></i>本步操作</span>' : '';
 if (!proof) return `<div class="legend"><span><i class="swatch f"></i>推理依据</span>${action}</div>`;
 const kind = proof.kind === 'colour'
  ? '<span><i class="swatch proof-blue"></i>蓝组</span><span><i class="swatch proof-purple"></i>紫组</span>'
  : '<span><i class="swatch proof-purple"></i>链端点</span>';
 const weak = proof.kind === 'chain' ? '<span><i class="link-sample weak"></i>弱链接</span>' : '';
 return `<div class="legend proof-legend">${kind}${action}<span><i class="link-sample"></i>强链接</span>${weak}
  ${btn('toggle-links', showLinks ? '隐藏连线' : '显示连线', '', 'text-link', `aria-pressed="${showLinks}"`)}
 </div>${describeLinks(proof)}`;
}
function go(path){if(location.hash==='#'+path)render();else location.hash=path;}
function route(){
 let [page,id]=location.hash.slice(1).split('/');
 if(!['play','lessons','solver'].includes(page))page='play';
 const lesson=page==='lessons'&&lessons.find(l=>l.id===id);
 return {page,lesson};
}
function render(){
 const {page,lesson}=route();activeRoute=page;
 document.body.classList.toggle('is-playing',page==='play');
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
function gameCandidates(step) {
 if (hintDepth && step) return step.candidates;
 const autoCandidates = possible();
 if (game.auto || inputMode === 'remove' || drawingMode) return autoCandidates;
 const annotationKeys = new Set([
  ...Object.keys(game.drawing.colours).map(Number),
  ...game.drawing.links.flatMap(({from,to})=>[nodeKey(from),nodeKey(to)])
 ]);
 return game.notes.map((notes, cell) => [...new Set([
  ...notes, ...autoCandidates[cell].filter(digit => annotationKeys.has(nodeKey({cell,digit})))
 ])]);
}

function drawingTools() {
 if (!drawingMode) return '';
 const captured = linkStart ? '点下一候选，重复点可停止' : '点选第一个候选数';
 const palette = Object.entries(drawingColours).map(([colour,label]) =>
  btn('draw-colour', '', '', `paint-chip paint-${colour}`, `data-colour="${colour}" aria-label="${label}" aria-pressed="${drawingColour===colour}"`)).join('');
 const controls = drawingMode === 'colour'
  ? `<div class="paint-palette">${palette}</div><span>点候选或格子</span>`
  : `${btn('link-type','强链','',strongLink?'tool active':'tool','data-strong="true" aria-pressed="'+strongLink+'"')}
     ${btn('link-type','弱链','',strongLink?'tool':'tool active','data-strong="false" aria-pressed="'+!strongLink+'"')}<span>${captured}</span>`;
 return `<div class="drawing-tools" aria-label="标注工具">${controls}${btn('clear-drawing','清除标注','','tool','aria-label="清除标注"')}</div>`;
}

function playHTML(){
 const p=progress(), step=hintStep;
 const selected = selectedCells.size;
 const header = `<div class="panel-head game-status"><div class="head-info"><strong>经典数独</strong><span class="pill">${practiceLevels[game.level]?.name||'自选'}</span><span class="game-count" aria-live="polite">${selected>1?`已选 ${selected} 格`:`${p.filled} / ${p.total} 格`}</span></div><span class="clock">${icon('clock',15)}<span id="time">${formatTime(game.seconds)}</span></span>${btn('new','换题','plus','tool game-new')}</div>`;
 const modes = [['value','填数'],['note','笔记'],['remove','删候选']].map(([mode,label])=>
  btn('input-mode',label,'','tool '+(inputMode===mode?'active':''),`data-mode="${mode}" aria-pressed="${inputMode===mode}"`)).join('');
 const tools = `<div class="tools game-tools">${btn('undo','撤销','undo','tool',game.history.length?'':'disabled')}${btn('erase','擦除','erase','tool',drawingMode?'disabled':'')}
 ${btn('multi','多选','grid','tool '+(multiSelect?'active':''),`aria-pressed="${multiSelect}"`)}
 ${btn('auto','候选','eye','tool '+(game.auto?'active':''),`aria-pressed="${game.auto}"`)}
 ${btn('drawing','涂色','','tool '+(drawingMode==='colour'?'active':''),`data-mode="colour" aria-pressed="${drawingMode==='colour'}"`)}
 ${btn('drawing','画链','','tool '+(drawingMode==='link'?'active':''),`data-mode="link" aria-pressed="${drawingMode==='link'}"`)}
 ${btn('hint','提示','bulb','tool')}</div>`;
 const coach=p.done? `<section class="coach"><div class="coach-label">${icon('check')} 完成研习</div><h2>这盘解开了</h2><p>用时 ${formatTime(game.seconds)}，所有空格均已填对。</p>${btn('new','再来一局','plus','btn coach-btn')}</section>`:
 `<section class="coach ${step?'':'intro'}" id="coach">${!step?heroArt():''}<div class="coach-label">${icon('bulb',17)} 随盘教练</div><h2>${!step?'下一步，从哪里看？':hintDepth===1?'先看这个区域':esc(step.title)}</h2><p>${!step?'卡住时，先要一点线索。':esc(hintDepth<3?step.clue:step.reason)}</p>${btn(hintDepth>=3?'apply-hint':'hint',hintDepth===0?'给我一点提示':hintDepth===1?'揭示技巧':hintDepth===2?'查看推理':'应用这一步','', 'btn coach-btn')}${step?btn('dismiss-hint','收起','','btn coach-btn mobile-dismiss'):''}</section>`;
 const board = boardHTML(game.board,{given:game.puzzle,selection:game.selection,chosen:selectedCells,
  candidates:gameCandidates(step),markErrors:original().solution,drawing:game.drawing,
  pending:linkStart ? nodeKey(linkStart) : null,...selectedOptions(step,hintDepth)});
 const keyLabel = drawingMode?'标注候选':{value:'填入数字',note:'切换笔记',remove:'删除候选'}[inputMode];
 return `<div class="work-area game-view"><section class="panel board-panel game-panel ${drawingMode?'drawing-active':''}">
  ${header}<div class="game-stage">${board}</div>
  <div class="game-controls"><div class="input-modes" aria-label="数字键模式">${modes}</div>
  ${buttonBar(keyLabel)}${tools}${drawingTools()}</div></section>
  <aside class="side game-side ${hintDepth || p.done ? 'coach-open' : ''}">${coach}
  <section class="panel side-card">${cardHead('技巧速练','<a class="text-link" href="#lessons">全部课程'+icon('right',14)+'</a>')}${[lessons[3],lessons[4]].map(lessonRow).join('')}</section>
  ${step?.proof&&hintDepth>1?`<section class="panel side-card">${legend(step.proof,hintDepth>2)}</section>`:''}
  </aside></div>`;
}
function lessonRow(l){return `<a class="lesson-row" href="#lessons/${l.id}">${motif(lessons.indexOf(l))}<span><strong>${l.title}</strong><small>${l.subtitle}</small></span>${icon('right',15)}</a>`;}
function resetHint(){hintDepth=0;hintStep=null;}
function persistPlay(passive=false){
 if(passive && playStorage()!==lastSavedPlay)return;
 save(playKey,game);
 lastSavedPlay=playStorage();
}
function keepUndo(){
 game.history.push({
  board:game.board,notes:structuredClone(game.notes),removed:structuredClone(game.removed),
  drawing:structuredClone(game.drawing),selection:game.selection,selected:[...selectedCells]
 });
 if(game.history.length>80)game.history.shift();
}
function refreshGame(){
 resetHint();
 persistPlay();
 render();
}
function chooseCell(cell, add = false){
 if (!add) selectedCells = new Set([cell]);
 else if (selectedCells.has(cell)) selectedCells.delete(cell);
 else selectedCells.add(cell);
 game.selection = selectedCells.has(cell) ? cell : ([...selectedCells].at(-1) ?? -1);
}
function setValue(i,d){
 game.board=game.board.slice(0,i)+d+game.board.slice(i+1);
 game.notes[i]=[];
 if(d!=='0')game.notes.forEach((a,j)=>{if(peer(i,j))game.notes[j]=a.filter(n=>n!==+d);});
}
function enterDigit(d){
 const i=game.selection;
 if(drawingMode && i>=0){annotate({cell:i,digit:d});return;}
 if(!selectedCells.size){toast('先点选一个空格');return;}
 const empty = [...selectedCells].filter(cell => game.board[cell] === '0');
 if(inputMode === 'remove'){
  const available = possible();
  if(!empty.some(cell => game.notes[cell].includes(d) || available[cell].includes(d))){
   toast('所选格子里没有这个候选');return;
  }
  keepUndo();
  removeCandidates(game, empty, d, available);
 }else if(inputMode === 'note'){
  if(!empty.length){toast('只能在空格中记候选');return;}
  keepUndo();
  const remove = empty.every(cell => game.notes[cell].includes(d));
  for(const cell of empty){
   game.notes[cell] = game.notes[cell].filter(note => note !== d);
   if(!remove){
    game.notes[cell].push(d);
    game.removed[cell]=game.removed[cell].filter(note => note!==d);
   }
  }
  game.auto=false;
 }else{
  if(selectedCells.size!==1){toast('多选时可使用笔记或删候选');return;}
  if(game.puzzle[i]!=='0'){toast('题面给定的数字已锁定');return;}
  if(game.board[i]===String(d))return;
  keepUndo();
  setValue(i,String(d));
 }
 refreshGame();
 if(progress().done)toast('完成！所有数字均已填对。');
}
function setInputMode(mode){
 inputMode = mode;
 game.pencil = mode === 'note';
 if(game.pencil)game.auto=false;
 drawingMode='';
 linkStart=null;
 refreshGame();
}
function annotate(node){
 if (node.digit && !gameCandidates(null)[node.cell].includes(node.digit)) return;
 if (drawingMode === 'colour'){
  keepUndo();
  changeColour(game.drawing, node, drawingColour);
 }else{
  if(!node.digit){toast('请点选候选数字');return;}
  if(!linkStart){linkStart=node;render();return;}
  if(nodeKey(linkStart)===nodeKey(node)){linkStart=null;render();return;}
  keepUndo();
  changeLink(game.drawing, linkStart, node, strongLink);
  linkStart=node;
 }
 refreshGame();
}
function eraseSelection(){
 const targets = [...selectedCells].filter(i => game.puzzle[i]==='0');
 if(!targets.length){toast('先选择可编辑的格子');return;}
 if(inputMode==='value' && targets.length>1){toast('擦除填数时，请只选一格');return;}
 if(!targets.some(i => inputMode==='remove' ? game.removed[i].length :
  game.notes[i].length || (inputMode==='value' && game.board[i]!=='0')))return;
 keepUndo();
 for(const index of targets){
  if(inputMode==='remove')game.removed[index]=[];
  else if(inputMode==='note')game.notes[index]=[];
  else setValue(index,'0');
 }
 refreshGame();
}
function hint(){
 if(progress().done)return;
 drawingMode='';
 linkStart=null;
 if([...game.board].some((d,i)=>d!=='0'&&d!==original().solution[i])){toast('先检查棋盘上标红的数字');return;}
 if(!hintStep){hintStep=analysis(game.board).steps.find(s=>s.updates.some(u=>u.kind==='place'||!game.removed[u.index].includes(u.digit)));if(!hintStep){toast('当前技巧库还找不到可解释的下一步');return;}}
 hintDepth=Math.min(3,hintDepth+1);render();

}
function applyHint(){
 if(!hintStep||hintDepth!==3)return;
 keepUndo();for(const u of hintStep.updates){if(u.kind==='place')setValue(u.index,String(u.digit));else if(!game.removed[u.index].includes(u.digit)){game.removed[u.index].push(u.digit);game.notes[u.index]=game.notes[u.index].filter(n=>n!==u.digit);}}
 chooseCell(hintStep.updates[0].index);game.auto=true;resetHint();persistPlay();render();toast('这一步已应用');
}
function libraryHTML(){
 const done = lessons.filter(lesson => completed[lesson.id]).length;
 const groups = lessonGroups.map(({title, ids}) => {
  const tiles = ids.map(id => {
   const lesson = lessonById.get(id);
   return `<a class="panel lesson-tile" href="#lessons/${id}">
     ${motif(lessons.indexOf(lesson))}<h3>${lesson.title}</h3><p>${lesson.subtitle}</p>
     <span class="text-link">${completed[id] ? '已完成 · 再练一次' : '进入课程'}${icon('arrow',14)}</span>
   </a>`;
  }).join('');
  return `<section class="lesson-group"><h2>${title}</h2><div class="lesson-library">${tiles}</div></section>`;
 }).join('');
 return mast('技巧课程', `已完成 ${done} / ${lessons.length} 门。`) + groups;
}
function startLesson(id,index=0){lessonState={id,index,phase:'observe',selection:-1,hits:[],feedback:'',wrong:false,reveal:false};}
function lessonHTML(l){
 if(!lessonState||lessonState.id!==l.id)startLesson(l.id);
 const s=lessonState,x=l.examples[s.index],guide=s.phase==='observe',win=s.phase==='done',guided=s.index===0;
 const explicit=guide||s.reveal||win;
 const candidates=win ? x.candidates : x.candidates.map((a,i)=>a.filter(d=>!s.hits.includes(i+'-'+d)));
 const current=[...x.board];for(const u of x.updates)if(u.kind==='place'&&s.hits.includes(u.index+'-'+u.digit))current[u.index]=String(u.digit);
 const removing=x.updates[0].kind==='remove';
 const stepLabel=guide?'观察示范':win?'练习完成':guided?'引导练习':'独立练习';
 const progressText=`${s.hits.length} / ${x.updates.length}`;
 const board=boardHTML(current.join(''),{given:x.puzzle,selection:s.selection,candidates,focus:explicit?x.focus:[],digits:explicit?x.digits:[],region:explicit?x.region:[],proof:explicit?x.proof:null,updates:win?x.updates:[]});
 const aside=`<div class="side"><section class="coach"><div class="coach-label">${icon('book',16)} ${stepLabel}</div><h2>${guide?'先读懂这条规则':win?'这一步做对了':removing?'删去哪几个候选？':'哪一格可以填数？'}</h2><p>${esc(guide?l.rule:win?x.reason:l.action)}</p>${guide?btn('lesson-start','在棋盘上试一试','pointer','btn coach-btn'):win?btn('lesson-next','换一个局面','rotate','btn coach-btn'):btn('lesson-help',s.reveal?'收起线索':'给我一点线索','bulb','btn coach-btn')}</section><section class="panel side-card">${cardHead(guide?'观察棋盘':win?'回顾推理':'练习提示')}<p class="rule-text">${esc(guide||s.reveal?x.clue:win?l.rule:l.observation)}</p>${s.feedback?`<div role="status" class="status-msg ${s.wrong?'warn':''}">${esc(s.feedback)}</div>`:''}<div class="read-actions">${btn('lesson-replay','在解题器中回放','solve','btn')}</div></section></div>`;
 return `<a href="#lessons" class="backlink">${icon('back',15)} 课程目录</a>`+mast(l.title,l.subtitle)+`<div class="work-area"><section class="panel board-panel"><div class="panel-head"><div class="head-info"><strong>${stepLabel}</strong><span class="pill">例题 ${s.index+1} / ${l.examples.length}</span></div><span class="small">${guide?'观察':removing?'删除候选':'填入数字'} ${guide?'':progressText}</span></div>${board}${!guide&&!win?buttonBar(removing?'删除候选':'填入数字'):''}${explicit?legend(x.proof,win):''}</section>${aside}</div>`;
}
function lessonDigit(d){
 const l=route().lesson,s=lessonState;if(!l||s.phase!=='practice')return;
 if(s.selection<0){toast('先选中要操作的格子');return;}
 const x=l.examples[s.index],key=s.selection+'-'+d;
 if(s.hits.includes(key)){toast('这个候选已经处理过了');return;}
 if(x.updates.some(u=>u.index===s.selection&&u.digit===d)){
 s.hits.push(key);s.wrong=false;
 if(s.hits.length===x.updates.length){s.phase='done';s.feedback=s.index===0?'引导练习完成。换一个局面，独立试一次。':'独立练习完成，已记录本课进度。';if(s.index!==0){completed[l.id]=true;save(lessonKey,completed);}}
 else s.feedback='这一步正确。再找找其他可以排除的候选。';
 }else{s.feedback='这个操作不能由本课技巧推出。'+l.observation;s.wrong=true;}
 render();toast(s.wrong?'再观察一下':s.phase==='done'?'这一步做对了':'正确，继续寻找');
}
function stepPicker(steps, index) {
 const options = steps.map((step, i) => `<option value="${i}" ${i===index?'selected':''}>${i+1}. ${esc(step.title)}</option>`);
 return `<label class="step-picker">跳到步骤 <select id="solver-step">${options.join('')}<option value="${steps.length}" ${index===steps.length?'selected':''}>回放结束</option></select></label>`;
}
function solverHTML(){
 if(!solver)return mast('分步解题器','带上你自己的题面，查看每一步的观察区域、技巧和依据。')+`<section class="panel solver-start"><label for="import">导入经典数独</label><p class="small">输入 81 个数字，空格用 0 或英文句点代替。可以分行粘贴。</p><textarea id="import" spellcheck="false" placeholder="在此粘贴题面">${esc(solverInput)}</textarea>${solverError?`<p class="form-error" role="alert">${esc(solverError)}</p>`:''}<div class="split">${btn('analyze',solving?'正在分析…':'分析题面','solve','btn primary',solving?'disabled':'')}${btn('sample','使用示例题','grid','btn')}${btn('use-game','导入研习台原题','book','btn')}</div></section>`;
 const {result,puzzle,index}=solver, step=result.steps[index],atEnd=!step;
 const previous=result.steps.at(-1);
 let state=step?.board||result.solution,candidates=step?.candidates;
 if(atEnd&&!result.logicalComplete){state=previous?.board||puzzle;candidates=previous?.candidates?.map(a=>[...a]);if(previous)for(const u of previous.updates){if(u.kind==='place')state=state.slice(0,u.index)+u.digit+state.slice(u.index+1);else candidates[u.index]=candidates[u.index].filter(x=>x!==u.digit);}}
 const subtitle=result.logicalComplete?'跳到任意步骤，查看候选数怎样推出填数或删数。':'当前技巧库可解释到下方位置。';
 return mast('分步解题器',subtitle,btn('solver-reset','更换题面','plus'))+`<div class="work-area"><section class="panel board-panel"><div class="panel-head"><strong>推理回放</strong><span class="pill">${atEnd?'回放结束':'第 '+(index+1)+' / '+result.steps.length+' 步'}</span></div>${boardHTML(state,{given:puzzle,candidates,readOnly:true,...selectedOptions(step,3)})}${legend(step?.proof, !atEnd)}<div class="read-actions">${result.steps.length ? stepPicker(result.steps, index) : ''}${btn('prev','上一步','back','btn',index===0?'disabled':'')}${btn('next','下一步','right','btn primary',atEnd?'disabled':'')}</div></section><aside class="side"><section class="coach"><div class="coach-label">${icon('solve')} 推理说明</div><h2>${esc(step?.title||(result.logicalComplete?'棋盘已解开':'已到当前技巧边界'))}</h2><p>${esc(step?.reason||(result.logicalComplete?'已完成全部逻辑步骤。':'此题有唯一解，后续步骤暂时无法逐步讲解。'))}</p></section>${step?`<section class="panel side-card">${cardHead('本步操作')}<p class="rule-text">${step.updates.map(u=>rc(u.index)+(u.kind==='place'?' 填入 ':' 删去候选 ')+u.digit).join('，')}</p>${lessons.some(l=>l.id===step.technique)?`<a class="text-link" href="#lessons/${step.technique}">练习这个技巧 ${icon('arrow',15)}</a>`:''}</section>`:''}</aside></div>`;
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
 dialogLevel=Object.hasOwn(practiceLevels, game.level)?game.level:'L4';
 const paint=()=>showDialog(dialogHead('换一局数独')+`<p>选择练习难度，开始后将替换研习台上的当前题目。</p>${Object.entries(practiceLevels).map(([key,{name,technique}])=>btn('level',`<span>${name}</span><small>${lessonById.get(technique).title}</small>`,'','choice '+(dialogLevel===key?'active':''),`data-level="${key}" aria-pressed="${dialogLevel===key}"`)).join('')}<div class="read-actions">${btn('generate',generating?'正在出题…':'开始新题','play','btn primary',generating?'disabled':'')}</div>`);
 paint();return paint;
}
let paintNew;
async function fresh(){
 if(generating)return;generating=true;paintNew();const level=dialogLevel;
 try{let puzzle=await runWorker('generate',level);if(puzzle===game.puzzle)puzzle=await runWorker('generate',level);game=newGame(puzzle,level);selectedCells.clear();multiSelect=false;inputMode='value';drawingMode='';linkStart=null;resetHint();persistPlay();dialog.close();render();toast('新题已就绪');}
 catch{toast('出题未完成，请再试一次');}finally{generating=false;if(dialog.open)paintNew();}
}
function selectCell(i,add=false){
 if(activeRoute==='play'){chooseCell(i,add);persistPlay();render();}
 else if(route().lesson){lessonState.selection=i;render();}
 if(activeRoute==='play' || route().lesson)app.querySelector(`[data-cell="${i}"]`)?.focus({preventScroll:true});
}
document.addEventListener('click',e=>{
 const cell=e.target.closest('[data-cell]');
 if(cell){
  const index=Number(cell.dataset.cell);
  if(activeRoute==='play' && drawingMode){
   const digit=Number(e.target.closest('[data-candidate]')?.dataset.candidate || 0);
   chooseCell(index);
   annotate({cell:index,digit});
  }else selectCell(index,activeRoute==='play' && (multiSelect||e.shiftKey||e.ctrlKey||e.metaKey));
  return;
 }
 const b=e.target.closest('[data-action]');if(!b||b.disabled)return;
 const a=b.dataset.action,l=route().lesson,s=lessonState;
 switch(a){
 case 'help':showDialog(dialogHead('操作指南')+'<p><b>多选</b>　开启「多选」后逐格点选。电脑上也可以按住 Shift、Ctrl 或 ⌘ 点击。选「删候选」后点数字，可从选中格批量删除。</p><p><b>涂色与画链</b>　选颜色后点格子或候选数。画链时先选强链或弱链，再依次点候选数，连线会接着上一个端点。重复点当前端点可结束，沿同一段画回可取消该段。</p><p><b>输入与撤销</b>　数字键按当前模式填数、记笔记或删候选。「擦除」在删候选模式下恢复所选格的自动候选。棋局和标注会自动保存。</p>');break;
 case 'close':dialog.close();break;
 case 'new':paintNew=openNew();break;
 case 'level':if(!generating){dialogLevel=b.dataset.level;paintNew();}break;
 case 'generate':fresh();break;
 case 'digit':if(activeRoute==='play')enterDigit(+b.dataset.digit);else lessonDigit(+b.dataset.digit);break;
 case 'undo':
  if(game.history.length){
   const {selected,...snapshot}=game.history.pop();
   Object.assign(game,snapshot);
   selectedCells=new Set(selected??(game.selection>=0?[game.selection]:[]));
   linkStart=null;
   refreshGame();
  }
  break;
 case 'erase':eraseSelection();break;
 case 'input-mode':setInputMode(b.dataset.mode);break;
 case 'multi':
  multiSelect=!multiSelect;
  if(!multiSelect)selectedCells=new Set(game.selection>=0?[game.selection]:[]);
  drawingMode='';
  linkStart=null;
  render();
  break;
 case 'auto':
  game.auto=!game.auto;
  if(game.auto && inputMode==='note')setInputMode('value');
  else refreshGame();
  break;
 case 'drawing':
  drawingMode=drawingMode===b.dataset.mode?'':b.dataset.mode;
  linkStart=null;
  resetHint();
  render();
  break;
 case 'draw-colour':drawingColour=b.dataset.colour;render();break;
 case 'link-type':strongLink=b.dataset.strong==='true';render();break;
 case 'clear-drawing':
  if(Object.keys(game.drawing.colours).length || game.drawing.links.length){
   keepUndo();
   game.drawing=emptyDrawing();
   refreshGame();
  }
  linkStart=null;
  render();
  break;
 case 'dismiss-hint':resetHint();render();break;
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
 case 'toggle-links':showLinks=!showLinks;render();document.querySelector('[data-action=toggle-links]')?.focus({preventScroll:true});break;
 case 'prev':solver.index--;render();break;
 case 'next':solver.index++;render();break;
 }
});
document.addEventListener('change', event => {
 if (event.target.id !== 'solver-step' || !solver) return;
 solver.index = Number(event.target.value);
 render();
 document.querySelector('#solver-step')?.focus({preventScroll:true});
});
document.addEventListener('input',e=>{if(e.target.id==='import')solverInput=e.target.value;});
document.addEventListener('keydown',e=>{
 if(dialog.open||e.target.matches('textarea,input,select')||e.ctrlKey||e.metaKey||e.altKey)return;
 const l=route().lesson;if(activeRoute!=='play'&&!l)return;
 if(e.key==='Escape'&&activeRoute==='play'){linkStart=null;drawingMode='';resetHint();render();return;}
 if(/^[1-9]$/.test(e.key)){e.preventDefault();if(l)lessonDigit(+e.key);else enterDigit(+e.key);return;}
 const i=(l?lessonState.selection:game.selection);
 const shifts={ArrowLeft:-1,ArrowRight:1,ArrowUp:-9,ArrowDown:9};
 if(e.key in shifts){e.preventDefault();selectCell(Math.max(0,Math.min(80,i<0?0:i+shifts[e.key])));return;}
 if(!l){if(e.key.toLowerCase()==='n'){e.preventDefault();setInputMode(inputMode==='note'?'value':'note');return;}const action={Backspace:'erase',Delete:'erase'}[e.key];if(action){e.preventDefault();document.querySelector(`[data-action="${action}"]`)?.click();}}
});
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);});
dialog.addEventListener('cancel',e=>{if(generating)e.preventDefault();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)persistPlay(true);});
window.addEventListener('pagehide',()=>persistPlay(true));
setInterval(()=>{if(activeRoute==='play'&&!document.hidden&&!dialog.open&&!progress().done){game.seconds++;const t=document.getElementById('time');if(t)t.textContent=formatTime(game.seconds);if(game.seconds%10===0)persistPlay(true);}},1000);
document.querySelector('.help').innerHTML=icon('help',20);render();

