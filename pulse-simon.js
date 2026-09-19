(() => {
  const pad          = document.getElementById('pad');
  const quads         = Array.from(document.querySelectorAll('.quad'));
  const levelValueEl  = document.getElementById('levelValue');
  const bestValueEl   = document.getElementById('bestValue');
  const statusTextEl  = document.getElementById('statusText');
  const startBtn      = document.getElementById('startBtn');
  const strictToggle  = document.getElementById('strictToggle');
  const soundBtn      = document.getElementById('soundBtn');

  const FREQ = [220.00, 277.18, 329.63, 415.30]; // red, amber, mint, violet

  let sequence      = [];
  let playerStep    = 0;
  let level         = 0;
  let best          = 0;
  let accepting     = false;
  let soundOn       = true;
  let audioCtx      = null;

  const pad2 = (n) => String(n).padStart(2, '0');
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  function ensureAudio(){
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  function tone(freq, duration = 0.28, type = 'sine'){
    if (!soundOn) return;
    ensureAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration + 0.02);
  }

  function errorTone(){
    if (!soundOn) return;
    ensureAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 110;
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.22, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.52);
  }

  function speedForLevel(lvl){
    return Math.max(300, 820 - lvl * 35);
  }

  function flash(index, duration, cls = 'active'){
    const q = quads[index];
    q.classList.add(cls);
    tone(FREQ[index], duration / 1000);
    return wait(duration).then(() => q.classList.remove(cls));
  }

  async function playSequence(){
    pad.classList.add('locked');
    statusTextEl.textContent = 'Watch…';
    await wait(400);
    const dur = speedForLevel(level);
    for (const idx of sequence){
      await flash(idx, dur);
      await wait(dur * 0.35);
    }
    pad.classList.remove('locked');
    playerStep = 0;
    accepting = true;
    statusTextEl.textContent = 'Your turn';
  }

  function nextRound(){
    level += 1;
    levelValueEl.textContent = pad2(level);
    sequence.push(Math.floor(Math.random() * 4));
    playSequence();
  }

  function startGame(){
    ensureAudio();
    sequence = [];
    level = 0;
    playerStep = 0;
    startBtn.classList.add('hidden');
    levelValueEl.textContent = '00';
    nextRound();
  }

  async function handleMistake(){
    accepting = false;
    errorTone();
    if (strictToggle.checked){
      best = Math.max(best, level - 1);
      bestValueEl.textContent = pad2(best);
      statusTextEl.textContent = 'Game over — strict';
      pad.classList.add('locked');
      await wait(500);
      startBtn.classList.remove('hidden');
      startBtn.textContent = 'Try again';
    } else {
      statusTextEl.textContent = 'Not quite — watch again';
      await wait(700);
      playSequence();
    }
  }

  async function handleWin(){
    accepting = false;
    statusTextEl.textContent = 'Nice!';
    await wait(500);
    nextRound();
  }

  function handlePress(index){
    if (!accepting) return;
    const q = quads[index];
    q.classList.add('active');
    tone(FREQ[index], 0.22);
    setTimeout(() => q.classList.remove('active'), 220);

    if (index === sequence[playerStep]){
      playerStep += 1;
      if (playerStep === sequence.length){
        handleWin();
      }
    } else {
      quads.forEach(qq => qq.classList.add('wrong'));
      setTimeout(() => quads.forEach(qq => qq.classList.remove('wrong')), 260);
      handleMistake();
    }
  }

  quads.forEach(q => {
    q.addEventListener('click', () => handlePress(Number(q.dataset.index)));
  });

  startBtn.addEventListener('click', startGame);

  document.addEventListener('keydown', (e) => {
    const map = { '1': 0, '2': 1, '3': 2, '4': 3 };
    if (e.key in map) handlePress(map[e.key]);
    if (e.key === 'Enter' && !startBtn.classList.contains('hidden')) startGame();
  });

  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    soundBtn.setAttribute('aria-pressed', String(soundOn));
    soundBtn.style.opacity = soundOn ? '1' : '0.45';
  });

  statusTextEl.textContent = 'Press start';
})();