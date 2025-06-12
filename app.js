class SpanishVocabTrainer {
  constructor() {
    // preset users + PINs
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
    const $ = id=>document.getElementById(id);
    this.loginScreen   = $("loginScreen");
    this.userSelect    = $("userSelect");
    this.pinInput      = $("pinInput");
    this.loginBtn      = $("loginBtn");
    this.loginError    = $("loginError");

    this.gameScreen    = $("gameScreen");
    this.startBtn      = $("startBtn");
    this.finishBtn     = $("finishBtn");
    this.logoutBtn     = $("logoutBtn");
    this.messages      = $("messages");
    this.emojiCol      = $("emojiColumn");
    this.wordCol       = $("wordColumn");
    this.scoreDisplay  = $("scoreDisplay");
    this.progressFill  = $("progressFill");
    this.leaderList    = $("leaderList");
    this.themeToggle   = $("themeToggle");
  }

  _setupListeners() {
    this.loginBtn  .onclick = ()=>this._doLogin();
    this.pinInput  .onkeypress = e=>{ if(e.key==="Enter") this._doLogin(); };
    this.startBtn  .onclick = ()=>this.startQuiz();
    this.finishBtn .onclick = ()=>this.finishQuiz();
    this.logoutBtn .onclick = ()=>this._doLogout();
    this.themeToggle.onclick = ()=>this._toggleTheme();
  }

  _initAudio() {
    try { this.audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }
    catch { this.audioCtx = null; }
  }

  _playTone(freq, duration=0.2, type="square") {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain= this.audioCtx.createGain();
    osc.type = type; osc.frequency.value = freq;
    osc.connect(gain); gain.connect(this.audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(1, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
    osc.stop(this.audioCtx.currentTime + duration);
  }

  _soundCorrect() {
    this._playTone(440,0.1);
    setTimeout(()=>this._playTone(660,0.1), 100);
  }

  _soundWrong() {
    this._playTone(150,0.2);
  }

  _soundFinish() {
    // simple fanfare
    [523,587,659].forEach((f,i)=>setTimeout(()=>this._playTone(f,0.15), i*150));
  }

  _toggleTheme() {
    const body = document.body;
    const t = body.getAttribute("data-theme")==="dark" ? "light" : "dark";
    body.setAttribute("data-theme", t);
    localStorage.setItem("theme", t);
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
      this.loginError.textContent = "Por favor, selecciona un usuario.";
      return;
    }
    if (!this.users[u] || this.users[u].pin !== p) {
      this.loginError.textContent = "PIN incorrecto.";
      return;
    }
    this.loginError.textContent = "";
    this.currentUser = u;
    sessionStorage.setItem("currentUser", u);
