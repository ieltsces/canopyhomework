/* CES Canopy · English interface. A VI/EN switch for the whole site (map, stations, games).
   Vietnamese stays the source text; when English is on, text nodes and a few attributes are
   translated from a dictionary (i18n-en.js). Phrases with {} are patterns: the wildcard parts
   are translated again, so "Con đã {} lại bài này." works with any word in the gap.
   The choice is saved in localStorage ("ces_lang") and shared with lessons shown in a frame. */
(function(){
'use strict';
var KEY='ces_lang', VN=/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
var lang='vi', exact=Object.create(null), pats=[], built=false, starts=Object.create(null);
var TOK=/[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu;
function toks(s){ var a=[], m; TOK.lastIndex=0; while((m=TOK.exec(s))) a.push({v:m[0],i:m.index,e:m.index+m[0].length}); return a; }
function read(){ try{ return localStorage.getItem(KEY)==='en'?'en':'vi'; }catch(e){ return 'vi'; } }
function esc(s){ return s.replace(/[.*+?^$()|[\]\\]/g,'\\$&'); }
function build(){ if(built) return; built=true; var D=window.I18N_EN||{};
  Object.keys(D).forEach(function(k){ var v=D[k]; if(v==null||v==='SKIP') return;
    if(k.indexOf('{}')<0){ exact[k]=v; var t=toks(k); if(t.length>1&&VN.test(k)){ (starts[t[0].v]=starts[t[0].v]||[]).push({t:t.map(function(x){ return x.v; }),en:v}); } return; }
    var parts=k.split('{}'), lit=parts.join('').length;
    if(lit<3) return;
    pats.push({re:new RegExp('^'+parts.map(esc).join('(.*?)')+'$'),en:v,lit:lit}); });
  pats.sort(function(a,b){ return b.lit-a.lit; });
  for(var k in starts) starts[k].sort(function(a,b){ return b.t.length-a.t.length; }); }
/* fallback: replace the longest known phrases inside text that no whole entry matches */
function partial(s){ var t=toks(s), out='', last=0, hit=false, i=0;
  while(i<t.length){ var c=starts[t[i].v], m=null;
    if(c) for(var j=0;j<c.length;j++){ var w=c[j].t, ok=i+w.length<=t.length; for(var k=0;ok&&k<w.length;k++) if(t[i+k].v!==w[k]) ok=false; if(ok){ m=c[j]; break; } }
    if(m){ out+=s.slice(last,t[i].i)+m.en; last=t[i+m.t.length-1].e; i+=m.t.length; hit=true; } else i++; }
  return hit?out+s.slice(last):null; }
function norm(s){ return s.replace(/\s+/g,' ').trim(); }
function tr(s,d){ d=d||0; var n=norm(s); if(!n) return null; if(exact[n]!=null) return exact[n];
  if(d>3) return null;
  for(var i=0;i<pats.length;i++){ var p=pats[i], m=p.re.exec(n); if(!m) continue; var k=0;
    return p.en.replace(/\{\}/g,function(){ k++; var g=m[k]; if(g==null) return ''; var t=VN.test(g)||exact[norm(g)]!=null?tr(g,d+1):null; return t!=null?t:g; }); }
  return d===0?partial(n):null; }
var ATTR=['title','aria-label','placeholder','alt'];
function text(n){ var v=n.nodeValue; if(!v) return; var st=n.__i; if(st&&st.en===v) return;
  if(!VN.test(v)&&!(exact[norm(v)]!=null)) return;
  var r=tr(v); if(r==null) return; var lead=/^\s*/.exec(v)[0], trail=/\s*$/.exec(v)[0], nv=lead+r+trail;
  n.__i={vi:v,en:nv}; n.nodeValue=nv; }
function attrs(el){ var st=el.__a||(el.__a={});
  for(var i=0;i<ATTR.length;i++){ var a=ATTR[i], v=el.getAttribute&&el.getAttribute(a); if(!v) continue; var s=st[a]; if(s&&s.en===v) continue;
    if(!VN.test(v)&&exact[norm(v)]==null) continue; var r=tr(v); if(r==null) continue; st[a]={vi:v,en:r}; el.setAttribute(a,r); } }
var SKIP={SCRIPT:1,STYLE:1,TEXTAREA:1,NOSCRIPT:1};
function walk(root){ if(!root) return;
  if(root.nodeType===3){ text(root); return; }
  if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11) return;
  if(root.nodeType===1){ if(SKIP[root.tagName]) return; attrs(root); }
  var w=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{acceptNode:function(n){ return n.nodeType===1&&SKIP[n.tagName]?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT; }});
  var n; while((n=w.nextNode())){ if(n.nodeType===3) text(n); else attrs(n); } }
function revert(){ var w=document.createTreeWalker(document.documentElement,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT), n;
  while((n=w.nextNode())){
    if(n.nodeType===3){ if(n.__i&&n.nodeValue===n.__i.en) n.nodeValue=n.__i.vi; n.__i=null; }
    else if(n.__a){ for(var a in n.__a){ var s=n.__a[a]; if(s&&n.getAttribute(a)===s.en) n.setAttribute(a,s.vi); } n.__a=null; } }
  if(document.__t&&document.title===document.__t.en) document.title=document.__t.vi; document.__t=null; }
function title(){ var t=document.title; if(!t) return; if(document.__t&&document.__t.en===t) return; var r=tr(t); if(r!=null){ document.__t={vi:t,en:r}; document.title=r; } }
var q=new Set(), raf=0;
function flush(){ raf=0; if(lang!=='en'){ q.clear(); return; } var a=Array.from(q); q.clear(); a.forEach(function(n){ if(n.isConnected!==false) walk(n); }); }
function sched(n){ q.add(n); if(!raf) raf=requestAnimationFrame(flush); }
var mo=null;
function observe(){ if(mo||typeof MutationObserver==='undefined') return;
  mo=new MutationObserver(function(list){ if(lang!=='en') return;
    list.forEach(function(m){ if(m.type==='childList'){ m.addedNodes.forEach(function(n){ sched(n); }); }
      else if(m.type==='characterData'){ sched(m.target); }
      else if(m.type==='attributes'){ sched(m.target); } }); });
  mo.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTR}); }
function label(){ var b=document.getElementById('langBtn'); if(!b) return;
  b.textContent=lang==='en'?'VI':'EN'; b.setAttribute('aria-pressed',String(lang==='en'));
  b.setAttribute('aria-label',lang==='en'?'Chuyển sang tiếng Việt':'Switch to English'); b.title=lang==='en'?'Tiếng Việt':'English'; }
function apply(){ build(); document.documentElement.lang=lang==='en'?'en':'vi';
  if(lang==='en'){ observe(); walk(document.documentElement); title(); } else revert(); label(); }
function set(l,noSave){ l=l==='en'?'en':'vi'; if(l===lang&&noSave) return; lang=l;
  if(!noSave){ try{ localStorage.setItem(KEY,l); }catch(e){} } apply(); }
function floatBtn(){ if(document.getElementById('langBtn')||window.top!==window) return;
  var b=document.createElement('button'); b.type='button'; b.id='langBtn';
  b.style.cssText='position:fixed;right:max(10px,env(safe-area-inset-right,0px));top:max(10px,env(safe-area-inset-top,0px));z-index:50;min-width:44px;min-height:40px;padding:0 12px;border:3px solid #111;background:#fcc100;color:#111;font:800 14px system-ui,sans-serif;cursor:pointer;box-shadow:3px 3px 0 #111';
  document.body.appendChild(b); }
function wire(){ var b=document.getElementById('langBtn'); if(b&&!b.__w){ b.__w=1; b.addEventListener('click',function(){ set(lang==='en'?'vi':'en'); }); } label(); }
function init(){ floatBtn(); wire(); lang=read(); apply(); }
window.addEventListener('storage',function(e){ if(e.key===KEY) set(read(),true); });
window.I18N={get:function(){ return lang; },set:set,t:function(s){ build(); var r=tr(s); return r==null?s:r; },refresh:function(){ if(lang==='en') walk(document.documentElement); }};
lang=read();
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
window.addEventListener('load',function(){ if(lang==='en') walk(document.documentElement); });
})();
