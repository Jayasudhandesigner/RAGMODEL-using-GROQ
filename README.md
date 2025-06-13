# Pro RAG Chatbot with Groq and OCR

A Retrieval-Augmented Generation (RAG) chatbot for querying 75+ documents (PDFs, images, text) with OCR, Groq LLM, and theme summarization.

## Features
- Upload and process 75+ documents (PDFs, scanned images, text)
- OCR for scanned images using Tesseract
- Query answering with Groq's Llama3-8b-8192
- Accurate citations (document, page, paragraph)
- Theme summarization across documents
- React frontend with Tailwind CSS

## Prerequisites
- Docker and Docker Compose
- Node.js
- Groq API key (from console.groq.com)
- Tesseract (included in Docker)

## Setup
1. **Clone the repo**:
   ```bash
   git clone <your-repo-url>
   cd rag-chatbot