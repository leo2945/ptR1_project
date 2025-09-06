
from fastapi import FastAPI
from pydantic import BaseModel
import base64, cv2
import numpy as np
import torch

print("Backend is starting...")

app = FastAPI()

# โหลดโมเดล YOLO (ใช้ yolov5s)
model = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)

# โครงสร้าง request จาก Electron frontend
class ImageRequest(BaseModel):
    image: str  # base64 string เช่น 'data:image/jpeg;base64,...'

@app.post("/detect")
def detect(req: ImageRequest):
    # แปลง base64 → image
    header, encoded = req.image.split(",", 1)
    img_data = base64.b64decode(encoded)
    np_arr = np.frombuffer(img_data, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    # ตรวจจับ
    results = model(image)
    detections = []
    for *box, conf, cls in results.xyxy[0].tolist():
        label = model.names[int(cls)]
        if label == "person":
            x1, y1, x2, y2 = map(int, box)
            detections.append({
                "label": label,
                "x": x1,
                "y": y1,
                "width": x2 - x1,
                "height": y2 - y1,
                "confidence": round(conf, 2)
            })

    return detections
