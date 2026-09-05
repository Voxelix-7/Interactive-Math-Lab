import { labState, canvas, ctx } from '../state.js';
import { polygonNames } from '../state.js';
import { draw, createCanvasOnce } from '../canvas.js';

export const polygonModule = {
    facts: [
        "At age 19, Gauss proved that a regular 17-sided polygon (a heptadecagon) can be constructed using only a compass and straightedge",
        "The British 50p and 20p coins look round when rolling, but they're actually heptagons",
        "The more sides a regular polygon gains the more circular it gets!",
        "The British 50p and 20p coins are Reuleaux Polygons, they have the same diameter at any angle, so they work perfectly in vending machines",
        "The apeirogon is the theoretical beast that comes closest to being a circle (has infinite sides)",
        "A regular polygon can be divided from its center into congruent triangles, with one triangle for each side"
    ],
    getFacts() { return this.facts; },
    init() {
        createCanvasOnce();
        renderPolygonUI();
    },
    draw(ctx) {
        const { sides: n, radius: r, showDecomposition: show } = labState.polygons;
        const cx = canvas.width / 2, cy = canvas.height / 2;
        const points = [], step = (2 * Math.PI) / n;

        for (let i = 0; i < n; i++) {
            const angle = i * step - Math.PI / 2;
            points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setLineDash([]);

        if (show) {
            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = "rgba(129, 199, 132, 0.8)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i < n; i++) {
                ctx.moveTo(cx, cy);
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();
            ctx.restore();
        }

        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#4e342e";
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < n; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.closePath();
        ctx.stroke();

        points.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, 6.29);
            ctx.fillStyle = "#f39c12";
            ctx.fill();
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        const sideLength = 2 * r * Math.sin(Math.PI / n) / 10;
        updatePolygonStats(n, sideLength);
    }
};

export function calcPolySideCm(radius, sides) {
    return (2 * radius * Math.sin(Math.PI / sides) / 10).toFixed(1);
}

export function attachPolyListeners() {
    const sidesSlider  = document.getElementById('sidesSlider');
    const radiusSlider = document.getElementById('radiusSlider');
    const decompCheck  = document.getElementById('decompCheck');

    if (sidesSlider) sidesSlider.addEventListener('input', function () {
        labState.polygons.sides = +this.value;
        document.getElementById('valSideCount').textContent = this.value;
        document.getElementById('valSide').textContent = calcPolySideCm(labState.polygons.radius, labState.polygons.sides);
        draw();
    });
    if (radiusSlider) radiusSlider.addEventListener('input', function () {
        labState.polygons.radius = +this.value;
        document.getElementById('valSide').textContent = calcPolySideCm(labState.polygons.radius, labState.polygons.sides);
        draw();
    });
    if (decompCheck) decompCheck.addEventListener('change', function () {
        labState.polygons.showDecomposition = this.checked;
        draw();
    });
}

export function updatePolygonStats(n, sideCm) {
    const stats = document.getElementById("polyStats");
    if (!stats) return;
    const perimeter     = n * sideCm;
    const interiorAngle = (n - 2) * 180 / n;
    const area          = (n * Math.pow(sideCm, 2)) / (4 * Math.tan(Math.PI / n));
    stats.innerHTML = `
        <div style="text-align: center; width: 100%;">
            <b>${polygonNames[n] || n + '-sided polygon'} properties:</b><br>
            Side: ${sideCm.toFixed(1)} cm | Perimeter: ${perimeter.toFixed(1)} cm<br>
            Int. Angle: ${interiorAngle.toFixed(0)}°<br>
            Area: <b>${area.toFixed(1)}</b> cm²
        </div>`;
}

export function renderPolygonUI() {
    const dataPanel = document.getElementById("dataPanel");
    if (!dataPanel) return;
    const { sides: polySides, radius: polyRadius, showDecomposition } = labState.polygons;
    const currentSideCm = (2 * polyRadius * Math.sin(Math.PI / polySides) / 10).toFixed(1);

    dataPanel.innerHTML = `
        <div id="poly-controls" style="color: #4e342e; padding: 15px; background: transparent;">
            <h3 class="lab-title"> Polygon Explorer</h3>
            <div style="width: 66%; margin: 0 auto;">
                <div style="margin-bottom:15px;">
                    <label style="display:block; font-size:0.85em; color: #4e342e;">Number of Sides: <span id="valSideCount">${polySides}</span></label>
                    <input type="range" id="sidesSlider" min="3" max="12" value="${polySides}" class="lab-slider" style="accent-color:#f39c12;">
                </div>
                <div style="margin-bottom:15px;">
                    <label style="display:block; font-size:0.85em; color: #4e342e;">Adjust Size (Side: <span id="valSide">${currentSideCm}</span> cm)</label>
                    <input type="range" id="radiusSlider" min="40" max="150" value="${polyRadius}" class="lab-slider" style="accent-color:#f39c12;">
                </div>
                <div class="control-row">
                    <input type="checkbox" id="decompCheck" ${showDecomposition ? 'checked' : ''} class="lab-checkbox">
                    <label style="font-size:0.85em; cursor: pointer; color: #6d4c41;" for="decompCheck">Show Triangle Decomposition</label>
                </div>
            </div>
            <div id="polyStats" class="dashed-container" style="text-align:left; padding:12px; color: #6d4c41; min-height: 100px;"></div>
        </div>
        <p class="lab-note">
            The area of a regular polygon with n number of sides and length of its side is X is:
            ¼ nx² cot π/n.
        </p>`;
    attachPolyListeners();
    updatePolygonStats(polySides, parseFloat(currentSideCm));
}
