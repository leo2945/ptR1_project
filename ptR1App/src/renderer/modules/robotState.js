// robotState.js
// เก็บตำแหน่งและทิศทางของหุ่นยนต์ใน map (อัปเดตจาก ROS Topic)

export const robotPose = {
  position: null,       // { x, y, z }
  orientation: null     // { x, y, z, w } → quaternion
};

// 🛠 ฟังก์ชันช่วยสำหรับอัปเดต robotPose
export function updateRobotPose(position, orientation) {
  robotPose.position = position;
  robotPose.orientation = orientation;
}
