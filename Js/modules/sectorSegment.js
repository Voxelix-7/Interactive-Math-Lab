import { labState, canvas, TAU } from '../state.js';
import { pointOnCircle, toRad, sectorArea, sectorPerimeter, segmentArea, normalize } from '../math.js';
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
    segment: `
        <div class="inputs">
            <div class="input-group">
                <label>Radius</label>
                <input type="number" id="radiusInput" value="${labState.segment.radius}">
            </div>
            <div class="input-group">
                <label>Angle (degrees)</label>
                <input type="number" id="angleInput" value="${labState.segment.angleDeg}">
            </div>
        </div>
        <div class="result-panel">
                <span style="color: #e74c3c; font-weight: bold;">Area = <span id="sectorAreaVal"></span></span>
            </div>
    `
};

export const sectorSegmentModule = {
    viewMode: "Circular Sector",
    modes: {
        "Circular Sector": {
            html: sectorViews.sector,
            facts: [
                "A sector is a pizza-shaped region bounded by two radii and an arc.",
                "The word 'Sector' comes from Latin and it means 'to cut'.",
                "Ancient astronomers used circle slices (sectors) to measure the positions of stars and planets thousands of years ago.",
                "Every hour on a clock represents a 30° sector of the full 360° circle.",
                "Doubling the central angle doubles the sector's area as long as the circle's radius stays the same."
            ],
            init: (ctx) => {
                ctx.setupInputs();
            }
        },

        "Circular Segment": {
            html: sectorViews.segment,
            facts: [],
            init: (ctx) => {
                ctx.setupInputs();
            }
        }
    },
    getFacts() { return this.modes[this.viewMode]?.facts; },

    // which labState part belongs to the current mode
    stateKey() { return this.viewMode === 'Circular Sector' ? 'sector' : 'segment'; },

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

    const key = this.stateKey();
    const update = () => {        
        if (radius.value === "" || angle.value === "") return; // Skip if input bars are empty
        labState[key].radius = Math.max(1, Math.min(100, Number(radius.value)));
        labState[key].angleDeg = Math.max(5, Math.min(360, Number(angle.value)));
        radius.value = labState[key].radius;
        angle.value = labState[key].angleDeg;
        this.updateStats();
        draw();
    };

    radius.addEventListener("input", update);
    angle.addEventListener("input", update);

   },

   updateStats() {
    const key = this.stateKey();
    const r = labState[key].radius;
    const deg = labState[key].angleDeg;
    if (this.viewMode === "Circular Sector") {
        const area = document.getElementById("sectorAreaVal");
        const perimeter = document.getElementById("sectorPerimeterVal");
        if (!area || !perimeter) return;
        area.textContent = sectorArea(r, deg).toFixed(1);
        perimeter.textContent = sectorPerimeter(r, deg).toFixed(1);
    } else {
        const area = document.getElementById("sectorAreaVal");
        if (!area) return;
        area.textContent = segmentArea(r, deg).toFixed(1);
    }
   },

    draw(ctx) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const drawRadius = 110;
    const key = this.stateKey();
    const deg = labState[key].angleDeg;
    // normalize so the arc always sweeps forward from `start`, never the reflex way
    const end = normalize(toRad(deg));
    const start = 0;

    // Common Main Circle
    ctx.beginPath();
    ctx.arc(cx, cy, drawRadius, 0, TAU);
    ctx.strokeStyle = "#bcaaa4aa";
    ctx.lineWidth = 2;
    ctx.stroke();

    if (this.viewMode === 'Circular Sector') {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, drawRadius, start, end);
        ctx.closePath();
        ctx.fillStyle = "#f39c12";
        ctx.globalAlpha = 0.4;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "#f39c12";
        ctx.lineWidth = 3;
        ctx.stroke();
        const p = pointOnCircle(cx, cy, drawRadius, end); drawDragger(p);
    } else {
    const A = pointOnCircle(cx, cy, drawRadius, start);
    const B = pointOnCircle(cx, cy, drawRadius, end);
    // Shaded Circular Segment
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.arc(cx, cy, drawRadius, start, end);
    ctx.closePath();
    ctx.fillStyle = "#f39c12";
    ctx.globalAlpha = 0.4;
    ctx.fill();
    ctx.globalAlpha = 1;
    // Dashed Radii
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = "#f39c12";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(A.x, A.y);
    ctx.moveTo(cx, cy);
    ctx.lineTo(B.x, B.y);
    ctx.stroke();
    ctx.restore();
    // Draggable Point
    drawDragger(B);
}
    this.updateStats();
    }
};
