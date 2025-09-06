// modules/mapStatic.js

import { activeMap } from './mapState.js';

let canvas, ctx;
let mapImage = null;
let zoom = 1.0;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

let current_map_select = { name: null, base64: null };
const patrolPath = [];
let goalPoint = null;
let mode = 'none';

export function initStaticMap() {
  canvas = document.getElementById('staticMapCanvas');
  ctx = canvas.getContext('2d');

  bindUI();
  setupCanvasEvents();
  loadLocalMapsToGallery(); // initial load
}

// ตอนกดปุ่ม select map:
document.getElementById('select-map-btn').addEventListener('click', async () => {
  if (!current_map_select.name) {
    alert("❗ No map selected");
    return;
  }

  activeMap.name = current_map_select.name;
  activeMap.base64 = current_map_select.base64;
  document.getElementById('active-map-name').textContent = activeMap.name;

  await loadActiveMapMeta(); // โหลด meta
  renderHomeCanvas();        // trigger canvas วาดใหม่
  window.electronAPI.selectMap(activeMap.name);
});


function bindUI() {
  document.getElementById('zoom-in').addEventListener('click', () => {
    if (mapImage) {
      zoom = Math.min(zoom * 1.2, 10);
      renderCanvas();
    }
  });

  document.getElementById('zoom-out').addEventListener('click', () => {
    if (mapImage) {
      zoom = Math.max(zoom / 1.2, 0.1);
      renderCanvas();
    }
  });

  document.getElementById('reset-view').addEventListener('click', () => {
    zoom = 1.0;
    offsetX = 0;
    offsetY = 0;
    renderCanvas();
  });

  document.getElementById('clear-path-btn').addEventListener('click', () => {
    patrolPath.length = 0;
    cancelMode();
    console.log('📍 Cleared Path and Goal');
  });

  document.getElementById('save-path-btn').addEventListener('click', () => {
    console.log('💾 Saved Path:', patrolPath);
    window.electronAPI.sendPatrolPath(patrolPath);
  });

  document.getElementById('sync-maps-btn').addEventListener('click', () => {
    window.electronAPI.syncMaps();
  });

  document.getElementById('set-goal-btn').addEventListener('click', () => {
    if (mode === 'goal') {
      cancelMode();
    } else {
      mode = 'goal';
      canvas.style.cursor = 'crosshair';
      document.getElementById('set-goal-btn').classList.add('active');
    }
  });

  window.electronAPI.onSyncComplete((mapList) => {
    const gallery = document.getElementById('map-gallery');
    gallery.innerHTML = '';
    mapList.forEach(({ name, base64 }) => addMapToGallery(name, base64));
    loadLocalMapsToGallery();
  });
}

function setupCanvasEvents() {
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
  });

  canvas.addEventListener('mouseup', () => isDragging = false);
  canvas.addEventListener('mouseleave', () => isDragging = false);

  canvas.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    dragStartX = e.clientX;
    dragStartY = e.clientY;

    offsetX += dx;
    offsetY += dy;
    renderCanvas();
  });

  canvas.addEventListener('wheel', (e) => {
    if (!mapImage) return;
    e.preventDefault();
    const zoomFactor = 1.1;
    const oldZoom = zoom;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left - canvas.width / 2;
    const my = e.clientY - rect.top - canvas.height / 2;

    zoom = e.deltaY < 0
      ? Math.min(zoom * zoomFactor, 10)
      : Math.max(zoom / zoomFactor, 0.1);

    const scale = zoom / oldZoom;
    offsetX = mx - (mx - offsetX) * scale;
    offsetY = my - (my - offsetY) * scale;

    renderCanvas();
  });

  canvas.addEventListener('click', (e) => {
    if (isDragging || mode !== 'goal') return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left - canvas.width / 2;
    const clickY = e.clientY - rect.top - canvas.height / 2;

    const mapX = (clickX - offsetX) / zoom;
    const mapY = (clickY - offsetY) / zoom;

    goalPoint = { x: mapX, y: mapY };
    console.log('🎯 Goal Point:', goalPoint);
    renderCanvas();
    cancelMode();
  });

  window.addEventListener('resize', () => renderCanvas());

  canvas.addEventListener('contextmenu', (e) => {
    if (mode !== 'none') {
      e.preventDefault();
      cancelMode();
    }
  });

  document.addEventListener('click', (e) => {
    if (
      mode === 'goal' &&
      !canvas.contains(e.target) &&
      !document.getElementById('set-goal-btn').contains(e.target)
    ) {
      cancelMode();
    }
  });
}

function cancelMode() {
  mode = 'none';
  canvas.style.cursor = 'default';
  document.getElementById('set-goal-btn').classList.remove('active');
  renderCanvas();
}

function renderCanvas() {
  if (!mapImage) return;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const imgW = mapImage.width * zoom;
  const imgH = mapImage.height * zoom;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.drawImage(
    mapImage,
    cx - imgW / 2 + offsetX,
    cy - imgH / 2 + offsetY,
    imgW,
    imgH
  );

  // 🔶 วาดชื่อแผนที่
  if (current_map_select.name) {
    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText(`Map: ${current_map_select.name}`, 10, 10);
  }

  // 🟠 วาด path
  if (patrolPath.length > 0) {
    ctx.strokeStyle = 'orange';
    ctx.lineWidth = 2;
    ctx.beginPath();
    patrolPath.forEach((pt, i) => {
      const x = cx + pt.x * zoom + offsetX;
      const y = cy + pt.y * zoom + offsetY;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = 'cyan';
    patrolPath.forEach((pt) => {
      const x = cx + pt.x * zoom + offsetX;
      const y = cy + pt.y * zoom + offsetY;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // 🎯 goal point
  if (goalPoint) {
    const x = cx + goalPoint.x * zoom + offsetX;
    const y = cy + goalPoint.y * zoom + offsetY;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'white';
    ctx.stroke();
  }
}

function loadLocalMapsToGallery() {
  window.electronAPI.getLocalMaps().then((maps) => {
    const gallery = document.getElementById('map-gallery');
    gallery.innerHTML = '';
    maps.forEach(({ name, base64 }) => addMapToGallery(name, base64));
  });
}

function addMapToGallery(name, base64) {
  const img = document.createElement('img');
  img.src = base64;
  img.alt = name;
  img.title = name;
  img.className = 'map-thumb';
  img.style.cursor = 'pointer';

  img.addEventListener('click', () => {
    mapImage = new Image();
    mapImage.onload = renderCanvas;
    mapImage.src = base64;
    current_map_select = { name, base64 };
  });

  document.getElementById('map-gallery').appendChild(img);
}
