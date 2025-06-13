# 🧠 RAGMODEL using GROQ

A Retrieval-Augmented Generation (RAG) Chatbot system powered by the GROQ LPU backend for high-speed inference. This full-stack project allows users to upload PDFs, extract relevant data, and interact with it in a conversational format.

## 🚀 Features

- ⚡ High-speed inference using GROQ LPU
- 📄 PDF uploading with OCR fallback for scanned documents
- 🔍 Chunk-based retrieval using embeddings
- 🧠 RAG pipeline for intelligent answers from your files
- 🌐 Full-stack application (FastAPI + React)
- 🔒 Secure with CORS and environment variable handling

---

## 📁 Project Structure

```
RAGMODEL-using-GROQ/
├── rag-chatbot-backend/     # FastAPI backend
│   ├── main.py              # FastAPI app entry point
│   ├── utils/               # PDF chunking, OCR, embedding tools
│   └── requirements.txt     # Backend dependencies
├── rag-chatbot-frontend/    # React frontend
│   ├── App.jsx              # Main frontend logic
│   ├── components/          # Sidebar, chat UI
│   └── vite.config.js       # Vite build config
└── README.md                # Project documentation
```

---

## 🧪 Tech Stack

| Layer      | Tech Used           |
|------------|---------------------|
| Frontend   | React, Vite, Tailwind CSS |
| Backend    | FastAPI, Python, Tesseract, PyMuPDF |
| NLP Engine | GROQ LPU, HuggingFace Transformers |
| DB         | ChromaDB (for vector storage) |
| OCR        | Tesseract, PyMuPDF fallback |

---

## ⚙️ Installation

### Backend

```bash
cd rag-chatbot-backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd rag-chatbot-frontend
npm install
npm run dev
```

---

## 🔐 Environment Variables

Create a `.env` file in `rag-chatbot-backend/` with:

```env
OPENAI_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
```

---

## 🛠️ Usage

1. Upload PDFs via the UI.
2. The backend processes the files, chunks them, and creates embeddings.
3. Ask questions based on the documents.
4. Answers are generated using the RAG pipeline via GROQ.

---

## 📦 Deployment

- Backend can be containerized with Docker.
- Frontend supports static hosting (e.g., Vercel, Netlify).
- Ensure GROQ keys are secure and not pushed.

---

## 🙌 Contributions

Pull requests and issues are welcome. For major changes, open an issue first to discuss what you’d like to change.

---

## 📄 License

MIT License

---

## 👨‍💻 Author

[Jayasudhan M](https://github.com/Jayasudhandesigner) – Designer, AI Engineer, and Full-Stack Developer.
