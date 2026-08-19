// modules/vectors.js — Vector Explorer + Boat & River labs
import { labState, canvas } from '../state.js';
import { vecMagnitude, vecAngleDeg, vecAdd } from '../math.js';
import { draw, createCanvasOnce, drawArrow, drawGrid, drawDragger } from '../canvas.js';
import { setPanel } from '../ui.js';

export const UNIT = 30; // px per grid unit — also used by drag.js

// Colors cycled through for each new random "extra" vector, kept visually
// distinct from the fixed red (A) / blue (B) / green (Resultant) trio.
const EXTRA_COLORS = ['#9b59b6', '#16a085', '#e91e63', '#795548', '#607d8b', '#8e44ad', '#00838f', '#c0392b'];

export function toCanvas(cx, cy, v) {
    return { x: cx + v.x * UNIT, y: cy - v.y * UNIT };
}

// Shows whole numbers as-is and only falls back to 2 decimals when a value
// genuinely isn't a whole number (magnitude/tan are often irrational).
function fmt(n) {
    if (!isFinite(n)) return "0";
    const rounded = Math.round(n);
    return Math.abs(n - rounded) < 0.005 ? rounded.toString() : n.toFixed(2);
}

function vectorStatsHTML(id, label, color, editable = false) {
    const inputsHTML = editable ? `
        <div style="margin-top:8px; display:flex; gap:10px; justify-content:center; align-items:center;">
            <label style="font-size:0.8em; color:#4e342e;">X:
                <input type="number" id="${id}InputX" step="1" min="-20" max="20" class="vectors-input">
            </label>
            <label style="font-size:0.8em; color:#4e342e;">Y:
                <input type="number" id="${id}InputY" step="1" min="-20" max="20" class="vectors-input">
            </label>
        </div>` : '';
    return `
        <div style="margin-bottom:10px;">
            <b style="color:${color};">${label}</b><br>
            <span style="font-size:0.9em;">
            X: <span id="${id}X">0</span>&nbsp; Y: <span id="${id}Y">0</span><br>
            Magnitude √(x²+y²): <b><span id="${id}Mag">0</span></b><br>
            tanθ = y/x: <span id="${id}Tan">0</span><br>
            θ from +X axis: <b><span id="${id}Ang">0</span>°</b>
            </span>
            ${inputsHTML}
        </div>`;
}

function fillVectorStats(id, v) {
    const xEl = document.getElementById(id + 'X');
    if (!xEl) return;
    xEl.innerText = Math.round(v.x);
    document.getElementById(id + 'Y').innerText = Math.round(v.y);
    document.getElementById(id + 'Mag').innerText = fmt(vecMagnitude(v));
    document.getElementById(id + 'Tan').innerText = v.x !== 0 ? fmt(v.y / v.x) : "undefined (x=0)";
    document.getElementById(id + 'Ang').innerText = vecMagnitude(v) > 0.001 ? Math.round(vecAngleDeg(v)) : 0;

    // Keep editable inputs synced with drags, but never fight the user
    // while they're actively typing in that same field.
    const inX = document.getElementById(id + 'InputX');
    const inY = document.getElementById(id + 'InputY');
    if (inX && document.activeElement !== inX) inX.value = Math.round(v.x);
    if (inY && document.activeElement !== inY) inY.value = Math.round(v.y);
}

function drawDashedComponents(ctx, from, to, color) {
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.restore();
}

// ---------------------------------------------------------------- //
//  LAB 1 — Vector Explorer (free vectors + head-to-tail toggle)
// ---------------------------------------------------------------- //

export const vectorExplorerModule = {
    facts: [
        "A vector has both magnitude and direction, unlike a scalar which only has size",
        "The word 'vector' comes from the Latin 'vehere', meaning 'to carry'",
        "Head-to-tail addition lets you chain any number of vectors nose-to-tail and still land on the same resultant",
        "Pilots combine their airspeed vector with the wind vector to find their true path over the ground",
        "atan2() is preferred over plain arctan because it automatically figures out which quadrant a vector points into"
    ],
    getFacts() { return this.facts; },

    transitionProgress: 0,
    transitionFrom: 0,
    transitionTo: 0,
    transitionStart: null,

    init() {
        createCanvasOnce({ responsive: true });
        this.transitionProgress = labState.vectors.mode === 'headToTail' ? 1 : 0;
        this.renderUI();
        this.attachListeners();
        this.renderExtrasList();
        this.updateStats();
    },

    renderUI() {
        const isH2T = labState.vectors.mode === 'headToTail';
        setPanel(`
            <div style="color:#4e342e; padding:15px; text-align:center; font-family: sans-serif;">
                <h3 class="lab-title">Vector Explorer</h3>
                <p class="viewData">Click or drag anywhere on the grid to reposition the red (A) or blue (B) vector, or type exact values below.</p>
                <button id="h2t-toggle" class="refresh-quad-btn" style="background:${isH2T ? '#4e342e' : '#f39c12'};">
                    ${isH2T ? '↩ Switch to Free Vectors' : '➤ Switch to Head-to-Tail Mode'}
                </button>
                <div style="display:flex; gap:8px; justify-content:center; margin-top:10px;">
                    <button id="add-vector-btn" class="refresh-quad-btn" style="background:#f39c12; margin-top:0;">+ Add Vector</button>
                    <button id="reset-view-btn" class="refresh-quad-btn" style="background:#795548; margin-top:0;">Reset View</button>
                </div>
                <div class="data-container" style="margin-top:15px;">
                    ${vectorStatsHTML('vecA', 'Vector A', '#e74c3c', true)}
                    ${vectorStatsHTML('vecB', 'Vector B', '#2980b9', true)}
                    ${vectorStatsHTML('vecR', 'Resultant R = A + B', '#2ecc71', false)}
                </div>
                <div id="extraVectorsList"></div>
            </div>
        `);
    },

    attachListeners() {
        const h2tBtn = document.getElementById('h2t-toggle');
        if (h2tBtn) h2tBtn.onclick = () => {
            const newMode = labState.vectors.mode === 'headToTail' ? 'free' : 'headToTail';
            this.transitionFrom = this.transitionProgress;
            this.transitionTo = newMode === 'headToTail' ? 1 : 0;
            this.transitionStart = performance.now();
            labState.vectors.mode = newMode;
            this.renderUI();
            this.attachListeners();
            this.renderExtrasList();
            this.animateTransition();
        };

        const addBtn = document.getElementById('add-vector-btn');
        if (addBtn) addBtn.onclick = () => {
            this.addRandomVector();
            this.renderExtrasList();
            draw();
        };

        const resetBtn = document.getElementById('reset-view-btn');
        if (resetBtn) resetBtn.onclick = () => {
            labState.vectors.extras = [];
            this.renderExtrasList();
            draw();
        };

        // Editable X/Y inputs for the two main vectors. B is always stored
        // as its own intrinsic (dx, dy), even in head-to-tail mode, so
        // editing A never has to touch B and vice versa.
        [['vecA', 'A'], ['vecB', 'B']].forEach(([id, key]) => {
            const inX = document.getElementById(id + 'InputX');
            const inY = document.getElementById(id + 'InputY');
            if (inX) inX.addEventListener('change', () => {
                let val = Math.round(parseFloat(inX.value));
                if (isNaN(val)) val = 0;
                val = Math.max(-20, Math.min(20, val));
                labState.vectors[key].x = val;
                inX.value = val;
                draw();
            });
            if (inY) inY.addEventListener('change', () => {
                let val = Math.round(parseFloat(inY.value));
                if (isNaN(val)) val = 0;
                val = Math.max(-20, Math.min(20, val));
                labState.vectors[key].y = val;
                inY.value = val;
                draw();
            });
        });
    },

    // Random integer vector, clamped so its tip always lands within the
    // currently visible plane (which grows/shrinks with the responsive canvas).
    addRandomVector() {
        const maxX = Math.max(1, Math.floor((canvas.width / 2) / UNIT) - 1);
        const maxY = Math.max(1, Math.floor((canvas.height / 2) / UNIT) - 1);
        let x, y;
        do {
            x = Math.floor(Math.random() * (2 * maxX + 1)) - maxX;
            y = Math.floor(Math.random() * (2 * maxY + 1)) - maxY;
        } while (x === 0 && y === 0);
        const color = EXTRA_COLORS[labState.vectors.extras.length % EXTRA_COLORS.length];
        labState.vectors.extras.push({ x, y, color });
    },

    renderExtrasList() {
        const container = document.getElementById('extraVectorsList');
        if (!container) return;
        const extras = labState.vectors.extras;
        if (extras.length === 0) {
            container.innerHTML = `<p class="lab-note" style="margin-top:12px;">No custom vectors yet — click "+ Add Vector" to drop a random one on the plane.</p>`;
            return;
        }
        container.innerHTML = `
            <div style="margin-top:15px; text-align:left;" class="data-container">
                <b style="font-size:0.85em; color:#4e342e;">Custom Vectors</b>
                <ul style="list-style:none; padding:0; margin:8px 0 0; font-size:0.85em;">
                    ${extras.map((v, i) => `
                        <li style="display:flex; align-items:center; gap:8px; padding:4px 0; border-bottom:1px solid #efebe9;">
                            <span style="width:10px; height:10px; border-radius:50%; background:${v.color}; display:inline-block;"></span>
                            <span>V${i + 1}: (${v.x}, ${v.y}) — |v| = ${fmt(vecMagnitude(v))}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>`;
    },

    animateTransition() {
        const duration = 400;
        const step = (now) => {
            const t = Math.min(1, (now - this.transitionStart) / duration);
            this.transitionProgress = this.transitionFrom + (this.transitionTo - this.transitionFrom) * t;
            draw();
            if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    },

    updateStats() {
        const { A, B } = labState.vectors;
        const R = vecAdd(A, B);
        fillVectorStats('vecA', A);
        fillVectorStats('vecB', B);
        fillVectorStats('vecR', R);
    },

    draw(ctx) {
        const cx = canvas.width / 2, cy = canvas.height / 2;
        drawGrid(cx, cy, canvas.width, canvas.height, UNIT);

        const { A, B } = labState.vectors;
        const pOrigin = toCanvas(cx, cy, { x: 0, y: 0 });

        // Independent random extras, drawn first so the main A/B/R trio
        // always renders on top and stays visually primary.
        labState.vectors.extras.forEach((v, i) => {
            const pHead = toCanvas(cx, cy, v);
            drawArrow(pOrigin, pHead, v.color, 2.5);
            ctx.fillStyle = v.color;
            ctx.font = "bold 11px Arial";
            ctx.fillText(`V${i + 1}`, pHead.x + 8, pHead.y - 8);
        });

        // transitionProgress smoothly slides B's tail between the origin (free)
        // and A's head (head-to-tail) — same math drives both modes
        const tailB = { x: A.x * this.transitionProgress, y: A.y * this.transitionProgress };
        const headB = vecAdd(tailB, B);
        const R = vecAdd(A, B);

        const pAHead  = toCanvas(cx, cy, A);
        const pBTail  = toCanvas(cx, cy, tailB);
        const pBHead  = toCanvas(cx, cy, headB);
        const pRHead  = toCanvas(cx, cy, R);

        drawDashedComponents(ctx, pOrigin, pAHead, "#e74c3c99");
        drawDashedComponents(ctx, pBTail, pBHead, "#2980b999");

        drawArrow(pOrigin, pAHead, "#e74c3c");
        drawArrow(pBTail, pBHead, "#2980b9");
        drawArrow(pOrigin, pRHead, "#2ecc71");

        drawDragger(pAHead);
        drawDragger(pBHead);

        ctx.fillStyle = "#4e342e";
        ctx.font = "bold 13px Arial";
        ctx.fillText("A", pAHead.x + 10, pAHead.y - 10);
        ctx.fillText("B", pBHead.x + 10, pBHead.y - 10);
        ctx.fillText("R", pRHead.x + 10, pRHead.y - 10);

        this.updateStats();
    }
};

// ---------------------------------------------------------------- //
//  LAB 2 — Boat & River (boat velocity + current → resultant path)
// ---------------------------------------------------------------- //

export const boatModeModule = {
    challenges: [
        { name: "Calm Crossing — weak current",     current: { x: 1,   y: 0 }, target: { x: 0,    y: 5 }, tolerance: 0.6 },
        { name: "Drifting River — moderate current", current: { x: 2,   y: 0 }, target: { x: 1,    y: 5 }, tolerance: 0.7 },
        { name: "Strong Rapids — tough current",      current: { x: 3.5, y: 0 }, target: { x: -1.5, y: 5 }, tolerance: 0.8 }
    ],
    facts: [
        "A boat's true path across a river is the vector sum of its own heading and the river's current",
        "Ferry pilots aim their bow upstream of the destination to counteract the current — this is called the 'ferry angle'",
        "The stronger the current, the more a boat drifts off a straight-line course",
        "River currents are usually fastest in the middle of the channel and slowest near the banks"
    ],
    getFacts() { return this.facts; },
    lastResult: null,

    init() {
        createCanvasOnce({ responsive: true });
        labState.boat.current = { ...this.challenges[labState.boat.challengeIndex].current };
        this.lastResult = null;
        this.renderUI();
        this.attachListeners();
        this.updateStats();
    },

    renderUI() {
        setPanel(`
            <div style="color:#4e342e; padding:15px; text-align:center; font-family: sans-serif;">
                <h3 class="lab-title">Boat &amp; River Crossing</h3>
                <p class="viewData">Drag the tip of the boat's velocity vector (red). The green resultant is the boat's real path.</p>
                <select id="challengeSelect" style="padding:6px; border-radius:6px; border:1px solid #bcaaa4; margin-bottom:12px;">
                    ${this.challenges.map((c, i) => `<option value="${i}" ${labState.boat.challengeIndex === i ? 'selected' : ''}>${c.name}</option>`).join('')}
                </select>
                <div class="data-container">
                    ${vectorStatsHTML('boatVel', 'Boat Velocity', '#e74c3c')}
                    ${vectorStatsHTML('current', 'River Current', '#546e7a')}
                    ${vectorStatsHTML('boatR', 'Actual Path (Resultant)', '#2ecc71')}
                </div>
                <button id="setSailBtn" class="refresh-quad-btn" style="margin-top:15px;">Set Sail ⛵</button>
                <div id="boatMsg" class="dashed-container" style="text-align:center; padding:10px; margin-top:12px; min-height:30px; color: #6d4c41;"></div>
            </div>
        `);
    },

    attachListeners() {
        const select = document.getElementById('challengeSelect');
        if (select) select.onchange = (e) => {
            labState.boat.challengeIndex = parseInt(e.target.value);
            labState.boat.current = { ...this.challenges[labState.boat.challengeIndex].current };
            this.lastResult = null;
            const msg = document.getElementById('boatMsg');
            if (msg) msg.innerHTML = '';
            this.updateStats();
            draw();
        };
        const btn = document.getElementById('setSailBtn');
        if (btn) btn.onclick = () => {
            this.lastResult = this.checkChallenge();
            const msg = document.getElementById('boatMsg');
            if (msg) msg.innerHTML = `<b>${this.lastResult.success ? '⚓ ' : '🌊 '}${this.lastResult.message}</b>`;
            draw();
        };
    },

    checkChallenge() {
        const { boatVel, current } = labState.boat;
        const challenge = this.challenges[labState.boat.challengeIndex];
        const actual = vecAdd(boatVel, current);
        if (actual.y <= 0.1) {
            return { success: false, landingX: null, message: "The boat isn't heading across the river — aim it further upward!" };
        }
        const scale = challenge.target.y / actual.y;
        const landingX = actual.x * scale;
        const diff = Math.abs(landingX - challenge.target.x);
        const success = diff <= challenge.tolerance;
        return {
            success, landingX,
            message: success
                ? `You reached the dock! Landed at x = ${fmt(landingX)}`
                : `Missed the dock — landed at x = ${fmt(landingX)}, needed ≈ ${challenge.target.x}`
        };
    },

    updateStats() {
        const { boatVel, current } = labState.boat;
        const R = vecAdd(boatVel, current);
        fillVectorStats('boatVel', boatVel);
        fillVectorStats('current', current);
        fillVectorStats('boatR', R);
    },

    draw(ctx) {
        const cx = canvas.width / 2, cy = canvas.height / 2;
        drawGrid(cx, cy, canvas.width, canvas.height, UNIT);

        const challenge = this.challenges[labState.boat.challengeIndex];
        const { boatVel, current } = labState.boat;
        const R = vecAdd(boatVel, current);

        const farBankY = toCanvas(cx, cy, { x: 0, y: challenge.target.y }).y;
        ctx.fillStyle = "#e3f2fd";
        ctx.fillRect(0, farBankY, canvas.width, cy - farBankY);

        const pDock = toCanvas(cx, cy, challenge.target);
        ctx.beginPath();
        ctx.arc(pDock.x, pDock.y, 9, 0, 7);
        ctx.fillStyle = "#2ecc71";
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#4e342e";
        ctx.font = "bold 12px Arial";
        ctx.fillText("Dock", pDock.x + 10, pDock.y - 10);

        const pOrigin  = toCanvas(cx, cy, { x: 0, y: 0 });
        const pBoat    = toCanvas(cx, cy, boatVel);
        const pCurrent = toCanvas(cx, cy, current);
        const pR       = toCanvas(cx, cy, R);

        ctx.save();
        ctx.setLineDash([4, 4]);
        drawArrow(pOrigin, pCurrent, "#546e7a");
        ctx.restore();

        drawArrow(pOrigin, pBoat, "#e74c3c");
        drawArrow(pOrigin, pR, "#2ecc71");
        drawDragger(pBoat);

        if (this.lastResult && this.lastResult.landingX !== null) {
            const pLand = toCanvas(cx, cy, { x: this.lastResult.landingX, y: challenge.target.y });
            ctx.beginPath();
            ctx.arc(pLand.x, pLand.y, 7, 0, 7);
            ctx.fillStyle = this.lastResult.success ? "#2ecc71" : "#e74c3c";
            ctx.fill();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        this.updateStats();
    }
};
