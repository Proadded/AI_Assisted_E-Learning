import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { X, Send, Bot, ArrowUp } from "lucide-react";
import useChatStore from "../store/useChatStore";
import useAuthStore from "../store/useAuthStore";

const WELCOME = "Hi! I'm your learnmind tutor. Ask me anything about your course or your progress — I can see your scores, weak areas, and what you've watched.";

// Simple markdown renderer — bold, inline code, code blocks
function MsgText({ text }) {
    if (!text) return null;

    // Split by code blocks first
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts = [];
    let last = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
        if (match.index > last) {
            parts.push({ type: "text", content: text.slice(last, match.index) });
        }
        parts.push({ type: "code", content: match[1].trim() });
        last = match.index + match[0].length;
    }
    if (last < text.length) parts.push({ type: "text", content: text.slice(last) });

    return (
        <>
            {parts.map((part, i) => {
                if (part.type === "code") {
                    return (
                        <pre key={i} style={{
                            background: "rgba(0,0,0,0.3)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 8,
                            padding: "10px 14px",
                            margin: "8px 0",
                            fontSize: 12.5,
                            fontFamily: "'DM Mono', 'Courier New', monospace",
                            color: "#C8C2B8",
                            overflowX: "auto",
                            lineHeight: 1.6,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                        }}>{part.content}</pre>
                    );
                }
                // Inline: bold (**text**) and inline code (`text`)
                const inlineParts = part.content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
                return (
                    <span key={i}>
                        {inlineParts.map((seg, j) => {
                            if (seg.startsWith("**") && seg.endsWith("**")) {
                                return <strong key={j} style={{ color: "#F7F5F0", fontWeight: 600 }}>{seg.slice(2, -2)}</strong>;
                            }
                            if (seg.startsWith("`") && seg.endsWith("`")) {
                                return (
                                    <code key={j} style={{
                                        background: "rgba(0,0,0,0.3)",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        borderRadius: 4,
                                        padding: "1px 6px",
                                        fontSize: "0.88em",
                                        fontFamily: "'DM Mono', monospace",
                                        color: "#D4860A",
                                    }}>{seg.slice(1, -1)}</code>
                                );
                            }
                            // Preserve line breaks
                            return seg.split("\n").map((line, k, arr) => (
                                <span key={k}>{line}{k < arr.length - 1 && <br />}</span>
                            ));
                        })}
                    </span>
                );
            })}
        </>
    );
}

function VideoRefCard({ videoRef }) {
  if (!videoRef?.videoId || !videoRef?.courseId) return null;

  const url = `/course/${videoRef.courseId}?video=${videoRef.videoId}`;

  return (
    <a
      href={url}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginTop: 10,
        padding: "10px 13px",
        background: "rgba(212,134,10,0.08)",
        border: "1px solid rgba(212,134,10,0.2)",
        borderRadius: 10,
        textDecoration: "none",
        transition: "background 0.18s, border-color 0.18s",
        cursor: "pointer",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = "rgba(212,134,10,0.14)";
        e.currentTarget.style.borderColor = "rgba(212,134,10,0.35)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "rgba(212,134,10,0.08)";
        e.currentTarget.style.borderColor = "rgba(212,134,10,0.2)";
      }}
    >
      <div style={{
        width: 32, height: 32,
        borderRadius: 8,
        background: "rgba(212,134,10,0.15)",
        border: "1px solid rgba(212,134,10,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#D4860A">
          <polygon points="5,3 19,12 5,21"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12.5,
          fontWeight: 600,
          color: "#F0EBE1",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          lineHeight: 1.3,
          marginBottom: 2,
        }}>
          {videoRef.title}
        </div>
        <div style={{
          fontSize: 10.5,
          color: "rgba(247,245,240,0.4)",
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.3px",
        }}>
          {videoRef.topic ? `${videoRef.topic} · ` : ""}Watch video →
        </div>
      </div>
    </a>
  );
}

export default function ChatbotPopup() {
    const { authUser } = useAuthStore();
    const { isOpen, history, isLoading, error, openChat, closeChat, sendMessage } = useChatStore();
    const [input, setInput] = useState("");
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const textareaRef = useRef(null);
    const params = useParams();
    const courseId = params.courseId || params.id || null;

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [history, isLoading]);

    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 150);
    }, [isOpen]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
        }
    }, [input]);

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed || isLoading) return;
        setInput("");
        sendMessage(trimmed, courseId);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    if (!authUser) return null;

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        /* ── Trigger ── */
        .cb-trigger-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9998;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #2A2723;
          color: #F7F5F0;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 10px 18px 10px 13px;
          font-size: 13.5px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          box-shadow: 0 4px 24px rgba(26,24,21,0.3);
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          letter-spacing: -0.1px;
        }
        .cb-trigger-btn:hover {
          background: #1A1815;
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(26,24,21,0.35);
        }
        .cb-trigger-btn:active { transform: scale(0.97); }
        .cb-trigger-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #D4860A;
          box-shadow: 0 0 8px #D4860A;
          animation: cb-glow 2.5s ease infinite;
          flex-shrink: 0;
        }
        @keyframes cb-glow {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.4; transform:scale(0.7); }
        }

        /* ── Popup shell ── */
        .cb-shell {
          position: fixed;
          bottom: 80px;
          right: 24px;
          width: 400px;
          height: 580px;
          background: #1C1917;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          z-index: 9999;
          box-shadow: 0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03) inset;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
          animation: cb-up 0.2s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes cb-up {
          from { opacity:0; transform:scale(0.94) translateY(10px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }

        /* ── Header ── */
        .cb-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .cb-head-left {
          display: flex;
          align-items: center;
          gap: 9px;
        }
        .cb-head-avatar {
          width: 30px; height: 30px;
          border-radius: 8px;
          background: linear-gradient(135deg, #D4860A, #F0A830);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .cb-head-info {}
        .cb-head-name {
          font-size: 13.5px;
          font-weight: 600;
          color: #F7F5F0;
          letter-spacing: -0.1px;
          line-height: 1.2;
        }
        .cb-head-status {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: rgba(247,245,240,0.4);
          font-family: 'DM Mono', monospace;
          letter-spacing: 0.3px;
          margin-top: 1px;
        }
        .cb-head-status-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #4CAF76;
          box-shadow: 0 0 6px #4CAF76;
        }
        .cb-close-btn {
          width: 26px; height: 26px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: rgba(247,245,240,0.4);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s, color 0.15s;
        }
        .cb-close-btn:hover { background: rgba(255,255,255,0.09); color: #F7F5F0; }

        /* ── Messages ── */
        .cb-msgs {
          flex: 1;
          overflow-y: auto;
          padding: 20px 16px 8px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.06) transparent;
        }
        .cb-msgs::-webkit-scrollbar { width: 3px; }
        .cb-msgs::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 2px; }

        /* Message row */
        .cb-msg-row {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .cb-msg-row.user { flex-direction: row-reverse; }

        .cb-msg-avatar {
          width: 26px; height: 26px;
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .cb-msg-avatar.bot {
          background: linear-gradient(135deg, #D4860A, #F0A830);
        }
        .cb-msg-avatar.user-av {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          font-size: 11px;
          font-weight: 600;
          color: rgba(247,245,240,0.7);
          font-family: 'DM Mono', monospace;
        }

        .cb-msg-body { flex: 1; min-width: 0; }
        .cb-msg-sender {
          font-size: 11px;
          font-weight: 600;
          color: rgba(247,245,240,0.35);
          font-family: 'DM Mono', monospace;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .cb-msg-row.user .cb-msg-sender { text-align: right; }

        .cb-msg-text {
          font-size: 13.5px;
          line-height: 1.65;
          color: rgba(247,245,240,0.82);
          max-width: 100%;
          word-break: break-word;
        }
        .cb-msg-row.user .cb-msg-text {
          color: #1A1815;
          background: #D4860A;
          border-radius: 12px 12px 2px 12px;
          padding: 9px 13px;
          display: inline-block;
          font-weight: 500;
          float: right;
          clear: both;
        }

        /* Typing dots */
        .cb-typing-row {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .cb-typing-dots {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 10px 0 2px;
        }
        .cb-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: rgba(247,245,240,0.25);
          animation: cb-bounce 1.3s infinite;
        }
        .cb-dot:nth-child(2) { animation-delay: 0.18s; }
        .cb-dot:nth-child(3) { animation-delay: 0.36s; }
        @keyframes cb-bounce {
          0%,80%,100% { transform:translateY(0); opacity:0.25; }
          40% { transform:translateY(-5px); opacity:0.9; }
        }

        .cb-error-msg {
          font-size: 12px;
          color: #F09090;
          text-align: center;
          padding: 4px 0;
          font-family: 'DM Mono', monospace;
        }

        /* ── Input area ── */
        .cb-input-area {
          padding: 12px 14px 14px;
          flex-shrink: 0;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .cb-input-box {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 10px 10px 10px 14px;
          transition: border-color 0.18s;
        }
        .cb-input-box:focus-within {
          border-color: rgba(212,134,10,0.4);
        }
        .cb-textarea {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #F7F5F0;
          font-size: 13.5px;
          font-family: 'DM Sans', sans-serif;
          line-height: 1.5;
          resize: none;
          min-height: 22px;
          max-height: 120px;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .cb-textarea::placeholder { color: rgba(247,245,240,0.22); }
        .cb-textarea::-webkit-scrollbar { display: none; }

        .cb-send-btn {
          width: 30px; height: 30px;
          border-radius: 8px;
          border: none;
          background: #D4860A;
          color: #1A1815;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s, transform 0.12s, opacity 0.15s;
        }
        .cb-send-btn:hover:not(:disabled) { background: #E8960E; transform: scale(1.05); }
        .cb-send-btn:active:not(:disabled) { transform: scale(0.94); }
        .cb-send-btn:disabled { background: rgba(255,255,255,0.07); color: rgba(247,245,240,0.2); cursor: not-allowed; }

        .cb-hint {
          font-size: 10.5px;
          color: rgba(247,245,240,0.2);
          font-family: 'DM Mono', monospace;
          text-align: center;
          margin-top: 8px;
          letter-spacing: 0.3px;
        }
      `}</style>

            {/* Floating trigger */}
            {!isOpen && (
                <button className="cb-trigger-btn" onClick={openChat}>
                    <span className="cb-trigger-dot" />
                    Ask Doubts
                </button>
            )}

            {/* Popup */}
            {isOpen && (
                <div className="cb-shell">

                    {/* Header */}
                    <div className="cb-head">
                        <div className="cb-head-left">
                            <div className="cb-head-avatar">
                                <Bot size={15} color="#1A1815" />
                            </div>
                            <div className="cb-head-info">
                                <div className="cb-head-name">learnmind tutor</div>
                                <div className="cb-head-status">
                                    <span className="cb-head-status-dot" />
                                    context-aware · live
                                </div>
                            </div>
                        </div>
                        <button className="cb-close-btn" onClick={closeChat}>
                            <X size={13} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="cb-msgs">

                        {/* Welcome */}
                        <div className="cb-msg-row">
                            <div className="cb-msg-avatar bot">
                                <Bot size={13} color="#1A1815" />
                            </div>
                            <div className="cb-msg-body">
                                <div className="cb-msg-sender">Tutor</div>
                                <div className="cb-msg-text">
                                    <MsgText text={WELCOME} />
                                </div>
                            </div>
                        </div>

                        {/* Conversation */}
                        {history.map((msg, i) => {
                            const isUser = msg.role === "user";
                            const initials = authUser?.fullName
                                ? authUser.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
                                : "U";
                            return (
                                <div key={i} className={`cb-msg-row ${isUser ? "user" : ""}`}>
                                    {isUser ? (
                                        <div className="cb-msg-avatar user-av">{initials}</div>
                                    ) : (
                                        <div className="cb-msg-avatar bot">
                                            <Bot size={13} color="#1A1815" />
                                        </div>
                                    )}
                                    <div className="cb-msg-body">
                                        <div className="cb-msg-sender">{isUser ? "You" : "Tutor"}</div>
                                        <div className="cb-msg-text">
                                            <MsgText text={msg.content} />
                                        </div>
                                        {!isUser && msg.videoRef && <VideoRefCard videoRef={msg.videoRef} />}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Typing indicator */}
                        {isLoading && (
                            <div className="cb-typing-row">
                                <div className="cb-msg-avatar bot">
                                    <Bot size={13} color="#1A1815" />
                                </div>
                                <div className="cb-msg-body">
                                    <div className="cb-msg-sender">Tutor</div>
                                    <div className="cb-typing-dots">
                                        <div className="cb-dot" />
                                        <div className="cb-dot" />
                                        <div className="cb-dot" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && <div className="cb-error-msg">{error}</div>}
                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="cb-input-area">
                        <div className="cb-input-box">
                            <textarea
                                ref={(el) => { inputRef.current = el; textareaRef.current = el; }}
                                className="cb-textarea"
                                placeholder="Ask a question..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
                                rows={1}
                            />
                            <button
                                className="cb-send-btn"
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                            >
                                <ArrowUp size={14} />
                            </button>
                        </div>
                        <div className="cb-hint">Enter to send · Shift+Enter for new line</div>
                    </div>

                </div>
            )}
        </>
    );
}