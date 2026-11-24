"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Send, MessageSquare } from "lucide-react";
import { useWhiteboardStore } from "@/store/useWhiteboardStore";
import { ChatMessageItem } from "@/types/board";

interface ChatSidebarProps {
  boardId: string;
  userId: string;
  userName: string;
  userColor: string;
}

export function ChatSidebar({
  boardId,
  userId,
  userName,
  userColor,
}: ChatSidebarProps) {
  const { isChatOpen, setIsChatOpen, resetUnreadChat } = useWhiteboardStore();
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat messages
  useEffect(() => {
    if (!isChatOpen) return;
    resetUnreadChat();

    let isMounted = true;
    async function loadChat() {
      try {
        const res = await fetch(`/api/boards/${boardId}/chat`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setMessages(data);
        }
      } catch (err) {
        console.error("Failed to load chat messages:", err);
      }
    }

    loadChat();
    const interval = setInterval(loadChat, 4000); // Polling fallback for chat

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isChatOpen, boardId, resetUnreadChat]);

  // Scroll to bottom
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen]);

  if (!isChatOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const messageText = input.trim();
    setInput("");
    setLoading(true);

    // Optimistic UI append
    const tempMessage: ChatMessageItem = {
      id: `temp-${Date.now()}`,
      boardId,
      userId,
      userName,
      userColor,
      content: messageText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const res = await fetch(`/api/boards/${boardId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageText }),
      });
      if (res.ok) {
        const saved = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMessage.id ? saved : m))
        );
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-neutral-900 border-l border-neutral-800 shadow-2xl z-40 flex flex-col backdrop-blur-xl animate-slide-left">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-neutral-100">Board Chat</h3>
        </div>
        <button
          type="button"
          onClick={() => setIsChatOpen(false)}
          className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 text-xs">
            <MessageSquare className="w-8 h-8 stroke-[1.5] mb-2 opacity-50" />
            <p>No messages yet.</p>
            <p className="text-[11px] mt-1 text-neutral-600">
              Start collaborating with your team in real time!
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.userId === userId;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[11px] text-neutral-400">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: m.userColor || "#38bdf8" }}
                  />
                  <span className="font-medium text-neutral-300">
                    {isMe ? "You" : m.userName}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div
                  className={`px-3 py-2 rounded-2xl text-xs max-w-[85%] break-words ${
                    isMe
                      ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/20"
                      : "bg-neutral-800 text-neutral-200 rounded-tl-none border border-neutral-700/60"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-neutral-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
