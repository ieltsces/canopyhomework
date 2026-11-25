/* Lingo Cub · animal filters for the camera in dubbing and karaoke (lessons 1 and 2).
   - Lessons that record with the plain camera (REC): the live view becomes a canvas with the
     chosen animal mask, and the saved video is that canvas plus the child's voice.
   - Lessons that already use the story camera (CAM8 "mirror" mode for songs): the chosen mask
     is drawn on the mirror too.  Story "pip" mode keeps its own masks per page.
   Face tracking reuses the MediaPipe files in u8/mp; without them the mask sits mid-frame. */
(function(){
'use strict';
if(typeof UNITS==='undefined' || typeof paintLesson!=='function' || typeof REC==='undefined') return;
function $(id){ return document.getElementById(id); }
function sget(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function sset(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
var MP=new URL('../u8/mp/',location.href).href;

var LIST=[['none','Không','—'],['lion','Sư tử','狮子'],['panda','Gấu trúc','熊猫'],['rabbit','Thỏ','兔子'],['cat','Mèo','猫'],['dog','Chó','狗'],['tiger','Hổ','老虎'],['monkey','Khỉ','猴子'],['mouse','Chuột','老鼠'],['frog','Ếch','青蛙'],['elephant','Voi','大象']];

/* ---------- pixel animal masks (unit = face width; 0,0 = between the ears, eye level) ---------- */
var M={
  off:null,
  draw:function(ctx,a,F,W,H,S){ S=S||5; var w=Math.ceil(W/S), h=Math.ceil(H/S);
    if(!this.off) this.off=document.createElement('canvas'); var o=this.off; if(o.width!==w||o.height!==h){ o.width=w; o.height=h; }
    var g=o.getContext('2d'); g.clearRect(0,0,w,h); g.save(); g.translate(F.cx/S,F.cy/S); g.rotate(F.ang||0); var u=F.fw/S; g.scale(u,u); g.lineJoin='round'; g.lineCap='round';
    var fn=this[a]; if(fn) fn.call(this,g); g.restore();
    ctx.save(); ctx.imageSmoothingEnabled=false; ctx.drawImage(o,0,0,w,h,0,0,w*S,h*S); ctx.restore(); },
  panda:function(g){ var s; for(s=-1;s<=1;s+=2){ this.ell(g,s*.42,-.6,.17,.17,'#1d1d24'); this.ell(g,s*.2,-.02,.15,.11,'rgba(29,29,36,.55)',s*-.5,.02); }
    this.ell(g,0,.13,.08,.055,'#1d1d24',0,.02); },
  rabbit:function(g){ var s; for(s=-1;s<=1;s+=2){ this.ell(g,s*.2,-.98,.12,.36,'#ffffff',s*.18); this.ell(g,s*.2,-.96,.055,.26,'#f7a8c0',s*.18,.02); }
    this.ell(g,0,.12,.06,.045,'#f27a98',0,.02); this.whisk(g,'#5b6475'); g.fillStyle='#ffffff'; g.fillRect(-.06,.42,.055,.09); g.fillRect(.005,.42,.055,.09); g.lineWidth=.02; g.strokeStyle='#0e1526'; g.strokeRect(-.06,.42,.055,.09); g.strokeRect(.005,.42,.055,.09); },

  sh(g,fill,lw=.05,stroke='#0e1526'){ g.fillStyle=fill; g.fill(); g.lineWidth=lw; g.strokeStyle=stroke; g.stroke(); },
  tri(g,x1,y1,x2,y2,x3,y3,f,lw){ g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.lineTo(x3,y3); g.closePath(); this.sh(g,f,lw); },
  ell(g,x,y,rx,ry,f,rot=0,lw){ g.beginPath(); g.ellipse(x,y,rx,ry,rot,0,Math.PI*2); this.sh(g,f,lw); },
  whisk(g,c='#0e1526'){ g.strokeStyle=c; g.lineWidth=.03; [[-1,-.06],[-1,.04],[-1,.14],[1,-.06],[1,.04],[1,.14]].forEach(([s,d])=>{ g.beginPath(); g.moveTo(s*.14,.16+d*.3); g.lineTo(s*.56,.12+d); g.stroke(); }); },
  cat(g){ [-1,1].forEach(s=>{ this.tri(g,s*.12,-.55,s*.46,-.5,s*.36,-1.02,'#f2a65a'); this.tri(g,s*.2,-.58,s*.4,-.55,s*.35,-.86,'#f7a8c0',.02); });
    this.tri(g,-.07,.08,.07,.08,0,.17,'#f27a98',.03); this.whisk(g); },
  tiger(g){ [-1,1].forEach(s=>{ this.ell(g,s*.36,-.62,.14,.14,'#ff9f3a'); this.ell(g,s*.36,-.62,.07,.07,'#fff6e0',0,.02); });
    g.fillStyle='#0e1526'; [[-.1,-.62,.05,.16],[.05,-.6,.05,.13],[-.24,-.5,.05,.12],[.19,-.5,.05,.12]].forEach(r=>g.fillRect(...r)); this.tri(g,-.07,.08,.07,.08,0,.17,'#c8322b',.03); this.whisk(g); },
  dog(g){ [-1,1].forEach(s=>this.ell(g,s*.56,-.12,.17,.38,'#8a5a34',s*.25)); this.ell(g,0,.12,.1,.07,'#0e1526'); g.beginPath(); g.ellipse(0,.5,.09,.13,0,0,Math.PI); this.sh(g,'#f27a98',.03); },
  horse(g){ [-1,1].forEach(s=>this.tri(g,s*.12,-.6,s*.32,-.55,s*.26,-1.0,'#8a5a34')); for(let i=0;i<5;i++) this.tri(g,-.25+i*.12,-.6,-.13+i*.12,-.6,-.19+i*.12,-.85,'#3b2414',.02);
    this.ell(g,-.06,.16,.035,.05,'#0e1526'); this.ell(g,.06,.16,.035,.05,'#0e1526'); },
  fish(g){ [-1,1].forEach(s=>this.tri(g,s*.48,.0,s*.48,.3,s*.85,.15,'#2e95c2')); this.tri(g,-.15,-.62,.15,-.62,0,-.95,'#2e95c2');
    [[.5,-.6,.07],[.62,-.82,.05],[.48,-.95,.035]].forEach(([x,y,r])=>this.ell(g,x,y,r,r,'rgba(143,211,255,.6)',0,.02)); },
  frog(g){ [-1,1].forEach(s=>{ this.ell(g,s*.24,-.66,.19,.19,'#6cc04a'); this.ell(g,s*.24,-.68,.12,.12,'#ffffff',0,.02); this.ell(g,s*.24,-.66,.06,.07,'#0e1526',0,.01); });
    [-1,1].forEach(s=>this.ell(g,s*.36,.3,.08,.05,'rgba(242,122,152,.7)',0,.0001)); },
  snake(g){ g.strokeStyle='#c8322b'; g.lineWidth=.05; g.beginPath(); g.moveTo(0,.45); g.lineTo(0,.72); g.lineTo(-.07,.84); g.moveTo(0,.72); g.lineTo(.07,.84); g.stroke();
    for(let i=0;i<6;i++) this.ell(g,-.4+i*.16,-.62+Math.abs(i-2.5)*.03,.09,.07,i%2?'#6cc04a':'#3f8f3a',0,.02); },
  elephant(g){ [-1,1].forEach(s=>{ this.ell(g,s*.68,-.05,.3,.42,'#9aa3b5',s*-.15); this.ell(g,s*.68,-.05,.18,.28,'#f2a6b8',s*-.15,.02); });
    g.beginPath(); g.moveTo(-.1,.05); g.quadraticCurveTo(-.12,.55,.0,.85); g.quadraticCurveTo(.1,1.0,.25,.9); g.lineTo(.2,.82); g.quadraticCurveTo(.1,.88,.08,.75); g.quadraticCurveTo(.1,.45,.1,.05); g.closePath(); this.sh(g,'#9aa3b5');
    [-1,1].forEach(s=>this.tri(g,s*.12,.32,s*.2,.34,s*.24,.62,'#ffffff',.02)); },
  mouse(g){ [-1,1].forEach(s=>{ this.ell(g,s*.42,-.58,.24,.24,'#b9c3cf'); this.ell(g,s*.42,-.58,.14,.14,'#f7a8c0',0,.02); }); this.ell(g,0,.12,.06,.05,'#f27a98',0,.02); this.whisk(g); },
  lion(g){ for(let i=0;i<16;i++){ const a=i/16*Math.PI*2, r=.72; this.ell(g,Math.cos(a)*r,Math.sin(a)*r*1.12-.02,.17,.17,i%2?'#e0a800':'#c97a1c',0,.02); }
    [-1,1].forEach(s=>this.ell(g,s*.34,-.62,.1,.1,'#e0a800')); this.tri(g,-.07,.08,.07,.08,0,.17,'#3b2414',.03); },
  giraffe(g){ [-1,1].forEach(s=>{ g.strokeStyle='#0e1526'; g.lineWidth=.1; g.beginPath(); g.moveTo(s*.16,-.6); g.lineTo(s*.2,-.92); g.stroke(); g.strokeStyle='#e0a800'; g.lineWidth=.06; g.stroke();
      this.ell(g,s*.2,-.96,.07,.07,'#8a5a34',0,.03); this.ell(g,s*.46,-.5,.16,.07,'#e0a800',s*.4); });
    [[-.22,-.42,.06],[.18,-.45,.05],[0,-.52,.045]].forEach(([x,y,r])=>this.ell(g,x,y,r,r*.8,'#c97a1c',0,.015)); },
  bird(g){ this.tri(g,-.1,.02,.1,.02,0,.3,'#ffcd3c'); g.beginPath(); g.moveTo(-.1,.02); g.lineTo(.1,.02); g.stroke();
    [[-.14,-.62,-.24,-.98],[0,-.64,0,-1.04],[.14,-.62,.24,-.98]].forEach(([x1,y1,x2,y2])=>{ g.beginPath(); g.moveTo(x1-.05,y1); g.lineTo(x2,y2); g.lineTo(x1+.05,y1); g.closePath(); this.sh(g,'#e8453c',.03); }); },
  monkey(g){ [-1,1].forEach(s=>{ this.ell(g,s*.56,-.08,.16,.16,'#8a5a34'); this.ell(g,s*.56,-.08,.09,.09,'#f2d2a9',0,.02); }); }
};

/* ---------- face tracking (shared MediaPipe files, optional) ---------- */
var FT={fl:null, tried:false, smooth:null, last:0,
  load:function(){ if(this.tried) return; this.tried=true; var self=this;
    (async function(){ try{ var mod=await import(MP+'vision_bundle.mjs');
      var fs=await mod.FilesetResolver.forVisionTasks(MP+'wasm');
      var j=await (await fetch(MP+'face_model.json')).json(); var bin=Uint8Array.from(atob(j.b64),function(c){ return c.charCodeAt(0); });
      var mk=function(d){ return mod.FaceLandmarker.createFromOptions(fs,{baseOptions:{modelAssetBuffer:bin,delegate:d},runningMode:'VIDEO',numFaces:1}); };
      try{ self.fl=await mk('GPU'); }catch(e){ self.fl=await mk('CPU'); }
      tip('Đã bật dò khuôn mặt: mặt nạ sẽ đi theo mặt con.');
    }catch(e){ self.fl=null; tip('Mặt nạ đặt giữa khung: con ngồi giữa camera nhé.'); } })(); },
  face:function(v,W,H){ var F=null;
    if(this.fl&&v.readyState>=2){ try{ var r=this.fl.detectForVideo(v,performance.now()), lm=r&&r.faceLandmarks&&r.faceLandmarks[0];
      if(lm){ var P=function(i){ return {x:(1-lm[i].x)*W, y:lm[i].y*H}; }, l=P(234), r2=P(454), top=P(10), chin=P(152);
        F={cx:(l.x+r2.x)/2, cy:(l.y+r2.y)/2, fw:Math.hypot(r2.x-l.x,r2.y-l.y), ang:Math.atan2(r2.y-l.y,r2.x-l.x), fh:Math.hypot(chin.x-top.x,chin.y-top.y)}; this.last=performance.now(); } }catch(e){} }
    if(!F){ if(this.smooth&&performance.now()-this.last<700) return this.smooth; F={cx:W*.5,cy:H*.5,fw:Math.min(W,H)*.46,ang:0,guess:true}; }
    if(this.smooth&&!F.guess&&!this.smooth.guess){ var a=.55, s=this.smooth; ['cx','cy','fw'].forEach(function(k){ F[k]=s[k]*a+F[k]*(1-a); }); F.ang=s.ang*a+F.ang*(1-a); }
    this.smooth=F; return F; } };

/* ---------- state + picker ---------- */
var FX={sel:(function(){ var v=sget('lc_camfx'); return LIST.some(function(x){ return x[0]===v; })?v:'lion'; })(), on:false, raf:0, cv:null, vid:null};
function active(){ return typeof LN!=='undefined' && LN<=2; }
function camMode(){ try{ return typeof CAM8!=='undefined'?CAM8.mode():null; }catch(e){ return null; } }
function tip(t){ var e=$('cfxTip'); if(e) e.textContent=t; }
var css='.cfx{display:flex;flex-direction:column;gap:6px;margin:8px 0 10px}.cfx-h{font-weight:800;font-size:14px}'+
  '.cfx-row{display:flex;gap:6px;flex-wrap:wrap}.cfx-b{display:flex;flex-direction:column;align-items:center;gap:2px;width:68px;padding:4px 2px 5px;border:3px solid var(--ink,#0e1526);background:var(--paper,#fff6e0);box-shadow:3px 3px 0 var(--ink,#0e1526);font:700 11px/1.15 inherit;color:var(--ink,#0e1526);cursor:pointer}'+
  '.cfx-b canvas{width:48px;height:48px;image-rendering:pixelated}.cfx-b small{font-size:10px;font-weight:600;opacity:.75}'+
  '.cfx-b[aria-checked="true"]{background:#ffcd3c;transform:translate(1px,1px);box-shadow:2px 2px 0 var(--ink,#0e1526)}.cfx-b:focus-visible{outline:3px solid #2e95c2;outline-offset:2px}'+
  '.cfx-tip{font-size:12px;opacity:.8}#cfxCv{width:min(100%,320px);aspect-ratio:4/3;background:var(--ink,#0e1526);border:3px solid var(--ink,#0e1526)}.recview.on #cfxCv{outline:4px solid var(--red,#c8322b);outline-offset:-4px}'+
  '@media (max-width:520px){.cfx-b{width:calc(20% - 5px);min-width:56px}}';
var stl=document.createElement('style'); stl.textContent=css; document.head.appendChild(stl);
var pick=document.createElement('div'); pick.className='cfx'; pick.id='cfxPick'; pick.hidden=true;
pick.innerHTML='<div class="cfx-h">Filter con vật cho camera</div><div class="cfx-row" role="radiogroup" aria-label="Chọn filter con vật"></div><div class="cfx-tip" id="cfxTip">Chọn một con vật, rồi bật camera. Đổi con vật lúc đang quay cũng được.</div>';
var row=pick.querySelector('.cfx-row');
LIST.forEach(function(x){ var b=document.createElement('button'); b.type='button'; b.className='cfx-b'; b.setAttribute('role','radio'); b.dataset.k=x[0];
  b.setAttribute('aria-checked',String(x[0]===FX.sel)); b.setAttribute('aria-label',x[1]);
  var c=document.createElement('canvas'); c.width=96; c.height=96; thumb(c,x[0]); b.appendChild(c);
  b.insertAdjacentHTML('beforeend','<span>'+x[1]+'</span>'+(x[2]!=='—'?'<small>'+x[2]+'</small>':''));
  b.onclick=function(){ FX.sel=x[0]; sset('lc_camfx',x[0]); row.querySelectorAll('.cfx-b').forEach(function(y){ y.setAttribute('aria-checked',String(y===b)); }); if(x[0]!=='none') FT.load(); };
  row.appendChild(b); });
function thumb(c,a){ var g=c.getContext('2d'); g.fillStyle='#9fd3f0'; g.fillRect(0,0,96,96);
  g.fillStyle='#f2c29b'; g.beginPath(); g.ellipse(48,56,26,31,0,0,Math.PI*2); g.fill(); g.lineWidth=3; g.strokeStyle='#0e1526'; g.stroke();
  g.fillStyle='#0e1526'; g.fillRect(37,50,5,6); g.fillRect(54,50,5,6); g.fillStyle='#c8433a'; g.fillRect(43,70,10,4);
  if(a==='none'){ g.strokeStyle='#c8322b'; g.lineWidth=6; g.beginPath(); g.moveTo(14,14); g.lineTo(82,82); g.stroke(); return; }
  M.draw(g,a,{cx:48,cy:52,fw:50,ang:0},96,96,2); }
function place(){ pick.hidden=true; if(!active()) return;
  var m=camMode();
  if(m==='mirror' && $('cam8Bar') && !$('cam8Bar').hidden){ var r=$('cam8Bar').querySelector('.row'); r.parentNode.insertBefore(pick,r.nextSibling); pick.hidden=false; return; }
  if(m==='pip') return;
  var rec=$('rec'); if(rec && !rec.hidden){ var h=rec.querySelector('h4'); rec.insertBefore(pick,h?h.nextSibling:rec.firstChild); pick.hidden=false; } }

/* ---------- plain-camera lessons: masked canvas, recorded with the child's voice ---------- */
function useOwn(){ return active() && !(typeof L!=='undefined' && L.dub && L.dub.cam); }
function drawLoop(){ cancelAnimationFrame(FX.raf); var c=FX.cv, x=c.getContext('2d'), v=FX.vid;
  (function go(){ if(!FX.on) return;
    if(v.readyState>=2){ var W=c.width, H=c.height, vw=v.videoWidth, vh=v.videoHeight, s=Math.max(W/vw,H/vh), dw=vw*s, dh=vh*s;
      x.save(); x.translate(W,0); x.scale(-1,1); x.drawImage(v,(W-dw)/2,(H-dh)/2,dw,dh); x.restore();
      if(FX.sel!=='none'){ var F=FT.face(v,W,H); M.draw(x,FX.sel,F,W,H,5); } }
    FX.raf=requestAnimationFrame(go); })(); }
function liveOn(st){ if(!FX.cv){ FX.cv=document.createElement('canvas'); FX.cv.id='cfxCv'; FX.cv.width=640; FX.cv.height=480; FX.cv.setAttribute('aria-label','Camera của con, có filter con vật'); }
  if(!FX.vid){ FX.vid=document.createElement('video'); FX.vid.muted=true; FX.vid.playsInline=true; FX.vid.setAttribute('playsinline',''); }
  var view=$('recView'); view.insertBefore(FX.cv,view.firstChild); FX.cv.hidden=false; $('recLive').hidden=true; view.hidden=false;
  FX.vid.srcObject=st; var p=FX.vid.play(); if(p&&p.catch) p.catch(function(){});
  FX.on=true; if(FX.sel!=='none') FT.load(); drawLoop(); }
function liveOff(){ FX.on=false; cancelAnimationFrame(FX.raf); if(FX.vid) FX.vid.srcObject=null; if(FX.cv) FX.cv.hidden=true; }
function pause(ms){ return new Promise(function(r){ setTimeout(r,ms); }); }

var _start=REC.start.bind(REC), _release=REC.release.bind(REC), _setup=REC.setup.bind(REC);
REC.start=async function(){ if(!useOwn()) return _start();
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream) return _start();
  $('recCam').disabled=true; var st;
  try{ st=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:true}); }catch(e){ return this.noCam(); }
  this.clear(); this.stream=st; liveOn(st);
  var vs=FX.cv.captureStream(25); this.canvasTracks=vs.getVideoTracks();
  var rs=new MediaStream(vs.getVideoTracks().concat(st.getAudioTracks()));
  var types=['video/mp4;codecs=avc1,mp4a.40.2','video/mp4','video/webm;codecs=vp8,opus','video/webm']; var mt=types.filter(function(t){ try{ return MediaRecorder.isTypeSupported(t); }catch(e){ return false; } })[0]||'';
  try{ this.mr=new MediaRecorder(rs,mt?{mimeType:mt}:undefined); }catch(e){ return this.noCam(); }
  var self=this; this.chunks=[]; this.ext=/mp4/.test(this.mr.mimeType||mt)?'mp4':'webm';
  this.mr.ondataavailable=function(e){ if(e.data&&e.data.size) self.chunks.push(e.data); };
  this.mr.onstop=function(){ var b=new Blob(self.chunks,{type:self.mr.mimeType||'video/webm'}); self.release(); if(b.size) self.setOut(b,null); };
  $('recStop').hidden=false;
  for(var n=3;n>=1;n--){ if(!this.stream) return; $('recMsg').className='msg'; $('recMsg').innerHTML='<b class="recn">'+n+'</b> Chuẩn bị nhé…'; try{ tones([440],.08,'square'); }catch(e){} await pause(850); }
  if(!this.stream) return; this.mr.start(1000); $('recView').classList.add('on');
  var v=$('vid'); try{ v.currentTime=0; var p=v.play(); if(p&&p.catch) p.catch(function(){}); }catch(e){}
  $('recMsg').className='msg good'; $('recMsg').innerHTML='<span class="recdot"></span>Đang quay… Hết video sẽ tự dừng, hoặc bấm “Dừng quay”.'; };
REC.release=function(){ liveOff(); (this.canvasTracks||[]).forEach(function(t){ t.stop(); }); this.canvasTracks=null; return _release(); };
REC.setup=function(){ var r=_setup.apply(this,arguments); place(); return r; };

/* ---------- story camera, mirror mode (songs): draw the chosen mask too ---------- */
if(typeof CAM8!=='undefined'){
  var _frame=CAM8.frame.bind(CAM8);
  CAM8.frame=function(ctx,W,H,anim){ var r=_frame(ctx,W,H,anim); var v=$('cam8Vid');
    if(!anim && active() && FX.sel!=='none' && v && v.readyState>=2){ var F=this.face(W,H); M.draw(ctx,FX.sel,F,W,H,5); }
    return r; };
  var _c8=CAM8.setup.bind(CAM8); CAM8.setup=function(){ var r=_c8.apply(this,arguments); place(); return r; };
}
var _pl=paintLesson; paintLesson=function(){ var r=_pl.apply(this,arguments); place(); return r; };
place();
window.CAMFX={FX:FX, M:M, place:place};
})();
