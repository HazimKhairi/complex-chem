# Game Settings Menu Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a floating settings menu with volume control, mute, navigation, fullscreen, and joyride walkthrough to both game-board and level-2 pages.

**Architecture:** Three new scripts (audio-manager, joyride, game-settings-menu component). AudioManager centralizes all sound playback via localStorage-persisted volume/mute. Joyride is a vanilla JS tooltip stepper. Settings menu is an Astro component with a gear button and slide-in panel. All existing inline `new Audio()` calls get replaced with `AudioManager.play()`.

**Tech Stack:** Vanilla JS, Astro components, CSS transitions, localStorage

---

### Task 1: AudioManager — centralized audio controller

**Files:**
- Create: `public/scripts/audio-manager.js`

**Step 1: Create AudioManager script**

```javascript
/**
 * Centralized Audio Manager
 * Replaces all inline new Audio() calls with volume/mute support
 */
window.AudioManager = (function () {
  'use strict';

  var sounds = {
    'game-start': '/audio/game-start.wav',
    'dice-roll': '/audio/dice-roll.wav',
    'horse-move': '/audio/horse-move.wav',
    'horse-kill': '/audio/horse-kill.wav',
    'horse-safe': '/audio/horse-safe.wav',
    'horse-home': '/audio/horse-home.wav',
  };

  var cache = {};
  var volume = parseFloat(localStorage.getItem('game-volume') || '1');
  var muted = localStorage.getItem('game-muted') === 'true';

  // Preload all sounds
  Object.keys(sounds).forEach(function (name) {
    var audio = new Audio(sounds[name]);
    audio.preload = 'auto';
    cache[name] = audio;
  });

  function play(name) {
    if (muted) return;
    var src = sounds[name];
    if (!src) return;
    // Create fresh instance each time (allows overlapping plays)
    var audio = new Audio(src);
    audio.volume = volume;
    audio.play().catch(function () {});
  }

  function getVolume() {
    return volume;
  }

  function setVolume(val) {
    volume = Math.max(0, Math.min(1, val));
    localStorage.setItem('game-volume', volume.toString());
  }

  function isMuted() {
    return muted;
  }

  function setMuted(val) {
    muted = !!val;
    localStorage.setItem('game-muted', muted.toString());
  }

  function toggleMute() {
    setMuted(!muted);
    return muted;
  }

  return {
    play: play,
    getVolume: getVolume,
    setVolume: setVolume,
    isMuted: isMuted,
    setMuted: setMuted,
    toggleMute: toggleMute,
  };
})();
```

**Step 2: Commit**

```bash
git add public/scripts/audio-manager.js
git commit -m "feat: add centralized AudioManager with volume and mute"
```

---

### Task 2: Replace inline Audio calls in game scripts

**Files:**
- Modify: `public/scripts/one-vs-one.js`
- Modify: `public/scripts/one-vs-two.js`
- Modify: `public/scripts/one-vs-three.js`
- Modify: `public/scripts/win-checker.js`
- Modify: `src/components/game-board/game-start-countdown.astro`

**Step 1: In each one-vs-*.js file, replace all `audio = new Audio("audio/X.wav"); audio.play();` with `AudioManager.play("X")`**

Replacements (same in all three game scripts):
- `audio = new Audio("audio/dice-roll.wav"); audio.play();` → `if (window.AudioManager) window.AudioManager.play("dice-roll");`
- `audio = new Audio("audio/horse-move.wav"); audio.play();` → `if (window.AudioManager) window.AudioManager.play("horse-move");`
- `audio = new Audio("audio/horse-kill.wav"); audio.play();` → `if (window.AudioManager) window.AudioManager.play("horse-kill");`
- `audio = new Audio("audio/horse-safe.wav"); audio.play();` → `if (window.AudioManager) window.AudioManager.play("horse-safe");`
- `audio = new Audio("audio/horse-home.wav"); audio.play();` → `if (window.AudioManager) window.AudioManager.play("horse-home");`

**Step 2: In game-start-countdown.astro, replace lines 37-44:**

```javascript
// Replace:
try {
  const audio = new Audio("audio/game-start.wav");
  audio.play().catch(err => {
    console.log("Audio autoplay prevented (requires user interaction):", err.message);
  });
} catch (err) {
  console.log("Audio playback error:", err);
}

// With:
if (window.AudioManager) window.AudioManager.play("game-start");
```

**Step 3: In win-checker.js, replace lines 259-262:**

```javascript
// Replace:
const celebrationSound = new Audio('audio/winner.wav');
celebrationSound.play().catch(err => console.log('Could not play celebration sound:', err));

// With:
if (window.AudioManager) window.AudioManager.play("horse-home");
```

**Step 4: Commit**

```bash
git add public/scripts/one-vs-one.js public/scripts/one-vs-two.js public/scripts/one-vs-three.js public/scripts/win-checker.js src/components/game-board/game-start-countdown.astro
git commit -m "refactor: replace inline Audio calls with AudioManager"
```

---

### Task 3: Game Settings Menu component

**Files:**
- Create: `src/components/game-settings-menu.astro`

**Step 1: Create the settings menu Astro component**

The component contains:
- A fixed-position gear button (top-right, 40px circle)
- A slide-in overlay panel with: volume slider, mute toggle, back to menu, restart, how to play, fullscreen
- No emoji icons, no gradients — plain text labels with Lucide SVG icons inline
- Gear icon: inline SVG (Lucide settings cog)
- Close button: inline SVG (Lucide X)
- All buttons: solid bg colors, border, clean text

Panel structure:
```html
<button id="settings-btn"> <!-- gear icon, fixed top-right -->
<div id="settings-overlay"> <!-- backdrop -->
<div id="settings-panel"> <!-- slide-in panel -->
  <header> Settings <button close> </header>
  <div> Volume: <input type="range"> <span>100%</span> </div>
  <div> <button mute/unmute> </div>
  <hr>
  <button> How to Play </button>
  <button> Fullscreen </button>
  <hr>
  <button> Restart Game </button>
  <button> Back to Menu </button>
</div>
```

Script block handles:
- Open/close panel
- Volume slider → `AudioManager.setVolume(val / 100)`
- Mute toggle → `AudioManager.toggleMute()`
- Restart → `confirm()` then `sessionStorage` clear + `location.reload()`
- Back to Menu → `confirm()` then `location.href = '/'`
- Fullscreen → `document.documentElement.requestFullscreen()` / `document.exitFullscreen()`
- How to Play → `window.Joyride?.start()`
- Init volume slider from `AudioManager.getVolume()` on open

**Step 2: Commit**

```bash
git add src/components/game-settings-menu.astro
git commit -m "feat: add game settings menu component"
```

---

### Task 4: Integrate AudioManager and Settings Menu into pages

**Files:**
- Modify: `src/pages/game-board.astro`
- Modify: `src/pages/level-2.astro`
- Modify: `src/components/game-audio.astro` (delete or gut — no longer needed)

**Step 1: In game-board.astro**

- Add `import GameSettingsMenu from "../components/game-settings-menu.astro"` in frontmatter
- Add `<GameSettingsMenu />` after `<main>` opening tag
- Add `<script is:inline src="/scripts/audio-manager.js"></script>` BEFORE the dynamic script loading block (so AudioManager is available when game scripts load)
- Remove `<GameAudio />` import and usage (the hidden audio preloader is now replaced by AudioManager)

**Step 2: In level-2.astro**

- Add `import GameSettingsMenu from "../components/game-settings-menu.astro"` in frontmatter
- Add `<GameSettingsMenu />` inside the layout
- Add `<script is:inline src="/scripts/audio-manager.js"></script>` before other scripts

**Step 3: Commit**

```bash
git add src/pages/game-board.astro src/pages/level-2.astro src/components/game-audio.astro
git commit -m "feat: integrate settings menu and audio manager into game pages"
```

---

### Task 5: Joyride walkthrough engine

**Files:**
- Create: `public/scripts/joyride.js`

**Step 1: Create the joyride script**

The joyride engine:
- `window.Joyride` global object
- `Joyride.start(steps)` — starts the walkthrough with an array of step objects
- Each step: `{ target: "#selector", title: "...", text: "...", position: "top|bottom|left|right" }`
- Renders a highlight mask (full-screen dark overlay with a transparent cutout around the target)
- Renders a tooltip with arrow pointing at target, containing title, text, step counter, and Back/Next/Skip buttons
- Recalculates position on window resize
- On complete or skip, sets localStorage flag
- `Joyride.startLevel1()` — predefined Level 1 steps
- `Joyride.startLevel2()` — predefined Level 2 steps
- CSS injected via `<style>` element on first use, no external CSS file

Level 1 steps:
1. Target: `#player-${currentPlayer}-dice` — "Roll the Dice" / "Click or press Space to roll"
2. Target: `.path` — "Game Board" / "Your piece moves along this path collecting ligands"
3. Target: `#player-1` — "Player Card" / "Shows your name and score"
4. Target: `#ligand-display-1` — "Ligand Collection" / "Collected ligands appear here"
5. Target: `.bg-red-300` (first one) — "Special Tiles" / "Land on colored tiles for questions, fate cards, or ligands"
6. Target: `.r57` — "Home" / "Get your piece here to complete Level 1"

Level 2 steps:
1. Target: `#step-container` — "Choose Metal" / "Select a central metal ion for your complex"
2. Target: `.step-dot:nth-child(2)` — "Geometry" / "Pick the correct geometry based on your ligands"
3. Target: `#builder-container` — "3D Builder" / "Drag ligands onto the 3D model"
4. Target: `.step-dot:nth-child(4)` — "IUPAC Naming" / "Name your complex correctly"
5. Target: `#l2-score` — "Score" / "Points for each step shown here"

**Step 2: Commit**

```bash
git add public/scripts/joyride.js
git commit -m "feat: add joyride walkthrough engine with L1 and L2 steps"
```

---

### Task 6: Integrate Joyride into pages

**Files:**
- Modify: `src/pages/game-board.astro`
- Modify: `src/pages/level-2.astro`

**Step 1: In game-board.astro**

- Add `<script is:inline src="/scripts/joyride.js"></script>` after other script loads
- Add inline script that auto-starts joyride on first visit:

```javascript
document.addEventListener('game-countdown-complete', function () {
  if (!localStorage.getItem('joyride-l1-done')) {
    setTimeout(function () {
      if (window.Joyride) window.Joyride.startLevel1();
    }, 1000);
  }
});
```

**Step 2: In level-2.astro**

- Add `<script is:inline src="/scripts/joyride.js"></script>` after other scripts
- Add inline script:

```javascript
if (!localStorage.getItem('joyride-l2-done')) {
  setTimeout(function () {
    if (window.Joyride) window.Joyride.startLevel2();
  }, 500);
}
```

**Step 3: Commit**

```bash
git add src/pages/game-board.astro src/pages/level-2.astro
git commit -m "feat: integrate joyride auto-start into game pages"
```

---

### Task 7: Tests for AudioManager and Joyride

**Files:**
- Create: `tests/audio-manager.test.js`
- Create: `tests/joyride.test.js`

**Step 1: Write AudioManager tests**

Test cases:
- `getVolume()` returns default 1.0
- `setVolume(0.5)` persists to localStorage
- `setVolume(-1)` clamps to 0
- `setVolume(2)` clamps to 1
- `isMuted()` returns false by default
- `toggleMute()` flips mute state
- `setMuted(true)` persists to localStorage
- `play()` does not throw when muted
- `play()` does not throw for unknown sound name

**Step 2: Write Joyride tests**

Test cases:
- `Joyride` is exposed on window
- `startLevel1()` and `startLevel2()` methods exist
- `start([])` with empty steps does not throw
- Joyride injects overlay into DOM when started
- Joyride removes overlay from DOM on skip/complete
- Joyride sets localStorage flag on complete

**Step 3: Run tests**

```bash
npm test
```

**Step 4: Commit**

```bash
git add tests/audio-manager.test.js tests/joyride.test.js
git commit -m "test: add AudioManager and Joyride tests"
```

---

### Task 8: Final integration test and push

**Step 1: Run full test suite**

```bash
npm test
```

**Step 2: Push all changes**

```bash
git push
```
