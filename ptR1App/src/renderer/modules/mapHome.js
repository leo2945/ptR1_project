// modules/mapHome.js
// 👉 ใช้สำหรับแสดงแผนที่, หุ่นยนต์, goal ฯลฯ

import { activeMap } from './mapState.js';
import { robotPose } from './robotState.js';
import { goalPoint } from './patrolState.js';

let canvas, ctx, mapImg;
let zoom = 1.0;
let offset = { x: 0, y: 0 };

function getYawFromQuaternion(q) {
  const { x, y, z, w } = q;
  return Math.atan2(2.0 * (w * z + x * y), 1.0 - 2.0 * (y * y + z * z));
}

function drawRobot() {
  if (!robotPose?.position || !activeMap?.meta || !mapImg) return;

  const { resolution, origin } = activeMap.meta;
  const imgH = mapImg.height;

  const px = (robotPose.position.x - origin[0]) / resolution;
  const py = imgH - (robotPose.position.y - origin[1]) / resolution;

  const yaw = getYawFromQuaternion(robotPose.orientation);
  const screenX = px * zoom + offset.x + canvas.width / 2;
  const screenY = py * zoom + offset.y + canvas.height / 2;

  ctx.save();
  ctx.translate(screenX, screenY);
  ctx.rotate(yaw);
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(7, 10);
  ctx.lineTo(-7, 10);
  ctx.closePath();
  ctx.fillStyle = 'lime';
  ctx.fill();
  ctx.restore();
}

function drawGoal() {
  if (!goalPoint || !activeMap?.meta || !mapImg) return;

  const { resolution, origin } = activeMap.meta;
  const imgH = mapImg.height;

  const px = (goalPoint.x - origin[0]) / resolution;
  const py = imgH - (goalPoint.y - origin[1]) / resolution;

  const screenX = px * zoom + offset.x + canvas.width / 2;
  const screenY = py * zoom + offset.y + canvas.height / 2;

  ctx.beginPath();
  ctx.arc(screenX, screenY, 5, 0, 2 * Math.PI);
  ctx.fillStyle = 'red';
  ctx.fill();
}

function renderLoop() {
  if (!ctx || !mapImg) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(mapImg, offset.x, offset.y, mapImg.width * zoom, mapImg.height * zoom);
  drawRobot();
  drawGoal();
  requestAnimationFrame(renderLoop);
}

export function setupMapCanvas(canvasElement) {
  canvas = canvasElement;
  ctx = canvas.getContext('2d');
  renderLoop();
}

export function setMapImage(base64Str) {
  return new Promise((resolve) => {
    mapImg = new Image();
    mapImg.onload = () => {
      resolve();
    };
    mapImg.src = 'data:image/png;base64,' + base64Str;
  });
}
