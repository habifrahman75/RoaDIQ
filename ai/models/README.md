# Place your trained YOLO .pt model file here.
#
# When Member 3 provides the trained model:
#   1. Copy the .pt file into this directory:
#        ai/models/roadiq_yolo.pt
#   2. Update ai/.env:
#        AI_MODEL_PATH=models/roadiq_yolo.pt
#        AI_MOCK_MODE=false
#   3. Uncomment `ultralytics` in ai/requirements.txt and reinstall.
#   4. Restart the AI service:
#        uvicorn main:app --port 8001 --reload
#
# Supported YOLO variants: YOLOv8n, YOLOv8s, YOLOv8m (recommended for demo)
# Download a base model: python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
