import { labState, canvas } from '../state.js';
import { pointOnCircle, toRad, sectorArea, sectorPerimeter } from '../math.js';
import { draw, createCanvasOnce, drawDragger } from '../canvas.js';
import { setPanel, attachDropdownMenu } from '../ui.js';

export const sectorViews = {
    sector: `
        <div class="inputs">
            <div class="input-group">
                <label>Radius</label>
                <input type="number" id="radiusInput" value="${labState.sector.radius}">
            </div>
            <div class="input-group">
                <label>Angle (degrees)</label>
                <input type="number" id="angleInput" value="${labState.sector.angleDeg}">
            </div>
        </div>
        <div class="result show" style="display: flex; justify-content: space-between;">
            <span style="color: #e74c3c;">
                Area = <span id="sectorAreaVal"></span>
            </span>
            <span style="color: #3498db;">
                Perimeter = <span id="sectorPerimeterVal"></span>
            </span>
        </div>
    `,
    segment: ``
};

export const sectorSegmentModule = {
    viewMode: "Circular Sector",
    modes: {
        "Circular Sector": {
            html: sectorViews.sector,
            facts: [
                "A sector is a pizza-shaped region bounded by two radii and an arc."
            ],
            init: (ctx) => {
                ctx.setupInputs();
            }
        },

        "Circular Segment": {
            html: sectorViews.segment,
            facts: [],
            init: () => {}
        }
    },
    getFacts() { return this.modes[this.viewMode]?.facts; },

    init() {
        createCanvasOnce();
        this.renderUI();
        this.updateView();
        this.attachMenu();
    },

    renderUI() {
    setPanel(`
        <div class="menu-container">
            <button id="show-btn">Show ▼</button>
            <div id="dropdown-menu">
                ${Object.keys(this.modes)
                    .map(m => `
                        <div class="menu-item" data-mode="${m}">
                            ${m}
                        </div>
                    `.trim())
                    .join("")}
            </div>
        </div>
        <div style="color:#4e342e; padding:15px; text-align:center; font-family:sans-serif;">
            <h3 class="lab-title">Circular Regions Lab</h3>
            <p class="rule">½r²θ(rad)</p>
            <div id="dynamic-content"></div>
        </div>
    `);
   },

   updateView() { 
    const container = document.getElementById("dynamic-content");
    const mode = this.modes[this.viewMode];
    if (!container || !mode) return;
    container.innerHTML = mode.html;
    mode.init(this);
    this.updateStats();
   },
    
   attachMenu() {
    attachDropdownMenu((mode) => {
        this.viewMode = mode;
        this.updateView();
        draw();
    });
   },

   setupInputs() {
    const radius = document.getElementById("radiusInput");
    const angle = document.getElementById("angleInput");
    if (!radius || !angle) return;
    const update = () => {
        labState.sector.radius = Math.max(20, Number(radius.value));
        labState.sector.angleDeg = Math.max(5, Math.min(360, Number(angle.value)));
        radius.value = labState.sector.radius;
        angle.value = labState.sector.angleDeg;
        this.updateStats();
        draw();
    };
    radius.addEventListener("input", update);
    angle.addEventListener("input", update);
   },

   
};
