import { labState, canvas, TAU } from '../state.js';
import { draw, drawDragger, createCanvasOnce } from '../canvas.js';
import { attachDropdownMenu } from '../ui.js';

export const tangentView = {
  radius: `
    <p class="viewData">
      Drag point T around the circle.
    </p>

    <div class="data-container">
      <div style="font-size:0.9em; line-height:1.8;">
        Radius-Tangent Angle:
        <b style="color:#f39c12;">90°</b>
      </div>
    </div>
  `,

  equal: `
    <p class="viewData">
      Drag point P to explore tangent lengths.
    </p>

    <div class="data-container">
      <div style="font-size:0.9em; line-height:1.8;">
        PA = PB = <b style="color:#f39c12;">
          <span id="tanBVal">0</span>
        </b>
      </div>
    </div>
  `
};

export const tangentSecantModule {
    viewMode: "Radius & Tangent",
    elements: {},

    modes: {
        "Radius & Tangent": {
            html: tangentView.radius,
            facts: [
                "A tangent touches a circle at exactly one point.",
                "The radius to a tangent point is always perpendicular to the tangent.",
                "A circle can have infinitely many tangents."
            ]
        },
        "Equal Tangents": {
            html: tangentView.equal,
            facts: [
                "Tangents from the same external point are equal.",
                "This theorem is often used to prove quadrilaterals are cyclic."
            ]
        }
    },
    getFacts() { return this.modes[this.viewMode]?.facts; },
    init() {
        createCanvasOnce();
        const panel = document.getElementById("dataPanel");
        panel.innerHTML = `
            <div class="menu-container">
                <button id="show-btn">Show ▼</button>
                <div id="dropdown-menu">
                    ${Object.keys(this.modes).map(mode =>
                        `<div class="menu-item" data-mode="${mode}">${mode}</div>`
                    ).join("")}
                </div>
            </div>
            <div style="padding:15px;">
                <h3 class="lab-title">Tangents & Secants Lab</h3>
                <div id="dynamic-content"></div>
            </div>`;

        this.updateView();
        attachDropdownMenu((mode) => {    // ← uses the new shared helper
            this.viewMode = mode;
            this.updateView();
            draw();
        });
    },
  
    updateView() {
        const container = document.getElementById("dynamic-content");
        container.innerHTML = this.modes[this.viewMode].html;
        if (this.viewMode === "Equal Tangents") {
            this.elements.bVal = document.getElementById("tanBVal");
        }
        this.updateStats();
    },

    updateStats() {
        if (this.viewMode !== "Equal Tangents") return;
        const d = labState.tangents.pointDistance;
        const r = 110;
        const length = Math.sqrt(d * d - r * r).toFixed(1);
        if (this.elements.bVal) this.elements.bVal.textContent = length;
    },

    draw(ctx) {
        const cx = canvas.width / 2, cy = canvas.height / 2;
        const r = 110;

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, TAU);
        ctx.strokeStyle = "#bcaaa4";
        ctx.lineWidth = 2;
        ctx.stroke();

        if (this.viewMode === "Radius & Tangent") {
            const t = labState.tangents.tangentAngle;
            const px = cx + r * Math.cos(t), py = cy + r * Math.sin(t);
            const tx = -Math.sin(t),         ty = Math.cos(t);

            ctx.beginPath();
            ctx.moveTo(px - tx * 150, py - ty * 150);
            ctx.lineTo(px + tx * 150, py + ty * 150);
            ctx.strokeStyle = "#f39c12";
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(px, py);
            ctx.strokeStyle = "#4e342e";
            ctx.stroke();

            drawDragger({ x: px, y: py });
          
        } else {
            const angle = labState.tangents.pointAngle;
            const dist = labState.tangents.pointDistance;
            const px = cx + dist * Math.cos(angle), py = cy + dist * Math.sin(angle);
            const alpha = Math.acos(r / dist);
            const centerAngle = Math.atan2(py - cy, px - cx);
            const a = centerAngle + alpha, b = centerAngle - alpha;
            const ax = cx + r * Math.cos(a), ay = cy + r * Math.sin(a);
            const bx = cx + r * Math.cos(b), by = cy + r * Math.sin(b);

            ctx.beginPath();
            ctx.moveTo(px, py); ctx.lineTo(ax, ay);
            ctx.moveTo(px, py); ctx.lineTo(bx, by);
            ctx.strokeStyle = "#f39c12";
            ctx.lineWidth = 3;
            ctx.stroke();

            drawDragger({ x: px, y: py });
            this.updateStats();
        }
    }
};
