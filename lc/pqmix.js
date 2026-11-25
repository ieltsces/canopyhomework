/* Lingo Cub · "Nhìn hình / nhìn chữ chọn pinyin": before each question the pictures shuffle
   like a slot machine, then stop on the picture(s) of the question. A word made of several red
   characters spins one reel per character and the reels stop one after another.
   Works on top of the page's own PQ object (loaded after the page script). */
(function(){
'use strict';
var P; try{ P=PQ; }catch(e){ return; }
if(!P || typeof P.show!=='function' || P.__mix) return;
P.__mix=true;
function $(id){ return document.getElementById(id); }
var calm=false; try{ calm=window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}

/* ---- styles ---- */
var css='#pqPic.pqspin img,#pqPic.pqspin .pqf{filter:blur(1px);transform:translateY(-3px)}'+
'#pqPic.pqspin{animation:pqshake .16s linear infinite}'+
'@keyframes pqshake{0%{transform:translateX(0)}25%{transform:translateX(-2px)}75%{transform:translateX(2px)}100%{transform:translateX(0)}}'+
'#pqPic .pqland{animation:pqland .38s cubic-bezier(.3,1.6,.5,1)}'+
'@keyframes pqland{0%{transform:scale(.7)}100%{transform:scale(1)}}'+
'#pqOpts.pqwait{opacity:.35;pointer-events:none;transition:opacity .2s}'+
'#pqOpts{transition:opacity .25s}'+
'#pqPic .pqbadge{position:absolute;left:50%;bottom:6px;transform:translateX(-50%);background:var(--ink,#1d2433);color:#fff;font-weight:800;font-size:13px;padding:3px 10px;white-space:nowrap;pointer-events:none}';
var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

/* ---- tiny tick sound (only after the child has tapped, so audio is allowed) ---- */
var ac=null;
function tick(f,v){ try{ ac=ac||new (window.AudioContext||window.webkitAudioContext)(); if(ac.state==='suspended') ac.resume();
  var t=ac.currentTime, o=ac.createOscillator(), g=ac.createGain(); o.type='square'; o.frequency.value=f||900;
  g.gain.setValueAtTime(v||.025,t); g.gain.exponentialRampToValueAtTime(.0001,t+.05); o.connect(g).connect(ac.destination); o.start(t); o.stop(t+.06); }catch(e){} }

/* ---- pools built from every question of this round ---- */
function frag(html){ var d=document.createElement('div'); d.innerHTML=html||''; return d; }
function mainImgs(root){ return Array.prototype.filter.call(root.querySelectorAll('img'),function(im){ return !im.closest('.reveal'); }); }
function build(Q){ var cards=[], srcs=[], seen={};
  (Q||[]).forEach(function(q){
    var d=frag(q.img?'<img src="'+q.img+'">':q.html), w=d.querySelector('.pqw');
    if(w) Array.prototype.forEach.call(w.children,function(c){ var h=c.outerHTML; if(!seen[h]){ seen[h]=1; cards.push(h); } });
    else mainImgs(d).forEach(function(im){ var s=im.getAttribute('src'); if(s&&!seen[s]){ seen[s]=1; srcs.push(s); } });
  });
  /* warm the cache so the shuffle does not flicker */
  srcs.concat(cards.map(function(h){ var m=/src="([^"]+)"/.exec(h); return m?m[1]:''; })).forEach(function(s){ if(s){ var i=new Image(); i.src=s; } });
  return {cards:cards, srcs:srcs}; }
function any(a,not){ if(!a.length) return null; var x, n=0; do{ x=a[Math.floor(Math.random()*a.length)]; n++; }while(a.length>1&&x===not&&n<8); return x; }
function node(html){ var d=frag(html); return d.firstElementChild; }

var origReset=P.reset, origShow=P.show, run=0;
P.reset=function(){ this.__pool=null; return origReset.apply(this,arguments); };
P.show=function(){
  var p0=$('pqPic'), o0=$('pqOpts'); if(p0) p0.classList.remove('pqspin'); if(o0) o0.classList.remove('pqwait');
  var r=origShow.apply(this,arguments), me=++run, self=this;
  if(!this.__pool) this.__pool=build(this.Q);
  var pool=this.__pool, pic=$('pqPic'), opts=$('pqOpts'), msg=$('pqMsg');
  if(!pic||calm) return r;
  var w=pic.querySelector('.pqw'), reels=[];
  if(w && pool.cards.length>1){
    Array.prototype.forEach.call(w.children,function(c){ reels.push({kind:'card', fin:c.outerHTML, cur:c}); });
  } else {
    var im=mainImgs(pic)[0];
    if(im && pool.srcs.length>1) reels.push({kind:'src', el:im, fin:im.getAttribute('src')});
  }
  if(!reels.length) return r;

  /* hold the answers until the pictures stop */
  this.lock=true; opts.classList.add('pqwait'); var keepMsg=msg.innerHTML, keepCls=msg.className;
  msg.className='msg'; msg.textContent='Đang xáo hình… xem hình nào dừng lại nhé!';
  var badge=document.createElement('span'); badge.className='pqbadge'; badge.textContent='Xáo hình…'; pic.appendChild(badge);
  pic.classList.add('pqspin');

  var spinMs=900, gap=380, stopAt=reels.map(function(_,k){ return spinMs+k*gap; }), t0=performance.now(), delay=60, last=0;
  function set(rl,done){
    if(rl.kind==='src'){ rl.el.src=done?rl.fin:any(pool.srcs,rl.el.getAttribute('src')); if(done){ rl.el.classList.remove('pqland'); void rl.el.offsetWidth; rl.el.classList.add('pqland'); } return; }
    var n=node(done?rl.fin:any(pool.cards,rl.cur.outerHTML)); if(!n) return;
    if(done) n.classList.add('pqland');
    rl.cur.replaceWith(n); rl.cur=n; }
  function step(now){
    if(me!==run) return;                     /* a newer question took over */
    var el=now-t0, live=0;
    if(now-last>=delay){ last=now; var moved=false;
      reels.forEach(function(rl,k){ if(rl.stop) return; if(el>=stopAt[k]){ rl.stop=true; set(rl,true); tick(520,.05); } else { set(rl,false); moved=true; } });
      if(moved) tick(900+Math.random()*300);
      delay=Math.min(170,delay*1.07); }
    reels.forEach(function(rl){ if(!rl.stop) live++; });
    if(live){ requestAnimationFrame(step); return; }
    pic.classList.remove('pqspin'); if(badge.parentNode) badge.remove();
    msg.className=keepCls; msg.innerHTML=keepMsg;
    opts.classList.remove('pqwait'); self.lock=false; }
  requestAnimationFrame(step);
  return r; };
})();
