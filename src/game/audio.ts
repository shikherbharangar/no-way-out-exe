export class Sound {
 context?: AudioContext; gain?: GainNode; volume = .35;
 unlock() { if (!this.context) { this.context = new AudioContext(); this.gain = this.context.createGain(); this.gain.gain.value = this.volume; this.gain.connect(this.context.destination); } void this.context.resume(); }
 setVolume(v: number) { this.volume = v; if (this.gain) this.gain.gain.value = v; }
 play(kind: string) {
  const c = this.context; if (!c || !this.gain || c.state !== 'running') return;
  const g = c.createGain(); g.connect(this.gain); const now = c.currentTime;
  if (kind === 'blast' || kind === 'death' || kind === 'land') {
   const length = kind === 'blast' ? .55 : .16, buffer = c.createBuffer(1, c.sampleRate * length, c.sampleRate), data = buffer.getChannelData(0);
   for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2;
   const n = c.createBufferSource(); n.buffer = buffer; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = kind === 'blast' ? 1300 : 500;
   n.connect(f); f.connect(g); g.gain.setValueAtTime(kind === 'land' ? .08 : .65, now); n.start(); n.onended = () => { n.disconnect(); f.disconnect(); g.disconnect(); };
  } else {
   const o = c.createOscillator(); o.type = kind === 'jump' ? 'square' : 'triangle';
   const freq = kind === 'gate' || kind === 'win' ? 330 : kind === 'hurt' ? 120 : 680;
   o.frequency.setValueAtTime(freq, now); o.frequency.exponentialRampToValueAtTime(kind === 'hurt' ? 45 : freq * 1.8, now + .14);
   g.gain.setValueAtTime(.1, now); g.gain.exponentialRampToValueAtTime(.001, now + .2); o.connect(g); o.start(); o.stop(now + .2); o.onended = () => { o.disconnect(); g.disconnect(); };
  }
 }
}
