# Fate Card Smoke Tests - Manual Testing Checklist

**Purpose:** Verify all 5 fate card mechanics work correctly in browser
**Date:** 2026-03-26
**Tested By:** [Name]
**Browser:** [Browser Name + Version]

---

## Setup

1. Start development server:
   ```bash
   npm run dev
   ```

2. Open browser console (F12)

3. Navigate to game board with at least 2 players active

---

## Test 1: Eureka Moment (Random Ligand)

### Test Steps
1. Open browser console
2. Run: `window.FateEffectHandler.applyEffect(1, 'ligand-gain');`

### Expected Results
- [ ] Console shows: `🎉 [FATE] Eureka Moment - Player 1`
- [ ] Console shows: `Selected ligand: [LIGAND_NAME] ([ID])`
- [ ] Console shows: `✅ [FATE] Eureka Moment complete`
- [ ] Success notification appears: "🎉 Discovered new ligand: [NAME]!"
- [ ] Ligand card appears in Player 1's ligand display area
- [ ] Card has correct image and border color

### Edge Case Test (All Ligands Collected)
1. Manually collect all 13 ligands for all players
2. Run: `window.FateEffectHandler.applyEffect(1, 'ligand-gain');`
3. Expected: "All ligands have been discovered!" notification

### Result: ✅ PASS / ❌ FAIL
**Notes:**

---

## Test 2: Second Chance (Extra Roll)

### Test Steps
1. Make sure it's Player 1's turn
2. Run: `window.FateEffectHandler.applyEffect(1, 'extra-turn');`

### Expected Results
- [ ] Console shows: `🎲 [FATE] Second Chance - Player 1`
- [ ] Console shows: `Dice unlocked (d = 0)`
- [ ] Console shows: `✅ [FATE] Second Chance complete`
- [ ] Turn indicator shows: "🎲 You get an extra roll!"
- [ ] Notification appears: "🎲 You get an extra roll!"
- [ ] Dice becomes clickable (not disabled)
- [ ] Turn does NOT transfer to next player

### Result: ✅ PASS / ❌ FAIL
**Notes:**

---

## Test 3: Ligand Square (Move Forward 3)

### Test Steps
1. Move Player 2 piece to position 10 on the board
2. Run: `window.FateEffectHandler.applyEffect(2, 'move-forward', 3);`

### Expected Results
- [ ] Console shows: `⬆️ [FATE] Ligand Square - Player 2, move 3 spaces`
- [ ] Console shows: `Current position: 10`
- [ ] Console shows: `New position: 13 (moved 3 spaces)`
- [ ] Console shows: `✅ [FATE] Ligand Square complete`
- [ ] Player 2 piece visually moves from position 10 → 13
- [ ] Piece animation plays (if available)
- [ ] Notification appears: "⬆️ Moved forward 3 spaces!"

### Edge Case Test 1 (Near Finish)
1. Move Player 2 to position 56
2. Run: `window.FateEffectHandler.applyEffect(2, 'move-forward', 3);`
3. Expected: Moves to 57 only (max position)

### Edge Case Test 2 (Already at Finish)
1. Move Player 2 to position 57
2. Run: `window.FateEffectHandler.applyEffect(2, 'move-forward', 3);`
3. Expected: "Already at the finish line!" notification

### Result: ✅ PASS / ❌ FAIL
**Notes:**

---

## Test 4: Destiny Dance (Roll & Move Backward)

### Test Steps
1. Move Player 3 piece to position 20 on the board
2. Run: `window.FateEffectHandler.applyEffect(3, 'destiny-dance');`

### Expected Results
- [ ] Console shows: `⬇️ [FATE] Destiny Dance - Player 3`
- [ ] Console shows: `Current position: 20`
- [ ] Console shows: `Rolled: [1-6]`
- [ ] Dice image updates to show rolled number
- [ ] Dice animation plays (if available)
- [ ] Console shows: `New position: [20 - roll] (moved backward [roll] spaces)`
- [ ] Player 3 piece visually moves backward
- [ ] Notification appears: "⬇️ Moved backward [X] spaces! (rolled [Y])"
- [ ] Console shows: `✅ [FATE] Destiny Dance complete`

### Edge Case Test 1 (Return to Home)
1. Move Player 3 to position 2
2. Run: `window.FateEffectHandler.applyEffect(3, 'destiny-dance');`
3. If roll ≥ 2: Piece should return to home area
4. Expected: "⬇️ Sent back to home!" notification

### Edge Case Test 2 (Already at Home)
1. Keep Player 3 at position 0 (home)
2. Run: `window.FateEffectHandler.applyEffect(3, 'destiny-dance');`
3. Expected: "Can't move backward from home!" notification

### Result: ✅ PASS / ❌ FAIL
**Notes:**

---

## Test 5: Swap Card (Interactive Ligand Swap)

### Setup
- Player 1 has at least 1 ligand
- Player 2 has at least 1 ligand

### Test Steps
1. Run: `window.FateEffectHandler.applyEffect(1, 'swap-card');`

### Expected Results - Step 1 (Player Selection)
- [ ] Console shows: `🔄 [FATE] Swap Card - Player 1`
- [ ] Swap modal appears (visible)
- [ ] Modal shows "🔄 Swap Ligand" title
- [ ] Modal shows instruction: "Choose a player to swap ligands with:"
- [ ] Modal shows player buttons (Player 2, 3, 4) with ligand counts
- [ ] Cancel button is visible
- [ ] Only players with ligands appear in list

### Test Steps - Step 2 (Click Player 2)
1. Click "Player 2 ([N] ligands)" button

### Expected Results - Step 2 (Ligand Selection)
- [ ] Console shows: `🔄 [FATE] Populating swap ligands: Player 1 ↔ Player 2`
- [ ] Modal switches to ligand selection view
- [ ] Shows "Your Ligands:" section with Player 1's ligands
- [ ] Shows "Their Ligands:" section with Player 2's ligands
- [ ] All ligand images display correctly
- [ ] "Confirm Swap" button is disabled (no selection yet)
- [ ] "← Back" button is visible

### Test Steps - Step 3 (Select Ligands)
1. Click one ligand from "Your Ligands"
2. Click one ligand from "Their Ligands"

### Expected Results - Step 3 (Selection)
- [ ] Selected ligands get green border highlight
- [ ] "Confirm Swap" button becomes enabled
- [ ] Can change selection by clicking different ligands

### Test Steps - Step 4 (Confirm Swap)
1. Click "Confirm Swap" button

### Expected Results - Step 4 (Execution)
- [ ] Console shows: `🔄 [FATE] Executing swap:`
- [ ] Console shows: `Swapping: Player 1's [ID] ↔ Player 2's [ID]`
- [ ] Console shows: `✅ [FATE] Swap complete`
- [ ] Modal closes
- [ ] Ligands visually update in both player displays
- [ ] Player 1 now has Player 2's ligand
- [ ] Player 2 now has Player 1's ligand
- [ ] Notification appears: "✅ Swapped ligands with Player 2!"
- [ ] Event dispatched: "swap-complete"

### Edge Case Test 1 (One-Way Donation)
1. Give Player 4 0 ligands, Player 1 has ligands
2. Run: `window.FateEffectHandler.applyEffect(1, 'swap-card');`
3. Select Player 4
4. Expected:
   - Shows "Player 4 has no ligands. Choose one to give:"
   - Only shows Player 1's ligands as selectable
   - "Confirm Swap" enables after selecting 1 ligand only
   - After confirm: "✅ Gave ligand to Player 4!" notification

### Edge Case Test 2 (No Ligands to Swap)
1. Give Player 1 0 ligands
2. Run: `window.FateEffectHandler.applyEffect(1, 'swap-card');`
3. Expected: "You have no ligands to swap!" notification, no modal

### Edge Case Test 3 (No Other Players with Ligands)
1. Give Player 1 ligands, all other players 0 ligands
2. Run: `window.FateEffectHandler.applyEffect(1, 'swap-card');`
3. Expected: "No players have ligands to swap with!" notification

### Edge Case Test 4 (Cancel Swap)
1. Run: `window.FateEffectHandler.applyEffect(1, 'swap-card');`
2. Click "Cancel" button
3. Expected:
   - Modal closes
   - Event dispatched: "swap-cancelled"
   - No ligands swapped

### Edge Case Test 5 (Back Button)
1. Run: `window.FateEffectHandler.applyEffect(1, 'swap-card');`
2. Click a player
3. Click "← Back" button
4. Expected: Returns to player selection screen

### Result: ✅ PASS / ❌ FAIL
**Notes:**

---

## Test 6: sessionStorage Persistence

### Test Steps
1. Trigger any fate effect that modifies ligands (Eureka Moment or Swap)
2. Run in console:
   ```javascript
   sessionStorage.getItem('game-state');
   ```

### Expected Results
- [ ] Returns a JSON string
- [ ] JSON contains `playerLigands` object
- [ ] JSON contains `collectedLigandIds` array
- [ ] Values reflect recent fate effect changes

### Detailed Check
```javascript
const state = JSON.parse(sessionStorage.getItem('game-state'));
console.log('Player Ligands:', state.playerLigands);
console.log('Collected IDs:', state.collectedLigandIds);
```

### Expected Results
- [ ] `playerLigands` is an object with player IDs as keys
- [ ] Each player has an array of ligand objects or IDs
- [ ] `collectedLigandIds` is an array of unique ligand IDs
- [ ] Data persists after page refresh (verify manually)

### Result: ✅ PASS / ❌ FAIL
**Notes:**

---

## Test 7: Console Error Check

### Test Steps
1. Clear browser console
2. Trigger all 5 fate effects sequentially
3. Review console for errors

### Expected Results
- [ ] No red error messages appear
- [ ] All `[FATE]` prefixed logs appear correctly
- [ ] No JavaScript exceptions thrown
- [ ] No 404 errors for images or scripts
- [ ] No warnings about missing dependencies

### Result: ✅ PASS / ❌ FAIL
**Notes:**

---

## Test 8: Integration with Fate Modal

### Test Steps
1. Play the game normally
2. Land on a fate square (🔺)
3. Trigger a fate card that has an interactive effect

### Expected Results
- [ ] Fate modal appears with correct card image
- [ ] Click "Accept Fate →" button
- [ ] Fate effect triggers automatically
- [ ] Modal closes
- [ ] Game continues normally

### Result: ✅ PASS / ❌ FAIL
**Notes:**

---

## Overall Test Summary

| Test | Status | Notes |
|------|--------|-------|
| 1. Eureka Moment | ⏳ | |
| 2. Second Chance | ⏳ | |
| 3. Ligand Square | ⏳ | |
| 4. Destiny Dance | ⏳ | |
| 5. Swap Card | ⏳ | |
| 6. sessionStorage | ⏳ | |
| 7. Console Errors | ⏳ | |
| 8. Integration | ⏳ | |

**Overall Result:** ⏳ PENDING / ✅ ALL PASS / ❌ SOME FAIL

---

## Issues Found

[List any bugs or issues discovered during testing]

1.
2.
3.

---

## Recommendations

[Any suggestions for improvements]

1.
2.
3.

---

## Sign-Off

**Tested By:** ___________________
**Date:** ___________________
**Browser:** ___________________
**Pass/Fail:** ___________________

**Approved for Production:** ☐ YES / ☐ NO (pending fixes)
