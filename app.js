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
    this.goodLuck = ["¡Listo, pixelero! 🎮","¡A por los puntos! ⭐","¡Tú puedes! 💪"];
    this.wellDone = ["¡Nivel completado! ✅","¡Victoria retro! 🎉","¡Súper 8-bit! 🌟"];
    this._bindElements();
    this._initAudio();
    this._setupVoices();
    this._loadData();
    this._restoreSession();
    this._hookEvents();
  }

  _bindElements() {
    const $ = id => document.getElementById(id);
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
    this.scoreDisp     = $("scoreDisplay");
    this.progressFill  = $("progressFill");
    this.leaderList    = $("leaderList");

    this.victoryScreen = $("victoryScreen");
    this.victoryMsg    = $("victoryMessage");
    this.continueBtn   = $("continueBtn");
    this.quitBtn       = $("quitBtn");

    this.themeToggle   = $("themeToggle");
  }

  _hookEvents() {
    this.loginBtn.onclick     = () => this._doLogin();
    this.pinInput.onkeypress  = e => { if (e.key === "Enter") this._doLogin(); };
    this.startBtn.onclick     = () => this.startQuiz();
    this.finishBtn.onclick    = () => this.finishQuiz();
    this.logoutBtn.onclick    = () => this._logout();
    this.continueBtn.onclick  = () => this._continue();
    this.quitBtn.onclick      = () => this._logout();
    this.themeToggle.onclick  = () => this._toggleTheme();
  }

  /* Audio */
  _initAudio() {
    try { this.audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }
    catch { this.audioCtx = null; }
  }
  _playTone(freq, dur=0.2) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain); gain.connect(this.audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(1, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime+dur);
    osc.stop(this.audioCtx.currentTime+dur);
  }
  _soundCorrect() { this._playTone(440,0.1); setTimeout(()=>this._playTone(660,0.1),100); }
  _soundWrong()   { this._playTone(150,0.2); }
  _soundFinish() {
    [523,587,659].forEach((f,i)=>setTimeout(()=>this._playTone(f,0.15), i*150));
  }

  /* Speech */
  /* ─── SpeechSynthesis (force Spanish) ─────────────────────────── */
  _setupVoices() {
    this.voices = [];
    const loadVoices = () => {
      const all = speechSynthesis.getVoices();
      this.voices = all.filter(v => v.lang.startsWith("es"));
    };
    // some browsers fire voiceschanged after initial load
    speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
  }

  _speak(word) {
    const utter = new SpeechSynthesisUtterance(word);
    // force Spanish pronunciation
    utter.lang = "es-ES";
    // if we found any Spanish voices, pick the first
    if (this.voices && this.voices.length) {
      utter.voice = this.voices[0];
    }
    speechSynthesis.speak(utter);
  }


  /* Theme & Session */
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

  /* Persistence */
  _loadData() {
    try {
      const raw = localStorage.getItem("users");
      if (raw) Object.assign(this.users, JSON.parse(raw));
    } catch {}
  }
  _saveData() {
    localStorage.setItem("users", JSON.stringify(this.users));
  }

  /* Login / Logout */
  _doLogin() {
    const u = this.userSelect.value, p = this.pinInput.value.trim();
    if (!u) { this.loginError.textContent = "Selecciona usuario."; return; }
    if (!this.users[u] || this.users[u].pin !== p) {
      this.loginError.textContent = "PIN inválido."; return;
    }
    this.loginError.textContent = "";
    this.currentUser = u;
    sessionStorage.setItem("currentUser", u);
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

  /* Quiz & Rotation */
   startQuiz() {
    // 1) hide everything but the emoji/word columns
    this.loginScreen .classList.add("hidden");
    this.startBtn    .classList.add("hidden");
    this.finishBtn   .classList.add("hidden");
    document.getElementById("leaderboard").classList.add("hidden");
    this.messages.textContent = "";

    // 2) ensure the victory screen is gone
    this.victoryScreen.classList.add("hidden");

    // …then the rest of your existing quiz-setup code…
    const udata = this.users[this.currentUser];
    // build pool of words not yet mastered 10×
    const pool = window.vocab.filter(v => (udata.mastered[v.word]||0) < 10);

    // carry‐over up to 2 from last round
    const carry = udata.lastWords
      .filter(w => pool.some(v => v.word === w))
      .slice(0, 2);

    // pick the rest new to make 5 total
    const leftovers = pool.filter(v => !carry.includes(v.word));
    const newPick = this._shuffle(leftovers)
      .slice(0, 5 - carry.length)
      .map(v => v.word);

    // final words for this round
    const roundWords = [...carry, ...newPick];
    udata.lastWords = roundWords;
    this._saveData();

    // prepare state
    this.currentSet = window.vocab.filter(v => roundWords.includes(v.word));
    this.matched    = new Set();
    this.errors     = new Set();

    // reset UI
    this.scoreDisp.textContent   = udata.score;
    this.progressFill.style.width = "0%";
    this.finishBtn.classList.add("hidden");

    // friendly go‐message
    this.messages.textContent = 
      this.goodLuck[Math.floor(Math.random() * this.goodLuck.length)];

    // finally render the 2 columns
    this._renderQuiz();
  }


  _renderQuiz() {
    // emojis
    this.emojiCol.innerHTML = "";
    this.currentSet.forEach(({emoji,word})=>{
      const d = document.createElement("div");
      d.className = "box emojiBox";
      d.textContent = emoji;
      d.dataset.word = word;
      d.onclick = ()=>this._selectEmoji(d,word);
      this.emojiCol.appendChild(d);
    });
    // words
    this.wordCol.innerHTML = "";
    this._shuffle(this.currentSet).forEach(({word})=>{
      const d = document.createElement("div");
      d.className = "box wordBox";
      d.textContent = word;
      d.onclick = ()=>this._selectWord(d,word);
      this.wordCol.appendChild(d);
    });
  }

  _selectEmoji(div,word) {
    if (this.matched.has(word)) {
      this._speak(word);
      return;
    }
    this.emojiCol.querySelectorAll(".selected").forEach(x=>x.classList.remove("selected"));
    div.classList.add("selected");
    this.selectedEmoji = div;
    this._speak(word);
  }

  _selectWord(div,word) {
    if (!this.selectedEmoji) return;
    const guess = this.selectedEmoji.dataset.word;
    if (guess === word) this._handleCorrect(div,word);
    else                 this._handleWrong(div);
  }

  _handleCorrect(div,word) {
    this.matched.add(word);
    const u = this.users[this.currentUser];
    if (!this.errors.has(word)) {
      u.score++;
      u.mastered[word] = (u.mastered[word]||0) + 1;
      this._saveData();
    }
    this.scoreDisp.textContent = u.score;
    this.selectedEmoji.classList.replace("selected","matched");
    div.classList.add("matched","highlight");
    this.selectedEmoji = null;

    const pct = this.matched.size / this.currentSet.length * 100;
    this.progressFill.style.width = pct + "%";

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
    setTimeout(()=>div.classList.remove("incorrect"), 300);
    this._soundWrong();
    this.messages.textContent = "Intenta otra vez…";
  }

  finishQuiz() {
    // hide the in-game view
    this.gameScreen   .classList.add("hidden");
    document.getElementById("leaderboard").classList.add("hidden");

    // show the victory screen
    this.victoryScreen.classList.remove("hidden");
    this.victoryMsg.textContent = this.wellDone[
      Math.floor(Math.random()*this.wellDone.length)
    ];

    // triumphant finish sound & confetti
    this._soundFinish();
    confetti({ particleCount: 200, spread: 100 });
  }


  _continue() {
    this.victoryScreen.classList.add("hidden");
    this.gameScreen.classList.remove("hidden");
  }

  _updateLeaderboard() {
    const html = Object.entries(this.users)
      .sort((a,b)=>b[1].score - a[1].score)
      .map(([u,d])=>`<li>${u}: ${d.score} pts</li>`).join("");
    this.leaderList.innerHTML = html;
  }

  _shuffle(arr) {
    for (let i=arr.length-1;i>0;i--) {
      const j = Math.random()*(i+1)|0;
      [arr[i],arr[j]] = [arr[j],arr[i]];
    }
    return arr;
  }
}

// instantiate on DOM ready
document.addEventListener("DOMContentLoaded", ()=>new SpanishVocabTrainer());
