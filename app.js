class SpanishVocabTrainer {
  constructor() {
    // 1) preset users
    this.users = {
      Guest:   { pin:"",    score:0, mastered:{}, lastWords:[], lastCorrect:[] },
      Tony:   { pin:"1984", score:0, mastered:{}, lastWords:[], lastCorrect:[] },
      Mina:   { pin:"1982", score:0, mastered:{}, lastWords:[], lastCorrect:[] },
      Sorato: { pin:"2014", score:0, mastered:{}, lastWords:[], lastCorrect:[] },
      Kaito:  { pin:"2015", score:0, mastered:{}, lastWords:[], lastCorrect:[] },
      Maria:  { pin:"2019", score:0, mastered:{}, lastWords:[], lastCorrect:[] }
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

    // bind + init
    this._bindElements();
    this._hookEvents();
    this._initAudio();
    this._setupVoices();
    this._loadData();
    this._restoreSession();
  }

  _bindElements() {
    const $ = id => document.getElementById(id);
    this.loginScreen     = $("loginScreen");
    this.userSelect      = $("userSelect");
    this.pinInput        = $("pinInput");
    this.loginBtn        = $("loginBtn");
    this.loginError      = $("loginError");

    // registration controls
    this.newUser         = $("newUser");
    this.newPin          = $("newPin");
    this.registerBtn     = $("registerBtn");

    this.lobbyScreen     = $("lobbyScreen");
    this.leaderList      = $("leaderList");
    this.startGameBtn    = $("startGameBtn");
    this.logoutBtn       = $("logoutBtn");

    this.gameScreen      = $("gameScreen");
    this.gameQuitBtn     = $("gameQuitBtn");
    this.emojiCol        = $("emojiColumn");
    this.wordCol         = $("wordColumn");
    this.scoreDisp       = $("scoreDisplay");
    this.progressFill    = $("progressFill");

    this.victoryScreen   = $("victoryScreen");
    this.victoryMessage  = $("victoryMessage");
    this.continueBtn     = $("continueBtn");
    this.quitVictoryBtn  = $("quitVictoryBtn");

    this.themeToggle     = $("themeToggle");
    this._populateUserSelect();
  }

  _populateUserSelect() {
    // start fresh
    this.userSelect.innerHTML = `
      <option value="">— Selecciona usuario —</option>
    `;
    // now add Guest + all named users:
    Object.keys(this.users).forEach(u => {
      const opt = document.createElement("option");
      opt.value = u;
      // show “Invitado” instead of “Guest”
      opt.textContent = u === "Guest" ? "Invitado" : u;
      this.userSelect.appendChild(opt);
    });
  }

  _hookEvents() {
    this.loginBtn.onclick       = () => this._doLogin();
    this.pinInput.onkeypress    = e => { if (e.key === "Enter") this._doLogin(); };
    this.registerBtn.onclick    = () => this._registerUser();

    this.startGameBtn.onclick   = () => this._showLobbyToGame();
    this.logoutBtn.onclick      = () => this._logout();
    this.gameQuitBtn.onclick    = () => this._quitToLobby();
    this.continueBtn.onclick    = () => this._gameToLobby();
    this.quitVictoryBtn.onclick = () => this._gameToLobby();

    this.themeToggle.onclick    = () => this._toggleTheme();
  }

  // ───── Audio ──────────────────────────────────────────────
  _initAudio() {
    try { this.audioCtx = new (AudioContext||webkitAudioContext)(); }
    catch { this.audioCtx = null; }
  }
  _playTone(freq, dur=0.2, type="square") {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain); gain.connect(this.audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(1, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + dur);
    osc.stop(this.audioCtx.currentTime + dur);
  }
  _soundCorrect() { this._playTone(880,0.1,"square"); }
  _soundWrong() {
    this._playTone(600,0.1,"sawtooth");
    setTimeout(()=>this._playTone(400,0.1,"sawtooth"), 120);
  }
  _soundFinish() {
    [659,784,880].forEach((f,i)=>
      setTimeout(()=>this._playTone(f,0.2,"square"), i*200)
    );
  }

  // ───── Speech ─────────────────────────────────────────────
  _setupVoices() {
    this.voices = [];
    const load = () => {
      this.voices = speechSynthesis.getVoices().filter(v=>v.lang.startsWith("es"));
    };
    speechSynthesis.onvoiceschanged = load;
    load();
  }
  _speak(word) {
    const utt = new SpeechSynthesisUtterance(word);
    utt.lang = "es-ES";
    if (this.voices.length) utt.voice = this.voices[0];
    speechSynthesis.speak(utt);
  }

  // ───── Theme & Storage ────────────────────────────────────
  _toggleTheme() {
    const t = document.body.getAttribute("data-theme")==="dark" ? "light" : "dark";
    document.body.setAttribute("data-theme", t);
    localStorage.setItem("theme", t);
  }
  _restoreSession() {
    const theme = localStorage.getItem("theme") || "light";
    document.body.setAttribute("data-theme", theme);
    const u = sessionStorage.getItem("currentUser");
    if (u && this.users[u]) {
      this.currentUser = u;
      this.userSelect.value = u;
      this._showLobby();
    }
  }
  _loadData() {
    try {
      const raw = localStorage.getItem("users");
      if (raw) Object.assign(this.users, JSON.parse(raw));
    } catch {}
  }
  _saveData() {
    localStorage.setItem("users", JSON.stringify(this.users));
  }

/* ───── Login / Registration ───────────────────────── */
  _doLogin() {
    const u = this.userSelect.value;
    const p = this.pinInput.value.trim();
    if (!u) {
      this.loginError.textContent = "Selecciona usuario.";
      return;
    }
    if (u !== "Guest") {
      if (!this.users[u] || this.users[u].pin !== p) {
        this.loginError.textContent = "PIN inválido.";
        return;
      }
    }
    this.loginError.textContent = "";
    this.currentUser = u;
    sessionStorage.setItem("currentUser", u);
    this._showLobby();
  }

  _registerUser() {
    const name = this.newUser.value.trim();
    const pin  = this.newPin.value.trim();
    if (!name || !pin) {
      alert("Introduce usuario y PIN para registrar.");
      return;
    }
    if (this.users[name]) {
      alert("¡Ese usuario ya existe!");
      return;
    }
    this.users[name] = {
      pin,
      score:0,
      mastered:{},
      lastWords:[],
      lastCorrect:[]
    };
    this._saveData();
    // re-populate so new user shows up
    this._populateUserSelect();
    this.newUser.value = "";
    this.newPin.value  = "";
    alert("Usuario registrado. ¡Ahora inicia sesión!");
  }

  _showLobby() {
    this.loginScreen .classList.add("hidden");
    this.lobbyScreen .classList.remove("hidden");
    this.gameScreen  .classList.add("hidden");
    this.victoryScreen.classList.add("hidden");
    this._updateLeaderboard();
  }

  _showLobbyToGame() {
    this.lobbyScreen.classList.add("hidden");
    this.startQuiz();
  }

  _logout() {
    this._saveData();
    sessionStorage.removeItem("currentUser");
    location.reload();
  }

  _quitToLobby() {
    this.gameScreen .classList.add("hidden");
    this.lobbyScreen.classList.remove("hidden");
    this._updateLeaderboard();
  }

  // ───── Quiz Logic ─────────────────────────────────────────
  startQuiz() {
    const u = this.users[this.currentUser];

    // 1) pool of words mastered <10×
    let pool = window.vocab
      .filter(v => (u.mastered[v.word]||0) < 10)
      .map(v => v.word);

    // 2) carry first two most recent correct
    const carry = u.lastCorrect.filter(w => pool.includes(w)).slice(0,2);

    // 3) remove carry, shuffle, pick new
    pool = pool.filter(w => !carry.includes(w));
    const need    = 5 - carry.length;
    const pickNew = this._shuffle(pool).slice(0,need);

    // 4) combine & save rotation
    const roundWords = [...carry, ...pickNew];
    u.lastWords = roundWords;
    this._saveData();

    // 5) prepare state
    this.currentSet = window.vocab.filter(v => roundWords.includes(v.word));
    this.matched    = new Set();
    this.errors     = new Set();

    // 6) show game
    this.lobbyScreen .classList.add("hidden");
    this.victoryScreen.classList.add("hidden");
    this.gameScreen  .classList.remove("hidden");

    // 7) reset UI & render
    this.scoreDisp.textContent    = u.score;
    this.progressFill.style.width = "0%";
    this._renderQuiz();
  }

  _renderQuiz() {
    this.emojiCol.innerHTML = "";
    this.wordCol.innerHTML  = "";

    // emojis (fixed)
    this.currentSet.forEach(({emoji,word}) => {
      const d = document.createElement("div");
      d.className    = "box emojiBox";
      d.textContent  = emoji;
      d.dataset.word = word;
      d.onclick      = () => this._onEmoji(d,word);
      this.emojiCol.appendChild(d);
    });

    // words (shuffled)
    this._shuffle(this.currentSet).forEach(({word}) => {
      const d = document.createElement("div");
      d.className   = "box wordBox";
      d.textContent = word;
      d.onclick     = () => this._onWord(d,word);
      this.wordCol.appendChild(d);
    });
  }

  _onEmoji(div,word) {
    if (this.matched.has(word)) { this._speak(word); return; }
    this.emojiCol.querySelectorAll(".selected")
      .forEach(x=>x.classList.remove("selected"));
    div.classList.add("selected");
    this.selectedEmoji = div;
    this._speak(word);
  }

  _onWord(div,word) {
    if (!this.selectedEmoji) return;
    const guess = this.selectedEmoji.dataset.word;
    if (guess === word) this._correct(div,word);
    else                 this._wrong(div);
  }

  _correct(div,word) {
    this.matched.add(word);
    const u = this.users[this.currentUser];

    if (!this.errors.has(word)) {
      u.score++;
      u.mastered[word] = (u.mastered[word]||0) + 1;

      // update lastCorrect rotation
      const idx = u.lastCorrect.indexOf(word);
      if (idx > -1) u.lastCorrect.splice(idx,1);
      if (u.mastered[word] < 10) u.lastCorrect.unshift(word);

      this._saveData();
    }

    this.scoreDisp.textContent = u.score;
    this.selectedEmoji.classList.replace("selected","matched");
    div.classList.add("matched","highlight");
    this.selectedEmoji = null;

    const pct = this.matched.size / this.currentSet.length * 100;
    this.progressFill.style.width = pct + "%";
    this._soundCorrect();

    if (this.matched.size === this.currentSet.length) {
      setTimeout(()=>this.finishQuiz(), 300);
    }
  }

  finishQuiz() {
    this.gameScreen   .classList.add("hidden");
    this.victoryScreen.classList.remove("hidden");
    this.victoryMessage.textContent =
      this.wellDone[Math.floor(Math.random()*this.wellDone.length)];
    this._soundFinish();
    confetti({ particleCount:200, spread:100 });
  }

  _wrong(div) {
    this.errors.add(div.textContent);
    div.classList.add("incorrect");
    setTimeout(()=>div.classList.remove("incorrect"),300);
    this._soundWrong();
  }

  _gameToLobby() {
    this.victoryScreen .classList.add("hidden");
    this.lobbyScreen   .classList.remove("hidden");
    this._updateLeaderboard();
  }

  _updateLeaderboard() {
    const html = Object.entries(this.users)
      .sort((a,b)=>b[1].score - a[1].score)
      .map(([u,d])=>`<li>${u}: ${d.score}</li>`)
      .join("");
    this.leaderList.innerHTML = html;
  }

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.random() * (i + 1) | 0;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

document.addEventListener("DOMContentLoaded", () =>
  new SpanishVocabTrainer()
);
