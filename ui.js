const paths = {
 grid:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 10h18M10 3v18"/>',
 book:'<path d="M3 5q5-2 9 1 4-3 9-1v14q-5-2-9 1-4-3-9-1zM12 6v14"/>',
 solve:'<path d="M4 6h6m4 0h6M4 12h2m4 0h10M4 18h10m4 0h2"/><circle cx="12" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.6 2.6 0 0 1 5 .6c0 1.7-2.5 2-2.5 4m0 3v.1"/>',
 plus:'<path d="M12 5v14M5 12h14"/>', right:'<path d="m9 5 7 7-7 7"/>',arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',down:'<path d="m6 9 6 6 6-6"/>',
 back:'<path d="m14 5-7 7 7 7"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 undo:'<path d="M9 7 4 12l5 5m-5-5h11a5 5 0 0 1 5 5"/>',
 erase:'<path d="m4 13 9-9a2 2 0 0 1 3 0l4 4a2 2 0 0 1 0 3L10 21H8l-4-4a3 3 0 0 1 0-4Zm4-4 7 7m-5 5h11"/>',
 pen:'<path d="m4 16-1 5 5-1L20 8l-4-4zM14 6l4 4"/>',
 bulb:'<path d="M9 17c0-3-4-4-4-8a7 7 0 0 1 14 0c0 4-4 5-4 8zM9 20h6m-5 2h4"/>',
 check:'<path d="m4 12 5 5L20 6"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',
 levels:'<path d="M5 18v-4m6 4V9m6 9V5"/>',play:'<path d="m8 4 11 8-11 8z"/>',
 rotate:'<path d="M4 11a8 8 0 1 1 2 7M4 4v7h7"/>',eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 leaf:'<path d="M19 3C9 3 4 6 4 12a6 6 0 0 0 6 6c6 0 9-5 9-15ZM5 20l9-10"/>',
 list:'<path d="M8 6h12M8 12h12M8 18h12M3 6h.1M3 12h.1M3 18h.1"/>',
 pointer:'<path d="m4 3 6 17 3-7 7-3z"/>', flag:'<path d="M5 21V4q4-3 8 0t7 0v10q-4 3-8 0t-7 0"/>'
};
export function icon(id,size=18){return '<svg aria-hidden="true" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.65">'+(paths[id]||'')+'</svg>';}
export function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export const rc=i=>'R'+(1+Math.floor(i/9))+'C'+(1+i%9);
export function motif(type=0,full=false){
 const values=[[0,4,7],[2,4,6],[0,3,6],[3,4,5],[2,4,8]][type%5];
 const hot=values[type%3];let g='';
 for(let i=0;i<9;i++){
 const x=8+(i%3)*22,y=8+Math.floor(i/3)*22, on=values.includes(i);
 g+='<rect x="'+x+'" y="'+y+'" width="20" height="20" rx="2" fill="'+(i===hot?'#edc17e':on?'#99bc94':'#e1e8d8')+'"/>';
 if(on)g+='<text x="'+(x+10)+'" y="'+(y+14)+'" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="#294f38">'+([2,7,4,3,8,5,9,1,6][i])+'</text>';
 }
 return '<svg aria-hidden="true" viewBox="0 0 80 80" class="'+(full?'hero-motif':'motif')+'">'+g+'</svg>';
}
