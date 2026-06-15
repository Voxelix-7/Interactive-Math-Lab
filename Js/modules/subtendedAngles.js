const subtendedAnglesModule {
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
          
};
