// patrolState.js
// เก็บสถานะของการลาดตระเวน เช่น path ทั้งหมด และ goal point ปัจจุบัน

// 📍 path ทั้งหมดที่หุ่นยนต์ต้องเดิน (จาก Electron หรือ Planner)
export let patrolPath = [];

// อัปเดต path ลาดตระเวน
export function setPatrolPath(path) {
  patrolPath = path;
}

// goal point ปัจจุบัน (ใช้ตอนเดินแบบจุดเดียวหรือ next ใน path)
export let goalPoint = null;

// ตั้ง goal ใหม่
export function setGoalPoint(pt) {
  goalPoint = pt;
}

// ล้าง goal point
export function clearGoalPoint() {
  goalPoint = null;
}
