/**
 * UI Polish Integration Script
 * Enhances existing game mechanics with smooth animations
 * Works with one-vs-one.js, one-vs-two.js, one-vs-three.js
 */

(function() {
  'use strict';

  // Wait for DOM and dependencies
  function init() {
    if (!window.UIAnimations || !window.jQuery) {
      setTimeout(init, 100);
      return;
    }

    console.log('🎨 UI Polish initializing...');
    enhanceGameplay();
  }

  function enhanceGameplay() {
    // Enhance dice rolls with smooth animation
    enhanceDiceRolls();

    // Enhance piece movement
    enhancePieceMovement();

    // Enhance modals
    enhanceModals();

    // Enhance turn transitions
    enhanceTurnTransitions();

    // Add keyboard shortcuts
    addKeyboardShortcuts();

    console.log('✅ UI Polish initialized');
  }

  /**
   * Enhance dice rolls with animation
   */
  function enhanceDiceRolls() {
    // Override dice click handler
    $(document).on('click', '.player-dice', function(e) {
      const diceElement = this;
      const playerId = extractPlayerId(diceElement.id);

      // Add dice shake effect before roll
      diceElement.classList.add('dice-shake');

      setTimeout(() => {
        diceElement.classList.remove('dice-shake');
      }, 500);

      // Enhance the GIF with CSS animation
      setTimeout(() => {
        if (diceElement.src.includes('dice-roll.gif')) {
          diceElement.classList.add('dice-rolling');

          setTimeout(() => {
            diceElement.classList.remove('dice-rolling');
          }, 600);
        }
      }, 100);
    });

    // Listen for dice result (after animation)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
          const img = mutation.target;

          // Check if it's a dice showing final value
          if (img.classList.contains('player-dice') && img.src.includes('dice/dice-')) {
            const match = img.src.match(/dice-(\d)\.png/);
            if (match) {
              const value = parseInt(match[1]);
              // Show success feedback for good rolls (4-6)
              if (value >= 4) {
                setTimeout(() => {
                  window.UIAnimations.showSuccess(`Rolled ${value}!`, 1500);
                }, 100);
              }
            }
          }
        }
      });
    });

    // Observe all dice elements
    document.querySelectorAll('.player-dice').forEach((dice) => {
      observer.observe(dice, { attributes: true });
    });
  }

  /**
   * Enhance piece movement with hop animation
   */
  function enhancePieceMovement() {
    // Monitor piece position changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Check if a piece (horse) was moved
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.tagName === 'IMG' && node.classList.contains('horse')) {
              // Piece was moved to this cell
              window.UIAnimations.movePiece(node);
            }
          });
        }
      });
    });

    // Observe board cells for piece movement
    document.querySelectorAll('.path td').forEach((cell) => {
      observer.observe(cell, { childList: true, subtree: true });
    });

    // Highlight selectable pieces
    $(document).on('mouseenter', '.path td img.horse', function() {
      // Only highlight if it's player's turn and piece is movable
      if (this.classList.contains('selectable')) {
        this.style.transform = 'scale(1.1)';
        this.style.filter = 'brightness(1.3)';
      }
    });

    $(document).on('mouseleave', '.path td img.horse', function() {
      this.style.transform = '';
      this.style.filter = '';
    });
  }

  /**
   * Enhance modal animations
   */
  function enhanceModals() {
    // Ligand modal
    const ligandModal = document.getElementById('ligand-modal');
    if (ligandModal) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            const classList = mutation.target.classList;
            if (classList.contains('flex') && !classList.contains('hidden')) {
              // Modal opened
              window.UIAnimations.celebrateLigandCollection();
            }
          }
        });
      });
      observer.observe(ligandModal, { attributes: true });
    }

    // Question modal - add success/error feedback
    $(document).on('click', '.answer-option', function() {
      const button = this;
      button.classList.add('button-press');

      setTimeout(() => {
        button.classList.remove('button-press');
      }, 200);
    });

    // Fate modal
    const fateModal = document.getElementById('fate-modal');
    if (fateModal) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            const classList = mutation.target.classList;
            if (classList.contains('flex') && !classList.contains('hidden')) {
              // Play sound
              window.UIAnimations.playSound('fate');
            }
          }
        });
      });
      observer.observe(fateModal, { attributes: true });
    }
  }

  /**
   * Enhance turn transitions
   */
  function enhanceTurnTransitions() {
    // Monitor turn indicator changes
    const turnIndicator = document.getElementById('turn-indicator');
    if (turnIndicator) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            const classList = mutation.target.classList;
            if (classList.contains('scale-100')) {
              // Turn changed - add glow effect
              turnIndicator.classList.add('turn-glow');

              setTimeout(() => {
                turnIndicator.classList.remove('turn-glow');
              }, 3000);
            }
          }
        });
      });
      observer.observe(turnIndicator, { attributes: true });
    }

    // Highlight active player area
    $(document).on('DOMSubtreeModified', '.player-area', function() {
      const playerArea = this;
      const diceArrow = playerArea.querySelector('[id$="-dice-arrow"]');

      if (diceArrow && diceArrow.src.includes('arrow1.gif')) {
        // This player's turn
        playerArea.classList.add('player-active');
      } else {
        playerArea.classList.remove('player-active');
      }
    });
  }

  /**
   * Add keyboard shortcuts
   */
  function addKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Space = Roll dice (for current player)
      if (e.code === 'Space') {
        e.preventDefault();
        const activeDice = document.querySelector('.player-dice[src*="dice-rest.png"]');
        if (activeDice && activeDice.offsetParent !== null) {
          activeDice.click();
        }
      }

      // Enter = Continue/Close modal
      if (e.code === 'Enter') {
        const continueBtn = document.querySelector('#continue-ligand-btn:not([style*="display: none"]), #continue-question-btn:not([style*="display: none"]), #continue-fate-btn:not([style*="display: none"])');
        if (continueBtn && continueBtn.offsetParent !== null) {
          e.preventDefault();
          continueBtn.click();
        }
      }

      // Escape = Close modal
      if (e.code === 'Escape') {
        const visibleModal = document.querySelector('#ligand-modal.flex, #question-modal.flex, #fate-modal.flex');
        if (visibleModal) {
          const continueBtn = visibleModal.querySelector('[id^="continue-"]');
          if (continueBtn) {
            e.preventDefault();
            continueBtn.click();
          }
        }
      }
    });

    console.log('⌨️  Keyboard shortcuts enabled:');
    console.log('  Space = Roll dice');
    console.log('  Enter = Continue/Close modal');
    console.log('  Escape = Close modal');
  }

  /**
   * Extract player ID from element ID
   * @param {string} id - Element ID like "player-1-dice"
   * @returns {number} Player ID
   */
  function extractPlayerId(id) {
    const match = id.match(/player-(\d)/);
    return match ? parseInt(match[1]) : 1;
  }

  /**
   * Add smooth scroll to board when piece moves off-screen
   */
  function addSmoothScroll() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === 'IMG' && node.classList.contains('horse')) {
            // Scroll to piece
            node.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'center'
            });
          }
        });
      });
    });

    document.querySelectorAll('.path td').forEach((cell) => {
      observer.observe(cell, { childList: true });
    });
  }

  // Initialize when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
