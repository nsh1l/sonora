import assert from 'node:assert/strict';
import vm from 'node:vm';
const html=await Bun.file(new URL('../index.html',import.meta.url)).text();
let clears=0,images=0,strokes=0,reduced=false,resize,fullscreen=false,clock=0;const copies=[];let grains=null;
const ctx=new Proxy({fillRect(...args){if(grains)grains.push(args);},clearRect(){clears++;},drawImage(...args){images++;copies.push(args);},stroke(){strokes++;}}, {get:(o,k)=>k in o?o[k]:()=>{}});
const nodes=new Map();
function node(){return {listeners:{},addEventListener(n,f){this.listeners[n]=f},getContext:()=>ctx,getBoundingClientRect:()=>({width:640,height:400}),clientWidth:640,clientHeight:400,width:640,height:400,paused:false,currentTime:0,files:[],classList:{contains:()=>false},setAttribute(){},matches:()=>false,load(){}};}
const document={querySelector(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)},createElement:node,body:{classList:{contains:()=>fullscreen}}};
const sandbox={document,SONORA:{},requestAnimationFrame:()=>{},ResizeObserver:class{constructor(f){resize=f}observe(){}},matchMedia:()=>({matches:reduced}),devicePixelRatio:1,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},Uint8Array,Math,performance:{now:()=>clock}};sandbox.window=sandbox;
vm.createContext(sandbox);
const code=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
vm.runInContext(code+`\nthis.probe=()=>({scene,length:dubHistory.length,transient:dubTransient,taps:dubHistory.map(x=>x.now),mosh:moshLast,burst:moshBurst,key:moshKey,triggerTime:moshTriggerTime,transition:sceneTransition});this.frame=draw;`,sandbox);
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
copies.length=0;sandbox.frame(23500);assert(sandbox.probe().transition&&copies.some(a=>a.length===9),'5 second fade must contain outgoing block sampling at midpoint');
clock=23500;down(100,200);up(500,200);assert.equal(sandbox.probe().scene,'bloom');assert.equal(sandbox.probe().transition.start,23500,'rapid reverse must rebase on current visible frame');
down(500,100);up(450,400);assert.equal(sandbox.probe().scene,'bloom','vertical gesture must not change pattern');
down(500,200);up(480,200);assert.equal(sandbox.probe().scene,'bloom','tap/short drag must be ignored');
down(500,200);art.listeners.pointercancel();up(100,200);assert.equal(sandbox.probe().scene,'bloom');
down(100,200);up(500,200);assert.equal(sandbox.probe().scene,'cymatic','previous wraps to last pattern');
sandbox.frame(28501);assert.equal(sandbox.probe().transition,null,'fade must finish');
clock=29000;down(500,200);up(100,200);assert.equal(sandbox.probe().scene,'bloom','next wraps to first pattern');
resize();assert.equal(sandbox.probe().transition,null,'resize cancels stale-sized frames');
reduced=true;clock=30000;down(500,200);up(100,200);assert.equal(sandbox.probe().scene,'orbit');assert.equal(sandbox.probe().transition,null,'reduced motion switches without glitch/fade');
reduced=false;clock=31000;set('tide');fullscreen=false;sandbox.frame(31016);assert.equal(sandbox.probe().transition,null,'exit fullscreen cancels transition');
fullscreen=true;reduced=false;
for(const style of ['bloom','orbit','tide','cymatic']){
  sandbox.__sonoraNative={mode:'apple',generation:20,bands:[0,0,0],rms:0,timeline:{playing:true,position:5,track:'one'}};
  set('dub');clock=32000;set(style);assert(sandbox.probe().transition);
  sandbox.__sonoraNative.generation=21;sandbox.frame(32016);assert.equal(sandbox.probe().transition,null,style+' must cancel on native source generation');
  set('dub');clock=33000;set(style);sandbox.__sonoraNative.timeline.track='two';sandbox.frame(33016);assert.equal(sandbox.probe().transition,null,style+' must cancel on track change');
  set('dub');clock=34000;set(style);sandbox.__sonoraNative.timeline.position=30;sandbox.frame(34016);assert.equal(sandbox.probe().transition,null,style+' must cancel on native seek');
  set('dub');clock=35000;set(style);nodes.get('#audio').listeners.seeking();assert.equal(sandbox.probe().transition,null,style+' must cancel on browser seek');
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
console.log('PASS: Cymatic bounded finite powder geometry, band response, Apple pause/timeline/reduced motion, stateless resize and native routing; all destinations cancel transitions on native source/track/timeline and browser seeking; fullscreen swipe direction/wrap/gesture rejection, 5s block-mosh fade, rapid reversal and lifecycle cancellation; Datamosh 40–250Hz onset, sustained-note suppression, hysteresis/cooldown, browser Hz mapping, silence/no Apple false triggers; Datamosh bounded block advection, source/reset/reduced motion and native routing; Dub feedback, delayed ribbons, bounded history, shared routing, reset, reduced motion, paused Apple art, and native source wiring');
