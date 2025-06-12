class SpanishVocabTrainer {
  constructor() {
    this.users = {
      Tony:   { pin:"1984", score:0, mastered:{}, lastWords:[] },
      Mina:   { pin:"1982", score:0, mastered:{}, lastWords:[] },
      Sorato: { pin:"2014", score:0, mastered:{}, lastWords:[] },
      Kaito:  { pin:"2015", score:0, mastered:{}, lastWords:[] },
      Maria:  { pin:"2019", score:0, mastered:{}, lastWords:[] }
    };
    this.goodLuck = ["¡Listo, pixelero! 🎮","¡A por los puntos! ⭐","¡Tú puedes! 💪"];
    this.wellDone = ["¡Nivel completado! ✅","¡Victoria retro! 🎉","¡Súper 8-bit! 🌟"];
    this._bind();
    this._loadData();
    this._setupVoices();
    this._listeners();
    this._restore();
    this._initAudio();
  }

  _bind() {
    const $=id=>document.getElementById(id);
    this.loginScreen  =$("loginScreen");
    this.userSelect   =$("userSelect");
    this.pinInput     =$("pinInput");
    this.loginBtn     =$("loginBtn");
    this.loginError   =$("loginError");

    this.gameScreen   =$("gameScreen");
    this.startBtn     =$("startBtn");
    this.finishBtn    =$("finishBtn");
    this.logoutBtn    =$("logoutBtn");
    this.messages     =$("messages");
    this.emojiCol     =$("emojiColumn");
    this.wordCol      =$("wordColumn");
    this.scoreDisp    =$("scoreDisplay");
    this.progressFill =$("progressFill");
    this.leaderList   =$("leaderList");

    this.victoryScreen= $("victoryScreen");
    this.victoryMsg   = $("victoryMessage");
    this.continueBtn  = $("continueBtn");
    this.quitBtn      = $("quitBtn");

    this.themeToggle  = $("themeToggle");
  }

  _listeners() {
    this.loginBtn.onclick    =()=>this._doLogin();
    this.pinInput.onkeypress =e=>{if(e.key==="Enter")this._doLogin()};
    this.startBtn.onclick    =()=>this.startQuiz();
    this.finishBtn.onclick   =()=>this.finishQuiz();
    this.logoutBtn.onclick   =()=>this._logout();
    this.continueBtn.onclick =()=>this._continue();
