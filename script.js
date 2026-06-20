const { introDialogue, roomGuides, juryMessages } = window.BlackoutDialogues;
const {
  INITIAL_SECONDS,
  FINAL_CODE,
  easterPuzzles,
  puzzles,
  roomPuzzleMap,
  victoryLessons
} = window.BlackoutPuzzles;
const effects = window.BlackoutEffects || createBlackoutEffects();
window.BlackoutEffects = effects;
const START_TRANSITION_MS = 1280;
const START_HACK_SLICES = 20;
const GAME_TITLE = "Blackout";
const START_HACK_BLOCKS = 72;
const START_HACK_GLYPHS = 34;
const HINT_COOLDOWN_SECONDS = 20;
const INITIAL_FREQUENCY = 74;
const PRE_FINAL_FREQUENCY = 94.4;
const FINAL_FREQUENCY = 95;
const DEFEAT_FREQUENCY = 73.4;
const FREQUENCY_RECOVERY_PER_PUZZLE = (PRE_FINAL_FREQUENCY - INITIAL_FREQUENCY) / 4;
const VICTORY_FREQUENCY_START = INITIAL_FREQUENCY;
const VICTORY_FREQUENCY_END = FINAL_FREQUENCY;
const VICTORY_FREQUENCY_DURATION = 3200;
const ROOM_SEQUENCE = [
  { id: "control", puzzle: "balance" },
  { id: "mixroom", puzzle: "mix" },
  { id: "weatherroom", puzzle: "weather" },
  { id: "laundry", puzzle: "offpeak" },
  { id: "electrical", puzzle: "final" }
];
const AUTO_DIALOGUE_ROOMS = new Set(["mixroom", "weatherroom", "laundry", "electrical"]);

function createBlackoutEffects() {
  let audioContext = null;
  let confettiTimer = null;
  let ambientTimer = null;
  let ambientStep = 0;
  let ambientGain = null;
  let ambientHumGain = null;
  let ambientHumOscillator = null;
  let ambientUrgencyGetter = null;

  function launchConfetti(layer) {
    if (!layer) return;

    clearConfetti(layer);
    layer.innerHTML = "";
    layer.classList.add("energy-burst-active");

    const flash = document.createElement("span");
    flash.className = "lightning-flash";
    layer.appendChild(flash);

    for (let index = 0; index < 22; index += 1) {
      const angle = (360 * index) / 22 + (Math.random() - 0.5) * 28;
      const length = 300 + Math.random() * 520;
      const height = 92 + Math.random() * 78;
      const thickness = index % 4 === 0 ? 1.35 : 1;
      const delay = Math.random() * 0.18;
      const offset = (Math.random() - 0.5) * 72;
      const bolt = buildLightningBolt(length, height, index % 3 === 0);

      bolt.style.setProperty("--angle", `${angle}deg`);
      bolt.style.setProperty("--length", `${length}px`);
      bolt.style.setProperty("--height", `${height}px`);
      bolt.style.setProperty("--thickness", thickness);
      bolt.style.setProperty("--glow-width", `${12 * thickness}px`);
      bolt.style.setProperty("--core-width", `${2.6 * thickness}px`);
      bolt.style.setProperty("--branch-glow-width", `${7 * thickness}px`);
      bolt.style.setProperty("--branch-core-width", `${1.7 * thickness}px`);
      bolt.style.setProperty("--delay", `${delay}s`);
      bolt.style.setProperty("--origin-x", `${Math.cos(angle * Math.PI / 180) * 24}px`);
      bolt.style.setProperty("--origin-y", `${Math.sin(angle * Math.PI / 180) * 12 + offset}px`);
      layer.appendChild(bolt);
    }

    confettiTimer = window.setTimeout(() => clearConfetti(layer), 2200);
  }

  function clearConfetti(layer) {
    window.clearTimeout(confettiTimer);
    confettiTimer = null;
    if (layer) {
      layer.classList.remove("energy-burst-active");
      layer.innerHTML = "";
    }
  }

  function buildLightningBolt(width, height, hasBranch) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const centerY = height / 2;
    const points = [[0, centerY]];
    const segments = 8 + Math.floor(Math.random() * 4);

    for (let step = 1; step <= segments; step += 1) {
      const x = (width / segments) * step;
      const fade = 1 - step / (segments + 1);
      const y = centerY + (Math.random() - 0.5) * height * 0.72 * fade;
      points.push([x, y]);
    }

    const mainPath = `M ${points.map((point) => point.map((value) => value.toFixed(1)).join(" ")).join(" L ")}`;
    svg.classList.add("lightning-bolt");
    svg.setAttribute("viewBox", `0 0 ${width.toFixed(0)} ${height.toFixed(0)}`);
    svg.setAttribute("aria-hidden", "true");

    addLightningPath(svg, mainPath, "lightning-glow");
    addLightningPath(svg, mainPath, "lightning-core");

    if (hasBranch) {
      const branchStartIndex = 2 + Math.floor(Math.random() * Math.max(2, points.length - 4));
      const [startX, startY] = points[branchStartIndex];
      const branchEndX = startX + width * (0.16 + Math.random() * 0.2);
      const branchEndY = startY + (Math.random() > 0.5 ? 1 : -1) * height * (0.2 + Math.random() * 0.2);
      const branchMidX = (startX + branchEndX) / 2;
      const branchMidY = (startY + branchEndY) / 2 + (Math.random() - 0.5) * height * 0.28;
      const branchPath = `M ${startX.toFixed(1)} ${startY.toFixed(1)} L ${branchMidX.toFixed(1)} ${branchMidY.toFixed(1)} L ${branchEndX.toFixed(1)} ${branchEndY.toFixed(1)}`;
      addLightningPath(svg, branchPath, "lightning-branch-glow");
      addLightningPath(svg, branchPath, "lightning-branch-core");
    }

    return svg;
  }

  function addLightningPath(svg, d, className) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("class", className);
    svg.appendChild(path);
  }

  function animateFrequencyCounter(element, from = VICTORY_FREQUENCY_START, to = VICTORY_FREQUENCY_END, duration = VICTORY_FREQUENCY_DURATION) {
    if (!element) return;

    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = from + (to - from) * eased;
      element.textContent = `${value.toFixed(1).replace(".", ",")} Hz`;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        element.textContent = `${to.toFixed(1).replace(".", ",")} Hz`;
        element.classList.add("locked");
      }
    };

    requestAnimationFrame(tick);
  }

  function playDiscoverySound() {
    playSequence([620, 930], 0.08, 0.12, 0.08);
  }

  function playBuzzerSound() {
    playSequence([180, 120, 180, 90], 0.055, 0.09, 0.16);
  }

  function playVictorySound() {
    try {
      const audio = getAudioContext();
      if (!audio) return;

      const start = audio.currentTime + 0.02;
      const master = audio.createGain();
      const filter = audio.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2600, start);
      filter.frequency.exponentialRampToValueAtTime(6400, start + 1.35);
      master.gain.setValueAtTime(0.0001, start);
      master.gain.exponentialRampToValueAtTime(0.22, start + 0.05);
      master.gain.setValueAtTime(0.22, start + 1.18);
      master.gain.exponentialRampToValueAtTime(0.0001, start + 2.05);
      filter.connect(master);
      master.connect(audio.destination);
      audio.resume();

      const lead = [
        [392, 0, 0.16, 0.09],
        [523.25, 0.12, 0.16, 0.1],
        [659.25, 0.24, 0.18, 0.11],
        [783.99, 0.38, 0.2, 0.11],
        [1046.5, 0.56, 0.52, 0.12]
      ];
      const chord = [
        [523.25, 0.7, 0.82, 0.08],
        [659.25, 0.7, 0.82, 0.075],
        [783.99, 0.7, 0.82, 0.075],
        [1046.5, 0.7, 0.72, 0.055]
      ];
      const bass = [
        [130.81, 0, 0.42, 0.09],
        [196, 0.38, 0.38, 0.08],
        [261.63, 0.72, 0.82, 0.08]
      ];
      const sparkle = [
        [1567.98, 0.98, 0.08, 0.035],
        [2093, 1.08, 0.08, 0.032],
        [2637.02, 1.18, 0.09, 0.03]
      ];

      bass.forEach(([frequency, offset, duration, volume]) => {
        playVictoryTone(audio, filter, frequency, start + offset, duration, volume, "triangle", 0.025, 0.16);
      });
      lead.forEach(([frequency, offset, duration, volume]) => {
        playVictoryTone(audio, filter, frequency, start + offset, duration, volume, "square", 0.012, 0.08);
      });
      chord.forEach(([frequency, offset, duration, volume]) => {
        playVictoryTone(audio, filter, frequency, start + offset, duration, volume, "triangle", 0.04, 0.22);
      });
      sparkle.forEach(([frequency, offset, duration, volume]) => {
        playVictoryTone(audio, filter, frequency, start + offset, duration, volume, "square", 0.006, 0.04);
      });
    } catch (error) {
      // Visual victory feedback remains available if the browser blocks sound.
    }
  }

  function playGridBootSound() {
    playSequence([100, 200, 400, 600], 0.08, 0.1, 0.14);
  }

  function startAmbient(getUrgency) {
    if (ambientTimer) return;

    const audio = getAudioContext();
    if (!audio) return;

    ambientUrgencyGetter = typeof getUrgency === "function" ? getUrgency : () => 0;
    ambientStep = 0;
    ambientGain = audio.createGain();
    ambientGain.gain.setValueAtTime(0.0001, audio.currentTime);
    ambientGain.gain.exponentialRampToValueAtTime(0.14, audio.currentTime + 0.22);
    ambientGain.connect(audio.destination);
    ambientHumGain = audio.createGain();
    ambientHumOscillator = audio.createOscillator();
    ambientHumOscillator.type = "triangle";
    ambientHumOscillator.frequency.setValueAtTime(INITIAL_FREQUENCY, audio.currentTime);
    ambientHumGain.gain.setValueAtTime(0.0001, audio.currentTime);
    ambientHumGain.gain.exponentialRampToValueAtTime(0.1, audio.currentTime + 0.35);
    ambientHumOscillator.connect(ambientHumGain);
    ambientHumGain.connect(ambientGain);
    ambientHumOscillator.start();
    void audio.resume();
    scheduleAmbientStep();
  }

  function stopAmbient() {
    window.clearTimeout(ambientTimer);
    ambientTimer = null;
    ambientUrgencyGetter = null;
    ambientStep = 0;

    if (ambientHumGain) {
      try {
        const audio = getAudioContext();
        const now = audio ? audio.currentTime : 0;
        ambientHumGain.gain.cancelScheduledValues(now);
        ambientHumGain.gain.setTargetAtTime(0.0001, now, 0.04);
      } catch (error) {
        // The ambient loop is optional, so cleanup should never block the game.
      }
    }

    if (ambientHumOscillator) {
      const oscillator = ambientHumOscillator;
      ambientHumOscillator = null;
      window.setTimeout(() => {
        try {
          oscillator.stop();
          oscillator.disconnect();
        } catch (error) {
          // Already stopped.
        }
      }, 160);
    }

    if (ambientHumGain) {
      const gain = ambientHumGain;
      ambientHumGain = null;
      window.setTimeout(() => {
        try {
          gain.disconnect();
        } catch (error) {
          // Already disconnected.
        }
      }, 190);
    }

    if (ambientGain) {
      try {
        const audio = getAudioContext();
        const now = audio ? audio.currentTime : 0;
        ambientGain.gain.cancelScheduledValues(now);
        ambientGain.gain.setTargetAtTime(0.0001, now, 0.06);
        window.setTimeout(() => {
          ambientGain?.disconnect();
          ambientGain = null;
        }, 180);
      } catch (error) {
        ambientGain = null;
      }
    }
  }

  function scheduleAmbientStep() {
    const audio = getAudioContext();
    if (!audio || !ambientGain || !ambientUrgencyGetter) {
      stopAmbient();
      return;
    }

    const urgency = clamp(ambientUrgencyGetter(), 0, 1);
    const panicMode = urgency > 0.96;
    const scale = [200, 250, 300, 350, 400, 500, 600, 700];
    const pattern = panicMode
      ? [7, 6, 7, 5, 7, 4, 7, 3]
      : urgency > 0.72
      ? [0, 2, 5, 7, 6, 4, 7, 5]
      : urgency > 0.42
        ? [0, 0, 3, 5, 4, 2, 3, 5]
        : [0, 0, 2, 0, 3, 0, 1, 0];
    const note = scale[pattern[ambientStep % pattern.length]];
    const octaveBoost = panicMode || (urgency > 0.65 && ambientStep % 4 === 3) ? 2 : 1;
    const duration = panicMode ? 0.038 : 0.055 + urgency * 0.035;
    const gapMs = panicMode ? 46 : Math.max(95, 360 - urgency * 230);

    ambientGain.gain.setTargetAtTime(panicMode ? 0.24 : 0.13 + urgency * 0.08, audio.currentTime, 0.08);
    if (ambientHumOscillator && ambientHumGain) {
      ambientHumOscillator.frequency.setTargetAtTime(
        panicMode ? DEFEAT_FREQUENCY : FINAL_FREQUENCY - urgency * (FINAL_FREQUENCY - INITIAL_FREQUENCY),
        audio.currentTime,
        0.12
      );
      ambientHumGain.gain.setTargetAtTime(panicMode ? 0.22 : 0.09 + urgency * 0.08, audio.currentTime, 0.12);
    }
    playAmbientTone(note * octaveBoost, duration, panicMode ? 0.32 : 0.16 + urgency * 0.08, "square");

    if (panicMode || ambientStep % 4 === 0) {
      playAmbientTone(100 + urgency * 50, 0.09, 0.08, "triangle");
    }

    if (panicMode) {
      playAmbientTone(1200, 0.035, 0.18, "square");
      if (ambientStep % 2 === 0) {
        playAmbientTone(1500, 0.026, 0.14, "square");
      }
    } else if (urgency > 0.5 && ambientStep % 8 === 6) {
      playAmbientTone(800, 0.05, 0.08 + urgency * 0.04, "square");
      playAmbientTone(1000, 0.05, 0.06 + urgency * 0.035, "square");
    }

    if (urgency > 0.82 && ambientStep % 2 === 1) {
      playAmbientTone(note * 1.5, 0.035, 0.07, "square");
    }

    ambientStep += 1;
    ambientTimer = window.setTimeout(scheduleAmbientStep, gapMs);
  }

  function playAmbientTone(frequency, duration, volume, type) {
    try {
      const audio = getAudioContext();
      if (!audio || !ambientGain) return;

      const oscillator = audio.createOscillator();
      const noteGain = audio.createGain();
      const start = audio.currentTime;
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      noteGain.gain.setValueAtTime(0.0001, start);
      noteGain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(noteGain);
      noteGain.connect(ambientGain);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    } catch (error) {
      stopAmbient();
    }
  }

  function playSequence(notes, interval, length, volume) {
    try {
      const audio = getAudioContext();
      if (!audio) return;

      const gain = audio.createGain();
      gain.gain.setValueAtTime(0.0001, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(volume, audio.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + notes.length * interval + 0.32);
      gain.connect(audio.destination);
      audio.resume();

      notes.forEach((frequency, index) => {
        const oscillator = audio.createOscillator();
        const start = audio.currentTime + index * interval;
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(frequency, start);
        oscillator.connect(gain);
        oscillator.start(start);
        oscillator.stop(start + length);
      });
    } catch (error) {
      // Visual feedback remains the source of truth if the browser blocks sound.
    }
  }

  function playVictoryTone(audio, destination, frequency, start, duration, volume, type, attack, release) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const end = start + duration;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + attack);
    gain.gain.setValueAtTime(volume, Math.max(start + attack, end - release));
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(start);
    oscillator.stop(end + 0.04);
  }

  function getAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!audioContext || audioContext.state === "closed") {
      audioContext = new AudioContext();
    }
    return audioContext;
  }

  function unlockAudio() {
    const audio = getAudioContext();
    if (audio && audio.state === "suspended") {
      void audio.resume();
    }
  }

  function stopAudioFeedback() {
    stopAmbient();
    if (!audioContext) return;

    const audio = audioContext;
    audioContext = null;
    if (audio.state !== "closed") {
      void audio.close();
    }
  }

  return {
    launchConfetti,
    clearConfetti,
    animateFrequencyCounter,
    playDiscoverySound,
    playBuzzerSound,
    playVictorySound,
    playGridBootSound,
    startAmbient,
    stopAmbient,
    unlockAudio,
    stopAudioFeedback
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

const state = {
  secondsLeft: INITIAL_SECONDS,
  overload: 100,
  frequency: INITIAL_FREQUENCY,
  solved: new Set(),
  code: ["?", "?", "?", "?", "?", "?", "?"],
  activePuzzle: null,
  activeEasterPuzzle: null,
  currentRoom: "control",
  dialogueCallback: null,
  easterEggs: new Set(),
  solvedEasterEggs: new Set(),
  discoveryToastTimer: null,
  hintIndex: 0,
  hintCooldownRemaining: 0,
  hintCooldownTimer: null,
  timerId: null,
  timerPausedForDialogue: false,
  ended: false,
  demoMode: false,
  audioStarted: false,
  startTransitioning: false,
  startTransitionTimer: null
};

window.BlackoutPuzzleHelpers = {
  checkbox,
  checked,
  value,
  selectRow,
  availabilityRow
};

const els = {
  creatorBanner: document.querySelector("#creatorBanner"),
  closeCreatorBanner: document.querySelector("#closeCreatorBanner"),
  startScreen: document.querySelector("#startScreen"),
  startButton: document.querySelector("#startButton"),
  demoButton: document.querySelector("#demoButton"),
  modeBadge: document.querySelector("#modeBadge"),
  stage: document.querySelector(".stage"),
  timer: document.querySelector("#timer"),
  frequency: document.querySelector("#frequency"),
  gaugeFill: document.querySelector("#gaugeFill"),
  gaugeText: document.querySelector("#gaugeText"),
  codeSlots: document.querySelector("#codeSlots"),
  logList: document.querySelector("#logList"),
  guideStep: document.querySelector("#guideStep"),
  discoveryToast: document.querySelector("#discoveryToast"),
  modalBackdrop: document.querySelector("#modalBackdrop"),
  modalKicker: document.querySelector("#modalKicker"),
  modalTitle: document.querySelector("#modalTitle"),
  modalBody: document.querySelector("#modalBody"),
  closeModal: document.querySelector("#closeModal"),
  hintButton: document.querySelector("#hintButton"),
  submitButton: document.querySelector("#submitButton"),
  feedback: document.querySelector("#feedback"),
  endScreen: document.querySelector("#endScreen"),
  endKicker: document.querySelector("#endKicker"),
  endTitle: document.querySelector("#endTitle"),
  endText: document.querySelector("#endText"),
  confettiLayer: document.querySelector("#confettiLayer"),
  homeButton: document.querySelector("#homeButton"),
  restartButton: document.querySelector("#restartButton"),
  dialogueLayer: document.querySelector("#dialogueLayer"),
  dialogueSpeaker: document.querySelector("#dialogueSpeaker"),
  dialogueText: document.querySelector("#dialogueText"),
  dialogueNext: document.querySelector("#dialogueNext"),
  juryTools: document.querySelector("#juryTools"),
  juryLesson: document.querySelector("#juryLesson"),
  jurySolveCurrent: document.querySelector("#jurySolveCurrent"),
  juryVictoryButton: document.querySelector("#juryVictoryButton"),
  juryDefeatButton: document.querySelector("#juryDefeatButton")
};

function enforceGameTitle() {
  document.title = GAME_TITLE;
  document.querySelector("#startTitle")?.replaceChildren(GAME_TITLE);
  document.querySelector(".brand h1")?.replaceChildren(GAME_TITLE);
}

enforceGameTitle();

document.querySelectorAll(".hotspot").forEach((button) => {
  button.addEventListener("click", () => openPuzzle(button.dataset.puzzle));
});

document.querySelectorAll("[data-room-target]").forEach((button) => {
  button.addEventListener("click", () => changeRoom(button.dataset.roomTarget));
});

document.querySelectorAll(".easter-egg").forEach((egg, index) => {
  const id = egg.dataset.eggId || `egg-${index + 1}`;
  const number = Number(egg.dataset.eggNumber || index + 1);
  const reveal = () => {
    egg.classList.add("revealed");
    discoverEasterEgg(id, number);
  };
  egg.addEventListener("mouseenter", reveal);
  egg.addEventListener("mouseover", reveal);
  egg.addEventListener("pointerenter", reveal);
  egg.addEventListener("focus", reveal);
  egg.addEventListener("click", reveal);
  egg.addEventListener("touchstart", reveal);
});

document.querySelectorAll(".mix-info-marker, .tech-info-marker").forEach((marker) => {
  const keepGreen = () => marker.classList.add("info-marker-seen");
  marker.addEventListener("pointerenter", keepGreen);
  marker.addEventListener("mouseenter", keepGreen);
  marker.addEventListener("focus", keepGreen);
  marker.addEventListener("touchstart", keepGreen);
});

els.closeModal.addEventListener("click", closeModal);
els.hintButton.addEventListener("click", showHint);
els.submitButton.addEventListener("click", submitPuzzle);
els.modalBody.addEventListener("change", () => clearAnswerFeedback());
els.modalBody.addEventListener("input", () => clearAnswerFeedback());
els.modalBody.addEventListener("keydown", handleModalKeydown);
els.homeButton.addEventListener("click", restart);
els.restartButton.addEventListener("click", restart);
els.dialogueNext.addEventListener("click", closeDialogue);
els.startButton.addEventListener("click", startGame);
els.demoButton.addEventListener("click", startDemoGame);
els.jurySolveCurrent.addEventListener("click", solveCurrentJuryPuzzle);
els.juryVictoryButton.addEventListener("click", triggerJuryVictory);
els.juryDefeatButton.addEventListener("click", triggerJuryDefeat);
document.querySelectorAll("[data-jury-room]").forEach((button) => {
  button.addEventListener("click", () => changeRoom(button.dataset.juryRoom));
});
els.closeCreatorBanner.addEventListener("click", () => {
  els.creatorBanner.classList.add("hidden");
  els.startButton.disabled = false;
  els.demoButton.disabled = false;
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

document.addEventListener("pointerdown", effects.unlockAudio, { passive: true });

changeRoom(state.currentRoom);
renderHud();
resetLog();

els.dialogueLayer.classList.add("hidden");

function startGame() {
  if (!els.creatorBanner.classList.contains("hidden")) {
    return;
  }
  if (state.startTransitioning) {
    return;
  }
  state.demoMode = false;
  beginGame();
}

function startDemoGame() {
  if (!els.creatorBanner.classList.contains("hidden")) {
    return;
  }
  if (state.startTransitioning) {
    return;
  }
  state.demoMode = true;
  addLog("main", `Jury mode enabled. Final code: ${FINAL_CODE}.`);
  beginGame();
}

function beginGame() {
  const enterGame = () => {
    clearStartTransition();
    els.startScreen.classList.add("hidden");
    renderHud();
    showDialogue("Grid Dispatch", introDialogue, () => {
      startTimer();
    });
  };

  runStartTransition(enterGame);
}

function runStartTransition(onDone) {
  clearStartTransition();

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    onDone();
    return;
  }

  state.startTransitioning = true;
  els.startButton.disabled = true;
  els.demoButton.disabled = true;
  createStartHackField();
  els.startScreen.classList.add("hacking-corrupt");
  state.startTransitionTimer = window.setTimeout(onDone, START_TRANSITION_MS);
}

function clearStartTransition() {
  window.clearTimeout(state.startTransitionTimer);
  state.startTransitionTimer = null;
  state.startTransitioning = false;
  els.startScreen.classList.remove("hacking-corrupt");
  els.startScreen.querySelector(".start-hack-field")?.remove();
}

function createStartHackField() {
  els.startScreen.querySelector(".start-hack-field")?.remove();

  const bounds = els.startScreen.getBoundingClientRect();
  const field = document.createElement("div");
  field.className = "start-hack-field";
  field.setAttribute("aria-hidden", "true");

  const scan = document.createElement("span");
  scan.className = "start-hack-scan";
  field.append(scan);

  for (let index = 0; index < START_HACK_SLICES; index += 1) {
    const slice = document.createElement("span");
    const top = Math.random() * 92;
    const height = 2 + Math.random() * 9;
    const shift = (Math.random() > 0.5 ? 1 : -1) * (18 + Math.random() * 90);

    slice.className = "start-hack-slice";
    slice.style.top = `${top}%`;
    slice.style.height = `${height}px`;
    slice.style.setProperty("--delay", `${0.05 + Math.random() * 0.55}s`);
    slice.style.setProperty("--duration", `${0.22 + Math.random() * 0.38}s`);
    slice.style.setProperty("--shift", `${shift}px`);
    slice.style.setProperty("--alpha", `${0.28 + Math.random() * 0.48}`);
    field.append(slice);
  }

  for (let index = 0; index < START_HACK_BLOCKS; index += 1) {
    const block = document.createElement("span");
    const width = 8 + Math.random() * Math.min(96, bounds.width * 0.11);
    const height = 4 + Math.random() * 28;

    block.className = "start-hack-block";
    block.style.left = `${Math.random() * 100}%`;
    block.style.top = `${Math.random() * 100}%`;
    block.style.width = `${width}px`;
    block.style.height = `${height}px`;
    block.style.setProperty("--delay", `${0.08 + Math.random() * 0.68}s`);
    block.style.setProperty("--duration", `${0.26 + Math.random() * 0.46}s`);
    block.style.setProperty("--shift", `${(Math.random() - 0.5) * 150}px`);
    block.style.setProperty("--tone", Math.random() > 0.55 ? "rgba(128, 255, 90, 0.78)" : "rgba(0, 232, 255, 0.68)");
    field.append(block);
  }

  for (let index = 0; index < START_HACK_GLYPHS; index += 1) {
    const glyph = document.createElement("span");
    glyph.className = "start-hack-glyph";
    glyph.textContent = randomHackToken();
    glyph.style.left = `${Math.random() * 96}%`;
    glyph.style.top = `${Math.random() * 94}%`;
    glyph.style.setProperty("--delay", `${0.02 + Math.random() * 0.62}s`);
    glyph.style.setProperty("--duration", `${0.36 + Math.random() * 0.58}s`);
    glyph.style.setProperty("--size", `${10 + Math.random() * 15}px`);
    field.append(glyph);
  }

  els.startScreen.append(field);
}

function randomHackToken() {
  const tokens = [
    "010010",
    "1101",
    "95HZ",
    "74.0",
    "GRID",
    "NOISE",
    "ROOT",
    "///",
    "ERR",
    "SYNC"
  ];
  return tokens[Math.floor(Math.random() * tokens.length)];
}

function changeRoom(roomId) {
  if (!isRoomUnlocked(roomId)) {
    showLockedRoomFeedback(roomId);
    updateRoomLocks();
    return;
  }

  state.currentRoom = roomId;
  document.querySelectorAll("[data-room]").forEach((room) => {
    const isActive = room.dataset.room === roomId;
    room.classList.toggle("hidden-room", !isActive);
    room.classList.toggle("active", isActive);
  });
  document.querySelectorAll(".room-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.roomTarget === roomId);
  });
  updateRoomLocks();
  updateGuide();
  updateJuryPanel();
  if (syncOpenPuzzleIntro(roomId)) {
    return;
  }
  if (openRoomPuzzleIntroIfNeeded(roomId)) {
    return;
  }
  if (!els.dialogueLayer.classList.contains("hidden")) {
    positionDialogueLayer();
  }
}

function syncOpenPuzzleIntro(roomId) {
  if (!state.activePuzzle) return false;
  if (els.dialogueLayer.classList.contains("hidden")) return false;
  if (!els.modalBackdrop.classList.contains("hidden")) return false;
  const id = roomPuzzleMap[roomId];
  if (!id || !puzzles[id]) return false;

  if (state.activePuzzle !== id) {
    openPuzzle(id);
    return true;
  }

  positionDialogueLayer();
  return true;
}

function openRoomPuzzleIntroIfNeeded(roomId) {
  if (!AUTO_DIALOGUE_ROOMS.has(roomId)) return false;
  if (!els.dialogueLayer.classList.contains("hidden")) return false;
  if (!els.modalBackdrop.classList.contains("hidden")) return false;

  const id = roomPuzzleMap[roomId];
  if (!id || !puzzles[id] || state.solved.has(id)) return false;

  openPuzzle(id);
  return true;
}

function isRoomUnlocked(roomId) {
  const requiredPuzzle = getRequiredPuzzleForRoom(roomId);
  return !requiredPuzzle || state.solved.has(requiredPuzzle);
}

function getRequiredPuzzleForRoom(roomId) {
  const roomIndex = ROOM_SEQUENCE.findIndex((room) => room.id === roomId);
  if (roomIndex <= 0) return null;
  return ROOM_SEQUENCE[roomIndex - 1].puzzle;
}

function getLockedRoomMessage(roomId) {
  const requiredPuzzle = getRequiredPuzzleForRoom(roomId);
  const puzzle = puzzles[requiredPuzzle];
  return puzzle
    ? `Room locked: solve ${puzzle.kicker} first.`
    : "Room locked.";
}

function showLockedRoomFeedback(roomId) {
  if (els.guideStep) {
    els.guideStep.textContent = getLockedRoomMessage(roomId);
  }
}

function updateRoomLocks() {
  document.querySelectorAll("[data-room-target], [data-jury-room]").forEach((button) => {
    const targetRoom = button.dataset.roomTarget || button.dataset.juryRoom;
    const locked = !isRoomUnlocked(targetRoom);
    button.disabled = locked;
    button.classList.toggle("locked", locked);
    button.setAttribute("aria-disabled", locked ? "true" : "false");

    if (locked) {
      button.title = getLockedRoomMessage(targetRoom);
    } else {
      button.removeAttribute("title");
    }
  });

  updateNextRoomPrompt();
}

function updateNextRoomPrompt() {
  document.querySelectorAll(".door-next").forEach((door) => {
    door.classList.remove("next-room-ready");
  });

  const currentPuzzle = roomPuzzleMap[state.currentRoom];
  if (!currentPuzzle || !state.solved.has(currentPuzzle)) return;

  const activeRoom = document.querySelector(`[data-room="${state.currentRoom}"]`);
  const nextDoor = activeRoom?.querySelector(".door-next");
  if (!nextDoor || nextDoor.disabled) return;

  nextDoor.classList.add("next-room-ready");
}

function openPuzzle(id) {
  if (state.ended) return;

  const puzzle = puzzles[id];
  if (!puzzle) return;
  state.activeEasterPuzzle = null;
  state.activePuzzle = id;
  state.hintIndex = 0;
  showDialogue(puzzle.kicker, puzzle.startDialogue, () => showPuzzleModal(id));
}

function showPuzzleModal(id) {
  if (state.ended || state.activePuzzle !== id) return;

  const puzzle = puzzles[id];
  if (!puzzle) return;
  els.modalKicker.textContent = puzzle.kicker;
  els.modalTitle.textContent = puzzle.title;
  els.modalBody.innerHTML = puzzle.render();
  els.feedback.textContent = "";
  els.hintButton.classList.remove("hidden");
  renderHintButton();
  els.submitButton.textContent = id === "final" ? "Stabilize" : "Submit";
  els.modalBackdrop.classList.remove("hidden");
}

function closeModal() {
  els.modalBackdrop.classList.add("hidden");
  els.modalBackdrop.classList.remove("easter-mode");
  state.activePuzzle = null;
  state.activeEasterPuzzle = null;
  renderHintButton();
}

function handleModalKeydown(event) {
  if (event.key !== "Enter") return;
  if (event.isComposing) return;

  const target = event.target;
  const isTextField = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
  if (!isTextField) return;

  event.preventDefault();
  submitPuzzle();
}

function formatDialogueText(text) {
  const rawText = String(text || "").trim();
  if (!rawText.includes("\n")) {
    return rawText;
  }

  return rawText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim().replace(/\n/g, "<br>"))
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join("");
}

function showDialogue(speaker, text, onClose = null) {
  pauseTimerForDialogue();
  state.dialogueCallback = onClose;
  els.dialogueSpeaker.textContent = speaker;
  els.dialogueText.innerHTML = formatDialogueText(text);
  positionDialogueLayer();
  els.dialogueLayer.classList.remove("hidden");
}

function closeDialogue() {
  els.dialogueLayer.classList.add("hidden");
  startAudioAfterFirstConfirm();
  const callback = state.dialogueCallback;
  state.dialogueCallback = null;
  if (callback) {
    callback();
  }
  resumeTimerAfterDialogue();
}

function pauseTimerForDialogue() {
  if (state.demoMode || state.ended || !state.timerId) return;

  clearInterval(state.timerId);
  state.timerId = null;
  state.timerPausedForDialogue = true;
}

function resumeTimerAfterDialogue() {
  if (!state.timerPausedForDialogue || state.demoMode || state.ended) return;

  state.timerPausedForDialogue = false;
  startTimer();
}

function startAudioAfterFirstConfirm() {
  if (state.audioStarted || state.ended || !els.startScreen.classList.contains("hidden")) {
    return;
  }

  state.audioStarted = true;
  effects.unlockAudio();
  effects.playGridBootSound();
  effects.startAmbient(getAmbientUrgency);
}

function positionDialogueLayer() {
  const activeRoom = document.querySelector("[data-room].active");
  const rect = (activeRoom || els.stage).getBoundingClientRect();
  els.dialogueLayer.style.left = `${rect.left}px`;
  els.dialogueLayer.style.top = `${rect.top}px`;
  els.dialogueLayer.style.width = `${rect.width}px`;
  els.dialogueLayer.style.height = `${rect.height}px`;
}

window.addEventListener("resize", () => {
  if (!els.dialogueLayer.classList.contains("hidden")) {
    positionDialogueLayer();
  }
});

window.addEventListener("scroll", () => {
  if (!els.dialogueLayer.classList.contains("hidden")) {
    positionDialogueLayer();
  }
}, { passive: true });

function discoverEasterEgg(id, number) {
  const puzzle = easterPuzzles[id];
  const order = puzzle?.order || number;
  const label = puzzle?.label || `Hint ${order}`;

  if (!state.easterEggs.has(id)) {
    state.easterEggs.add(id);
    showDiscoveryToast();
    effects.playDiscoverySound();
    addLog("easter", `${label} ${order}/3 discovered.`);
  }
  if (!state.solvedEasterEggs.has(id)) {
    openEasterPuzzle(id, order);
  }
}

function openEasterPuzzle(id, number) {
  if (state.ended) return;
  const puzzle = easterPuzzles[id];
  if (!puzzle) return;

  state.activePuzzle = null;
  state.activeEasterPuzzle = id;
  els.modalKicker.textContent = `Easter egg ${number}/3`;
  els.modalTitle.textContent = puzzle.title;
  els.modalBody.innerHTML = `
    <p>${puzzle.question}</p>
    <input type="text" name="easterAnswer" aria-label="Easter egg answer" placeholder="Your answer">
  `;
  els.feedback.textContent = "";
  els.hintButton.classList.remove("hidden");
  renderHintButton();
  els.submitButton.textContent = "Submit";
  els.modalBackdrop.classList.add("easter-mode");
  els.modalBackdrop.classList.remove("hidden");
}

function renderHintButton() {
  if (!els.hintButton) return;

  const hasActiveHint = Boolean(state.activePuzzle || state.activeEasterPuzzle);
  if (!hasActiveHint) {
    els.hintButton.disabled = false;
    return;
  }

  if (state.hintCooldownRemaining > 0) {
    els.hintButton.disabled = true;
    els.hintButton.textContent = `Hint available in ${state.hintCooldownRemaining} sec`;
    return;
  }

  els.hintButton.disabled = false;
  els.hintButton.textContent = state.activeEasterPuzzle
    ? "Hint"
    : state.demoMode
      ? "Hint"
      : `Hint (-${HINT_COOLDOWN_SECONDS} s)`;
}

function clearHintCooldown() {
  window.clearInterval(state.hintCooldownTimer);
  state.hintCooldownTimer = null;
  state.hintCooldownRemaining = 0;
  renderHintButton();
}

function startHintCooldown() {
  window.clearInterval(state.hintCooldownTimer);
  state.hintCooldownRemaining = HINT_COOLDOWN_SECONDS;
  renderHintButton();

  state.hintCooldownTimer = window.setInterval(() => {
    if (state.ended) {
      clearHintCooldown();
      return;
    }

    state.hintCooldownRemaining = Math.max(0, state.hintCooldownRemaining - 1);
    if (state.hintCooldownRemaining === 0) {
      clearHintCooldown();
      return;
    }

    renderHintButton();
  }, 1000);
}

function showHint() {
  if (state.hintCooldownRemaining > 0 || state.ended) return;

  if (state.activeEasterPuzzle) {
    const puzzle = easterPuzzles[state.activeEasterPuzzle];
    if (!puzzle) return;
    els.feedback.textContent = puzzle.hint || "Look closely at the hidden image.";
    startHintCooldown();
    return;
  }

  const puzzle = puzzles[state.activePuzzle];
  if (!puzzle) return;

  const hints = puzzle.hints && puzzle.hints.length > 0
    ? puzzle.hints
    : ["Look at the important elements in the room."];
  const hint = hints[Math.min(state.hintIndex, hints.length - 1)];
  state.hintIndex += 1;
  if (!state.demoMode) {
    state.secondsLeft = Math.max(0, state.secondsLeft - HINT_COOLDOWN_SECONDS);
  }
  els.feedback.textContent = hint;
  renderHud();
  if (!state.demoMode && state.secondsLeft <= 0) {
    loseGame();
    return;
  }
  startHintCooldown();
}

function clearAnswerFeedback(root = els.modalBody) {
  if (!root) return;
  root.querySelectorAll(".answer-correct, .answer-wrong").forEach((element) => {
    element.classList.remove("answer-correct", "answer-wrong");
  });
}

function setAnswerFeedback(element, isCorrect) {
  if (!element) return;
  element.classList.toggle("answer-correct", isCorrect);
  element.classList.toggle("answer-wrong", !isCorrect);
}

function showPuzzleCorrection(id, root) {
  clearAnswerFeedback(root);

  const correction = puzzles[id]?.correction;
  if (!correction) return;

  if (correction.type === "checkbox") {
    markCheckboxCorrection(root, correction.expected);
    return;
  }

  if (correction.type === "select") {
    markSelectCorrection(root, correction.expected);
    return;
  }

  if (correction.type === "text") {
    setAnswerFeedback(root.querySelector(`[name="${correction.field}"]`), false);
  }
}

function showEasterCorrection(root) {
  clearAnswerFeedback(root);
  setAnswerFeedback(root.querySelector('[name="easterAnswer"]'), false);
}

function markCheckboxCorrection(root, expectedByName) {
  if (!expectedByName) return;

  Object.entries(expectedByName).forEach(([name, expected]) => {
    const input = root.querySelector(`[name="${name}"]`);
    if (!input?.checked) return;

    const row = input?.closest("label");
    setAnswerFeedback(row, expected);
  });
}

function markSelectCorrection(root, expectedByName) {
  if (!expectedByName) return;

  Object.entries(expectedByName).forEach(([name, expected]) => {
    const input = root.querySelector(`[name="${name}"]`);
    if (!input?.value) return;

    const row = input?.closest("label");
    setAnswerFeedback(row, input?.value === expected);
  });
}

function submitPuzzle() {
  if (state.activeEasterPuzzle) {
    submitEasterPuzzle();
    return;
  }

  const id = state.activePuzzle;
  const puzzle = puzzles[id];
  if (!puzzle) return;

  const isCorrect = puzzle.validate(els.modalBody);

  if (!isCorrect) {
    effects.playBuzzerSound();
    showPuzzleCorrection(id, els.modalBody);
  }

  if (id === "final" && !isCorrect) {
    const input = els.modalBody.querySelector('[name="finalCode"]');
    const typedCode = input ? input.value.trim() : "";
    els.feedback.textContent = `The panel rejects code ${typedCode || "empty"}. Check the digit order.`;
    return;
  }

  if (!isCorrect) {
    els.feedback.textContent = id === "final"
      ? "The panel rejects the code. Check the fragments we collected."
      : "The grid is not stable yet. Try a different setup.";
    return;
  }

  clearAnswerFeedback();
  if (id === "final") {
    winGame();
    return;
  }

  effects.playDiscoverySound();
  completeMainPuzzle(id);
  els.feedback.textContent = `Correct. Fragment collected: ${puzzle.digit}.`;
  closeModal();
  showDialogue(
    "What we just learned",
    `${puzzle.endDialogue}\n\nGreat job, we collected a <strong>code fragment: ${puzzle.digit}</strong>.`
  );
}

function completeMainPuzzle(id, options = {}) {
  const puzzle = puzzles[id];
  if (!puzzle || id === "final") return false;

  if (!state.solved.has(id)) {
    state.solved.add(id);
    state.overload = Math.max(20, state.overload - 20);
    state.frequency = Math.min(PRE_FINAL_FREQUENCY, state.frequency + FREQUENCY_RECOVERY_PER_PUZZLE);
    state.code[puzzle.index] = puzzle.digit;
    document.querySelector(`[data-puzzle="${id}"]`)?.classList.add("solved");
    const prefix = options.fromJury ? "Jury mode: " : "";
    addLog("main", `${prefix}${puzzle.kicker} solved. Fragment ${puzzle.digit}.`);
  }

  renderHud();
  return true;
}

function solveCurrentJuryPuzzle() {
  if (!state.demoMode || state.ended) return;

  const id = roomPuzzleMap[state.currentRoom];
  if (areMainPuzzlesSolved()) return;

  if (id === "final") {
    triggerJuryVictory();
    return;
  }

  const puzzle = puzzles[id];
  if (!puzzle) return;

  completeMainPuzzle(id, { fromJury: true });
  showDialogue(
    "Jury mode",
    `${puzzle.endDialogue}

<strong>Grid fragment displayed: ${puzzle.digit}</strong>.`
  );
}

function triggerJuryVictory() {
  if (!state.demoMode || state.ended) return;

  grantAllFragmentsForJury();
  addLog("main", "Victory triggered.");
  winGame();
}

function areMainPuzzlesSolved() {
  return ROOM_SEQUENCE
    .filter((room) => room.puzzle !== "final")
    .every((room) => state.solved.has(room.puzzle));
}

function triggerJuryDefeat() {
  if (!state.demoMode || state.ended) return;

  state.secondsLeft = 0;
  state.overload = 100;
  state.frequency = DEFEAT_FREQUENCY;
  addLog("main", "Jury mode: defeat triggered by timer expiration.");
  renderHud();
  loseGame();
}

function grantAllFragmentsForJury() {
  Object.keys(puzzles)
    .filter((id) => id !== "final")
    .forEach((id) => completeMainPuzzle(id, { fromJury: true }));

  let addedBonus = false;
  Object.entries(easterPuzzles).forEach(([id, puzzle]) => {
    state.easterEggs.add(id);
    document.querySelector(`[data-egg-id="${id}"]`)?.classList.add("revealed");

    if (!state.solvedEasterEggs.has(id)) {
      state.solvedEasterEggs.add(id);
      state.code[puzzle.index] = puzzle.digit;
      addedBonus = true;
    }
  });

  if (addedBonus) {
    addLog("easter", "Hidden fragments revealed.");
  }

  renderHud();
}

function submitEasterPuzzle() {
  const id = state.activeEasterPuzzle;
  const puzzle = easterPuzzles[id];
  if (!puzzle) return;

  const input = els.modalBody.querySelector('[name="easterAnswer"]');
  const answer = input ? input.value : "";

  if (!isEasterAnswerCorrect(answer, puzzle)) {
    effects.playBuzzerSound();
    showEasterCorrection(els.modalBody);
    els.feedback.textContent = puzzle.hint
      ? `That is not the right answer. Hint: ${puzzle.hint}`
      : "That is not the right answer. Look closely at the easter egg.";
    return;
  }

  clearAnswerFeedback();
  effects.playDiscoverySound();
  if (!state.solvedEasterEggs.has(id)) {
    state.solvedEasterEggs.add(id);
    state.code[puzzle.index] = puzzle.digit;
    addLog("easter", `${puzzle.label || "Bonus"} ${puzzle.order || "?"}/3 solved. Fragment ${puzzle.digit}.`);
  }

  els.feedback.textContent = `Correct. Bonus fragment collected: ${puzzle.digit}.`;
  renderHud();
  closeModal();
  showDialogue(
    "Easter egg solved",
    `${puzzle.success}\n\nGreat job, we collected a <strong>code fragment: ${puzzle.digit}</strong>.`
  );
}

function winGame() {
  state.ended = true;
  clearInterval(state.timerId);
  state.timerId = null;
  state.timerPausedForDialogue = false;
  state.overload = 0;
  state.frequency = FINAL_FREQUENCY;
  document.querySelector('[data-puzzle="final"]')?.classList.add("solved");
  renderHud();
  closeModal();
  const progressLabel = state.demoMode
    ? "<strong>Jury mode</strong> guided presentation"
    : `<strong>${formatClock(state.secondsLeft)}</strong> time remaining`;
  const solvedMain = state.solved.size;
  const solvedBonus = state.solvedEasterEggs.size;
  const lessons = victoryLessons.map((lesson) => `
    <span>
      <strong>${lesson.title}</strong>
      ${lesson.text}
    </span>
  `).join("");

  showEnd(
    "Grid stabilized",
    "Victory",
    `
      <div class="victory-panel">
        <div class="victory-stage victory-stage-compact">
          <div class="victory-frequency-card">
            <span>Grid frequency</span>
            <strong class="victory-frequency-counter" id="victoryFrequencyCounter">${VICTORY_FREQUENCY_START.toFixed(1).replace(".", ",")} Hz</strong>
            <span>Stability restored</span>
          </div>
          <span class="victory-lead">The city lights back up. The frequency returns to a stable value: we prevented the blackout.</span>
        </div>
      </div>
      <span class="victory-report">
        <span><strong>${solvedMain}/4</strong> grid fragments</span>
        <span><strong>${solvedBonus}/3</strong> hidden fragments</span>
        <span>${progressLabel}</span>
      </span>
      <span class="victory-grid">
        ${lessons}
      </span>
      <span class="victory-code">Final report: the grid holds when production, demand, and timing stay aligned.</span>
      <span class="victory-conclusion">We did not just prevent the blackout: we understood why it happens.</span>
    `
  );
}

function loseGame() {
  state.ended = true;
  clearInterval(state.timerId);
  state.timerId = null;
  state.timerPausedForDialogue = false;
  closeModal();
  showEnd(
    "The timer expired",
    "A grid overload has caused a blackout across the region",
    "<p>Production and consumption were not rebalanced in time. Even failure teaches the key lesson: to avoid an outage, we must act on available production and on when electricity is used.</p>"
  );
}

function showEnd(kicker, title, text) {
  els.dialogueLayer.classList.add("hidden");
  els.modalBackdrop.classList.add("hidden");
  clearHintCooldown();
  effects.stopAmbient();
  effects.clearConfetti(els.confettiLayer);
  els.endScreen.classList.toggle("defeat-screen", title !== "Victory");
  els.endKicker.textContent = kicker;
  els.endTitle.textContent = title;
  els.endText.innerHTML = text;
  els.endScreen.classList.remove("hidden");
  if (title === "Victory") {
    effects.playVictorySound();
    effects.launchConfetti(els.confettiLayer);
    effects.animateFrequencyCounter(
      document.querySelector("#victoryFrequencyCounter"),
      VICTORY_FREQUENCY_START,
      VICTORY_FREQUENCY_END,
      VICTORY_FREQUENCY_DURATION
    );
  }
}

function restart() {
  clearStartTransition();
  effects.stopAudioFeedback();
  state.secondsLeft = INITIAL_SECONDS;
  state.overload = 100;
  state.frequency = INITIAL_FREQUENCY;
  state.solved = new Set();
  state.code = ["?", "?", "?", "?", "?", "?", "?"];
  state.activePuzzle = null;
  state.activeEasterPuzzle = null;
  state.currentRoom = "control";
  state.dialogueCallback = null;
  state.easterEggs = new Set();
  state.solvedEasterEggs = new Set();
  window.clearTimeout(state.discoveryToastTimer);
  effects.clearConfetti(els.confettiLayer);
  els.discoveryToast.classList.add("hidden");
  els.discoveryToast.classList.remove("show");
  state.hintIndex = 0;
  clearHintCooldown();
  state.ended = false;
  state.demoMode = false;
  state.audioStarted = false;
  state.timerPausedForDialogue = false;
  document.querySelectorAll(".hotspot").forEach((button) => button.classList.remove("solved"));
  document.querySelectorAll(".easter-egg").forEach((egg) => egg.classList.remove("revealed"));
  resetLog();
  els.endScreen.classList.add("hidden");
  els.dialogueLayer.classList.add("hidden");
  els.modalBackdrop.classList.add("hidden");
  els.modalBackdrop.classList.remove("easter-mode");
  clearInterval(state.timerId);
  state.timerId = null;
  changeRoom(state.currentRoom);
  renderHud();
  els.startScreen.classList.remove("hidden");
  els.creatorBanner.classList.remove("hidden");
  els.startButton.disabled = true;
  els.demoButton.disabled = true;
  enforceGameTitle();
}

function startTimer() {
  clearInterval(state.timerId);
  state.timerId = null;
  state.timerPausedForDialogue = false;
  if (state.demoMode) {
    renderHud();
    return;
  }
  state.timerId = setInterval(() => {
    if (state.ended) return;
    state.secondsLeft -= 1;
    if (state.secondsLeft <= 0) {
      state.secondsLeft = 0;
      renderHud();
      loseGame();
      return;
    }
    renderHud();
  }, 1000);
}

function renderHud() {
  els.timer.textContent = state.demoMode ? "DEMO" : formatClock(state.secondsLeft);
  els.timer.closest(".timer-card")?.classList.toggle("critical-time", !state.demoMode && state.secondsLeft <= 30);
  els.modeBadge.classList.toggle("hidden", !state.demoMode);
  els.frequency.textContent = `${state.frequency.toFixed(1).replace(".", ",")} Hz`;
  els.gaugeFill.style.width = `${state.overload}%`;
  els.gaugeText.textContent = `${state.overload}%`;
  renderCodeFragments();
  updateRoomLocks();
  updateGuide();
  updateJuryPanel();
}

function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getAmbientUrgency() {
  if (state.ended) return 0;
  if (state.demoMode) return 0.28;
  if (state.secondsLeft <= 30) return 1;

  const timePressure = 1 - state.secondsLeft / INITIAL_SECONDS;
  const overloadPressure = state.overload / 100;
  const frequencyPressure = clamp((FINAL_FREQUENCY - state.frequency) / (FINAL_FREQUENCY - INITIAL_FREQUENCY), 0, 1);
  return clamp(timePressure * 0.74 + overloadPressure * 0.16 + frequencyPressure * 0.1, 0, 1);
}

function updateGuide() {
  if (!els.guideStep) return;
  const prefix = state.demoMode ? "Jury mode: timer paused. " : "";
  els.guideStep.textContent = `${prefix}${roomGuides[state.currentRoom] || roomGuides.control}`;
}

function updateJuryPanel() {
  if (!els.juryTools) return;

  els.juryTools.classList.toggle("hidden", !state.demoMode);
  if (!state.demoMode) return;

  const id = roomPuzzleMap[state.currentRoom];
  const puzzle = puzzles[id];
  const isFinalRoom = id === "final";
  const mainPuzzlesSolved = areMainPuzzlesSolved();

  els.juryLesson.textContent = juryMessages[state.currentRoom] || "Jury note: explain what this room teaches the player.";
  els.jurySolveCurrent.disabled = state.ended || mainPuzzlesSolved;
  els.jurySolveCurrent.classList.toggle("jury-action-complete", mainPuzzlesSolved);
  els.juryVictoryButton.disabled = state.ended;
  els.juryDefeatButton.disabled = state.ended;
  els.jurySolveCurrent.textContent = mainPuzzlesSolved
    ? "4 puzzles solved"
    : isFinalRoom
    ? "Trigger victory"
    : state.solved.has(id)
      ? `Show ${puzzle.kicker} again`
      : `Solve ${puzzle.kicker}`;

  document.querySelectorAll("[data-jury-room]").forEach((button) => {
    button.classList.toggle("active", button.dataset.juryRoom === state.currentRoom);
  });
}

function renderCodeFragments() {
  const main = state.code.slice(0, 4);
  const bonus = state.code.slice(4);
  els.codeSlots.innerHTML = `
    <div class="code-group code-group-main">
      <p>Grid code</p>
      <div class="code-slots">
        ${main.map((digit) => `<span>${digit}</span>`).join("")}
      </div>
    </div>
    <div class="code-group code-group-bonus">
      <p>Hidden fragments</p>
      <div class="code-slots code-slots-bonus">
        ${bonus.map((digit) => `<span>${digit}</span>`).join("")}
      </div>
    </div>
    <div class="final-code-preview">
      <span>Final code</span>
      <strong>${state.code.join("")}</strong>
    </div>
  `;
}

function showDiscoveryToast() {
  els.discoveryToast.classList.remove("hidden", "show");
  void els.discoveryToast.offsetWidth;
  els.discoveryToast.classList.add("show");
  window.clearTimeout(state.discoveryToastTimer);
  state.discoveryToastTimer = window.setTimeout(() => {
    els.discoveryToast.classList.remove("show");
    els.discoveryToast.classList.add("hidden");
  }, 1800);
}

function resetLog() {
  els.logList.innerHTML = "";
  addLog("main", "Mission launched.");
}

function addLog(type, message) {
  const item = document.createElement("li");
  const label = document.createElement("span");
  const isEaster = type === "easter";
  item.className = `log-entry ${isEaster ? "log-easter" : "log-main"}`;
  label.textContent = isEaster ? "Bonus" : "Grid";
  item.append(label, message);
  els.logList.prepend(item);
}

function checkbox(name, label) {
  return `
    <label>
      <input type="checkbox" name="${name}">
      <span>${label}</span>
    </label>
  `;
}

function checked(root, name) {
  const input = root.querySelector(`[name="${name}"]`);
  return Boolean(input && input.checked);
}

function value(root, name) {
  const input = root.querySelector(`[name="${name}"]`);
  return input ? input.value : "";
}

function isEasterAnswerCorrect(answer, puzzle) {
  const candidates = [puzzle.answer, ...(puzzle.acceptedAnswers || [])];

  if (puzzle.answerType === "price") {
    return candidates.some((candidate) => samePriceAnswer(answer, candidate));
  }

  if (puzzle.answerType === "year") {
    return candidates.some((candidate) => sameYearAnswer(answer, candidate));
  }

  if (candidates.some((candidate) => normalizeLooseAnswer(answer) === normalizeLooseAnswer(candidate))) {
    return true;
  }

  if (puzzle.answerType === "slogan") {
    return sameSloganAnswer(answer, puzzle.answer);
  }

  return false;
}

function normalizeLooseAnswer(answer) {
  return answer
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace("€", "e")
    .replace(/[€]/g, "e")
    .replace(",", ".")
    .replace(/['’`´]/g, "")
    .replace(/[^a-z0-9.]/g, "");
}

function samePriceAnswer(answer, expected) {
  const answerCents = priceToCents(answer);
  const expectedCents = priceToCents(expected);
  return answerCents !== null && answerCents === expectedCents;
}

function priceToCents(answer) {
  const text = normalizeLooseAnswer(answer)
    .replace(/euros?/g, "e")
    .replace(/eur/g, "e");
  const decimalMatch = text.match(/(\d+)[.,](\d{1,2})/);

  if (decimalMatch) {
    return Number(decimalMatch[1]) * 100 + Number(decimalMatch[2].padEnd(2, "0"));
  }

  const euroMatch = text.match(/(\d+)e(\d{1,2})?/);
  if (euroMatch) {
    return Number(euroMatch[1]) * 100 + Number((euroMatch[2] || "00").padEnd(2, "0"));
  }

  const digits = text.replace(/\D/g, "");
  if (digits.length >= 3) {
    return Number(digits);
  }

  return digits ? Number(digits) * 100 : null;
}

function sameYearAnswer(answer, expected) {
  const expectedYear = normalizeLooseAnswer(expected).match(/\d{4}/)?.[0];
  if (!expectedYear) return false;
  return normalizeLooseAnswer(answer).includes(expectedYear);
}

function sameSloganAnswer(answer, expected) {
  const answerTokens = meaningfulTokens(answer);
  const expectedTokens = meaningfulTokens(expected);
  const hasExpectedTokens = expectedTokens.every((token) => answerTokens.includes(token));
  const hasStemVariant = answerTokens.includes("agir") && expectedTokens.includes("agis");

  if (hasExpectedTokens) return true;
  return hasStemVariant && answerTokens.includes("engie");
}

function meaningfulTokens(answer) {
  return answer
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace("€", " euros ")
    .replace(/[€]/g, " euros ")
    .replace(/['’`´]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((token) => token.length > 2 && !["avec", "les", "des", "une", "pour"].includes(token));
}

function selectRow(rank, options) {
  return `
    <label class="sort-row">
      <span>${rank}</span>
      <select name="rank-${rank}" aria-label="Rank ${rank}">
        ${options.map((option) => `<option value="${option}">${option || "Choose an energy source"}</option>`).join("")}
      </select>
    </label>
  `;
}

function availabilityRow(name, label, options = ["", "Very low", "Depends on wind", "Fast-response", "Controllable for peaks", "Important and stable"]) {
  return `
    <label class="sort-row availability-row">
      <span class="availability-label">${label}</span>
      <select name="${name}" aria-label="${label}">
        ${options.map((option) => `<option value="${option}">${option || "Choose"}</option>`).join("")}
      </select>
    </label>
  `;
}
