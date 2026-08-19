// modules/circles.js Circle Properties lab module

import { labState, canvas } from '../state.js';
import { getCircleProps } from '../math.js';
import { draw, createCanvasOnce } from '../canvas.js';

export const circleModule = {
    facts: [
        "In 1897 an American proposed law nearly redefined π to 3.2 setting it to 3.2 by mistake. (Historic embarrassment)",
        "For centuries, ancient mathematicians were obsessed with squaring the circle, they proved in 1882 that constructing a square equal in area to a circle with only a compass and straightedge is impossible"
    ],
    getFacts() { return this.facts; },
    init() {
        createCanvasOnce();
        labState.circles.radiusCm = 5;
        renderCirclePropertiesUI();
    },
    updateRadius(r) { labState.circles.radiusCm = r; },
    getProps()      { return getCircleProps(labState.circles.radiusCm); },
    draw(ctx) {
        const drawingScale = 15;
        const rPx    = labState.circles.radiusCm * drawingScale;
        const centerX = canvas.width  / 2;
        const centerY = canvas.height / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, rPx, 0, Math.PI * 2);
        ctx.strokeStyle = "#d35400";
        ctx.lineWidth   = 3;
        ctx.stroke();
        ctx.fillStyle = "rgba(211, 84, 0, 0.1)";
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + rPx, centerY);
        ctx.strokeStyle = "#4e342e";
        ctx.lineWidth   = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#4e342e";
        ctx.fill();
        ctx.fillStyle   = "#4e342e";
        ctx.font        = "bold 14px Arial";
        ctx.textAlign   = "center";
        ctx.fillText(`Radius: ${labState.circles.radiusCm.toFixed(1)} cm`, centerX, centerY - rPx - 15);
        ctx.restore();
    }
};

export function renderCirclePropertiesUI() {
    const dataPanel = document.getElementById("dataPanel");
    if (!dataPanel) return;
    dataPanel.innerHTML = `
        <div id="circle-controls" style="color: #4e342e; padding: 15px; background: transparent;">
            <h3 class="lab-title">Circle Properties</h3>
            <div style="width: 66%; max-width: 100%; margin: 0 auto;">
                <div style="margin-bottom:15px;">
                    <label style="display:block; font-size:0.85em; color: #4e342e;">
                        Radius (r): <span id="valR" style="color:#f39c12; font-weight:bold;">5.0</span> cm
                    </label>
                    <input type="range" id="circleRadiusSlider" min="1" max="10" step="0.1" value="5"
                              class="lab-slider" style="accent-color:#f39c12;">
                </div>
            </div>
            <div id="circleStats" class="dashed-container" style="text-align:left; padding:12px; color: #6d4c41; min-height: 100px;">
                <div style="text-align: center; width: 100%;">
                    <div style="font-size:0.9em; line-height: 1.8; color: #4e342e;">
                        Diameter (d): <b><span id="statD">10.0</span></b> cm<br>
                        Circumference (C): <b><span id="statC">31.4</span></b> cm<br>
                        <div class="data-divider">
                            Area (A): <b style="font-size:1.1em; color:#bf360c;"><span id="statA">78.5</span></b> cm²
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    attachCircleListeners();
}

export function attachCircleListeners() {
    // Creating 5 constants at once
    const rIn = document.getElementById("circleRadiusSlider"),
          vR  = document.getElementById("valR"),
          sD  = document.getElementById("statD"),
          sC  = document.getElementById("statC"),
          sA  = document.getElementById("statA");

    if (rIn) {
        rIn.oninput = (e) => {
            const r = parseFloat(e.target.value);
            labState.circles.radiusCm = r;
            if (vR) vR.innerText = r.toFixed(1);
            const props = getCircleProps(r);
            if (sD) sD.innerText = props.d.toFixed(1);
            if (sC) sC.innerText = props.c.toFixed(1);
            if (sA) sA.innerText = props.a.toFixed(1);
            draw();
        };
    }
}
