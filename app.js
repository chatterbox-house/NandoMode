class SpanishVocabTrainer {
  constructor() {
    this.users = {
      Tony:   { pin: "1984", score: 0, mastered: {} },
      Mina:   { pin: "1982", score: 0, mastered: {} },
      Sorato: { pin: "2014", score: 0, mastered: {} },
      Kaito:  { pin: "2015", score: 0, mastered: {} },
      Maria:  { pin: "2019", score: 0, mastered: {} }
    };
    this.goodLuck = [
      "¡Listo, pixelero! 🎮",
      "¡A por los puntos! ⭐",
      "¡Tú puedes, héroe 8-bit! 💪"
    ];
    this.wellDone = [
      "¡Nivel completado! ✅",
      "¡Victoria retro! 🎉",
      "¡Súper 8-bit! 🌟"
    ];
    this._bindElements();
    this._loadUserData();
    this._setupListeners();
    this._restoreSession();
    this._initAudio();
  }

  _bindElements() {
    const $ = id => document.getElementById(id);
    this.loginScreen  = $("loginScreen");
    this.userSelect   = $("userSelect");
    this.pinInput     = $("pinInput");
    this.loginBtn     = $("loginBtn");
    this.loginError   = $("loginError");

    this.gameScreen   = $("gameScreen");
    this.startBtn     = $("startBtn");
    this.finishBtn    = $("finishBtn");
    this.logoutBtn    = $("logoutBtn");
    this.messages     = $("messages");
    this.emojiCol     = $("emojiColumn");
    this.wordCol      = $("wordColumn");
    this.scoreDisplay = $("scoreDisplay");
    this.progressFill = $("progressFill");
    this.leaderList   = $("leaderList");
    this.themeToggle  = $("themeToggle");
  }

  _setupListeners() {
    this.loginBtn.onclick     = () => this._doLogin();
    this.pinInput.onkeypress  = e => { if (e.key === "Enter") this._doLogin(); };
    this.startBtn.onclick     = () => this.startQuiz();
    this.finishBtn.onclick    = () => this.finishQuiz();
    this.logoutBtn.onclick    = () => this._doLogout();
    this.themeToggle.onclick  = () => this._toggleTheme();
  }

  _initAudio() {
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      this.audioCtx = null;
    }
  }

  _playTone(freq, duration = 0.2, type = "square") {
    if (!this.audioCtx) return;
    const osc  = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = type; osc.frequency.value = freq;
    osc.connect(gain); gain.connect(this.audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(1, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
    osc.stop(this.audioCtx.currentTime + duration);
  }

  _soundCorrect() {
    this._playTone(440, 0.1);
    setTimeout(() => this._playTone(660, 0.1), 100);
  }

  _soundWrong() {
    this._playTone(150, 0.2);
  }

  _soundFinish() {
    [523, 587, 659].forEach((f, i) =>
      setTimeout(() => this._playTone(f, 0.15), i * 150)
    );
  }

  _toggleTheme() {
    const body = document.body;
    const next = body.getAttribute("data-theme") === "dark" ? "light" : "dark";
    body.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  _loadUserData() {
    try {
      const raw = localStorage.getItem("users");
      if (raw) Object.assign(this.users, JSON.parse(raw));
    } catch {}
  }

  _saveUserData() {
    localStorage.setItem("users", JSON.stringify(this.users));
  }

  _restoreSession() {
    // theme
    const savedTheme = localStorage.getItem("theme") || "light";
    document.body.setAttribute("data-theme", savedTheme);

    // login
    const cu = sessionStorage.getItem("currentUser");
    if (cu && this.users[cu]) {
      this.currentUser = cu;
      this.userSelect.value = cu;
      this._showGame();
    }
  }

  _doLogin() {
    const u = this.userSelect.value, p = this.pinInput.value.trim();
    if (!u) {
      this.loginError.textContent = "Selecciona un usuario.";
      return;
    }
    if (!this.users[u] || this.users[u].pin !== p) {
      this.loginError.textContent = "PIN incorrecto.";
      return;
    }
    this.loginError.textContent = "";
    this.currentUser = u;
    sessionStorage.setItem("currentUser", u);
    this._showGame();
  }

  _showGame() {
    this.loginScreen.classList.add("hidden");
    this.gameScreen.classList.remove("hidden");
    this._updateLeaderboard();
  }

  startQuiz() {
    if (!window.vocab || window.vocab.length === 0) {
      this.messages.textContent = "Error: vocab.js no cargado.";
      return;
    }
    this.matched    = new Set();
    this.errors     = new Set();
    this.currentSet = this._pickWords();
    this.scoreDisplay.textContent = this.users[this.currentUser].score;
    this.progressFill.style.width = "0%";
    this.finishBtn.classList.add("hidden");
    this.messages.textContent = this.goodLuck[Math.random()*this.goodLuck.length|0];
    this._renderQuiz();
  }

  _pickWords() {
    const user  = this.users[this.currentUser];
    const avail = window.vocab.filter(v => (user.mastered[v.word]||0) < 10);
    const pick  = this._shuffle(avail).slice(0,5);
    user.lastWords = pick.map(x => x.word);
    this._saveUserData();
    return pick;
  }

  _renderQuiz() {
    // emojis
    this.emojiCol.innerHTML = "";
    this.currentSet.forEach(({emoji, word}) => {
      const d = document.createElement("div");
      d.className    = "box";
      d.textContent  = emoji;
      d.dataset.word = word;
      d.onclick      = () => this._selectEmoji(d, word);
      this.emojiCol.appendChild(d);
    });
    // words
    this.wordCol.innerHTML = "";
    this._shuffle(this.currentSet).forEach(({word}) => {
      const d = document.createElement("div");
      d.className   = "box wordBox";
      d.textContent = word;
      d.onclick     = () => this._selectWord(d, word);
      this.wordCol.appendChild(d);
    });
  }

  _selectEmoji(div, word) {
    if (this.matched.has(word)) {
      // still allow re-hear
      speechSynthesis.speak(new SpeechSynthesisUtterance(word));
      return;
    }
    this.emojiCol.querySelectorAll(".selected")
      .forEach(x => x.classList.remove("selected"));
    div.classList.add("selected");
    this.selectedEmoji = div;
    speechSynthesis.speak(new SpeechSynthesisUtterance(word));
  }

  _selectWord(div, word) {
    if (!this.selectedEmoji) return;
    const guess = this.selectedEmoji.dataset.word;
    if (guess === word) this._handleCorrect(div, word);
    else                 this._handleWrong(div);
  }

  _handleCorrect(div, word) {
    this.matched.add(word);
    const user = this.users[this.currentUser];
    if (!this.errors.has(word)) {
      user.score++;
      user.mastered[word] = (user.mastered[word]||0) + 1;
      this._saveUserData();
    }
    this.scoreDisplay.textContent = user.score;
    this.selectedEmoji.classList.replace("selected","matched");
    div.classList.add("matched","highlight");
    this.selectedEmoji = null;

    // progress
    const pct = this.matched.size / this.currentSet.length * 100;
    this.progressFill.style.width = pct + "%";

    // sound & message
    this._soundCorrect();
    this.messages.textContent = "¡Correcto! 🎉";

    if (this.matched.size === this.currentSet.length) {
      this.finishBtn.classList.remove("hidden");
      this._soundFinish();
      confetti();
    }
  }

  _handleWrong(div) {
    this.errors.add(div.textContent);
    div.classList.add("incorrect");
    setTimeout(() => div.classList.remove("incorrect"), 300);
    this._soundWrong();
    this.messages.textContent = "Intenta otra vez…";
  }

  finishQuiz() {
    this.messages.textContent = this.wellDone[Math.random()*this.wellDone.length|0];
    this._updateLeaderboard();
    this._soundFinish();
    confetti({particleCount: 100, spread: 70});
  }

  _updateLeaderboard() {
    const html = Object.entries(this.users)
      .sort((a,b) => b[1].score - a[1].score)
      .map(([u,d]) => `<li>${u}: ${d.score} pts</li>`).join("");
    this.leaderList.innerHTML = html;
  }

  _doLogout() {
    this._saveUserData();
    sessionStorage.removeItem("currentUser");
    location.reload();
  }

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.random() * (i + 1) | 0;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

// instantiate when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new SpanishVocabTrainer();
});
