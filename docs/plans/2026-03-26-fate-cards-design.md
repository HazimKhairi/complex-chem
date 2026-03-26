# Fate Card Mechanics Implementation Design

**Date:** 2026-03-26
**Author:** HakasAI
**Status:** Approved

## Overview

This document outlines the implementation design for all fate card mechanics in the COOR-CHEM game. Currently, only points-based fate cards (point-booster, minus) are implemented. This design adds support for 5 interactive fate effects: swap-card, eureka-moment, ligand-square, second-chance, and destiny-dance.

## Requirements Summary

Based on user clarifications, the fate card mechanics should behave as follows:

1. **swap-card**: Swap ligand cards only (not other card types). Allow one-way donation if only one player has ligands.
2. **eureka-moment**: Grant a random ligand from the GLOBAL uncollected pool (ligands not collected by ANY player yet).
3. **ligand-square**: Move forward 3 spaces, but don't exceed position 57 (finish line).
4. **second-chance**: Immediate extra roll after closing the fate modal (dice unlocks, player rolls again).
5. **destiny-dance**: Always move backward - roll dice and move that many steps backward.

---

## 🏗️ Architecture

### System Integration

The `FateEffectHandler` will integrate into the existing game architecture:

```
Game Flow:
1. Player lands on fate tile
2. GameOrchestrator detects "fate" type
3. GameMechanics.showFate() displays random fate card in modal
4. User clicks "Accept Fate" button
5. fate-modal.astro calls FateEffectHandler.applyEffect() ← NEW
6. FateEffectHandler executes the appropriate effect
7. Modal closes, game continues
```

### File Structure

**New Files:**
- `public/scripts/fate-effect-handler.js` - Main handler class
- `src/components/game/swap-ligand-modal.astro` - Interactive player/ligand selection modal

**Modified Files:**
- `src/components/game/fate-modal.astro` - Call FateEffectHandler instead of just applying points
- `public/scripts/game-mechanics-cards.js` - Add helper method to get global uncollected ligands

### Handler Class Structure

```javascript
window.FateEffectHandler = {
  applyEffect(playerId, fateEffect, fateValue) {
    switch(fateEffect) {
      case 'point-booster': // Already working (handled in fate-modal.astro)
      case 'minus':         // Already working (handled in fate-modal.astro)
      case 'swap-card': this.applySwapCard(playerId); break;
      case 'ligand-gain': this.applyEurekaMoment(playerId); break;
      case 'move-forward': this.applyLigandSquare(playerId, fateValue); break;
      case 'extra-turn': this.applySecondChance(playerId); break;
      case 'destiny-dance': this.applyDestinyDance(playerId); break;
    }
  },

  // 5 new effect methods (one per fate type)
  applySwapCard(playerId) { ... },
  applyEurekaMoment(playerId) { ... },
  applyLigandSquare(playerId, spaces) { ... },
  applySecondChance(playerId) { ... },
  applyDestinyDance(playerId) { ... }
}
```

**Design Rationale:** This approach follows the existing pattern used by `GameMechanics`, `TileDetector`, `TurnManager`, and other game systems. It keeps fate effect logic separate and testable.

---

## 🧩 Components (Effect Methods)

### 1️⃣ applySwapCard(playerId) - Most Complex

**Behavior:**
1. Check if current player has ligands
   - If no ligands → show message "You have no ligands to swap" → close modal
2. Show swap-ligand-modal with:
   - List of other players (2-3 buttons)
   - Each button shows player name + ligand count
3. When player selected → show their ligands + current player's ligands
4. If target has no ligands → one-way donation (current player gives one ligand)
5. If both have ligands → both select, then swap
6. Update gameState.playerLigands for both players
7. Update ligand displays for both players
8. Save to sessionStorage

**UI Components:**
- New modal: `swap-ligand-modal.astro` (player selector → ligand selector)
- Reuse existing ligand card HTML structure from ligand-modal

**Data Modified:**
- `gameState.playerLigands[playerId]`
- `gameState.playerLigands[targetPlayerId]`

---

### 2️⃣ applyEurekaMoment(playerId) - Simple

**Behavior:**
1. Get `gameState.collectedLigandIds` (ALL collected ligands globally)
2. Filter `LIGANDS_DATA` to find ligands NOT in collectedLigandIds
3. Pick random ligand from uncollected pool
4. Add to `gameState.playerLigands[playerId]`
5. Add to `gameState.collectedLigandIds`
6. Show notification: "🎉 Discovered new ligand: [name]"
7. Update ligand display
8. Save to sessionStorage

**Edge Case:** If all 13 ligands collected globally → show "No new ligands to discover"

**Data Modified:**
- `gameState.playerLigands[playerId]`
- `gameState.collectedLigandIds`

---

### 3️⃣ applyLigandSquare(playerId, spaces=3) - Medium Complexity

**Behavior:**
1. Get current piece position from `lastPos${COLOR}H1` variable
2. Calculate new position: `newPos = Math.min(currentPos + spaces, 57)`
3. Move piece visually (find piece element, move to new cell)
4. Update `lastPos${COLOR}H1` variable
5. Check if landed on special tile (ligand/question/fate) → trigger orchestrator
6. Show notification: "⬆️ Moved forward 3 spaces!"

**Uses Existing:** Auto-movement logic from `auto-move-piece.js` pattern

**Data Modified:**
- `window.lastPos${COLOR}H1` (position variable)

---

### 4️⃣ applySecondChance(playerId) - Simple

**Behavior:**
1. Unlock dice: `window.d = 0`
2. Show notification: "🎲 You get an extra roll!"
3. Keep current player: don't advance `window.x`
4. Update turn indicator to show "Roll Again!"

**Note:** Player immediately rolls again after closing fate modal

**Data Modified:**
- `window.d` (dice lock)

---

### 5️⃣ applyDestinyDance(playerId) - Medium Complexity

**Behavior:**
1. Auto-roll dice (random 1-6)
2. Show dice animation with result
3. Get current position from `lastPos${COLOR}H1`
4. Calculate backward position: `newPos = Math.max(currentPos - diceValue, 0)`
5. If `newPos === 0` → move piece back to home area
6. Otherwise → move piece backward on path
7. Update `lastPos${COLOR}H1` variable
8. Show notification: "⬇️ Moved backward [X] spaces!"

**Uses Existing:** Dice animation + movement logic (reversed direction)

**Data Modified:**
- `window.lastPos${COLOR}H1` (position variable)

---

## 🔄 Data Flow

### Overall Flow Diagram

```
┌─────────────────────────────────────────────────┐
│ 1. Player lands on fate tile                   │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 2. GameMechanics.showFate(playerId)            │
│    - Pick random fate card                      │
│    - Display in fate-modal                      │
│    - Set data attributes (effect, value)        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 3. User clicks "Accept Fate" button            │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 4. fate-modal.astro script reads:              │
│    - playerId, fateEffect, fateValue            │
│    - Calls FateEffectHandler.applyEffect()      │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 5. FateEffectHandler routes to correct method: │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ swap-card → applySwapCard()              │  │
│  │   ↓ Shows swap-ligand-modal              │  │
│  │   ↓ Waits for selections                 │  │
│  │   ↓ Updates gameState.playerLigands      │  │
│  │   ↓ Dispatches 'swap-complete' event     │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ ligand-gain → applyEurekaMoment()        │  │
│  │   ↓ Gets global uncollected ligands      │  │
│  │   ↓ Picks random                          │  │
│  │   ↓ Updates gameState                     │  │
│  │   ↓ Returns immediately                   │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ move-forward → applyLigandSquare()       │  │
│  │   ↓ Calculates new position              │  │
│  │   ↓ Moves piece (DOM + lastPos var)      │  │
│  │   ↓ Checks for special tile              │  │
│  │   ↓ Returns immediately                   │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ extra-turn → applySecondChance()         │  │
│  │   ↓ Unlocks dice (d = 0)                 │  │
│  │   ↓ Updates turn indicator               │  │
│  │   ↓ Returns immediately                   │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ destiny-dance → applyDestinyDance()      │  │
│  │   ↓ Auto-rolls dice                       │  │
│  │   ↓ Moves piece backward                  │  │
│  │   ↓ Updates position                      │  │
│  │   ↓ Returns immediately                   │  │
│  └──────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 6. Close fate modal (or swap modal)            │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 7. Dispatch 'fate-continue' event              │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 8. GameOrchestrator continues game flow        │
│    - Check win condition                        │
│    - Turn advances (unless extra-turn)          │
└─────────────────────────────────────────────────┘
```

### State Updates

**gameState.playerLigands:**
- Modified by: swap-card, eureka-moment
- Format: `{ 1: [...], 2: [...], 3: [...], 4: [...] }`
- Persisted to: sessionStorage

**gameState.collectedLigandIds:**
- Modified by: eureka-moment
- Format: `["ligand-1", "ligand-5", ...]`
- Used to: Track globally collected ligands (across all players)

**Position Variables:**
- Modified by: ligand-square, destiny-dance
- Variables: `lastPosBH1`, `lastPosRH1`, `lastPosYH1`, `lastPosGH1`
- Format: Integer 0-57 (0 = home, 1-57 = path positions)

**Dice Lock:**
- Modified by: second-chance
- Variable: `window.d`
- Values: 0 (unlocked), 1 (locked)

---

## ⚠️ Error Handling

### Edge Cases & Safeguards

**1. Swap Card:**
- ❌ Current player has no ligands → Show message "You have no ligands to swap", close modal, continue game
- ❌ No other players have ligands → Show message "No players have ligands to swap with", close modal
- ✅ Only target has ligands → One-way donation flow (target gives to current player)
- ✅ Both have ligands → Normal swap flow

**2. Eureka Moment:**
- ❌ All 13 ligands collected globally → Show message "All ligands have been discovered!", close modal
- ✅ Ligands available → Pick random from global uncollected pool

**3. Ligand Square (Move Forward 3):**
- ❌ Already at position 57 → Show message "Already at finish line!", skip movement
- ✅ Would exceed 57 → Move to exactly position 57
- ✅ Normal movement → Move exactly 3 spaces

**4. Second Chance:**
- ✅ Always works → Unlock dice, player rolls again
- 🔒 No dice lock check needed (fate only triggers after valid move)

**5. Destiny Dance (Move Backward):**
- ❌ Piece in home (position 0) → Show message "Can't move backward from home!", skip effect
- ✅ Would go below position 1 → Move piece back to home area (position 0)
- ✅ Normal backward movement → Move backward by dice value

### Console Logging

Each effect will log:
- ✅ Start: `🔺 [FATE] Applying ${effectName} for Player ${playerId}`
- ✅ Actions: Detailed steps during execution
- ✅ Result: `✅ [FATE] ${effectName} complete`
- ❌ Errors: `❌ [FATE] ${effectName} failed: ${reason}`

### Fallback Behavior

If `FateEffectHandler` fails to load:
- fate-modal.astro falls back to current behavior (only apply points)
- Console warning: `⚠️ FateEffectHandler not available, only points-based effects will work`

---

## ✅ Testing Strategy

### Manual Testing Checklist

**For each fate effect:**

#### 1. Swap Card ✓
- [ ] Player 1 has 2 ligands, Player 2 has 3 ligands → normal swap works
- [ ] Player 1 has 0 ligands → shows "no ligands" message, skips effect
- [ ] Player 1 has ligands, all other players have 0 → shows "no one to swap with" message
- [ ] Player 1 has 2 ligands, Player 2 has 0 ligands → one-way donation works
- [ ] After swap, both players' ligand displays update correctly
- [ ] sessionStorage persists the swapped ligands

#### 2. Eureka Moment ✓
- [ ] 5 ligands collected globally → player receives 1 of remaining 8 ligands
- [ ] All 13 ligands collected → shows "all discovered" message
- [ ] Received ligand appears in player's collection
- [ ] collectedLigandIds updates with new ligand
- [ ] Notification shows correct ligand name

#### 3. Ligand Square ✓
- [ ] Player at position 10 → moves to position 13
- [ ] Player at position 56 → moves to position 57 (doesn't exceed)
- [ ] Player at position 57 → shows "already at finish" message
- [ ] Piece visually moves on board
- [ ] lastPos variable updates correctly
- [ ] If lands on special tile → triggers appropriate modal

#### 4. Second Chance ✓
- [ ] After fate modal closes, dice is unlocked (d = 0)
- [ ] Turn indicator shows "Roll Again!"
- [ ] Current player stays the same (x doesn't change)
- [ ] Player can immediately roll dice again

#### 5. Destiny Dance ✓
- [ ] Rolls dice (1-6), shows dice animation
- [ ] Player at position 10, rolls 3 → moves to position 7
- [ ] Player at position 2, rolls 5 → moves back to home (position 0)
- [ ] Player at position 0 (home) → shows "can't move backward" message
- [ ] Piece visually moves backward on board
- [ ] Notification shows correct backward distance

### Debug Console Commands

```javascript
// Test individual effects
window.FateEffectHandler.applySwapCard(1);
window.FateEffectHandler.applyEurekaMoment(2);
window.FateEffectHandler.applyLigandSquare(3, 3);
window.FateEffectHandler.applySecondChance(1);
window.FateEffectHandler.applyDestinyDance(4);

// Simulate fate card trigger
window.GameMechanics.showFate(1); // Random fate for Player 1

// Check game state
console.log(gameState.playerLigands);
console.log(gameState.collectedLigandIds);
console.log(window.lastPosBH1); // Blue player position
```

### Integration Testing

Test complete flow:
1. Player lands on fate tile → orchestrator triggers
2. Fate modal shows → user sees random fate card
3. Click "Accept Fate" → effect executes
4. Modal closes → game continues
5. Turn advances (or player rolls again if second-chance)

---

## 📋 Implementation Tasks

The implementation will be broken down into parallel tasks:

1. **FateEffectHandler Core** - Create base handler class with routing logic
2. **Swap Card Effect** - Implement swap-ligand-modal + swap logic
3. **Eureka Moment Effect** - Implement global uncollected ligand selection
4. **Ligand Square Effect** - Implement forward movement with boundary checks
5. **Second Chance Effect** - Implement dice unlock + turn indicator update
6. **Destiny Dance Effect** - Implement backward movement + dice roll
7. **Integration** - Wire all effects into fate-modal.astro
8. **Testing** - Manual testing of all effects + edge cases

---

## 🎯 Success Criteria

Implementation is complete when:

1. ✅ All 5 fate effects execute correctly (swap-card, eureka-moment, ligand-square, second-chance, destiny-dance)
2. ✅ Edge cases handled gracefully (no ligands, at finish line, etc.)
3. ✅ Game state persists correctly (sessionStorage)
4. ✅ Visual feedback clear (notifications, animations)
5. ✅ Turn flow continues properly after each effect
6. ✅ No console errors during fate card execution
7. ✅ All manual testing checklist items pass

---

## 📚 References

- **Existing Code:**
  - `src/components/game/fate-modal.astro` - Current fate modal
  - `public/scripts/game-mechanics-cards.js` - FATE_CARDS_DATA array
  - `public/scripts/game-orchestrator.js` - Event coordination
  - `public/scripts/auto-move-piece.js` - Movement pattern reference

- **Memory Documentation:**
  - `/Users/hakas/.claude/projects/.../memory/hakasai.md` - Complete game architecture
  - `/Users/hakas/.claude/projects/.../memory/game-rules.md` - Game rules & mechanics

---

**Next Step:** Invoke `writing-plans` skill to create detailed implementation plan for parallel execution.
