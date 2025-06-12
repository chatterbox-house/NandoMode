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
NandoMode/
├── index.html           # Main page with game layout
├── css/
│   └── styles.css      # Styles for pixel art, golden boxes, dark mode
├── js/
│   ├── main.js         # Game logic (matching, login, end screen)
│   ├── audio.js        # Text-to-speech, chiptune, music toggle
│   ├── leaderboard.js  # User scores and leaderboard display
│   └── confetti.js     # Confetti animation for correct matches
├── assets/
│   ├── images/         # Pixel art (sprites, avatars, banner)
│   │   ├── cat_sprite.png    # 8-bit cat for correct matches
│   │   ├── sad_sprite.png    # 8-bit sad face for incorrect matches
│   │   ├── banner.png        # Victory banner for end screen
│   │   ├── avatar_tony.png   # Pixel avatar for Tony
│   │   ├── avatar_mina.png   # Pixel avatar for Mina
│   │   ├── avatar_sorato.png # Pixel avatar for Sorato
│   │   ├── avatar_kaito.png  # Pixel avatar for Kaito
│   │   └── avatar_maria.png  # Pixel avatar for Maria
│   └── audio/          # Optional sound files (if not using Web Audio API)
└── README.md           # This file
## Next Steps
- Add `index.html` to set up the game’s basic structure.
- Create folders (`css`, `js`, `assets`) and initial files.
- Develop game features step-by-step.

## Setup
1. Clone the repository: `git clone https://github.com/chatterbox-house/NandoMode.git`
2. Open `index.html` in a browser to play (coming soon!).
