class SpanishVocabTrainer {
  constructor() {
    // 1) preset users
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

    // 2) grab all the DOM nodes
    this._bindElements();
    // 3) wire up events
    this._hookEvents();
    // 4) audio / voices / persistence
    this._initAudio();
    this._setupVoices();
    this._loadData();
    this._restoreSession();
  }

  _bindElements() {
    const $ = id => document.getElementById(id);
    this.loginScreen    = $("loginScreen");
    this.userSelect     = $("userSelect");
    this.pinInput       = $("pinInput");
    this.loginBtn       = $("loginBtn");
    this.loginError     = $("loginError");

    this.lobbyScreen    = $("lobbyScreen");
    this.leaderList     = $("leaderList");
    this.startGameBtn   = $("startGameBtn");
    this.logoutBtn      = $("logoutBtn");

    this.gameScreen     = $("gameScreen");
    this.gameQuitBtn    = $("gameQuitBtn");
    this.emojiCol       = $("emojiColumn");
    this.wordCol        = $("wordColumn");
    this.scoreDisp      = $("scoreDisplay");
    this.progressFill   = $("progressFill");

    this.victoryScreen  = $("victoryScreen");
    this.victoryMessage = $("victoryMessage");
    this.continueBtn    = $("continueBtn");
    this.quitVictoryBtn = $("quitVictoryBtn");

    this.themeToggle    = $("themeToggle");
  }

  _hookEvents() {
    this.loginBtn     .onclick = () => this._doLogin();
    this.pinInput     .onkeypress = e => { if (e.key==="Enter") this._doLogin(); };
    this.startGameBtn .onclick = () => this._showLobbyToGame();
    this.logoutBtn    .onclick = () => this._logout();
    this.gameQuitBtn  .onclick = () => this._quitToLobby();
    this.continueBtn  .onclick = () => this._gameToLobby();
    this.quitVictoryBtn.onclick = () => this._gameToLobby();
    this.themeToggle  .onclick = () => this._toggleTheme();
  }

  /* ───── Audio Setup ───────────────────────────────────────── */
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
    gain.gain.exponentialRampToValueAtTime(
      0.001, this.audioCtx.currentTime + dur
    );
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

  /* ───── SpeechSynthesis ───────────────────────────────────── */
  _setupVoices() {
    this.voices = [];
    const load = () => {
      this.voices = speechSynthesis
        .getVoices()
        .filter(v=>v.lang.startsWith("es"));
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

  /* ───── Theme & Persistence ───────────────────────────────── */
  _toggleTheme() {
    const t = document.body.getAttribute("data-theme")==="dark"
      ? "light"
      : "dark";
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

  /* ───── Login / Lobby Transitions ─────────────────────────── */
  _doLogin() {
    const u = this.userSelect.value, p = this.pinInput.value.trim();
    if (!u) { this.loginError.textContent="Selecciona usuario."; return; }
    if (!this.users[u]||this.users[u].pin!==p) {
      this.loginError.textContent="PIN inválido."; return;
    }
    this.loginError.textContent="";
    this.currentUser = u;
    sessionStorage.setItem("currentUser", u);
    this._showLobby();
  }
  _showLobby() {
    this.loginScreen .classList.add("hidden");
    this.lobbyScreen .classList.remove("hidden");
    this.gameScreen  .classList.add("hidden");
    this.victoryScreen.classList.add("hidden");
    this._updateLeaderboard();
  }
  _showLobbyToGame() {
    this.lobbyScreen .classList.add("hidden");
    this.startQuiz();
  }
  _logout() {
    this._saveData();
    sessionStorage.removeItem("currentUser");
    location.reload();
  }

  /* ───── Quiz Start / Rotation ─────────────────────────────── */
  startQuiz() {
    // hide other screens
    this.victoryScreen.classList.add("hidden");
    this.gameScreen   .classList.remove("hidden");

    const udata = this.users[this.currentUser];
    // pool of <10 mastered
    const pool = window.vocab.filter(
      v => (udata.mastered[v.word]||0) < 10
    );
    // up to 2 carry-over
    const carry = (udata.lastWords||[])
      .filter(w=> pool.some(v=>v.word===w))
      .slice(0,2);
    const leftovers = pool.filter(v=>!carry.includes(v.word));
    const pickNew  = this._shuffle(leftovers)
      .slice(0,5-carry.length)
      .map(v=>v.word);
    const roundWords = [...carry, ...pickNew];
    udata.lastWords = roundWords;
    this._saveData();

    this.currentSet = window.vocab.filter(v=>
      roundWords.includes(v.word)
    );
    this.matched = new Set();
    this.errors  = new Set();

    this.scoreDisp.textContent   = udata.score;
    this.progressFill.style.width= "0%";

    this._renderQuiz();
  }

  _renderQuiz() {
    this.emojiCol.innerHTML = "";
    this.wordCol.innerHTML  = "";
    // emojis
    this.currentSet.forEach(({emoji,word})=>{
      const d = document.createElement("div");
      d.className = "box emojiBox";
      d.textContent = emoji;
      d.dataset.word = word;
      d.onclick = ()=>this._onEmoji(d,word);
      this.emojiCol.appendChild(d);
    });
    // words
    this._shuffle(this.currentSet).forEach(({word})=>{
      const d = document.createElement("div");
      d.className = "box wordBox";
      d.textContent = word;
      d.onclick = ()=>this._onWord(d,word);
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
    if (guess===word) this._correct(div,word);
    else               this._wrong(div);
  }

  _correct(div,word) {
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

    if (this.matched.size === this.currentSet.length) {
      setTimeout(()=>this.finishQuiz(), 300);
    }
  }

  _wrong(div) {
    this.errors.add(div.textContent);
    div.classList.add("incorrect");
    setTimeout(()=>div.classList.remove("incorrect"),300);
    this._soundWrong();
  }

  finishQuiz() {
    this.gameScreen   .classList.add("hidden");
    this.victoryScreen.classList.remove("hidden");
    this.victoryMessage.textContent = 
      this.wellDone[Math.floor(Math.random()*this.wellDone.length)];
    this._soundFinish();
    confetti({ particleCount:200, spread:100 });
  }

  _gameToLobby() {
    this.victoryScreen .classList.add("hidden");
    this.lobbyScreen   .classList.remove("hidden");
    this._updateLeaderboard();
  }
  _quitToLobby() {
    this.gameScreen  .classList.add("hidden");
    this.lobbyScreen .classList.remove("hidden");
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
    for (let i=arr.length-1;i>0;i--) {
      const j = Math.random()*(i+1)|0;
      [arr[i],arr[j]] = [arr[j],arr[i]];
    }
    return arr;
  }
}

document.addEventListener("DOMContentLoaded", ()=>
  new SpanishVocabTrainer()
);
