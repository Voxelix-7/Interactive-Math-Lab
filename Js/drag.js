// drag.js — Mouse and touch drag system

import { canvas, currentModule, dragging, setDragging, labState, TAU } from './state.js';
import { getDynamicScale, toRad } from './math.js';
import { draw } from './canvas.js';

// These are imported lazily to avoid circular imports
// (canvas.js imports drag.js, so drag.js must not import canvas.js at the top level)
let pythagorasModule, subtendedAnglesModule, sectorSegmentModule, unitCircleModule, elevDeprModule, vectorExplorerModule, boatModeModule;
import('./modules/pythagoras.js').then(m => { pythagorasModule = m.pythagorasModule; });
import('./modules/subtendedAngles.js').then(m => { subtendedAnglesModule = m.subtendedAnglesModule; });
import('./modules/sectorSegment.js').then(m => { sectorSegmentModule = m.sectorSegmentModule; });
import('./modules/unitCircle.js').then(m => { unitCircleModule = m.unitCircleModule; });
import('./modules/elevationDepression.js').then(m => { elevDeprModule = m.elevDeprModule; });
import('./modules/vectors.js').then(m => { vectorExplorerModule = m.vectorExplorerModule; boatModeModule = m.boatModeModule; });

// Pixels-per-unit used by the Cartesian plane in vectors.js.
// Kept as a local constant (mirrors UNIT exported from vectors.js) to avoid
// a circular import between drag.js and vectors.js.
const VEC_UNIT = 30;

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

    } else if (currentModule === elevDeprModule) {
        const groundY = 340, eyeY = groundY - 30, buildingX = 440, towerX = 110;
        if (elevDeprModule.viewMode === 'Angle of Elevation') {
            const { personX, buildingTopY } = labState.elevDepr.elevation;
            if (Math.hypot(x - personX, y - eyeY) < 25) setDragging("edPerson");
            else if (Math.hypot(x - buildingX, y - buildingTopY) < 25) setDragging("edBuildingTop");
        } else {
            const { towerTopY, boatX } = labState.elevDepr.depression;
            if (Math.hypot(x - towerX, y - towerTopY) < 25) setDragging("edObserver");
            else if (Math.hypot(x - boatX, y - groundY) < 25) setDragging("edBoat");
        }

    } else if (currentModule === vectorExplorerModule) {
        // Click-anywhere-on-the-grid repositioning: snap the nearer of A's head
        // or B's head to the click point immediately, then continue dragging it.
        // Coordinates snap to whole integers rather than raw pixel-derived floats.
        const cx = canvas.width / 2, cy = canvas.height / 2;
        const { A, B, mode } = labState.vectors;
        const headB = mode === 'headToTail' ? { x: A.x + B.x, y: A.y + B.y } : { x: B.x, y: B.y };
        const pA = { x: cx + A.x * VEC_UNIT, y: cy - A.y * VEC_UNIT };
        const pB = { x: cx + headB.x * VEC_UNIT, y: cy - headB.y * VEC_UNIT };
        const dA = Math.hypot(x - pA.x, y - pA.y);
        const dB = Math.hypot(x - pB.x, y - pB.y);
        const newPoint = { x: Math.round((x - cx) / VEC_UNIT), y: Math.round((cy - y) / VEC_UNIT) };

        if (dA <= dB) {
            setDragging("vecA");
            labState.vectors.A = newPoint;
        } else {
            setDragging("vecB");
            labState.vectors.B = mode === 'headToTail'
                ? { x: newPoint.x - A.x, y: newPoint.y - A.y }
                : newPoint;
        }
        draw();

    } else if (currentModule === boatModeModule) {
        // Boat & River: any click anywhere on the grid repositions the boat's
        // velocity vector head to that point (snapped to whole units), then
        // continues dragging it.
        const cx = canvas.width / 2, cy = canvas.height / 2;
        setDragging("boatVec");
        labState.boat.boatVel = { x: Math.round((x - cx) / VEC_UNIT), y: Math.round((cy - y) / VEC_UNIT) };
        draw();
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

    } else if (currentModule === elevDeprModule && dragging.startsWith("ed")) {
        const groundY = 340, eyeY = groundY - 30;
        const e = labState.elevDepr.elevation, d = labState.elevDepr.depression;
        if (dragging === "edPerson") {
            e.personX = Math.max(60, Math.min(360, x));
        } else if (dragging === "edBuildingTop") {
            e.buildingTopY = Math.max(70, Math.min(eyeY - 20, y));
        } else if (dragging === "edObserver") {
            d.towerTopY = Math.max(70, Math.min(groundY - 60, y));
        } else if (dragging === "edBoat") {
            d.boatX = Math.max(190, Math.min(500, x));
        }
        elevDeprModule.updateStats();

    } else if (currentModule === vectorExplorerModule && dragging && dragging.startsWith('vec')) {
        const cx = canvas.width / 2, cy = canvas.height / 2;
        const newPoint = { x: Math.round((x - cx) / VEC_UNIT), y: Math.round((cy - y) / VEC_UNIT) };
        if (dragging === 'vecA') {
            labState.vectors.A = newPoint;
        } else if (dragging === 'vecB') {
            labState.vectors.B = labState.vectors.mode === 'headToTail'
                ? { x: newPoint.x - labState.vectors.A.x, y: newPoint.y - labState.vectors.A.y }
                : newPoint;
        }

    } else if (currentModule === boatModeModule && dragging === 'boatVec') {
        const cx = canvas.width / 2, cy = canvas.height / 2;
        labState.boat.boatVel = { x: Math.round((x - cx) / VEC_UNIT), y: Math.round((cy - y) / VEC_UNIT) };
    }

    draw();
}

export function stopDrag() { setDragging(null); }