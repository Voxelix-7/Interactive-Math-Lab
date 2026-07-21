// modules/unitCircle.js — Unit Circle lab module

import { labState, canvas, TAU, RAD2DEG } from '../state.js';
import { draw, createCanvasOnce, drawDragger } from '../canvas.js';

export const unitCircleModule = {
    elements: {},
    facts: [
        "The word 'sine' comes from a mistranslation: an Arabic word for 'bowstring' or 'chord' was translated into Latin as 'sinus', meaning bay or fold",
        "The unit circle has a radius of exactly 1, which makes the coordinates of any point on it simply (cos θ, sin θ)",
        "Tangent gets its name from the tangent line to a circle, since tan(θ) can be represented as a line segment tangent to the unit circle",
        "Ancient Greek astronomers built the first trig tables not for triangles, but to track the motion of stars and planets",
        "tan(θ) becomes undefined at 90° and 270°, exactly where cos(θ) = 0, since tangent is sine divided by cosine"
    ],
    getFacts() { return this.facts; },

    init() {
        createCanvasOnce();
        this.renderUI();
        this.updateStats();
    },

    renderUI() {
        const dataPanel = document.getElementById("dataPanel");
        if (!dataPanel) return;
        dataPanel.innerHTML = `
            <div style="color:#4e342e; padding:15px; text-align:center; font-family: sans-serif;">
                <h3 class="lab-title">Unit Circle</h3>
                <p class="viewData">Drag the point around the circle to explore sine, cosine, and tangent.</p>
                <div class="data-container">
                    <div style="font-size:0.95em; line-height:1.9;">
                        Angle (θ): <b style="color:#f39c12;"><span id="valDeg">0</span>° / <span id="valRad">0</span> rad</b><br>
                        sin(θ): <b style="color:#e74c3c;"><span id="valSin">0</span></b><br>
                        cos(θ): <b style="color:#3498db;"><span id="valCos">0</span></b><br>
                        tan(θ): <b style="color:#4caf50;"><span id="valTan">0</span></b>
                    </div>
                </div>
                <p class="lab-note">The point's coordinates are (cos θ, sin θ). Drag it around the circle.</p>
            </div>
        `;
        this.elements.vDeg = document.getElementById("valDeg");
        this.elements.vRad = document.getElementById("valRad");
        this.elements.vSin = document.getElementById("valSin");
        this.elements.vCos = document.getElementById("valCos");
        this.elements.vTan = document.getElementById("valTan");
    },

    updateStats() {
        const { vDeg, vRad, vSin, vCos, vTan } = this.elements;
        if (!vDeg || !vRad || !vSin || !vCos || !vTan) return;
        const theta = labState.unitCircle.angle;
        const sinVal = Math.sin(theta);
        const cosVal = Math.cos(theta);
        vDeg.innerText = Math.round(theta * RAD2DEG);
        vRad.innerText = (theta / Math.PI).toFixed(2) + "π";
        vSin.innerText = sinVal.toFixed(2);
        vCos.innerText = cosVal.toFixed(2);
        vTan.innerText = Math.abs(cosVal) < 0.001 ? "undefined" : (sinVal / cosVal).toFixed(2);
    },

    draw(ctx) {
        const cx = canvas.width / 2, cy = canvas.height / 2;
        const r = labState.unitCircle.radius;
        const theta = labState.unitCircle.angle;

        // Point on circle (standard math convention: CCW from positive x-axis, y flipped for screen)
        const px = cx + r * Math.cos(theta);
        const py = cy - r * Math.sin(theta);

        // 1. Static main circle
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, TAU);
        ctx.strokeStyle = "#bcaaa4aa";
        ctx.lineWidth = 2;
        ctx.stroke();

        // 2. Horizontal & vertical axes through the center
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "#4e342e55";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - r - 20, cy);
        ctx.lineTo(cx + r + 20, cy);
        ctx.moveTo(cx, cy - r - 20);
        ctx.lineTo(cx, cy + r + 20);
        ctx.stroke();
        ctx.restore();

        // 3. Cosine segment (center to foot, horizontal)
        ctx.beginPath();
        ctx.strokeStyle = "#3498db";
        ctx.lineWidth = 3;
        ctx.moveTo(cx, cy);
        ctx.lineTo(px, cy);
        ctx.stroke();

        // 4. Sine segment (foot to point, vertical)
        ctx.beginPath();
        ctx.strokeStyle = "#e74c3c";
        ctx.lineWidth = 3;
        ctx.moveTo(px, cy);
        ctx.lineTo(px, py);
        ctx.stroke();

        // 5. Radius / hypotenuse (center to point)
        ctx.beginPath();
        ctx.strokeStyle = "#f39c12";
        ctx.lineWidth = 3;
        ctx.moveTo(cx, cy);
        ctx.lineTo(px, py);
        ctx.stroke();

        // 6. Draggable point + label
        drawDragger({ x: px, y: py });
        ctx.fillStyle = "#4e342e";
        ctx.font = "bold 14px Arial";
        ctx.fillText("P", px + 12, py - 12);

        this.updateStats();
    }
};
