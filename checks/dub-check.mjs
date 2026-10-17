import assert from 'node:assert/strict';
import vm from 'node:vm';
const html=await Bun.file(new URL('../index.html',import.meta.url)).text();
let clears=0,images=0,strokes=0,reduced=false,resize,fullscreen=false,clock=0;const copies=[];let grains=null,dicePaint=null,diceLines=[],path=[],mesh=[],material=null;
const gradient=(kind,args)=>{const stops=[];return {kind,args,stops,addColorStop(offset,color){stops.push([offset,color]);}};};
const ctx=new Proxy({beginPath(){path=[];},moveTo(...xy){path.push(xy);},lineTo(...xy){path.push(xy);},createRadialGradient(...args){return gradient('radial',args);},createLinearGradient(...args){return gradient('linear',args);},fill(){if(material)material.push({op:'fill',path:path.slice(),ink:this.fillStyle,alpha:this.globalAlpha});if(dicePaint)dicePaint.push({path:path.slice(),ink:this.fillStyle});},fillRect(...args){if(grains)grains.push(args);},clearRect(){clears++;},drawImage(...args){images++;copies.push(args);},stroke(){if(material)material.push({op:'stroke',path:path.slice(),ink:this.strokeStyle,width:this.lineWidth,alpha:this.globalAlpha});strokes++;if(dicePaint)diceLines.push({path:path.slice(),ink:this.strokeStyle,width:this.lineWidth});}}, {get:(o,k)=>k in o?o[k]:()=>{}});
const nodes=new Map();
function node(){return {listeners:{},addEventListener(n,f){this.listeners[n]=f},getContext:()=>ctx,getBoundingClientRect:()=>({width:640,height:400}),clientWidth:640,clientHeight:400,width:640,height:400,paused:false,currentTime:0,files:[],classList:{contains:()=>false},setAttribute(){},matches:()=>false,load(){}};}
const document={querySelector(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)},createElement:node,body:{classList:{contains:()=>fullscreen}}};
const sandbox={document,SONORA:{},requestAnimationFrame:()=>{},ResizeObserver:class{constructor(f){resize=f}observe(){}},matchMedia:()=>({matches:reduced}),devicePixelRatio:1,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},Uint8Array,Math,performance:{now:()=>clock}};sandbox.window=sandbox;
vm.createContext(sandbox);
const code=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
// Observe the real transient mesh without adding production debug state.
const instrumented=code.replace('faces.sort((a,b)=>a.depth-b.depth);','faces.sort((a,b)=>a.depth-b.depth);globalThis.inspectDice(faces);');
sandbox.inspectDice=faces=>{mesh=faces};
vm.runInContext(instrumented+`\nthis.probe=()=>({scene,length:dubHistory.length,transient:dubTransient,taps:dubHistory.map(x=>x.now),mosh:moshLast,burst:moshBurst,key:moshKey,triggerTime:moshTriggerTime,transition:sceneTransition});this.frame=draw;this.diceDefinitions={faces:diceFaces,pips:dicePips};this.diceFrame=drawDice;this.materialFrames={velvet:drawVelvet};`,sandbox);
const set=sandbox.SONORA.setStyle;
set('dub');assert.equal(sandbox.probe().scene,'dub');
sandbox.__sonoraNative={mode:'microphone',generation:1,bands:[.8,.5,.7],rms:.6,timeline:{position:0,track:''}};
for(let t=16;t<1800;t+=8)sandbox.frame(t);
assert(sandbox.probe().length<=96);assert(images>100&&strokes>100,'feedback and delayed ribbons must draw');
assert(sandbox.probe().taps[0]>=1800-908);
set('bad');assert.equal(sandbox.probe().scene,'dub');
set('orbit');assert.equal(sandbox.probe().length,0);sandbox.frame(1800);set('dub');
sandbox.frame(1820);assert.equal(sandbox.probe().length,1);
sandbox.__sonoraNative.generation=2;sandbox.frame(1840);assert.equal(sandbox.probe().length,1);
resize();assert.equal(sandbox.probe().length,0);
sandbox.frame(1860);reduced=true;const before=images;sandbox.frame(1880);assert.equal(sandbox.probe().length,0);assert.equal(sandbox.probe().transient,0);assert.equal(images-before,1,'reduced mode copies output but must not draw feedback');
reduced=false;sandbox.__sonoraNative={mode:'apple',generation:3,bands:[0,0,0],rms:0,timeline:{playing:false,position:5,track:'a'}};sandbox.frame(1900);const paused=strokes;sandbox.frame(1920);assert.equal(strokes,paused);
sandbox.__sonoraNative.timeline.track='b';sandbox.frame(1940);assert.equal(sandbox.probe().length,1);
nodes.get('#audio').listeners.seeking();assert.equal(sandbox.probe().length,0);
for(const style of ['bloom','orbit','tide']){set(style);sandbox.frame(2000);assert.equal(sandbox.probe().scene,style)}
assert(html.includes('<option value="dub">Dub</option>'));
for(const path of ['ios/SONORA/SONORAApp.swift','ios/SONORA/RendererHost.swift'])assert((await Bun.file(new URL('../'+path,import.meta.url)).text()).includes('"dub"'));
assert(clears>0);
set('datamosh');sandbox.__sonoraNative={mode:'microphone',generation:5,bands:[.8,.5,.7],rms:.6,timeline:{position:0,track:''}};
sandbox.frame(2100);copies.length=0;sandbox.frame(2117);
const blocks=copies.filter(x=>x.length===9);assert(blocks.length>=224&&blocks.length<=1014,'bounded block advection required');
assert(blocks.some(x=>x[1]!==x[5]||x[2]!==x[6]),'motion vectors must move previous-frame blocks');
assert(blocks.every(x=>x.slice(1).every(Number.isFinite)),'block bounds must be finite');
assert.equal(sandbox.probe().length,0,'Datamosh must not grow Dub history');
set('tide');assert.equal(sandbox.probe().mosh,null);set('datamosh');sandbox.frame(2134);
sandbox.__sonoraNative.generation=6;copies.length=0;sandbox.frame(2151);assert.equal(copies.filter(x=>x.length===9).length,0,'source change must clear old prediction data');
resize();assert.equal(sandbox.probe().mosh,null);sandbox.frame(2168);
reduced=true;copies.length=0;sandbox.frame(2185);assert.equal(copies.filter(x=>x.length===9).length,0,'reduced motion must disable advection and slice tears');assert.equal(sandbox.probe().burst,0);
reduced=false;sandbox.__sonoraNative={mode:'apple',generation:7,bands:[0,0,0],rms:0,timeline:{playing:false,position:8,track:'c'}};sandbox.frame(2202);const beforePause=images;sandbox.frame(2219);assert.equal(images,beforePause,'paused Apple timeline must hold its frame');
nodes.get('#audio').listeners.seeking();assert.equal(sandbox.probe().mosh,null);
for(const path of ['ios/SONORA/SONORAApp.swift','ios/SONORA/RendererHost.swift'])assert((await Bun.file(new URL('../'+path,import.meta.url)).text()).includes('"datamosh"'));
assert(html.includes('<option value="datamosh">Datamosh</option>'));
// The old wall-clock refresh must stay gone: only the target-band rising event adds islands.
set('tide');set('datamosh');reduced=false;
sandbox.__sonoraNative={mode:'microphone',generation:8,bands:[0,0,0],rms:0,timeline:{position:0,track:''}};
sandbox.frame(3000);const initialKey=sandbox.probe().key;
sandbox.frame(9000);assert.equal(sandbox.probe().key,initialKey,'silence must not periodically add shapes');
sandbox.__sonoraNative.bands=[0,.9,.9];sandbox.frame(9300);assert.equal(sandbox.probe().key,initialKey,'mids/treble must not trigger new shapes');
sandbox.__sonoraNative.bands=[.5,0,0];sandbox.frame(9600);assert.equal(sandbox.probe().key,9600,'target bass band must trigger');
sandbox.frame(15000);assert.equal(sandbox.probe().key,9600,'sustained bass must not retrigger');
sandbox.__sonoraNative.bands=[.1,0,0];sandbox.frame(15100);sandbox.__sonoraNative.bands=[.5,0,0];sandbox.frame(15200);assert.equal(sandbox.probe().key,15200,'lower threshold must rearm the next onset');
sandbox.__sonoraNative.bands=[0,0,0];sandbox.frame(15220);sandbox.__sonoraNative.bands=[.5,0,0];sandbox.frame(15240);assert.equal(sandbox.probe().key,15200,'cooldown must suppress rapid repeat');
for(let t=15300;t<=16300;t+=20)sandbox.frame(t);const heldKey=sandbox.probe().key;for(let t=16400;t<=18400;t+=20)sandbox.frame(t);assert.equal(sandbox.probe().key,heldKey,'steady energy must not fire after adaptive rearm');
// Genuine Hz/bin mapping for browser FFT at two sample rates, not the procedural Apple bands.
vm.runInContext('this.spectrum=(rate,bin)=>{__sonoraNative=null;audio.paused=false;analyser={fftSize:1024,context:{sampleRate:rate},getByteFrequencyData(){}};data=new Uint8Array(512);if(bin>=0)data[bin]=255;};',sandbox);
for(const [rate,inside,outside] of [[48000,3,20],[44100,3,20]]){
  set('tide');set('datamosh');sandbox.spectrum(rate,-1);sandbox.frame(16000);const seedKey=sandbox.probe().key;
  sandbox.spectrum(rate,outside);sandbox.frame(16400);assert.equal(sandbox.probe().key,seedKey);
  // All bins in the selected band exceed threshold for the next positive case.
  vm.runInContext('data.fill(255,1,6)',sandbox);sandbox.frame(16800);assert.equal(sandbox.probe().key,16800);
}
set('tide');set('datamosh');sandbox.__sonoraNative={mode:'apple',generation:9,bands:[.9,0,0],rms:0,timeline:{playing:true,position:5,track:'no-spectrum'}};sandbox.frame(17000);const appleKey=sandbox.probe().key;sandbox.__sonoraNative.timeline.position=6;sandbox.frame(20000);assert.equal(sandbox.probe().key,appleKey,'procedural Apple bass is not a frequency trigger');
// Fullscreen gesture arbitration and long composited transitions use the shared style path.
nodes.get('#scene').options=[...html.matchAll(/<option value="([^"]+)">/g)].map(([,value])=>({value}));
sandbox.__sonoraNative=null;set('bloom');
const art=nodes.get('#art');
const down=(x,y,id=1)=>art.listeners.pointerdown({isPrimary:true,button:0,pointerId:id,clientX:x,clientY:y});
const up=(x,y,id=1)=>art.listeners.pointerup({pointerId:id,clientX:x,clientY:y});
down(500,200);up(100,200);assert.equal(sandbox.probe().scene,'bloom','nonfullscreen swipe must be ignored');
fullscreen=true;clock=21000;down(500,200);up(100,200);assert.equal(sandbox.probe().scene,'orbit');assert.equal(sandbox.probe().transition.start,21000);
copies.length=0;sandbox.frame(23500);
const fullFrames=copies.filter(a=>a.length===9);
assert(sandbox.probe().transition&&fullFrames.length===2,'5 second fade must blend exactly two whole frames at midpoint');
assert.notEqual(fullFrames[0][0],fullFrames[1][0],'outgoing and incoming buffers must both be drawn');
assert(fullFrames.every(a=>a[1]===0&&a[2]===0&&a[3]===a[0].width&&a[4]===a[0].height&&a[5]===0&&a[6]===0&&a[7]===640&&a[8]===400),'transition must never sample displaced tiles or overdraw tile seams');
clock=23500;down(100,200);up(500,200);assert.equal(sandbox.probe().scene,'bloom');assert.equal(sandbox.probe().transition.start,23500,'rapid reverse must rebase on current visible frame');
down(500,100);up(450,400);assert.equal(sandbox.probe().scene,'bloom','vertical gesture must not change pattern');
down(500,200);up(480,200);assert.equal(sandbox.probe().scene,'bloom','tap/short drag must be ignored');
down(500,200);art.listeners.pointercancel();up(100,200);assert.equal(sandbox.probe().scene,'bloom');
down(100,200);up(500,200);assert.equal(sandbox.probe().scene,nodes.get('#scene').options.at(-1).value,'previous wraps to last pattern');
sandbox.frame(28501);assert.equal(sandbox.probe().transition,null,'fade must finish');
clock=29000;down(500,200);up(100,200);assert.equal(sandbox.probe().scene,nodes.get('#scene').options[0].value,'next wraps to first pattern');
resize();assert.equal(sandbox.probe().transition,null,'resize cancels stale-sized frames');
reduced=true;clock=30000;down(500,200);up(100,200);assert.equal(sandbox.probe().scene,'orbit');assert.equal(sandbox.probe().transition,null,'reduced motion switches without glitch/fade');
reduced=false;clock=31000;set('tide');fullscreen=false;sandbox.frame(31016);assert.equal(sandbox.probe().transition,null,'exit fullscreen cancels transition');
fullscreen=true;reduced=false;
for(const {value:style} of nodes.get('#scene').options){
  sandbox.__sonoraNative={mode:'apple',generation:20,bands:[0,0,0],rms:0,timeline:{playing:true,position:5,track:'one'}};
  set(style==='dub'?'bloom':'dub');clock=32000;set(style);assert(sandbox.probe().transition);
  sandbox.__sonoraNative.generation=21;sandbox.frame(32016);assert.equal(sandbox.probe().transition,null,style+' must cancel on native source generation');
  set(style==='dub'?'bloom':'dub');clock=33000;set(style);sandbox.__sonoraNative.timeline.track='two';sandbox.frame(33016);assert.equal(sandbox.probe().transition,null,style+' must cancel on track change');
  set(style==='dub'?'bloom':'dub');clock=34000;set(style);sandbox.__sonoraNative.timeline.position=30;sandbox.frame(34016);assert.equal(sandbox.probe().transition,null,style+' must cancel on native seek');
  set(style==='dub'?'bloom':'dub');clock=35000;set(style);nodes.get('#audio').listeners.seeking();assert.equal(sandbox.probe().transition,null,style+' must cancel on browser seek');
  sandbox.__sonoraNative=null;set(style==='dub'?'bloom':'dub');clock=35500;set(style);nodes.get('#audio').src='blob:'+style;sandbox.frame(35516);assert.equal(sandbox.probe().transition,null,style+' must cancel on browser source change');
}
// Cymatic is recomputed from bounded analytic nodes: no stale particle/bitmap state.
fullscreen=false;set('cymatic');
const capture=now=>{grains=[];sandbox.frame(now);const result=JSON.stringify(grains);assert(grains.length>100&&grains.length<=96*96*2);assert(grains.every(a=>a.every(Number.isFinite)));grains=null;return result;};
sandbox.__sonoraNative={mode:'apple',generation:40,bands:[0,0,0],rms:0,timeline:{playing:false,position:5,track:'plate'}};
const plate=capture(36000);assert.equal(capture(36100),plate,'paused Cymatic must be deterministic');
sandbox.__sonoraNative.timeline.position=15;assert.notEqual(capture(36200),plate,'timeline must reshape the nodes');
reduced=true;const quiet=capture(36300);sandbox.__sonoraNative.timeline.position=25;assert.equal(capture(36400),quiet,'reduced motion must freeze timeline art');
reduced=false;resize();sandbox.__sonoraNative.timeline.position=5;assert.equal(capture(36500),plate,'resize/seek must not retain old particles');
sandbox.__sonoraNative={mode:'microphone',generation:41,bands:[0,0,0],rms:0,timeline:{position:0,track:''}};reduced=true;const silent=capture(36600);sandbox.__sonoraNative.bands=[.8,.7,.9];assert.notEqual(capture(36700),silent,'real bands must change nodal geometry even at fixed phase');
assert(html.includes('<option value="cymatic">Cymatic</option>'));
for(const path of ['ios/SONORA/SONORAApp.swift','ios/SONORA/RendererHost.swift'])assert((await Bun.file(new URL('../'+path,import.meta.url)).text()).includes('"cymatic"'));
// Dice are rigid projected cubes, not changing screen-space dot patterns.
fullscreen=false;reduced=false;set('dice');assert.equal(nodes.get('#scene').value,'dice');
nodes.get('#scene').listeners.change({target:{value:'bloom'}});assert.equal(sandbox.probe().scene,'bloom');
nodes.get('#scene').listeners.change({target:{value:'dice'}});assert.equal(sandbox.probe().scene,'dice');
const definitions=sandbox.diceDefinitions;
assert.deepEqual(Array.from(definitions.faces,f=>f.value).sort(),[1,2,3,4,5,6]);
for(const f of definitions.faces){
  const opposite=definitions.faces.find(g=>g.n.every((n,k)=>n===-f.n[k]));assert.equal(f.value+opposite.value,7);
  const dots=definitions.pips[f.value];assert.equal(dots.length,f.value);assert.equal(new Set(dots.map(String)).size,f.value);
  assert(dots.every(uv=>uv.every(n=>Math.abs(n)+.145<1)),'all pips must be inset on their face');
  const cross=[f.u[1]*f.v[2]-f.u[2]*f.v[1],f.u[2]*f.v[0]-f.u[0]*f.v[2],f.u[0]*f.v[1]-f.u[1]*f.v[0]];
  assert.deepEqual(cross,Array.from(f.n),'face basis must point outwards');
}
// Inspect actual Canvas2D paint, not source strings: rings must share the projected pip path.
function assertDiceInk(){
  const rgba=ink=>{const match=/^rgba\((\d+),(\d+),(\d+),([\d.]+)\)$/.exec(ink);assert(match,'Dice uses translucent ink');return match.slice(1).map(Number);};
  for(const paint of dicePaint){
    const [r,g,b,a]=rgba(paint.ink);assert(a>0&&a<=.035,'planes and pip interiors remain nearly transparent');
    assert(['39,137,127','182,245,212','255,145,123'].includes([r,g,b].join(',')),'teal / mint / coral fill only');
  }
  for(const line of diceLines){
    const [r,g,b,a]=rgba(line.ink);assert(a>0&&a<=.56);assert(line.width>0&&line.width<=.85,'fine contours, not heavy borders');
    assert(['182,245,212','255,145,123','152,184,255'].includes([r,g,b].join(',')),'incumbent palette, no black or cobalt');
  }
  const pips=dicePaint.filter(p=>p.path.length===12),rings=diceLines.filter(p=>p.path.length===12);
  assert(pips.length>0);assert.equal(rings.length,pips.length,'every pip has one fine outline');
  for(let i=0;i<pips.length;i++){assert.deepEqual(rings[i].path,pips[i].path);assert(rings[i].width<=.7);}
  assert.equal(diceLines.length,mesh.length*2+pips.length,'bounded face contours, single offset echo and pip rings');
}
const diceCapture=now=>{dicePaint=[];diceLines=[];sandbox.frame(now);const result=JSON.stringify({fills:dicePaint,lines:diceLines});assertDiceInk();assert(dicePaint.length>0&&dicePaint.length<=21*7);assert(dicePaint.every(p=>p.path.every(xy=>xy.every(Number.isFinite))));dicePaint=null;return result;};
sandbox.__sonoraNative={mode:'apple',generation:50,bands:[0,0,0],rms:0,timeline:{playing:false,position:5,track:'dice'}};
const dice=diceCapture(37000);assert.equal(diceCapture(39000),dice,'paused Apple Dice must not drift with wall clock');
sandbox.__sonoraNative.timeline.position=15;assert.notEqual(diceCapture(39100),dice,'Apple time must rotate Dice');
reduced=true;const stillDice=diceCapture(39200);sandbox.__sonoraNative.timeline.position=25;assert.equal(diceCapture(39300),stillDice,'reduced motion must freeze Apple Dice');
reduced=false;resize();sandbox.__sonoraNative.timeline.position=5;assert.equal(diceCapture(39400),dice,'Dice must be stateless across seek/resize');
sandbox.__sonoraNative={mode:'microphone',generation:51,bands:[0,0,0],rms:0,timeline:{position:0,track:''}};
reduced=true;const silentDice=diceCapture(39500);sandbox.__sonoraNative.bands=[.8,.7,.9];assert.notEqual(diceCapture(39600),silentDice,'reduced motion retains live scale/registration effects');
const quietMesh=JSON.stringify(mesh.map(f=>f.point(0,0)));sandbox.__sonoraNative.bands=[0,1,0];diceCapture(39700);const tiltMesh=JSON.stringify(mesh.map(f=>f.point(0,0)));
sandbox.__sonoraNative.bands=[0,0,0];diceCapture(39800);assert.equal(JSON.stringify(mesh.map(f=>f.point(0,0))),tiltMesh,'reduced motion must freeze mid-driven tilt');
assert.notEqual(quietMesh,tiltMesh,'bass must still scale the quiet composition');
// Sweep rotations/bands and mobile, desktop, portrait, landscape sizes; inspect actual drawn faces and pip paths.
for(const [w,h] of [[320,560],[390,300],[1440,780],[844,300]])for(const t of [0,1,5,13,50]){
  vm.runInContext(`phase=${t}`,sandbox);dicePaint=[];diceLines=[];sandbox.diceFrame(w,h,1,.7,.9,false);
  assert(mesh.length>=7&&mesh.length<=21);assert.equal(new Set(mesh.map(f=>f.i)).size,7);
  assert(mesh.every((f,j)=>f.normal[2]>.001&&(!j||mesh[j-1].depth<=f.depth)),'only front faces, far-to-near');
  let paint=0;
  for(const f of mesh){
    assert(mesh.filter(g=>g.i===f.i).length<=3);
    const face=dicePaint[paint++];assert.equal(face.path.length,4);
    assert(face.path.every(([x,y])=>x>0&&x<w&&y>0&&y<h),'fitted cube corners');
    for(const [u,v] of definitions.pips[f.face.value]){
      const pip=dicePaint[paint++];assert.equal(pip.path.length,12);
      for(let j=0;j<12;j++){
        const a=j/12*Math.PI*2,expected=f.point(u+Math.cos(a)*.145,v+Math.sin(a)*.145);
        assert(pip.path[j].every((n,k)=>Number.isFinite(n)&&Math.abs(n-expected[k])<1e-8),'pips must rotate/project with their own face');
      }
    }
  }
  assert.equal(paint,dicePaint.length);assertDiceInk();dicePaint=null;
}
assert.equal(sandbox.probe().length,0,'Dice must not store histories');assert.equal(sandbox.probe().mosh,null,'Dice must clear old prediction state');
for(const path of ['ios/SONORA/SONORAApp.swift','ios/SONORA/RendererHost.swift'])assert((await Bun.file(new URL('../'+path,import.meta.url)).text()).includes('"dice"'));
const swift=await Bun.file(new URL('../ios/SONORA/SONORAApp.swift',import.meta.url)).text();
const styles=nodes.get('#scene').options.map(o=>o.value),host=await Bun.file(new URL('../ios/SONORA/RendererHost.swift',import.meta.url)).text();
assert.deepEqual(JSON.parse('['+host.match(/guard \[([^\]]+)\]\.contains\(value\)/)[1]+']'),styles,'native guard and web cycle must agree');
assert.deepEqual([...swift.match(/Picker\("Visual style"[^\n]+/)[0].matchAll(/\.tag\("([^"]+)"\)/g)].map(m=>m[1]),styles,'native menu and web cycle must agree');
assert(/Picker\("Visual style"[^\n]+pickerStyle\(\.menu\)/.test(swift));assert(/Picker\("Source"[^\n]+pickerStyle\(\.segmented\)/.test(swift));
// Actual Velvet Canvas2D paint: bounded translucent feathered planes.
fullscreen=false;reduced=false;
const materialCapture=(style,drawFrame)=>{
  material=[];drawFrame();const trace=material;material=null;
  const fills=trace.filter(p=>p.op==='fill'),lines=trace.filter(p=>p.op==='stroke');
  assert.equal(fills.length,52,style+' fixed surface budget');
  assert.equal(lines.length,0,style+' is surface-led, not generic linewaves');
  assert(fills.every(p=>p.path.length===(97)));
  assert(trace.every(p=>p.path.every(xy=>xy.every(Number.isFinite))));
  assert(trace.every(p=>Number.isFinite(p.alpha)&&p.alpha>0&&p.alpha<=1));
  const gradients=fills.filter(p=>typeof p.ink==='object');
  assert.equal(gradients.length,48);
  for(const {ink} of gradients){
    assert.equal(ink.kind,'radial');assert(ink.args.every(Number.isFinite));
    assert(ink.stops.length>=3&&ink.stops.every(([n,color])=>Number.isFinite(n)&&n>=0&&n<=1&&!/NaN|Infinity/.test(color)));
  }
  assert(fills.every(p=>p.alpha<=.042),'velour feather shells remain translucent');
  return {trace,json:JSON.stringify(trace)};
};
for(const style of ['velvet']){
  reduced=false;
  nodes.get('#scene').listeners.change({target:{value:style}});assert.equal(sandbox.probe().scene,style);assert.equal(nodes.get('#scene').value,style);
  sandbox.__sonoraNative={mode:'apple',generation:60,bands:[0,0,0],rms:0,timeline:{playing:false,position:5,track:'fabric'}};
  const capture=now=>materialCapture(style,()=>sandbox.frame(now)).json;
  const paused=capture(40000);assert.equal(capture(45000),paused,style+' Apple pause must not drift');
  sandbox.__sonoraNative.timeline.position=15;assert.notEqual(capture(45100),paused,style+' follows Apple position');
  reduced=true;const frozen=capture(45200);sandbox.__sonoraNative.timeline.position=25;assert.equal(capture(49900),frozen,style+' reduced motion freezes timeline');
  reduced=false;resize();sandbox.__sonoraNative.timeline.position=5;assert.equal(capture(50000),paused,style+' resize/seek has no retained fabric');
  sandbox.__sonoraNative.generation++;sandbox.__sonoraNative.timeline.track='new-fabric';assert.equal(capture(50100),paused,style+' source switch has no retained fabric');
  sandbox.__sonoraNative={mode:'microphone',generation:62,bands:[0,0,0],rms:0,timeline:{position:0,track:''}};
  reduced=true;const silent=capture(50200);assert.equal(capture(55000),silent,style+' live-source reduced motion freezes phase and drift');
  for(let band=0;band<3;band++){
    sandbox.__sonoraNative.bands=[0,0,0];sandbox.__sonoraNative.bands[band]=.9;
    assert.notEqual(capture(55100+band),silent,style+' retains independent band '+band+' response at fixed phase');
  }
  for(const [w,h] of [[320,560],[390,300],[1440,780],[844,300]])for(const phase of [0,1,5,13,50])for(const bands of [[0,0,0],[1,1,1]]){
    vm.runInContext(`phase=${phase}`,sandbox);
    const {trace}=materialCapture(style,()=>sandbox.materialFrames[style](w,h,...bands,false));
    assert(trace.every(p=>p.path.every(([x,y])=>x>=-w&&x<=w*2&&y>=-h&&y<=h*2)),style+' coordinates remain viewport-bounded');
  }
  assert.equal(sandbox.probe().length,0);assert.equal(sandbox.probe().mosh,null,'new materials use no histories');
}
reduced=false;set('velvet');set('satin');assert.equal(sandbox.probe().scene,'velvet','removed style must be rejected');
assert(!html.includes('drawSatinRibbon')&&!html.includes('value="satin"'),'removed renderer and option must stay absent');
assert.deepEqual(nodes.get('#scene').options.map(o=>o.value),['bloom','orbit','tide','dub','datamosh','cymatic','dice','velvet']);
for(const [id,label] of [['velvet','Velvet']]){
  assert(html.includes(`<option value="${id}">${label}</option>`));assert(swift.includes(`Text("${label}").tag("${id}")`));
}
assert.deepEqual(JSON.parse('['+code.match(/if\(!\[([^\]]+)\]\.includes\(value\)/)[1].replaceAll("'",'"')+']'),styles,'browser guard and shared catalog agree');
// Traverse every expanded-cycle destination, then wrap in each direction (existing gesture mocks).
fullscreen=true;set('bloom');
for(let i=1;i<=styles.length;i++){down(500,200);up(100,200);assert.equal(sandbox.probe().scene,styles[i%styles.length]);}
for(let i=1;i<=styles.length;i++){down(100,200);up(500,200);assert.equal(sandbox.probe().scene,styles[(styles.length-i)%styles.length]);}
// Exercise actual scheduled draw callbacks and Canvas paint, not just the pacing arithmetic.
let nextRAF,scheduled=0;
sandbox.requestAnimationFrame=callback=>{nextRAF=callback;scheduled++;};
vm.runInContext('this.pacing=()=>({frameRate,frameOrigin,frameBucket,lastFrame,phase});',sandbox);
fullscreen=false;set('bloom');
const fpsButton=nodes.get('#frameRate'),attrs={};fpsButton.setAttribute=(key,value)=>attrs[key]=value;
assert(html.includes('id="frameRate" type="button" aria-pressed="false">24fps</button>'));
assert.equal(sandbox.pacing().frameRate,0,'default remains automatic rAF');
const tick=t=>{clock=t;nextRAF(t);};
const begin=(fps,start)=>{clock=start;sandbox.SONORA.setFrameRate(fps===24?0:24);sandbox.SONORA.setFrameRate(fps);nextRAF=sandbox.frame;tick(start);};
const counts=[];
for(const hz of [60,120])for(const fps of [0,24])for(const quiet of [false,true]){
  reduced=quiet;sandbox.__sonoraNative={mode:'microphone',generation:80,bands:[.4,.3,.2],rms:.2,timeline:{position:0,track:''}};
  const start=clock+10000;begin(fps,start);const beforePaint=strokes,beforeRAF=scheduled,phaseBefore=sandbox.pacing().phase;
  for(let i=1;i<=hz*2;i++)tick(start+i*1000/hz);
  const draws=(strokes-beforePaint)/43,elapsed=sandbox.pacing().phase-phaseBefore;
  assert.equal(draws,(fps||hz)*2,`${hz}Hz/${fps} actual painted frames, reduced=${quiet}`);
  assert.equal(scheduled-beforeRAF,hz*2,'even skipped callbacks must schedule the next rAF');
  const expected=quiet?0:2000/16.67*(.003+.4*.013);
  assert(Math.abs(elapsed-expected)<1e-8,'24fps must retain auto elapsed phase speed, not the old cap-2 slowdown');
  counts.push({hz,fps,reduced:quiet,draws,phaseDelta:Number(elapsed.toFixed(9))});
}
reduced=false;begin(24,clock+10000);const accepted=sandbox.pacing();
for(const bad of [-1,23,30,60,'24',NaN,Infinity,null,undefined])sandbox.SONORA.setFrameRate(bad);
assert.deepEqual(sandbox.pacing(),accepted,'shared boundary rejects everything except numeric 0/24');
assert.equal(attrs['aria-pressed'],'true');
const gate=clock;tick(gate+1);assert.equal(sandbox.pacing().lastFrame,gate,'same bucket skips render work');
sandbox.SONORA.setFrameRate(24);tick(gate+2);assert.equal(sandbox.pacing().lastFrame,gate,'same mode must not reset pacing on native updates');
fpsButton.listeners.click();assert.equal(sandbox.pacing().frameRate,0);assert.equal(attrs['aria-pressed'],'false');tick(gate+3);assert.equal(sandbox.pacing().lastFrame,gate+3);
fpsButton.listeners.click();assert.equal(sandbox.pacing().frameRate,24);assert.equal(sandbox.pacing().frameOrigin,null);tick(gate+4);assert.equal(sandbox.pacing().lastFrame,gate+4,'mode switch resets gate immediately');
const beforeStall=sandbox.pacing().phase;tick(gate+10004);assert(sandbox.pacing().phase-beforeStall<=4*(.003+.4*.013)+1e-8,'stall delta remains bounded');
const paintAfterStall=strokes;tick(gate+10005);tick(gate+10006);assert.equal(strokes,paintAfterStall,'resume must not replay missed frames');
for(const fps of [0,24]){
  reduced=false;sandbox.__sonoraNative={mode:'apple',generation:81,bands:[0,0,0],rms:0,timeline:{playing:false,position:7,track:'paced'}};
  begin(fps,clock+10000);tick(clock+100);assert.equal(sandbox.pacing().phase,1.75);tick(clock+1000);assert.equal(sandbox.pacing().phase,1.75,'paused Apple art holds at either rate');
  sandbox.__sonoraNative.timeline.position=11;tick(clock+100);assert.equal(sandbox.pacing().phase,2.75,'Apple time is not integrated from frame count');
  reduced=true;tick(clock+100);sandbox.__sonoraNative.timeline.position=15;tick(clock+100);assert.equal(sandbox.pacing().phase,0,'reduced-motion Apple art stays deterministic at either rate');
}
reduced=false;begin(24,clock+10000);nodes.get('#audio').listeners.seeking();sandbox.__sonoraNative.generation++;tick(clock+100);
assert.equal(sandbox.pacing().frameRate,24,'source/seek must not change selected fps');
fullscreen=true;sandbox.__sonoraNative={mode:'microphone',generation:90,bands:[.4,.3,.2],rms:.2,timeline:{position:0,track:''}};
set('bloom');clock+=100;set('orbit');const fadeStart=clock;assert(sandbox.probe().transition);
// Rebase the cap at transition time, then follow a 60 Hz display for five wall-clock seconds.
begin(24,fadeStart);for(let i=1;i<300;i++)tick(fadeStart+i*1000/60);
assert(sandbox.probe().transition,'fade remains active before five seconds');tick(fadeStart+5000);assert.equal(sandbox.probe().transition,null,'24fps fade completes in five wall-clock seconds');
for(const [w,h] of [[390,844],[320,560],[1440,780],[844,300]])for(const style of ['velvet'])for(const t of [0,1,5,13,50]){
  vm.runInContext(`phase=${t}`,sandbox);const {trace}=materialCapture(style,()=>sandbox.materialFrames[style](w,h,1,1,1,false));
  assert(trace.every(p=>p.path.every(([x,y])=>x>=0&&x<=w&&y>=0&&y<=h)),style+' fitted material must remain inside narrow/desktop viewport');
}
assert(swift.includes('Toggle("24fps", isOn: $use24fps)')&&swift.includes('frameRate: use24fps ? 24 : 0'));
assert(host.includes('let frameRate: Int')&&host.includes('controller.setFrameRate(frameRate)')&&host.includes('guard value == 0 || value == 24, frameRate != value else { return }'));
assert(host.includes('window.SONORA.setFrameRate(frameRate); window.SONORA.setPayload(payload)')&&host.includes('"frameRate": frameRate'),'pageReady applies validated pending frame rate');
console.log('PASS: 24fps scheduled Canvas draws, phase speed, independent reduced motion:',JSON.stringify(counts));
console.log('PASS: validated browser/native 0/24 toggle, reset/idempotent gate, bounded stalls without backlog, deterministic paused Apple art, unchanged source/seek fps and five-second capped crossfade; fitted Velvet geometry');
console.log('PASS: Velvet actual Canvas2D traces: finite viewport-bounded surfaces, fixed 52 fills and radial shading; independent bass/mid/high response, deterministic Apple pause/time/seek, reduced-motion freeze with live bands, stateless resize/source, eight-style browser/native ordering and bidirectional full-cycle wrap; shared all-style transition lifecycle checks retained');
console.log('PASS: Dice translucent teal/coral planes, fine mint/coral pip rings and contours, bounded pale-blue treble echo (actual ctx trace); seven fitted cubes, finite bounded depth-sorted visible faces, fixed 1–6 face-local pips/opposites sum7, shared select/native routing and menu/source picker; deterministic Apple pause/time/seek and reduced-motion rotation freeze with live bands');
console.log('PASS: Cymatic bounded finite powder geometry, band response, Apple pause/timeline/reduced motion, stateless resize and native routing; all destinations cancel transitions on native source/track/timeline and browser seeking; fullscreen swipe direction/wrap/gesture rejection, 5s whole-frame crossfade without tiled sampling, rapid reversal and lifecycle cancellation; Datamosh 40–250Hz onset, sustained-note suppression, hysteresis/cooldown, browser Hz mapping, silence/no Apple false triggers; Datamosh bounded block advection, source/reset/reduced motion and native routing; Dub feedback, delayed ribbons, bounded history, shared routing, reset, reduced motion, paused Apple art, and native source wiring');
