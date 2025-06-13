import os
import uuid
import shutil
import re
from collections import Counter
from typing import List
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel
from PIL import Image
import pytesseract
from pdf2image import convert_from_path

from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_groq import ChatGroq
from langchain.chains import RetrievalQA

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable not set")

app = FastAPI(title="Pro RAG Chatbot with OCR and Groq")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=HTMLResponse)
async def root():
    return """
    <html>
        <head><link rel="icon" href="/favicon.ico" type="image/x-icon"><title>RAG Chatbot</title></head>
        <body><h2>✅ RAG Chatbot Backend Running</h2></body>
    </html>
    """

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse("static/favicon.ico")

DATA_DIR = "uploaded_docs"
persist_directory = "chroma_db"
os.makedirs(DATA_DIR, exist_ok=True)

embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vectorstore = None

def initialize_vectorstore():
    global vectorstore
    vectorstore = Chroma(
        collection_name="documents",
        embedding_function=embedding_model,
        persist_directory=persist_directory,
    )

initialize_vectorstore()
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)

# OCR Helpers
def extract_text_from_image(file_path):
    try:
        img = Image.open(file_path)
        return pytesseract.image_to_string(img, lang='eng')
    except Exception as e:
        return f"OCR Error: {str(e)}"

def extract_text_from_pdf_via_ocr(pdf_path):
    try:
        images = convert_from_path(pdf_path)
        full_text = ""
        for idx, image in enumerate(images):
            text = pytesseract.image_to_string(image, lang='eng')
            full_text += text + "\n"
        return full_text
    except Exception as e:
        print(f"[OCR ERROR] Failed OCR on {pdf_path}: {e}")
        return ""

def summarize_themes(documents, query):
    texts = [doc.page_content for doc in documents]
    combined_text = " ".join(texts)
    words = re.findall(r'\w+', combined_text.lower())
    common_words = [word for word, count in Counter(words).most_common(10) if len(word) > 3]
    return f"Common themes related to '{query}': {', '.join(common_words)}"

@app.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    processed_files = 0
    for file in files:
        file_ext = file.filename.split('.')[-1].lower()
        file_path = os.path.join(DATA_DIR, f"{uuid.uuid4()}_{file.filename}")
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        docs, chunks = [], []

        if file_ext == 'pdf':
            print(f"[INFO] Processing PDF: {file.filename}")
            try:
                loader = PyPDFLoader(file_path)
                docs = loader.load()
                chunks = text_splitter.split_documents(docs)
                print(f"[INFO] Chunks from PyPDFLoader: {len(chunks)}")
            except Exception as e:
                print(f"[ERROR] Failed PyPDFLoader: {e}")

            if not chunks:
                print(f"[WARN] No chunks detected. Running OCR for {file.filename}")
                ocr_text = extract_text_from_pdf_via_ocr(file_path)
                if ocr_text.strip():
                    ocr_txt_path = file_path + '_ocr.txt'
                    with open(ocr_txt_path, 'w', encoding='utf-8') as f:
                        f.write(ocr_text)
                    loader = TextLoader(ocr_txt_path)
                    try:
                        docs = loader.load()
                        chunks = text_splitter.split_documents(docs)
                        print(f"[INFO] OCR chunks: {len(chunks)}")
                    except Exception as e:
                        print(f"[ERROR] Failed to process OCR chunks: {e}")
                else:
                    print(f"[WARN] OCR failed or produced no text for {file.filename}")

        elif file_ext in ['png', 'jpg', 'jpeg']:
            print(f"[INFO] Running OCR on image: {file.filename}")
            text = extract_text_from_image(file_path)
            txt_path = file_path + '.txt'
            with open(txt_path, 'w', encoding='utf-8') as f:
                f.write(text)
            loader = TextLoader(txt_path)
            docs = loader.load()
            chunks = text_splitter.split_documents(docs)

        elif file_ext == 'txt':
            loader = TextLoader(file_path)
            docs = loader.load()
            chunks = text_splitter.split_documents(docs)

        else:
            print(f"[WARN] Unsupported file format: {file.filename}")
            continue

        if not chunks:
            print(f"[WARN] Skipping file {file.filename} due to empty chunks")
            continue

        texts = [chunk.page_content for chunk in chunks]
        try:
            embeddings = embedding_model.embed_documents(texts)
        except Exception as e:
            print(f"[ERROR] Embedding failed for {file.filename}: {e}")
            continue

        if not embeddings or len(embeddings) != len(texts):
            print(f"[ERROR] Embeddings mismatch. Skipping {file.filename}")
            continue

        for chunk in chunks:
            chunk.metadata["source"] = file.filename
        vectorstore.add_documents(chunks)
        processed_files += 1
        print(f"[✅] {file.filename} processed successfully")

    return {"status": f"{processed_files} files uploaded and indexed"}

class Query(BaseModel):
    question: str

@app.post("/query")
async def query_rag(query: Query):
    llm = ChatGroq(model_name="llama3-8b-8192", groq_api_key=GROQ_API_KEY)
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
        return_source_documents=True,
    )
    result = qa_chain({"query": query.question})
    sources = [{
        "document": doc.metadata.get("source", "Unknown"),
        "page": doc.metadata.get("page", "N/A"),
        "content": doc.page_content[:300],
        "paragraph": doc.metadata.get("paragraph", "N/A")
    } for doc in result["source_documents"]]
    themes = summarize_themes(result["source_documents"], query.question)
    return {
        "answer": result["result"],
        "sources": sources,
        "themes": themes
    }
