/* ============================================================
   Level 2 — 3D Ball-and-Stick Builder (level-2-3d-builder.js)
   Three.js scene: metal center, sticks, ligand slots
   ============================================================ */

(function () {
  "use strict";

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

  var METAL_COLOR = 0x9ca3af;

  var scene, camera, renderer, controls;
  var metalMesh;
  var slotMeshes = [];
  var currentGeometry = null;
  var raycaster, mouse;
  var draggedLigand = null;
  var onPlaceCallback = null;
  var onRemoveCallback = null;

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

  function initScene(canvasId) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf9fafb);

    camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(4, 3, 5);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.minDistance = 3;
    controls.maxDistance = 12;

    var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    var backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-3, -2, -3);
    scene.add(backLight);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    canvas.addEventListener("click", onCanvasClick);
    canvas.addEventListener("dragover", function (e) { e.preventDefault(); });
    canvas.addEventListener("drop", onCanvasDrop);
    canvas.addEventListener("touchend", onTouchEnd);

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

    slotMeshes.forEach(function (slot) {
      if (!slot.ligand && slot.ghostMesh) {
        var scale = 1 + 0.1 * Math.sin(Date.now() * 0.003 + slot.slotIndex);
        slot.ghostMesh.scale.setScalar(scale);
      }
    });

    renderer.render(scene, camera);
  }

  function buildBone(geometryName, metalColor) {
    clearBone();
    currentGeometry = geometryName;
    var config = GEOMETRY_CONFIG[geometryName];
    if (!config) return;

    var metalGeo = new THREE.SphereGeometry(0.5, 32, 32);
    var metalMat = new THREE.MeshPhongMaterial({ color: metalColor || METAL_COLOR, shininess: 80 });
    metalMesh = new THREE.Mesh(metalGeo, metalMat);
    scene.add(metalMesh);

    config.positions.forEach(function (pos, i) {
      var dir = new THREE.Vector3(pos.x, pos.y, pos.z);
      var length = dir.length();
      var stickGeo = new THREE.CylinderGeometry(0.06, 0.06, length, 8);
      var stickMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
      var stickMesh = new THREE.Mesh(stickGeo, stickMat);

      stickMesh.position.set(pos.x / 2, pos.y / 2, pos.z / 2);
      stickMesh.lookAt(new THREE.Vector3(pos.x, pos.y, pos.z));
      stickMesh.rotateX(Math.PI / 2);
      scene.add(stickMesh);

      var ghostGeo = new THREE.SphereGeometry(0.35, 16, 16);
      var ghostMat = new THREE.MeshPhongMaterial({
        color: 0xcccccc,
        transparent: true,
        opacity: 0.3,
      });
      var ghostMesh = new THREE.Mesh(ghostGeo, ghostMat);
      ghostMesh.position.set(pos.x, pos.y, pos.z);
      scene.add(ghostMesh);

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
      // Also wipe the donor-atom label sprite — without this the
      // O / N / P / Cl text floats in space after Reset.
      if (slot.labelMesh) {
        scene.remove(slot.labelMesh);
        slot.labelMesh = null;
      }
      if (slot._arcMesh) {
        scene.remove(slot._arcMesh);
        slot._arcMesh = null;
      }
      slot._pairedWith = undefined;
      slot.ligand = null;
      if (slot.ghostMesh) slot.ghostMesh.visible = true;
      if (slot.ringMesh) slot.ringMesh.visible = true;
    });
  }

  function makeLabelSprite(text, bgHex) {
    // Draw a round label on a 256x256 canvas, wrap as a Three.js sprite.
    var size = 256;
    var canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, size, size);
    // Bigger, bolder text. White fill + thick black outline so it
    // reads on any sphere colour.
    ctx.font = "900 140px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 18;
    ctx.strokeText(text, size / 2, size / 2);
    ctx.fillStyle = "#fff";
    ctx.fillText(text, size / 2, size / 2);
    var tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    var mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthTest: false,   // never get hidden behind the sphere
      depthWrite: false,
    });
    var sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.7, 0.7, 1);
    sprite.renderOrder = 999;  // draw last → always on top
    return sprite;
  }

  function placeLigandInSlot(slotIndex, ligand, sphereColorHex) {
    var slot = slotMeshes[slotIndex];
    if (!slot || slot.ligand) return false;

    var ballGeo = new THREE.SphereGeometry(0.45, 32, 32);
    var ballMat = new THREE.MeshPhongMaterial({ color: sphereColorHex, shininess: 60 });
    var ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.position.set(slot.position.x, slot.position.y, slot.position.z);
    ballMesh.userData.slotIndex = slotIndex;
    scene.add(ballMesh);

    // Text label on top of the sphere — donor atom symbol from the
    // chemistry indicator ("Shape sphere bond" column).
    var labelText = ligand.bond || (ligand.name || ligand.id || "?").replace(/⁻|²⁻|³⁻|²⁺|³⁺/g, "").slice(0, 4);
    var label = makeLabelSprite(labelText, sphereColorHex);
    label.position.set(slot.position.x, slot.position.y, slot.position.z);
    scene.add(label);

    ballMesh.scale.setScalar(0.1);
    label.scale.setScalar(0.1);
    animateScale(ballMesh, 0.1, 1.0, 300);
    animateScale(label, 0.1, 0.9, 300);

    slot.ghostMesh.visible = false;
    slot.ringMesh.visible = false;
    slot.ballMesh = ballMesh;
    slot.labelMesh = label;
    slot.ligand = ligand;

    // NOTE: bidentate auto-pair (tryPairBidentate) was removed — players
    // were confused when one inventory pill produced two balls in the 3D
    // view. One placement now always equals one ball; chelating ligands
    // need to be placed once per coordination site they occupy.

    return true;
  }

  /**
   * When a bidentate ligand lands in a slot, grab the nearest empty
   * slot and drop an identical sphere there, then draw a curved tube
   * between them. Marks both slots as occupied by the same ligand so
   * scoring/removal stays consistent.
   */
  function tryPairBidentate(firstSlotIdx, ligand, sphereColorHex) {
    var first = slotMeshes[firstSlotIdx];
    if (!first) return;

    // Find the closest free slot to `first`
    var best = -1;
    var bestDist = Infinity;
    for (var i = 0; i < slotMeshes.length; i++) {
      if (i === firstSlotIdx) continue;
      var s = slotMeshes[i];
      if (!s || s.ligand) continue;
      var dx = s.position.x - first.position.x;
      var dy = s.position.y - first.position.y;
      var dz = s.position.z - first.position.z;
      var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    if (best < 0) return;

    var partner = slotMeshes[best];
    var ballGeo = new THREE.SphereGeometry(0.45, 32, 32);
    var ballMat = new THREE.MeshPhongMaterial({ color: sphereColorHex, shininess: 60 });
    var ball2 = new THREE.Mesh(ballGeo, ballMat);
    ball2.position.set(partner.position.x, partner.position.y, partner.position.z);
    ball2.userData.slotIndex = best;
    scene.add(ball2);

    var labelText = (ligand.name || ligand.id || "?").replace(/⁻|²⁻|³⁻|²⁺|³⁺/g, "").slice(0, 6);
    var label2 = makeLabelSprite(labelText, sphereColorHex);
    label2.position.copy(ball2.position);
    scene.add(label2);

    ball2.scale.setScalar(0.1);
    label2.scale.setScalar(0.1);
    animateScale(ball2, 0.1, 1.0, 300);
    animateScale(label2, 0.1, 0.9, 300);

    partner.ghostMesh.visible = false;
    partner.ringMesh.visible = false;
    partner.ballMesh = ball2;
    partner.labelMesh = label2;
    partner.ligand = { _idx: ligand._idx, id: ligand.id, name: ligand.name, denticity: ligand.denticity, _paired: firstSlotIdx };
    partner._pairedWith = firstSlotIdx;
    first._pairedWith = best;

    // Curved arc connecting the two spheres (bidentate bond)
    var arc = makeBondArc(first.position, partner.position, sphereColorHex);
    if (arc) {
      scene.add(arc);
      first._arcMesh = arc;
      partner._arcMesh = arc;
    }
  }

  function makeBondArc(p1, p2, colorHex) {
    try {
      var start = new THREE.Vector3(p1.x, p1.y, p1.z);
      var end = new THREE.Vector3(p2.x, p2.y, p2.z);
      var mid = start.clone().add(end).multiplyScalar(0.5);
      // Push the midpoint outward from the origin to curve the arc
      var outward = mid.clone().normalize().multiplyScalar(1.0);
      mid.add(outward);
      var curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      var geo = new THREE.TubeGeometry(curve, 24, 0.09, 12, false);
      var mat = new THREE.MeshPhongMaterial({ color: colorHex, shininess: 80, transparent: true, opacity: 0.85 });
      return new THREE.Mesh(geo, mat);
    } catch (e) {
      return null;
    }
  }

  function removeLigandFromSlot(slotIndex) {
    var slot = slotMeshes[slotIndex];
    if (!slot || !slot.ligand) return null;

    var ligand = slot.ligand;
    scene.remove(slot.ballMesh);
    if (slot.labelMesh) scene.remove(slot.labelMesh);
    if (slot._arcMesh) { scene.remove(slot._arcMesh); slot._arcMesh = null; }
    slot.ballMesh = null;
    slot.labelMesh = null;
    slot.ligand = null;
    slot.ghostMesh.visible = true;
    slot.ringMesh.visible = true;

    // Also tear down the paired slot if this was a bidentate pair
    if (slot._pairedWith !== undefined) {
      var pIdx = slot._pairedWith;
      slot._pairedWith = undefined;
      var partner = slotMeshes[pIdx];
      if (partner && partner.ligand) {
        scene.remove(partner.ballMesh);
        if (partner.labelMesh) scene.remove(partner.labelMesh);
        if (partner._arcMesh) { scene.remove(partner._arcMesh); partner._arcMesh = null; }
        partner.ballMesh = null;
        partner.labelMesh = null;
        partner.ligand = null;
        partner._pairedWith = undefined;
        partner.ghostMesh.visible = true;
        partner.ringMesh.visible = true;
      }
    }

    return ligand;
  }

  function animateScale(mesh, from, to, duration) {
    var start = Date.now();
    function tick() {
      var elapsed = Date.now() - start;
      var t = Math.min(elapsed / duration, 1);
      var scale;
      if (t < 0.7) {
        scale = from + (to * 1.15 - from) * (t / 0.7);
      } else {
        scale = to * 1.15 + (to - to * 1.15) * ((t - 0.7) / 0.3);
      }
      mesh.scale.setScalar(Math.max(scale, 0.01));
      if (t < 1) requestAnimationFrame(tick);
    }
    tick();
  }

  function getIntersectedSlot(clientX, clientY) {
    var canvas = renderer.domElement;
    var rect = canvas.getBoundingClientRect();
    mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

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
