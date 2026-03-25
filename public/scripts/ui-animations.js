/**
 * UI Animation Controller
 * Handles all smooth animations for local co-op gameplay
 */

class UIAnimations {
  constructor() {
    this.isAnimating = false;
  }

  /**
   * Animate dice roll
   * @param {HTMLElement} diceElement - Dice element to animate
   * @param {number} finalValue - Final dice value (1-6)
   * @param {Function} callback - Callback after animation completes
   */
  rollDice(diceElement, finalValue, callback) {
    if (!diceElement || this.isAnimating) return;

    this.isAnimating = true;

    // Add roll animation
    diceElement.classList.add('dice-rolling');

    // Sound effect (if audio enabled)
    this.playSound('dice-roll');

    // Simulate rolling numbers
    let count = 0;
    const rollInterval = setInterval(() => {
      const randomValue = Math.floor(Math.random() * 6) + 1;
      diceElement.src = `dice/dice-${randomValue}.png`;
      count++;

      if (count >= 8) {
        clearInterval(rollInterval);

        // Show final value
        setTimeout(() => {
          diceElement.src = `dice/dice-${finalValue}.png`;
          diceElement.classList.remove('dice-rolling');
          this.isAnimating = false;

          // Callback
          if (callback) callback(finalValue);
        }, 100);
      }
    }, 75);
  }

  /**
   * Animate piece movement (hop animation)
   * @param {HTMLElement} pieceElement - Piece element
   * @param {Function} callback - Callback after animation
   */
  movePiece(pieceElement, callback) {
    if (!pieceElement) return;

    pieceElement.classList.add('piece-moving');
    this.playSound('piece-move');

    setTimeout(() => {
      pieceElement.classList.remove('piece-moving');
      if (callback) callback();
    }, 400);
  }

  /**
   * Highlight selectable pieces
   * @param {HTMLElement[]} pieces - Array of piece elements
   */
  highlightSelectablePieces(pieces) {
    pieces.forEach(piece => {
      piece.classList.add('piece-selectable');
    });
  }

  /**
   * Remove highlight from pieces
   * @param {HTMLElement[]} pieces - Array of piece elements
   */
  removeHighlight(pieces) {
    pieces.forEach(piece => {
      piece.classList.remove('piece-selectable');
    });
  }

  /**
   * Show modal with animation
   * @param {string} modalId - Modal element ID
   * @param {string} animationType - 'bounce' | 'slide' | 'fade'
   */
  showModal(modalId, animationType = 'bounce') {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex', 'modal-backdrop');

    const content = modal.querySelector('.modal-content') || modal.firstElementChild;
    if (content) {
      if (animationType === 'bounce') {
        content.classList.add('modal-content');
      } else if (animationType === 'slide') {
        content.classList.add('modal-slide');
      }
    }

    this.playSound('modal-open');
  }

  /**
   * Hide modal with animation
   * @param {string} modalId - Modal element ID
   * @param {Function} callback - Callback after hide
   */
  hideModal(modalId, callback) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const content = modal.querySelector('.modal-content, .modal-slide') || modal.firstElementChild;
    if (content) {
      content.style.animation = 'scale-in 0.2s ease-out reverse';
    }

    setTimeout(() => {
      modal.classList.add('hidden');
      modal.classList.remove('flex', 'modal-backdrop');
      if (callback) callback();
    }, 200);
  }

  /**
   * Show success feedback
   * @param {string} message - Success message
   * @param {number} duration - Duration in ms (default 2000)
   */
  showSuccess(message, duration = 2000) {
    this.showNotification(message, 'success', duration);
    this.playSound('success');
  }

  /**
   * Show error feedback
   * @param {string} message - Error message
   * @param {number} duration - Duration in ms (default 2000)
   */
  showError(message, duration = 2000) {
    this.showNotification(message, 'error', duration);
    this.playSound('error');
  }

  /**
   * Show notification toast
   * @param {string} message - Notification message
   * @param {string} type - 'success' | 'error' | 'info'
   * @param {number} duration - Duration in ms
   */
  showNotification(message, type = 'info', duration = 2000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg notification-enter ${this.getNotificationClass(type)}`;
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-2xl">${this.getNotificationIcon(type)}</span>
        <p class="text-white font-medium">${message}</p>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after duration
    setTimeout(() => {
      notification.classList.remove('notification-enter');
      notification.classList.add('notification-exit');

      setTimeout(() => {
        notification.remove();
      }, 300);
    }, duration);
  }

  /**
   * Get notification background class
   * @param {string} type - Notification type
   * @returns {string} CSS class
   */
  getNotificationClass(type) {
    const classes = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500',
    };
    return classes[type] || classes.info;
  }

  /**
   * Get notification icon
   * @param {string} type - Notification type
   * @returns {string} Emoji icon
   */
  getNotificationIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
    };
    return icons[type] || icons.info;
  }

  /**
   * Animate ligand collection (celebration)
   * @param {HTMLElement} container - Container element
   */
  celebrateLigandCollection(container) {
    if (!container) container = document.body;

    // Create confetti
    for (let i = 0; i < 20; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti fixed w-2 h-2 rounded-full';
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.backgroundColor = this.getRandomColor();
      confetti.style.animationDelay = `${Math.random() * 0.5}s`;

      container.appendChild(confetti);

      setTimeout(() => confetti.remove(), 3000);
    }

    this.playSound('collect');
  }

  /**
   * Get random color for confetti
   * @returns {string} RGB color
   */
  getRandomColor() {
    const colors = [
      '#ef4444', // red
      '#3b82f6', // blue
      '#eab308', // yellow
      '#22c55e', // green
      '#a855f7', // purple
      '#f97316', // orange
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Animate turn change
   * @param {number} playerId - New player ID
   */
  showTurnChange(playerId) {
    if (window.TurnIndicator) {
      window.TurnIndicator.show(playerId, 'roll');

      const indicator = document.getElementById('turn-indicator');
      if (indicator) {
        indicator.classList.add('turn-indicator-show', 'turn-glow');

        setTimeout(() => {
          indicator.classList.remove('turn-indicator-show');
        }, 600);
      }
    }

    this.playSound('turn-change');
  }

  /**
   * Animate score update
   * @param {HTMLElement} scoreElement - Score display element
   * @param {number} newScore - New score value
   */
  updateScore(scoreElement, newScore) {
    if (!scoreElement) return;

    scoreElement.classList.add('count-up');

    // Animate number counting
    const currentScore = parseInt(scoreElement.textContent) || 0;
    const increment = (newScore - currentScore) / 20;
    let current = currentScore;

    const counter = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= newScore) || (increment < 0 && current <= newScore)) {
        scoreElement.textContent = newScore;
        clearInterval(counter);
        scoreElement.classList.remove('count-up');
      } else {
        scoreElement.textContent = Math.floor(current);
      }
    }, 30);
  }

  /**
   * Play sound effect (if audio enabled)
   * @param {string} soundName - Sound name
   */
  playSound(soundName) {
    // Check if audio enabled
    const audioEnabled = sessionStorage.getItem('audio-enabled') !== 'false';
    if (!audioEnabled) return;

    const audio = new Audio(`/audio/${soundName}.mp3`);
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignore audio errors (user might not have interacted yet)
    });
  }

  /**
   * Create loading spinner
   * @param {HTMLElement} container - Container element
   * @returns {HTMLElement} Spinner element
   */
  showLoading(container) {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner flex items-center justify-center';
    spinner.innerHTML = `
      <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full loading-spin"></div>
    `;

    container.appendChild(spinner);
    return spinner;
  }

  /**
   * Remove loading spinner
   * @param {HTMLElement} spinner - Spinner element
   */
  hideLoading(spinner) {
    if (spinner) {
      spinner.classList.add('fade-out');
      setTimeout(() => spinner.remove(), 300);
    }
  }
}

// Export as global singleton
if (typeof window !== 'undefined') {
  window.UIAnimations = new UIAnimations();
}
