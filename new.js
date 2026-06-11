// Variables
let canvas, ctx;
let currentModule = null;
let dragging = null;
const cmToPx = 37.8;
const infoBtn = document.getElementById("info");
const factsBox = document.getElementById("funFacts");
const polygonNames = {
  3: "Triangle", 4: "Quadrilateral", 5: "Pentagon", 6: "Hexagon",
  7: "Heptagon", 8: "Octagon", 9: "Nonagon", 10: "Decagon", 
  11: "Hendecagon", 12: "Dodecagon"
};

let labstate: {
  active: 'none',
  
  pythagoras: {
    sideA: 120,
    sideB: 100,
    originX: 250,
    originY: 250
  },

  congruence: {
    mode: 'SAS',
    triangle: {
      sideB: 10,
      sideC: 12,
      angleA: 60,
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
    points: { // Angle points
      A: 0,
      B: 1.5,
      C: 3.5
    }
  }

  tangents: {
    tangentAngle: 0.8,
    pointAngle: 0.2,
    pointDistance: 190
  }
};
