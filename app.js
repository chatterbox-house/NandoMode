class SpanishVocabTrainer {
  constructor() {
    // preset users & PINs
    this.users = {
      Tony:   { pin:"1984", score:0, mastered:{}, lastWords:[] },
      Mina:   { pin:"1982", score:0, mastered:{}, lastWords:[] },
      Sorato: { pin:"2014", score:0, mastered:{}, lastWords:[] },
      Kaito:  { pin:"2015", score:0, mastered:{}, lastWords:[] },
      Maria:  { pin:"2019", score:0, mastered:{}, lastWords:[] }
    };
    this.goodLuck = [
      "¡Listo, pixelero! 🎮",
      "¡A por los puntos! ⭐",
      "¡Tú puedes! 💪"
    ];
    this.wellDone = [
      "¡Nivel completado! ✅",
      "¡Victoria retro! 🎉",
      "¡Súper 8-bit! 🌟"
    ];
    this._bindElements();
    this._initAudio();
    this._setupVoices();
    this._loadData();
    this._restoreSession();
    this._hookEvents();
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
    this.scoreDisp    = $("scoreDisplay");
    this.progressFill = $("progressFill");
    this.leaderList   = $("leaderList");

    this.victoryScreen= $("victoryScreen");
    this.victoryMsg   = $("victoryMessage");
    this.continueBtn  = $("continueBtn");
    this.quitBtn      = $("quitBtn");

    this.themeToggle  = $("themeToggle");
  }

  _hookEvents() {
    this.loginBtn.onclick     = () => this._doLogin();
    this.pinInput.onkeypress  = e => { if (e.key==="Enter") this._doLogin(); };
    this.startBtn.onclick     = () => this.startQuiz();
    this.finishBtn.onclick    = () => this.finishQuiz();
    this.logoutBtn.onclick    = () => this._logout();
    this.continueBtn.onclick  = () => this._continue();
    this.quitBtn.onclick      = () => this._logout();
    this.themeToggle.onclick  = () => this._toggleTheme();
  }

  /* ─── Audio & Tones ───────────────────────────────────────────── */
  _initAudio() {
    try { this.audioCtx = new (AudioContext||webkitAudioContext)(); }
    catch { this.audioCtx = null; }
  }
  _playTone(freq, dur=0.2) {
    if (!this.audioCtx) return;
    const o = this.audioCtx.createOscillator();
    const g = this.audioCtx.createGain();
    o.frequency.value = freq;
    o.connect(g); g.connect(this.audioCtx.destination);
    o.start();
    g.gain.setValueAtTime(1, this.audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime+dur);
    o.stop(this.audioCtx.currentTime+dur);
  }
  _soundCorrect() { this._playTone(440,0.1); setTimeout(()=>this._playTone(660,0.1),100); }
  _soundWrong()   { this._playTone(150,0.2); }
  _soundFinish() {
    [523,587,659].forEach((f,i)=>setTimeout(()=>this._playTone(f,0.15), i*150));
  }

  /* ─── SpeechSynthesis (force Spanish) ─────────────────────────── */
  _setupVoices() {
    this.voices = [];
    const load = () => {
      this.voices = speechSynthesis.getVoices()
        .filter(v=>v.lang.startsWith("es"));
    };
    speechSynthesis.onvoiceschanged = load;
    load();
  }
  _speak(word) {
    if (!this.voices.length) return;
    const utter = new SpeechSynthesisUtterance(word);
    utter.voice = this.voices[0]; // pick first Spanish voice
    speechSynthesis.speak(utter);
  }

  /* ─── Theme & Session ─────────────────────────────────────────── */
  _toggleTheme() {
    const next = document.body.getAttribute("data-theme")==="dark"?"light":"dark";
    document.body.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }
  _restoreSession() {
    const theme = localStorage.getItem("theme")||"light";
    document.body.setAttribute("data-theme", theme);

    const cu = sessionStorage.getItem("currentUser");
    if (cu && this.users[cu]) {
      this.currentUser = cu;
      this.userSelect.value = cu;
      this._showGame();
    }
  }

  /* ─── Persistence ─────────────────────────────────────────────── */
  _loadData() {
    try {
      const raw = localStorage.getItem("users");
      if (raw) Object.assign(this.users, JSON.parse(raw));
    } catch {}
  }
  _saveData() {
    localStorage.setItem("users", JSON.stringify(this.users));
  }

  /* ─── Login / Logout ──────────────────────────────────────────── */
  _doLogin() {
    const u = this.userSelect.value, p = this.pinInput.value.trim();
    if (!u) { this.loginError.textContent="Selecciona usuario."; return; }
    if (!this.users[u]||this.users[u].pin!==p) {
      this.loginError.textContent="PIN inválido."; return;
    }
    this.loginError.textContent="";
    this.currentUser = u;
    sessionStorage.setItem("currentUser",u);
    this._showGame();
  }
  _showGame() {
    this.loginScreen.classList.add("hidden");
    this.gameScreen .classList.remove("hidden");
    this._updateLeaderboard();
  }
  _logout() {
    this._saveData();
    sessionStorage.removeItem("currentUser");
    location.reload();
  }

  /* ─── Quiz Logic & Rotation ──────────────────────────────────── */
  startQuiz() {
    if (!window.vocab || window.vocab.length===0) {
      this.messages.textContent="Error: vocab.js no cargado."; return;
    }
    const udata = this.users[this.currentUser];
    // build candidate pool of not-yet-10-mastered words
    const pool = window.vocab.filter(v=>(udata.mastered[v.word]||0)<10);
    // pick carry-over: up to 2 from last round still in pool
    const carry = udata.lastWords.filter(w=> pool.some(v=>v.word===w)).slice(0,2);
    // pick new to total of 5
    const leftovers = pool.filter(v=>!carry.includes(v.word));
    const pickNew = this._shuffle(leftovers).slice(0,5-carry.length).map(v=>v.word);
    const roundWords = [...carry, ...pickNew];
    // store lastWords
    udata.lastWords = roundWords;
    this._saveData();

    this.matched = new Set();
    this.errors  = new Set();
    this.currentSet = window.vocab.filter(v=>roundWords.includes(v.word));

    this.scoreDisp.textContent = udata.score;
    this.progressFill.style.width = "0%";
    this.finishBtn.classList.add("hidden");
    this.messages.textContent =
