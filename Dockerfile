FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libtesseract-dev \
    && rm -rf /var/lib/apt/lists/*

COPY rag-chatbot-backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY rag-chatbot-backend/ .

ARG GROQ_API_KEY
ENV GROQ_API_KEY=${GROQ_API_KEY}

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]