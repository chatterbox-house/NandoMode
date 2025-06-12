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
      document.
