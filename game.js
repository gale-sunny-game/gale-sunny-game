/* Gale & Sunny Co-op Quest
   Mobile-first top-down co-op with room code via WebSocket.
   This is a complete playable prototype with 10 levels, abilities, relic pickups, and a simple clash phase.
*/

const WS_URL = (location.hostname === 'localhost')
  ? 'ws://localhost:8080'
  : (window.WS_URL_OVERRIDE || 'wss://YOUR_RENDER_SERVICE.onrender.com'); // replace after deployment

// Canvas
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });

function resize(){
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener('resize', resize);
resize();

// UI elements
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const createBtn = document.getElementById('createBtn');
const joinBtn = document.getElementById('joinBtn');
const startBtn = document.getElementById('startBtn');
const roomInput = document.getElementById('roomInput');
const roomCodeEl = document.getElementById('roomCode');
const copyBtn = document.getElementById('copyBtn');
const isHostChk = document.getElementById('isHostChk');
const menuPanel = document.getElementById('menuPanel');
const hud = document.getElementById('hud');
const phasePill = document.getElementById('phasePill');
const objectivePill = document.getElementById('objectivePill');
const heartsEl = document.getElementById('hearts');
const relicEl = document.getElementById('relic');

function setStatus(on, text){
  statusDot.classList.toggle('on', !!on);
  statusText.textContent = text;
}

// Touch controls
const joy = document.getElementById('joy');
const knob = document.getElementById('joyKnob');
const ab1Btn = document.getElementById('ab1Btn');
const ab2Btn = document.getElementById('ab2Btn');
const intBtn = document.getElementById('intBtn');

const input = { dx:0, dy:0, ab1:false, ab2:false, interact:false };

function setKnob(nx, ny){
  const r = 56;
  knob.style.transform = `translate(calc(-50% + ${nx*r}px), calc(-50% + ${ny*r}px))`;
}
let joyActive=false, joyCenter={x:0,y:0}, joyPointerId=null;

function joyStart(e){
  if(joyActive) return;
  const t = e.changedTouches ? e.changedTouches[0] : e;
  joyActive = true;
  joyPointerId = t.identifier ?? 'mouse';
  const rect = joy.getBoundingClientRect();
  joyCenter = { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
  joyMove(e);
}
function joyMove(e){
  if(!joyActive) return;
  let t=null;
  if(e.changedTouches){
    for(const tt of e.changedTouches){
      if((tt.identifier ?? null) === joyPointerId){ t = tt; break; }
    }
  }else t=e;
  if(!t) return;
  const dx = t.clientX - joyCenter.x;
  const dy = t.clientY - joyCenter.y;
  const max = 56;
  const mag = Math.hypot(dx, dy) || 1;
  const clamped = Math.min(max, mag);
  const nx = (dx / mag) * (clamped / max);
  const ny = (dy / mag) * (clamped / max);
  input.dx = nx; input.dy = ny;
  setKnob(nx, ny);
}
function joyEnd(){
  joyActive=false; joyPointerId=null;
  input.dx=0; input.dy=0;
  setKnob(0,0);
}
joy.addEventListener('touchstart', (e)=>{ e.preventDefault(); joyStart(e); }, {passive:false});
joy.addEventListener('touchmove', (e)=>{ e.preventDefault(); joyMove(e); }, {passive:false});
joy.addEventListener('touchend', (e)=>{ e.preventDefault(); joyEnd(); }, {passive:false});
joy.addEventListener('touchcancel', (e)=>{ e.preventDefault(); joyEnd(); }, {passive:false});

function bindHold(btn, key){
  btn.addEventListener('touchstart', (e)=>{ e.preventDefault(); input[key]=true; }, {passive:false});
  btn.addEventListener('touchend', (e)=>{ e.preventDefault(); input[key]=false; }, {passive:false});
}
bindHold(ab1Btn,'ab1');
bindHold(ab2Btn,'ab2');
bindHold(intBtn,'interact');

// Network
let ws=null, clientId=null, roomCode=null, isHost=false, started=false;

function connect(){
  if(ws) return;
  setStatus(false,'connecting');
  ws = new WebSocket(WS_URL);
  ws.addEventListener('open', ()=>{
    setStatus(true,'connected');
    ws.send(JSON.stringify({type:'hello'}));
  });
  ws.addEventListener('message', (ev)=>{
    let msg; try{ msg=JSON.parse(ev.data); }catch{ return; }
    if(msg.type==='hello'){ clientId=msg.clientId; return; }
    if(msg.type==='room_created'){ roomCode=msg.roomCode; roomCodeEl.textContent=roomCode; startBtn.disabled=false; return; }
    if(msg.type==='room_joined'){ roomCode=msg.roomCode; roomCodeEl.textContent=roomCode; startBtn.disabled=!isHost; return; }
    if(msg.type==='start'){
      started=true;
      menuPanel.style.display='none';
      hud.style.display='block';
      return;
    }
    if(msg.type==='error'){ alert(msg.message||'Error'); return; }
    if(msg.type==='snapshot'){
      if(!started) return;
      applySnapshot(msg.snapshot);
      return;
    }
  });
  ws.addEventListener('close', ()=>{
    setStatus(false,'offline');
    ws=null; clientId=null; roomCode=null;
    roomCodeEl.textContent='------';
    startBtn.disabled=true;
  });
  ws.addEventListener('error', ()=> setStatus(false,'offline'));
}
function send(obj){
  if(!ws || ws.readyState!==1) return;
  ws.send(JSON.stringify(obj));
}

createBtn.addEventListener('click', ()=>{
  isHost = isHostChk.checked;
  connect();
  const t=setInterval(()=>{
    if(ws && ws.readyState===1){
      clearInterval(t);
      send({type:'create_room'});
    }
  },50);
});
joinBtn.addEventListener('click', ()=>{
  const code=(roomInput.value||'').trim();
  if(code.length!==6){ alert('Enter a 6 digit room code.'); return; }
  isHost=isHostChk.checked;
  connect();
  const t=setInterval(()=>{
    if(ws && ws.readyState===1){
      clearInterval(t);
      send({type:'join_room', roomCode: code});
    }
  },50);
});
copyBtn.addEventListener('click', async ()=>{
  if(!roomCode) return;
  try{ await navigator.clipboard.writeText(roomCode); copyBtn.textContent='Copied'; setTimeout(()=>copyBtn.textContent='Copy',900); }
  catch{ alert('Copy failed, copy manually.'); }
});
startBtn.addEventListener('click', ()=>{
  if(!roomCode) return;
  if(!isHost){ alert('Only host starts.'); return; }
  send({type:'start', roomCode});
});

// Game constants
const TILE = 44;
const CAMERA_LERP = 0.10;
const SPEED = 165;
const DASH_SPEED = 380;
const DASH_TIME = 0.18;

const TILE_COLORS = {
  0: null,       // empty
  1: '#1b2546',  // wall
  2: '#2b7cff',  // water
  3: '#ff4d6d',  // fire
  4: '#7b3ff2',  // goo
  5: '#78e6ff',  // ice
  6: '#2be090',  // exit
  7: '#ffe66d',  // key
  8: '#cbd5e1',  // door
  9: '#a78bfa',  // mirror
  10:'#ffd6ff',  // prism crystal
  11:'#111827',  // shadow gate
  12:'#fff1a8',  // light relic
  13:'#c084fc',  // dark relic
  14:'#fbbf24',  // push block light
  15:'#a3a3a3',  // push block heavy
  16:'#34d399',  // plate
  18:'#ffb4d2',  // bonus heart token
};

// Local view state
let view = {
  levelId: 1,
  phase: 'level', // 'level' or 'clash'
  objective: 'Reach the exit together',
  hearts: 0,
  relic: 'none', // none | light | dark
  camera: { x: 0, y: 0 },
  // authoritatively synced objects
  players: {
    A: { x: 0, y: 0, hp: 3, dash:0, dashT:0 },
    B: { x: 0, y: 0, hp: 3, dash:0, dashT:0 },
  },
  // dynamic tiles and objects
  grid: null,
  w: 0,
  h: 0,
  blocks: [], // {x,y,type}
  plates: {}, // key -> pressed?
  doorOpen: false,
  exitOpen: false,
  // clash
  clash: { hp: 10, wave: 1, timer: 0, enemies: [] }
};

function applySnapshot(s){
  view.levelId = s.levelId;
  view.phase = s.phase;
  view.objective = s.objective;
  view.hearts = s.hearts;
  view.relic = s.relic;
  view.players = s.players;
  view.grid = s.grid;
  view.w = s.w;
  view.h = s.h;
  view.blocks = s.blocks;
  view.plates = s.plates;
  view.doorOpen = s.doorOpen;
  view.exitOpen = s.exitOpen;
  view.clash = s.clash;

  phasePill.textContent = view.phase === 'level' ? ('Level ' + view.levelId) : ('Clash, L' + view.levelId);
  objectivePill.textContent = 'Objective: ' + view.objective;
  heartsEl.textContent = String(view.hearts);
  relicEl.textContent = view.relic;
}

function tileAt(tx, ty){
  if(tx<0||ty<0||tx>=view.w||ty>=view.h) return 1;
  return view.grid[ty*view.w + tx];
}
function isWall(t){ return t===1 || (t===8 && !view.doorOpen); }
function isHazardFor(t, who){
  // hazards are opposite elements
  if(t===2) return who==='A'; // Gale hates water
  if(t===3) return who==='B'; // Sunny hates fire
  if(t===4) return true;      // goo hurts both (slow, dmg if stand too long handled server-side)
  return false;
}

// Rendering helpers (cute "sprite-ish" blobs)
function drawChibi(x,y, who){
  const isA = who==='A';
  // body
  ctx.save();
  ctx.translate(x,y);
  // shadow
  ctx.globalAlpha=0.22;
  ctx.beginPath(); ctx.ellipse(0, 18, 16, 8, 0, 0, Math.PI*2); ctx.fillStyle='#000'; ctx.fill();
  ctx.globalAlpha=1;

  // outline
  ctx.beginPath(); ctx.arc(0,0,16,0,Math.PI*2); ctx.fillStyle = isA ? '#5cd1ff' : '#ff7eb3'; ctx.fill();
  ctx.lineWidth=2; ctx.strokeStyle='rgba(0,0,0,.25)'; ctx.stroke();

  // face icon
  ctx.font='16px system-ui';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(isA ? '🌬️' : '🔥', 0, 1);

  // little aura
  ctx.globalAlpha=0.5;
  ctx.beginPath(); ctx.arc(0,0,22,0,Math.PI*2);
  ctx.strokeStyle = isA ? 'rgba(92,209,255,.55)' : 'rgba(255,126,179,.55)';
  ctx.lineWidth=2; ctx.stroke();
  ctx.restore();
}

function worldToScreen(wx, wy){
  return { x: wx - view.camera.x + window.innerWidth/2, y: wy - view.camera.y + window.innerHeight/2 };
}

function updateCamera(){
  const a=view.players.A, b=view.players.B;
  const cx=(a.x+b.x)/2, cy=(a.y+b.y)/2;
  view.camera.x += (cx - view.camera.x) * CAMERA_LERP;
  view.camera.y += (cy - view.camera.y) * CAMERA_LERP;
}

function draw(){
  ctx.fillStyle = '#0b1020';
  ctx.fillRect(0,0,window.innerWidth,window.innerHeight);

  updateCamera();

  // background sparkles
  ctx.globalAlpha=0.08;
  for(let i=0;i<28;i++){
    const sx = (i*137) % window.innerWidth;
    const sy = (i*59) % window.innerHeight;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.globalAlpha=1;

  // draw tiles
  for(let ty=0; ty<view.h; ty++){
    for(let tx=0; tx<view.w; tx++){
      const t = tileAt(tx, ty);
      if(t===0) continue;

      const wx = tx*TILE + TILE/2;
      const wy = ty*TILE + TILE/2;
      const s = worldToScreen(wx, wy);

      // cull
      if(s.x < -TILE || s.y < -TILE || s.x > window.innerWidth+TILE || s.y > window.innerHeight+TILE) continue;

      if(t===1){
        ctx.fillStyle = '#19244a';
        ctx.fillRect(s.x-TILE/2, s.y-TILE/2, TILE, TILE);
        ctx.strokeStyle='rgba(255,255,255,.08)';
        ctx.strokeRect(s.x-TILE/2, s.y-TILE/2, TILE, TILE);
        continue;
      }

      if(t===8 && view.doorOpen) continue; // door disappears

      ctx.fillStyle = TILE_COLORS[t] || '#fff';
      ctx.globalAlpha = (t===11 && view.relic!=='dark') ? 0.55 : 1; // shadow gate dim unless dark relic obtained
      ctx.fillRect(s.x-TILE/2, s.y-TILE/2, TILE, TILE);
      ctx.globalAlpha=1;

      // small icon overlay
      ctx.font='16px system-ui';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      let icon='';
      if(t===2) icon='💧';
      if(t===3) icon='🔥';
      if(t===4) icon='🫠';
      if(t===5) icon='🧊';
      if(t===6) icon = view.exitOpen ? '💚' : '🔒';
      if(t===7) icon='🗝️';
      if(t===8) icon='🚪';
      if(t===9) icon='🪞';
      if(t===10) icon='🔆';
      if(t===11) icon='🌑';
      if(t===12) icon='✨';
      if(t===13) icon='🖤';
      if(t===14) icon='📦';
      if(t===15) icon='🪨';
      if(t===16) icon='🟩';
      if(t===18) icon='💖';
      if(icon) ctx.fillText(icon, s.x, s.y+1);
    }
  }

  // blocks
  for(const b of view.blocks){
    const wx=b.x*TILE + TILE/2, wy=b.y*TILE + TILE/2;
    const s=worldToScreen(wx,wy);
    ctx.fillStyle = b.type===14 ? '#fbbf24' : '#a3a3a3';
    ctx.fillRect(s.x-TILE/2+4, s.y-TILE/2+4, TILE-8, TILE-8);
    ctx.strokeStyle='rgba(0,0,0,.25)'; ctx.lineWidth=2;
    ctx.strokeRect(s.x-TILE/2+4, s.y-TILE/2+4, TILE-8, TILE-8);
    ctx.font='16px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='#0b1020';
    ctx.fillText(b.type===14 ? '📦' : '🪨', s.x, s.y+1);
  }

  // players
  for(const who of ['A','B']){
    const p=view.players[who];
    const s=worldToScreen(p.x,p.y);
    drawChibi(s.x,s.y,who);
  }

  // clash UI overlay on canvas (simple)
  if(view.phase==='clash'){
    ctx.fillStyle='rgba(0,0,0,.25)';
    ctx.fillRect(16, 140, 180, 38);
    ctx.fillStyle='rgba(255,255,255,.92)';
    ctx.font='14px system-ui';
    ctx.fillText('Crystal HP: ' + view.clash.hp, 26, 164);
  }
}

// Client side input sending
let lastSend=0;
function tick(now){
  draw();
  if(!started) return requestAnimationFrame(tick);

  // send input at 20hz
  if(now - lastSend >= 50){
    lastSend = now;
    send({
      type:'input',
      roomCode,
      isHost,
      input: {
        dx: input.dx, dy: input.dy,
        ab1: !!input.ab1,
        ab2: !!input.ab2,
        interact: !!input.interact
      }
    });
    // interact is one-shot
    input.interact = false;
  }

  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
