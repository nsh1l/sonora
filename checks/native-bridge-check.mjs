const bridgeNodes = new Map(['art','state','trackName','trackSub'].map(id => [id,{hidden:false,textContent:''}]));
const bridgeClasses = new Set();
globalThis.window = globalThis;
globalThis.document = { body:{classList:{toggle:(name,on)=>on?bridgeClasses.add(name):bridgeClasses.delete(name),contains:name=>bridgeClasses.has(name)}}, querySelector:selector=>bridgeNodes.get(selector.slice(1))||null };
await import('../native-bridge.js');
const send = value => SONORA.setPayload(JSON.stringify(value));
const valid = (mode,generation,extra={}) => ({mode,bands:[.2,.3,.4],rms:.2,timeline:{playing:false,position:5,duration:120,track:'track-a'},generation,...extra});

// WKWebView receives a JavaScript object argument, not JSON-encoded text.
SONORA.setPayload(valid('microphone',1));
if (SONORA.snapshot().mode!=='microphone'||!bridgeClasses.has('sonora-native')) throw Error('native object payload was not applied');
send(valid('apple',2,{title:'<img>',artist:'Artist'}));
if (bridgeNodes.get('trackName').textContent!=='<img>'||SONORA.snapshot().timeline.position!==5) throw Error('safe Apple metadata rendering failed');
send(valid('apple',3,{timeline:{playing:true,position:0,duration:120,track:'track-b'}}));
if (SONORA.snapshot().timeline.track!=='track-b'||SONORA.snapshot().timeline.position!==0) throw Error('track-change seek reset failed');
send({...valid('apple',4),bands:[Infinity,0,0]});
if (SONORA.snapshot().mode!=='none'||bridgeClasses.has('sonora-native')) throw Error('invalid numeric payload was not rejected');
SONORA.setPayload('{bad'); if(SONORA.snapshot().mode!=='none') throw Error('malformed JSON was accepted');
SONORA.setPayload(valid('apple',2)); if(SONORA.snapshot().mode!=='none') throw Error('stale generation was accepted');
SONORA.setPayload({mode:'none',generation:5,status:'Permission denied.'});
if(bridgeNodes.get('state').textContent!=='Permission denied.') throw Error('permission error status was hidden');
SONORA.setPayload({mode:'spotify',generation:6});
if(!bridgeClasses.has('sonora-spotify')||!bridgeNodes.get('art').hidden||bridgeClasses.has('sonora-native')) throw Error('Spotify metadata view leaked into visualizer');
SONORA.setPayload({mode:'microphone',generation:7,...valid('microphone',7)});
if(!bridgeClasses.has('sonora-native')||bridgeNodes.get('art').hidden) throw Error('microphone mode did not restore artwork');
SONORA.clear(); if(bridgeClasses.has('sonora-native')||bridgeClasses.has('sonora-spotify')) throw Error('bridge clear did not restore browser mode');
SONORA.setShell(); if(!bridgeClasses.has('sonora-shell')) throw Error('native-shell CSS hook missing');

// Execute the real inline drawing code and local-file selection flow against a small DOM.
class Element {
  constructor(){this.listeners={};this.textContent='';this.disabled=false;this.hidden=false;this.value='0';this.files=[];this.classList={contains:()=>false};}
  addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}
  fire(name){for(const fn of this.listeners[name]??[])fn({target:this});}
  replaceChildren(){} setAttribute(){} matches(){return false;}
}
const elements=new Map(['art','audio','audioFile','play','seek','state','welcome','trackName','trackSub','back','forward','duration','current','scene','sampleTrack','frameRate'].map(id=>[id,new Element()]));
const traces=[],paints=[]; const canvas=elements.get('art');
const context={save(){},restore(){},translate(){},rotate(){},fillRect(){},clearRect(){},setTransform(){},beginPath(){},moveTo(x,y){traces.push([x,y]);},lineTo(x,y){traces.push([x,y]);},closePath(){},fill(){paints.push(["fill",this.globalCompositeOperation,this.fillStyle]);},stroke(){paints.push(["stroke",this.lineWidth]);},quadraticCurveTo(){},arc(){}};
canvas.getContext=()=>context;canvas.getBoundingClientRect=()=>({width:300,height:200});canvas.clientWidth=300;canvas.clientHeight=200;
const audio=elements.get('audio');Object.assign(audio,{paused:true,currentTime:0,duration:120,load(){},play:async()=>{audio.paused=false;audio.fire('play');}});
const bodyClasses=new Set();globalThis.document={body:{classList:{contains:n=>bodyClasses.has(n),toggle:(n,on)=>on?bodyClasses.add(n):bodyClasses.delete(n)}},querySelector:s=>elements.get(s.slice(1)),createElementNS:()=>new Element()};
globalThis.ResizeObserver=class{observe(){}};globalThis.requestAnimationFrame=()=>0;globalThis.devicePixelRatio=1;globalThis.__sonoraReducedMotion=false;globalThis.matchMedia=()=>({matches:globalThis.__sonoraReducedMotion});
globalThis.URL.createObjectURL=()=>'blob:track';globalThis.URL.revokeObjectURL=()=>{};
let resumes=0;globalThis.AudioContext=class{constructor(){this.destination={};}createMediaElementSource(){return {connect(){}}}createAnalyser(){return {context:this,frequencyBinCount:512,connect(){},getByteFrequencyData(){}}}async resume(){resumes++;}};
const html=await Bun.file(new URL('../index.html',import.meta.url)).text();
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];if(!scripts.length)throw Error('inline browser renderer missing');
eval(scripts.at(-1)[1]+'\nglobalThis.__sonoraTestDraw=draw;');
const picker=elements.get('audioFile');picker.files=[{name:'kept-local.mp3',type:'audio/mpeg'}];picker.fire('change');
if(elements.get('trackName').textContent!=='kept-local'||elements.get('play').disabled)throw Error('existing browser-local audio flow regressed');
// Extension selection also works when a file manager omits or varies the FLAC MIME type.
if(!html.includes('accept="audio/*,.flac,audio/flac,audio/x-flac"'))throw Error('FLAC picker extension/MIME coverage missing');
for(const [name,type] of [['lossless.flac','audio/flac'],['legacy.flac','audio/x-flac'],['unknown.FLAC',''],['generic.flac','application/octet-stream']]){
  picker.files=[{name,type}];picker.fire('change');
  if(audio.src!=='blob:track'||elements.get('trackName').textContent!==name.replace(/\.[^.]+$/,'')||elements.get('play').disabled)throw Error('FLAC must share local audio path: '+type);
}

SONORA.setShell();SONORA.setPayload(valid('apple',1,{timeline:{playing:false,position:5,duration:120,track:'a'}}));
traces.length=0;__sonoraTestDraw(16);const paused=JSON.stringify(traces.slice(0,30));
traces.length=0;__sonoraTestDraw(32);if(JSON.stringify(traces.slice(0,30))!==paused)throw Error('paused playback position changed the frame');
traces.length=0;SONORA.setPayload(valid('apple',2,{timeline:{playing:true,position:12,duration:120,track:'a'}}));__sonoraTestDraw(48);
if(JSON.stringify(traces.slice(0,30))===paused)throw Error('Apple playback position did not alter the drawing');
traces.length=0;globalThis.__sonoraReducedMotion=true;__sonoraTestDraw(64);const reduced=JSON.stringify(traces.slice(0,30));
traces.length=0;SONORA.setPayload(valid('apple',3,{timeline:{playing:true,position:18,duration:120,track:'a'}}));__sonoraTestDraw(80);
if(JSON.stringify(traces.slice(0,30))!==reduced)throw Error('reduced-motion preference did not freeze Apple timeline art');
// Both geometric instruments retain deterministic timeline/reduced-motion behavior.
for(const style of ['bloom','orbit']){
  SONORA.setStyle(style);globalThis.__sonoraReducedMotion=false;
  globalThis.__sonoraNative=valid('apple',3,{timeline:{playing:false,position:5,duration:120,track:'art-check'}});
  traces.length=0;paints.length=0;__sonoraTestDraw(81);const first=JSON.stringify(traces);
  if(!traces.length||!traces.every(point=>point.every(Number.isFinite)))throw Error(style+' has invalid geometry');
  if(style==='bloom'&&(traces.length<2000||paints.some(p=>p[0]==='fill'&&p[1]==='destination-out')))throw Error('Bloom layered geometric contours regressed');
  if(style==='orbit'&&(traces.length<6000||paints.some(p=>p[0]==='stroke'&&p[1]>3)))throw Error('Orbit fine-line geometric trajectories regressed');
  traces.length=0;__sonoraTestDraw(82);if(JSON.stringify(traces)!==first)throw Error(style+' paused timeline drifted');
  globalThis.__sonoraNative.timeline.position=12;traces.length=0;__sonoraTestDraw(83);if(JSON.stringify(traces)===first)throw Error(style+' ignores timeline');
  globalThis.__sonoraReducedMotion=true;traces.length=0;__sonoraTestDraw(84);const stillArt=JSON.stringify(traces);
  globalThis.__sonoraNative.timeline.position=18;traces.length=0;__sonoraTestDraw(85);if(JSON.stringify(traces)!==stillArt)throw Error(style+' reduced-motion drifted');
}
traces.length=0;SONORA.setPayload({mode:'spotify',generation:4});__sonoraTestDraw(96);
if(traces.length)throw Error('Spotify mode rendered a visualization');
// A sample click shares transport/analyser with local files and reports playback rejection.
elements.get('sampleTrack').fire('click');await new Promise(r=>setTimeout(r,0));
if(audio.src!=='/samples/september-14.mp3'||audio.paused||resumes!==1||elements.get('trackName').textContent!=='So1loh — September 14')throw Error('sample click did not start shared playback');
let revoked=0;URL.revokeObjectURL=()=>revoked++;picker.fire('change');elements.get('sampleTrack').fire('click');await new Promise(r=>setTimeout(r,0));
if(revoked!==1)throw Error('local blob URL was not released on source switches');
audio.play=async()=>{throw Error('blocked')};elements.get('sampleTrack').fire('click');await new Promise(r=>setTimeout(r,0));
if(elements.get('state').textContent!=='COULDN’T START PLAYBACK')throw Error('playback rejection was hidden');
console.log('PASS: FLAC extension/MIME variants share local transport; sample one-click playback, shared analyser, source switching, playback errors; native bridge validation, source isolation, permission errors, Apple timeline drawing, reduced motion, and browser local-file flow');
