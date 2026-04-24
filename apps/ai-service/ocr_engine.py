from paddleocr import PaddleOCR
import cv2
import numpy as np

class OCREngine:
    def __init__(self):
        # Initialize PaddleOCR with support for English and Hindi (common in India)
        # lang='hi' for Hindi, lang='en' for English. lang='ml' for multilingual support.
        self.ocr = PaddleOCR(use_angle_cls=True, lang='en')

    def extract_text(self, image_path: str):
        try:
            result = self.ocr.ocr(image_path, cls=True)
            extracted_text = ""
            for idx in range(len(result)):
                res = result[idx]
                for line in res:
                    extracted_text += line[1][0] + " "
            return extracted_text.strip()
        except Exception as e:
            print(f"OCR Error: {e}")
            return ""

    def extract_text_from_bytes(self, image_bytes: bytes):
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            result = self.ocr.ocr(img, cls=True)
            extracted_text = ""
            if result[0]: # Check if any text was found
                for line in result[0]:
                    extracted_text += line[1][0] + " "
            return extracted_text.strip()
        except Exception as e:
            print(f"OCR Error from bytes: {e}")
            return ""
