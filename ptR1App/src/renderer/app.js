console.log('👷 app.js started');

import { initRelayButtons } from './modules/relayControl.js';
import { WebRTCClient } from './modules/webrtcClient.js';
import { CanvasRecorder } from './modules/recorder.js';
import { setupMapCanvas } from './modules/mapHome.js';
import { initStaticMap } from './modules/mapStatic.js';
import { enablePatrolDrawing, bindStopButton, enableSingleGoal } from './modules/patrol.js';

let rtcClient = null;
let recorder = null;

document.addEventListener('DOMContentLoaded', async() => {
  console.log("app: DOMContentLoaded fired!");

  // Static Map
  const canvas_static_map = document.getElementById('staticMapCanvas');
  setupMapCanvas(canvas_static_map);
  initStaticMap();

  // Relay
  initRelayButtons();
  
  const videoEl = document.getElementById('stream');
  rtcClient = new WebRTCClient(videoEl);

  // ✅ เชื่อม WebRTC เมื่อ ROSBridge พร้อมแล้วเท่านั้น
  window.electronAPI.onConnectionStatus((status) => {
    const el = document.getElementById('connection-status');
    el.textContent = status;

    if (status === 'connected') {
      //rtcClient.startConnection('http://localhost:8889/mystream/whep');
    }
  });

  // Recorder 
  const canvas = document.getElementById('capture-canvas');
  const startBtn = document.getElementById('start-record');
  const stopBtn = document.getElementById('stop-record');

  recorder = new CanvasRecorder(canvas, {
    fps: 15,
    segmentMs: 10 * 60 * 1000 // หรือเปลี่ยนเป็น 10 * 1000 สำหรับ dev
  });

  startBtn.addEventListener('click', () => {
    recorder.start();
    startBtn.disabled = true;
    stopBtn.disabled = false;
  });

  stopBtn.addEventListener('click', () => {
    recorder.stop();
    startBtn.disabled = false;
    stopBtn.disabled = true;
  });

  const keyboardToggle = document.getElementById('keyboard-toggle');
  const pwmInput = document.getElementById('pwm-slider');
  const cmdDropdown = document.getElementById('cmd-dropdown');
  const sendSelectedCmdButton = document.getElementById('send-selected-cmd-button');
  const cmdInput = document.getElementById('cmd-input');
  const sendCustomCmdButton = document.getElementById('send-custom-cmd-button');
  const modeLabel = document.getElementById('mode-label');
  const connectButton = document.getElementById('connectButton');
  const ipSelect = document.getElementById('ip-dropdown');
  const connectBtn = document.getElementById('selected-ip');
  
  loadVideos(); 
  if (connectBtn && ipSelect) {
    connectBtn.addEventListener('click', () => {
      const ip = ipSelect.value;
      console.log(`🔌 Connecting to ROSBridge at ${ip}`);
      window.electronAPI.connectROSBridge(ip);
    });
  } else {
    console.warn("❌ IP selector or connect button not found in DOM");
  }

  // connect image ws ip
  connectButton.addEventListener('click', () => {
    const ip = document.getElementById('ipInput')?.value || 'localhost';
    window.electronAPI.connectCameraWS(ip);
  });

  if (!keyboardToggle || !pwmInput || !cmdDropdown || !sendSelectedCmdButton || !cmdInput || !sendCustomCmdButton || !modeLabel) {
    console.error("❌ UI elements not found! Check HTML structure.");
    return;
  }


  // ✅ ฟังก์ชันส่ง UInt32 command
  const sendUInt32Command = (command) => {
    if (isNaN(command) || command < 0 || command > 0xFFFFFFFF) {
      console.error('❌ Invalid UInt32 value');
      return;
    }
    console.log(`Sending UInt32 Command: ${command}`);
    window.robotControl.sendCommand(command);
  };

  // ✅ กดปุ่มส่งจาก Dropdown
  sendSelectedCmdButton.addEventListener('click', () => {
    const selectedCmd = parseInt(cmdDropdown.value);
    sendUInt32Command(selectedCmd);
  });

  // ✅ กดปุ่มส่งจาก Text Input
  sendCustomCmdButton.addEventListener('click', () => {
    const customCmd = parseInt(cmdInput.value, 16);
    sendUInt32Command(customCmd);
  });
});

// ✅ ฟังก์ชันส่ง Drive command เฉพาะตอน MANUAL ON

const pressedKeys = new Set();
const intervalMap = new Map();
const pwmMap = new Map();
const pwmStep = 5;
const pwmInitial = 40;

const sendKeyDrive = (event) => {
  if (!event || !event.code) return;
  const keyboardToggle = document.getElementById('keyboard-toggle');
  let pwmInput = document.getElementById('pwm-slider');
  const modeLabel = document.getElementById('mode-label');
  if (!keyboardToggle || !pwmInput || !modeLabel) return;
  if (modeLabel.textContent.trim().toUpperCase() !== 'MANUAL ON') return;
  const pwmInputValue = parseInt(pwmInput.value);
  const pwmMax = (!isNaN(pwmInputValue) && pwmInputValue > 0) ? pwmInputValue : 255;

  const hadPwm = pwmMap.has(event.code);
  let pwm = hadPwm ? pwmMap.get(event.code) : pwmInitial;
  let command;
  //let pwm = pwmMap.has(event.code) ? pwmMap.get(event.code) : pwmInitial;
  pwm = Math.min(pwm + pwmStep, pwmMax);
  pwmMap.set(event.code, pwm);  // เก็บ pwm ล่าสุด

  switch (event.code) {
    case 'KeyW': command = 0x0100 + pwm; break; // Forward
    case 'KeyS': command = 0x0400 + pwm; break; // Backward
    case 'KeyA': command = 0x0200 + pwm; break; // Left
    case 'KeyD': command = 0x0300 + pwm; break; // Right
    case 'KeyR': command = 0x0500 + pwm; break; // turn left
    case 'KeyF': command = 0x0600 + pwm; break; // turn right
    case 'KeyQ': command = 0x0700 + pwm; break; // forward left
    case 'KeyE': command = 0x0800 + pwm; break; // forward right
    default: return;
  }
  command = command & 0xFFFF;
  console.log(`Key pressed: ${event.code} -> Command: ${command.toString(16).toUpperCase()}, PWM: ${pwm}`);
  window.robotControl.sendKeyCommand(command);
};


document.addEventListener('keydown', (event) => {
  const code = event.code;

  if (pressedKeys.has(code)) return;
  pressedKeys.add(code);

  const isServoKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code);

  if (!isServoKey) {
    pwmMap.set(code, pwmInitial);
  }

  const intervalId = setInterval(() => {
    if (isServoKey) {
      sendServoControl(event);
    } else {
      sendKeyDrive(event);
    }
  }, isServoKey ? 150 : 100);

  intervalMap.set(code, intervalId);
});

document.addEventListener('keyup', (event) => {
  const code = event.code;

  //console.log(`⏏️ Key released: ${code}, clearing interval and PWM`);
  //console.log('PWM before delete:', pwmMap.get(code));

  if (intervalMap.has(code)) {
    clearInterval(intervalMap.get(code));
    intervalMap.delete(code);
  }
  pwmMap.delete(code);
  pressedKeys.delete(code);
});


// ✅ ฟังก์ชันส่ง Servo command เฉพาะตอน MANUAL ON
const sendServoControl = (event) => {
  if (!event || !event.code) return;

  const keyboardToggle = document.getElementById('keyboard-toggle');
  const modeLabel = document.getElementById('mode-label');

  if (!keyboardToggle || !modeLabel) return;
  if (modeLabel.textContent.trim().toUpperCase() !== 'MANUAL ON') return;

  let command;

  switch (event.code) {
    case 'ArrowRight':    command = 0x01; break;
    case 'ArrowLeft':  command = 0x02; break;
    case 'ArrowUp':  command = 0x03; break;
    case 'ArrowDown': command = 0x04; break;
    default: return;
  }

  console.log(`Servo key: ${event.code} -> Command: ${command}`);
  window.robotControl.sendServoCommand(command);
};



