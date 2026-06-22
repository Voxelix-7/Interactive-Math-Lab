// math.js — Pure math helper functions

import { TAU, labState } from './state.js';
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
export function toRad(deg) {
    return deg * Math.PI / 180;
}

export function sectorArea(r, deg) {
    return Math.PI * r * r * deg / 360;
}

export function sectorPerimeter(r, deg) {
    const arc = r * toRad(deg);
    return 2 * r + arc;
}