/* =========================================================
   MeowBlast – + Rebind de teclas + Logros + Tienda
   (persiste en localStorage y no rompe tu lógica base)
========================================================= */ // Cabecera descriptiva del módulo: funcionalidades extra y persistencia

/* ---------- UI refs ---------- */ // Referencias a elementos del DOM usados por el juego
const canvas = document.getElementById('game'), ctx = canvas.getContext('2d'); // Canvas principal y su contexto 2D
const stage = document.getElementById('stage'); // Contenedor del escenario para overlays/controles

const hudLives = document.getElementById('lives'); // HUD: vidas
const hudLevel = document.getElementById('level'); // HUD: nivel actual
const hudMice  = document.getElementById('mice'); // HUD: bombas colocadas
const hudMiceMax = document.getElementById('miceMax'); // HUD: bombas máximas
const hudRange = document.getElementById('range'); // HUD: rango de explosión
const hudSpeed = document.getElementById('speed'); // HUD: velocidad del gato
const hudTime  = document.getElementById('time'); // HUD: tiempo restante
const hudCoins = document.getElementById('coins'); // HUD: monedas (sardinas)

const btnPause = document.getElementById('btnPause'); // Botón Pausa
const btnRestart = document.getElementById('btnRestart'); // Botón Reiniciar
const btnThemeDark = document.getElementById('btnThemeDark'); // Cambiar a tema oscuro
const btnThemeLight = document.getElementById('btnThemeLight'); // Cambiar a tema claro

const btnControls = document.getElementById('btnControls'); // Abrir modal de controles (rebind)
const btnAchievements = document.getElementById('btnAchievements'); // Abrir modal de logros

const modalPauseEl = document.getElementById('modalPause'); // Modal Pausa (elemento)
const modalLevelClearEl = document.getElementById('modalLevelClear'); // Modal Nivel superado (elemento)
const modalFinishEl = document.getElementById('modalFinish'); // Modal Resumen final (elemento)
const modalShopEl = document.getElementById('modalShop'); // Modal Tienda (elemento)
const modalControlsEl = document.getElementById('modalControls'); // Modal Controles (elemento)
const modalAchievementsEl = document.getElementById('modalAchievements'); // Modal Logros (elemento)

const levelStatsEl = document.getElementById('levelStats'); // Contenedor de estadísticas por nivel
const finalStatsEl = document.getElementById('finalStats'); // Contenedor de estadísticas finales
const finishTitleEl = document.getElementById('finishTitle'); // Título del modal de fin de partida

const banner = document.getElementById('banner'); // Banner superior animado (mensajes nivel/estado)
const bannerText = document.getElementById('bannerText'); // Texto dentro del banner

const shopCoinsEl = document.getElementById('shopCoins'); // Saldo de sardinas (tienda)

const controlsListEl = document.getElementById('controlsList'); // Lista de acciones para rebind
const btnRestoreKeys = document.getElementById('btnRestoreKeys'); // Botón restaurar teclas por defecto
const achListEl = document.getElementById('achList'); // Contenedor de tarjetas de logros

/* Volumen & toggles */ // Controles de audio y accesibilidad
const btnMute = document.getElementById('btnMute'); // Botón mute/unmute
const volRange = document.getElementById('volRange'); // Slider de volumen
const chkReduce = document.getElementById('chkReduceMotion'); // Checkbox reducir animaciones

/* Minimapa */ // Canvas del minimapa
const mini = document.getElementById('minimap'); // Canvas minimapa
const mctx = mini.getContext('2d'); // Contexto 2D minimapa

/* Táctil */ // Controles para dispositivos móviles (D-Pad y acciones)
const touchControls = document.getElementById('touchControls'); // Contenedor de controles táctiles
const dpad = document.getElementById('dpad'); // D-Pad (flechas)
const btnBomb = document.getElementById('btnBomb'); // Botón táctil para poner bomba
const btnTPause = document.getElementById('btnTPause'); // Botón táctil para pausar

/* ---------- Modales Bootstrap ---------- */ // Instancias de modales Bootstrap con opciones
const PauseModal = new bootstrap.Modal(modalPauseEl, {backdrop:'static', keyboard:false}); // Modal Pausa sin cerrar con fondo/esc
const LevelModal = new bootstrap.Modal(modalLevelClearEl, {backdrop:'static', keyboard:false}); // Modal Nivel superado
const FinishModal = new bootstrap.Modal(modalFinishEl, {backdrop:'static', keyboard:false}); // Modal Final
const ShopModal = new bootstrap.Modal(modalShopEl, {backdrop:'static', keyboard:false}); // Modal Tienda
const ControlsModal = new bootstrap.Modal(modalControlsEl, {backdrop:'static', keyboard:false}); // Modal Controles
const AchModal = new bootstrap.Modal(modalAchievementsEl, {backdrop:'static', keyboard:false}); // Modal Logros

/* ---------- Helpers & Const ---------- */ // Utilidades y constantes globales
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v)); // Limita un valor entre min y max
const dir4=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]; // Direcciones cardinales (derecha, izquierda, abajo, arriba)
const TILE=48, FUSE_MS=2000, EXP_MS=520; // Tamaño de celda, tiempo de mecha, y duración explosión

/* ---------- Preferencias (persistencia) ---------- */ // Manejo de preferencias en localStorage
const PREFS_KEY = 'meowblast_prefs_v2'; // Clave de almacenamiento local
const DEFAULT_KEYMAP = { // Mapeo por defecto de teclas de usuario
  up:'arrowup', down:'arrowdown', left:'arrowleft', right:'arrowright',
  place:'z', pause:'p', confirm:'x'
};
const DEFAULT_ACH = { // Estado inicial de logros (todos sin desbloquear)
  firstBlood:false, demolisher:false, speedRunner:false, pacifist:false, survivor:false, sardineCombo:false
};

function loadPrefs(){ // Carga preferencias desde localStorage (o objeto vacío si no hay)
  try{ return JSON.parse(localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; }
}
function savePrefs(p){ localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } // Guarda preferencias en localStorage

const prefs = Object.assign({ // Prefs por defecto + las guardadas previamente
  theme: document.documentElement.getAttribute('data-bs-theme')||'dark', // Tema inicial (del html o 'dark')
  volume:0.8, muted:false, reduce:false, // Audio y accesibilidad
  keymap: DEFAULT_KEYMAP, // Teclas
  achievements: DEFAULT_ACH // Logros
}, loadPrefs());

/* Aplica preferencias iniciales */ // Sincroniza UI con prefs al cargar
document.documentElement.setAttribute('data-bs-theme', prefs.theme); // Aplica tema
volRange.value = Math.round((prefs.volume||0.8)*100); // Slider volumen (0–100)
btnMute.textContent = prefs.muted ? '🔇' : '🔊'; // Ícono mute según estado
chkReduce.checked = !!prefs.reduce; // Checkbox reducir animaciones
document.body.classList.toggle('reduce-motion', !!prefs.reduce); // Clase CSS para reducir transiciones

/* Detecta prefers-reduced-motion */ // Respeta preferencia del SO si el usuario la tiene activada
try{
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)'); // Media query de accesibilidad
  if(mq.matches && prefs.reduce !== true){ // Si el SO pide reducir y no lo teníamos activo
    prefs.reduce = true; chkReduce.checked = true; document.body.classList.add('reduce-motion'); savePrefs(prefs); // Activa y guarda
  }
} catch {} // Silencia errores en entornos sin matchMedia

/* ---------- Hi-DPI scaling ---------- */ // Ajusta el canvas para pantallas con alta densidad (retina)
function setupHiDPI(){
  const dpr = window.devicePixelRatio || 1; // Factor de escala del dispositivo
  const cssW = 624, cssH = 528; // Tamaño CSS deseado (coincide con HTML)
  canvas.style.width = cssW+'px'; // Fija tamaño visual
  canvas.style.height = cssH+'px';
  canvas.width = Math.floor(cssW * dpr); // Ajusta resolución interna por DPR
  canvas.height = Math.floor(cssH * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0); // Escala el contexto para dibujar en “píxeles lógicos”
}
setupHiDPI(); // Ejecuta el escalado Hi-DPI al inicio

/* ---------- Tema dinámico ---------- */ // Paletas y colores dependientes del nivel/tema claro-oscuro
function themeColorsFor(level){ // Devuelve set de colores según nivel y tema
  const sets = [ // Variantes de piso y patrones por nivel
    { floor1:'#143252', floor2:'#0d2440', pattern:'stripes' },
    { floor1:'#1e3a2f', floor2:'#0f261d', pattern:'dots' },
    { floor1:'#392641', floor2:'#24182c', pattern:'diag' },
    { floor1:'#3a2f1e', floor2:'#251b12', pattern:'grid' },
    { floor1:'#242d3a', floor2:'#0f1621', pattern:'hex' },
  ];
  const base = sets[level % sets.length]; // Selección por nivel cíclico
  const dark = document.documentElement.getAttribute('data-bs-theme')!=='light'; // ¿Tema oscuro?
  const commonDark = { // Colores comunes para tema oscuro
    solid:'#5b6778', soft:'#c08a3b', softEdge:'#7a5520',
    expl:'#ff6b3d', door:'#22d3ee', doorGlow:'#22d3ee55',
    cat:'#f4a261', cat2:'#e76f51', eye:'#1b1b1b',
    dogW:'#f8fafc', dogB:'#ae7b4f', dark:'#241a16', tongue:'#f87171',
    mouse:'#ef4444', mouse2:'#ff7b7b', tail:'#fb7185',
    sardBlue:'#00d4ff', sardPurple:'#c084fc', sardGreen:'#7ee787'
  };
  const commonLight = { // Colores comunes para tema claro
    solid:'#9aa7bb', soft:'#e4b469', softEdge:'#b07b2e',
    expl:'#f97353', door:'#0ea5e9', doorGlow:'#0ea5e955',
    cat:'#f4a261', cat2:'#e76f51', eye:'#1b1b1b',
    dogW:'#ffffff', dogB:'#ae7b4f', dark:'#241a16', tongue:'#ef5f7a',
    mouse:'#ef4444', mouse2:'#f87171', tail:'#fb7185',
    sardBlue:'#0ea5e9', sardPurple:'#a78bfa', sardGreen:'#22c55e'
  };
  return dark ? {...base, ...commonDark} : {...base, ...commonLight}; // Mezcla base+tema
}
let C = themeColorsFor(0); // Paleta inicial (nivel 0)
(new MutationObserver(()=>{ C = themeColorsFor(G.level); })) // Observa cambios de atributo de tema para refrescar colores
  .observe(document.documentElement,{attributes:true,attributeFilter:['data-bs-theme']});

/* ---------- Input teclado + REBIND ---------- */ // Gestión de teclado y reasignación de teclas
const keys=new Set(); const tapped=new Set(); // Conjuntos de teclas presionadas y “tapped” (una sola vez)
let _rebindAction = null; // Acción pendiente de reasignación (esperando tecla)

function normKey(k){ return (k||'').toLowerCase(); } // Normaliza a minúsculas

window.addEventListener('keydown',e=>{ // Evento presionar tecla
  const k = normKey(e.key); // Tecla normalizada
  // rebind: captura y guarda
  if(_rebindAction){
    e.preventDefault(); // Evita comportamiento por defecto
    // evita duplicados: si misma tecla ya está asignada a otra acción, la liberamos
    for(const act of Object.keys(prefs.keymap)){
      if(act!==_rebindAction && prefs.keymap[act]===k) prefs.keymap[act]=null; // Desasigna duplicados
    }
    prefs.keymap[_rebindAction]=k; savePrefs(prefs); // Asigna y guarda
    renderControlsList(); // Refresca la lista en el modal
    _rebindAction=null; // Sale de modo rebind
    return; // No procesa como input de juego
  }

  // bloquear scroll
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault(); // Evita que flechas/espacio hagan scroll

  // Traducción: teclas de usuario -> teclas internas
  if(k===prefs.keymap.up) keys.add('arrowup'); // Mapea “up” personalizado a arrowup
  if(k===prefs.keymap.down) keys.add('arrowdown'); // …
  if(k===prefs.keymap.left) keys.add('arrowleft');
  if(k===prefs.keymap.right) keys.add('arrowright');
  if(k===prefs.keymap.place) keys.add('z'); // Acción colocar bomba
  if(k===prefs.keymap.pause) togglePause(); // Pausar juego
  if(k===prefs.keymap.confirm) modalConfirm(); // Confirmación (usada en modales)

  // Soporta también las clásicas (no molesta rebind)
  keys.add(k); // También agrega la tecla cruda (compatibilidad)
});

window.addEventListener('keyup',e=>{ // Evento soltar tecla
  const k = normKey(e.key); // Normaliza
  keys.delete(k); tapped.delete(k); // Libera en los sets
  if(k===prefs.keymap.up) keys.delete('arrowup'); // Limpia los mapeos internos
  if(k===prefs.keymap.down) keys.delete('arrowdown');
  if(k===prefs.keymap.left) keys.delete('arrowleft');
  if(k===prefs.keymap.right) keys.delete('arrowright');
  if(k===prefs.keymap.place) keys.delete('z');
});

const keyPressed=(list)=>list.some(k=>keys.has(k)); // Verdadero si alguna tecla de la lista está presionada
const keyTap=(k)=>{ if(keys.has(k)&&!tapped.has(k)){ tapped.add(k); return true; } return false; }; // Detección de “tap” (una vez)

/* ---------- WebAudio SFX con master gain ---------- */ // Generador de sonidos simples con Oscillator
class SFX{
  constructor(){ this.ctx=null; this.master=null; this._vol=clamp(prefs.volume??0.8,0,1); this._muted=!!prefs.muted; } // Inicializa volúmenes
  ensure(){
    if(!this.ctx){
      this.ctx=new (window.AudioContext||window.webkitAudioContext)(); // Crea contexto de audio
      this.master=this.ctx.createGain(); this.master.gain.value=this._muted?0:this._vol; // Ganancia maestra
      this.master.connect(this.ctx.destination); // Conecta a salida
    }
  }
  setVolume(v){ this._vol=clamp(v,0,1); if(this.master) this.master.gain.value=this._muted?0:this._vol; } // Ajusta volumen master
  setMuted(m){ this._muted=!!m; if(this.master) this.master.gain.value=this._muted?0:this._vol; } // Mute on/off
  blip(f1,f2,t=0.12,type='sine',gain=0.06){ // Genera un “blip” paramétrico
    this.ensure(); const o=this.ctx.createOscillator(), g=this.ctx.createGain(); // Oscilador + ganancia
    o.type=type; o.frequency.value=f1; const now=this.ctx.currentTime; // Tipo y frecuencia inicial
    o.frequency.linearRampToValueAtTime(f2, now+t*0.8); // Barrido de frecuencia
    g.gain.value=gain; g.gain.exponentialRampToValueAtTime(0.0001, now+t); // Decaimiento exponencial
    o.connect(g).connect(this.master); o.start(); o.stop(now+t); // Conexión y ciclo de vida
  }
  place(){ this.blip(520,440,0.1,'square',0.06); } // SFX colocar bomba
  explode(){ this.blip(160,60,0.22,'sawtooth',0.09); } // SFX explosión
  pickup(){ this.blip(660,880,0.12,'triangle',0.06); } // SFX recoger item
  hit(){ this.blip(220,140,0.14,'square',0.08); } // SFX golpe/daño
  win(){ this.blip(740,980,0.18,'triangle',0.07); } // SFX victoria
  lose(){ this.blip(200,80,0.3,'sawtooth',0.09); } // SFX derrota
  ui(){ this.blip(440,520,0.08,'triangle',0.05); } // SFX interfaz
}
const S = new SFX(); // Instancia global de sonidos

/* ---------- Estado Global ---------- */ // Variables de estado de la partida
const INIT_TIME=180; // Tiempo inicial por nivel
const G={ // Objeto de estado global del juego
  level:0,lives:3,maxMice:1,speed:1.0,range:2, // Parámetros del jugador
  paused:false,ended:false,stats:[], timeLeft:INIT_TIME, // Flags, estadísticas y tiempo
  coins:0,                // 🐟 acumuladas (sardinas recogidas)
  lvlDogKills:0,         // para logros de nivel
  lvlSardines:0,
  lvlBlocks:0
};

/* ---------- Gamepad ---------- */ // Soporte básico de gamepad (ejes y botones)
let _gpLast = 0; // Timestamp del último pulso de entrada
function pollGamepad(now){ // Revisión periódica del estado del gamepad
  const pads = navigator.getGamepads ? navigator.getGamepads() : []; // Lee gamepads
  let gp = null; // Selecciona el primero conectado
  for(const p of pads){ if(p && p.connected){ gp=p; break; } }
  if(!gp) return; // Si no hay, salimos
  const dt = now - (_gpLast||0); // Delta de tiempo desde último pulso
  const step = 150; // Intervalo mínimo entre pasos (ms)
  const axX = gp.axes[0]||0, axY = gp.axes[1]||0; // Ejes analógicos principales
  const btn = (i)=>gp.buttons[i] && gp.buttons[i].pressed; // Helper: botón presionado
  const dUp=btn(12), dDown=btn(13), dLeft=btn(14), dRight=btn(15); // D-Pad digital
  const aUp=axY<-0.5, aDown=axY>0.5, aLeft=axX<-0.5, aRight=axX>0.5; // Umbral de ejes
  if(dt>step){ // Si pasó el tiempo mínimo, inyecta “pulsos” de flechas
    if(dUp||aUp) keys.add('arrowup');
    if(dDown||aDown) keys.add('arrowdown');
    if(dLeft||aLeft) keys.add('arrowleft');
    if(dRight||aRight) keys.add('arrowright');
    _gpLast = now; // Actualiza marca
    setTimeout(()=>{ keys.delete('arrowup'); keys.delete('arrowdown'); keys.delete('arrowleft'); keys.delete('arrowright'); }, 60); // Libera después de 60ms
  }
  if(btn(0)) { keys.add('z'); setTimeout(()=>keys.delete('z'), 60); }   // A = bomba (tap corto)
  if(btn(9)) { togglePause(); }                                        // START = pausa
}
/* ---------- Niveles (idénticos) ---------- */
const LEVELS=[
  { time:180,start:{c:1,r:1},door:{c:10,r:9},
    dogs:[{c:11,r:1},{c:11,r:9}],
    sardines:[{c:3,r:3,t:'range'},{c:5,r:7,t:'speed'}],
    tiles:[
      "SSSSSSSSSSSSS","S.B.B.B...B.S","S.B.S.B.B.S.S","S...B...B...S","S.B.S.B.S.B.S",
      "S...B...B...S","S.B.S.B.S.B.S","S...B...B...S","S.B.S.B.B.S.S","S.B.B.B.D.B.S","SSSSSSSSSSSSS"
    ]},
  { time:160,start:{c:1,r:1},door:{c:6,r:9},
    dogs:[{c:11,r:1},{c:11,r:9},{c:6,r:5}],
    sardines:[{c:4,r:3,t:'max'},{c:9,r:7,t:'range'}],
    tiles:[
      "SSSSSSSSSSSSS","S.B.BBB.B.B.S","S.B.S...S.B.S","S...BBB...B.S","S.B.S.S.S.B.S",
      "S.B...B...B.S","S.B.S.S.S.B.S","S.B...BBB...S","S.B.S...S.B.S","S.B.B.DB.B.BS","SSSSSSSSSSSSS"
    ]},
  { time:150,start:{c:1,r:1},door:{c:6,r:8},
    dogs:[{c:11,r:1},{c:11,r:9},{c:1,r:9},{c:6,r:1}],
    sardines:[{c:3,r:5,t:'speed'},{c:9,r:5,t:'range'},{c:6,r:9,t:'max'}],
    tiles:[
      "SSSSSSSSSSSSS","S.B.BBB...B.S","S.B.SSS.B.B.S","S...B...B...S","S.B.B.SSS.B.S",
      "S...B...B...S","S.B.SSS.B.B.S","S...B...B...S","S.B.SDB.B.B.S","S...BBB...B.S","SSSSSSSSSSSSS"
    ]},
  { time:140,start:{c:1,r:1},door:{c:2,r:9},
    dogs:[{c:11,r:1},{c:11,r:9},{c:1,r:9},{c:6,r:1},{c:6,r:9}],
    sardines:[{c:4,r:4,t:'range'},{c:8,r:6,t:'speed'},{c:6,r:5,t:'max'}],
    tiles:[
      "SSSSSSSSSSSSS","S.BBB.BBB.B.S","S.B.S...S.B.S","S...BBB...B.S","S.B.SSS.S.B.S",
      "S.B...B...B.S","S.B.SSS.S.B.S","S.B...BBB...S","SDB.S...S.B.S","S.BBB.BBB.B.S","SSSSSSSSSSSSS"
    ]},
  { time:130,start:{c:1,r:1},door:{c:10,r:1},
    dogs:[{c:11,r:1},{c:11,r:9},{c:1,r:9},{c:6,r:1},{c:6,r:9},{c:3,r:7}],
    sardines:[{c:5,r:5,t:'range'},{c:7,r:5,t:'max'},{c:6,r:8,t:'speed'}],
    tiles:[
      "SSSSSSSSSSSSS","S.BBBBB.BB..S","S.B.SSS.S.B.S","S...B.B...B.S","S.SSB.S.BSS.S",
      "S...B...B...S","S.SSB.S.BSS.S","S...B.B...B.S","S.B.SSS.S.B.S","S..BB.BBDBB.S","SSSSSSSSSSSSS"
    ]}
];

/* ---------- Mundo (añade contadores para logros/coins) ---------- */
let world=null, last=performance.now();
let FX = { shake:0, flash:0 };

class World{
  constructor(def){
    this.cols=def.tiles[0].length; this.rows=def.tiles.length;
    this.grid=def.tiles.map(r=>r.split(''));
    this.player=new Cat(def.start.c, def.start.r);
    this.dogs=def.dogs.map(d=>new Dog(d.c,d.r));
    this.sardines=def.sardines.map(s=>new Sardine(s.c,s.r,s.t));
    this.mice=[]; this.explosions=[];
    this.blocksBroken=0; this.dogsKilled=0; this.sardinesTaken=0;
    G.timeLeft=def.time;
    G.lvlDogKills=0; G.lvlSardines=0; G.lvlBlocks=0;

    this.door={c:def.door.c,r:def.door.r,covered:true,open:false,pulse:0};
    if(this.grid[this.door.r][this.door.c] !== 'B') this.door.covered=false;
  }
  inside(c,r){return c>=0&&r>=0&&c<this.cols&&r<this.rows;}
  solid(c,r){return this.grid[r][c]==='S';}
  soft(c,r){return this.grid[r][c]==='B';}
  walkable(c,r){
    if(!this.inside(c,r)) return false;
    if(this.solid(c,r) || this.soft(c,r)) return false;
    if(this.mice.some(m=>m.c===c&&m.r===r)) return false;
    return true;
  }
  placeMouse(c,r){
    if(this.mice.length>=G.maxMice) return;
    if(!this.inside(c,r)||this.solid(c,r)||this.soft(c,r)) return;
    if(this.mice.some(m=>m.c===c&&m.r===r)) return;
    this.mice.push(new MouseBomb(c,r,performance.now())); S.place();
  }
  chainDetonateAt(c,r){ for(const b of this.mice){ if(!b.dead && b.c===c && b.r===r) b.forceExplode=true; } }
  explode(bomb){
    const seg=[{c:bomb.c,r:bomb.r}];
    const push=(dx,dy)=>{
      for(let i=1;i<=G.range;i++){
        const c=bomb.c+dx*i,r=bomb.r+dy*i;
        if(!this.inside(c,r)) break;
        if(this.solid(c,r)) break;
        seg.push({c,r});
        this.chainDetonateAt(c,r);
        if(this.soft(c,r)){
          this.grid[r][c]='.'; this.blocksBroken++; G.lvlBlocks++;
          if(c===this.door.c && r===this.door.r) this.door.covered=false;
          break;
        }
      }
    };
    push(1,0); push(-1,0); push(0,1); push(0,-1);
    this.explosions.push(new Explosion(seg,performance.now()));
    S.explode();
  }
  update(dt){
    if(!G.paused && !G.ended){
      G.timeLeft -= dt/1000;
      if(G.timeLeft <= 0){
        G.timeLeft = 0;
        gameOver(false); S.lose();
        showBanner('¡Tiempo agotado!', 'danger');
        return;
      }
    }
    const hitIfDogTouchesCat = () => {
      for(const d of this.dogs){
        if(!d.dead && d.c === this.player.c && d.r === this.player.r && !this.player.invul){
          this.player.hit(); S.hit(); showBanner('-1 vida','danger',600);
          break;
        }
      }
    };
    this.player.update(this, dt);
    hitIfDogTouchesCat();
    for(const d of this.dogs) d.update(this, dt);
    for(const m of this.mice) m.update(this, dt, this);
    for(const m of this.mice.filter(m => m.dead && !m.exploded)){
      m.exploded = true; this.explode(m);
    }
    this.mice = this.mice.filter(m => !m.dead || !m.explodedConsumed);
    for(const e of this.explosions){
      for(const s of e.segs){
        for(const d of this.dogs){
          if(!d.dead && d.c === s.c && d.r === s.r){ d.dead = true; this.dogsKilled++; G.lvlDogKills++; unlockAch('firstBlood'); }
        }
        if(this.player.c === s.c && this.player.r === s.r && !this.player.invul){
          this.player.hit(); S.hit(); showBanner('-1 vida','danger',600);
        }
      }
      e.update(dt);
    }
    this.explosions = this.explosions.filter(x => !x.done);
    hitIfDogTouchesCat();
    this.sardines = this.sardines.filter(s => {
      if(s.c === this.player.c && s.r === this.player.r){
        if(s.t === 'range') G.range = Math.min(G.range + 1, 8);
        if(s.t === 'max')   G.maxMice = Math.min(G.maxMice + 1, 8);
        if(s.t === 'speed') G.speed  = Math.min(G.speed  + 0.2, 2.0);
        this.sardinesTaken++; G.coins++; G.lvlSardines++; hudCoins.textContent=G.coins;
        S.pickup(); showBanner('¡Sardina! +1 🐟','info',500);
        return false;
      }
      return true;
    });
    if(this.dogs.every(d => d.dead)) this.door.open = true;
    if(this.door.open && !this.door.covered &&
       this.player.c === this.door.c && this.player.r === this.door.r){
      S.win(); levelClear(this);
    }
    if(this.door.open && !this.door.covered) this.door.pulse += dt * 0.006;

    // Logro: demoliciones (20 cajas totales en la partida)
    if((G.stats.reduce((a,s)=>a+(s?.blocksBroken||0),0) + this.blocksBroken) >= 20) unlockAch('demolisher');
  }
  draw(){
    if(FX.shake>0){ const dx=(Math.random()*2-1)*FX.shake, dy=(Math.random()*2-1)*FX.shake; ctx.save(); ctx.translate(dx,dy); FX.shake*=0.85; }
    // fondo
    for(let r=0;r<this.rows;r++){
      for(let c=0;c<this.cols;c++){
        const x=c*TILE, y=r*TILE;
        const g=ctx.createLinearGradient(x,y,x,y+TILE);
        g.addColorStop(0,C.floor1); g.addColorStop(1,C.floor2);
        ctx.fillStyle=g; ctx.fillRect(x,y,TILE,TILE);
        ctx.save(); ctx.globalAlpha=.06; ctx.fillStyle='#fff';
        if(C.pattern==='stripes') ctx.fillRect(x, y+(c%2?8:0), TILE, 6);
        else if(C.pattern==='dots'){ for(let yy=y+6; yy<y+TILE; yy+=12) for(let xx=x+6; xx<x+TILE; xx+=12) ctx.fillRect(xx,yy,2,2); }
        else if(C.pattern==='diag'){ ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x-8,y+8); ctx.lineTo(x+TILE+8,y+8); ctx.stroke(); }
        else if(C.pattern==='grid'){ ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.strokeRect(x+4,y+4,TILE-8,TILE-8); }
        else if(C.pattern==='hex'){ ctx.beginPath(); ctx.arc(x+TILE/2,y+TILE/2,10,0,Math.PI*2); ctx.fill(); }
        ctx.restore();
        if((r+c)%7===0){
          ctx.save(); ctx.globalAlpha=.08; ctx.fillStyle='#fff';
          ctx.beginPath(); ctx.arc(x+TILE/2,y+TILE/2,6,0,Math.PI*2); ctx.fill();
          ctx.restore();
        }
      }
    }
    // tiles
    for(let r=0;r<this.rows;r++){
      for(let c=0;c<this.cols;c++){
        const x=c*TILE,y=r*TILE,t=this.grid[r][c];
        if(t==='S'){
          rounded(x+3,y+3,TILE-6,TILE-6,6,true,'#5b6778');
          ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=2; ctx.strokeRect(x+3.5,y+3.5,TILE-7,TILE-7);
          ctx.strokeStyle='rgba(255,255,255,.08)'; ctx.lineWidth=1;
          for(let yy=y+10; yy<y+TILE-6; yy+=10){ ctx.beginPath(); ctx.moveTo(x+6,yy); ctx.lineTo(x+TILE-6,yy); ctx.stroke(); }
        } else if(t==='B'){
          rounded(x+4,y+4,TILE-8,TILE-8,6,true,C.soft);
          ctx.strokeStyle=C.softEdge; ctx.lineWidth=2; rounded(x+4,y+4,TILE-8,TILE-8,6,false);
          ctx.strokeStyle='rgba(0,0,0,.15)'; ctx.lineWidth=2;
          for(let k=0;k<4;k++){ ctx.beginPath(); ctx.moveTo(x+6+k*8,y+6); ctx.lineTo(x+TILE-6,y+TILE-6-k*8); ctx.stroke(); }
        }
      }
    }
    // puerta
    if(!this.door.covered){
      const x=this.door.c*TILE,y=this.door.r*TILE,p=this.door.open?(Math.sin(this.door.pulse)*0.25+0.75):0.6;
      rounded(x+10,y+10,TILE-20,TILE-20,8,true,C.door);
      ctx.fillStyle='rgba(0,0,0,.35)'; ctx.fillRect(x+20,y+18,8,20);
      ctx.fillStyle='rgba(255,255,255,.85)'; ctx.fillRect(x+26,y+18,8,20);
      ctx.save(); ctx.globalAlpha=0.35*p; ctx.strokeStyle=C.doorGlow; ctx.lineWidth=6; ctx.strokeRect(x+9,y+9,TILE-18,TILE-18); ctx.restore();
      if(!this.door.open){ ctx.fillStyle='rgba(0,0,0,.38)'; rounded(x+10,y+10,TILE-20,TILE-20,8,true); }
    }
    // entidades
    for(const b of this.mice) b.draw();
    for(const s of this.sardines) s.draw();
    for(const d of this.dogs) if(!d.dead) d.draw();
    this.player.draw();
    for(const e of this.explosions) e.draw();

    if(FX.shake>0.1) ctx.restore(); else FX.shake=0;
    if(FX.flash>0){ ctx.save(); ctx.globalAlpha=Math.min(0.25, FX.flash/300); ctx.fillStyle='#ff0000'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.restore(); FX.flash-=16; }

    drawMinimap(this);
  }
}

/* ---- Entidades base ---- */
class Cat{
  constructor(c,r){ this.c=c; this.r=r; this.moveCD=0; this.invul=0; this.anim=0; }
  hit(){ if(G.ended) return; G.lives--; this.invul=1000; FX.shake=10; FX.flash=180; if(G.lives<=0){ gameOver(false); S.lose(); showBanner('GAME OVER', 'danger', 1400); } updateHUD(); }
  update(world,dt){
    if(G.paused||G.ended) return;
    if(this.invul>0) this.invul-=dt;
    this.moveCD-=dt; this.anim+=dt;
    const moveMs=120/ G.speed;
    const mv=(dx,dy)=>{ if(this.moveCD>0) return; const nc=this.c+dx,nr=this.r+dy; if(world.walkable(nc,nr)){ this.c=nc; this.r=nr; this.moveCD=moveMs; } };
    if(keyPressed(['arrowup','w'])) mv(0,-1);
    else if(keyPressed(['arrowdown','s'])) mv(0,1);
    else if(keyPressed(['arrowleft','a'])) mv(-1,0);
    else if(keyPressed(['arrowright','d'])) mv(1,0);
    if(keyTap('z')) world.placeMouse(this.c,this.r);
  }
  draw(){
    const x=this.c*TILE, y=this.r*TILE, t=this.anim*0.006;
    const BODY = C.cat, SHADOW=C.cat2, EYE=C.eye, BELLY='#ffd6a5';
    ctx.fillStyle='rgba(0,0,0,.20)'; rounded(x+10,y+32,TILE-20,8,6,true);
    circ(x+TILE/2, y+18, 12, true, BODY);
    ctx.save(); ctx.translate(0, Math.sin(t)*0.6);
    ctx.fillStyle=BODY; tri(x+18,y+8, x+22,y+2, x+24,y+12); tri(x+TILE-18,y+8, x+TILE-22,y+2, x+TILE-24,y+12); ctx.restore();
    ellipse(x+TILE/2, y+30, 14, 12, true, BODY); ellipse(x+TILE/2, y+30, 10, 8, true, BELLY);
    circ(x+26, y+16, 3.8, true, EYE); circ(x+TILE-26, y+16, 3.8, true, EYE);
    circ(x+24.7, y+15.2, 1.1, true, '#fff'); circ(x+TILE-27.3, y+15.2, 1.1, true, '#fff');
    ctx.fillStyle=EYE; ctx.fillRect(x+TILE/2-1, y+18, 2, 2);
    ctx.beginPath(); ctx.moveTo(x+TILE/2-3,y+20); ctx.quadraticCurveTo(x+TILE/2,y+22,x+TILE/2+3,y+20); ctx.strokeStyle=EYE; ctx.lineWidth=1.5; ctx.stroke();
    ctx.strokeStyle=SHADOW; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(x+TILE/2,y+10); ctx.lineTo(x+TILE/2,y+6);
    ctx.moveTo(x+22,y+24); ctx.lineTo(x+18,y+26);
    ctx.moveTo(x+TILE-22,y+24); ctx.lineTo(x+TILE-18,y+26); ctx.stroke();
    const sway = Math.sin(t*1.5)*3;
    ctx.save(); ctx.translate(0,sway);
    rounded(x+TILE-10,y+20,8,20,4,true,BODY);
    ctx.fillStyle=SHADOW; rounded(x+TILE-10,y+22,8,4,2,true);
    ctx.fillStyle=SHADOW; rounded(x+TILE-10,y+30,8,4,2,true);
    ctx.restore();
  }
}
class Dog{
  constructor(c,r){ this.c=c; this.r=r; this.dir=dir4[Math.floor(Math.random()*4)]; this.cd=0; this.dead=false; this.anim=0; }
  update(world,dt){
    if(this.dead || G.paused || G.ended) return;
    this.anim += dt; this.cd = Math.max(0, (this.cd||0) - dt);
    if(this.c===world.player.c && this.r===world.player.r && !world.player.invul){
      world.player.hit(); S.hit(); showBanner('-1 vida','danger',600);
    }
    if(this.cd>0) return;
    const stepMs = 160;
    const opts=[];
    for(const d of dir4){
      const nc=this.c+d.x, nr=this.r+d.y;
      const cellFree = world.walkable(nc,nr);
      const isPlayer = (nc===world.player.c && nr===world.player.r);
      if(cellFree || isPlayer) opts.push(d);
    }
    const back={x:-this.dir.x,y:-this.dir.y};
    const cand=opts.length>1?opts.filter(o=>!(o.x===back.x&&o.y===back.y)):opts;
    this.dir = cand.length? cand[Math.floor(Math.random()*cand.length)] : back;
    const nc=this.c+this.dir.x, nr=this.r+this.dir.y;
    const canStep = world.walkable(nc,nr) || (nc===world.player.c && nr===world.player.r);
    if(canStep){ this.c=nc; this.r=nr; }
    this.cd = stepMs;
    if(this.c===world.player.c && this.r===world.player.r && !world.player.invul){
      world.player.hit(); S.hit(); showBanner('-1 vida','danger',600);
    }
  }
  draw(){
    const x=this.c*TILE, y=this.r*TILE, wag=Math.sin(this.anim*0.01)*2;
    ctx.fillStyle='rgba(0,0,0,.18)'; rounded(x+10,y+34,TILE-22,8,6,true);
    rounded(x+10,y+16,TILE-20,TILE-22,12,true,C.dogW);
    rounded(x+16,y+6,TILE-32,18,8,true,C.dogW);
    rounded(x+16,y+6,10,10,3,true,C.dogB);
    rounded(x+TILE-26,y+6,10,10,3,true,C.dogB);
    rounded(x+18,y+10,14,10,6,true,C.dogB);
    circ(x+26,y+14,2.2,true,C.dark); circ(x+TILE-26,y+14,2.2,true,C.dark);
    rounded(x+TILE/2-7, y+14, 14, 10, 5, true, C.dogW);
    circ(x+TILE/2, y+16, 2.2, true, C.dark);
    rounded(x+TILE/2-3, y+20, 6, 4, 2, true, C.tongue);
    rounded(x+TILE-10,y+22+wag,6,14,3,true,C.dogB);
  }
}
class Sardine{
  constructor(c,r,t){ this.c=c; this.r=r; this.t=t; }
  draw(){
    const x=this.c*TILE+8,y=this.r*TILE+12,color=this.t==='range'?C.sardBlue:this.t==='max'?C.sardPurple:C.sardGreen;
    rounded(x,y,32,24,6,true,color);
    ctx.fillStyle='rgba(0,0,0,.25)'; rounded(x+6,y+6,20,12,4,true);
    ctx.fillStyle='rgba(255,255,255,.92)'; ctx.font='bold 12px system-ui,Inter,Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(this.t==='range'?'R':this.t==='max'?'M':'V', x+16, y+12);
  }
}
class MouseBomb{
  constructor(c,r,placed){ this.c=c; this.r=r; this.placed=placed; this.dead=false; this.exploded=false; this.explodedConsumed=false; this.forceExplode=false; }
  update(world,dt){ if(this.dead||G.paused||G.ended) return; const now=performance.now(); if(this.forceExplode || now-this.placed>=FUSE_MS) this.dead=true; }
  draw(){
    const x=this.c*TILE,y=this.r*TILE,t=(performance.now()-this.placed)/FUSE_MS, blink=(Math.sin(t*12*Math.PI)*0.5+0.5)*0.35+0.65;
    const RED=C.mouse, DARK='#7f1d1d', FIN='#b91c1c';
    ctx.fillStyle='rgba(0,0,0,.20)'; rounded(x+12,y+30,TILE-24,8,4,true);
    ctx.globalAlpha=blink; ellipse(x+TILE/2, y+24, 14, 10, true, RED); ctx.globalAlpha=1;
    ctx.fillStyle=FIN; tri(x+TILE-14, y+24, x+TILE-6, y+18, x+TILE-6, y+30); tri(x+TILE-18, y+24, x+TILE-10, y+20, x+TILE-10, y+28);
    tri(x+TILE/2-4, y+20, x+TILE/2+4, y+20, x+TILE/2, y+14);
    circ(x+TILE/2-10, y+22, 2.2, true, '#fff'); circ(x+TILE/2-10, y+22, 1.2, true, '#111');
    ctx.strokeStyle=DARK; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x+TILE/2-4, y+26, 3, Math.PI*0.2, Math.PI*0.8); ctx.stroke();
  }
}
class Explosion{
  constructor(segs,born){ this.segs=segs; this.born=born; this.done=false; }
  update(){ if(performance.now()-this.born>EXP_MS) this.done=true; }
  draw(){
    const age=performance.now()-this.born, a=1-(age/EXP_MS);
    for(const s of this.segs){
      const x=s.c*TILE,y=s.r*TILE;
      ctx.globalAlpha=clamp(a*0.45,0,1); ctx.fillStyle='rgba(255,210,120,.9)'; rounded(x+4,y+4,TILE-8,TILE-8,8,true);
      ctx.globalAlpha=clamp(a,0,1); ctx.fillStyle=C.expl; rounded(x+10,y+10,TILE-20,TILE-20,6,true);
      ctx.globalAlpha=1;
    }
  }
}

/* ---- draw helpers ---- */
function rounded(x,y,w,h,r,fill=true,color){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); if(color) ctx.fillStyle=color; if(fill) ctx.fill(); else ctx.stroke(); }
function tri(x1,y1,x2,y2,x3,y3){ ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.closePath(); ctx.fill(); }
function circ(x,y,r, fill=true, color){ if(color) ctx.fillStyle=color; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); if(fill) ctx.fill(); else ctx.stroke(); }
function ellipse(x,y,rx,ry, fill=true, color){ if(color) ctx.fillStyle=color; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2); if(fill) ctx.fill(); else ctx.stroke(); }

/* ---------- HUD / Loop ---------- */
function startLevel(idx){
  const def=LEVELS[idx];
  C = themeColorsFor(idx);
  world=new World(def);
  G.level=idx; G.ended=false; G.paused=false;
  if(!prefs.reduce) { stage.classList.add('start-spin'); setTimeout(()=>stage.classList.remove('start-spin'), 650); }
  showBanner(`Nivel ${idx+1}`, 'primary', 900);
  updateHUD(def.time);
}
function updateHUD(timeOverride){
  hudLives.textContent=G.lives;
  hudLevel.textContent=G.level+1;
  hudMice.textContent=world?world.mice.length:0;
  hudMiceMax.textContent=G.maxMice;
  hudRange.textContent=G.range;
  hudSpeed.textContent=G.speed.toFixed(1);
  hudTime.textContent=Math.ceil(timeOverride ?? G.timeLeft);
  hudCoins.textContent=G.coins;
  hudLives.classList.add('pulse-life'); setTimeout(()=>hudLives.classList.remove('pulse-life'),250);
}
function loop(now){
  const dt=now-last; last=now;
  if(world && !G.paused && !G.ended) world.update(dt);
  if(world) world.draw();
  updateHUD();
  pollGamepad(now);
  requestAnimationFrame(loop);
}

/* ---- Win/Lose + TIENDA + LOGROS ---- */
function levelClear(w){
  if(G.ended) return;
  G.paused=true;

  // Logros por nivel:
  if(G.timeLeft >= 60) unlockAch('speedRunner');
  if(G.lvlDogKills === 0) unlockAch('pacifist');
  if(G.lvlSardines >= 3) unlockAch('sardineCombo');

  G.stats[G.level]={ level:G.level+1, time:Math.ceil(G.timeLeft), dogsKilled:w.dogsKilled, blocksBroken:w.blocksBroken, sardines:w.sardinesTaken };
  showBanner('¡Nivel superado!', 'success', 1200);

  levelStatsEl.innerHTML=`<div class="table-responsive"><table class="table table-sm table-borderless mb-2">
    <tr><th>Nivel</th><td>${G.level+1}/5</td></tr>
    <tr><th>Tiempo restante</th><td>${Math.ceil(G.timeLeft)}s</td></tr>
    <tr><th>Perros eliminados</th><td>${w.dogsKilled}</td></tr>
    <tr><th>Cajas destruidas</th><td>${w.blocksBroken}</td></tr>
    <tr><th>Sardinas</th><td>${w.sardinesTaken} (+${w.sardinesTaken} 🐟)</td></tr></table></div>
    <div class="small text-secondary">Saldo actual: <b>${G.coins}</b> 🐟</div>`;
  setTimeout(()=>LevelModal.show(), 250);
}
function nextLevelOrFinish(){
  LevelModal.hide();
  if(G.level<LEVELS.length-1){ G.paused=false; startLevel(G.level+1); }
  else{ if(G.lives===1) unlockAch('survivor'); finishRun(true); }
}
function gameOver(won){ if(G.ended) return; if(G.lives===1) unlockAch('survivor'); finishRun(won); }
function finishRun(won){
  G.ended=true; G.paused=true;
  finishTitleEl.textContent = won? '¡Has terminado! 🏁' : 'Game Over';
  const rows=(G.stats||[]).map(s=>`<tr><td>${s.level}</td><td>${s.time}s</td><td>${s.dogsKilled}</td><td>${s.blocksBroken}</td><td>${s.sardines}</td></tr>`).join('') || '<tr><td colspan="5" class="text-center">Sin datos</td></tr>';
  finalStatsEl.innerHTML=`<div class="table-responsive"><table class="table table-striped">
    <thead><tr><th>Nivel</th><th>Tiempo</th><th>Perros</th><th>Cajas</th><th>Sardinas</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="mb-0"><b>Vidas:</b> ${G.lives} &nbsp; • &nbsp; <b>Sardinas totales:</b> ${G.coins} 🐟</p>`;
  FinishModal.show(); S.ui();
  showBanner(won?'¡Victoria!':'GAME OVER', won?'success':'danger', 1500);
}

/* ---- Pausa/Modales/Acciones ---- */
function togglePause(){ if(G.ended) return; G.paused=!G.paused; if(G.paused){ PauseModal.show(); S.ui(); showBanner('Pausa', 'secondary', 600); } else { PauseModal.hide(); S.ui(); } }
function modalConfirm(){
  if(modalLevelClearEl.classList.contains('show')) { nextLevelOrFinish(); return; }
  if(modalFinishEl.classList.contains('show')) { restartGame(); return; }
  if(modalPauseEl.classList.contains('show')) { togglePause(); return; }
}
function restartGame(){
  FinishModal.hide();
  G.lives=3; G.maxMice=1; G.speed=1.0; G.range=2; G.stats=[]; G.ended=false; G.paused=false; G.coins=0;
  startLevel(0);
}
btnPause.addEventListener('click',togglePause);
btnRestart.addEventListener('click',restartGame);
document.addEventListener('click',(e)=>{
  const act=e.target?.getAttribute?.('data-modal-action'); if(!act) return;
  if(act==='resume') togglePause();
  if(act==='next') nextLevelOrFinish();
  if(act==='finish'){ FinishModal.show(); LevelModal.hide(); S.ui(); }
  if(act==='restart') restartGame();
  if(act==='shop'){ // abrir tienda
    LevelModal.hide();
    shopCoinsEl.textContent = G.coins;
    ShopModal.show();
  }
  if(act==='next-from-shop'){ ShopModal.hide(); nextLevelOrFinish(); }
});
btnThemeDark.addEventListener('click',()=>{ document.documentElement.setAttribute('data-bs-theme','dark'); prefs.theme='dark'; savePrefs(prefs); });
btnThemeLight.addEventListener('click',()=>{ document.documentElement.setAttribute('data-bs-theme','light'); prefs.theme='light'; savePrefs(prefs); });

/* ---------- Banner ---------- */
let bannerTimer=null;
function showBanner(text, type='primary', ms=1000){
  bannerText.textContent = text;
  banner.classList.remove('hidden');
  const bg = type==='success' ? 'linear-gradient(90deg,#0a3327cc,#0e5a44cc)'
           : type==='danger'  ? 'linear-gradient(90deg,#3a0b0bcc,#5a0e0ecc)'
           : type==='secondary'? 'linear-gradient(90deg,#1d2030cc,#111622cc)'
           : 'linear-gradient(90deg,#111a33cc,#0b1226cc)';
  bannerText.style.background = bg;
  bannerText.style.borderColor = type==='success' ? '#1f6f5a' : type==='danger' ? '#5f2a2a' : '#20305f';
  bannerText.style.animation = prefs.reduce ? 'none' : 'popIn .5s ease-out forwards';
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(()=>banner.classList.add('hidden'), ms);
}

/* ---------- Auto-pausa por visibilidad ---------- */
document.addEventListener('visibilitychange',()=>{ if(document.hidden && !G.paused && !G.ended){ togglePause(); }});

/* ---------- Táctil ---------- */
function bindTouchButton(el, onDown, onUp){
  const down = (ev)=>{ ev.preventDefault(); onDown(); };
  const up   = (ev)=>{ ev.preventDefault(); onUp(); };
  el.addEventListener('touchstart',down,{passive:false});
  el.addEventListener('touchend',up,{passive:false});
  el.addEventListener('touchcancel',up,{passive:false});
}
if(dpad){
  dpad.querySelectorAll('button').forEach(btn=>{
    const dir = btn.getAttribute('data-dir');
    const map = {up:'arrowup',down:'arrowdown',left:'arrowleft',right:'arrowright'};
    bindTouchButton(btn, ()=>keys.add(map[dir]), ()=>keys.delete(map[dir]));
  });
}
if(btnBomb){ bindTouchButton(btnBomb, ()=>{ keys.add('z'); }, ()=>{ keys.delete('z'); }); }
if(btnTPause){ bindTouchButton(btnTPause, ()=>togglePause(), ()=>{}); }

/* ---------- Volumen UI ---------- */
btnMute.addEventListener('click', ()=>{
  prefs.muted = !prefs.muted; btnMute.textContent = prefs.muted ? '🔇' : '🔊';
  S.setMuted(prefs.muted); savePrefs(prefs);
});
volRange.addEventListener('input', (e)=>{
  const v = clamp((+e.target.value)/100, 0, 1);
  prefs.volume = v; S.setVolume(v); savePrefs(prefs);
});
chkReduce.addEventListener('change', (e)=>{
  prefs.reduce = !!e.target.checked; savePrefs(prefs);
  document.body.classList.toggle('reduce-motion', prefs.reduce);
});

/* ---------- Minimapa ---------- */
function drawMinimap(w){
  const pad=8;
  mctx.clearRect(0,0,mini.width,mini.height);
  const cw = mini.width - pad*2, ch = mini.height - pad*2;
  const sx = cw / (w.cols*TILE), sy = ch / (w.rows*TILE);
  mctx.fillStyle = '#0c1428'; mctx.fillRect(0,0,mini.width,mini.height);
  for(let r=0;r<w.rows;r++){
    for(let c=0;c<w.cols;c++){
      const t=w.grid[r][c];
      if(t==='S' || t==='B'){
        mctx.fillStyle = (t==='S') ? '#405068' : '#8b6b3a';
        mctx.fillRect(pad + c*TILE*sx, pad + r*TILE*sy, TILE*sx, TILE*sy);
      }
    }
  }
  if(!w.door.covered){
    mctx.fillStyle='#22d3ee';
    mctx.fillRect(pad + w.door.c*TILE*sx+2, pad + w.door.r*TILE*sy+2, TILE*sx-4, TILE*sy-4);
  }
  for(const s of w.sardines){
    mctx.fillStyle = s.t==='range'?'#00d4ff':(s.t==='max'?'#c084fc':'#7ee787');
    mctx.fillRect(pad + s.c*TILE*sx+5, pad + s.r*TILE*sy+5, TILE*sx-10, TILE*sy-10);
  }
  for(const d of w.dogs){
    if(d.dead) continue;
    mctx.fillStyle='#f59e0b';
    mctx.beginPath(); mctx.arc(pad + (d.c+0.5)*TILE*sx, pad + (d.r+0.5)*TILE*sy, 3, 0, Math.PI*2); mctx.fill();
  }
  mctx.fillStyle='#84cc16';
  mctx.beginPath(); mctx.arc(pad + (w.player.c+0.5)*TILE*sx, pad + (w.player.r+0.5)*TILE*sy, 4, 0, Math.PI*2); mctx.fill();
  mctx.strokeStyle='#20305f'; mctx.lineWidth=2; mctx.strokeRect(1,1,mini.width-2,mini.height-2);
}

/* ---------- TIENDA (shop) ---------- */
const SHOP_COST = { range:3, max:3, speed:2, life:5 };
modalShopEl?.addEventListener('click',(e)=>{
  const item = e.target?.getAttribute?.('data-shop');
  if(!item) return;
  const cost = SHOP_COST[item];
  if(G.coins < cost){ S.ui(); showBanner('Sardinas insuficientes 🐟','danger',900); return; }
  G.coins -= cost; hudCoins.textContent = G.coins; shopCoinsEl.textContent = G.coins;
  if(item==='range') G.range = Math.min(G.range+1, 8);
  if(item==='max')   G.maxMice = Math.min(G.maxMice+1, 8);
  if(item==='speed') G.speed  = Math.min(G.speed + 0.2, 2.0);
  if(item==='life')  G.lives  = Math.min(G.lives + 1, 9);
  updateHUD();
  S.ui(); showBanner('Compra realizada ✅','success',800);
});

/* ---------- LOGROS ---------- */
const ACH_META = {
  firstBlood:   { name:'Primer derribo',     desc:'Elimina a tu primer perro', icon:'🐶' },
  demolisher:   { name:'Demoledor',          desc:'Rompe 20 cajas en total',   icon:'🧱' },
  speedRunner:  { name:'Velocista',          desc:'Termina un nivel con ≥60s', icon:'⏱️' },
  pacifist:     { name:'Pacifista',          desc:'Termina un nivel sin matar',icon:'🕊️' },
  survivor:     { name:'Sobreviviente',      desc:'Termina con 1 vida',        icon:'❤️' },
  sardineCombo: { name:'Combo de sardinas',  desc:'Toma 3 sardinas en un nivel',icon:'🐟' }
};
function unlockAch(key){
  if(!ACH_META[key]) return;
  if(prefs.achievements[key]) return; // ya estaba
  prefs.achievements[key]=true; savePrefs(prefs);
  renderAchievements();
  showBanner(`Logro: ${ACH_META[key].name} ${ACH_META[key].icon}`,'success',1200);
  S.ui();
}
function renderAchievements(){
  const items = Object.keys(ACH_META).map(k=>{
    const a = ACH_META[k], unlocked = !!prefs.achievements[k];
    return `<div class="col-12 col-md-6"><div class="ach-card ${unlocked?'':'ach-dim'}">
      <div class="ach-icon">${a.icon}</div>
      <div>
        <div class="fw-bold">${a.name}</div>
        <div class="text-secondary small">${a.desc}</div>
        <div class="small">${unlocked? '✔️ Desbloqueado' : '— Bloqueado'}</div>
      </div>
    </div></div>`;
  }).join('');
  achListEl.innerHTML = items;
}

/* ---------- CONTROLES (UI) ---------- */
function renderControlsList(){
  const map = prefs.keymap;
  const labels = {
    up:'Arriba', down:'Abajo', left:'Izquierda', right:'Derecha',
    place:'Poner bomba', pause:'Pausa', confirm:'Confirmar'
  };
  controlsListEl.innerHTML = Object.keys(labels).map(act=>{
    const val = map[act] ? `<kbd>${map[act]}</kbd>` : '<span class="text-secondary">[sin asignar]</span>';
    return `<button class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
              data-act="${act}">
              ${labels[act]} <span>${val}</span>
            </button>`;
  }).join('');
}
controlsListEl?.addEventListener('click',(e)=>{
  const el = e.target.closest('[data-act]'); if(!el) return;
  const act = el.getAttribute('data-act');
  _rebindAction = act;
  showBanner(`Pulsa una tecla para "${act}"`,'secondary',1500);
});
btnRestoreKeys?.addEventListener('click', ()=>{
  prefs.keymap = {...DEFAULT_KEYMAP}; savePrefs(prefs);
  renderControlsList(); showBanner('Controles restaurados','success',900);
});

/* ---------- Botones de navbar: abrir modales ---------- */
btnControls?.addEventListener('click', ()=>{ renderControlsList(); ControlsModal.show(); });
btnAchievements?.addEventListener('click', ()=>{ renderAchievements(); AchModal.show(); });

/* ---------- Inicio ---------- */
function roundedInit(){
  hudCoins.textContent = G.coins;
  startLevel(0);
  requestAnimationFrame(loop);
}
roundedInit();

/* ---------- Limpieza de bombas detonadas ---------- */
setInterval(()=>{ if(!world) return; for(const b of world.mice){ if(b.dead && b.exploded && !b.explodedConsumed) b.explodedConsumed=true; } },150);

/* ---------- Resize Hi-DPI si cambia DPR ---------- */
let _lastDpr = window.devicePixelRatio || 1;
setInterval(()=>{ const d = window.devicePixelRatio || 1; if(Math.abs(d - _lastDpr) > 0.01){ _lastDpr = d; setupHiDPI(); } }, 600);
