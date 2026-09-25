(() => {

  // DOM Elements
  const pad = document.getElementById('pad');
  const quads = Array.from(document.querySelectorAll('.quad'));
  const levelValueEl = document.getElementById('levelValue');
  const bestValueEl = document.getElementById('bestValue');
  const statusTextEl = document.getElementById('statusText');
  const startBtn = document.getElementById('startBtn');
  const strictToggle = document.getElementById('strictToggle');
  const soundBtn = document.getElementById('soundBtn');

  // Sound frequencies
  const FREQ = [
    220.00,
    277.18,
    329.63,
    415.30
  ];

  // Game variables
  let sequence = [];
  let playerStep = 0;
  let level = 0;
  let best = 0;
  let accepting = false;
  let soundOn = true;
  let audioCtx = null;

  // Format number with two digits
  const pad2 = (n) => {
    return String(n).padStart(2, '0');
  };

  // Delay function
  const wait = (ms) => {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  };

  // Create audio context
  function ensureAudio() {
    if (!audioCtx) {
      audioCtx = new (
        window.AudioContext ||
        window.webkitAudioContext
      )();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // Play normal sound
  function tone(
    freq,
    duration = 0.28,
    type = 'sine'
  ) {
    if (!soundOn) return;

    ensureAudio();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(
      0.0001,
      audioCtx.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.25,
      audioCtx.currentTime + 0.02
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioCtx.currentTime + duration
    );

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();

    osc.stop(
      audioCtx.currentTime +
      duration +
      0.02
    );
  }

  // Play error sound
  function errorTone() {
    if (!soundOn) return;

    ensureAudio();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = 110;

    gain.gain.setValueAtTime(
      0.0001,
      audioCtx.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.22,
      audioCtx.currentTime + 0.02
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioCtx.currentTime + 0.5
    );

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();

    osc.stop(
      audioCtx.currentTime + 0.52
    );
  }

  // Game speed
  function speedForLevel(lvl) {
    return Math.max(
      300,
      820 - lvl * 35
    );
  }

  // Flash a color
  function flash(
    index,
    duration,
    cls = 'active'
  ) {
    const q = quads[index];

    q.classList.add(cls);

    tone(
      FREQ[index],
      duration / 1000
    );

    return wait(duration).then(() => {
      q.classList.remove(cls);
    });
  }

  // Play current sequence
  async function playSequence() {
    pad.classList.add('locked');

    statusTextEl.textContent = 'Watch…';

    await wait(400);

    const duration = speedForLevel(level);

    for (const index of sequence) {

      await flash(
        index,
        duration
      );

      await wait(
        duration * 0.35
      );
    }

    pad.classList.remove('locked');

    playerStep = 0;
    accepting = true;

    statusTextEl.textContent =
      'Your turn';
  }

  // Start next round
  function nextRound() {
    level++;

    levelValueEl.textContent =
      pad2(level);

    sequence.push(
      Math.floor(Math.random() * 4)
    );

    playSequence();
  }

  // Start game
  function startGame() {
    ensureAudio();

    sequence = [];
    level = 0;
    playerStep = 0;
    accepting = false;

    startBtn.classList.add('hidden');

    levelValueEl.textContent = '00';

    statusTextEl.textContent =
      'Get ready…';

    nextRound();
  }

  // Handle wrong answer
  async function handleMistake() {
    accepting = false;

    errorTone();

    if (strictToggle.checked) {

      best = Math.max(
        best,
        level - 1
      );

      bestValueEl.textContent =
        pad2(best);

      statusTextEl.textContent =
        'Game over — strict';

      pad.classList.add('locked');

      await wait(500);

      startBtn.classList.remove(
        'hidden'
      );

      startBtn.textContent =
        'Try again';

    } else {

      statusTextEl.textContent =
        'Not quite — watch again';

      await wait(700);

      playSequence();
    }
  }

  // Handle completed round
  async function handleWin() {
    accepting = false;

    statusTextEl.textContent =
      'Nice!';

    await wait(500);

    nextRound();
  }

  // Handle player input
  function handlePress(index) {

    if (!accepting) return;

    const q = quads[index];

    q.classList.add('active');

    tone(
      FREQ[index],
      0.22
    );

    setTimeout(() => {
      q.classList.remove('active');
    }, 220);

    // Correct input
    if (
      index === sequence[playerStep]
    ) {

      playerStep++;

      if (
        playerStep === sequence.length
      ) {
        handleWin();
      }

    }

    // Wrong input
    else {

      quads.forEach(qq => {
        qq.classList.add('wrong');
      });

      setTimeout(() => {

        quads.forEach(qq => {
          qq.classList.remove('wrong');
        });

      }, 260);

      handleMistake();
    }
  }

  // Color click events
  quads.forEach(q => {

    q.addEventListener(
      'click',
      () => {

        const index =
          Number(q.dataset.index);

        handlePress(index);
      }
    );
  });

  // Start button
  startBtn.addEventListener(
    'click',
    startGame
  );

  // Keyboard controls
  document.addEventListener(
    'keydown',
    (e) => {

      const map = {
        '1': 0,
        '2': 1,
        '3': 2,
        '4': 3
      };

      // Number keys
      if (e.key in map) {
        handlePress(map[e.key]);
      }

      // Enter key
      if (
        e.key === 'Enter' &&
        !startBtn.classList.contains(
          'hidden'
        )
      ) {
        startGame();
      }
    }
  );

  // Sound toggle
  soundBtn.addEventListener(
    'click',
    () => {

      soundOn = !soundOn;

      soundBtn.setAttribute(
        'aria-pressed',
        String(soundOn)
      );

      soundBtn.style.opacity =
        soundOn ? '1' : '0.45';
    }
  );

  // Initial status
  statusTextEl.textContent =
    'Press start';

})();