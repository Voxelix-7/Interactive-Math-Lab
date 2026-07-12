// modules/pythagoras.js Pythagorean Theorem lab module

import { labState, canvas } from '../state.js';
import { getDynamicScale } from '../math.js';
import { draw, createCanvasOnce, drawDragger, drawSimpleSquare, drawHypotenuseSquare } from '../canvas.js';

export const pythagorasModule = {
    facts: [
        "The Babylonian tablet Plimton 322 proves they recorded Pythagorean triples over 1,000 years before Pythagoras was even born",
        "The theorem was used to calculate slopes for construction rather than pure geometry",
        "Pythagorean triples were recorded over 1000 years before Pythagoras was even born",
        "Long before Pythagora, ancient Egyptians had used the 3-4-5 triangles to lay out precise right angles",
        "The Pythagoreans were a bizarre math cult who believed numbers ruled the universe and completely banned eating beans",
        "Legend says one of Pythagoras's followers, Hippasus, discovered irrational numbers using the theorem and the cult drowned him to keep it a secret"
    ],
    getFacts() { return this.facts; },
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
        const s = getDynamicScale(labState.pythagoras.sideA, labState.pythagoras.sideB);
        const Ax = labState.pythagoras.originX, Ay = labState.pythagoras.originY;
        const B = { x: Ax + labState.pythagoras.sideA * s, y: Ay };
        const C = { x: Ax, y: Ay - labState.pythagoras.sideB * s };
        drawSimpleSquare({ x: Ax, y: Ay }, C, "#3498db", -1); // Side B square
        drawSimpleSquare({ x: Ax, y: Ay }, B, "#e74c3c",  1); // Side A square
        drawHypotenuseSquare(B, C, "#2ecc71");                 // Hypotenuse square
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
        ctx.fillText(`a: ${labState.pythagoras.sideA.toFixed(0)}`, (Ax + B.x) / 2 - 15, Ay + 25);
        ctx.fillText(`b: ${labState.pythagoras.sideB.toFixed(0)}`, Ax - 55, (Ay + C.y) / 2);
    }
};

export function updateVisualProof() {
    const res = document.getElementById("result");
    if (!res) return;
    const a2 = labState.pythagoras.sideA * labState.pythagoras.sideA;
    const b2 = labState.pythagoras.sideB * labState.pythagoras.sideB;
    const c2 = a2 + b2;
    res.innerHTML = `<div class="result-panel">
        <span style="color:#e74c3c; font-weight:bold;">${labState.pythagoras.sideA.toFixed(0)}²</span> + 
        <span style="color:#3498db; font-weight:bold;">${labState.pythagoras.sideB.toFixed(0)}²</span> = 
        <span style="color:#2ecc71; font-weight:bold;">${c2.toFixed(0)}</span><br>
        c = <span style="color:#d35400; font-size:1.2em;">${Math.sqrt(c2).toFixed(2)}</span></div>`;
}

export function setupCalculation() {
    const inputA = document.getElementById("inputA");
    const inputB = document.getElementById("inputB");
    if (!inputA || !inputB) return; // Prevents crashing if elements don't exist

    const processValue = (input) => {
        let val = parseFloat(input.value) || 1 || "";
        // If the user inputs invalid values, default to 1 instead of NaN
        return Math.max(1, Math.min(500, val));
    };

    function update() {
        if (inputA.value === "" || inputB.value === "") return; // Skip if input bars are empty
        labState.pythagoras.sideA = processValue(inputA);
        labState.pythagoras.sideB = processValue(inputB);
        inputA.value = labState.pythagoras.sideA.toFixed(0);
        inputB.value = labState.pythagoras.sideB.toFixed(0);
        draw();
        updateVisualProof();
    }

    inputA.addEventListener("input", update);
    inputB.addEventListener("input", update);
}

export function updateInputsFromTriangle() {
    const iA = document.getElementById("inputA");
    const iB = document.getElementById("inputB");
    if (iA) iA.value = labState.pythagoras.sideA.toFixed(0);
    if (iB) iB.value = labState.pythagoras.sideB.toFixed(0);
    updateVisualProof();
}

