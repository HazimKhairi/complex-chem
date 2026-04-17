# Level 2: 3D Ball-and-Stick Builder — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the quiz-only Level 2 wizard with a visual 3D ball-and-stick complex builder where assembling ligands onto a bone IS the assessment.

**Architecture:** Four-step wizard (Choose Metal → Pick Geometry → Drag & Place Ligands on 3D Bone → Name Complex). Three.js renders the ball-and-stick model. HTML5 drag + Three.js raycasting handles ligand placement. Scoring is attempt-based (max 10 pts).

**Tech Stack:** Three.js (CDN), OrbitControls, vanilla JS, Astro page, Tailwind CSS.

---

### Task 1: Add Three.js CDN and update level-2.astro layout

**Files:**
- Modify: `src/pages/level-2.astro`

**Step 1: Update step indicator from 6 to 4 steps**

In `src/pages/level-2.astro`, change the step indicator array from `[1, 2, 3, 4, 5, 6]` to `[1, 2, 3, 4]` and update `i < 5` to `i < 3`:

```astro
{[1, 2, 3, 4].map((n, i) => (
  <>
    <div
      class="step-dot flex items-center justify-center rounded-full text-white font-bold text-sm shrink-0"
      data-step={n}
    >
      {n}
    </div>
    {i < 3 && <div class="step-line flex-1" />}
  </>
))}
```

**Step 2: Add 3D canvas container and ligand inventory area**

Replace the step-container div with:

```html
<!-- Step Content Container -->
<div
  id="step-container"
  class="w-full max-w-2xl bg-white rounded-2xl shadow-md p-6 sm:p-8"
  style="min-height:400px;"
>
  <p class="text-gray-400 text-center mt-20">Loading...</p>
</div>

<!-- 3D Canvas (hidden until Step 3) -->
<div id="builder-container" class="w-full max-w-2xl mt-4 hidden">
  <div class="bg-white rounded-2xl shadow-md overflow-hidden">
    <canvas id="three-canvas" class="w-full" style="height:350px; touch-action:none;"></canvas>
    <div class="p-4 border-t border-gray-100">
      <p class="text-xs text-gray-500 uppercase tracking-wide mb-2">Your Ligands — drag onto empty slots</p>
      <div id="ligand-inventory" class="flex flex-wrap gap-2 justify-center min-h-[60px]"></div>
    </div>
    <div class="p-4 border-t border-gray-100 flex justify-between items-center">
      <div class="text-sm text-gray-600">Slots filled: <strong id="slots-filled">0</strong> / <strong id="slots-total">0</strong></div>
      <div class="flex gap-2">
        <button id="btn-reset-3d" class="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm font-semibold">Reset</button>
        <button id="btn-submit-3d" class="px-4 py-2 rounded-lg bg-[#4187a0] text-white font-semibold text-sm hover:bg-[#357a91] disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed" disabled>Submit</button>
      </div>
    </div>
  </div>
</div>
```

**Step 3: Add Three.js CDN scripts before level-2-game.js**

```html
<script is:inline src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
<script is:inline src="https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/controls/OrbitControls.js"></script>
<script is:inline src="/scripts/level-2-3d-builder.js"></script>
<script is:inline src="/scripts/level-2-game.js"></script>
```

Remove the old `level-2-game.js` script tag that's already there.

**Step 4: Verify page loads without errors**

Run: `npm run dev` and navigate to `/level-2`
Expected: Page loads, "Loading..." shown, no console errors about Three.js.

**Step 5: Commit**

```bash
git add src/pages/level-2.astro
git commit -m "feat(level-2): update layout for 3D builder — 4 steps, Three.js CDN, canvas"
```

---

### Task 2: Create the 3D bone builder module (level-2-3d-builder.js)

**Files:**
- Create: `public/scripts/level-2-3d-builder.js`

**Step 1: Create the 3D builder with geometry configs**

Create `public/scripts/level-2-3d-builder.js` with:

```js
/* ============================================================
   Level 2 — 3D Ball-and-Stick Builder (level-2-3d-builder.js)
   Three.js scene: metal center, sticks, ligand slots
   ============================================================ */

(function () {
  "use strict";

  // ── Geometry slot positions (unit vectors from center) ─────
  // Each geometry defines slot positions in 3D space

  var GEOMETRY_CONFIG = {
    "Trigonal planar": {
      slots: 3,
      positions: [
        { x: 1.8, y: 0, z: 0 },
        { x: -0.9, y: 0, z: 1.56 },
        { x: -0.9, y: 0, z: -1.56 },
      ],
    },
    Tetrahedral: {
      slots: 4,
      positions: [
        { x: 1.2, y: 1.2, z: 1.2 },
        { x: -1.2, y: -1.2, z: 1.2 },
        { x: -1.2, y: 1.2, z: -1.2 },
        { x: 1.2, y: -1.2, z: -1.2 },
      ],
    },
    "Square planar": {
      slots: 4,
      positions: [
        { x: 1.8, y: 0, z: 0 },
        { x: -1.8, y: 0, z: 0 },
        { x: 0, y: 0, z: 1.8 },
        { x: 0, y: 0, z: -1.8 },
      ],
    },
    "Trigonal bipyramidal": {
      slots: 5,
      positions: [
        { x: 0, y: 2, z: 0 },
        { x: 0, y: -2, z: 0 },
        { x: 1.8, y: 0, z: 0 },
        { x: -0.9, y: 0, z: 1.56 },
        { x: -0.9, y: 0, z: -1.56 },
      ],
    },
    "Square pyramidal": {
      slots: 5,
      positions: [
        { x: 0, y: 2, z: 0 },
        { x: 1.5, y: 0, z: 1.5 },
        { x: -1.5, y: 0, z: 1.5 },
        { x: -1.5, y: 0, z: -1.5 },
        { x: 1.5, y: 0, z: -1.5 },
      ],
    },
    Octahedral: {
      slots: 6,
      positions: [
        { x: 2, y: 0, z: 0 },
        { x: -2, y: 0, z: 0 },
        { x: 0, y: 2, z: 0 },
        { x: 0, y: -2, z: 0 },
        { x: 0, y: 0, z: 2 },
        { x: 0, y: 0, z: -2 },
      ],
    },
  };

  var SPHERE_COLORS = {
    red: 0xef4444,
    blue: 0x3b82f6,
    orange: 0xf97316,
    green: 0x10b981,
  };

  var METAL_COLOR = 0x9ca3af; // grey

  // ── State ──────────────────────────────────────────────────
  var scene, camera, renderer, controls;
  var metalMesh;
  var slotMeshes = []; // { mesh, stickMesh, ligand: null, ghostMesh }
  var currentGeometry = null;
  var raycaster, mouse;
  var draggedLigand = null;
  var onPlaceCallback = null;
  var onRemoveCallback = null;

  // ── Public API ─────────────────────────────────────────────

  window.BoneBuilder = {
    init: initScene,
    buildBone: buildBone,
    destroy: destroyScene,
    getSlots: function () { return slotMeshes; },
    getFilledCount: function () {
      return slotMeshes.filter(function (s) { return s.ligand !== null; }).length;
    },
    getTotalSlots: function () { return slotMeshes.length; },
    setDraggedLigand: function (lig) { draggedLigand = lig; },
    clearDraggedLigand: function () { draggedLigand = null; },
    onPlace: function (cb) { onPlaceCallback = cb; },
    onRemove: function (cb) { onRemoveCallback = cb; },
    resetSlots: resetAllSlots,
    getPlacedLigands: function () {
      return slotMeshes
        .filter(function (s) { return s.ligand !== null; })
        .map(function (s) { return s.ligand; });
    },
  };

  // ── Scene Setup ────────────────────────────────────────────

  function initScene(canvasId) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf9fafb); // gray-50

    camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(4, 3, 5);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Orbit controls for rotation
    controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.minDistance = 3;
    controls.maxDistance = 12;

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    var backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-3, -2, -3);
    scene.add(backLight);

    // Raycaster for click detection
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Click to remove ligand from slot
    canvas.addEventListener("click", onCanvasClick);

    // Drop zone for drag & drop
    canvas.addEventListener("dragover", function (e) { e.preventDefault(); });
    canvas.addEventListener("drop", onCanvasDrop);

    // Touch drop support
    canvas.addEventListener("touchend", onTouchEnd);

    // Resize handler
    window.addEventListener("resize", function () {
      if (!canvas || !renderer || !camera) return;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    });

    animate();
  }

  function animate() {
    if (!renderer) return;
    requestAnimationFrame(animate);
    if (controls) controls.update();

    // Pulse ghost spheres
    slotMeshes.forEach(function (slot) {
      if (!slot.ligand && slot.ghostMesh) {
        var scale = 1 + 0.1 * Math.sin(Date.now() * 0.003 + slot.slotIndex);
        slot.ghostMesh.scale.setScalar(scale);
      }
    });

    renderer.render(scene, camera);
  }

  // ── Build Bone ─────────────────────────────────────────────

  function buildBone(geometryName, metalColor) {
    clearBone();
    currentGeometry = geometryName;
    var config = GEOMETRY_CONFIG[geometryName];
    if (!config) return;

    // Metal center sphere
    var metalGeo = new THREE.SphereGeometry(0.5, 32, 32);
    var metalMat = new THREE.MeshPhongMaterial({ color: metalColor || METAL_COLOR, shininess: 80 });
    metalMesh = new THREE.Mesh(metalGeo, metalMat);
    scene.add(metalMesh);

    // Create slots with sticks
    config.positions.forEach(function (pos, i) {
      // Stick (cylinder from center to slot)
      var dir = new THREE.Vector3(pos.x, pos.y, pos.z);
      var length = dir.length();
      var stickGeo = new THREE.CylinderGeometry(0.06, 0.06, length, 8);
      var stickMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
      var stickMesh = new THREE.Mesh(stickGeo, stickMat);

      // Position stick at midpoint
      stickMesh.position.set(pos.x / 2, pos.y / 2, pos.z / 2);
      // Orient stick toward slot position
      stickMesh.lookAt(new THREE.Vector3(pos.x, pos.y, pos.z));
      stickMesh.rotateX(Math.PI / 2);
      scene.add(stickMesh);

      // Ghost sphere (empty slot indicator)
      var ghostGeo = new THREE.SphereGeometry(0.35, 16, 16);
      var ghostMat = new THREE.MeshPhongMaterial({
        color: 0xcccccc,
        transparent: true,
        opacity: 0.3,
        wireframe: false,
      });
      var ghostMesh = new THREE.Mesh(ghostGeo, ghostMat);
      ghostMesh.position.set(pos.x, pos.y, pos.z);
      scene.add(ghostMesh);

      // Outer glow ring
      var ringGeo = new THREE.RingGeometry(0.4, 0.55, 32);
      var ringMat = new THREE.MeshBasicMaterial({
        color: 0x4187a0,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
      });
      var ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(pos.x, pos.y, pos.z);
      ringMesh.lookAt(camera.position);
      scene.add(ringMesh);

      slotMeshes.push({
        slotIndex: i,
        position: pos,
        ligand: null,
        ghostMesh: ghostMesh,
        stickMesh: stickMesh,
        ringMesh: ringMesh,
        ballMesh: null,
      });
    });
  }

  function clearBone() {
    // Remove all meshes from scene
    if (metalMesh) { scene.remove(metalMesh); metalMesh = null; }
    slotMeshes.forEach(function (slot) {
      if (slot.ghostMesh) scene.remove(slot.ghostMesh);
      if (slot.stickMesh) scene.remove(slot.stickMesh);
      if (slot.ringMesh) scene.remove(slot.ringMesh);
      if (slot.ballMesh) scene.remove(slot.ballMesh);
    });
    slotMeshes = [];
  }

  function resetAllSlots() {
    slotMeshes.forEach(function (slot) {
      if (slot.ballMesh) {
        scene.remove(slot.ballMesh);
        slot.ballMesh = null;
      }
      slot.ligand = null;
      if (slot.ghostMesh) slot.ghostMesh.visible = true;
      if (slot.ringMesh) slot.ringMesh.visible = true;
    });
  }

  // ── Place / Remove ─────────────────────────────────────────

  function placeLigandInSlot(slotIndex, ligand, sphereColorHex) {
    var slot = slotMeshes[slotIndex];
    if (!slot || slot.ligand) return false;

    // Create colored ball
    var ballGeo = new THREE.SphereGeometry(0.4, 32, 32);
    var ballMat = new THREE.MeshPhongMaterial({ color: sphereColorHex, shininess: 60 });
    var ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.position.set(slot.position.x, slot.position.y, slot.position.z);
    ballMesh.userData.slotIndex = slotIndex;
    scene.add(ballMesh);

    // Snap animation
    ballMesh.scale.setScalar(0.1);
    animateScale(ballMesh, 0.1, 1.0, 300);

    // Hide ghost
    slot.ghostMesh.visible = false;
    slot.ringMesh.visible = false;
    slot.ballMesh = ballMesh;
    slot.ligand = ligand;

    return true;
  }

  function removeLigandFromSlot(slotIndex) {
    var slot = slotMeshes[slotIndex];
    if (!slot || !slot.ligand) return null;

    var ligand = slot.ligand;
    scene.remove(slot.ballMesh);
    slot.ballMesh = null;
    slot.ligand = null;
    slot.ghostMesh.visible = true;
    slot.ringMesh.visible = true;

    return ligand;
  }

  function animateScale(mesh, from, to, duration) {
    var start = Date.now();
    function tick() {
      var elapsed = Date.now() - start;
      var t = Math.min(elapsed / duration, 1);
      // Ease out back
      var s = 1 - Math.pow(1 - t, 3);
      var scale = from + (to - from) * s;
      if (t < 0.7) scale = from + (to * 1.15 - from) * (t / 0.7); // overshoot
      else scale = to * 1.15 + (to - to * 1.15) * ((t - 0.7) / 0.3); // settle
      mesh.scale.setScalar(Math.max(scale, 0.01));
      if (t < 1) requestAnimationFrame(tick);
    }
    tick();
  }

  // ── Interaction ────────────────────────────────────────────

  function getIntersectedSlot(clientX, clientY) {
    var canvas = renderer.domElement;
    var rect = canvas.getBoundingClientRect();
    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // Check ghost spheres (empty slots) and ball meshes (filled slots)
    var targets = [];
    slotMeshes.forEach(function (slot) {
      if (slot.ghostMesh && slot.ghostMesh.visible) targets.push(slot.ghostMesh);
      if (slot.ballMesh) targets.push(slot.ballMesh);
    });

    var intersects = raycaster.intersectObjects(targets);
    if (intersects.length === 0) return null;

    var hit = intersects[0].object;
    for (var i = 0; i < slotMeshes.length; i++) {
      if (slotMeshes[i].ghostMesh === hit || slotMeshes[i].ballMesh === hit) {
        return slotMeshes[i];
      }
    }
    return null;
  }

  function onCanvasClick(e) {
    var slot = getIntersectedSlot(e.clientX, e.clientY);
    if (slot && slot.ligand) {
      var removed = removeLigandFromSlot(slot.slotIndex);
      if (removed && onRemoveCallback) onRemoveCallback(removed, slot.slotIndex);
    }
  }

  function onCanvasDrop(e) {
    e.preventDefault();
    if (!draggedLigand) return;

    var slot = getIntersectedSlot(e.clientX, e.clientY);
    if (slot && !slot.ligand) {
      var color = SPHERE_COLORS[draggedLigand.sphere] || 0x9ca3af;
      var placed = placeLigandInSlot(slot.slotIndex, draggedLigand, color);
      if (placed && onPlaceCallback) onPlaceCallback(draggedLigand, slot.slotIndex);
    }
    draggedLigand = null;
  }

  function onTouchEnd(e) {
    if (!draggedLigand || !e.changedTouches || !e.changedTouches.length) return;
    var touch = e.changedTouches[0];
    var slot = getIntersectedSlot(touch.clientX, touch.clientY);
    if (slot && !slot.ligand) {
      var color = SPHERE_COLORS[draggedLigand.sphere] || 0x9ca3af;
      var placed = placeLigandInSlot(slot.slotIndex, draggedLigand, color);
      if (placed && onPlaceCallback) onPlaceCallback(draggedLigand, slot.slotIndex);
    }
    draggedLigand = null;
  }

  function destroyScene() {
    clearBone();
    if (renderer) { renderer.dispose(); renderer = null; }
    if (controls) { controls.dispose(); controls = null; }
    scene = null;
    camera = null;
  }
})();
```

**Step 2: Verify file created**

Run: `ls -la public/scripts/level-2-3d-builder.js`
Expected: File exists.

**Step 3: Commit**

```bash
git add public/scripts/level-2-3d-builder.js
git commit -m "feat(level-2): add 3D ball-and-stick builder module with Three.js"
```

---

### Task 3: Rewrite level-2-game.js — new 4-step flow

**Files:**
- Modify: `public/scripts/level-2-game.js` (full rewrite)

**Step 1: Rewrite with new 4-step wizard**

Replace the entire contents of `public/scripts/level-2-game.js` with the new flow. Keep the chemistry data constants (LIGAND_CHEMISTRY, CENTRAL_METALS, GEOMETRY_MAP, ALL_GEOMETRIES, SPHERE_COLORS) exactly as-is from current file lines 11-57.

New wizard flow:
- Step 1: Choose Metal (same as current, no score)
- Step 2: Pick Geometry (new — replaces old steps 2-5)
- Step 3: 3D Builder — drag ligands onto bone (new — replaces nothing, this is the main event)
- Step 4: Name the Complex (new — IUPAC naming quiz)
- Results screen (same structure as current)

```js
/* ============================================================
   Level 2 — Build Your Complex  (level-2-game.js)
   4-step wizard: Metal → Geometry → 3D Build → Name
   ============================================================ */

(function () {
  "use strict";

  // ── Chemistry Data (unchanged from original) ───────────────

  var LIGAND_CHEMISTRY = {
    h2o:  { name: "H\u2082O",    charge: 0,  denticity: 1, type: "Monodentate", sphere: "red" },
    nh3:  { name: "NH\u2083",    charge: 0,  denticity: 1, type: "Monodentate", sphere: "blue" },
    py:   { name: "py",          charge: 0,  denticity: 1, type: "Monodentate", sphere: "blue" },
    pph3: { name: "PPh\u2083",   charge: 0,  denticity: 1, type: "Monodentate", sphere: "orange" },
    cn:   { name: "CN\u207B",    charge: -1, denticity: 1, type: "Monodentate", sphere: "blue" },
    o2:   { name: "O\u00B2\u207B", charge: -2, denticity: 1, type: "Monodentate", sphere: "red" },
    cl:   { name: "Cl\u207B",   charge: -1, denticity: 1, type: "Monodentate", sphere: "green" },
    ox:   { name: "Ox\u00B2\u207B",  charge: -2, denticity: 2, type: "Bidentate", sphere: "red" },
    acac: { name: "acac\u207B", charge: -1, denticity: 2, type: "Bidentate",  sphere: "red" },
    co32: { name: "CO\u2083\u00B2\u207B", charge: -2, denticity: 2, type: "Bidentate", sphere: "red" },
    phen: { name: "phen",       charge: 0,  denticity: 2, type: "Bidentate",  sphere: "blue" },
    bipy: { name: "bipy",       charge: 0,  denticity: 2, type: "Bidentate",  sphere: "blue" },
    en:   { name: "en",         charge: 0,  denticity: 2, type: "Bidentate",  sphere: "blue" },
  };

  var CENTRAL_METALS = [
    { name: "Co\u00B3\u207A", id: "co3", charge: 3 },
    { name: "Cr\u00B3\u207A", id: "cr3", charge: 3 },
    { name: "Fe\u00B3\u207A", id: "fe3", charge: 3 },
    { name: "Cu\u00B2\u207A", id: "cu2", charge: 2 },
    { name: "Ni\u00B2\u207A", id: "ni2", charge: 2 },
    { name: "Zn\u00B2\u207A", id: "zn2", charge: 2 },
  ];

  var GEOMETRY_MAP = {
    3: ["Trigonal planar"],
    4: ["Tetrahedral", "Square planar"],
    5: ["Trigonal bipyramidal", "Square pyramidal"],
    6: ["Octahedral"],
  };

  var ALL_GEOMETRIES = [
    "Trigonal planar", "Tetrahedral", "Square planar",
    "Trigonal bipyramidal", "Square pyramidal", "Octahedral",
  ];

  var SPHERE_COLORS_CSS = {
    red: "#EF4444", blue: "#3B82F6", orange: "#F97316", green: "#10B981",
  };

  // ── IUPAC Naming Data ──────────────────────────────────────

  // Ligand IUPAC prefixes (for naming)
  var LIGAND_IUPAC = {
    h2o: "aqua", nh3: "ammine", py: "pyridine", pph3: "triphenylphosphine",
    cn: "cyano", o2: "oxo", cl: "chlorido", ox: "oxalato",
    acac: "acetylacetonato", co32: "carbonato", phen: "phenanthroline",
    bipy: "bipyridine", en: "ethylenediamine",
  };

  var NUMBER_PREFIX = {
    1: "", 2: "di", 3: "tri", 4: "tetra", 5: "penta", 6: "hexa",
  };

  // ── Game State ─────────────────────────────────────────────

  var gameState = null;
  var gameOption = "one-vs-one";
  var playerLigands = [];

  var level2State = {
    playerId: null,
    playerName: "",
    selectedMetal: null,
    // Step 2
    selectedGeometry: null,
    geometryAttempts: 0,
    geometryScore: 0,
    geometryDone: false,
    // Step 3
    buildAttempts: 0,
    buildScore: 0,
    buildDone: false,
    // Step 4
    namingAnswer: null,
    namingScore: 0,
    namingDone: false,
    // Total
    level2Score: 0,
  };

  var currentStep = 1;

  // ── Init ───────────────────────────────────────────────────

  function init() {
    try {
      gameState = JSON.parse(sessionStorage.getItem("game-state"));
    } catch (e) {
      window.location.href = "/pass-and-play"; return;
    }
    if (!gameState) { window.location.href = "/pass-and-play"; return; }

    gameOption = sessionStorage.getItem("game-option") || "one-vs-one";

    var pl = gameState.playerLigands || {};
    for (var id in pl) {
      if (pl[id] && pl[id].length > 0) {
        level2State.playerId = id;
        playerLigands = pl[id];
        break;
      }
    }
    if (!level2State.playerId) {
      level2State.playerId = "1";
      playerLigands = [];
    }

    var nameKey = gameOption + "-player-" + level2State.playerId + "-name";
    level2State.playerName = sessionStorage.getItem(nameKey) || ("Player " + level2State.playerId);

    var info = document.getElementById("player-info");
    if (info) info.textContent = level2State.playerName + " \u2014 " + playerLigands.length + " ligand(s) collected";

    updateScoreBar();
    renderStep(1);
  }

  // ── Helpers ────────────────────────────────────────────────

  function $(id) { return document.getElementById(id); }

  function updateStepIndicator(step) {
    var dots = document.querySelectorAll(".step-dot");
    var lines = document.querySelectorAll(".step-line");
    dots.forEach(function (d, i) {
      var n = i + 1;
      d.classList.remove("active", "done");
      if (n < step) d.classList.add("done");
      else if (n === step) d.classList.add("active");
    });
    lines.forEach(function (l, i) {
      l.classList.remove("done");
      if (i + 1 < step) l.classList.add("done");
    });
  }

  function updateScoreBar() {
    var l1 = 0;
    if (gameState && gameState.playerPoints) l1 = gameState.playerPoints[level2State.playerId] || 0;
    var l2 = level2State.level2Score;
    var el1 = $("l1-score"); if (el1) el1.textContent = l1;
    var el2 = $("l2-score"); if (el2) el2.textContent = l2;
    var et  = $("total-score"); if (et) et.textContent = l1 + l2;
  }

  function navButtons(opts) {
    var html = '<div class="flex justify-between mt-8">';
    if (opts.back) {
      html += '<button id="btn-back" class="px-6 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition font-semibold">Back</button>';
    } else { html += '<div></div>'; }
    if (opts.next) {
      var dis = opts.nextDisabled ? ' disabled' : '';
      var cls = opts.nextDisabled
        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
        : 'bg-[#4187a0] text-white hover:bg-[#357a91]';
      var label = opts.nextLabel || 'Next';
      html += '<button id="btn-next" class="px-6 py-2 rounded-lg font-semibold transition ' + cls + '"' + dis + '>' + label + '</button>';
    }
    html += '</div>';
    return html;
  }

  function bindNav(opts) {
    var back = $("btn-back"), next = $("btn-next");
    if (back && opts.onBack) back.addEventListener("click", opts.onBack);
    if (next && opts.onNext) next.addEventListener("click", opts.onNext);
  }

  function renderStep(step) {
    currentStep = step;
    updateStepIndicator(step);
    // Hide 3D builder unless we're on step 3
    var bc = $("builder-container");
    if (bc) bc.classList.toggle("hidden", step !== 3);
    switch (step) {
      case 1: renderStep1(); break;
      case 2: renderStep2(); break;
      case 3: renderStep3(); break;
      case 4: renderStep4(); break;
      default: renderResults(); break;
    }
  }

  // ── Step 1: Choose Metal ───────────────────────────────────

  function renderStep1() {
    var c = $("step-container");
    var html = '<h2 class="text-xl font-bold text-gray-800 mb-1">Step 1: Choose Your Central Metal Ion</h2>';
    html += '<p class="text-gray-500 text-sm mb-6">Select one metal ion to be the centre of your complex.</p>';
    html += '<div class="grid grid-cols-3 gap-4">';
    CENTRAL_METALS.forEach(function (m) {
      var sel = level2State.selectedMetal && level2State.selectedMetal.id === m.id;
      var border = sel ? 'border-[#4187a0] ring-2 ring-[#4187a0]/30' : 'border-gray-200 hover:border-[#4187a0]/50';
      html += '<button class="metal-card p-4 rounded-xl border-2 ' + border + ' text-center transition cursor-pointer" data-metal="' + m.id + '">';
      html += '<span class="text-2xl font-bold text-gray-800 block">' + m.name + '</span>';
      html += '<span class="text-xs text-gray-500">Charge: +' + m.charge + '</span></button>';
    });
    html += '</div>';
    html += navButtons({ back: false, next: true, nextDisabled: !level2State.selectedMetal });
    c.innerHTML = html;

    document.querySelectorAll(".metal-card").forEach(function (card) {
      card.addEventListener("click", function () {
        var mid = this.getAttribute("data-metal");
        level2State.selectedMetal = CENTRAL_METALS.find(function (m) { return m.id === mid; });
        renderStep1();
      });
    });
    bindNav({ onNext: function () { renderStep(2); } });
  }

  // ── Step 2: Pick Geometry (2 pts) ──────────────────────────

  function calcCN() {
    var total = 0;
    playerLigands.forEach(function (lig) {
      var chem = LIGAND_CHEMISTRY[lig.id] || LIGAND_CHEMISTRY[(lig.id || '').toLowerCase()];
      if (chem) total += chem.denticity; else total += 1;
    });
    return total;
  }

  function renderStep2() {
    var c = $("step-container");
    var cn = calcCN();
    var correctList = GEOMETRY_MAP[cn] || [];

    var html = '<h2 class="text-xl font-bold text-gray-800 mb-1">Step 2: Choose the Geometry <span class="text-sm font-normal text-gray-400">(2 pts)</span></h2>';
    html += '<p class="text-gray-500 text-sm mb-2">Based on your ' + playerLigands.length + ' ligands (CN = ' + cn + '), pick the matching geometry.</p>';

    // Ligand summary
    html += '<div class="bg-gray-50 rounded-lg p-3 mb-4 text-sm">';
    html += '<div class="flex flex-wrap gap-2">';
    playerLigands.forEach(function (lig) {
      var chem = LIGAND_CHEMISTRY[lig.id] || LIGAND_CHEMISTRY[(lig.id || '').toLowerCase()];
      var d = chem ? chem.denticity : 1;
      var t = chem ? chem.type : "?";
      html += '<span class="px-2 py-1 bg-white rounded border text-xs">' + lig.name + ' <span class="text-gray-400">(' + t + ', d=' + d + ')</span></span>';
    });
    html += '</div>';
    html += '<p class="mt-2 text-right font-semibold">Total CN = ' + cn + '</p></div>';

    // Geometry reference images
    var imgFile = (cn <= 4) ? "1.png" : "2.png";
    html += '<div class="flex justify-center mb-4"><img src="/images/geometry/' + imgFile + '" alt="Geometry reference" class="max-h-40 rounded-lg shadow-sm" /></div>';

    // Geometry options
    var done = level2State.geometryDone;
    html += '<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">';
    ALL_GEOMETRIES.forEach(function (geo) {
      var isCorrect = correctList.indexOf(geo) >= 0;
      var cls = 'p-3 rounded-lg font-semibold text-sm border-2 transition text-center ';
      if (done) {
        if (isCorrect) cls += 'border-green-500 bg-green-50 text-green-700 ';
        else if (geo === level2State.selectedGeometry && !isCorrect) cls += 'border-red-500 bg-red-50 text-red-700 ';
        else cls += 'border-gray-200 text-gray-400 ';
        cls += 'cursor-default ';
      } else {
        cls += 'border-gray-200 hover:border-[#4187a0] cursor-pointer ';
      }
      html += '<button class="geo-btn ' + cls + '" data-val="' + geo + '"' + (done ? ' disabled' : '') + '>' + geo + '</button>';
    });
    html += '</div>';

    if (done) {
      var pts = level2State.geometryScore;
      if (pts > 0) {
        html += '<div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center font-semibold">Correct! +' + pts + ' point' + (pts > 1 ? 's' : '') + '</div>';
      } else {
        html += '<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">The correct geometry: <strong>' + correctList.join(", ") + '</strong></div>';
      }
    } else if (level2State.geometryAttempts > 0) {
      html += '<div class="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm text-center">Not quite! Try again. Attempts: ' + level2State.geometryAttempts + '/3</div>';
    }

    html += navButtons({ back: true, next: true, nextDisabled: !done });
    c.innerHTML = html;

    if (!done) {
      document.querySelectorAll(".geo-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var val = this.getAttribute("data-val");
          level2State.geometryAttempts++;
          var isCorrect = correctList.indexOf(val) >= 0;
          if (isCorrect) {
            level2State.selectedGeometry = val;
            var pts = Math.max(0, 3 - level2State.geometryAttempts); // 2, 1, 0
            level2State.geometryScore = pts;
            level2State.level2Score += pts;
            level2State.geometryDone = true;
          } else if (level2State.geometryAttempts >= 3) {
            level2State.selectedGeometry = correctList[0]; // auto-select correct
            level2State.geometryScore = 0;
            level2State.geometryDone = true;
          }
          updateScoreBar();
          renderStep2();
        });
      });
    }

    bindNav({
      onBack: function () { renderStep(1); },
      onNext: function () { renderStep(3); },
    });
  }

  // ── Step 3: 3D Build (6 pts) ───────────────────────────────

  var inventoryLigands = []; // working copy for drag & drop

  function renderStep3() {
    var c = $("step-container");
    c.innerHTML = '<h2 class="text-xl font-bold text-gray-800 mb-1">Step 3: Build Your Complex <span class="text-sm font-normal text-gray-400">(6 pts)</span></h2>'
      + '<p class="text-gray-500 text-sm mb-2">Drag ligands from your inventory and drop them onto the empty slots on the 3D model.</p>'
      + '<p class="text-sm text-gray-600">Attempt: <strong>' + (level2State.buildAttempts + 1) + '</strong> / 3 &nbsp; | &nbsp; Click a placed ball to remove it.</p>';

    // Show builder
    var bc = $("builder-container");
    if (bc) bc.classList.remove("hidden");

    // Init 3D scene if not already
    if (!window.BoneBuilder) return;
    if (!window._boneBuilderInitialized) {
      window.BoneBuilder.init("three-canvas");
      window._boneBuilderInitialized = true;
    }

    // Build bone with selected geometry
    window.BoneBuilder.buildBone(level2State.selectedGeometry);

    // Populate inventory
    inventoryLigands = playerLigands.map(function (lig, idx) {
      var chem = LIGAND_CHEMISTRY[lig.id] || LIGAND_CHEMISTRY[(lig.id || '').toLowerCase()];
      return {
        _idx: idx,
        id: lig.id,
        name: lig.name,
        sphere: chem ? chem.sphere : "red",
        denticity: chem ? chem.denticity : 1,
        charge: chem ? chem.charge : 0,
        placed: false,
      };
    });

    renderInventory();
    updateSlotCounter();

    // Callbacks
    window.BoneBuilder.onPlace(function (ligand, slotIndex) {
      // Mark ligand as placed in inventory
      for (var i = 0; i < inventoryLigands.length; i++) {
        if (inventoryLigands[i]._idx === ligand._idx && !inventoryLigands[i].placed) {
          inventoryLigands[i].placed = true;
          break;
        }
      }
      renderInventory();
      updateSlotCounter();
    });

    window.BoneBuilder.onRemove(function (ligand, slotIndex) {
      // Mark ligand as available in inventory
      for (var i = 0; i < inventoryLigands.length; i++) {
        if (inventoryLigands[i]._idx === ligand._idx) {
          inventoryLigands[i].placed = false;
          break;
        }
      }
      renderInventory();
      updateSlotCounter();
    });

    // Reset button
    var resetBtn = $("btn-reset-3d");
    if (resetBtn) {
      resetBtn.onclick = function () {
        window.BoneBuilder.resetSlots();
        inventoryLigands.forEach(function (l) { l.placed = false; });
        renderInventory();
        updateSlotCounter();
      };
    }

    // Submit button
    var submitBtn = $("btn-submit-3d");
    if (submitBtn) {
      submitBtn.onclick = function () { handleBuildSubmit(); };
    }
  }

  function renderInventory() {
    var inv = $("ligand-inventory");
    if (!inv) return;
    var html = '';
    inventoryLigands.forEach(function (lig) {
      if (lig.placed) return; // don't show placed ligands
      var color = SPHERE_COLORS_CSS[lig.sphere] || '#9CA3AF';
      html += '<div class="lig-drag-card flex flex-col items-center gap-1 p-2 rounded-lg border-2 border-gray-200 bg-white cursor-grab hover:border-[#4187a0] hover:shadow-md transition select-none" draggable="true" data-idx="' + lig._idx + '">';
      html += '<div class="w-8 h-8 rounded-full shadow-inner" style="background-color:' + color + '"></div>';
      html += '<span class="text-xs font-bold text-gray-700">' + lig.name + '</span>';
      html += '</div>';
    });
    if (html === '') html = '<p class="text-gray-400 text-sm">All ligands placed!</p>';
    inv.innerHTML = html;

    // Bind drag events
    document.querySelectorAll(".lig-drag-card").forEach(function (card) {
      card.addEventListener("dragstart", function (e) {
        var idx = parseInt(this.getAttribute("data-idx"), 10);
        var lig = inventoryLigands.find(function (l) { return l._idx === idx; });
        if (lig) window.BoneBuilder.setDraggedLigand(lig);
        e.dataTransfer.setData("text/plain", idx);
        this.style.opacity = "0.4";
      });
      card.addEventListener("dragend", function () {
        this.style.opacity = "1";
        window.BoneBuilder.clearDraggedLigand();
      });

      // Touch drag support
      card.addEventListener("touchstart", function (e) {
        var idx = parseInt(this.getAttribute("data-idx"), 10);
        var lig = inventoryLigands.find(function (l) { return l._idx === idx; });
        if (lig) window.BoneBuilder.setDraggedLigand(lig);
      });
    });
  }

  function updateSlotCounter() {
    var filled = $("slots-filled");
    var total = $("slots-total");
    var submitBtn = $("btn-submit-3d");
    if (filled) filled.textContent = window.BoneBuilder.getFilledCount();
    if (total) total.textContent = window.BoneBuilder.getTotalSlots();
    if (submitBtn) {
      var allFilled = window.BoneBuilder.getFilledCount() === window.BoneBuilder.getTotalSlots();
      submitBtn.disabled = !allFilled;
      submitBtn.className = allFilled
        ? 'px-4 py-2 rounded-lg bg-[#4187a0] text-white font-semibold text-sm hover:bg-[#357a91]'
        : 'px-4 py-2 rounded-lg bg-gray-300 text-gray-500 font-semibold text-sm cursor-not-allowed';
    }
  }

  function handleBuildSubmit() {
    level2State.buildAttempts++;
    var placed = window.BoneBuilder.getPlacedLigands();

    // Validate: CN must match
    var totalDent = 0;
    var totalCharge = level2State.selectedMetal.charge;
    placed.forEach(function (lig) {
      var chem = LIGAND_CHEMISTRY[lig.id] || LIGAND_CHEMISTRY[(lig.id || '').toLowerCase()];
      if (chem) {
        totalDent += chem.denticity;
        totalCharge += chem.charge;
      }
    });

    var expectedSlots = window.BoneBuilder.getTotalSlots();
    var valid = (placed.length === expectedSlots);

    if (valid) {
      // Score based on attempt number
      var pts = level2State.buildAttempts === 1 ? 6 : (level2State.buildAttempts === 2 ? 4 : 2);
      level2State.buildScore = pts;
      level2State.level2Score += pts;
      level2State.buildDone = true;
      updateScoreBar();

      // Show success in step container
      var c = $("step-container");
      c.innerHTML = '<div class="text-center py-8">'
        + '<div class="text-5xl mb-4">&#9989;</div>'
        + '<h2 class="text-xl font-bold text-green-700 mb-2">Complex Built Successfully!</h2>'
        + '<p class="text-gray-600 mb-2">+' + pts + ' points (attempt ' + level2State.buildAttempts + '/3)</p>'
        + '<p class="text-sm text-gray-500 mb-6">Your complex: [' + level2State.selectedMetal.name + '] with ' + placed.length + ' ligands</p>'
        + navButtons({ back: false, next: true, nextLabel: "Next: Name Your Complex" })
        + '</div>';
      bindNav({ onNext: function () { renderStep(4); } });
    } else if (level2State.buildAttempts >= 3) {
      // Out of attempts
      level2State.buildScore = 0;
      level2State.buildDone = true;
      updateScoreBar();

      var c = $("step-container");
      c.innerHTML = '<div class="text-center py-8">'
        + '<div class="text-5xl mb-4">&#128546;</div>'
        + '<h2 class="text-xl font-bold text-red-700 mb-2">No attempts remaining</h2>'
        + '<p class="text-gray-600 mb-6">0 points for assembly</p>'
        + navButtons({ back: false, next: true, nextLabel: "Next: Name Your Complex" })
        + '</div>';
      bindNav({ onNext: function () { renderStep(4); } });
    } else {
      // Wrong — allow retry
      var c = $("step-container");
      c.innerHTML = '<div class="text-center py-4">'
        + '<h2 class="text-lg font-bold text-orange-700 mb-2">Not quite right! Try again.</h2>'
        + '<p class="text-sm text-gray-600 mb-4">Attempts used: ' + level2State.buildAttempts + '/3</p>'
        + '<button id="btn-retry" class="px-6 py-2 rounded-lg bg-[#4187a0] text-white font-semibold hover:bg-[#357a91]">Retry</button>'
        + '</div>';
      $("btn-retry").addEventListener("click", function () {
        window.BoneBuilder.resetSlots();
        inventoryLigands.forEach(function (l) { l.placed = false; });
        renderStep3();
      });
    }
  }

  // ── Step 4: Name the Complex (2 pts) ───────────────────────

  function generateIUPACName() {
    var metal = level2State.selectedMetal;
    var placed = window.BoneBuilder ? window.BoneBuilder.getPlacedLigands() : [];

    // Count ligands by type
    var ligCounts = {};
    placed.forEach(function (lig) {
      var iupac = LIGAND_IUPAC[lig.id] || lig.name;
      ligCounts[iupac] = (ligCounts[iupac] || 0) + 1;
    });

    // Sort alphabetically, build name
    var parts = [];
    Object.keys(ligCounts).sort().forEach(function (name) {
      var count = ligCounts[name];
      parts.push((NUMBER_PREFIX[count] || '') + name);
    });

    // Metal name + oxidation state
    var metalBase = metal.id.replace(/[0-9]/g, '');
    var metalNames = { co: "cobalt", cr: "chromium", fe: "iron", cu: "copper", ni: "nickel", zn: "zinc" };
    var metalName = metalNames[metalBase] || metalBase;

    // Determine charge to decide if anionic (use -ate suffix)
    var totalCharge = metal.charge;
    placed.forEach(function (lig) {
      var chem = LIGAND_CHEMISTRY[lig.id] || LIGAND_CHEMISTRY[(lig.id || '').toLowerCase()];
      if (chem) totalCharge += chem.charge;
    });

    var romanNumerals = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI" };
    var roman = romanNumerals[metal.charge] || metal.charge;

    var complexName;
    if (totalCharge < 0) {
      // Anionic — use -ate form
      var ateNames = { co: "cobaltate", cr: "chromate", fe: "ferrate", cu: "cuprate", ni: "nickelate", zn: "zincate" };
      complexName = parts.join('') + (ateNames[metalBase] || metalName + 'ate') + '(' + roman + ')';
    } else {
      complexName = parts.join('') + metalName + '(' + roman + ')';
    }

    return complexName;
  }

  function generateDistractors(correct) {
    var distractors = [];
    var metals = ["cobalt", "chromium", "iron", "copper", "nickel", "zinc"];
    var prefixes = ["di", "tri", "tetra", "hexa"];

    // Distractor 1: wrong metal
    var wrongMetal = metals.find(function (m) { return correct.indexOf(m) === -1 && correct.indexOf(m + 'ate') === -1; }) || "manganese";
    distractors.push(correct.replace(/cobalt|chromium|iron|copper|nickel|zinc|cobaltate|chromate|ferrate|cuprate|nickelate|zincate/i, wrongMetal));

    // Distractor 2: wrong prefix
    distractors.push(correct.replace(/di|tri|tetra|penta|hexa/, function (m) {
      var idx = prefixes.indexOf(m);
      return prefixes[(idx + 1) % prefixes.length];
    }));

    // Distractor 3: wrong oxidation state
    distractors.push(correct.replace(/\(I+V?\)/, function (m) {
      return m === "(III)" ? "(II)" : "(III)";
    }));

    // Remove duplicates of correct answer
    return distractors.filter(function (d) { return d !== correct; }).slice(0, 3);
  }

  function renderStep4() {
    var bc = $("builder-container");
    if (bc) bc.classList.add("hidden");

    var c = $("step-container");
    var correct = generateIUPACName();
    var distractors = generateDistractors(correct);

    // Shuffle options
    var options = [correct].concat(distractors);
    for (var i = options.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = options[i]; options[i] = options[j]; options[j] = tmp;
    }

    var done = level2State.namingDone;

    var html = '<h2 class="text-xl font-bold text-gray-800 mb-1">Step 4: Name Your Complex <span class="text-sm font-normal text-gray-400">(2 pts)</span></h2>';
    html += '<p class="text-gray-500 text-sm mb-6">Select the correct IUPAC name for the complex you built.</p>';

    html += '<div class="space-y-3">';
    options.forEach(function (opt, i) {
      var letter = String.fromCharCode(65 + i);
      var cls = 'w-full p-4 rounded-lg text-left border-2 transition font-medium ';
      if (done) {
        if (opt === correct) cls += 'border-green-500 bg-green-50 text-green-700 ';
        else if (opt === level2State.namingAnswer && opt !== correct) cls += 'border-red-500 bg-red-50 text-red-700 ';
        else cls += 'border-gray-200 text-gray-400 ';
        cls += 'cursor-default ';
      } else {
        cls += 'border-gray-200 hover:border-[#4187a0] cursor-pointer ';
      }
      html += '<button class="name-btn ' + cls + '" data-val="' + opt + '"' + (done ? ' disabled' : '') + '>' + letter + '. ' + opt + '</button>';
    });
    html += '</div>';

    if (done) {
      if (level2State.namingScore > 0) {
        html += '<div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center font-semibold">Correct! +2 points</div>';
      } else {
        html += '<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">Incorrect. The answer is <strong>' + correct + '</strong></div>';
      }
    }

    html += navButtons({ back: false, next: true, nextDisabled: !done, nextLabel: "See Results" });
    c.innerHTML = html;

    if (!done) {
      document.querySelectorAll(".name-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var val = this.getAttribute("data-val");
          level2State.namingAnswer = val;
          level2State.namingDone = true;
          if (val === correct) {
            level2State.namingScore = 2;
            level2State.level2Score += 2;
          }
          updateScoreBar();
          renderStep4();
        });
      });
    }

    bindNav({ onNext: function () { renderResults(); } });
  }

  // ── Results ────────────────────────────────────────────────

  function renderResults() {
    updateStepIndicator(5);
    var bc = $("builder-container"); if (bc) bc.classList.add("hidden");
    var c = $("step-container");
    var l1 = 0;
    if (gameState && gameState.playerPoints) l1 = gameState.playerPoints[level2State.playerId] || 0;
    var l2 = level2State.level2Score;
    var grand = l1 + l2;

    var html = '<div class="text-center">';
    html += '<div class="text-6xl mb-4">&#127942;</div>';
    html += '<h2 class="text-2xl font-bold text-gray-800 mb-2">Level 2 Complete!</h2>';
    html += '<p class="text-gray-500 mb-6">' + level2State.playerName + ', here is your score breakdown.</p>';

    html += '<div class="bg-gray-50 rounded-lg p-6 text-left max-w-sm mx-auto">';
    html += '<table class="w-full text-sm"><tbody>';
    html += '<tr class="border-b border-gray-200"><td class="py-2 text-gray-600">Level 1 Points</td><td class="py-2 text-right font-bold">' + l1 + '</td></tr>';
    html += '<tr class="border-b border-gray-200"><td class="py-2 text-gray-600">Step 2: Geometry</td><td class="py-2 text-right font-bold">' + level2State.geometryScore + ' / 2</td></tr>';
    html += '<tr class="border-b border-gray-200"><td class="py-2 text-gray-600">Step 3: Assembly</td><td class="py-2 text-right font-bold">' + level2State.buildScore + ' / 6</td></tr>';
    html += '<tr class="border-b border-gray-200"><td class="py-2 text-gray-600">Step 4: Naming</td><td class="py-2 text-right font-bold">' + level2State.namingScore + ' / 2</td></tr>';
    html += '<tr class="text-lg"><td class="pt-3 font-bold text-gray-800">Grand Total</td><td class="pt-3 text-right font-bold text-[#4187a0]">' + grand + '</td></tr>';
    html += '</tbody></table></div>';

    html += '<a href="/" class="inline-block mt-8 px-8 py-3 rounded-lg bg-[#4187a0] text-white font-semibold hover:bg-[#357a91] transition">Back to Menu</a>';
    html += '</div>';

    c.innerHTML = html;
    updateScoreBar();
  }

  // ── Boot ───────────────────────────────────────────────────

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
```

**Step 2: Verify game loads**

Run: `npm run dev`, navigate to `/level-2` (with game-state in sessionStorage)
Expected: Step 1 shows metal selection, step indicator shows 4 steps.

**Step 3: Commit**

```bash
git add public/scripts/level-2-game.js
git commit -m "feat(level-2): rewrite wizard — 4 steps with 3D builder integration"
```

---

### Task 4: Integration test — full flow walkthrough

**Files:** None (testing only)

**Step 1: Start dev server and test full flow**

Run: `npm run dev`

Test checklist:
1. Play Level 1, collect at least 3 ligands, trigger Level 2
2. Step 1: Select a metal → Next button enables → click Next
3. Step 2: Pick geometry → correct/wrong feedback → Next after done
4. Step 3: 3D model appears with bone → drag ligands from inventory → slots fill → Submit
5. Step 4: Name the complex → select answer → See Results
6. Results screen shows correct score breakdown

**Step 2: Test touch on mobile/tablet**

Open dev tools → toggle device toolbar → test drag on touch.

**Step 3: Fix any issues found during testing**

Address bugs as needed.

**Step 4: Final commit**

```bash
git add -A
git commit -m "fix(level-2): address integration test feedback"
```

---

### Task 5: Commit and push everything

**Step 1: Push all commits**

```bash
git push
```
