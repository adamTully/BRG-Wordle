const board = document.getElementById("wordle-board");
const keyboard = document.getElementById("virtual-keyboard");
const leaderboardList = document.getElementById("leaderboard-list");
const modal = document.getElementById("how-to-play-modal");
const openModal = document.getElementById("how-to-play-btn");
const closeModal = document.getElementById("close-modal");

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
      updateKeyboardColor(guess[i], feedback[i]);
    }, i * 300);
  });

  attempts++;
  if (guess === dailyWord) {
    isGameOver = true;
    updateLeaderboard(guess);
  } else if (currentRow === 4) {
    isGameOver = true;
  } else {
    currentRow++;
    currentTile = 0;
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

function shakeRow() {
  boardState[currentRow].forEach(box => {
    box.classList.add("shake");
    setTimeout(() => box.classList.remove("shake"), 400);
  });
}

function updateLeaderboard(guess) {
  const record = {
    date: new Date().toLocaleDateString(),
    word: dailyWord,
    attempts,
    guess
  };
  let scores = JSON.parse(localStorage.getItem("leaderboard")) || [];
  scores.push(record);
  scores.sort((a, b) => a.attempts - b.attempts);
  scores = scores.slice(0, 10);
  localStorage.setItem("leaderboard", JSON.stringify(scores));
  renderLeaderboard();
}

function renderLeaderboard() {
  const scores = JSON.parse(localStorage.getItem("leaderboard")) || [];
  leaderboardList.innerHTML = scores.map(s => `<li>${s.date} - ${s.word.toUpperCase()} in ${s.attempts} tries</li>`).join("");
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
