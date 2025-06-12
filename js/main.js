let isSpeaking = false;
let score = 0;
let selectedEmoji = null;
let selectedWord = null;
const pairs = [
  { emoji: '🍎', word: 'Manzana' },
  { emoji: '🚗', word: 'Coche' },
  { emoji: '🐶', word: 'Perro' },
  { emoji: '🌞', word: 'Sol' }
];
const users = {
  Tony: { pin: '1234', avatar: 'assets/images/avatar_tony.png' },
  Mina: { pin: '5678', avatar: 'assets/images/avatar_mina.png' },
  Sorato: { pin: '9012', avatar: 'assets/images/avatar_sorato.png' },
  Kaito: { pin: '3456', avatar: 'assets/images/avatar_kaito.png' },
  Maria: { pin: '7890', avatar: 'assets/images/avatar_maria.png' }
};
let currentUser = null;

document.getElementById('loginBtn').addEventListener('click', () => {
  const username = document.getElementById('username').value;
  const pin = document.getElementById('pin').value;
  const errorDiv = document.getElementById('loginError');
  if (users[username] && users[username].pin === pin) {
    currentUser = username;
    errorDiv.textContent = '';
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('buttons').style.display = 'block';
    document.getElementById('leaderboard').style.display = 'block';
    updateLeaderboard(score);
  } else {
    errorDiv.textContent = 'Usuario o PIN incorrecto';
  }
});

document.getElementById('startBtn').addEventListener('click', () => {
  document.getElementById('buttons').style.display = 'none';
  document.getElementById('container').style.display = 'flex';
  document.getElementById('score').style.display = 'block';
  document.getElementById('progressBar').style.display = 'block';
  startGame();
});

function startGame() {
  score = 0;
  document.getElementById('score').textContent = `Matches: ${score}`;
  document.getElementById('progress').style.width = '0%';
  const shuffledPairs = [...pairs].sort(() => Math.random() - 0.5);
  const emojis = shuffledPairs.map(p => p.emoji);
  const words = shuffledPairs.map(p => p.word).sort(() => Math.random() - 0.5);
  const emojiColumn = document.getElementById('emojiColumn');
  const wordColumn = document.getElementById('wordColumn');
  emojiColumn.innerHTML = '';
  wordColumn.innerHTML = '';
  emojis.forEach((emoji, i) => {
    const box = document.createElement('div');
    box.className = 'box emojiBox';
    box.textContent = emoji;
    box.dataset.word = shuffledPairs[i].word;
    box.addEventListener('click', () => handleBoxClick(box));
    emojiColumn.appendChild(box);
  });
  words.forEach(word => {
    const box = document.createElement('div');
    box.className = 'box wordBox';
    box.textContent = word;
    box.dataset.word = word;
    box.addEventListener('click', () => handleBoxClick(box));
    wordColumn.appendChild(box);
  });
}

function handleBoxClick(box) {
  if (isSpeaking || box.classList.contains('matched')) {
    if (box.classList.contains('emojiBox')) {
      isSpeaking = true;
      speakText(box.dataset.word, () => { isSpeaking = false; });
    }
    return;
  }
  if (box.classList.contains('emojiBox')) {
    if (selectedEmoji === box) {
      box.classList.remove('selected');
      selectedEmoji = null;
    } else {
      if (selectedEmoji) selectedEmoji.classList.remove('selected');
      box.classList.add('selected');
      selectedEmoji = box;
      checkMatch();
    }
  } else {
    if (selectedWord === box) {
      box.classList.remove('selected');
      selectedWord = null;
    } else {
      if (selectedWord) selectedWord.classList.remove('selected');
      box.classList.add('selected');
      selectedWord = box;
      checkMatch();
    }
  }
}

function checkMatch() {
  if (selectedEmoji && selectedWord) {
    if (selectedEmoji.dataset.word === selectedWord.dataset.word) {
      selectedEmoji.classList.add('matched');
      selectedWord.classList.add('matched');
      score++;
      document.getElementById('score').textContent = `Matches: ${score}`;
      document.getElementById('progress').style.width = `${(score / pairs.length) * 100}%`;
      selectedEmoji.classList.remove('selected');
      selectedWord.classList.remove('selected');
      selectedEmoji = null;
      selectedWord = null;
      startConfetti();
      playSound('correct');
      setTimeout(() => {
        const messageDiv = document.getElementById('messages');
        messageDiv.innerHTML = `<img src="https://raw.githubusercontent.com/chatterbox-house/NandoMode/main/assets/images/cat_sprite.png" alt="Correct"> Correct!`;
        setTimeout(() => { messageDiv.innerHTML = ''; }, 1000);
      }, 300);
      if (score === pairs.length) {
        setTimeout(showEndScreen, 1000);
      }
    } else {
      selectedEmoji.classList.add('incorrect');
      selectedWord.classList.add('incorrect');
      playSound(null);
      setTimeout(() => {
        const messageDiv = document.getElementById('messages');
        messageDiv.innerHTML = `<img src="https://raw.githubusercontent.com/chatterbox-house/NandoMode/main/assets/images/sad_sprite.png" alt="Incorrect"> Try again!`;
        selectedEmoji.classList.remove('selected', 'incorrect');
        selectedWord.classList.remove('selected', 'incorrect');
        selectedEmoji = null;
        selectedWord = null;
        setTimeout(() => { messageDiv.innerHTML = ''; }, 1000);
      }, 300);
    }
  }
}

function showEndScreen() {
  document.getElementById('container').style.display = 'none';
  document.getElementById('score').style.display = 'none';
  document.getElementById('progressBar').style.display = 'none';
  document.getElementById('endScreen').style.display = 'block';
  startConfetti();
  updateLeaderboard(score);
}

document.getElementById('themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
});

window.addEventListener('load', () => {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
  }
});
