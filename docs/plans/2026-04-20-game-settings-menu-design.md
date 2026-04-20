# Game Settings Menu — Design

**Date**: 2026-04-20
**Status**: Approved

## Overview

Add a floating settings menu to the game board and level 2 pages with volume control, mute, navigation, fullscreen, and an interactive joyride walkthrough for both levels.

## Floating Button

- Lucide `Settings` gear icon, top-right corner of game board
- Fixed position, high z-index, always visible over gameplay
- 40px circle, semi-transparent background
- Present on both game-board.astro and level-2.astro

## Menu Overlay

Slide-in panel from right or center modal, containing:

| Feature | Details |
|---|---|
| Master Volume | Single range slider (0-100%), persisted to localStorage |
| Mute Toggle | On/off button, mutes all sound instantly |
| Back to Menu | Confirm dialog ("Leave game?"), then redirect to `/` |
| Restart Game | Confirm dialog, clear sessionStorage game state, reload page |
| How to Play | Trigger joyride walkthrough for current level |
| Fullscreen | Toggle requestFullscreen / exitFullscreen |

## Audio Manager

- Centralized `AudioManager` class replaces all inline `new Audio()` calls
- All sounds go through `AudioManager.play(soundName)`
- Volume and mute state read from localStorage, persist across sessions
- Preload all sound files on init
- Sounds: dice-roll, horse-move, horse-kill, horse-safe, horse-home, game-start

## Joyride Walkthrough

### Trigger
- Auto-start on first visit (localStorage flags: `joyride-l1-done`, `joyride-l2-done`)
- Replayable via "How to Play" button in settings menu

### Level 1 Steps
1. Dice — "Roll the dice to move your piece"
2. Board path — "Your piece moves along this path"
3. Player card — "This is your player info and score"
4. Ligand box — "Collected ligands appear here"
5. Special tiles — "Land on colored tiles for questions, ligands, or fate cards"
6. Win condition — "Get your piece to the center home to win"

### Level 2 Steps
1. Metal picker — "Choose a central metal ion"
2. Geometry step — "Select the correct geometry for your complex"
3. 3D builder — "Drag ligands onto the 3D model"
4. Naming step — "Pick the correct IUPAC name"
5. Score bar — "Your scores for each step appear here"

### Implementation
- Pure vanilla JS, no library dependency
- Custom tooltip with arrow pointing at target element
- "Next" / "Skip" / "Back" navigation buttons
- Highlight mask dims everything except current target
- Responsive positioning (recalculates on resize)

## Files Affected

- `src/components/game-settings-menu.astro` — new component
- `public/scripts/audio-manager.js` — new centralized audio
- `public/scripts/joyride.js` — new walkthrough engine
- `public/scripts/one-vs-one.js` — replace inline Audio calls
- `public/scripts/one-vs-two.js` — replace inline Audio calls
- `public/scripts/one-vs-three.js` — replace inline Audio calls
- `public/scripts/win-checker.js` — replace inline Audio calls
- `src/components/game-board/game-start-countdown.astro` — replace inline Audio
- `src/pages/game-board.astro` — add settings menu component + joyride script
- `src/pages/level-2.astro` — add settings menu component + joyride script

## No New Pages

Everything is inline — menu is a component, joyride is a script, audio manager is a script.
