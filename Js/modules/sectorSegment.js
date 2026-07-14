import { labState, canvas, TAU } from '../state.js';
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
            <div class="result-panel">
                <span style="color: #e74c3c; font-weight: bold;">Area = <span id="sectorAreaVal"></span></span>
                <br>
                <span style="color: #3498db; font-weight: bold;">Perimeter = <span id="sectorPerimeterVal"></span></span>
            </div>
    `,
    segment: `<p>hi</p>`
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
        labState.sector.radius = Number(radius.value);
        labState.sector.angleDeg = Math.max(5, Math.min(360, Number(angle.value)));
        radius.value = labState.sector.radius;
        angle.value = labState.sector.angleDeg;
        this.updateStats();
        draw();
    };
    radius.addEventListener("input", update);
    angle.addEventListener("input", update);
   },

   updateStats() {
    if (this.viewMode !== "Circular Sector") return;
    const area = document.getElementById("sectorAreaVal");
    const perimeter = document.getElementById("sectorPerimeterVal");
    if (!area || !perimeter) return;
    const r = labState.sector.radius;
    const deg = labState.sector.angleDeg;
    area.textContent = sectorArea(r, deg).toFixed(1);
    perimeter.textContent = sectorPerimeter(r, deg).toFixed(1); 
   },

    draw(ctx) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = 110;
    const deg = labState.sector.angleDeg;
    const end = toRad(deg);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.strokeStyle = "#bcaaa4aa";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, 0, end);
    ctx.closePath();
    ctx.fillStyle = "#f39c12";
    ctx.globalAlpha = 0.4;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#f39c12";
    ctx.lineWidth = 3;
    ctx.stroke();
    const p = pointOnCircle(cx, cy, r, end); drawDragger(p);
        
    this.updateStats();
    }
};
