const board = document.getElementById("wordle-board");
const keyboard = document.getElementById("virtual-keyboard");
const leaderboardList = document.getElementById("leaderboard-list");
const modal = document.getElementById("how-to-play-modal");
const openModal = document.getElementById("how-to-play-btn");
const closeModal = document.getElementById("close-modal");
const container = document.querySelector(".wordle-container");

const dailyWord = getDailyWord();
let currentRow = 0;
let currentTile = 0;
let isGameOver = false;
let boardState = [];
let attempts = 0;

function getDailyWord() {
  const words = ["apple", "zebra", "crane", "flute", "grape"];
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % words.length;
  return words[dayIndex];
}

function createBoard() {
  for (let i = 0; i < 5; i++) {
    const row = document.createElement("div");
    row.classList.add("wordle-row");
    let tiles = [];
    for (let j = 0; j < 5; j++) {
      const box = document.createElement("div");
      box.classList.add("letter-box");
      row.appendChild(box);
      tiles.push(box);
    }
    boardState.push(tiles);
    board.appendChild(row);
  }
}

function createKeyboard() {
  const layout = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["enter", "z", "x", "c", "v", "b", "n", "m", "del"]
  ];

  layout.forEach(row => {
    const rowContainer = document.createElement("div");
    rowContainer.classList.add("keyboard-row");

    row.forEach(key => {
      const btn = document.createElement("button");

      if (key === "enter") {
        btn.textContent = "Enter";
        btn.onclick = handleSubmit;
        btn.classList.add("wide-key");
      } else if (key === "del") {
        btn.textContent = "Del";
        btn.onclick = handleDelete;
        btn.classList.add("wide-key");
      } else {
        btn.textContent = key;
        btn.onclick = () => handleLetter(key);
      }

      rowContainer.appendChild(btn);
    });

    keyboard.appendChild(rowContainer);
  });
}

function handleLetter(letter) {
  if (isGameOver || currentTile > 4) return;
  const box = boardState[currentRow][currentTile];
  box.textContent = letter.toUpperCase();
  box.classList.add("pop");
  setTimeout(() => box.classList.remove("pop"), 120);
  currentTile++;
}

function handleDelete() {
  if (currentTile > 0) {
    currentTile--;
    const box = boardState[currentRow][currentTile];
    box.textContent = "";
    box.classList.remove("pop");
  }
}

function handleSubmit() {
  if (currentTile < 5) {
    shakeRow();
    return;
  }

  const guess = boardState[currentRow].map(b => b.textContent.toLowerCase()).join("");
  const feedback = checkGuess(guess, dailyWord);

  boardState[currentRow].forEach((box, i) => {
    setTimeout(() => {
      box.classList.add(feedback[i]);
      if (feedback[i] === "correct") {
        box.classList.add("animate-correct");
      }
      updateKeyboardColor(guess[i], feedback[i]);
    }, i * 300);
  });

  attempts++;

  if (guess === dailyWord) {
    isGameOver = true;
    setTimeout(() => {
      showCongratsScreen();
      launchConfetti();
    }, 1800);
  } else if (currentRow === 4) {
    isGameOver = true;
  } else {
    currentRow++;
    currentTile = 0;
    if (currentRow === 4) {
      setTimeout(() => shakeRow(true), 300);
    }
  }
}

function checkGuess(guess, target) {
  const result = Array(5).fill("absent");
  const used = Array(5).fill(false);

  for (let i = 0; i < 5; i++) {
    if (guess[i] === target[i]) {
      result[i] = "correct";
      used[i] = true;
    }
  }

  for (let i = 0; i < 5; i++) {
    if (result[i] !== "correct") {
      for (let j = 0; j < 5; j++) {
        if (!used[j] && guess[i] === target[j]) {
          result[i] = "present";
          used[j] = true;
          break;
        }
      }
    }
  }

  return result;
}

function updateKeyboardColor(letter, state) {
  const keys = [...keyboard.querySelectorAll("button")];
  keys.forEach(k => {
    if (k.textContent.toLowerCase() === letter) {
      k.classList.remove("absent", "present", "correct");
      k.classList.add(state);
    }
  });
}

function shakeRow(loop = false) {
  boardState[currentRow].forEach((box, i) => {
    if (loop) {
      box.style.animation = `shake 0.4s ${i * 0.05}s infinite`;
    } else {
      box.classList.add("shake");
      setTimeout(() => box.classList.remove("shake"), 400);
    }
  });
}

function showCongratsScreen() {
  const html = `
    <div class="congrats-screen">
      <h2>You guessed it!</h2>
      <p>Enter your name to join the leaderboard:</p>
      <input type="text" id="player-name" placeholder="Your name" />
      <div style="margin-top: 1rem;">
        <button id="submit-name" class="btn primary">Submit</button>
        <button id="back-to-game" class="btn">Back</button>
      </div>
    </div>
  `;
  container.innerHTML = html;

  document.getElementById("submit-name").onclick = () => {
    const name = document.getElementById("player-name").value.trim() || "Anonymous";
    updateLeaderboard(dailyWord, name);
    location.reload();
  };

  document.getElementById("back-to-game").onclick = () => {
    location.reload();
  };
}

function updateLeaderboard(guess, name = "Anonymous") {
  const record = {
    date: new Date().toLocaleDateString(),
    word: dailyWord,
    attempts,
    guess,
    name
  };
  let scores = JSON.parse(localStorage.getItem("leaderboard")) || [];
  scores.push(record);
  scores.sort((a, b) => a.attempts - b.attempts);
  scores = scores.slice(0, 10);
  localStorage.setItem("leaderboard", JSON.stringify(scores));
}

function renderLeaderboard() {
  const scores = JSON.parse(localStorage.getItem("leaderboard")) || [];
  leaderboardList.innerHTML = scores.map(s => 
    `<li>${s.name} — ${s.word.toUpperCase()} in ${s.attempts} tries</li>`
  ).join("");
}

function launchConfetti() {
  const canvas = document.createElement("canvas");
  canvas.id = "confetti-canvas";
  document.body.appendChild(canvas);

  const confetti = canvas.getContext("2d");
  const pieces = Array.from({ length: 100 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: Math.random() * 6 + 4,
    d: Math.random() * 20 + 10,
    color: `hsl(${Math.random() * 360}, 100%, 50%)`,
    tilt: Math.random() * 10 - 10,
    tiltAngleIncremental: Math.random() * 0.07 + 0.05,
    tiltAngle: 0
  }));

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  function draw() {
    confetti.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      confetti.beginPath();
      confetti.lineWidth = p.r / 2;
      confetti.strokeStyle = p.color;
      confetti.moveTo(p.x + p.tilt + p.r / 4, p.y);
      confetti.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
      confetti.stroke();
    });
    update();
  }

  function update() {
    pieces.forEach(p => {
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
      p.tilt = Math.sin(p.tiltAngle - p.d / 3) * 15;

      if (p.y > canvas.height) {
        p.y = -10;
        p.x = Math.random() * canvas.width;
      }
    });
  }

  (function animate() {
    draw();
    requestAnimationFrame(animate);
  })();

  setTimeout(() => {
    canvas.remove();
  }, 5000);
}

// Modal events
openModal.onclick = () => modal.classList.remove("hidden");
closeModal.onclick = () => modal.classList.add("hidden");

document.getElementById("show-leaderboard").onclick = () => {
  document.getElementById("leaderboard-section").scrollIntoView({ behavior: "smooth" });
};

document.addEventListener("keydown", (e) => {
  if (isGameOver || !modal.classList.contains("hidden")) return;

  if (e.key === "Enter") {
    handleSubmit();
  } else if (e.key === "Backspace") {
    handleDelete();
  } else if (/^[a-zA-Z]$/.test(e.key)) {
    handleLetter(e.key.toLowerCase());
  }
});

createBoard();
createKeyboard();
renderLeaderboard();
