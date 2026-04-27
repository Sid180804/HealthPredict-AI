import React, { useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function HealthAssistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your AI health assistant. I can help with disease education, lifestyle advice, and when to see a doctor. I do NOT prescribe medicines. How can I help?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        parts: [{ text: m.content }],
      }));
      const res = await axios.post(
        `${API_BASE}/api/chat`,
        { message: input, history },
        { headers: { "Content-Type": "application/json" } }
      );
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.response || "I couldn't process that. Please try again." },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm having trouble connecting. Please try again. For medical advice, always consult a doctor.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">AI Health Assistant</h2>

      <div className="h-64 overflow-y-auto mb-4 space-y-3 border border-slate-200/50 rounded-xl p-4 bg-slate-50/50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-xl ${
                msg.role === "user"
                  ? "bg-teal-600 text-white"
                  : "bg-white/80 border border-slate-200 text-slate-800"
              }`}
            >
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/80 border border-slate-200 rounded-xl p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask about health, diet, exercise..."
          className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm bg-white/80"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="px-4 py-2 bg-teal-600 text-white rounded-xl font-medium text-sm hover:bg-teal-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>

      <p className="text-xs text-slate-500 mt-3 text-center">
        This system does not replace professional medical advice. I cannot prescribe medicines.
      </p>
    </div>
  );
}
