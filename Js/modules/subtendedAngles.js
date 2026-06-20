import { labState, canvas, TAU, RAD2DEG } from '../state.js';
import { isOnArc, positiveDiff, shortestDiff, normalize } from '../math.js';
import { draw, drawDragger, drawArc, createCanvasOnce } from '../canvas.js';
import { attachDropdownMenu } from '../ui.js';

export const subtendedAnglesView = {
  default: `
    <p class="viewData">Drag points A, B, or C to observe how the angles change.</p>
    <div class="data-container">
        <div style="font-size:0.9em; line-height:1.8;">
            Central Angle (∠AOB): <b style="color:#f39c12;"><span id="valCentral">0</span>°</b><br>
            Inscribed Angle (∠ACB): <b style="color:#4e342e;"><span id="valInscribed">0</span>°</b>
        </div>
    </div>
    <p class="lab-note">
    The orange arc AB subtends both angles.
    </p>`,
  inscribed: `<p class="viewData">Exploring the Inscribed Angle Theorem.</p>
    <div class="data-container">
        <ul class="Slist">
            <li>Inscribed angle: An angle formed by two chords in a circle.</li>
            <li>Measure of each inscribed angle = <b>1/2</b> measure of <span style="color: #f39c12; font-weight: bold;">AB</span> arc.</li>
            <li>All inscribed angles subtended by the same arc <span style="color: #f39c12; font-weight: bold;">AB</span> are <b>equal</b> in measure.</li>
        </ul>
    </div>`,
  cyclic: `
    <p class="viewData">Exploring Cyclic Quadrilaterals.</p>
    <div class="data-container">
        <ul class="Slist">
            <li>A cyclic quadrilateral has all its four vertices on the circumference of the circle</li>
            <li>Opposite angles in a cyclic quad add up to 180° <b>(supplementary)</b>.</li>
            <li>Exterior angle is equal to the interior opposite angle.</li>
        </ul>
    </div>
    <button id="refresh-quad-btn" class="refresh-quad-btn">Refresh Quad</button>`
}

export const subtendedAnglesModule = {
  elements: {},
    viewMode: 'Default view',
    cyclicPoints: [],

    refreshCyclicQuad() {
        const quarter = TAU / 4;
        let pts = [];
        for (let i = 0; i < 4; i++) {
         const start = i * quarter;
         const angle = Math.random() * quarter + start;
        pts.push(angle);
        }
        this.cyclicPoints = pts.sort((a, b) => a - b);
    },
    modes: {
        'Default view': {
            html: subtendedAnglesView.default,
            facts: [
              "The central angle is always exactly twice the measure of the inscribed angle",
              "A central angle has its vertex at the center of a circle, while an inscribed angle has its vertex on the circle's edge",
              "The central angle has two radii as its sides",
              "The measure of the central angle is equal to the measure of its intercepted arc (AB)",
              "The measure of the inscribed angle is exactly half the measure of its intercepted arc (AB)"
            ],
            init: (ctx) => {
                ctx.elements.vC = document.getElementById("valCentral");
                ctx.elements.vI = document.getElementById("valInscribed");
            }
        },
        'Inscribed Angles': {
            html: subtendedAnglesView.inscribed,
            facts: [
              "Each inscribed angle has two chords as its sides",
              "Legend says Thales sacrificed an ox to the gods in celebration after proving that any angle inscribed in a semicircle is a right angle (90°)"
            ],
            init: () => {}
        },
        'Cyclic Quadrilateral': {
            html: subtendedAnglesView.cyclic,
            init: (ctx) => {
                const btn = document.getElementById("refresh-quad-btn");
                if (btn) {
                    btn.onclick = () => {
                        ctx.refreshCyclicQuad();
                        draw();
                    };
                }
                if (ctx.cyclicPoints.length === 0) ctx.refreshCyclicQuad();
            }
        },
    },
    getFacts() { return this.modes[this.viewMode]?.facts; },
    init() {
        createCanvasOnce();
        attachDropdownMenu((mode) => {    // ← uses the new shared helper
            this.viewMode = mode;
            this.updateView();
            draw();
        });
        this.renderUI();
        this.updateView();
    },
  
    renderUI() {
        const dataPanel = document.getElementById("dataPanel");
        if (!dataPanel) return;
        dataPanel.style.position = "relative";
        dataPanel.innerHTML = `
            <div class="menu-container">
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

    
      updateStats() {
        if (this.viewMode !== 'Default view') return;
        const { vC, vI } = this.elements;
        if (!vC || !vI) return;
        const { A, B, C } = labState.subtendedAngles.points;
        const flipped = isOnArc(A, B, C);
        const start = flipped ? B : A;
        const end = flipped ? A : B;
        const centralDeg = Math.round(positiveDiff(start, end) * RAD2DEG);
        vC.innerText = centralDeg;
        vI.innerText = Math.round(centralDeg / 2);
    },
      draw(ctx) {
        const cx = canvas.width / 2, cy = canvas.height / 2;
        const { A, B, C } = labState.subtendedAngles.points;
        const r = labState.subtendedAngles.radius;

        // 1. Draw Common Elements (Main Circle)
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, TAU);
        ctx.strokeStyle = "#bcaaa4aa";
        ctx.lineWidth = 2;
        ctx.stroke();

        // 2. Route Drawing Based on View Mode
        if (this.viewMode === 'Cyclic Quadrilateral') {
            const pts = this.cyclicPoints.map(ang => ({
                x: cx + r * Math.cos(ang),
                y: cy + r * Math.sin(ang),
                ang
            }));
          
            // Quadrilateral
            ctx.beginPath();
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#4e342e";
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
            ctx.closePath();
            ctx.stroke();

            // Opposite Angles (Pink) — excluding opposite of green
            for (let i = 0; i < 4; i++) {
                if (i === 1 || i === 3) continue;
                const prev = pts[(i + 3) % 4], curr = pts[i], next = pts[(i + 1) % 4];
                const a1 = Math.atan2(prev.y - curr.y, prev.x - curr.x);
                const a2 = Math.atan2(next.y - curr.y, next.x - curr.x);
                const diff = shortestDiff(a1, a2);
                ctx.beginPath();
                ctx.strokeStyle = "#ff80ab";
                ctx.lineWidth = 2;
                ctx.arc(curr.x, curr.y, 20, a1, a1 + diff, diff < 0);
                ctx.stroke();
            }
                      // Interior Angle (Green)
            const pP = pts[0], pCu = pts[1], pN = pts[2];
            const g1 = Math.atan2(pP.y - pCu.y, pP.x - pCu.x);
            const g2 = Math.atan2(pN.y - pCu.y, pN.x - pCu.x);
            const gDiff = shortestDiff(g1, g2);
            ctx.beginPath();
            ctx.strokeStyle = "#4caf50";
            ctx.lineWidth = 2;
            ctx.arc(pCu.x, pCu.y, 20, g1, g1 + gDiff, gDiff < 0);
            ctx.stroke();

            // Exterior Angle Extension & Arc (Green)
            const p3 = pts[3], p2 = pts[2], p0 = pts[0];
            const dirX = p3.x - p2.x;
            const dirY = p3.y - p2.y;
            const len = Math.hypot(dirX, dirY) || 1;
            const exX = p3.x + (dirX / len) * 50;
            const exY = p3.y + (dirY / len) * 50;

            ctx.beginPath();
            ctx.strokeStyle = "#4e342e";
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.moveTo(p3.x, p3.y);
            ctx.lineTo(exX, exY);
            ctx.stroke();
            ctx.setLineDash([]);

            const e1 = Math.atan2(exY - p3.y, exX - p3.x);
            const e2 = Math.atan2(p0.y - p3.y, p0.x - p3.x);
            const eDiff = shortestDiff(e1, e2);
            ctx.beginPath();
            ctx.strokeStyle = "#4caf50";
            ctx.arc(p3.x, p3.y, 20, e1, e1 + eDiff, eDiff < 0);
            ctx.stroke();

            pts.forEach(p => drawDragger(p));
          
        } else {
            const pA = { x: cx + r * Math.cos(A), y: cy + r * Math.sin(A) };
            const pB = { x: cx + r * Math.cos(B), y: cy + r * Math.sin(B) };

            const flipped = isOnArc(A, B, C);
            const start = flipped ? B : A, end = flipped ? A : B;
            const sweep = positiveDiff(start, end);

            if (this.viewMode === 'Inscribed Angles') {
                const majorSweep = TAU - sweep;
                const offsets = [0.2, 0.5, 0.8]; // add another % and a fourth triangle will be there
                offsets.forEach(offset => {
                    const angle = normalize(end + majorSweep * offset);
                    const p = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
                    ctx.beginPath();
                    ctx.lineWidth = 2.5;
                    ctx.strokeStyle = "#4e342e";
                    ctx.moveTo(pA.x, pA.y); ctx.lineTo(p.x, p.y); ctx.lineTo(pB.x, pB.y);
                    ctx.stroke();
                    drawDragger(p);
                });
            } else {
                const pC = { x: cx + r * Math.cos(C), y: cy + r * Math.sin(C) };

                ctx.beginPath();
                ctx.lineWidth = 3;
                ctx.strokeStyle = "#4e342e";
                ctx.moveTo(pA.x, pA.y);
                ctx.lineTo(pC.x, pC.y);
                ctx.lineTo(pB.x, pB.y);
                ctx.stroke();

                const angAC = Math.atan2(pA.y - pC.y, pA.x - pC.x);
                const angBC = Math.atan2(pB.y - pC.y, pB.x - pC.x);
                const d = shortestDiff(angAC, angBC);
                ctx.beginPath();
                ctx.strokeStyle = "#4e342e";
                ctx.lineWidth = 3;
                ctx.arc(pC.x, pC.y, 25, angAC, angAC + d, d < 0);
                ctx.stroke();

                drawDragger(pC);
                ctx.fillStyle = "#4e342e";
                ctx.fillText("C", pC.x + 12, pC.y - 12);
            }
                           ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.moveTo(pA.x, pA.y); ctx.lineTo(cx, cy); ctx.lineTo(pB.x, pB.y);
            ctx.strokeStyle = "#f39c12";
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.beginPath();
            ctx.arc(cx, cy, r, start, start + sweep);
            ctx.strokeStyle = "#f39c12";
            ctx.lineWidth = 4;
            ctx.stroke();

            [pA, pB].forEach(drawDragger);
            ctx.fillStyle = "#4e342e";
            ctx.font = "bold 14px Arial";
            ctx.fillText("A", pA.x + 12, pA.y - 12);
            ctx.fillText("B", pB.x + 12, pB.y - 12);
        }

        this.updateStats();
      }
};
