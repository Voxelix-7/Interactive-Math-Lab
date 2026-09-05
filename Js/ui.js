// UI helpers: resetLab, randomFact, DOM panel helpers

import { currentModule, setCanvas, setCtx, setCurrentModule } from './state.js';
const infoBtn = document.getElementById("info");
const factsBox = document.getElementById("funFacts");

// Re-export infoBtn and factsBox to access them
export { infoBtn, factsBox };

export function resetLab() {
    const container = document.getElementById("canvas-container");
    const dataPanel = document.getElementById("dataPanel");
    if (container) container.innerHTML = "";
    setCtx(null);
    setCanvas(null);
    if (dataPanel) dataPanel.innerHTML = '<p class="dataP">Laws and theorems will appear here.</p>';
    setCurrentModule(null);
    setFactsOpen(false);
}

export function randomFact() {
    const facts = currentModule?.getFacts();
    if (!facts?.length) {
        factsBox.textContent = "No facts available.";
        return;
    }
    const randomIndex = Math.floor(Math.random() * facts.length);
    factsBox.textContent = facts[randomIndex];
}

function setFactsOpen(isOpen) {
    if (!infoBtn || !factsBox) return;
    factsBox.classList.toggle("is-hidden", !isOpen);
    infoBtn.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) randomFact();
}

// Hover + click and keyboard support touch devices.
if (infoBtn && factsBox) {
    infoBtn.addEventListener("mouseenter", () => {
        if (window.matchMedia?.("(hover: hover)").matches) setFactsOpen(true);
    });
    infoBtn.addEventListener("mouseleave", () => {
        if (window.matchMedia?.("(hover: hover)").matches) setFactsOpen(false);
    });
    infoBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        setFactsOpen(factsBox.classList.contains("is-hidden"));
    });
    document.addEventListener("click", (event) => {
        if (!infoBtn.contains(event.target) && !factsBox.contains(event.target)) setFactsOpen(false);
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setFactsOpen(false);
    });
    infoBtn.setAttribute("aria-controls", "funFacts");
    infoBtn.setAttribute("aria-expanded", "false");
}

// Sets the dataPanel innerHTML and returns the panel element
export function setPanel(html) {
    const panel = document.getElementById("dataPanel");
    if (panel) panel.innerHTML = html;
    return panel;
}

// Shared dropdown menu helper used by subtendedAngles and tangentSecant modules
export function attachDropdownMenu(onModeChange) {
    const btn  = document.getElementById("show-btn");
    const menu = document.getElementById("dropdown-menu");
    if (!btn || !menu) return;
    btn.onclick = (e) => { e.stopPropagation(); menu.classList.toggle("show-flex"); };
    document.querySelectorAll(".menu-item").forEach(item => {
        item.onclick = () => {
            menu.classList.remove("show-flex");
            onModeChange(item.getAttribute("data-mode"));
        };
    });
    document.addEventListener("click", () => menu.classList.remove("show-flex"));
}
