console.log("window.vocab is:", window.vocab);


class SpanishVocabTrainer {
  constructor() {
    this.users = {
      Tony:  { pin: "1984", score: 0, mastered: {}, lastWords: [] },
      Mina:  { pin: "1982", score: 0, mastered: {}, lastWords: [] },
      Sorato:{ pin: "2014", score: 0, mastered: {}, lastWords: [] },
      Kaito: { pin: "2015", score: 0, mastered: {}, lastWords: [] },
      Maria: { pin: "2019", score: 0, mastered: {}, lastWords: [] }
    };
    this.goodLuckPhrases = ["¡Listo, pixelero! 🎮","¡A por los puntos! ⭐","¡Tú puedes! 💪"];
    this.wellDonePhrases = ["¡Nivel completado! ✅","¡Eres un pro! 🏆"];
    this.matched = new Set();
    this.errorWords = new Set();
    this.currentVocab = [];
    this.selectedEmoji = null;
    this.audioContext = null;

    this._bindElements();
    this._loadUserData();
    this._setupListeners();
    this._initAudio();
    this._checkSession();
  }

  _bindElements() {
    const get = id => document.getElementById(id);
    this.emojis    = get("emojiColumn");
    this.words     = get("wordColumn");
    this.scoreDisp = get("score");
    this.msgs      = get("messages");
    this.loginBtn  = get("loginBtn");
    this.startBtn  = get("startBtn");
    this.finishBtn = get("finishBtn");
    this.logoutBtn = get("logoutBtn");
    this.userSel   = get("username");
    this.pinInput  = get("pin");
    this.loginErr  = get("loginError");
    this.lbList    = get("leaderboardList");
    this.themeTog  = get("themeToggle");
    this.progBar   = get("progress");
  }

  _setupListeners() {
    this.loginBtn .addEventListener("click", () => this._login());
    this.startBtn .addEventListener("click", () => this.startQuiz());
    this.finishBtn.addEventListener("click", () => this.finishQuiz());
    this.logoutBtn.addEventListener("click", () => this.logout());
    this.themeTog .addEventListener("click", () => this._toggleTheme());
    this.pinInput .addEventListener("keypress", e => { if (e.key==="Enter") this._login(); });
  }

  _initAudio() {
    try { this.audioContext = new (window.AudioContext||window.webkitAudioContext)(); }
    catch(e){ console.warn("Audio not supported",e); }
  }

  _checkSession() {
    const u = sessionStorage.getItem("currentUser");
    if (u && this.users[u]) {
      this.currentUser = u;
      this.userSel.value = u;
      this._showGame();
    }
  }

  _login() {
    const u = this.userSel.value, p = this.pinInput.value.trim();
    if (!u) return this.loginErr.textContent="Selecciona usuario.";
    if (!this.users[u] || this.users[u].pin!==p) return this.loginErr.textContent="PIN inválido.";
    this.loginErr.textContent="";
    this.currentUser = u;
    sessionStorage.setItem("currentUser",u);
    this._showGame();
  }

  _showGame() {
    document.getElementById("loginSection" ).classList.add("hidden");
    document.getElementById("buttons"      ).classList.remove("hidden");
    this._updateLeaderboard();
  }

  startQuiz() {
    if (!window.vocab || !vocab.length) {
      return this.msgs.textContent="Error: vocab.js no cargado.";
    }
    this.matched.clear();
    this.errorWords.clear();
    this.currentVocab = this._pickWords();
    this._renderEmojis();
    this._renderWords();
    this.scoreDisp.textContent = `Puntos: ${this.users[this.currentUser].score}`;
    this.progBar.style.width="0%";
    this.msgs.textContent = this.goodLuckPhrases[Math.random()*this.goodLuckPhrases.length|0];
  }

  _pickWords() {
    const avail = vocab.filter(v=>!(this.users[this.currentUser].mastered[v.word]>=10));
    const pick = this._shuffle(avail).slice(0,5);
    this.users[this.currentUser].lastWords = pick.map(x=>x.word);
    this._saveUserData();
    return pick;
  }

  _renderEmojis() {
    this.emojis.innerHTML="";
    this.currentVocab.forEach(({emoji,word}) => {
      const d = document.createElement("div");
      d.className="box"; d.textContent=emoji;
      d.dataset.word=word;
      d.onclick = () => this._selectEmoji(d,word);
      this.emojis.appendChild(d);
    });
  }

  _renderWords() {
    this.words.innerHTML="";
    this._shuffle([...this.currentVocab]).forEach(({word})=>{
      const d = document.createElement("div");
      d.className="box wordBox"; d.textContent=word;
      d.onclick = () => this._selectWord(d,word);
      this.words.appendChild(d);
    });
  }

  _selectEmoji(div,word) {
    if (this.matched.has(word)) return;
    if (this.selectedEmoji===div) { div.classList.remove("selected"); this.selectedEmoji=null; return; }
    this.emojis.querySelectorAll(".selected").forEach(x=>x.classList.remove("selected"));
    div.classList.add("selected");
    this.selectedEmoji=div;
    this._speak(word);
  }

  _selectWord(div,word) {
    if (!this.selectedEmoji) return;
    const guess = this.selectedEmoji.dataset.word;
    if (guess===word) this._correct(div,word);
    else this._wrong(div,word);
  }

  _correct(div,word) {
    this.matched.add(word);
    this.selectedEmoji.classList.replace("selected","matched");
    div.classList.add("matched","highlight");
    this.users[this.currentUser].score++;
    this.users[this.currentUser].mastered[word]=
      (this.users[this.currentUser].mastered[word]||0)+1;
    this._saveUserData();
    this.scoreDisp.textContent = `Puntos: ${this.users[this.currentUser].score}`;
    this._updateProgress();
    this.msgs.textContent="¡Correcto! 🎉";
    if (this.matched.size===this.currentVocab.length) {
      this.finishBtn.classList.remove("hidden");
    }
  }

  _wrong(div,word) {
    this.errorWords.add(word);
    div.classList.add("incorrect");
    setTimeout(()=>div.classList.remove("incorrect"),300);
    this.msgs.textContent="Intenta otra vez… 🤔";
  }

  _updateProgress() {
    const pct = this.matched.size/this.currentVocab.length*100;
    this.progBar.style.width = pct+"%";
  }

  finishQuiz() {
    this.msgs.textContent = this.wellDonePhrases[Math.random()*this.wellDonePhrases.length|0];
    this._updateLeaderboard();
    this.finishBtn.classList.add("hidden");
  }

  _updateLeaderboard() {
    const list = Object.entries(this.users)
      .sort((a,b)=>b[1].score - a[1].score)
      .map(([u,d])=>`<li>${u}: ${d.score}</li>`)
      .join("");
    this.lbList.innerHTML = list;
  }

  logout() {
    this._saveUserData();
    sessionStorage.removeItem("currentUser");
    location.reload();
  }

  _saveUserData() {
    localStorage.setItem("users",JSON.stringify(this.users));
  }

  _loadUserData() {
    try {
      const s = localStorage.getItem("users");
      if (s) Object.assign(this.users, JSON.parse(s));
    } catch{}
  }

  _shuffle(a) {
    for(let i=a.length-1;i>0;--i){
      const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }

  _speak(text) {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(u);
  }
}

// instantiate when DOM ready
window.addEventListener("DOMContentLoaded",()=>new SpanishVocabTrainer());
