/* Lingo Cub · "Chạy trốn quái vật": a Temple-Run style quiz for the station pages.
   The child (Leo or Xiaobao) runs into the jungle with the leaf monster behind.
   Three answer gates come down three lanes; run through the right one.
   A lesson opts in with  act:'run'  in its acts/vocab and a  run()  that returns
   questions {qi, qm, vis?, say:[text,lang], opts:[{h, ok, why?}], after?, right?, say2?}. */
(function(){
'use strict';
var CHN={leo:'Leo',xiaobao:'Xiaobao'};
function sget(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function sset(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
function calm(){ try{ return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } }
function sfx(f){ try{ f(); }catch(e){} }

var css=''+
'.rn{display:flex;flex-direction:column;gap:12px}'+
'.rn .rn-q{min-height:64px}'+
'.rn .rn-stage{position:relative;width:100%;max-width:680px;margin:0 auto;aspect-ratio:4/3;overflow:hidden;border:4px solid var(--ink,#0e1526);box-shadow:5px 5px 0 var(--ink,#0e1526);background:#2f6f2c;touch-action:pan-y;user-select:none;-webkit-user-select:none;outline:none}'+
'.rn .rn-stage:focus-visible{outline:4px solid #ffcd3c;outline-offset:3px}'+
'.rn .rn-bg{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated}'+
'.rn .rn-gates{position:absolute;inset:0}'+
'.rn .rn-gate{position:absolute;left:0;top:0;width:31%;transform-origin:50% 100%;border:0;background:none;padding:0;cursor:pointer;display:flex;flex-direction:column;align-items:center;font:inherit;color:inherit}'+
'.rn .rn-sign{display:block;width:100%;background:#fff6e0;border:.2em solid #3b2414;box-shadow:.18em .18em 0 #3b2414;padding:.35em .4em;font-weight:800;text-align:center;line-height:1.25;color:#0e1526}'+
'.rn .rn-sign img{max-width:100%;height:auto;display:block;margin:0 auto}'+
'.rn .rn-sign img.wimg{width:3.6em;height:3.6em;object-fit:cover;border:2px solid #0e1526}'+
'.rn .rn-sign .zh{font-size:1.12em}.rn .rn-sign .py{display:block;font-size:.72em;font-weight:600;color:#5b6475}'+
'.rn .rn-posts{display:flex;justify-content:space-between;width:70%;height:1.5em}'+
'.rn .rn-posts i{display:block;width:.45em;height:100%;background:#8a5a34;border:.12em solid #3b2414;border-top:0}'+
'.rn .rn-gate.ok .rn-sign{background:#bdf0a0}.rn .rn-gate.bad .rn-sign{background:#ffb4ab}'+
'.rn .rn-gate.lane-me .rn-sign{outline:.22em solid #ffcd3c;outline-offset:.12em}'+
'.rn .rn-rock{position:absolute;left:0;top:0;width:16%;aspect-ratio:2/1;transform-origin:50% 100%;background:#8f97a3;border:.25em solid #0e1526;border-radius:40% 45% 8% 8%;box-shadow:inset -.5em -.3em 0 #6b7380}'+
'.rn .rn-me,.rn .rn-mon{position:absolute;left:0;top:0;transform-origin:50% 100%;pointer-events:none;image-rendering:auto}'+
'.rn .rn-me{height:31%;z-index:3;filter:drop-shadow(0 .35em 0 rgba(0,0,0,.28))}'+
'.rn .rn-mon{z-index:2;opacity:.97}'+
'.rn .rn-hud{position:absolute;left:0;right:0;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 8px;font:700 12px/1 var(--f-px,monospace);color:#fff6e0;pointer-events:none}'+
'.rn .rn-hud span{background:rgba(14,21,38,.82);border:2px solid #0e1526;padding:5px 7px;white-space:nowrap}'+
'.rn .rn-pop{position:absolute;left:50%;top:22%;transform:translateX(-50%);z-index:6;font:800 1.4em/1.1 var(--f-px,monospace);color:#ffcd3c;text-shadow:3px 3px 0 #0e1526;white-space:nowrap;pointer-events:none;opacity:0}'+
'.rn .rn-pop.on{animation:rnPop 1s steps(6) forwards}'+
'@keyframes rnPop{0%{opacity:0;transform:translate(-50%,10px)}20%{opacity:1;transform:translate(-50%,0)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-14px)}}'+
'.rn .rn-stage.shake{animation:rnShake .4s steps(4)}@keyframes rnShake{25%{transform:translate(-5px,2px)}50%{transform:translate(5px,-2px)}75%{transform:translate(-3px,0)}}'+
'.rn .rn-over{position:absolute;inset:0;z-index:8;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:14px;background:rgba(14,21,38,.72);color:#fff6e0;text-align:center}'+
'.rn .rn-over h4{margin:0;font:800 1.25em/1.25 var(--f-head,inherit);color:#ffcd3c;text-wrap:balance}'+
'.rn .rn-over p{margin:0;max-width:34em;font-size:.95em;line-height:1.45}'+
'.rn .rn-picks{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}'+
'.rn .rn-pk{width:clamp(96px,26%,150px);padding:0;border:4px solid #0e1526;background:#fff6e0;box-shadow:4px 4px 0 #0e1526;cursor:pointer;font:800 14px/1.2 inherit;color:#0e1526}'+
'.rn .rn-pk img{display:block;width:100%;aspect-ratio:300/359;object-fit:cover}'+
'.rn .rn-pk span{display:block;padding:6px 4px}'+
'.rn .rn-pk[aria-checked="true"]{background:#ffcd3c;outline:4px solid #ffcd3c;outline-offset:2px}'+
'.rn .rn-ctl{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center}'+
'.rn .rn-ctl .msg{min-width:0;margin:0}'+
'.rn .rn-say{flex:none}'+
'.rn .rn-lives{letter-spacing:2px}'+
'.rn-solo .rn-q{display:flex;gap:12px;align-items:center;border:3px solid #0e1526;background:#fff;padding:10px 12px;text-align:left}.rn-solo .rn-q .qt{flex:1;min-width:0}.rn-solo .rn-q .qi{font-size:13px;font-weight:700;color:#5b6475}.rn-solo .rn-q .qm{font-size:20px;font-weight:800;line-height:1.3}.rn-solo .rn-q .qm .py{display:block;font-size:13px;font-weight:600;color:#5b6475}'+
'.rn-solo .rn-say{width:44px;height:44px;display:grid;place-items:center;border:3px solid #0e1526;background:#ffcd3c;box-shadow:3px 3px 0 #0e1526;cursor:pointer}.rn-solo .rn-vis img{max-height:90px;border:3px solid #0e1526}'+
'.rn-solo .rn-msg{border:3px solid #0e1526;background:#fff6e0;padding:10px 12px;font-weight:700;text-align:left}.rn-solo .rn-msg.good{background:#dff3d0}.rn-solo .rn-msg.bad{background:#ffe1dc}.rn-solo .rn-sign .py,.rn-solo .rn-q .py{font-family:inherit}'+
'@media (max-width:520px){.rn .rn-hud{font-size:10px}.rn .rn-gate{width:32.5%}.rn .rn-ctl{grid-template-columns:1fr 1fr}.rn .rn-ctl .msg{grid-column:1/-1;grid-row:1}.rn .rn-ctl .btn{justify-content:center;min-height:48px}}';
var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

/* ---------- one game inside root; raw() returns the questions; env: img, say, ding, buzz, done, solo ---------- */
function mount(root, raw, env){
env=env||{}; var IMG=env.img||'../img/';
var CH={ leo:{n:'Leo', img:IMG+'run_leo.webp', pick:IMG+'run_pick_leo.webp'}, xiaobao:{n:'Xiaobao', img:IMG+'run_xiaobao.webp', pick:IMG+'run_pick_xiaobao.webp'} };
var P=root; root.classList.add('rn'); if(env.solo) root.classList.add('rn-solo');
P.innerHTML=''+
  '<div class="qcard rn-q"><button type="button" class="say rn-say" aria-label="Nghe lại câu hỏi"><svg viewBox="0 0 9 8" width="20" height="18" shape-rendering="crispEdges" aria-hidden="true"><path fill="#0e1526" d="M0 2h3v4H0z M3 1h1v6H3z M4 0h1v8H4z M6 2h1v1H6z M7 3h1v2H7z M6 5h1v1H6z"/></svg></button><div class="qt"><div class="qi"></div><div class="qm"></div></div><div class="rn-vis"></div></div>'+
  '<div class="rn-stage" tabindex="0" role="group" aria-label="Đường chạy 3 làn. Phím mũi tên trái phải để đổi làn, hoặc chạm vào cổng.">'+
    '<canvas class="rn-bg" width="320" height="240" aria-hidden="true"></canvas><div class="rn-gates"></div>'+
    '<img class="rn-mon" src="'+IMG+'run_monster.webp" alt=""><img class="rn-me" alt="">'+
    '<div class="rn-hud"><span class="rn-r">CÂU 1/8</span><span class="rn-lives" aria-label="Khoảng cách với quái vật"></span><span class="rn-coin">★ 0</span></div>'+
    '<div class="rn-pop" aria-hidden="true"></div><div class="rn-over"></div></div>'+
  '<div class="rn-ctl"><button type="button" class="btn rn-left" aria-label="Sang trái">◀ Trái</button><div class="msg rn-msg" aria-live="polite"></div><button type="button" class="btn rn-right" aria-label="Sang phải">Phải ▶</button></div>'+
'';
function $q(s){ return P.querySelector(s); }
var stage=$q('.rn-stage'), cv=$q('.rn-bg'), cx=cv.getContext('2d'), gatesEl=$q('.rn-gates'), me=$q('.rn-me'), mon=$q('.rn-mon'), over=$q('.rn-over'), pop=$q('.rn-pop'), msg=$q('.rn-msg');
var canopy=new Image(); canopy.src=IMG+'run_canopy.webp';

/* ---------- geometry (fractions of the stage) ---------- */
var HY=.36, FEET=.95;
function laneX(l,p){ return .5+(l-1)*(.25+.1*p); }

var G={started:false, phase:'idle', raf:0, t0:0, scroll:0, lane:1, x:.5, close:1, coins:0, first:0, miss:0, caught:0, i:0, N:0, Q:[], cur:null, z:0, rush:false, tries:0, inter:0, flip:0, decor:[]};
function who(){ var c=sget('lc_runner'); return CH[c]?c:'leo'; }

function lives(){ var n=3-G.close; $q('.rn-lives').textContent='QUÁI VẬT '+'■'.repeat(Math.max(0,G.close))+'□'.repeat(Math.max(0,n));
  $q('.rn-lives').setAttribute('aria-label','Quái vật ở gần: '+G.close+' trên 3'); }
function hud(){ $q('.rn-r').textContent='CÂU '+Math.min(G.i+1,G.N)+'/'+G.N; $q('.rn-coin').textContent='★ '+G.coins; lives(); }
function say1(a){ if(a&&env.say) sfx(function(){ env.say(a[0],a[1]); }); }
function popTxt(t){ pop.textContent=t; pop.classList.remove('on'); void pop.offsetWidth; pop.classList.add('on'); }
function shake(){ if(calm()) return; stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake'); }
function setMsg(cls,html){ msg.className='msg rn-msg'+(cls?' '+cls:''); msg.innerHTML=html; }

/* ---------- screens ---------- */
function pickScreen(){ G.phase='pick'; var c=who(); gatesEl.innerHTML='';
  over.hidden=false; over.innerHTML='<h4>Chạy trốn quái vật lá cây!</h4><p>Nghe hoặc đọc đề, rồi chạy vào cổng có đáp án đúng. Đổi làn bằng nút ◀ ▶, phím mũi tên, vuốt, hoặc chạm thẳng vào cổng. Đúng thì quái vật tụt lại phía sau!</p>'+
    '<div class="rn-picks" role="radiogroup" aria-label="Chọn bạn chạy cùng">'+Object.keys(CH).map(function(k){ return '<button type="button" class="rn-pk" role="radio" data-k="'+k+'" aria-checked="'+(k===c)+'"><img src="'+CH[k].pick+'" alt=""><span>'+CH[k].n+'</span></button>'; }).join('')+'</div>'+
    '<button type="button" class="btn go rn-go">Bắt đầu chạy ▶</button>';
  over.querySelectorAll('.rn-pk').forEach(function(b){ b.onclick=function(){ sset('lc_runner',b.dataset.k); over.querySelectorAll('.rn-pk').forEach(function(x){ x.setAttribute('aria-checked',String(x===b)); }); me.src=CH[b.dataset.k].img; }; });
  over.querySelector('.rn-go').onclick=begin;
  me.src=CH[c].img; $q('.qi').textContent='Chọn bạn chạy cùng con nhé!'; $q('.qm').textContent=''; $q('.rn-vis').innerHTML=''; setMsg('','Chọn Leo hoặc Xiaobao, rồi bấm “Bắt đầu chạy”.'); hud(); }
function start(){ G.started=true; P.querySelectorAll('.result').forEach(function(r){ r.remove(); });
  G.Q=(raw()||[]).map(norm).filter(function(q){ return q.opts.length>1; }); G.N=G.Q.length; G.i=0; G.coins=0; G.first=0; G.miss=0; G.caught=0; G.close=1; G.lane=1; G.x=.5;
  pickScreen(); loop(); }
function begin(){ over.hidden=true; over.innerHTML=''; me.src=CH[who()].img; stage.focus({preventScroll:true}); show(); }
function show(){ var q=G.Q[G.i]; G.cur=q; G.tries=0; hud();
  $q('.qi').innerHTML=q.qi; $q('.qm').innerHTML=q.qm; $q('.rn-vis').innerHTML=q.vis;
  setMsg('','Chạy vào cổng có đáp án đúng!'); approach(q.opts.map(function(o){ return o; })); setTimeout(function(){ if(G.cur===q) say1(q.say); },250); }
function approach(lanes){ G.lanes=lanes; while(G.lanes.length<3) G.lanes.push(null); G.z=0; G.rush=false; G.phase='run';
  gatesEl.innerHTML=G.lanes.map(function(o,i){ return o?'<button type="button" class="rn-gate" data-l="'+i+'" aria-label="Làn '+(i+1)+': '+String(o.t||'').replace(/"/g,'&quot;')+'"><span class="rn-sign">'+o.h+'</span><span class="rn-posts"><i></i><i></i></span></button>':'<div class="rn-rock" data-l="'+i+'" aria-hidden="true"></div>'; }).join('');
  gatesEl.querySelectorAll('.rn-gate').forEach(function(b){ b.onclick=function(e){ e.stopPropagation(); if(G.phase!=='run') return; G.lane=+b.dataset.l; G.rush=true; }; }); }
function judge(){ var o=G.lanes[G.lane], q=G.cur, g=gatesEl.querySelector('[data-l="'+G.lane+'"]');
  if(o&&o.ok){ G.phase='inter'; G.inter=0; G.coins++; if(!G.tries) G.first++; G.close=Math.max(0,G.close-1); if(g) g.classList.add('ok');
    sfx(function(){ env.ding&&env.ding(); }); popTxt(G.tries?'QUA RỒI!':'TUYỆT VỜI!'); setMsg('good','Đúng rồi! '+q.right); setTimeout(function(){ say1(q.after); },300); hud(); return; }
  G.tries++; G.miss++; G.close++; if(g) g.classList.add('bad'); sfx(function(){ env.buzz&&env.buzz(); }); shake();
  setMsg('bad',(o?(o.why||'Chưa đúng rồi.'):'Ối, tảng đá chắn đường!')+' Quái vật đuổi gần hơn, chạy lại nào!'); popTxt(o?'SAI CỔNG!':'VẤP ĐÁ!');
  if(o) G.lanes[G.lane]=null; hud();
  if(G.close>=3){ G.phase='caught'; G.caught++; setTimeout(caught,600); return; }
  G.phase='wait'; setTimeout(function(){ if(G.phase==='wait'&&G.cur===q) approach(G.lanes); },1100); }
function caught(){ over.hidden=false; over.innerHTML='<h4>Ôi! Quái vật tóm được '+CH[who()].n+' rồi!</h4><p>Không sao cả, con nghe lại đề rồi chạy tiếp nhé. Quái vật sẽ lùi lại một chút.</p><button type="button" class="btn go rn-go">Chạy tiếp ▶</button>';
  over.querySelector('.rn-go').onclick=function(){ over.hidden=true; G.close=1; hud(); stage.focus({preventScroll:true}); approach(G.lanes); say1(G.cur.say); }; }
function next(){ G.i++; if(G.i>=G.N){ finish(); return; } show(); }
function finish(){ G.phase='done'; gatesEl.innerHTML=''; hud();
  var t=G.first+'/'+G.N+' cổng đúng ngay lần đầu!';
  var txt='Con đã chạy thoát quái vật lá cây cùng '+CH[who()].n+'! Con nhặt được '+G.coins+' ngôi sao'+(G.caught?', bị tóm '+G.caught+' lần nhưng vẫn chạy tiếp':'')+'.';
  var handled=false; if(env.done) try{ handled=env.done({title:t,text:txt,miss:G.miss,stage:stage,again:start}); }catch(e){}
  if(!handled){ over.hidden=false; over.innerHTML='<h4>'+t+'</h4><p>'+txt+'</p><button type="button" class="btn go rn-go">↺ Chơi lại</button>'; over.querySelector('.rn-go').onclick=start; } }

/* ---------- controls ---------- */
function move(d){ if(G.phase!=='run'&&G.phase!=='wait') return; G.lane=Math.max(0,Math.min(2,G.lane+d)); }
$q('.rn-left').onclick=function(){ move(-1); }; $q('.rn-right').onclick=function(){ move(1); };
$q('.rn-say').onclick=function(){ if(G.cur) say1(G.cur.say); };
stage.addEventListener('keydown',function(e){ if(e.key==='ArrowLeft'){ move(-1); e.preventDefault(); } else if(e.key==='ArrowRight'){ move(1); e.preventDefault(); } else if((e.key==='ArrowUp'||e.key===' ')&&G.phase==='run'){ G.rush=true; e.preventDefault(); } });
var sx=null, sy=null;
stage.addEventListener('pointerdown',function(e){ sx=e.clientX; sy=e.clientY; });
stage.addEventListener('pointerup',function(e){ if(sx===null) return; var dx=e.clientX-sx, dy=e.clientY-sy; sx=null;
  if(e.target.closest('.rn-gate,.rn-over,button')) return;
  if(Math.abs(dx)>32&&Math.abs(dx)>Math.abs(dy)){ move(dx>0?1:-1); return; }
  if(Math.abs(dx)<10&&Math.abs(dy)<10&&(G.phase==='run'||G.phase==='wait')){ var r=stage.getBoundingClientRect(), f=(e.clientX-r.left)/r.width; G.lane=f<.36?0:f>.64?2:1; } });

/* ---------- drawing ---------- */
var DEC=[]; for(var i=0;i<10;i++) DEC.push({z:i/10, side:i%2?1:-1, k:i%3, off:.05+((i*37)%10)/40});
function R(x,y,w,h,c){ cx.fillStyle=c; cx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h))); }
function drawBg(){ var W=320,H=240,hy=Math.round(HY*H);
  R(0,0,W,hy+2,'#9fd3a0'); for(var y=0;y<hy;y+=6) R(0,y,W,6,y<hy*.5?'#7fbf7a':'#5aa83c');
  if(canopy.complete&&canopy.naturalWidth) cx.drawImage(canopy,0,0,W,Math.round(W*canopy.naturalHeight/canopy.naturalWidth));
  for(var yy=hy;yy<H;yy++){ var t=(yy-hy)/(H-hy), hw=(.04+.6*t)*W, band=Math.floor(7/(t+.08)+G.scroll)%2;
    R(0,yy,W,1,band?'#4e9a35':'#5aa83c');
    R(W/2-hw-2,yy,hw*2+4,1,'#7a5530'); R(W/2-hw,yy,hw*2,1,band?'#c9955c':'#b98450');
    if(band) [-1,1].forEach(function(s){ R(W/2+s*hw/3-Math.max(1,t*2),yy,Math.max(1,t*4),1,'#e0c08a'); }); }
  DEC.forEach(function(d){ var t=d.z*d.z, y=hy+t*(H-hy), hw=(.04+.6*t)*W, s=.15+t*1.4, x=W/2+d.side*(hw+W*d.off*t+6*s);
    if(d.k===0){ R(x-6*s,y-14*s,12*s,8*s,'#2f6f2c'); R(x-8*s,y-9*s,16*s,9*s,'#3f8f3a'); R(x-4*s,y-12*s,5*s,3*s,'#6cc04a'); }
    else if(d.k===1){ R(x-2*s,y-16*s,4*s,16*s,'#6b4226'); R(x-9*s,y-30*s,18*s,16*s,'#2f6f2c'); R(x-6*s,y-28*s,7*s,5*s,'#5aa83c'); }
    else { R(x-1*s,y-4*s,2*s,4*s,'#fff6e0'); R(x-4*s,y-8*s,8*s,4*s,'#c8322b'); R(x-2*s,y-7*s,1.5*s,1.5*s,'#fff6e0'); } }); }
function layout(dt){ var Wp=stage.clientWidth, Hp=stage.clientHeight; if(!Wp) return;
  stage.style.fontSize=Math.max(12,Wp*.027)+'px'; var nar=Wp<520;
  var tx=.5+(G.lane-1)*.35; G.x+=(tx-G.x)*Math.min(1,dt/110);
  var bob=calm()?0:Math.abs(Math.sin(G.flip*Math.PI))*Hp*.012, fl=calm()||G.phase==='pick'?1:(Math.floor(G.flip*2)%2?-1:1);
  me.style.transform='translate('+(G.x*Wp-me.clientWidth/2)+'px,'+(FEET*Hp-me.clientHeight-bob)+'px) scaleX('+fl+')';
  var c=Math.min(3,G.close), mh=Hp*(.44+.07*c), mb=Hp*(1.28-.1*c); mon.style.height=mh+'px';
  var mx=(.5+(G.x-.5)*.6)*Wp, mfl=calm()?1:(Math.floor(G.flip*1.6)%2?-1:1);
  mon.style.transform='translate('+(mx-mon.clientWidth/2)+'px,'+(mb-mh)+'px) scaleX('+mfl+')';
  var p=Math.pow(Math.min(G.z,1.15),1.5);
  gatesEl.querySelectorAll('[data-l]').forEach(function(g){ var l=+g.dataset.l, s=nar?.84+.2*p:.72+.36*p, y=(.47+.19*p)*Hp, x=laneX(l,p)*Wp;
    g.style.transform='translate('+(x-g.offsetWidth/2)+'px,'+(y-g.offsetHeight)+'px) scale('+s+')'; g.style.opacity=G.z>1?String(Math.max(0,1-(G.z-1)*6)):'1';
    g.classList.toggle('lane-me',l===G.lane&&G.phase==='run'); }); }
function loop(){ cancelAnimationFrame(G.raf); var last=performance.now();
  function tick(now){ var dt=Math.min(60,now-last); last=now;
    if(!root.isConnected){ G.phase='gone'; return; }
    if(P.hidden||root.closest('[hidden]')||document.hidden||!stage.clientWidth){ G.raf=requestAnimationFrame(tick); return; }
    var running=G.phase==='run'||G.phase==='inter'||G.phase==='wait'||G.phase==='pick';
    if(running&&!calm()){ G.scroll+=dt/(G.phase==='pick'?520:260); G.flip+=dt/300; DEC.forEach(function(d){ d.z+=dt/2600; if(d.z>1){ d.z-=1; d.side=-d.side; } }); }
    if(G.phase==='run'){ var T=G.tries?7000:9500; G.z+=dt/(G.rush?380:T); if(G.z>=1){ G.z=1; G.phase='judge'; judge(); } }
    else if(G.phase==='inter'){ G.z+=dt/260; G.inter+=dt; if(G.inter>1500){ G.phase='between'; gatesEl.innerHTML=''; next(); } }
    drawBg(); layout(dt); G.raf=requestAnimationFrame(tick); }
  G.raf=requestAnimationFrame(tick); }

start();
return {G:G, restart:start, stop:function(){ cancelAnimationFrame(G.raf); G.phase='gone'; }};
}
/* ---------- questions from any of the older games ---------- */
function plain(t){ return String(t||'').replace(/^(Leo|Xiaobao) câu · /,'')
  .replace(/câu cá/g,'chạy qua cổng').replace(/đập (bạn )?(chuột chũi )?cầm /g,'chạy qua cổng có ')
  .replace(/ để (Buffy|Bunny|Leo|Xiaobao) sút/g,'').replace(/[Cc]họn câu/g,function(m){ return m[0]==='C'?'Chọn cổng có câu':'chọn cổng có câu'; }); }
function norm(q){ var opts=(q.opts||[]).slice(0,3).map(function(o){ return {h:o.h, ok:!!o.ok, why:o.why||'', t:o.t||o.aria||''}; });
  var ok=opts.filter(function(o){ return o.ok; })[0];
  var after=q.after&&q.after.say?q.after.say:(Array.isArray(q.after)?q.after:(q.say2||null));
  var right=q.after&&q.after.html?q.after.html:(q.right||(ok?ok.h:''));
  return {qi:plain(q.qi), qm:q.qm||'', vis:q.vis||'', say:q.say||null, opts:opts, after:after, right:right}; }

window.RUNKit={mount:mount, norm:norm, G:null};

/* ---------- Lingo Cub station pages ---------- */
if(typeof UNITS==='undefined' || typeof paintLesson!=='function') return;
try{ if(typeof GAMEACTS!=='undefined' && GAMEACTS.indexOf('run')<0) GAMEACTS.push('run'); }catch(e){}
var anchor=document.getElementById('ap-g1')||document.getElementById('ap-wm')||document.getElementById('ap-g2'); if(!anchor) return;
var PN=document.createElement('div'); PN.className='box panel'; PN.id='ap-run'; PN.hidden=true; PN.innerHTML='<div class="panel-h"></div><div class="rn-host"></div>';
anchor.parentNode.insertBefore(PN,anchor.nextSibling);
var host=PN.querySelector('.rn-host'), ctl=null;
function entry(){ return (L.vocab||[]).concat(L.hanzi||[]).filter(function(a){ return a.act==='run'; })[0]; }
function head(){ var a=entry(); if(a) PN.querySelector('.panel-h').innerHTML='<h3>'+a.h+(a.tag?' <span class="tag">'+a.tag+'</span>':'')+'</h3><span class="how">'+a.how+'</span>'; }
function begin(){ if(typeof L.run!=='function') return; if(ctl) ctl.stop(); head(); host.innerHTML='';
  ctl=mount(host,function(){ return L.run(); },{ img:'../img/',
    say:function(t,l){ try{ say(t,l); }catch(e){} }, ding:function(){ try{ ding(); }catch(e){} }, buzz:function(){ try{ buzz(); }catch(e){} },
    done:function(r){ try{ markDone('run'); }catch(e){} try{ resultCard(r.stage,r.title,r.miss,r.text,function(){ begin(); }); return true; }catch(e){ return false; } } });
  window.RUNKit.G=ctl.G; }
document.addEventListener('click',function(e){ var b=e.target.closest&&e.target.closest('.act[data-act="run"]'); if(b&&(!ctl||ctl.G.phase==='gone')) setTimeout(begin,0); });
var _pl=paintLesson; paintLesson=function(){ if(ctl){ ctl.stop(); ctl=null; } host.innerHTML=''; var r=_pl.apply(this,arguments); head(); return r; };
head();
})();
