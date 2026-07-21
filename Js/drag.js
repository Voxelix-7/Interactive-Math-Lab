// drag.js — Mouse and touch drag system

import { canvas, currentModule, dragging, setDragging, labState, TAU } from './state.js';
import { getDynamicScale, toRad } from './math.js';
import { draw } from './canvas.js';

// These are imported lazily to avoid circular imports
// (canvas.js imports drag.js, so drag.js must not import canvas.js at the top level)
let pythagorasModule, subtendedAnglesModule, sectorSegmentModule, unitCircleModule;
import('./modules/pythagoras.js').then(m => { pythagorasModule = m.pythagorasModule; });
import('./modules/subtendedAngles.js').then(m => { subtendedAnglesModule = m.subtendedAnglesModule; });
import('./modules/sectorSegment.js').then(m => { sectorSegmentModule = m.sectorSegmentModule; });
import('./modules/unitCircle.js').then(m => { unitCircleModule = m.unitCircleModule; });

export function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const t = (e.touches && e.touches[0]) || e;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
}

export function startDrag(e) {
    if (!canvas || !currentModule) return;
    const { x, y } = getPos(e);

    if (currentModule === pythagorasModule) {
        const s = getDynamicScale(labState.pythagoras.sideA, labState.pythagoras.sideB);
        if (Math.hypot(x - (labState.pythagoras.originX + labState.pythagoras.sideA * s), y - labState.pythagoras.originY) < 25)
            setDragging("B");
        else if (Math.hypot(x - labState.pythagoras.originX, y - (labState.pythagoras.originY - labState.pythagoras.sideB * s)) < 25)
            setDragging("C");

    } else if (currentModule === subtendedAnglesModule) {
        const cx = canvas.width / 2, cy = canvas.height / 2;
        const r = labState.subtendedAngles.radius;
        const checkHit = (angle) => Math.hypot(x - (cx + r * Math.cos(angle)), y - (cy + r * Math.sin(angle))) < 25;
        if      (checkHit(labState.subtendedAngles.points.A)) setDragging("circleA");
        else if (checkHit(labState.subtendedAngles.points.B)) setDragging("circleB");
        else if (checkHit(labState.subtendedAngles.points.C)) setDragging("circleC");

    } else if (currentModule === sectorSegmentModule) {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const drawRadius = 110;
        const key = sectorSegmentModule.stateKey();
        const angle = toRad(labState[key].angleDeg);
        const p = { x: cx + drawRadius * Math.cos(angle), y: cy + drawRadius * Math.sin(angle) };
        if (Math.hypot(x - p.x, y - p.y) < 25) { setDragging("sectorPoint"); }

    } else if (currentModule === unitCircleModule) {
        const cx = canvas.width / 2, cy = canvas.height / 2;
        const r = labState.unitCircle.radius;
        const theta = labState.unitCircle.angle;
        const p = { x: cx + r * Math.cos(theta), y: cy - r * Math.sin(theta) };
        if (Math.hypot(x - p.x, y - p.y) < 25) { setDragging("unitCirclePoint"); }
    }
}

export function drag(e) {
    if (!dragging) return;
    const { x, y } = getPos(e);

    if (currentModule === subtendedAnglesModule && dragging.startsWith("circle")) {
        const cx = canvas.width / 2, cy = canvas.height / 2;
        const key = dragging[6]; // "circleA" → "A"
        let angle = Math.atan2(y - cy, x - cx);
        labState.subtendedAngles.points[key] = angle < 0 ? angle + Math.PI * 2 : angle;

    } else if (currentModule === pythagorasModule) {
        const s = getDynamicScale(labState.pythagoras.sideA, labState.pythagoras.sideB);
        if (dragging === "B")
            labState.pythagoras.sideA = Math.max(1, Math.min(500, (x - labState.pythagoras.originX) / s));
        else if (dragging === "C")
            labState.pythagoras.sideB = Math.max(1, Math.min(500, (labState.pythagoras.originY - y) / s));

        // Import updateInputsFromTriangle from pythagoras module
        import('./modules/pythagoras.js').then(({ updateInputsFromTriangle }) => { updateInputsFromTriangle(); });

    } else if (currentModule === sectorSegmentModule && dragging === "sectorPoint") {
       const cx = canvas.width / 2;
       const cy = canvas.height / 2;
       const key = sectorSegmentModule.stateKey();
       let angle = Math.atan2(y - cy, x - cx);
       if (angle < 0) angle += TAU;
       labState[key].angleDeg = Math.round(angle * 180 / Math.PI);
       const input = document.getElementById("angleInput");
       if (input) input.value = labState[key].angleDeg;
       sectorSegmentModule.updateStats();

    } else if (currentModule === unitCircleModule && dragging === "unitCirclePoint") {
        const cx = canvas.width / 2, cy = canvas.height / 2;
        // Flip y back to standard math convention (up = positive) before computing the angle
        let angle = Math.atan2(cy - y, x - cx);
        if (angle < 0) angle += TAU;
        labState.unitCircle.angle = angle;
    }

    draw();
}

export function stopDrag() { setDragging(null); }
