import { labState, canvas, TAU, RAD2DEG } from '../state.js';
import { isOnArc, positiveDiff, shortestDiff, normalize } from '../math.js';
import { draw, drawDragger, drawArc, createCanvasOnce } from '../canvas.js';
// 1. Import your shared UI helper safely
import { attachDropdownMenu } from '../ui.js'; 

export const subtendedAnglesView = { /* ... your view strings ... */ };

export const subtendedAnglesModule = {
    elements: {},
    viewMode: 'Default view',
    cyclicPoints: [],

    // ... refreshCyclicQuad, modes, getFacts declarations ...

    init() {
        createCanvasOnce();
        
        // 2. First, build the HTML structure so the buttons exist in the DOM
        this.renderUI();
        
        // 3. Populate the initial view content
        this.updateView();
        
        // 4. Now, call your clean shared helper from ui.js
        attachDropdownMenu((mode) => {
            this.viewMode = mode;
            this.updateView();
            draw();
        });
    },
  
    renderUI() {
        const dataPanel = document.getElementById("dataPanel");
        if (!dataPanel) return;
        dataPanel.style.position = "relative";
        
        // Make sure the dropdown-menu wrapper has a non-hidden default positioning rule
        dataPanel.innerHTML = `
            <div class="menu-container" style="position: relative; display: inline-block;">
                <button id="show-btn">Show ▼</button>
                <div id="dropdown-menu">
                    ${Object.keys(this.modes).map(m => `<div class="menu-item" data-mode="${m}">${m}</div>`).join('')}
                </div>
            </div>
            <div style="color:#4e342e; padding:15px; text-align:center; font-family: sans-serif;">
                <h3 class="lab-title">Subtended Angles Lab</h3>
                <div id="dynamic-content"></div>
            </div>
        `;
    },

    updateView() {
        const container = document.getElementById("dynamic-content");
        const mode = this.modes[this.viewMode];
        if (!container || !mode) return;
        container.innerHTML = mode.html;
        mode.init(this);
        this.updateStats();
    },

    // REMOVED: attachMenuListeners completely! 
    // Your code is now much cleaner since ui.js handles it.

    updateStats() { /* ... updateStats logic ... */ },
    draw(ctx) { /* ... draw canvas logic ... */ }
};
