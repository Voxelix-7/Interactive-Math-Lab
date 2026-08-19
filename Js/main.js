import { resetLab, infoBtn } from './ui.js';
import { draw } from './canvas.js';
import { generateRandomGoal } from './math.js';
import { pythagorasModule } from './modules/pythagoras.js';
import { congruenceModule } from './modules/congruence.js';
import { polygonModule } from './modules/polygons.js';
import { circleModule } from './modules/circles.js';
import { subtendedAnglesModule } from './modules/subtendedAngles.js';
import { sectorSegmentModule } from './modules/sectorSegment.js';
import { unitCircleModule } from './modules/unitCircle.js';
import { elevDeprModule } from './modules/elevationDepression.js';
import { vectorExplorerModule, boatModeModule } from './modules/vectors.js';
import { setCurrentModule } from './state.js';

// App Initialization 
window.onload = function() {
    ['SSS', 'SAS', 'ASA'].forEach(generateRandomGoal);

    const startBtn = document.getElementById("startBtn");
    const welcomeScreen = document.querySelector(".welcome-screen");
    const labInterface = document.getElementById("lab-interface");
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const navBackdrop = document.getElementById("navBackdrop");
    const navigation = document.getElementById("topicNavigation");

    // Generic category-menu wiring: every top-level ".category" that contains
    // a ".category-menu" gets toggle/close behavior automatically. This means
    // adding a brand new category in index.html never requires touching this
    // file again — a category left out of a hardcoded list would otherwise
    // silently never open.
    const categoryEls = Array.from(document.querySelectorAll(".category"));
    const menus = categoryEls
        .map(btn => ({ btn, element: btn.querySelector(".category-menu") }))
        .filter(({ element }) => element);

    const closeAllMenus = () => { menus.forEach(menu => menu.element?.classList.remove("show-menu")); };

    const setNavigationOpen = (isOpen) => {
        navigation?.classList.toggle("nav-open", isOpen);
        navBackdrop?.classList.toggle("is-visible", isOpen);
        navBackdrop?.setAttribute("aria-hidden", String(!isOpen));
        mobileMenuBtn?.setAttribute("aria-expanded", String(isOpen));
        document.body.classList.toggle("menu-open", isOpen);
    };

    mobileMenuBtn?.addEventListener("click", (e) => {
        e.stopPropagation();
        setNavigationOpen(!navigation?.classList.contains("nav-open"));
    });
    navBackdrop?.addEventListener("click", () => setNavigationOpen(false));
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            setNavigationOpen(false);
            closeAllMenus();
        }
    });

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            [welcomeScreen, infoBtn].forEach(element => element.style.display = "none");
            labInterface.style.display = "flex";
            setTimeout(() => labInterface.classList.add("fade"), 10);
        });
    }

    menus.forEach(({ btn, element }) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = element.classList.contains("show-menu");
            menus.forEach(other => other.element?.classList.remove("show-menu"));
            if (!isOpen) element.classList.add("show-menu");
        });
    });

    document.addEventListener('click', (e) => {
        menus.forEach(({ btn, element }) => {
            if (element && !btn.contains(e.target)) element.classList.remove("show-menu");
        });
    });

    const setupLab = (id, callback) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                callback();
                closeAllMenus();
                setNavigationOpen(false);
            });
        }
    };

    // Labs Assignment 
    const labs = {
        pythagorasBtn: pythagorasModule,
        congruenceBtn: congruenceModule,
        subtendedAnglesBtn: subtendedAnglesModule,
        polygonBtn: polygonModule,
        circlePropsBtn: circleModule,
        sectorSegmentBtn: sectorSegmentModule,
        unitCircleBtn: unitCircleModule,
        elevationDepressionBtn: elevDeprModule,
        vectorExplorerBtn: vectorExplorerModule,
        boatModeBtn: boatModeModule
    };
    Object.entries(labs).forEach(([btnId, module]) => {
        setupLab(btnId, () => {
            if (module && typeof module.init === 'function') {
                resetLab();
                setCurrentModule(module);
                module.init();
                draw();
            }
        });
    });
};