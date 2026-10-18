import assert from 'node:assert/strict';
import vm from 'node:vm';
import {mount,assertInactive,assertActive} from './fullscreen-check.mjs';
const html=await Bun.file(new URL('../index.html',import.meta.url)).text();
assert.equal(html.match(/<h2 id="creditsTitle">([\s\S]*?)<\/h2>/)[1].replace(/<[^>]+>/g,''),'SONORA — A living instrument for sound');
for(const text of ['Concept & creative direction','So1loh / Always Yesterday Party','Development assistance','Hermes agent / Codex','role="dialog" aria-modal="true" aria-labelledby="creditsTitle"','filter:url(#creditsWarp)','in="SourceGraphic" in2="noise"','x="-15%" y="-20%" width="130%" height="140%"']) assert(html.includes(text),text);
const key=(ui,key,shiftKey=false)=>{let prevented=false;ui.events.get('keydown')({key,shiftKey,preventDefault(){prevented=true;}});return prevented;};
for(const mode of ['native','unsupported','rejected','race']){
  const ui=mount(mode),get=s=>ui.nodes.get(s),trigger=get('#creditsTrigger'),dialog=get('#creditsDialog'),close=get('#creditsClose');
  trigger.emit('click');await Promise.resolve();
  assert.equal(dialog.hidden,false);assert(ui.body.classList.contains('visualizer-fullscreen'));assert(get('main').inert&&ui.install.inert&&ui.exit.inert);assert.equal(ui.document.activeElement,close);
  for(const shift of [false,true]){trigger.focus();assert(key(ui,'Tab',shift));assert.equal(ui.document.activeElement,close);}
  ui.exit.emit('click');assert.equal(dialog.hidden,false,'fullscreen exit control is suppressed behind dialog');
  assert(key(ui,'Escape'));assertInactive(ui);assert(dialog.hidden&&!get('main').inert);assert.equal(ui.document.activeElement,trigger);assert.equal(get('#creditsDisplacement').getAttribute('scale'),'0');
  if(mode==='race'){
    ui.stage.reject();await Promise.resolve();assertInactive(ui);
    ui.document.fullscreenElement=ui.stage;ui.events.get('fullscreenchange')();assertInactive(ui);assert.equal(ui.document.activeElement,trigger);
  }
  ui.toggle.emit('click');trigger.emit('click');close.emit('click');assertActive(ui);assert.equal(ui.document.activeElement,trigger,'already-fullscreen close keeps immersive mode');
  trigger.emit('click');ui.document.fullscreenElement=null;ui.events.get('fullscreenchange')();assertInactive(ui);assert(dialog.hidden&&!get('main').inert);assert.equal(ui.document.activeElement,trigger);
  if(mode==='race'){ui.stage.reject();await Promise.resolve();}
}
// Run the real renderer and real controller together: synthetic FFT/native bands reach SVG attributes only on admitted frames.
const ui=mount('unsupported'),get=s=>ui.nodes.get(s);let reduced=false,clock=0,rafCalls=0;
const ctx=new Proxy({}, {get:(_,name)=>name.startsWith('create')?()=>({addColorStop(){}}):()=>{}});
function decorate(node){Object.assign(node,{clientWidth:640,clientHeight:400,width:640,height:400,paused:false,currentTime:0,getContext:()=>ctx,getBoundingClientRect:()=>({width:640,height:400}),matches:()=>false,load(){},replaceChildren(){},append(){}});return node;}
const query=ui.document.querySelector;
ui.document.querySelector=s=>{if(!ui.nodes.has(s))ui.nodes.set(s,decorate(new (get('#creditsClose').constructor)()));return ui.nodes.get(s);};
ui.document.createElement=()=>decorate(new (get('#creditsClose').constructor)());
ui.document.createElementNS=ui.document.createElement;
const add=ui.document.addEventListener;
ui.document.addEventListener=(name,fn)=>{const previous=ui.events.get(name);add(name,event=>{previous?.(event);fn(event);});};
const sandbox={document:ui.document,SONORA:window.SONORA,SONORA_I18N:window.SONORA_I18N,matchMedia:()=>({matches:reduced}),ResizeObserver:class{observe(){}},requestAnimationFrame(){rafCalls++;},performance:{now:()=>clock},devicePixelRatio:1,URL:{},Uint8Array,Math};sandbox.window=sandbox;
vm.createContext(sandbox);
vm.runInContext([...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1]+`\nthis.frame=draw;this.fft=values=>{__sonoraNative=null;analyser={getByteFrequencyData(){}};data=new Uint8Array(512);data.fill(values[0],1,14);data.fill(values[1],14,92);data.fill(values[2],92,240);};`,sandbox);
const audio=ui.document.querySelector('#audio'),scale=()=>Number(get('#creditsDisplacement').getAttribute('scale')),noise=()=>get('#creditsNoise').getAttribute('baseFrequency');
get('#creditsTrigger').emit('click');
for(const values of [[255,0,0],[0,255,0],[0,0,255]]){
  sandbox.fft([0,0,0]);for(let t=0;t<2200;t+=80)sandbox.frame(clock+=80);assert.equal(scale(),0);
  sandbox.fft(values);const flat=noise();for(let t=0;t<600;t+=20)sandbox.frame(clock+=20);assert(scale()>0&&scale()<=6);assert.notEqual(noise(),flat);
}
sandbox.fft([255,255,255]);for(let i=0;i<100;i++){sandbox.frame(clock+=20);assert(Number.isFinite(scale())&&scale()>=0&&scale()<=6);assert(noise().split(' ').every(v=>Number.isFinite(Number(v))));}
audio.paused=true;for(let i=0;i<100;i++)sandbox.frame(clock+=80);assert.equal(scale(),0);const settled=noise();sandbox.frame(clock+=100);assert.equal(noise(),settled);
audio.paused=false;reduced=true;sandbox.frame(clock+=20);assert.equal(scale(),0);assert.equal(noise(),'.012 .026');reduced=false;
sandbox.__sonoraNative={mode:'apple',generation:1,bands:[.9,.9,.9],rms:0,timeline:{playing:false,position:5,track:'apple'}};
sandbox.frame(clock+=20);const held=[scale(),noise()];for(let i=0;i<20;i++)sandbox.frame(clock+=20);assert.deepEqual([scale(),noise()],held,'Apple pause holds deterministic timeline distortion');
sandbox.__sonoraNative.bands=[0,0,0];sandbox.frame(clock+=20);assert.deepEqual([scale(),noise()],held,'Apple deformation ignores supplied FFT-like bands at a held timeline');
sandbox.__sonoraNative.timeline.position=12;sandbox.frame(clock+=20);assert.notDeepEqual([scale(),noise()],held);
sandbox.__sonoraNative={mode:'microphone',generation:2,bands:[1,1,1],rms:1,timeline:{position:0,track:''}};
sandbox.SONORA.setFrameRate(24);sandbox.frame(clock+=100);const admitted=[scale(),noise()];sandbox.__sonoraNative.bands=[0,0,0];sandbox.frame(clock+=10);assert.deepEqual([scale(),noise()],admitted);sandbox.frame(clock+=40);assert.notDeepEqual([scale(),noise()],admitted,'24fps must admit later filter update');
// Existing scene gestures/arrow keys must not leak through the modal.
ui.document.querySelector('#scene').options=[{value:'bloom'},{value:'orbit'}];
key(ui,'ArrowRight');assert.equal(ui.document.querySelector('#scene').value,undefined);
sandbox.SONORA.setFrameRate(0);
audio.paused=false;sandbox.fft([210,180,120]);
sandbox.__sonoraNative={mode:'local',generation:3,timeline:{position:0,track:''}};
for(let i=0;i<12;i++)sandbox.frame(clock+=80);
assert(scale()>0,'native local file must deform credits from analyzed audio');
audio.paused=true;for(let i=0;i<100;i++)sandbox.frame(clock+=80);assert.equal(scale(),0,'native local pause must settle credits');
get('#creditsClose').emit('click');assert.equal(scale(),0);assert.equal(get('#creditsDialog').hidden,true);
assert(rafCalls>0);
console.log('PASS: credits exact copy, dialog/focus/Tab/Escape, native/fallback/exit/races, SVG band deformation finite 0–6px, silence/paused and native local settling, reduced zero, Apple timeline hold, and real 24fps admission');
