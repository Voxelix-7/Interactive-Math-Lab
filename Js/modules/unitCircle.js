import { canvas, labState } from "../state.js";
import { createCanvasOnce, draw, drawDragger } from "../canvas.js";
import { setCurrentModule } from "../state.js";
import { setPanel } from "../ui.js";

export const unitCircleModule = {

    init() {
        createCanvasOnce();

        setCurrentModule(this);

        this.renderUI();

        draw();
    },

    renderUI() {

        setPanel(`
        <div class="data-container">

        <h3>Unit Circle</h3>

        <p><b>Angle:</b>
        <span id="uc-angle">
        ${(labState.unitCircle.angle * 180 / Math.PI).toFixed(0)}°
        </span></p>

        <p>
        Drag the orange point around the circle.
        </p>

        </div>
        `);

    },

    draw(ctx) {

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        const r = labState.unitCircle.radius;

        const angle = labState.unitCircle.angle;

        const x = cx + r * Math.cos(angle);

        const y = cy - r * Math.sin(angle);

        ctx.lineWidth = 3;

        ctx.strokeStyle = "#ff4fd8";

        ctx.beginPath();
        ctx.moveTo(cx - r - 80, cy);
        ctx.lineTo(cx + r + 80, cy);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx, cy - r - 40);
        ctx.lineTo(cx, cy + r + 40);
        ctx.stroke();

        ctx.strokeStyle = "#245BFF";

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "white";
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.strokeStyle = "#18ff4d";

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, cy);
        ctx.stroke();

        const dx = Math.cos(angle);
        const dy = -Math.sin(angle);

        const tx = -dy;
        const ty = dx;

        const L = 70;

        ctx.strokeStyle = "white";

        ctx.beginPath();

        ctx.moveTo(
            x - tx * L,
            y - ty * L
        );

        ctx.lineTo(
            x + tx * L,
            y + ty * L
        );

        ctx.stroke();

        drawDragger({
            x,
            y
        });

        const angleLabel = document.getElementById("uc-angle");

        if (angleLabel)
            angleLabel.textContent =
            (angle * 180 / Math.PI).toFixed(0) + "°";

    },

    getFacts() {

        return [

            "The unit circle always has a radius of exactly 1.",

            "Every point on the unit circle is (cos θ, sin θ).",

            "The unit circle connects geometry and trigonometry."

        ];

    }

};
