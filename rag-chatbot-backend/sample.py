from PIL import Image
import pytesseract

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# ✅ Use raw string or forward slashes
image_path = r"a:\RAG-Model\rag-chatbot\rag-chatbot-backend\image.png"
text = pytesseract.image_to_string(Image.open(image_path))
print(text)
