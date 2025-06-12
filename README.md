# NandoMode

A Spanish vocabulary trainer inspired by Fernando, a tall, blonde-haired, blue-eyed Spanish teacher, with a retro Japanese pixel art style and a nod to "nandomo" (何度も, meaning "many times" in Japanese). Kids match emojis to Spanish words, with fun 8-bit graphics, chiptune sounds, and a festive end screen to keep learning engaging!

## About
- **Goal**: Help kids learn Spanish words by matching emojis (e.g., 🍎) to words (e.g., "Manzana").
- **Features**:
  - Pixelated Japanese-style graphics (sprites, avatars, victory banner).
  - Golden boxes for correct matches, locked but playable for pronunciation.
  - Audio lock to prevent clicks during text-to-speech or sounds.
  - Festive end screen with "¡Bien Hecho!", leaderboard, and play/finish options.
  - Toggleable chiptune background music.
- **Tech**: HTML, CSS, JavaScript, Web Audio API, and base64 assets.

## File Structure
To keep the project organized, we'll use multiple files:
## File Structure
To keep the project organized, we'll use multiple files:
- `index.html`: Main page with the game layout (login, game area, end screen).
- `css/styles.css`: Styles for pixel art, golden matched boxes, and dark/light mode.
- `js/main.js`: Game logic for matching emojis to words, login, and end screen.
- `js/audio.js`: Handles text-to-speech, chiptune sounds, and music toggle.
- `js/leaderboard.js`: Manages user scores and leaderboard display.
- `js/confetti.js`: Confetti animation for correct matches and end screen.
- `assets/images/`:
  - `cat_sprite.png`: 8-bit cat sprite for correct matches.
  - `sad_sprite.png`: 8-bit sad face sprite for incorrect matches.
  - `banner.png`: Victory banner for the end screen.
  - `avatar_tony.png`: Pixel avatar for user Tony.
  - `avatar_mina.png`: Pixel avatar for user Mina.
  - `avatar_sorato.png`: Pixel avatar for user Sorato.
  - `avatar_kaito.png`: Pixel avatar for user Kaito.
  - `avatar_maria.png`: Pixel avatar for user Maria.
- `assets/audio/`: Optional sound files (if not using Web Audio API).
- `README.md`: This project description file.
## Next Steps
- Add `index.html` to set up the game’s basic structure.
- Create folders (`css`, `js`, `assets`) and initial files.
- Develop game features step-by-step.

## Setup
1. Clone the repository: `git clone https://github.com/chatterbox-house/NandoMode.git`
2. Open `index.html` in a browser to play (coming soon!).
