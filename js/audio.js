let isSpeaking = false;
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let musicOscillator = null;

function speakText(text, callback) {
  speechSynthesis.cancel();
  isSpeaking = true;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';
  utterance.volume = 1;
  utterance.rate = 0.9;
  utterance.onend = () => {
    isSpeaking = false;
    if (callback) callback();
  };
  try {
    speechSynthesis.speak(utterance);
  } catch (e) {
    isSpeaking = false;
  }
}

function playSound(type) {
  try {
    isSpeaking = true;
    const oscillator = audioContext.createOscillator();
    oscillator.type = type === 'correct' ? 'sine' : 'square';
    oscillator.frequency.setValueAtTime(type === 'correct' ? 880 : 220, audioContext.currentTime);
    oscillator.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
    setTimeout(() => { isSpeaking = false; }, 300);
  } catch (e) {
    isSpeaking = false;
  }
}

function toggleMusic() {
  try {
    if (musicOscillator) {
      musicOscillator.stop();
      musicOscillator = null;
      localStorage.setItem('music', 'off');
      document.getElementById('musicToggle').classList.add('off');
    } else {
      musicOscillator = audioContext.createOscillator();
      musicOscillator.type = 'triangle';
      musicOscillator.frequency.setValueAtTime(110, audioContext.currentTime);
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      musicOscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      musicOscillator.start();
      localStorage.setItem('music', 'on');
      document.getElementById('musicToggle').classList.remove('off');
    }
  } catch (e) {
    console.error('Music toggle error:', e);
  }
}

window.addEventListener('load', () => {
  document.getElementById('musicToggle').classList.add('off');
  document.getElementById('musicToggle').addEventListener('click', () => {
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(toggleMusic);
    } else {
      toggleMusic();
    }
  });
});

export { speakText, playSound, toggleMusic, isSpeaking };
