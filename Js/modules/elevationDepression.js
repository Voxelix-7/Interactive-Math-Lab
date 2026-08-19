// modules/elevationDepression.js — Angle of Elevation & Depression lab module

import { labState, canvas, RAD2DEG } from '../state.js';
import { draw, createCanvasOnce, drawDragger } from '../canvas.js';
import { attachDropdownMenu } from '../ui.js';

// Shared geometry constants — mirrored in Js/drag.js for hit-testing
export const edGeom = {
    groundY: 340,
    eyeOffset: 30,
    scale: 6, // px per "unit" of distance/height
    elevation: {
        buildingX: 440,
        personMin: 60,
        personMax: 360
    },
    depression: {
        towerX: 110,
        boatMin: 190,
        boatMax: 500
    }
};

export const elevDeprViews = {
    elevation: () => `
        <p class="viewData">Drag the person or the rooftop to change the view.</p>
        <div class="data-container">
            <div style="font-size:0.9em; line-height:1.8;">
                Horizontal Distance: <b style="color:#f39c12;"><span id="edDist">0</span></b> units<br>
                Vertical Height: <b style="color:#3498db;"><span id="edHeight">0</span></b> units<br>
                Angle of Elevation (θ): <b style="color:#d35400;"><span id="edAngle">0</span>°</b>
                <div class="data-divider">
                    sin θ = <span id="edSin">0</span> &nbsp;|&nbsp;
                    cos θ = <span id="edCos">0</span> &nbsp;|&nbsp;
                    tan θ = <span id="edTan">0</span>
                </div>
            </div>
        </div>
        <div class="control-row">
        <input type="checkbox" id="edConstructionCheck" ${labState.elevDepr.showConstruction ? 'checked' : ''} class="lab-checkbox">
        <label style="font-size:0.85em; cursor: pointer; color: #6d4c41;" for="edConstructionCheck">Show Construction Lines</label>
        </div>
        <p class="lab-note">The angle of elevation is measured upward from the horizontal.</p>`,
    depression: () => `
        <p class="viewData">Drag the observer or the boat to change the view.</p>
        <div class="data-container">
            <div style="font-size:0.9em; line-height:1.8;">
                Horizontal Distance: <b style="color:#f39c12;"><span id="edDist">0</span></b> units<br>
                Vertical Height: <b style="color:#3498db;"><span id="edHeight">0</span></b> units<br>
                Angle of Depression (θ): <b style="color:#d35400;"><span id="edAngle">0</span>°</b>
                <div class="data-divider">
                    sin θ = <span id="edSin">0</span> &nbsp;|&nbsp;
                    cos θ = <span id="edCos">0</span> &nbsp;|&nbsp;
                    tan θ = <span id="edTan">0</span>
                </div>
            </div>
        </div>
        <div class="control-row">
        <input type="checkbox" id="edConstructionCheck" ${labState.elevDepr.showConstruction ? 'checked' : ''} class="lab-checkbox">
        <label style="font-size:0.85em; cursor: pointer; color: #6d4c41;" for="edConstructionCheck">Show Construction Lines</label>
        </div>
        <p class="lab-note">The angle of depression is measured downward from the horizontal.</p>`
};

export const elevDeprModule = {
    viewMode: 'Angle of Elevation',
    modes: {
        'Angle of Elevation': {
            html: elevDeprViews.elevation,
            facts: [
                "The angle of elevation is always measured from the horizontal line of sight upward toward an object",
                "Pilots, surveyors, and astronomers use the angle of elevation to work out heights and distances they can't measure directly",
                "As the person moves further from the building the angle of elevation shrinks, even though the building itself hasn't changed height"
            ],
            init: (ctx) => ctx.attachCheckbox()
        },
        'Angle of Depression': {
            html: elevDeprViews.depression,
            facts: [
                "The angle of depression is always measured from the horizontal line of sight downward toward an object",
                "Because the two horizontal reference lines are parallel, the angle of depression from the top always equals the angle of elevation from the bottom, by the Alternate Interior Angles Theorem",
                "Lighthouse keepers historically used the angle of depression to a ship to estimate how far offshore it was"
            ],
            init: (ctx) => ctx.attachCheckbox()
        }
    },
    getFacts() { return this.modes[this.viewMode]?.facts; },

    init() {
        createCanvasOnce();
        this.renderUI();
        this.updateView();
        this.attachMenu();
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
                <h3 class="lab-title">Angles of Elevation &amp; Depression</h3>
                <div id="dynamic-content"></div>
            </div>
        `;
    },

    updateView() {
        const container = document.getElementById("dynamic-content");
        const mode = this.modes[this.viewMode];
        if (!container || !mode) return;
        container.innerHTML = mode.html();
        mode.init(this);
        this.updateStats();
    },

    attachMenu() {
        attachDropdownMenu((mode) => {
            this.viewMode = mode;
            this.updateView();
            draw();
        });
    },

    attachCheckbox() {
        const check = document.getElementById("edConstructionCheck");
        if (!check) return;
        check.onchange = () => {
            labState.elevDepr.showConstruction = check.checked;
            draw();
        };
    },

    updateStats() {
        const distEl   = document.getElementById("edDist");
        const heightEl = document.getElementById("edHeight");
        const angleEl  = document.getElementById("edAngle");
        const sinEl    = document.getElementById("edSin");
        const cosEl    = document.getElementById("edCos");
        const tanEl    = document.getElementById("edTan");
        if (!distEl || !heightEl || !angleEl || !sinEl || !cosEl || !tanEl) return;

        const { scale, groundY, eyeOffset, elevation, depression } = edGeom;
        let horizontalPx, verticalPx;

        if (this.viewMode === 'Angle of Elevation') {
            const { personX, buildingTopY } = labState.elevDepr.elevation;
            const eyeY = groundY - eyeOffset;
            horizontalPx = elevation.buildingX - personX;
            verticalPx   = eyeY - buildingTopY;
        } else {
            const { towerTopY, boatX } = labState.elevDepr.depression;
            horizontalPx = boatX - depression.towerX;
            verticalPx   = groundY - towerTopY;
        }

        const distUnits   = Math.max(horizontalPx, 1) / scale;
        const heightUnits = Math.max(verticalPx, 1) / scale;
        const theta = Math.atan2(verticalPx, horizontalPx);

        distEl.innerText   = distUnits.toFixed(1);
        heightEl.innerText = heightUnits.toFixed(1);
        angleEl.innerText  = (theta * RAD2DEG).toFixed(1);
        sinEl.innerText    = Math.sin(theta).toFixed(2);
        cosEl.innerText    = Math.cos(theta).toFixed(2);
        tanEl.innerText    = Math.tan(theta).toFixed(2);
    },

    draw(ctx) {
        if (this.viewMode === 'Angle of Elevation') this.drawElevation(ctx);
        else this.drawDepression(ctx);
        this.updateStats();
    },

    drawElevation(ctx) {
        const { groundY, eyeOffset, elevation } = edGeom;
        const { personX, buildingTopY } = labState.elevDepr.elevation;
        const buildingX = elevation.buildingX;
        const eyeY = groundY - eyeOffset;
        const showLines = labState.elevDepr.showConstruction;

        // Ground
        ctx.beginPath();
        ctx.moveTo(20, groundY);
        ctx.lineTo(canvas.width - 20, groundY);
        ctx.strokeStyle = "#bcaaa4";
        ctx.lineWidth = 3;
        ctx.stroke();

        // Building
        ctx.beginPath();
        ctx.strokeStyle = "#8d6e63";
        ctx.lineWidth = 6;
        ctx.moveTo(buildingX, groundY);
        ctx.lineTo(buildingX, buildingTopY);
        ctx.stroke();

        // Person (simple stick figure)
        ctx.beginPath();
        ctx.strokeStyle = "#4e342e";
        ctx.lineWidth = 3;
        ctx.moveTo(personX, groundY);
        ctx.lineTo(personX, eyeY + 6);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(personX, eyeY - 4, 8, 0, Math.PI * 2);
        ctx.fillStyle = "#4e342e";
        ctx.fill();

        if (showLines) {
            // Horizontal reference line (from eye level)
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = "#f39c12";
            ctx.lineWidth = 2;
            ctx.moveTo(personX, eyeY);
            ctx.lineTo(buildingX, eyeY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Vertical height line (highlighted alongside the building)
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = "#3498db";
            ctx.lineWidth = 2;
            ctx.moveTo(buildingX + 10, eyeY);
            ctx.lineTo(buildingX + 10, buildingTopY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Right-angle marker
            ctx.strokeStyle = "#4e342e";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(buildingX - 12, eyeY - 12, 12, 12);

            // Angle arc at the person's eye
            const a2 = Math.atan2(buildingTopY - eyeY, buildingX - personX);
            ctx.beginPath();
            ctx.strokeStyle = "#d35400";
            ctx.lineWidth = 2;
            ctx.arc(personX, eyeY, 30, a2, 0);
            ctx.stroke();
        }

        // Line of sight
        ctx.beginPath();
        ctx.strokeStyle = "#d35400";
        ctx.lineWidth = 2.5;
        ctx.moveTo(personX, eyeY);
        ctx.lineTo(buildingX, buildingTopY);
        ctx.stroke();

        drawDragger({ x: personX, y: eyeY });
        drawDragger({ x: buildingX, y: buildingTopY });
    },

    drawDepression(ctx) {
        const { groundY, depression } = edGeom;
        const { towerTopY, boatX } = labState.elevDepr.depression;
        const towerX = depression.towerX;
        const showLines = labState.elevDepr.showConstruction;

        // Water
        ctx.beginPath();
        ctx.moveTo(20, groundY);
        ctx.lineTo(canvas.width - 20, groundY);
        ctx.strokeStyle = "#4fc3f7";
        ctx.lineWidth = 3;
        ctx.stroke();

        // Tower / lighthouse
        ctx.beginPath();
        ctx.strokeStyle = "#8d6e63";
        ctx.lineWidth = 6;
        ctx.moveTo(towerX, groundY);
        ctx.lineTo(towerX, towerTopY);
        ctx.stroke();

        // Observer
        ctx.beginPath();
        ctx.arc(towerX, towerTopY - 10, 8, 0, Math.PI * 2);
        ctx.fillStyle = "#4e342e";
        ctx.fill();

        // Boat
        ctx.beginPath();
        ctx.moveTo(boatX - 18, groundY);
        ctx.lineTo(boatX + 18, groundY);
        ctx.lineTo(boatX + 10, groundY + 12);
        ctx.lineTo(boatX - 10, groundY + 12);
        ctx.closePath();
        ctx.fillStyle = "#d35400";
        ctx.fill();

        if (showLines) {
            // Horizontal reference line (from observer's eye level)
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = "#f39c12";
            ctx.lineWidth = 2;
            ctx.moveTo(towerX, towerTopY);
            ctx.lineTo(boatX, towerTopY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Vertical height line (dropped down to the boat)
            ctx.beginPath();
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = "#3498db";
            ctx.lineWidth = 2;
            ctx.moveTo(boatX, towerTopY);
            ctx.lineTo(boatX, groundY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Right-angle marker
            ctx.strokeStyle = "#4e342e";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(boatX - 12, towerTopY, 12, 12);

            // Angle arc at the observer
            const a2 = Math.atan2(groundY - towerTopY, boatX - towerX);
            ctx.beginPath();
            ctx.strokeStyle = "#d35400";
            ctx.lineWidth = 2;
            ctx.arc(towerX, towerTopY, 30, 0, a2);
            ctx.stroke();
        }

        // Line of sight
        ctx.beginPath();
        ctx.strokeStyle = "#d35400";
        ctx.lineWidth = 2.5;
        ctx.moveTo(towerX, towerTopY);
        ctx.lineTo(boatX, groundY);
        ctx.stroke();

        drawDragger({ x: towerX, y: towerTopY });
        drawDragger({ x: boatX, y: groundY });
    }
};