import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import useChatStore from "../store/useChatStore";
import useAuthStore from "../store/useAuthStore";

const TypingIndicator = () => (
    <div className="flex items-start gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
            <Bot size={14} className="text-stone-500" />
        </div>
        <div className="bg-[#F7F5F0] border border-stone-200 rounded-2xl rounded-tl-sm px-4 py-3">
            <div className="flex gap-1.5 items-center h-5">
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
        </div>
    </div>
);

const MessageBubble = ({ role, content }) => {
    const isUser = role === "user";
    return (
        <div className={`flex items-start gap-2 mb-3 ${isUser ? "flex-row-reverse" : ""}`}>
            {!isUser && (
                <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
                    <Bot size={14} className="text-stone-500" />
                </div>
            )}
            <div
                className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                        ? "bg-amber-500 text-white rounded-2xl rounded-tr-sm"
                        : "bg-[#F7F5F0] border border-stone-200 text-stone-800 rounded-2xl rounded-tl-sm"
                }`}
            >
                {content}
            </div>
        </div>
    );
};

const ChatbotPopup = () => {
    const { authUser } = useAuthStore();
    const { isOpen, history, isLoading, error, openChat, closeChat, sendMessage } = useChatStore();
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Try to read courseId from route params
    const params = useParams();
    const courseId = params.courseId || null;

    // Auto-scroll on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [history, isLoading]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [isOpen]);

    if (!authUser) return null;

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;
        setInput("");
        sendMessage(trimmed, courseId);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* ── Popup Panel ── */}
            <div
                className={`fixed bottom-24 right-6 w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
                    isOpen
                        ? "scale-100 opacity-100 pointer-events-auto"
                        : "scale-95 opacity-0 pointer-events-none"
                }`}
                style={{ zIndex: 9999, fontFamily: "'DM Sans', sans-serif" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-sm">
                            <Bot size={16} className="text-white" />
                        </div>
                        <div>
                            <p
                                className="text-stone-900 text-sm font-semibold leading-tight"
                                style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                            >
                                Ask Doubts
                            </p>
                            <p className="text-stone-400 text-[11px] leading-tight">learnmind tutor</p>
                        </div>
                    </div>
                    <button
                        onClick={closeChat}
                        className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors cursor-pointer"
                    >
                        <X size={16} className="text-stone-500" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0">
                    {history.length === 0 && !isLoading && (
                        <MessageBubble
                            role="assistant"
                            content={
                                "Hi! I'm your learnmind tutor. Ask me anything about your JavaScript course or anything you're learning."
                            }
                        />
                    )}

                    {history.map((msg, i) => (
                        <MessageBubble key={i} role={msg.role} content={msg.content} />
                    ))}

                    {isLoading && <TypingIndicator />}

                    {error && (
                        <div className="text-center py-2">
                            <p className="text-xs text-red-400 bg-red-50 inline-block px-3 py-1.5 rounded-full">
                                {error}
                            </p>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Row */}
                <div className="px-4 py-3 border-t border-stone-100 bg-[#faf9f6]">
                    <div className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                            placeholder="Ask a question..."
                            className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-400 transition-colors disabled:opacity-50"
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-stone-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                        >
                            <Send size={16} className={input.trim() && !isLoading ? "text-white" : "text-stone-400"} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Trigger Button ── */}
            <button
                onClick={openChat}
                className={`fixed bottom-6 right-6 flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white pl-4 pr-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group ${
                    isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
                }`}
                style={{ zIndex: 9998, fontFamily: "'DM Sans', sans-serif" }}
            >
                <MessageCircle size={20} className="group-hover:rotate-12 transition-transform" />
                <span className="text-sm font-semibold tracking-wide">Ask Doubts</span>

                {/* Pulsing dot */}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500" />
                    </span>
                )}
            </button>
        </>
    );
};

export default ChatbotPopup;
