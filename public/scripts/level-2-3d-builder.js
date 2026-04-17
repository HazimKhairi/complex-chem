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
      slot.ligand = null;
      if (slot.ghostMesh) slot.ghostMesh.visible = true;
      if (slot.ringMesh) slot.ringMesh.visible = true;
    });
  }

  function placeLigandInSlot(slotIndex, ligand, sphereColorHex) {
    var slot = slotMeshes[slotIndex];
    if (!slot || slot.ligand) return false;

    var ballGeo = new THREE.SphereGeometry(0.4, 32, 32);
    var ballMat = new THREE.MeshPhongMaterial({ color: sphereColorHex, shininess: 60 });
    var ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.position.set(slot.position.x, slot.position.y, slot.position.z);
    ballMesh.userData.slotIndex = slotIndex;
    scene.add(ballMesh);

    ballMesh.scale.setScalar(0.1);
    animateScale(ballMesh, 0.1, 1.0, 300);

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
