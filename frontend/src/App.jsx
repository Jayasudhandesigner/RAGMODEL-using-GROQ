// App.jsx

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Upload, Sun, Moon, Mic, Waves, Loader2 } from "lucide-react";
import Sidebar from "./Sidebar";

export default function App() {
  const [files, setFiles] = useState([]);
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [dragging, setDragging] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const askQuestion = async () => {
    if (!question.trim() && files.length === 0) return;
    setLoading(true);
    setUploading(true);
    try {
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        await axios.post("http://localhost:8000/upload", formData);
      }

      const { data } = await axios.post("http://localhost:8000/query", { question });
      setChat((prev) => [
        ...prev,
        {
          question,
          answer: data.answer,
          sources: data.sources,
          themes: data.themes,
        },
      ]);
      setQuestion("");
      setFiles([]);
    } catch (e) {
      alert("Query error: " + e.message);
    } finally {
      setLoading(false);
      setUploading(false);
      setUploaded(true);
      setTimeout(() => setUploaded(false), 3000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (question.trim() || files.length > 0)) askQuestion();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const getFileIcon = (name) => {
    const ext = name.split(".").pop().toLowerCase();
    if (ext === "pdf") return "📕";
    if (["png", "jpg", "jpeg"].includes(ext)) return "🖼️";
    if (["txt", "md"].includes(ext)) return "📄";
    return "📁";
  };

  return (
    <div
      className="flex flex-col h-screen bg-gray-100 dark:bg-zinc-900 text-black dark:text-white"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragging(false)}
    >
      {/* Header */}
      <header className="bg-white dark:bg-zinc-800 px-6 py-4 shadow flex justify-between items-center">
        <h1 className="text-2xl font-bold">EDU-RAG</h1>
        <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700">
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {chat.map(({ question, answer, sources, themes }, idx) => (
          <div key={idx} className="space-y-4">
            <div className="flex justify-end">
              <div className="bg-green-600 text-white px-4 py-2 rounded-lg max-w-xl">{question}</div>
            </div>
            <div className="flex justify-start">
              <div className="bg-white dark:bg-zinc-800 px-4 py-2 rounded-lg shadow max-w-xl">
                <ReactMarkdown className="prose dark:prose-invert">{answer}</ReactMarkdown>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold">Sources</summary>
                  <ul className="list-disc text-sm ml-4 mt-1">
                    {sources.map((src, i) => (
                      <li key={i}>
                        <strong>{src.document}</strong> (Page {src.page}, Para {src.paragraph}): {src.content}...
                      </li>
                    ))}
                  </ul>
                </details>
                <div className="mt-3 text-sm">
                  <p className="font-semibold">Themes:</p>
                  <ReactMarkdown>{themes}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef}></div>
      </main>

      {/* Input Footer */}
      <footer className="p-4 bg-white dark:bg-zinc-800">
        <div className="relative max-w-4xl mx-auto">
          <div
            className={`flex items-center bg-zinc-100 dark:bg-zinc-700 rounded-full px-4 py-2 shadow border-2 transition ${
              dragging ? "border-blue-500 border-dashed" : "border-transparent"
            }`}
          >
            {/* Upload Icon */}
            <label htmlFor="file-upload" className="cursor-pointer relative">
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              ) : (
                <Upload className="w-5 h-5 text-gray-500 hover:text-blue-500" />
              )}
              <input
                id="file-upload"
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.txt,.md"
                onChange={handleFileChange}
              />
            </label>

            {/* Upload Success Message */}
            {uploaded && <span className="ml-2 text-xs text-green-500">Uploaded ✔</span>}

            {/* Input Box */}
            <input
              type="text"
              placeholder={dragging ? "Drop your files..." : "Ask anything"}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 mx-4 bg-transparent outline-none text-sm text-black dark:text-white placeholder:text-gray-400"
            />

            <Mic className="w-5 h-5 text-gray-500 mr-2 cursor-pointer" />
            <button
              onClick={askQuestion}
              disabled={loading || (!question.trim() && files.length === 0)}
              className="hover:text-blue-600 dark:hover:text-blue-400"
            >
              <Waves className="w-5 h-5" />
            </button>
          </div>

          {/* File Chip Preview */}
          {files.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-grey-600 text-white px-4 py-2 rounded-full shadow text-sm max-w-xs"
                >
                  <span>{getFileIcon(file.name)}</span>
                  <span className="truncate max-w-[120px]">{file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-white hover:text-gray-200 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
