// modules/congruence.js Congruence lab module

import { labState, canvas, ctx } from '../state.js';
import { draw, createCanvasOnce } from '../canvas.js';
import { generateRandomGoal } from '../math.js';

export const congruenceModule = {
    facts: [
        "In the middle ages, if a student couldn't master the proof of the Isosceles Triangle Congruence Theorem, it was proof they weren't smart enough for advanced mathematics",
        "Congruence is the secret behind Origami!",
        "Honeybees build congruent hexagonal cells that fit perfectly together, maximizing strength and space efficiency"
    ],
    getFacts() { return this.facts; },
    init() {
        createCanvasOnce();
        if (!labState.congruence.mode) labState.congruence.mode = 'SSS';
        renderCongruenceUI();
        draw();
    },
    draw(ctx) {
        drawCongruence();
    }
};

export function attachCongListeners() {
    const inputs = document.querySelectorAll('#cong-sliders input');
    const idToKey = { sideC: 'c', sideB: 'b', angleA: 'a', angleB: 'angleB' };
    inputs.forEach(input => {
        input.addEventListener('input', function () {
            const val = parseInt(this.value);
            const key = idToKey[this.id];
            if (key) labState.congruence.tri[key] = val;
            const label = document.getElementById('val' + this.id);
            if (label) label.innerText = val;
            draw();
        });
    });
}

export function renderCongruenceUI() {
    const dataPanel = document.getElementById("dataPanel");
    if (!dataPanel) return;

    dataPanel.innerHTML = `
        <div id="cong-controls" style="color: #4e342e; padding: 15px;">
            <h3 class="lab-title">Congruence Lab</h3>
            <p class="viewData">Choose a Case & Match the Target!</p>
            <div style="display: flex; gap: 8px; margin-bottom: 20px;">
                ${['SSS', 'SAS', 'ASA'].map(m => {
                    const active = labState.congruence.mode === m;
                    return `<button onclick="setCongMode('${m}')" style="flex:1; padding:10px; cursor:pointer; border:1px solid #ff9800; border-radius:6px; font-weight:bold; background:${active ? '#ff9800' : '#f5f5f5'}; color:${active ? 'white' : '#616161'}; transition: 0.3s; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">${m}</button>`;
                }).join('')}
            </div>
            <div style="width: 70%; margin: 0 auto; min-width: 250px;">
                <div id="cong-sliders">${generateCongSliders()}</div>
            </div>
            <div id="cong-msg" class="dashed-container" style="text-align:center; padding:12px; margin-top:15px; min-height:45px; color: #6d4c41;"></div>
        </div>
    `;
    attachCongListeners();
}

export function generateCongSliders() {
    const configs = {
        SSS: [['sideC', 'Base (C)', 5, 20, labState.congruence.tri.c], ['sideB', 'Side (B)', 4, 15, labState.congruence.tri.b]],
        SAS: [['sideC', 'Base (C)', 5, 20, labState.congruence.tri.c], ['sideB', 'Side (B)', 4, 15, labState.congruence.tri.b], ['angleA', 'Angle (∠A)', 30, 120, labState.congruence.tri.a]],
        ASA: [['angleA', 'Angle (∠A)', 30, 75, labState.congruence.tri.a], ['sideC', 'Base (C)', 5, 15, labState.congruence.tri.c], ['angleB', 'Angle (∠B)', 30, 75, labState.congruence.tri.angleB]]
    };
    return (configs[labState.congruence.mode] || []).map(conf => createCongSlider(...conf)).join('');
}

export function createCongSlider(id, label, min, max, val) {
    return `
        <div style="margin-bottom:12px;">
            <label style="display:block; font-size:0.85em; color: #4e342e;">${label}: <span id="val${id}" style="color:#ff9800; font-weight:bold;">${val}</span></label>
            <input type="range" id="${id}" min="${min}" max="${max}" value="${val}" class="lab-slider" style="accent-color:#ff9800;">
        </div>`;
}

// window.setCongMode stays global so the onclick in the HTML button string can reach it
window.setCongMode = function (mode) {
    labState.congruence.mode = mode;
    generateRandomGoal(mode);
    renderCongruenceUI();
    draw();
};

export function drawCongruence() {
    const { tri, mode, targets } = labState.congruence;
    const target = targets[mode];
    const halfWidth = canvas.width / 2;
    const safeScale = 9.5;
    const yPos = canvas.height * 0.7; // Places triangles at 70% of canvas height

    const getTriangleMetrics = (t) => { // Centers triangle correctly
        const radA = (t.a || 0) * 0.0174533;
        let effectiveSideB = t.b || 0; // Law of sines
        if (mode === 'ASA' && t.angleB) {
            const radB = t.angleB * 0.0174533;
            const sinC = Math.sin(Math.PI - radA - radB);
            effectiveSideB = sinC > 0 ? (t.c * Math.sin(radB)) / sinC : 0;
        }
        const leftSwing = t.a > 90 ? Math.abs(Math.cos(radA) * effectiveSideB * safeScale) : 0;
        return { totalWidth: (t.c * safeScale) + leftSwing, offset: leftSwing };
    };

    const userMetrics   = getTriangleMetrics(tri);
    const targetMetrics = getTriangleMetrics(target);
    const startX_User   = (halfWidth - userMetrics.totalWidth) / 2 + userMetrics.offset;
    const startX_Target = halfWidth + (halfWidth - targetMetrics.totalWidth) / 2 + targetMetrics.offset;
    const isMatched     = checkCongruence(tri, target, mode);

    ctx.setLineDash([5, 5]); ctx.strokeStyle = "#4e342e22";
    ctx.beginPath(); ctx.moveTo(halfWidth, 20); ctx.lineTo(halfWidth, canvas.height - 20); ctx.stroke();
    ctx.setLineDash([]);

    drawTriangleShape(tri,    startX_User,   yPos, isMatched ? "#e65100" : "#4e342e",    "Your Triangle", isMatched, safeScale);
    drawTriangleShape(target, startX_Target, yPos, isMatched ? "#e65100" : "#bcaaa4aa",  "Target",        false,     safeScale);
    updateCongruenceMessage(isMatched, target, mode);
}

export function drawTriangleShape(d, x, y, color, label, glow, scale) {
    const radA = (d.a || 0) * 0.0174533, cosA = Math.cos(-radA), sinA = Math.sin(-radA);
    let sB = (d.b || 0);
    if (d.angleB && labState.congruence.mode === 'ASA') {
        const sinC = Math.sin(Math.PI - radA - (d.angleB * 0.0174533));
        if (sinC !== 0) sB = (d.c * Math.sin(d.angleB * 0.0174533)) / sinC;
    }
    const p3x = x + cosA * sB * scale, p3y = y + sinA * sB * scale;
    ctx.save();
    if (glow) { ctx.shadowBlur = 15; ctx.shadowColor = "#e65100"; }
    ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 4;
    ctx.moveTo(x, y); ctx.lineTo(x + d.c * scale, y); ctx.lineTo(p3x, p3y);
    ctx.closePath(); ctx.stroke();
    ctx.fillStyle = color + "1A"; ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#6d4c41aa"; ctx.font = "bold 12px Arial";
    ctx.fillText(label, x, y + 25);
}

export function checkCongruence(tri, target, mode) {
    const dC = Math.abs(labState.congruence.tri.c - target.c);
    const dB = Math.abs(labState.congruence.tri.b - target.b);
    const dA = Math.abs(labState.congruence.tri.a - target.a);
    if (mode === 'SSS') return dC < 0.5 && dB < 0.5;
    if (mode === 'SAS') return dC < 0.5 && dB < 0.5 && dA < 1;
    if (mode === 'ASA') return dA < 1 && dC < 0.5 && Math.abs(tri.angleB - target.angleB) < 1;
    return false;
}

export function updateCongruenceMessage(isMatched, target, mode) {
    const msg = document.getElementById('cong-msg');
    if (!msg) return;
    msg.innerHTML = isMatched
        ? `<b>✨ CONGRUENT! ✨</b>`
        : (mode === 'ASA'
            ? `Goal: ∠A=${target.a}°, C=${target.c}, ∠B=${target.angleB}°`
            : `Goal: C=${target.c}, B=${target.b}${mode === 'SAS' ? ', A=' + target.a + '°' : ''}`);
}
