import Phaser from 'phaser';
import { PrisonScene, defaults, type Binding } from './game/scene';
import './style.css';

const ui = document.querySelector<HTMLDivElement>('#ui')!;
const scene = new PrisonScene();
const game = new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: 640, height: 360, backgroundColor: '#101c27', pixelArt: true, roundPixels: true, antialias: false, render: { pixelArt: true, roundPixels: true }, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: [scene], input: { keyboard: true, gamepad: true }, audio: { noAudio: true } });
let screen = 'title';
function set(content: string) { ui.innerHTML = `<div class="frame">${content}</div>`; }
function click(id: string, fn: () => void) { document.querySelector<HTMLButtonElement>(`#${id}`)?.addEventListener('click', fn); }
function shell(content: string) { set(`<div class="overlay"><section class="panel">${content}</section></div>`); }
function escape(s: string) { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)); }
function title() {
 screen = 'title'; scene.activeRun = false; scene.pausedRun = false; scene.online = false;
 set(`<div class="menu-shade"></div><header class="topline"><span class="kicker"><i class="dot"></i> THE PANOPTICON / ESCAPE PROTOCOL</span><span class="stamp">COOPERATE OR DIE TRYING</span></header>
 <div class="menu-body"><div class="eyebrow">A CO-OP PRISON BREAK</div><h1 class="logo"><img src="/assets/logo.png" alt="NO WAY OUT.exe"></h1><p class="tagline">Two idiots. One prison.<br>Infinite bad decisions.</p><button id="play" class="play">BREAK OUT <span class="arrow">→</span></button><div class="subplay"><button id="online" class="link-button">ONLINE CO-OP</button><button id="settings" class="link-button">SETTINGS</button><button id="credits" class="link-button">CREDITS</button></div><div class="smallprint">LOCAL CO-OP / 2 PLAYERS / 1 KEYBOARD</div></div>
 <aside class="sector-label">YOU ARE HERE<strong>CELL BLOCK ZERO</strong>SECTOR 01 / LEVEL −07</aside><footer class="bottomline"><span>WARDEN.exe <b>IS WATCHING.</b><br>PRISONER COUNT: 02 &nbsp; / &nbsp; EXPECTED SURVIVORS: 00</span><span class="right-note">ORIGINAL PIXEL ART · UNREASONABLE EXPLOSIONS<br>PRISON ESCAPE / TWO SECTORS</span></footer>`);
 click('play', tutorial); click('settings', () => settings(title)); click('credits', credits); click('online', onlineMenu);
}
function tutorial() {
 screen = 'tutorial'; scene.sfx.unlock();
 shell(`<h2>PRISONER ORIENTATION / MANDATORY</h2><h1>BAD COMPANY.<br>GOOD ESCAPE PLAN.</h1><div class="columns"><div class="character"><div class="portrait zip"></div><h3>01 / ZIP</h3><p>Fast. Mouthy. Technically useful.</p><p><kbd>A</kbd><kbd>D</kbd> move · <kbd>SPACE</kbd> jump<br><kbd>F</kbd> hack / revive<br><kbd>G</kbd> arc bolt / air dash</p></div><div class="character"><div class="portrait brick"></div><h3>02 / BRICK</h3><p>Built like a terrible idea.</p><p><kbd>←</kbd><kbd>→</kbd> move · <kbd>R SHIFT</kbd> jump<br><kbd>ENTER</kbd> interact / revive<br><kbd>R CTRL</kbd> blast punch + shield<br>Hold ENTER to brace; ZIP fires into the shield to charge a shock punch.</p></div></div><p class="tutorial-objective">Break the cracked wall. BRICK powers the brass plate. ZIP climbs to the terminal and holds interact. Stay together. Get both idiots to the freight lift.</p><p class="footer-tip">Controllers: left stick / D-pad · A jump · X interact · B ability. Two controllers supported. Keyboard controls can be remapped in settings.</p><label>ROOM SEED <input id="seed" type="number" min="0" max="4294967295" value="2026" aria-label="Room seed"></label><button id="start" class="play">LET'S MAKE THIS WORSE <span>→</span></button><button id="back" class="link-button">← BACK</button>`);
 click('start', () => { const seed=Number(document.querySelector<HTMLInputElement>('#seed')!.value)>>>0;scene.start(false,0,seed); playing(); }); click('back', title);
}
function keyName(s: string) { return s.replace('Key', '').replace('Arrow', '').replace('Right', 'R').replace('Left', 'L').replace('Control', 'Ctrl'); }
function playing() {
 screen = 'playing'; scene.pausedRun = false; scene.keys.clear();
 set(`<div class="in-game-tools compact-tools"><button id="sound" class="icon-btn" aria-label="Toggle sound" title="Toggle sound">${scene.sfx.volume ? 'SND' : 'MUTE'}</button><button id="full" class="icon-btn" aria-label="Fullscreen" title="Fullscreen">FULL</button><button id="pause" class="icon-btn" aria-label="Pause or menu" title="Escape / menu">II</button></div>`);
 click('pause', pause); click('full', () => { if (document.fullscreenElement) void document.exitFullscreen(); else void document.querySelector('#app')!.requestFullscreen().catch(() => {}); });
 click('sound', () => { scene.sfx.setVolume(scene.sfx.volume ? 0 : .35); playing(); });
}
function pause() {
 if (screen === 'pause') { playing(); return; }
 if (screen !== 'playing') return;
 screen = 'pause'; scene.pausedRun = true; scene.keys.clear();
 shell(`<h2>${scene.online ? 'ONLINE SESSION CONTINUES' : 'WARDEN.exe: "TAKE YOUR TIME. I HAVE FOREVER."'}</h2><h1>${scene.online ? 'STILL CONNECTED.' : 'HOLD THAT THOUGHT.'}</h1><button id="resume" class="play">BACK TO BAD DECISIONS <span>→</span></button><div class="subplay"><button id="settings" class="link-button">SETTINGS</button>${scene.online ? '' : '<button id="retry" class="link-button">RESTART SCENE</button>'}<button id="quit" class="link-button">QUIT TO TITLE</button></div>`);
 click('resume', playing); click('settings', () => settings(pauseReturn)); click('retry', () => { const sector=scene.sim.sector,seed=scene.sim.seed;scene.start(false,0,seed);if(sector===2)scene.sim.enterMachine();playing(); }); click('quit', () => { disconnect(); title(); });
}
function pauseReturn() { screen = 'playing'; pause(); }
function settings(back: () => void) {
 screen = 'settings';
 shell(`<h2>PERSONNEL PREFERENCES</h2><h1>MAKE IT YOUR PROBLEM.</h1><label>MASTER VOLUME <input id="volume" type="range" min="0" max="1" step=".05" value="${scene.sfx.volume}"></label><p>Click a binding, then press a key. Escape cancels. W / Up also jump.</p><div class="remap-grid">${scene.bindings.map((b, i) => `<div><h2>${i ? 'BRICK' : 'ZIP'}</h2>${Object.entries(b).map(([action, key]) => `<div class="remap-row">${action.toUpperCase()} <button data-player="${i}" data-action="${action}">${escape(keyName(key))}</button></div>`).join('')}</div>`).join('')}</div><div class="subplay"><button id="back" class="link-button">← BACK</button><button id="reset" class="link-button">RESET CONTROLS</button></div>`);
 document.querySelector<HTMLInputElement>('#volume')!.oninput = e => { scene.sfx.unlock(); scene.sfx.setVolume(Number((e.target as HTMLInputElement).value)); localStorage.setItem('nwo-volume', String(scene.sfx.volume)); };
 document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(b => b.onclick = () => {
  b.textContent = 'PRESS KEY';
  const handler = (e: KeyboardEvent) => { e.preventDefault(); e.stopImmediatePropagation(); if (e.code !== 'Escape') { scene.bindings[Number(b.dataset.player)][b.dataset.action as keyof Binding] = e.code; localStorage.setItem('nwo-bindings', JSON.stringify(scene.bindings)); } window.removeEventListener('keydown', handler, true); settings(back); };
  window.addEventListener('keydown', handler, true);
 });
 click('reset', () => { scene.bindings = structuredClone(defaults); localStorage.removeItem('nwo-bindings'); settings(back); }); click('back', back);
}
function credits() { screen = 'credits'; shell(`<h2>CONTRABAND / ORIGINAL MATERIAL</h2><h1>BUILT TO BREAK.</h1><p>NO WAY OUT.exe — an original cooperative prison escape.<br>ZIP, BRICK, the Panopticon, and WARDEN.exe are original creations.</p><p>Pixel sprites, masonry, machinery, parallax layers, and explosion sheets are authored specifically for this project. Sound effects are synthesized with Web Audio. Built with Phaser, TypeScript, and Vite.</p><p>Art direction inspired by the density, silhouettes, and explosive readability of arcade action games. No extracted, traced, or redistributed game assets.</p><p class="footer-tip">Includes Cell Block Zero and THE MACHINE: seeded industrial rooms, cooperative machinery, a collapsing transfer line, and the magnetic heart.</p><button id="back" class="link-button">← BACK TO THE PRISON</button>`); click('back', title); }
function victory() {
 screen = 'win'; scene.pausedRun = true; const seconds = Math.floor(scene.sim.elapsed), deaths = scene.sim.deaths;
 shell(`<h2>SECTOR 02 / THE MACHINE</h2><h1>HEART STOPPED.<br>ZERO GOOD IDEAS.</h1><p>The magnetic heart falls silent. Beyond it: the prisoner archive.<br><span style="color:#d6b783">WARDEN.exe: “You have not escaped. You have opened the records.”</span></p><div class="results"><div><strong>02 / 02</strong><span>PRISONERS RECOVERED</span></div><div><strong>${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2,'0')}</strong><span>ESCAPE TIME</span></div><div><strong>${deaths}</strong><span>BAD DECISIONS</span></div></div><p class="footer-tip">THE MACHINE is complete. The archive lies beyond this two-sector chapter. Replay to try another connected room layout.</p><button id="again" class="play">ONE MORE BAD IDEA <span>→</span></button><button id="back" class="link-button">RETURN TO TITLE</button>`);
 click('again', () => { if (scene.online) { disconnect(); onlineMenu(); } else { scene.start(false,0,(scene.sim.seed+1)>>>0); playing(); } }); click('back', () => { disconnect(); title(); });
}
// The room client uses a separate authoritative Node server; no serverless room state.
import { RoomClient } from './net/client';
let room: RoomClient | undefined;
function disconnect() { room?.close(); room = undefined; scene.networkStep = undefined; scene.online = false; }
function onlineMenu() {
 screen = 'online'; shell(`<h2>PRIVATE CO-OP / EXACTLY TWO PRISONERS</h2><h1>CALL YOUR ACCOMPLICE.</h1><p>Host a room or enter your friend's six-letter code. Each player uses the ZIP keyboard controls or a controller; the host is ZIP and the guest is BRICK.</p><button id="host" class="play">CREATE PRIVATE ROOM <span>+</span></button><div class="form-row"><input id="code" maxlength="6" aria-label="Room code" placeholder="ROOM CODE" autocomplete="off"><button id="join" class="icon-btn">JOIN ROOM</button></div><p id="net-status" class="status">${import.meta.env.VITE_SERVER_URL ? 'Dedicated multiplayer service configured.' : 'Local server: start npm run server. Production requires VITE_SERVER_URL.'}</p><button id="back" class="link-button">← BACK</button>`);
 const requested = new URLSearchParams(location.search).get('room'); if (requested) document.querySelector<HTMLInputElement>('#code')!.value = requested.slice(0, 6);
 click('host', () => connect('')); click('join', () => { const code = document.querySelector<HTMLInputElement>('#code')!.value.trim().toUpperCase(); if (/^[A-Z]{6}$/.test(code)) connect(code); else document.querySelector('#net-status')!.textContent = 'Enter the six-letter room code.'; }); click('back', () => { disconnect(); title(); });
}
function connect(code: string) {
 disconnect();
 const configured = import.meta.env.VITE_SERVER_URL as string | undefined;
 const url = configured || (['localhost','127.0.0.1'].includes(location.hostname) ? `ws://${location.hostname}:2567` : '');
 if (!url) { document.querySelector('#net-status')!.textContent = 'Online service is not configured. Deploy the server and set VITE_SERVER_URL before building.'; return; }
 room = new RoomClient(url);
 room.onError = message => {
  if (screen === 'playing' || screen === 'pause') { scene.pausedRun = true; shell(`<h2>LINK INTERRUPTED</h2><h1>CONNECTION LOST.</h1><p>${escape(message)}</p><button id="back" class="link-button">RETURN TO LOBBY</button>`); click('back', () => { disconnect(); onlineMenu(); }); }
  else { const status = document.querySelector('#net-status'); if (status) status.textContent = message; }
 };
 room.onLobby = state => {
  if (state.started && scene.activeRun) { if (state.connected.every(Boolean)) playing(); else { scene.pausedRun = true; shell('<h2>LINK INTERRUPTED</h2><h1>PARTNER DISCONNECTED.</h1><p>Your slot is reserved for 30 seconds. The simulation is paused while your partner reconnects.</p><button id="back" class="link-button">LEAVE ROOM</button>'); click('back', () => { disconnect(); onlineMenu(); }); } return; }
  screen = 'lobby';
  shell(`<h2>PRIVATE ROOM / ${state.slot ? 'BRICK' : 'ZIP'}</h2><h1>PARTNERS IN CRIME.</h1><div class="room-code">${state.code}</div><p id="net-status" class="status">ZIP: ${state.connected[0] ? state.ready[0] ? 'READY' : 'CONNECTED' : 'DISCONNECTED'} &nbsp; / &nbsp; BRICK: ${state.connected[1] ? state.ready[1] ? 'READY' : 'CONNECTED' : 'WAITING'}</p><p>Both players must ready up. The host is ZIP; the guest is BRICK.</p><button id="ready" class="play">${state.ready[state.slot] ? 'CANCEL READY' : 'READY TO BREAK OUT'} <span>→</span></button><div class="subplay"><button id="invite" class="link-button">COPY INVITE LINK</button><button id="back" class="link-button">LEAVE ROOM</button></div>`);
  click('ready', () => room?.ready(!state.ready[state.slot])); click('invite', () => { const u = new URL(location.href); u.searchParams.set('room',state.code); navigator.clipboard.writeText(u.href).then(() => { document.querySelector('#invite')!.textContent = 'COPIED'; }).catch(() => { document.querySelector('#net-status')!.textContent = u.href; }); }); click('back', () => { disconnect(); onlineMenu(); });
 };
 room.onStart = slot => { scene.start(true, slot); scene.networkStep = input => room?.input(input); playing(); };
 room.onState = state => { if (!scene.sim.tick) scene.lastEvent = Math.max(0,...state.events.map(e=>e.id)); scene.sim.apply(state); };
 room.open(code);
 document.querySelector('#net-status')!.textContent = 'Connecting to the Panopticon…';
}
scene.onPause = pause; scene.onWin = victory;
game.events.once('prison-ready', () => { try { const v = localStorage.getItem('nwo-volume'); if (v !== null) scene.sfx.setVolume(Number(v)); } catch {} title(); if (new URLSearchParams(location.search).has('room')) onlineMenu(); });
if (import.meta.env.DEV) Object.assign(window, { __prison: scene, __game: game });
