const colors = ["red", "blue", "green", "orange"];
let gameSeq = [];
let userSeq = [];
let level = 0;
let started = false;
let playing = false;
let muted = false;

const pads = {};
colors.forEach(c => pads[c] = document.getElementById(c));
const levelEl = document.getElementById("level");
const msg = document.getElementById("message");
const highscoreEl = document.getElementById("highscore");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const muteBtn = document.getElementById("muteBtn");
const board = document.getElementById("board");

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const tones = { red: 261.6, blue: 329.6, green: 392.0, orange: 523.3 };

// load high score
let best = localStorage.getItem("simon_best") || 0;
highscoreEl.textContent = best;

// event listeners
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", resetGame);
muteBtn.addEventListener("click", toggleMute);
window.addEventListener("keydown", e => handleKey(e.key.toLowerCase()));

colors.forEach(c => {
  pads[c].addEventListener("click", () => userInput(c));
});

// core functions
function startGame() {
  if (started) return;
  started = true;
  level = 0;
  gameSeq = [];
  nextLevel();
  msg.textContent = "Watch the sequence!";
}

function resetGame() {
  started = false;
  gameSeq = [];
  userSeq = [];
  level = 0;
  msg.textContent = "Game Reset. Press Start to Play Again.";
  levelEl.textContent = level;
}

function toggleMute() {
  muted = !muted;
  muteBtn.textContent = muted ? "🔇" : "🔊";
}

function nextLevel() {
  level++;
  userSeq = [];
  levelEl.textContent = level;

  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  gameSeq.push(randomColor);

  playSequence();
}

async function playSequence() {
  playing = true;
  disablePads(true);
  for (const color of gameSeq) {
    await flashPad(color);
    await wait(300);
  }
  playing = false;
  disablePads(false);
  msg.textContent = "Your turn!";
}

function userInput(color) {
  if (!started || playing) return;
  userSeq.push(color);
  flashPad(color, 200);
  const idx = userSeq.length - 1;

  if (userSeq[idx] !== gameSeq[idx]) {
    gameOver();
    return;
  }

  if (userSeq.length === gameSeq.length) {
    msg.textContent = "Nice! Next Level...";
    setTimeout(nextLevel, 1000);
  }
}

function gameOver() {
  msg.textContent = `Game Over! Score: ${level}`;
  document.body.classList.add("bg-danger");
  setTimeout(() => document.body.classList.remove("bg-danger"), 500);

  if (level > best) {
    best = level;
    localStorage.setItem("simon_best", best);
    highscoreEl.textContent = best;
    msg.textContent = `New High Score! ${level}`;
  }

  started = false;
  playing = false;
}

function flashPad(color, duration = 400) {
  return new Promise(res => {
    const pad = pads[color];
    pad.classList.add("flash");
    playTone(color, duration);
    setTimeout(() => {
      pad.classList.remove("flash");
      res();
    }, duration);
  });
}

function playTone(color, duration = 300) {
  if (muted) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = tones[color];
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  setTimeout(() => {
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.02);
    osc.stop();
  }, duration);
}

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function disablePads(disable) {
  board.style.pointerEvents = disable ? "none" : "auto";
}

function handleKey(key) {
  const map = { q: "red", w: "blue", a: "green", s: "orange" };
  if (map[key]) userInput(map[key]);
}

// Show rules
document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("seenRules")) {
    const modal = new bootstrap.Modal(document.getElementById('rulesModal'));
    modal.show();
    localStorage.setItem("seenRules", "true");
  }
});
