class SpanishVocabTrainer {
  constructor() {
    this.users = {
      Tony: { pin: "1984", score: 0, mastered: {}, lastWords: [] },
      Mina: { pin: "1982", score: 0, mastered: {}, lastWords: [] },
      Sorato: { pin: "2014", score: 0, mastered: {}, lastWords: [] },
      Kaito: { pin: "2015", score: 0, mastered: {}, lastWords: [] },
      Maria: { pin: "2019", score: 0, mastered: {}, lastWords: [] }
    };

    this.goodLuckPhrases = [
      "¡Listo, pixelero! 🎮",
      "¡A por los puntos! ⭐",
      "¡Tú puedes, 8-bit! 💪",
      "¡Vamos, héroe! 🦸",
      "¡Modo juego ON! 🚀"
    ];

    this.wellDonePhrases = [
      "¡Eres un pro, pixel! 🏆",
      "¡Nivel completado! ✅",
      "¡Súper 8-bit! 🌟",
      "¡Victoria retro! 🎉",
      "¡Campeón pixelado! 👑"
    ];

    this.matched = new Set();
    this.score = 0;
    this.quizStarted = false;
    this.currentUser = null;
    this.selectedEmoji = null;
    this.errorWords = new Set();
    this.currentVocab = [];
    this.audioContext = null;

    this.initializeAudio();
    this.loadElements();
    this.loadUserData();
    this.setupEventListeners();
    this.initializeTheme();
    this.checkSavedSession();
  }

  initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API not supported:", e);
    }
  }

  loadElements() {
    this.elements = {
      emojiColumn: document.getElementById("emojiColumn"),
      wordColumn: document.getElementById("wordColumn"),
      scoreDisplay: document.getElementById("score"),
      messages: document.getElementById("messages"),
      startBtn: document.getElementById("startBtn"),
      finishBtn: document.getElementById("finishBtn"),
      logoutBtn: document.getElementById("logoutBtn"),
      container: document.getElementById("container"),
      loginSection: document.getElementById("loginSection"),
      loginBtn: document.getElementById("loginBtn"),
      usernameSelect: document.getElementById("username"),
      pinInput: document.getElementById("pin"),
      loginError: document.getElementById("loginError"),
      buttonsDiv: document.getElementById("buttons"),
      leaderboardDiv: document.getElementById("leaderboard"),
      leaderboardList: document.getElementById("leaderboardList"),
      progressBar: document.getElementById("progressBar"),
      progress: document.getElementById("progress"),
      themeToggle: document.getElementById("themeToggle")
    };

    // Validate required elements
    const requiredElements = ['loginBtn', 'usernameSelect', 'pinInput', 'startBtn'];
    const missing = requiredElements.filter(id => !this.elements[id]);
    if (missing.length > 0) {
      throw new Error(`Missing required elements: ${missing.join(', ')}`);
    }
  }

  setupEventListeners() {
    this.elements.loginBtn.addEventListener("click", () => this.handleLogin());
    this.elements.startBtn.addEventListener("click", () => this.startQuiz());
    this.elements.finishBtn.addEventListener("click", () => this.finishQuiz());
    this.elements.logoutBtn.addEventListener("click", () => this.logoutUser());
    this.elements.themeToggle.addEventListener("click", () => this.toggleTheme());
    
    // Enter key support for login
    this.elements.pinInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.handleLogin();
    });

    // Clear login error when user types
    this.elements.pinInput.addEventListener("input", () => {
      this.elements.loginError.textContent = "";
    });
    
    this.elements.usernameSelect.addEventListener("change", () => {
      this.elements.loginError.textContent = "";
    });
  }

  initializeTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.body.classList.add("dark");
    }
  }

  toggleTheme() {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  checkSavedSession() {
    const savedUser = sessionStorage.getItem("currentUser");
    if (savedUser && this.users[savedUser]) {
      this.currentUser = savedUser;
      this.elements.usernameSelect.value = this.currentUser;
      this.showGameInterface();
    } else {
      this.showLoginInterface();
    }
  }

  handleLogin() {
    const username = this.elements.usernameSelect.value;
    const pin = this.elements.pinInput.value.trim();

    if (!username) {
      this.elements.loginError.textContent = "Por favor, selecciona un usuario.";
      return;
    }

    if (!this.users[username]) {
      this.elements.loginError.textContent = "Usuario no encontrado.";
      return;
    }

    if (this.users[username].pin !== pin) {
      this.elements.loginError.textContent = "PIN incorrecto. Inténtalo de nuevo.";
      return;
    }

    this.elements.loginError.textContent = "";
    this.currentUser = username;
    sessionStorage.setItem("currentUser", this.currentUser);
    this.showGameInterface();
  }

  showLoginInterface() {
    this.elements.loginSection.classList.remove("hidden");
    this.elements.buttonsDiv.classList.add("hidden");
    this.elements.container.classList.add("hidden");
    this.elements.scoreDisplay.classList.add("hidden");
    this.elements.progressBar.classList.add("hidden");
    this.elements.leaderboardDiv.classList.add("hidden");
    this.elements.messages.textContent = "";
  }

  showGameInterface() {
    this.elements.loginSection.classList.add("hidden");
    this.elements.buttonsDiv.classList.remove("hidden");
    this.elements.startBtn.classList.remove("hidden");
    this.elements.finishBtn.classList.add("hidden");
    this.elements.logoutBtn.classList.remove("hidden");
    this.updateLeaderboard();
  }

  startQuiz() {
    // Check if vocab is available
    if (typeof window.vocab === "undefined" || !window.vocab || window.vocab.length === 0) {
      this.elements.messages.textContent = "Error: No vocabulary loaded.";
      return;
    }

    this.matched = new Set();
    this.errorWords = new Set();
    this.quizStarted = true;
    this.selectedEmoji = null;

    // Show game elements
    this.elements.scoreDisplay.classList.remove("hidden");
    this.elements.progressBar.classList.remove("hidden");
    this.elements.container.classList.remove("hidden");
    this.elements.startBtn.classList.add("hidden");
    this.elements.finishBtn.classList.add("hidden");

    // Update displays
    this.elements.scoreDisplay.textContent = `Matches: ${this.users[this.currentUser].score}`;
    this.elements.progress.style.width = "0%";

    // Show encouraging message
    const phrase = this.goodLuckPhrases[Math.floor(Math.random() * this.goodLuckPhrases.length)];
    this.elements.messages.textContent = phrase;
    this.speakText(phrase);

    // Setup quiz
    this.currentVocab = this.selectQuizWords();
    this.setupEmojiBoxes();
    this.setupWordBoxes();
  }

  selectQuizWords() {
    const user = this.users[this.currentUser];
    user.mastered = user.mastered || {};
    user.lastWords = user.lastWords || [];

    const errorWordsLastSession = user.lastWords.filter(word => this.errorWords.has(word));
    const availableWords = window.vocab.filter(v => (user.mastered[v.word] || 0) < 10);

    let holdovers = errorWordsLastSession.length > 0
      ? errorWordsLastSession.slice(0, 2)
      : user.lastWords.filter(word => availableWords.some(v => v.word === word)).slice(0, 2);

    const remainingCount = Math.min(5 - holdovers.length, availableWords.length);
    const newWords = this.shuffle([...availableWords])
      .filter(v => !holdovers.includes(v.word))
      .slice(0, remainingCount)
      .map(v => v.word);

    const selectedWords = [...holdovers, ...newWords];
    user.lastWords = selectedWords;
    this.saveUserData();

    return window.vocab.filter(v => selectedWords.includes(v.word));
  }

  setupEmojiBoxes() {
    this.elements.emojiColumn.innerHTML = "";
    
    this.currentVocab.forEach(({ emoji, word }) => {
      const div = document.createElement("div");
      div.className = "box";
      div.textContent = emoji;
      div.dataset.word = word;
      
      if (this.matched.has(word)) {
        div.classList.add("matched");
      }

      div.addEventListener("click", () => this.handleEmojiClick(div, word));
      this.elements.emojiColumn.appendChild(div);
    });
  }

  setupWordBoxes() {
    this.elements.wordColumn.innerHTML = "";
    const shuffled = this.shuffle([...this.currentVocab]);

    shuffled.forEach(({ word }) => {
      const div = document.createElement("div");
      div.className = "box wordBox";
      div.textContent = word;
      
      if (this.matched.has(word)) {
        div.classList.add("matched", "highlight");
      }

      div.addEventListener("click", () => this.handleWordClick(div, word));
      this.elements.wordColumn.appendChild(div);
    });
  }

  handleEmojiClick(div, word) {
    if (this.matched.has(word)) return;

    if (this.selectedEmoji === div) {
      this.clearSelections();
      return;
    }

    this.clearSelections();
    this.selectedEmoji = div;
    div.classList.add("selected");
    this.speakText(word);
  }

  handleWordClick(div, word) {
    if (!this.selectedEmoji || this.matched.has(word)) return;

    const emojiWord = this.selectedEmoji.dataset.word;
    
    if (emojiWord === word) {
      this.handleCorrectMatch(div, word);
    } else {
      this.handleIncorrectMatch(div, word);
    }
  }

  handleCorrectMatch(div, word) {
    if (!this.matched.has(word)) {
      this.matched.add(word);
      
      if (!this.errorWords.has(word)) {
        this.users[this.currentUser].score++;
        this.users[this.currentUser].mastered[word] = (this.users[this.currentUser].mastered[word] || 0) + 1;
        this.elements.scoreDisplay.textContent = `Matches: ${this.users[this.currentUser].score}`;
        this.saveUserData();
      }

      this.selectedEmoji.classList.remove("selected");
      this.selectedEmoji.classList.add("matched");
      div.classList.add("matched", "highlight");
      
      this.clearSelections();
      this.updateProgress();
      this.speakText(word, () => this.playChiptuneSound("correct"));
      this.elements.messages.textContent = "¡Punto pixel! ⭐";

      if (this.matched.size === this.currentVocab.length) {
        this.elements.finishBtn.classList.remove("hidden");
        this.elements.messages.textContent = "¡Nivel terminado! 🎉";
        this.speakText(this.elements.messages.textContent, () => this.playChiptuneSound("finish"));
        this.triggerConfetti();
      }
    }
  }

  handleIncorrectMatch(div, word) {
    this.errorWords.add(word);
    div.classList.add("incorrect");
    setTimeout(() => div.classList.remove("incorrect"), 200);
    
    this.speakText(word, () => this.playChiptuneSound("incorrect"));
    this.elements.messages.textContent = "¡Uy, otro intento! 🤔";
    
    setTimeout(() => {
      this.elements.messages.textContent = "";
    }, 1500);
    
    this.clearSelections();
  }

  clearSelections() {
    this.selectedEmoji = null;
    const selected = this.elements.emojiColumn.querySelector(".selected");
    if (selected) {
      selected.classList.remove("selected");
    }
  }

  updateProgress() {
    const percentage = (this.matched.size / this.currentVocab.length) * 100;
    this.elements.progress.style.width = `${percentage}%`;
  }

  finishQuiz() {
    this.quizStarted = false;
    const phrase = this.wellDonePhrases[Math.floor(Math.random() * this.wellDonePhrases.length)];
    this.elements.messages.textContent = phrase;
    this.speakText(phrase, () => this.playChiptuneSound("finish"));
    this.triggerConfetti();
    
    this.elements.finishBtn.classList.add("hidden");
    this.elements.startBtn.classList.remove("hidden");
    this.updateLeaderboard();
  }

  updateLeaderboard() {
    const sortedUsers = Object.entries(this.users)
      .sort((a, b) => b[1].score - a[1].score);
    
    this.elements.leaderboardList.innerHTML = sortedUsers
      .map(([user, data]) => `<li>${user}: ${data.score} píxeles ⭐</li>`)
      .join("");
    
    this.elements.leaderboardDiv.classList.remove("hidden");
  }

  logoutUser() {
    this.saveUserData();
    this.currentUser = null;
    this.quizStarted = false;
    this.matched.clear();
    this.errorWords.clear();
    this.selectedEmoji = null;
    this.currentVocab = [];
    
    this.elements.pinInput.value = "";
    this.elements.usernameSelect.value = "";
    this.elements.loginError.textContent = "";
    this.elements.messages.textContent = "";
    
    sessionStorage.removeItem("currentUser");
    this.showLoginInterface();
  }

  saveUserData
