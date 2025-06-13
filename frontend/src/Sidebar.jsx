import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Sidebar({ onSelect }) {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8000/chats").then(res => setChats(res.data));
  }, []);

  return (
    <div className="w-64 h-full bg-zinc-900 text-white overflow-y-auto p-4">
      <h2 className="font-bold mb-4">Chats</h2>
      {chats.map(chat => (
        <button
          key={chat._id}
          onClick={() => onSelect(chat._id)}
          className="block w-full text-left px-2 py-1 hover:bg-zinc-700 rounded"
        >
          {chat.title}
        </button>
      ))}
    </div>
  );
}
