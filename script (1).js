/* --- Global Variables & State Management --- */
let canvas, ctx;
let sideA = 120;
let sideB = 100;
let currentModule = null;
let dragging = null;
const originX = 180, originY = 250, cmToPx = 37.8;
const polygonNames = {
  3: "Triangle", 4: "Quadrilateral", 5: "Pentagon", 6: "Hexagon",
  7: "Heptagon", 8: "Octagon", 9: "Nonagon", 10: "Decagon", 
  11: "Hendecagon", 12: "Dodecagon"
};

let labState = {
    active: 'none', 
    mode: 'SAS',    
    tri: { c: 10, b: 8, a: 60, angleB: 60 },    
    targets: {
        SSS: { c: 12, b: 9, a: 45 },
        SAS: { c: 10, b: 7, a: 70 },
        ASA: { c: 14, a: 50, angleB: 65 }
    },
    polySides: 6,
    polyRadius: 100,
    showDecomposition: false,
    circleRadiusCm: 5, // Circle
    circleRotation: 0, 
    isRolling: false,
  
    anglePoints: {
      A: 0,
      B: 1.5,
      C: 3.5,
      isTangent: false,
      radius: 110
    }
};

/* --- Core Lab Infrastructure --- */
function resetLab() {
    const container = document.getElementById("canvas-container");
    const dataPanel = document.getElementById("dataPanel");
    if (container) container.innerHTML = ""; 
    ctx = null; canvas = null;
    if (dataPanel) dataPanel.innerHTML = '<p class="dataP">Laws and theorems will appear here.</p>';
    labState.circleRotation = 0;
    currentModule = null;
}

function generateRandomGoal(mode) {
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    if (mode === 'SSS' || mode === 'SAS') {
        labState.targets[mode] = { c: rand(8, 15), b: rand(5, 12), a: rand(30, 90) };
    } else if (mode === 'ASA') {
        labState.targets.ASA = { c: rand(10, 15), a: rand(30, 70), angleB: rand(30, 70) };
    }
}

/* --- Pythagoras Logic --- */
function setupCalculation() {
    const inputA = document.getElementById("inputA");
    const inputB = document.getElementById("inputB");
    if (!inputA || !inputB) return;
    
    const processValue = (input) => {
        let val = parseFloat(input.value) || 1;
        return Math.max(1, Math.min(500, val));
    };
    function update() {
        if (inputA.value === "" || inputB.value === "") return;
        sideA = processValue(inputA);
        sideB = processValue(inputB);
        inputA.value = sideA.toFixed(0);
        inputB.value = sideB.toFixed(0);
        draw();
        updateVisualProof();
    }
    inputA.addEventListener("input", update);
    inputB.addEventListener("input", update);
}

/* --- App Initialization --- */
window.onload = function() {
    ['SSS', 'SAS', 'ASA'].forEach(generateRandomGoal);

    const startBtn = document.getElementById("startBtn");
    const welcomeScreen = document.querySelector(".welcome-screen");
    const labInterface = document.getElementById("lab-interface");
    const geometryBtn = document.getElementById("geometryBtn");
    const geoDropdown = document.getElementById("geoDropdown");
    const circlesBtn = document.getElementById("circlesBtn");
    const circlesDropdown = document.getElementById("circlesDropdown");

    const closeAllMenus = () => {
        if (geoDropdown) geoDropdown.classList.remove("show-menu");
        if (circlesDropdown) circlesDropdown.classList.remove("show-menu");
    };

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            welcomeScreen.style.display = "none";
            labInterface.style.display = "flex";
            setTimeout(() => labInterface.classList.add("fade"), 10);
        });
    }
  
    const toggleMenu = (btn, menu, otherMenu) => {
        if (btn && menu) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                menu.classList.toggle("show-menu");
                if (otherMenu) otherMenu.classList.remove("show-menu");
            });
        }
    };
    toggleMenu(geometryBtn, geoDropdown, circlesDropdown);
    toggleMenu(circlesBtn, circlesDropdown, geoDropdown);

    document.addEventListener('click', (e) => {
        if (geoDropdown && !geometryBtn.contains(e.target)) 
          geoDropdown.classList.remove("show-menu");
        if (circlesDropdown && !circlesBtn.contains(e.target)) 
          circlesDropdown.classList.remove("show-menu");
    });

    const setupLab = (id, callback) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', () => {
                callback();
                closeAllMenus();
            });
        }
    };

    /* --- Lab Assignments --- */
    setupLab("pythagorasBtn", () => {
        resetLab();
        currentModule = pythagorasModule;
        pythagorasModule.init();
        draw();
    });

    setupLab("congruenceBtn", () => {
        resetLab();
        currentModule = congruenceModule;
        congruenceModule.init();
        draw();
    });

    setupLab("polygonBtn", () => typeof startPolygonLab === 'function' && startPolygonLab());
    setupLab("circlePropsBtn", () => typeof startCirclePropertiesLab === 'function' && startCirclePropertiesLab());
    setupLab("subtendedAnglesBtn", () => {
    resetLab();
    currentModule = subtendedAnglesModule;
    subtendedAnglesModule.init();
    draw();
});
};

/* --- Canvas Boilerplate --- */
function createCanvasOnce() {
    const container = document.getElementById("canvas-container");
    if (!container || document.getElementById("myCanvas")) return;

    const newCanvas = document.createElement('canvas');
    newCanvas.id = "myCanvas";
    newCanvas.width = 550;
    newCanvas.height = 400;
    container.appendChild(newCanvas);

    canvas = newCanvas;
    ctx = canvas.getContext("2d");

    const attachEvents = (target, events, handler) => {
        events.forEach(evt => target.addEventListener(evt, handler, { passive: false }));
    };

    attachEvents(canvas, ["mousedown"], startDrag);
    attachEvents(window, ["mousemove"], drag);
    attachEvents(window, ["mouseup"], stopDrag);
    attachEvents(canvas, ["touchstart"], startDrag);
    attachEvents(window, ["touchmove"], drag);
    attachEvents(window, ["touchend"], stopDrag);

    draw();
}

/* --- Congruence Module --- */
function renderCongruenceUI() {
    const dataPanel = document.getElementById("dataPanel");
    if (!dataPanel) return;

    dataPanel.innerHTML = `
        <div id="cong-controls" style="color: #4e342e; background: transparent; padding: 15px;">
            <h3 style="color: black; margin-top: 0; font-weight: bold; text-align: center;">Congruence Lab</h3>
            <p style="font-size: 0.8em; margin-bottom: 15px; color: #6d4c41; text-align: center;">Choose a Case & Match the Target!</p>
            <div style="display: flex; gap: 8px; margin-bottom: 20px;">
                ${['SSS', 'SAS', 'ASA'].map(m => {
                    const active = labState.mode === m;
                    return `<button onclick="setCongMode('${m}')" style="flex:1; padding:10px; cursor:pointer; border:1px solid #ff9800; border-radius:6px; font-weight:bold; background:${active ? '#ff9800' : '#f5f5f5'}; color:${active ? 'white' : '#616161'}; transition: 0.3s; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">${m}</button>`;
                }).join('')}
            </div>
            <div style="width: 70%; margin: 0 auto; min-width: 250px;"> 
                <div id="cong-sliders">${generateCongSliders()}</div>
            </div>
            <div id="cong-msg" style="text-align:center; padding:12px; border:2px dashed #bcaaa4; border-radius:8px; margin-top:15px; min-height:45px; background: rgba(239, 235, 233, 0.3); color: #6d4c41;"></div>
        </div>
    `;
    attachCongListeners();
}

function generateCongSliders() {
    const configs = {
        SSS: [['sideC', 'Base (C)', 5, 20, labState.tri.c], ['sideB', 'Side (B)', 4, 15, labState.tri.b]],
        SAS: [['sideC', 'Base (C)', 5, 20, labState.tri.c], ['sideB', 'Side (B)', 4, 15, labState.tri.b], ['angleA', 'Angle (∠A)', 30, 120, labState.tri.a]],
        ASA: [['angleA', 'Angle (∠A)', 30, 75, labState.tri.a], ['sideC', 'Base (C)', 5, 20, labState.tri.c], ['angleB', 'Angle (∠B)', 30, 75, labState.tri.angleB]]
    };
    return (configs[labState.mode] || []).map(conf => createCongSlider(...conf)).join('');
}

function createCongSlider(id, label, min, max, val) {
    return `
        <div style="margin-bottom:12px;">
            <label style="display:block; font-size:0.85em; color: #4e342e;">${label}: <span id="val${id}" style="color:#ff9800; font-weight:bold;">${val}</span></label>
            <input type="range" id="${id}" min="${min}" max="${max}" value="${val}" style="width:100%; accent-color:#ff9800; cursor: pointer;">
        </div>`;
}

window.setCongMode = function(mode) {
    labState.mode = mode;
    generateRandomGoal(mode); 
    renderCongruenceUI();
    draw();
};

function attachCongListeners() {
    const inputs = document.querySelectorAll('#cong-sliders input');
    const idToKey = { sideC: 'c', sideB: 'b', angleA: 'a', angleB: 'angleB' };
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            const val = parseInt(this.value);
            const key = idToKey[this.id];
            if (key) labState.tri[key] = val;
            const label = document.getElementById('val' + this.id);
            if (label) label.innerText = val;
            draw();
        });
    });
}

/* --- Modules Definitions --- */
const pythagorasModule = {
    init() {
        createCanvasOnce();
        const dataPanel = document.getElementById("dataPanel");
        if (dataPanel) {
            dataPanel.innerHTML = `<h3>Pythagorean Theorem</h3><p class="rule">a² + b² = c²</p><div class="inputs"><div class="input-group"><label>Side a</label><input type="number" id="inputA" value="120"></div><div class="input-group"><label>Side b</label><input type="number" id="inputB" value="100"></div></div><div id="result" class="result show"></div>`;
        }
        setupCalculation();
        updateVisualProof();
    },
    draw(ctx) {
        const s = getDynamicScale(sideA, sideB);
        const Ax = originX, Ay = originY;
        const B = { x: Ax + sideA * s, y: Ay };
        const C = { x: Ax, y: Ay - sideB * s };
        drawSimpleSquare({x: Ax, y: Ay}, C, "#3498db", -1); // Side B
        drawSimpleSquare({x: Ax, y: Ay}, B, "#e74c3c", 1);
        drawHypotenuseSquare(B, C, "#2ecc71");
        ctx.beginPath();
        ctx.strokeStyle = "#4e342e";
        ctx.lineWidth = 3;
        ctx.moveTo(Ax, Ay);
        ctx.lineTo(B.x, B.y);
        ctx.lineTo(C.x, C.y);
        ctx.closePath();
        ctx.stroke();
        ctx.strokeRect(Ax, Ay - 12, 12, 12); // Right angle mark
        drawDragger(B);
        drawDragger(C);
        ctx.fillStyle = "#4e342e";
        ctx.font = "bold 14px Arial";
        ctx.fillText(`a: ${sideA.toFixed(0)}`, (Ax + B.x)/2 - 15, Ay + 25);
        ctx.fillText(`b: ${sideB.toFixed(0)}`, Ax - 55, (Ay + C.y)/2);
    }
};

const congruenceModule = {
    init() {
        createCanvasOnce();
        if (!labState.mode) labState.mode = 'SSS';
        renderCongruenceUI();
        draw();
    },
    draw(ctx) {
        drawCongruence();
    }
};

const polygonModule = {
    init() {
        createCanvasOnce();
        renderPolygonUI();
    },
    draw(ctx) {
        const { polySides: n, polyRadius: r, showDecomposition: show } = labState;
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

const circleModule = {
    init() {
        labState.circleRadiusCm = 5;
        renderCirclePropertiesUI();
    },
    updateRadius(r) { labState.circleRadiusCm = r; },
    getProps() { return getCircleProps(labState.circleRadiusCm); },
    draw(ctx) {
        const drawingScale = 15;
        const rPx = labState.circleRadiusCm * drawingScale;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, rPx, 0, Math.PI * 2);
        ctx.strokeStyle = "#d35400";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = "rgba(211, 84, 0, 0.1)";
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + rPx, centerY);
        ctx.strokeStyle = "#4e342e";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#4e342e";
        ctx.fill();
        ctx.fillStyle = "#4e342e";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`Radius: ${labState.circleRadiusCm.toFixed(1)} cm`, centerX, centerY - rPx - 15);
        ctx.restore();
    }
};         

// SubtendedAnglesModule 
const TAU = 2 * Math.PI;
const RAD2DEG = 180 / Math.PI;

function normalize(a) {
    return (a % TAU + TAU) % TAU;
}

function shortestDiff(start, end) {
    let d = end - start;
    return ((d + Math.PI) % TAU + TAU) % TAU - Math.PI;
}

function positiveDiff(start, end) {
    return (end - start + TAU) % TAU;
}

function drawArc(ctx, cx, cy, r, start, end, color) {
    const diff = shortestDiff(start, end);
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, start + diff, diff < 0);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.stroke();
}

function isOnArc(start, end, t) {
    const s = normalize(start);
    const e = normalize(end);
    const p = normalize(t);
    return s < e ? (p > s && p < e) : (p > s || p < e);
}

const subtendedAnglesModule = {
    elements: {},
    viewMode: 'Default view',
    cyclicPoints: [],

    refreshCyclicQuad() {
        let pts = [];
        for (let i = 0; i < 4; i++) pts.push(Math.random() * TAU);
        this.cyclicPoints = pts.sort((a, b) => a - b);
    },

    modes: {
        'Default view': {
            html: `
                <p style="font-size:0.85em; color:#6d4c41; margin-bottom:15px;">Drag points A, B, or C to observe how the angles change.</p>
                <div style="padding:12px; border:2px dashed #bcaaa4; border-radius:8px; background:rgba(239,235,233,0.3); text-align:left;">
                    <div style="font-size:0.9em; line-height:1.8;">
                        Central Angle (∠AOB): <b style="color:#f39c12;"><span id="valCentral">0</span>°</b><br>
                        Inscribed Angle (∠ACB): <b style="color:#4e342e;"><span id="valInscribed">0</span>°</b>
                    </div>
                </div>
                <p style="margin-top:15px; font-size:0.8em; color:#8d6e63;">
                    <i>The orange arc AB subtends both angles.</i>
                </p>`,
            init: (ctx) => {
                ctx.elements.vC = document.getElementById("valCentral");
                ctx.elements.vI = document.getElementById("valInscribed");
            }
        },
        'inscribed-inscribed': {
            html: `
                <p style="font-size:0.85em; color:#6d4c41; margin-bottom:15px;">Exploring the Inscribed Angle Theorem.</p>
                <div style="padding:12px; border:2px dashed #bcaaa4; border-radius:8px; background:rgba(239,235,233,0.3); text-align:left;">
                    <ul class="Slist" style="margin:0; padding-left:20px; font-size:0.9em; line-height:1.8; color:#4e342e;">
                        <li>Inscribed angle: An angle formed by two chords in a circle.</li>
                        <li>Measure of each inscribed angle = <b>1/2</b> measure of <span style="color: #f39c12; font-weight: bold;">AB</span> arc.</li>
                        <li>All inscribed angles subtended by the same arc <span style="color: #f39c12; font-weight: bold;">AB</span> are <b>equal</b> in measure.</li>
                    </ul>
                </div>`,
            init: () => {}
        },
        'X': {
            html: `
                <p style="font-size:0.85em; color:#6d4c41; margin-bottom:15px;">Exploring Cyclic Quadrilaterals.</p>
                <div style="padding:12px; border:2px dashed #bcaaa4; border-radius:8px; background:rgba(239,235,233,0.3); text-align:left;">
                    <ul class="Slist" style="margin:0; padding-left:20px; font-size:0.9em; line-height:1.6; color:#4e342e;">
                        <li>A cyclic quadrilateral has all its four vertices on the circumference of the circle</li>
                        <li>Opposite angles in a cyclic quad add up to 180° <b>(supplementary)</b>.</li>
                        <li>Exterior angle is equal to the interior opposite angle.</li>
                    </ul>
                </div>
                <div style="margin-top:20px; text-align:center;">
                    <button id="refresh-quad-btn" style="background:orange; color:white; border:none; padding:8px 20px; border-radius:4px; cursor:pointer; font-weight:bold;">Refresh Quad</button>
                </div>`,
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
        'Y': { html: `<p>Feature Y content here.</p>`, init: () => {} }
    },

    init() {
        createCanvasOnce();
        this.renderUI();
        this.updateView();
        this.attachMenuListeners();
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
                <h3 style="margin-top:5px; font-weight:bold;">Subtended Angles Lab</h3>
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

    attachMenuListeners() {
        const btn = document.getElementById("show-btn");
        const menu = document.getElementById("dropdown-menu");
        btn.onclick = (e) => { e.stopPropagation(); menu.classList.toggle("show-flex"); };
        document.querySelectorAll('.menu-item').forEach(item => {
            item.onclick = (e) => {
                this.viewMode = e.target.getAttribute('data-mode');
                menu.classList.remove("show-flex");
                this.updateView();
                draw();
            };
        });
        document.addEventListener('click', () => menu.classList.remove("show-flex"));
    },

    updateStats() {
        if (this.viewMode !== 'Default view') return;
        const { vC, vI } = this.elements;
        if (!vC || !vI) return;
        const { A, B, C } = labState.anglePoints;
        const flipped = isOnArc(A, B, C);
        const start = flipped ? B : A;
        const end = flipped ? A : B;
        const centralDeg = Math.round(positiveDiff(start, end) * RAD2DEG);
        vC.innerText = centralDeg;
        vI.innerText = Math.round(centralDeg / 2);
    },

    draw(ctx) {
        const cx = canvas.width / 2, cy = canvas.height / 2;
        const { A, B, C, radius: r } = labState.anglePoints;

        // 1. Draw Common Elements (Main Circle)
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, TAU);
        ctx.strokeStyle = "#bcaaa4aa";
        ctx.lineWidth = 2;
        ctx.stroke();

        // 2. Route Drawing Based on View Mode
        if (this.viewMode === 'X') {
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

            if (this.viewMode === 'inscribed-inscribed') {
                const majorSweep = TAU - sweep;
                const offsets = [0.2, 0.5, 0.8];
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

                
/* --- Global Drawing Loop --- */
function draw() {
   if (!ctx) return;
   ctx.clearRect(0, 0, canvas.width, canvas.height);
   if (currentModule && currentModule.draw) {
    currentModule.draw(ctx);
   }
}

/* --- Shared Drawing Helpers --- */
function drawCongruence() {
    const { tri, mode, targets } = labState;
    const target = targets[mode];
    const halfWidth = canvas.width / 2;
    const safeScale = 9.5;
    const yPos = canvas.height * 0.7;

    const getTriangleMetrics = (t) => {
        const radA = (t.a || 0) * 0.0174533;
        let effectiveSideB = t.b || 0;
        if (mode === 'ASA' && t.angleB) {
            const radB = t.angleB * 0.0174533;
            const sinC = Math.sin(Math.PI - radA - radB);
            effectiveSideB = sinC > 0 ? (t.c * Math.sin(radB)) / sinC : 0;
        }
        const leftSwing = t.a > 90 ? Math.abs(Math.cos(radA) * effectiveSideB * safeScale) : 0;
        return { totalWidth: (t.c * safeScale) + leftSwing, offset: leftSwing };
    };

    const userMetrics = getTriangleMetrics(tri);
    const targetMetrics = getTriangleMetrics(target);
    const startX_User = (halfWidth - userMetrics.totalWidth) / 2 + userMetrics.offset;
    const startX_Target = halfWidth + (halfWidth - targetMetrics.totalWidth) / 2 + targetMetrics.offset;
    const isMatched = checkCongruence(tri, target, mode);
    
    ctx.setLineDash([5, 5]); ctx.strokeStyle = "#4e342e22";
    ctx.beginPath(); ctx.moveTo(halfWidth, 20); ctx.lineTo(halfWidth, canvas.height - 20); ctx.stroke();
    ctx.setLineDash([]);

    drawTriangleShape(tri, startX_User, yPos, isMatched ? "#e65100" : "#4e342e", "Your Triangle", isMatched, safeScale);
    drawTriangleShape(target, startX_Target, yPos, isMatched ? "#e65100" : "#bcaaa4aa", "Target", false, safeScale);
    updateCongruenceMessage(isMatched, target, mode);
}

function checkCongruence(tri, target, mode) {
    const dC = Math.abs(tri.c - target.c), dB = Math.abs(tri.b - target.b), dA = Math.abs(tri.a - target.a);
    if (mode === 'SSS') return dC < 0.5 && dB < 0.5;
    if (mode === 'SAS') return dC < 0.5 && dB < 0.5 && dA < 1;
    if (mode === 'ASA') return dA < 1 && dC < 0.5 && Math.abs(tri.angleB - target.angleB) < 1;
    return false;
}

function updateCongruenceMessage(isMatched, target, mode) {
    const msg = document.getElementById('cong-msg');
    if (!msg) return;
    msg.innerHTML = isMatched ? `<b>✨ CONGRUENT! ✨</b>` : 
        (mode === 'ASA' ? `Goal: ∠A=${target.a}°, C=${target.c}, ∠B=${target.angleB}°` : 
        `Goal: C=${target.c}, B=${target.b}${mode==='SAS'?', A='+target.a+'°':''}`);
}

function drawTriangleShape(d, x, y, color, label, glow, scale) {
    const radA = (d.a || 0) * 0.0174533, cosA = Math.cos(-radA), sinA = Math.sin(-radA);
    let sB = (d.b || 0);
    if (d.angleB && labState.mode === 'ASA') {
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

function drawSimpleSquare(p1, p2, color, dir) {
    const s = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    ctx.beginPath(); ctx.fillStyle = color + "33"; ctx.strokeStyle = color;
    p1.x === p2.x ? ctx.rect(p1.x, p1.y, dir * s, -s) : ctx.rect(p1.x, p1.y, s, dir * s);
    ctx.fill(); ctx.stroke();
}

function drawHypotenuseSquare(p1, p2, color) {
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const ox = -dy, oy = dx;
    ctx.beginPath(); ctx.fillStyle = color + "33"; ctx.strokeStyle = color;
    ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p2.x + ox, p2.y + oy);
    ctx.lineTo(p1.x + ox, p1.y + oy);
    ctx.closePath(); ctx.fill(); ctx.stroke();
}

function drawDragger(p) {
    ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, 7);
    ctx.fillStyle = "#f39c12"; ctx.fill(); 
    ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.stroke();
}

function getDynamicScale(a, b) {
    return 160 / Math.max(a, b, Math.hypot(a, b));
}

function updateVisualProof() {
    const res = document.getElementById("result");
    if (!res) return;
    const a2 = sideA * sideA, b2 = sideB * sideB, c2 = a2 + b2;
    res.innerHTML = `<div style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px;">
        <span style="color:#e74c3c; font-weight:bold;">${sideA.toFixed(0)}²</span> + 
        <span style="color:#3498db; font-weight:bold;">${sideB.toFixed(0)}²</span> = 
        <span style="color:#2ecc71; font-weight:bold;">${c2.toFixed(0)}</span><br>
        c = <span style="color:#d35400; font-size:1.2em;">${Math.sqrt(c2).toFixed(2)}</span></div>`;
}

/* --- Interaction Handlers --- */
function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const t = (e.touches && e.touches[0]) || e;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
}

function startDrag(e) {
    if (!canvas || !currentModule) return;
    const { x, y } = getPos(e);
    if (currentModule === pythagorasModule) {
        const s = getDynamicScale(sideA, sideB);
        if (Math.hypot(x - (originX + sideA * s), y - originY) < 25) dragging = "B";
        else if (Math.hypot(x - originX, y - (originY - sideB * s)) < 25) dragging = "C";
    } else if (currentModule === subtendedAnglesModule) {
        const cx = canvas.width / 2, cy = canvas.height / 2, r = labState.anglePoints.radius;
        const checkHit = (angle) => Math.hypot(x - (cx + r * Math.cos(angle)), y - (cy + r * Math.sin(angle))) < 25;
        if (checkHit(labState.anglePoints.A)) dragging = "circleA";
        else if (checkHit(labState.anglePoints.B)) dragging = "circleB";
        else if (checkHit(labState.anglePoints.C)) dragging = "circleC";
    }
}

function drag(e) {
    if (!dragging) return;
    const { x, y } = getPos(e);
    if (currentModule === subtendedAnglesModule && dragging.startsWith("circle")) {
        const cx = canvas.width / 2, cy = canvas.height / 2;
        const key = dragging[6]; // "circleA" → "A"
        let angle = Math.atan2(y - cy, x - cx);
        labState.anglePoints[key] = angle < 0 ? angle + Math.PI * 2 : angle;
    }
    else if (currentModule === pythagorasModule) {
        const s = getDynamicScale(sideA, sideB);
        if (dragging === "B") sideA = Math.max(1, Math.min(500, (x - originX) / s));
        else if (dragging === "C") sideB = Math.max(1, Math.min(500, (originY - y) / s));
        updateInputsFromTriangle();
    }
    draw();
}

function stopDrag() { dragging = null; }

function updateInputsFromTriangle() {
    const iA = document.getElementById("inputA"), iB = document.getElementById("inputB");
    if (iA) iA.value = sideA.toFixed(0); 
    if (iB) iB.value = sideB.toFixed(0);
    updateVisualProof();
}

/* --- Polygon Explorer Lab --- */
function startPolygonLab() {
    resetLab();
    currentModule = polygonModule;
    polygonModule.init();
    draw();
}

function renderPolygonUI() {
    const dataPanel = document.getElementById("dataPanel");
    if (!dataPanel) return;
    const { polySides, polyRadius, showDecomposition } = labState;
    const currentSideCm = (2 * polyRadius * Math.sin(Math.PI / polySides) / 10).toFixed(1);

    dataPanel.innerHTML = `
        <div id="poly-controls" style="color: #4e342e; padding: 15px; background: transparent;">
            <h3 style="color: black; margin-top: 0; font-weight: bold; text-align:center;"> Polygon Explorer</h3>
            <div style="width: 66%; margin: 0 auto;">
                <div style="margin-bottom:15px;">
                    <label style="display:block; font-size:0.85em; color: #4e342e;">Number of Sides: <span id="valSideCount">${polySides}</span></label>
                    <input type="range" id="sidesSlider" min="3" max="12" value="${polySides}" style="width:100%; accent-color:#f39c12; cursor: pointer;">
                </div>
                <div style="margin-bottom:15px;">
                    <label style="display:block; font-size:0.85em; color: #4e342e;">Adjust Size (Side: <span id="valSide">${currentSideCm}</span> cm)</label>
                    <input type="range" id="radiusSlider" min="40" max="150" value="${polyRadius}" style="width:100%; accent-color:#f39c12; cursor: pointer;">
                </div>
                <div style="margin-bottom:20px; display:flex; align-items:center; justify-content: center; gap:10px; border-top: 1px solid #eee; padding-top:10px;">
                    <input type="checkbox" id="decompCheck" ${showDecomposition ? 'checked' : ''} style="width: 18px; height: 18px; accent-color:#f39c12; cursor: pointer;">
                    <label style="font-size:0.85em; cursor: pointer; color: #6d4c41;" for="decompCheck">Show Triangle Decomposition</label>
                </div>
            </div>
            <div id="polyStats" style="text-align:left; padding:12px; border:2px dashed #bcaaa4; border-radius:8px; background: rgba(239, 235, 233, 0.3); color: #6d4c41; min-height: 100px;"></div>
        </div>`;
    attachPolyListeners();
    updatePolygonStats(polySides, parseFloat(currentSideCm));
}

/* --- Polygon Stats Logic --- */
function updatePolygonStats(n, sideCm) {
    const stats = document.getElementById("polyStats");
    if (!stats) return;

    const perimeter = n * sideCm;
    const interiorAngle = (n - 2) * 180 / n;
    // Mathematical formula for the area of a regular polygon
    const area = (n * Math.pow(sideCm, 2)) / (4 * Math.tan(Math.PI / n));

    stats.innerHTML = `
        <div style="text-align: center; width: 100%;">
            <b>${polygonNames[n] || n + '-sided polygon'} properties:</b><br>
            Side: ${sideCm.toFixed(1)} cm | Perimeter: ${perimeter.toFixed(1)} cm<br>
            Int. Angle: ${interiorAngle.toFixed(0)}°<br>
            Area: <b>${area.toFixed(1)}</b> cm²
        </div>`;
}

function attachPolyListeners() {
    const sS = document.getElementById('sidesSlider'), rS = document.getElementById('radiusSlider'), dC = document.getElementById('decompCheck');
    if (sS) sS.oninput = function() { 
        labState.polySides = +this.value; 
        document.getElementById('valSideCount').innerText = this.value; 
        const sideCm = (2 * labState.polyRadius * Math.sin(Math.PI / labState.polySides) / 10).toFixed(1);
        document.getElementById('valSide').innerText = sideCm;
        draw(); 
    };
    if (rS) rS.oninput = function() { 
        labState.polyRadius = +this.value; 
        const sideCm = (2 * this.value * Math.sin(Math.PI / labState.polySides) / 10).toFixed(1);
        document.getElementById('valSide').innerText = sideCm;
        draw(); 
    };
    if (dC) dC.onchange = function() { labState.showDecomposition = this.checked; draw(); };
}

/* --- Circle Properties Lab --- */
function startCirclePropertiesLab() {
    resetLab();
    currentModule = circleModule;
    createCanvasOnce();
    circleModule.init();
    draw(); 
}

function getCircleProps(r) {
    return { r: r, d: 2 * r, c: 2 * Math.PI * r, a: Math.PI * r * r };
}

function renderCirclePropertiesUI() {
    const dataPanel = document.getElementById("dataPanel");
    if (!dataPanel) return;
    dataPanel.innerHTML = `
        <div id="circle-controls" style="color: #4e342e; padding: 15px; background: transparent;">
            <h3 style="color: black; margin-top: 0; font-weight: bold; text-align:center;">Circle Properties</h3>
            
            <div style="width: 66%; margin: 0 auto; min-width: 250px;">
                <div style="margin-bottom:15px;">
                    <label style="display:block; font-size:0.85em; color: #4e342e;">
                        Radius (r): <span id="valR" style="color:#f39c12; font-weight:bold;">5.0</span> cm
                    </label>
                    <input type="range" id="circleRadiusSlider" min="1" max="10" step="0.1" value="5" 
                           style="width:100%; accent-color:#f39c12; cursor: pointer;">
                </div>
            </div>

            <div id="circleStats" style="text-align:left; padding:12px; border:2px dashed #bcaaa4; border-radius:8px; background: rgba(239, 235, 233, 0.3); color: #6d4c41; min-height: 100px;">
                <div style="text-align: center; width: 100%;"> 
                    <div style="font-size:0.9em; line-height: 1.8; color: #4e342e;">
                        Diameter (d): <b><span id="statD">10.0</span></b> cm<br>
                        Circumference (C): <b><span id="statC">31.4</span></b> cm<br>
                        <div style="margin-top:8px; padding-top:8px; border-top:1px dashed #bcaaa4;">
                            Area (A): <b style="font-size:1.1em; color:#bf360c;"><span id="statA">78.5</span></b> cm²
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    const rIn = document.getElementById("circleRadiusSlider"),
          vR = document.getElementById("valR"),
          sD = document.getElementById("statD"),
          sC = document.getElementById("statC"),
          sA = document.getElementById("statA");

    if (rIn) {
        rIn.oninput = (e) => {
            const r = parseFloat(e.target.value);
            labState.circleRadiusCm = r;
            if (vR) vR.innerText = r.toFixed(1);
            const props = getCircleProps(r);
            if (sD) sD.innerText = props.d.toFixed(1);
            if (sC) sC.innerText = props.c.toFixed(1);
            if (sA) sA.innerText = props.a.toFixed(1);
            draw();
        };
    }
}