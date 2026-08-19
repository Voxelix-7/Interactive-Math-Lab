// canvas.js — Canvas setup and all drawing helper functions

import { canvas, ctx, currentModule, setCanvas, setCtx } from './state.js';
import { shortestDiff } from './math.js';
import { infoBtn, factsBox } from './ui.js';

let canvasResizeObserver = null;

export function createCanvasOnce(options = {}) {
    const container = document.getElementById("canvas-container");
    if (!container || document.getElementById("myCanvas")) return;

    if (!options.responsive) canvasResizeObserver?.disconnect();

    const newCanvas = Object.assign(document.createElement('canvas'), {
        id: "myCanvas",
        width: 550,
        height: 400
    });

    if (options.responsive) newCanvas.classList.add('responsive-canvas');

    container.appendChild(newCanvas);
    setCanvas(newCanvas);
    setCtx(newCanvas.getContext("2d"));
    if (infoBtn && factsBox) { infoBtn.style.display = 'flex'; }
  
    // Drag handlers, imported to avoid circular dependency
    import('./drag.js').then(({ startDrag, drag, stopDrag }) => {
        const events = [
            { target: newCanvas, types: ["mousedown", "touchstart"],  handler: startDrag },
            { target: window,    types: ["mousemove", "touchmove"],   handler: drag      },
            { target: window,    types: ["mouseup",   "touchend"],    handler: stopDrag  }
        ];
        events.forEach(({ target, types, handler }) =>
            types.forEach(evt => target.addEventListener(evt, handler, { passive: false }))
        );
    });

    if (options.responsive) {
        const resizeCanvas = () => {
            const width = Math.round(container.clientWidth);
            const height = Math.round(container.clientHeight);
            if (!width || !height || (newCanvas.width === width && newCanvas.height === height)) return;
            newCanvas.width = width;
            newCanvas.height = height;
            draw();
        };

        canvasResizeObserver?.disconnect();
        canvasResizeObserver = new ResizeObserver(resizeCanvas);
        canvasResizeObserver.observe(container);
        resizeCanvas();
    } else {
        draw();
    }
}

export function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (currentModule && currentModule.draw) {
        currentModule.draw(ctx);
    }
}

export function drawDragger(p) {
    ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, 7);
    ctx.fillStyle = "#f39c12"; ctx.fill();
    ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.stroke();
}

export function drawSimpleSquare(p1, p2, color, dir) {
    const s = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    ctx.beginPath(); ctx.fillStyle = color + "33"; ctx.strokeStyle = color;
    p1.x === p2.x ? ctx.rect(p1.x, p1.y, dir * s, -s) : ctx.rect(p1.x, p1.y, s, dir * s);
    ctx.fill(); ctx.stroke();
}

export function drawHypotenuseSquare(p1, p2, color) {
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const ox = -dy, oy = dx;
    ctx.beginPath(); ctx.fillStyle = color + "33"; ctx.strokeStyle = color;
    ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p2.x + ox, p2.y + oy);
    ctx.lineTo(p1.x + ox, p1.y + oy);
    ctx.closePath(); ctx.fill(); ctx.stroke();
}

export function drawArc(ctx, cx, cy, r, start, end, color) {
    const diff = shortestDiff(start, end);
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, start + diff, diff < 0);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.stroke();
}

export function drawArrow(from, to, color, width = 3) {
    const headLen = 12;
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 6), to.y - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 6), to.y - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

export function drawGrid(cx, cy, width, height, spacing = 30) {
    ctx.save();
    ctx.strokeStyle = "#eee0d0";
    ctx.lineWidth = 1;
    for (let gx = cx % spacing; gx < width; gx += spacing) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, height); ctx.stroke();
    }
    for (let gy = cy % spacing; gy < height; gy += spacing) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(width, gy); ctx.stroke();
    }
    ctx.strokeStyle = "#bcaaa4";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(width, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, height); ctx.stroke();
    ctx.restore();
}