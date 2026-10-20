/* Soft underwater soundscape: ambient music + bubble SFX.
   Everything is synthesized with the Web Audio API, so no audio files ship.
   Audio only starts after a user gesture (the Sound button) to respect autoplay rules. */
(function () {
  let ctx = null;
  let master = null;
  let musicGain = null;
  let musicFilter = null;
  let sfxGain = null;
  let started = false;
  let enabled = false;
  let bellTimer = null;

  const SCALE = [220, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];

  function rampMaster(v) {
    if (!ctx) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(v, now + 0.7);
  }

  function startAmbience() {
    // low muffled drone -> underwater bed
    const drone = ctx.createGain();
    drone.gain.value = 0.06;
    drone.connect(musicGain);
    [[55, 'sine', 0.6], [82.5, 'sine', 0.5], [110, 'triangle', 0.32], [164.81, 'triangle', 0.18]]
      .forEach(([f, type, amp], i) => {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = f;
        o.detune.value = (i - 1) * 5;
        const g = ctx.createGain();
        g.gain.value = amp;
        o.connect(g);
        g.connect(drone);
        o.start();
      });

    // slow filter sweep gives a gentle "current" moving through the water
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoAmt = ctx.createGain();
    lfoAmt.gain.value = 260;
    lfo.connect(lfoAmt);
    lfoAmt.connect(musicFilter.frequency);
    lfo.start();

    // soft bell pad, sparse and drifting
    const ping = () => {
      if (!started) return;
      if (enabled && Math.random() < 0.75) chime();
      bellTimer = setTimeout(ping, 3200 + Math.random() * 5200);
    };
    ping();
  }

  function chime() {
    const now = ctx.currentTime;
    const f = SCALE[Math.floor(Math.random() * SCALE.length)];
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.11, now + 0.5);
    g.gain.exponentialRampToValueAtTime(0.0008, now + 4.2);
    g.connect(musicGain);
    [1, 2.01].forEach((mult, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f * mult;
      const og = ctx.createGain();
      og.gain.value = i === 0 ? 1 : 0.28;
      o.connect(og);
      og.connect(g);
      o.start(now);
      o.stop(now + 4.3);
    });
  }

  // one soft rising "bloop" = a bubble
  function bubble(level) {
    if (!ctx || !enabled) return;
    const amp = 0.16 * (level || 1);
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    const f0 = 360 + Math.random() * 320;
    o.frequency.setValueAtTime(f0, now);
    o.frequency.exponentialRampToValueAtTime(f0 * 2.3, now + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(amp, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.17);
    o.connect(g);
    g.connect(sfxGain);
    o.start(now);
    o.stop(now + 0.19);
  }

  // a soft settle when a fish drops into the tank
  function drop() {
    if (!ctx || !enabled) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(520, now);
    o.frequency.exponentialRampToValueAtTime(150, now + 0.28);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
    o.connect(g);
    g.connect(sfxGain);
    o.start(now);
    o.stop(now + 0.34);
  }

  function ensure() {
    if (started) {
      if (enabled && ctx.state === 'suspended') ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    musicGain = ctx.createGain();
    musicGain.gain.value = 0.55;
    musicFilter = ctx.createBiquadFilter();
    musicFilter.type = 'lowpass';
    musicFilter.frequency.value = 620;
    musicFilter.Q.value = 0.6;
    musicGain.connect(musicFilter);
    musicFilter.connect(master);

    // short feedback delay = a little watery space
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.33;
    const fb = ctx.createGain();
    fb.gain.value = 0.28;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    musicFilter.connect(delay);
    delay.connect(fb);
    fb.connect(delay);
    delay.connect(wet);
    wet.connect(master);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.55;
    sfxGain.connect(master);

    startAmbience();
    started = true;
  }

  function toggle() {
    ensure();
    if (!ctx) return false;
    if (ctx.state === 'suspended') ctx.resume();
    enabled = !enabled;
    rampMaster(enabled ? 0.85 : 0);
    return enabled;
  }

  window.FishAudio = {
    toggle: toggle,
    isEnabled: () => enabled,
    bubble: bubble,
    drop: drop
  };
})();
