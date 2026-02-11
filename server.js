// Gale & Sunny Co-op Quest, WebSocket server
// Free-host friendly authoritative simulation with 10 levels + clash after each level.
// This is a lightweight prototype. It is designed to be expanded, not final polished production.

import http from 'http';
import crypto from 'crypto';
import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 8080;
const server = http.createServer((req,res)=>{
  res.writeHead(200, {'Content-Type':'text/plain'});
  res.end('Gale & Sunny WS server running\n');
});
const wss = new WebSocketServer({ server });

const rooms = new Map(); // code -> room

function makeCode(){
  return Math.floor(100000 + Math.random()*900000).toString();
}
function makeId(){
  return crypto.randomBytes(8).toString('hex');
}
function send(ws, obj){
  try{ ws.send(JSON.stringify(obj)); }catch{}
}
function broadcast(room, obj){
  for(const ws of room.clients.values()) send(ws, obj);
}

// Levels are embedded here to keep deployment easy.
const LEVELS = [{"id":1,"name":"Level 1","w":18,"h":14,"grid":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,1,1,1,0,1,1,1,0,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,1,1,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,1,1,1,0,1,1,1,0,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"spawnA":[2,11],"spawnB":[2,12],"objective":"Reach the exit together, unlock the door, survive the clash."},{"id":2,"name":"Level 2","w":18,"h":14,"grid":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,1,1,1,0,1,1,1,0,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,1,1,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,1,1,1,0,1,1,1,0,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"spawnA":[2,11],"spawnB":[2,12],"objective":"Reach the exit together, unlock the door, survive the clash."},{"id":3,"name":"Level 3","w":18,"h":14,"grid":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,1,1,1,0,1,1,1,0,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,9,10,0,0,0,0,0,0,1,1,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0,6,1,1,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,1,1,1,0,1,1,1,0,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,12,0,0,0,0,0,0,0,0,0,0,0,8,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"spawnA":[2,11],"spawnB":[2,12],"objective":"Reach the exit together, unlock the door, survive the clash."},{"id":4,"name":"Level 4","w":18,"h":14,"grid":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,1,1,1,0,1,1,1,0,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,9,10,0,0,0,0,0,0,1,1,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0,6,1,1,0,0,0,0,0,0,0,11,0,3,3,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,1,1,1,0,1,1,1,0,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,13,0,0,0,0,0,0,0,0,0,0,0,8,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"spawnA":[2,11],"spawnB":[2,12],"objective":"Reach the exit together, unlock the door, survive the clash."},{"id":5,"name":"Level 5","w":18,"h":14,"grid":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,1,1,1,0,1,1,1,0,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,2,2,0,0,0,0,5,5,0,0,0,1,1,0,0,0,0,0,0,0,0,9,10,0,0,0,0,0,0,1,1,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0,6,1,1,0,0,0,0,0,0,0,11,0,3,3,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,1,1,1,0,1,1,1,0,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"spawnA":[2,11],"spawnB":[2,12],"objective":"Reach the exit together, unlock the door, survive the clash."},{"id":6,"name":"Level 6","w":18,"h":14,"grid":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,1,1,1,0,1,1,1,0,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,2,2,0,0,0,0,5,5,0,0,0,1,1,0,0,0,0,0,0,0,0,9,10,0,0,0,0,0,0,1,1,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0,6,1,1,0,0,0,0,0,0,14,11,0,3,3,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,1,1,1,0,1,1,1,0,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"spawnA":[2,11],"spawnB":[2,12],"objective":"Reach the exit together, unlock the door, survive the clash."},{"id":7,"name":"Level 7","w":18,"h":14,"grid":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,1,1,1,0,1,1,1,0,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,2,2,0,0,0,0,5,5,0,0,0,1,1,0,0,0,0,0,0,15,0,9,10,0,0,0,0,0,0,1,1,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0,6,1,1,0,0,0,0,0,0,14,11,0,3,3,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,1,1,1,0,1,1,1,0,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"spawnA":[2,11],"spawnB":[2,12],"objective":"Reach the exit together, unlock the door, survive the clash."},{"id":8,"name":"Level 8","w":18,"h":14,"grid":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,1,1,1,0,1,1,1,0,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,2,2,0,0,0,0,5,5,0,0,0,1,1,0,0,0,0,16,0,15,0,9,10,0,0,0,0,0,0,1,1,0,0,0,4,4,0,0,0,0,0,0,0,16,0,0,6,1,1,0,0,0,0,0,0,14,11,0,3,3,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,1,1,1,0,1,1,1,0,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"spawnA":[2,11],"spawnB":[2,12],"objective":"Reach the exit together, unlock the door, survive the clash."},{"id":9,"name":"Level 9","w":18,"h":14,"grid":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,1,1,1,0,1,1,1,0,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,2,2,0,0,0,0,5,5,0,0,0,1,1,0,0,0,0,16,0,15,0,9,10,0,0,0,0,0,0,1,1,0,0,0,4,4,0,0,0,0,0,0,0,16,0,0,6,1,1,0,0,0,0,0,0,14,11,0,3,3,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,1,1,1,0,1,1,1,0,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,18,0,0,8,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"spawnA":[2,11],"spawnB":[2,12],"objective":"Reach the exit together, unlock the door, survive the clash."},{"id":10,"name":"Level 10","w":18,"h":14,"grid":[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,1,1,1,0,1,1,1,0,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,2,2,0,0,0,0,5,5,0,0,0,1,1,0,0,0,0,16,0,15,0,9,10,0,0,0,0,0,0,1,1,0,0,0,4,4,0,0,0,0,0,0,0,16,0,0,6,1,1,0,0,0,0,0,0,14,11,0,3,3,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1,0,1,1,1,0,1,1,1,0,1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,18,0,0,8,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],"spawnA":[2,11],"spawnB":[2,12],"objective":"Reach the exit together, unlock the door, survive the clash."}];

const TILE = 44;
const SPEED = 165;
const DASH_SPEED = 380;
const DASH_TIME = 0.18;

function deepCopy(x){ return JSON.parse(JSON.stringify(x)); }

function initLevel(levelId){
  const L = LEVELS[levelId-1];
  const grid = deepCopy(L.grid);
  const blocks=[];
  const plates={};
  // extract blocks and plates from grid into dynamic objects
  for(let y=0;y<L.h;y++){
    for(let x=0;x<L.w;x++){
      const t = grid[y*L.w+x];
      if(t===14 || t===15){ blocks.push({x,y,type:t}); grid[y*L.w+x]=0; }
      if(t===16){ plates[x+','+y]=false; }
    }
  }
  return {
    levelId,
    phase: 'level',
    objective: 'reach the exit together',
    hearts: 0,
    relic: 'none',
    w: L.w, h: L.h,
    grid,
    blocks,
    plates,
    doorOpen: false,
    exitOpen: false,
    keyTaken: false,
    players: {
      A: { x: (L.spawnA[0]+0.5)*TILE, y: (L.spawnA[1]+0.5)*TILE, vx:0, vy:0, hp:3, dashT:0, dashCD:0, pillarCD:0 },
      B: { x: (L.spawnB[0]+0.5)*TILE, y: (L.spawnB[1]+0.5)*TILE, vx:0, vy:0, hp:3, fireCD:0, waterCD:0 },
    },
    clash: { hp: 10, wave: 1, timer: 0, enemies: [] },
  };
}

function tileAt(S, tx, ty){
  if(tx<0||ty<0||tx>=S.w||ty>=S.h) return 1;
  return S.grid[ty*S.w + tx];
}

function setTile(S, tx, ty, v){
  if(tx<0||ty<0||tx>=S.w||ty>=S.h) return;
  S.grid[ty*S.w + tx] = v;
}

function isWall(S, t){ return t===1 || (t===8 && !S.doorOpen); }
function isShadowGate(t){ return t===11; }

function toTile(x){ return Math.floor(x / TILE); }
function centerOf(tx,ty){ return { x:(tx+0.5)*TILE, y:(ty+0.5)*TILE }; }

function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

function tryMove(S, p, dx, dy, who){
  // small AABB collision against walls
  const r = 14;
  let nx = p.x + dx;
  let ny = p.y + dy;

  // helper to test collision at a point
  function collides(x,y){
    const tx = toTile(x);
    const ty = toTile(y);
    const t = tileAt(S, tx, ty);
    if(isShadowGate(t)){
      // passable only if relic is dark
      return S.relic !== 'dark';
    }
    return isWall(S, t);
  }

  // x axis
  if(!collides(nx-r, p.y-r) && !collides(nx+r, p.y-r) && !collides(nx-r, p.y+r) && !collides(nx+r, p.y+r)){
    p.x = nx;
  }
  // y axis
  if(!collides(p.x-r, ny-r) && !collides(p.x+r, ny-r) && !collides(p.x-r, ny+r) && !collides(p.x+r, ny+r)){
    p.y = ny;
  }

  // bounds in level area
  p.x = clamp(p.x, TILE*1.5, TILE*(S.w-1.5));
  p.y = clamp(p.y, TILE*1.5, TILE*(S.h-1.5));
}

function dist(ax,ay,bx,by){ return Math.hypot(ax-bx, ay-by); }

function interact(S, who){
  const p = S.players[who];
  const tx = toTile(p.x);
  const ty = toTile(p.y);
  const t = tileAt(S, tx, ty);

  // key
  if(t===7 && !S.keyTaken){
    S.keyTaken = true;
    setTile(S, tx, ty, 0);
    return;
  }
  // relics
  if(t===12){ S.relic='light'; setTile(S, tx, ty, 0); return; }
  if(t===13){ S.relic='dark'; setTile(S, tx, ty, 0); return; }

  // bonus heart token
  if(t===18){ S.hearts += 1; setTile(S, tx, ty, 0); return; }

  // door unlock
  if(t===8 && S.keyTaken){
    S.doorOpen = true;
    return;
  }
  // plates (stand to press, not interact)
}

function updatePlates(S){
  for(const k of Object.keys(S.plates)){
    S.plates[k]=false;
  }
  for(const who of ['A','B']){
    const p=S.players[who];
    const tx=toTile(p.x), ty=toTile(p.y);
    const t=tileAt(S,tx,ty);
    if(t===16){
      S.plates[tx+','+ty]=true;
    }
  }
  // if all plates pressed, exit opens (late levels)
  const keys = Object.keys(S.plates);
  if(keys.length>0){
    const all = keys.every(k=>S.plates[k]===true);
    if(all) S.exitOpen = true;
  }
}

function hazardDamage(S){
  // simple hazard: if player stands on forbidden tile, push them back slightly and reduce hp (with mild cooldown handled via hp floor)
  for(const who of ['A','B']){
    const p=S.players[who];
    const tx=toTile(p.x), ty=toTile(p.y);
    const t=tileAt(S, tx, ty);
    let bad=false;
    if(t===2 && who==='A') bad=true; // Gale dislikes water
    if(t===3 && who==='B') bad=true; // Sunny dislikes fire
    if(t===4) bad=true; // goo
    if(bad){
      p.hp = Math.max(0, p.hp - 0.02); // slow drain
    }else{
      p.hp = Math.min(3, p.hp + 0.01); // slow regen
    }
  }
}

function useAbilities(S, who, inp, dt){
  const p=S.players[who];
  // Gale (A): ab1 dash, ab2 earth pillar (cooldown)
  if(who==='A'){
    p.dashCD = Math.max(0, p.dashCD - dt);
    p.pillarCD = Math.max(0, p.pillarCD - dt);

    if(inp.ab1 && p.dashCD<=0){
      p.dashT = DASH_TIME;
      p.dashCD = 0.75;
    }
    if(inp.ab2 && p.pillarCD<=0){
      const tx=toTile(p.x), ty=toTile(p.y);
      // place pillar as a temporary wall tile (works as platform blocker). only if empty
      if(tileAt(S, tx, ty)===0){
        setTile(S, tx, ty, 1);
        // remove after 4 seconds
        const removeAt = Date.now() + 4000;
        S._temp = S._temp || [];
        S._temp.push({tx,ty,removeAt});
        p.pillarCD = 3.5;
      }
    }
  }
  // Sunny (B): ab1 water jet extinguish fire in adjacent tile, ab2 fire ignite melts ice adjacent
  if(who==='B'){
    p.waterCD = Math.max(0, p.waterCD - dt);
    p.fireCD = Math.max(0, p.fireCD - dt);

    const tx=toTile(p.x), ty=toTile(p.y);
    if(inp.ab1 && p.waterCD<=0){
      // extinguish nearby fire -> becomes empty
      const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
      for(const [dx,dy] of dirs){
        const t=tileAt(S,tx+dx,ty+dy);
        if(t===3){ setTile(S,tx+dx,ty+dy,0); }
        if(t===4){ setTile(S,tx+dx,ty+dy,0); } // cleanse goo as water
      }
      p.waterCD=0.9;
    }
    if(inp.ab2 && p.fireCD<=0){
      // melt ice nearby -> empty, light torches (not implemented), warm effect
      const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
      for(const [dx,dy] of dirs){
        const t=tileAt(S,tx+dx,ty+dy);
        if(t===5){ setTile(S,tx+dx,ty+dy,0); }
      }
      p.fireCD=1.1;
    }
  }
}

function updateTemp(S){
  if(!S._temp) return;
  const now = Date.now();
  S._temp = S._temp.filter(o=>{
    if(now >= o.removeAt){
      // only remove if still wall from temp
      if(tileAt(S,o.tx,o.ty)===1) setTile(S,o.tx,o.ty,0);
      return false;
    }
    return true;
  });
}

function checkExit(S){
  if(!S.exitOpen) return false;
  // both must stand near exit tile
  let near=0;
  for(const who of ['A','B']){
    const p=S.players[who];
    const tx=toTile(p.x), ty=toTile(p.y);
    if(tileAt(S,tx,ty)===6) near++;
  }
  return near===2;
}

function enterClash(S){
  S.phase='clash';
  S.objective='defend the heart crystal together';
  S.clash = { hp: 10, wave: 1, timer: 0, enemies: [] };
}

function spawnWave(S){
  const n = 3 + S.levelId; // ramps
  for(let i=0;i<n;i++){
    S.clash.enemies.push({
      x: (2 + Math.random()* (S.w-4)) * TILE,
      y: (2 + Math.random()* (S.h-4)) * TILE,
      hp: 1 + Math.floor(S.levelId/3),
      spd: 70 + S.levelId*6
    });
  }
}

function updateClash(S, dt){
  S.clash.timer += dt;
  if(S.clash.timer > 0.8 && S.clash.enemies.length===0){
    spawnWave(S);
    S.clash.timer = 0;
    S.clash.wave += 1;
  }
  // crystal at center-ish
  const cx = (S.w/2)*TILE;
  const cy = (S.h/2)*TILE;

  // enemies move toward crystal
  for(const e of S.clash.enemies){
    const ang = Math.atan2(cy - e.y, cx - e.x);
    e.x += Math.cos(ang) * e.spd * dt;
    e.y += Math.sin(ang) * e.spd * dt;

    if(dist(e.x,e.y,cx,cy) < 30){
      S.clash.hp = Math.max(0, S.clash.hp - 0.6);
      e.hp = 0;
    }
  }

  // players damage enemies if close and using ab buttons (simple)
  for(const who of ['A','B']){
    const p=S.players[who];
    const atk = (who==='A') ? 0.9 : 0.7;
    const range = 54;
    const doing = (who==='A') ? (S._lastInputA?.ab1 || S._lastInputA?.ab2) : (S._lastInputB?.ab1 || S._lastInputB?.ab2);
    if(!doing) continue;
    for(const e of S.clash.enemies){
      if(e.hp<=0) continue;
      if(dist(p.x,p.y,e.x,e.y) < range){
        e.hp -= atk;
      }
    }
  }

  // cleanup dead enemies
  S.clash.enemies = S.clash.enemies.filter(e=>e.hp>0);

  // win condition: survive enough waves and crystal alive
  if(S.clash.hp <= 0){
    // reset level on loss
    const keepHearts = S.hearts;
    const keepRelic = 'none';
    const newS = initLevel(S.levelId);
    newS.hearts = keepHearts;
    Object.assign(S, newS);
    return;
  }
  if(S.clash.wave >= 3 + Math.floor(S.levelId/2) && S.clash.enemies.length===0){
    // beat level
    S.hearts += 2;
    const next = Math.min(10, S.levelId + 1);
    if(next !== S.levelId){
      const carryHearts = S.hearts;
      const newS = initLevel(next);
      newS.hearts = carryHearts;
      Object.assign(S, newS);
    }else{
      // finished game
      S.phase = 'level';
      S.objective = 'You did it. Happy birthday Sebas 💖';
      S.exitOpen = true;
    }
  }
}

function snapshot(S){
  return {
    levelId: S.levelId,
    phase: S.phase,
    objective: S.objective,
    hearts: Math.floor(S.hearts),
    relic: S.relic,
    w: S.w, h: S.h,
    grid: S.grid,
    blocks: S.blocks,
    plates: S.plates,
    doorOpen: S.doorOpen,
    exitOpen: S.exitOpen,
    players: {
      A: { x:S.players.A.x, y:S.players.A.y, hp:S.players.A.hp },
      B: { x:S.players.B.x, y:S.players.B.y, hp:S.players.B.hp },
    },
    clash: {
      hp: Math.floor(S.clash.hp),
      wave: S.clash.wave,
      enemies: S.clash.enemies.map(e=>({x:e.x,y:e.y,hp:e.hp}))
    }
  };
}

// Room structure
function makeRoom(code){
  return {
    code,
    hostId: null,
    clients: new Map(), // id->ws
    started:false,
    state: initLevel(1),
    lastTick: Date.now()
  };
}

function tickRoom(room){
  if(!room.started) return;
  const now = Date.now();
  const dt = Math.min(0.05, (now - room.lastTick)/1000);
  room.lastTick = now;

  const S = room.state;
  updateTemp(S);

  // Inputs cached on room state
  const inpA = S._lastInputA || {dx:0,dy:0};
  const inpB = S._lastInputB || {dx:0,dy:0};

  // movement
  for(const who of ['A','B']){
    const p=S.players[who];
    const inp = who==='A' ? inpA : inpB;

    // dash logic for Gale
    let spd = SPEED;
    if(who==='A' && p.dashT>0){
      spd = DASH_SPEED;
      p.dashT = Math.max(0, p.dashT - dt);
    }
    const vx = clamp(Number(inp.dx||0), -1, 1) * spd;
    const vy = clamp(Number(inp.dy||0), -1, 1) * spd;

    tryMove(S, p, vx*dt, vy*dt, who);

    // interact
    if(inp.interact) interact(S, who);
  }

  // abilities (use after move)
  useAbilities(S,'A', inpA, dt);
  useAbilities(S,'B', inpB, dt);

  updatePlates(S);
  hazardDamage(S);

  // exit unlock: door open if key taken and player interacts on door tile (done above)
  // exit becomes open when doorOpen OR plates all pressed (late levels)
  if(S.doorOpen) S.exitOpen = true;

  if(S.phase==='level' && checkExit(S)){
    enterClash(S);
  }else if(S.phase==='clash'){
    updateClash(S, dt);
  }

  broadcast(room, { type:'snapshot', snapshot: snapshot(S) });
}

// tick loop
setInterval(()=>{
  for(const room of rooms.values()){
    tickRoom(room);
  }
}, 50);

// WebSocket handling
wss.on('connection', (ws)=>{
  const id = makeId();
  ws.clientId = id;
  ws.roomCode = null;

  send(ws, { type:'hello', clientId: id });

  ws.on('message', (raw)=>{
    let msg; try{ msg=JSON.parse(raw.toString()); }catch{ return; }

    if(msg.type==='create_room'){
      let code = makeCode();
      while(rooms.has(code)) code = makeCode();
      const room = makeRoom(code);
      room.hostId = id;
      room.clients.set(id, ws);
      rooms.set(code, room);
      ws.roomCode = code;
      send(ws, { type:'room_created', roomCode: code });
      return;
    }

    if(msg.type==='join_room'){
      const code = (msg.roomCode || '').trim();
      const room = rooms.get(code);
      if(!room) return send(ws, { type:'error', message:'Room not found.' });
      if(room.clients.size >= 2) return send(ws, { type:'error', message:'Room is full.' });
      room.clients.set(id, ws);
      ws.roomCode = code;
      send(ws, { type:'room_joined', roomCode: code });
      broadcast(room, { type:'room_joined', roomCode: code });
      return;
    }

    if(msg.type==='start'){
      const code = (msg.roomCode || '').trim();
      const room = rooms.get(code);
      if(!room) return;
      if(id !== room.hostId) return;
      room.started = true;
      room.state = initLevel(1);
      broadcast(room, { type:'start' });
      broadcast(room, { type:'snapshot', snapshot: snapshot(room.state) });
      return;
    }

    if(msg.type==='input'){
      const code = (msg.roomCode || '').trim();
      const room = rooms.get(code);
      if(!room || !room.started) return;

      // cache per role
      if(msg.isHost){
        room.state._lastInputA = msg.input || {};
      }else{
        room.state._lastInputB = msg.input || {};
      }
      return;
    }
  });

  ws.on('close', ()=>{
    const code = ws.roomCode;
    if(!code) return;
    const room = rooms.get(code);
    if(!room) return;
    room.clients.delete(id);

    if(room.clients.size===0){
      rooms.delete(code);
      return;
    }
    if(id===room.hostId){
      broadcast(room, { type:'error', message:'Host left, room closed.' });
      for(const other of room.clients.values()){
        try{ other.close(); }catch{}
      }
      rooms.delete(code);
    }
  });
});

server.listen(PORT, ()=> console.log('WS listening on', PORT));
