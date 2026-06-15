import { resetLab } from './ui.js';
import { draw } from './canvas.js';
import { generateRandomGoal } from './math.js';
import { pythagorasModule } from './modules/pythagoras.js';
import { congruenceModule } from './modules/congruence.js';
import { polygonModule } from './modules/polygons.js';
import { circleModule } from './modules/circles.js';
import { subtendedAnglesModule } from './modules/subtendedAngles.js';
import { tangentSecantModule } from './modules/tangentSecant.js';

// App Initialization 
window.onload = function() {
    ['SSS', 'SAS', 'ASA'].forEach(generateRandomGoal);

    const startBtn = document.getElementById("startBtn");
    const welcomeScreen = document.querySelector(".welcome-screen");
    const labInterface = document.getElementById("lab-interface");
    const menus = [
    { btn: document.getElementById("geometryBtn"), element: document.getElementById("geoDropdown") },
    { btn: document.getElementById("circlesBtn"), element: document.getElementById("circlesDropdown") }
    ];
    const closeAllMenus = () => {menus.forEach(menu => menu.element?.classList.remove("show-menu"));};

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            [welcomeScreen, infoBtn].forEach(element => element.style.display = "none");
            labInterface.style.display = "flex";
            setTimeout(() => labInterface.classList.add("fade"), 10);
        });
    }
  
    menus.forEach(({ btn, element }) => {
    if (btn && element) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            element.classList.toggle("show-menu");
            menus.forEach(other => {
                if (other.element !== element) other.element?.classList.remove("show-menu");
            });
        });
    }
    });

    document.addEventListener('click', (e) => {
    menus.forEach(({ btn, element }) => {
        if (element && !btn.contains(e.target)) element.classList.remove("show-menu");
    });
    });

    const setupLab = (id, callback) => {
    const btn = document.getElementById(id);
    if (btn) {
        btn.addEventListener('click', () => {
            callback();
            closeAllMenus();
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
    tangentBtn: tangentSecantModule
    };
    Object.entries(labs).forEach(([btnId, module]) => {
    setupLab(btnId, () => {
        if (module && typeof module.init === 'function') {
            resetLab();
            currentModule = module;
            module.init();
            draw();
        }
    });
});
};
