/**
 * Board Path Helper
 * Scans the DOM for existing path cells and provides navigation functions.
 * Fixes the issue where pieces vanish on non-existent cells (gaps at corners
 * and home stretch entries).
 */
window.BoardPath = {
  paths: {},
  initialized: false,

  /**
   * Scan the DOM and build the valid path for each color.
   * Must be called after the board HTML is rendered.
   */
  init() {
    ['r', 'b', 'y', 'g'].forEach(prefix => {
      const path = [];
      for (let i = 1; i <= 57; i++) {
        if (document.querySelector(`td.${prefix}${i}`)) {
          path.push(i);
        }
      }
      this.paths[prefix] = path;
      console.log(`🗺️ [BOARD-PATH] ${prefix.toUpperCase()} path (${path.length} cells): ${path.join(',')}`);
    });
    this.initialized = true;
    console.log('✅ [BOARD-PATH] Path mapping initialized');
  },

  /**
   * Get the next valid position after currentPos.
   * Skips over non-existent cells (gaps at corners).
   * @param {string} prefix - Color prefix ('r', 'b', 'y', 'g')
   * @param {number} currentPos - Current position number
   * @returns {number} Next valid position number
   */
  getNextPos(prefix, currentPos) {
    const path = this.paths[prefix];
    if (!path) return currentPos + 1;

    // Special case: position 0 means starting from home, next is first path cell
    if (currentPos === 0) {
      return path.length > 0 ? path[0] : 1;
    }

    const idx = path.indexOf(currentPos);
    if (idx >= 0 && idx < path.length - 1) {
      return path[idx + 1];
    }
    // Fallback: try to find next valid position by scanning
    for (let i = currentPos + 1; i <= 57; i++) {
      if (path.includes(i)) return i;
    }
    return currentPos + 1;
  },

  /**
   * Get the number of actual steps remaining to reach position 57 (home/win).
   * @param {string} prefix - Color prefix
   * @param {number} currentPos - Current position
   * @returns {number} Steps remaining
   */
  getStepsRemaining(prefix, currentPos) {
    const path = this.paths[prefix];
    if (!path) return 57 - currentPos;
    const currentIdx = path.indexOf(currentPos);
    const winIdx = path.indexOf(57);
    if (currentIdx < 0 || winIdx < 0) return 57 - currentPos;
    return winIdx - currentIdx;
  },

  /**
   * Check if a position has a corresponding cell in the DOM.
   * @param {string} prefix - Color prefix
   * @param {number} pos - Position number
   * @returns {boolean}
   */
  positionExists(prefix, pos) {
    const path = this.paths[prefix];
    return path ? path.includes(pos) : false;
  },

  /**
   * Get color prefix from a horse class caps string (e.g., 'RH1' -> 'r')
   * @param {string} horseClassCaps - Uppercase horse class like 'RH1'
   * @returns {string} Lowercase color prefix
   */
  getPrefixFromHorse(horseClassCaps) {
    return horseClassCaps.charAt(0).toLowerCase();
  }
};
