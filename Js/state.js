// shared variables, constants, and app state

export let canvas = null;
export let ctx = null;
export let currentModule = null;
export let dragging = null;
export const TAU = 2 * Math.PI;
export const RAD2DEG = 180 / Math.PI;
export const cmToPx = 37.8;
export const polygonNames = {
  3: "Triangle", 4: "Quadrilateral", 5: "Pentagon", 6: "Hexagon",
  7: "Heptagon", 8: "Octagon", 9: "Nonagon", 10: "Decagon",
  11: "Hendecagon", 12: "Dodecagon"
};

export let labState = {
  pythagoras: {
    sideA: 120,
    sideB: 100,
    originX: 250,
    originY: 250
  },

  congruence: {
    mode: 'SAS',
    tri: {
      b: 10,
      c: 12,
      a: 60,
      angleB: 60
    },
    targets: {
      SSS: {},
      SAS: {},
      ASA: {}
    }
  },

  polygons: {
    sides: 6,
    radius: 100,
    showDecomposition: false
  },

  circles: {
    radiusCm: 5
  },

  subtendedAngles: {
    radius: 110,
    points: {
      A: 0,
      B: 1.5,
      C: 3.5
    }
  },
  
    sector: {
      radius: 110,
      angleDeg: 90
    }
  
};

export function setCanvas(c)        { canvas = c; }
export function setCtx(c)           { ctx = c; }
export function setCurrentModule(m) { currentModule = m; }
export function setDragging(d)      { dragging = d; }
