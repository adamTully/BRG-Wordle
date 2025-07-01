const board = document.getElementById("wordle-board");
const input = document.getElementById("wordle-input");
const button = document.getElementById("wordle-submit");
const keyboard = document.getElementById("virtual-keyboard");
const leaderboardList = document.getElementById("leaderboard-list");

const dailyWord = getDailyWord();
let attempts = 0;

function getDailyWord() {
  const words = ["apple", "zebra", "crane", "flute", "grape"];
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % words.length;
  return words[dayIndex];
}

function renderKeyboard() {
  const keys = "qwertyuiopasdfghjklzxcvbnm".split("");
  keys.forEach((letter) => {
    const key = document.createElement("button");
    key.textContent = letter;
    key.onclick = () => {
      input.value = (input.value + letter).slice(0, 5);
    };
    keyboard.appendChild(key);
  });
}

function updateLeaderboard(guess) {
  const record = {
    date: new Date().toLocaleDateString(),
    word: dailyWord,
    attempts: attempts,
    guess: guess
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

button.addEventListener("click", () => {
  const guess = input.value.toLowerCase();
  if (guess.length === 5) {
    attempts++;
    const feedback = checkGuess(guess, dailyWord);
    const row = document.createElement("div");

    for (let i = 0; i < 5; i++) {
      const box = document.createElement("div");
      box.className = `letter-box ${feedback[i]}`;
      box.textContent = guess[i].toUpperCase();
      row.appendChild(box);
    }

    board.appendChild(row);
    input.value = "";

    if (guess === dailyWord) {
      alert(`You guessed it in ${attempts} tries!`);
      updateLeaderboard(guess);
    }
  }
});

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
    if (result[i] === "correct") continue;
    for (let j = 0; j < 5; j++) {
      if (!used[j] && guess[i] === target[j]) {
        result[i] = "present";
        used[j] = true;
        break;
      }
    }
  }

  return result;
}

renderKeyboard();
renderLeaderboard();