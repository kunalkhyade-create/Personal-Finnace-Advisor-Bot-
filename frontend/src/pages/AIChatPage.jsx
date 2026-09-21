import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiAPI } from '../services/api';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  Trash2, 
  Info, 
  CornerDownLeft,
  Lightbulb
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  "Where am I spending too much this month?",
  "How can I save more money?",
  "Create a budget for next month",
  "Why are my expenses increasing?",
  "Give me tips to reduce food expenses",
  "Analyze my current financial situation"
];

const AIChatPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHistory = async () => {
    try {
      const res = await aiAPI.getChatHistory();
      if (res.data.history && res.data.history.length > 0) {
        setMessages(res.data.history);
      } else {
        // Default initial greeting
        setMessages([
          {
            role: 'assistant',
            content: `Hello ${user?.name || 'there'}! I'm your AI Personal Finance Advisor. I have direct access to your income records, categorized expenses, and budget limits in Indian Rupees (₹). Ask me anything about where your money is going or how to optimize your savings!`
          }
        ]);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (messageText = inputMessage) => {
    const textToSend = messageText.trim();
    if (!textToSend || loading) return;

    setInputMessage('');
    const newMessages = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await aiAPI.chat({ message: textToSend });
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: res.data.reply,
        is_ai_powered: res.data.is_ai_powered 
      }]);
    } catch (err) {
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: "I encountered an issue processing your request. Please ensure the backend server is running and try again." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Clear all conversation history?")) return;
    try {
      await aiAPI.clearChatHistory();
      setMessages([
        {
          role: 'assistant',
          content: `Conversation reset! How can I assist with your finances today?`
        }
      ]);
    } catch (err) {
      alert("Failed to clear history.");
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              Finance Advisor Bot
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Data-Connected
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Contextualized with your live financial records</p>
          </div>
        </div>

        <button
          onClick={handleClearHistory}
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
          title="Clear chat"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
                    : 'bg-blue-50 text-blue-600 border border-blue-100'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-xl rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                  isUser
                    ? 'bg-blue-600 text-white font-medium rounded-tr-none shadow-sm'
                    : 'bg-slate-100/80 text-slate-800 rounded-tl-none border border-slate-200/60'
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-slate-100 rounded-2xl rounded-tl-none px-4 py-3 border border-slate-200/60">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Bar */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 overflow-x-auto whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0 mr-1">
            Try asking:
          </span>
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="inline-block text-xs font-semibold px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition-colors flex-shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-3 sm:p-4 border-t border-slate-200/80 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about your expenses, savings rate, or request a budget..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() || loading}
            className="p-2.5 sm:px-4 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 shadow-sm"
          >
            <span className="hidden sm:inline">Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-2 text-center text-[10px] text-slate-400">
          AI suggestions are for planning purposes and should not be considered professional financial advice.
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;
