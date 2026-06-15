// drag.js — Mouse and touch drag system

import { canvas, currentModule, dragging, setDragging, labState, TAU } from './state.js';
import { getDynamicScale } from './math.js';
import { draw } from './canvas.js';

// These are imported lazily to avoid circular imports
// (canvas.js imports drag.js, so drag.js must not import canvas.js at the top level)
let pythagorasModule, subtendedAnglesModule, tangentSecantModule;
import('./modules/pythagoras.js').then(m => { pythagorasModule = m.pythagorasModule; });
import('./modules/subtendedAngles.js').then(m => { subtendedAnglesModule = m.subtendedAnglesModule; });
import('./modules/tangentSecant.js').then(m => { tangentSecantModule = m.tangentSecantModule; });

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

    } else if (currentModule === tangentSecantModule) {
        const cx = canvas.width / 2, cy = canvas.height / 2;
        const r = 110;

        if (tangentSecantModule.viewMode === "Radius & Tangent") {
            const tx = cx + r * Math.cos(labState.tangents.tangentAngle);
            const ty = cy + r * Math.sin(labState.tangents.tangentAngle);
            if (Math.hypot(x - tx, y - ty) < 25) setDragging("tangentPoint");
        } else {
            const px = cx + labState.tangents.pointDistance * Math.cos(labState.tangents.pointAngle);
            const py = cy + labState.tangents.pointDistance * Math.sin(labState.tangents.pointAngle);
            if (Math.hypot(x - px, y - py) < 25) setDragging("externalPoint");
        }
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
        import('./modules/pythagoras.js').then(({ updateInputsFromTriangle }) => {
            updateInputsFromTriangle();
        });
    }

    if (currentModule === tangentSecantModule) {
        const cx = canvas.width / 2, cy = canvas.height / 2;

        if (dragging === "tangentPoint") {
            let angle = Math.atan2(y - cy, x - cx);
            if (angle < 0) angle += TAU;
            labState.tangents.tangentAngle = angle;
        }

        if (dragging === "externalPoint") {
            const dx = x - cx, dy = y - cy;
            labState.tangents.pointAngle    = Math.atan2(dy, dx);
            labState.tangents.pointDistance = Math.max(130, Math.hypot(dx, dy));
        }
    }

    draw();
}

export function stopDrag() { setDragging(null); }
