// math.js — Pure math helper functions
import { TAU, RAD2DEG, labState } from './state.js';
// Transforms a confusing negative angle into its positive twin
export function normalize(a) { return (a % TAU + TAU) % TAU; }
// Finds the fastest directional route avoiding unnecessary wraps around the circle
export function shortestDiff(start, end) {
    let d = end - start;
    return ((d + Math.PI) % TAU + TAU) % TAU - Math.PI;
}

export function positiveDiff(start, end) { return (end - start + TAU) % TAU; }

export function isOnArc(start, end, t) {
    const s = normalize(start);
    const e = normalize(end);
    const p = normalize(t);
    return s < e ? (p > s && p < e) : (p > s || p < e);
}

export function pointOnCircle(cx, cy, r, angle) {
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

export function getDynamicScale(a, b) { return 160 / Math.max(a, b, Math.hypot(a, b)); }

export function getCircleProps(r) {
    return { r: r, d: 2 * r, c: 2 * Math.PI * r, a: Math.PI * r * r };
}

export function generateRandomGoal(mode) {
    // Generates integer numbers between min & max
    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    if (mode === 'SSS' || mode === 'SAS') {
        labState.congruence.targets[mode] = { c: rand(8, 17), b: rand(7, 14), a: rand(30, 90) };
    } else if (mode === 'ASA') {
        labState.congruence.targets.ASA = { c: rand(8, 13), a: rand(30, 70), angleB: rand(30, 70) };
    }
}

// segmentSectorModule
function roundToTwo(num) {
    return Math.round(num * 100) / 100;
}
// To be used to find length of arc
export function toRad(deg) {
    return deg * (Math.PI / 180);
}
// Using degrees law
export function sectorArea(r, deg) {
    let result = Math.PI * r * r * deg / 360;
    return roundToTwo(result);
}

export function sectorPerimeter(r, deg) {
    const arc = r * toRad(deg);
    return roundToTwo(2 * r + arc);
}

export function segmentArea(r, deg) {
    let rad = toRad(deg);
    let bracket = rad - Math.sin(rad);
    return roundToTwo(0.5 * r * r * bracket);
}

// Vectors Math Helpers
export function vecMagnitude(v) { return Math.hypot(v.x, v.y); }
export function vecAngleDeg(v) { return normalize(Math.atan2(v.y, v.x)) * RAD2DEG; }
export function vecAdd(v1, v2) { return { x: v1.x + v2.x, y: v1.y + v2.y }; }
export function vecSub(v1, v2) { return { x: v1.x - v2.x, y: v1.y - v2.y }; }