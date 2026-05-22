import React, { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import { ChatMessage, FlockBatch } from "../types";
import { 
  Send, 
  Sparkles, 
  Loader2, 
  User, 
  HeartPulse, 
  AlertCircle, 
  PhoneCall, 
  Trash2,
  BookmarkCheck,
  ChevronRight,
  RefreshCw,
  Clock
} from "lucide-react";

interface ChatbotTabProps {
  batches: FlockBatch[];
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onClearHistory: () => void;
  isLoading: boolean;
  prefilledMessage?: string;
  setPrefilledMessage?: (msg: string) => void;
}

export const ChatbotTab: React.FC<ChatbotTabProps> = ({
  batches,
  messages,
  onSendMessage,
  onClearHistory,
  isLoading,
  prefilledMessage = "",
  setPrefilledMessage,
}) => {
  const [inputText, setInputText] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefilledMessage) {
      onSendMessage(prefilledMessage);
      if (setPrefilledMessage) {
        setPrefilledMessage("");
      }
    }
  }, [prefilledMessage]);

  // Scroll to bottom on updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const textToSend = inputText;
    setInputText("");
    await onSendMessage(textToSend);
  };

  const handleQuickQuestion = (question: string) => {
    if (isLoading) return;
    setInputText("");
    onSendMessage(question);
  };

  const sampleQuestions = [
    {
      title: "Coccidiosis Treatment",
      query: "How do I treat coccidiosis in 4-week-old broilers? What is the dosage of Amprolium?",
    },
    {
      title: "Newcastle Vaccine Schedule",
      query: "What is the standard vaccination schedule in Ghana to prevent Newcastle Disease?",
    },
    {
      title: "Ruffled Feathers & Lethargy",
      query: "My layers have ruffled feathers, severe depression, and some are pecking their vents. What could it be?",
    },
    {
      title: "Hot Weather Egg Drops",
      query: "Temperature in my pen reached 34 degrees and egg collection fell by 20%. What ventilation and water interventions can I apply?",
    }
  ];

  return (
    <div id="chatbot-tab-view" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      
      {/* Left Chatbot Sidebar: Reference Info & Quick Prompts */}
      <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
        
        <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-100 font-sans">
              AI Diagnostic Context
            </h3>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            This chatbot is tuned with the Ministry of Food & Agriculture (MoFA) biosecurity protocols and FAO guidelines for West Africa. Ask diagnostic or nutritional questions.
          </p>

          <div className="pt-3 border-t border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-2">Ghana Pathogens Profiled</span>
            <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold">
              <span className="bg-slate-800 text-rose-300 px-2.5 py-1 rounded-lg border border-slate-700/60">Newcastle (Highly Infectious)</span>
              <span className="bg-slate-800 text-amber-300 px-2.5 py-1 rounded-lg border border-slate-700/60">Coccidiosis (Wet Litter/Parasitic)</span>
              <span className="bg-slate-800 text-indigo-300 px-2.5 py-1 rounded-lg border border-slate-700/60">Gumboro / IBD (Chicks Focus)</span>
              <span className="bg-slate-800 text-purple-300 px-2.5 py-1 rounded-lg border border-slate-700/60">Fowl Pox (Wing Nodules)</span>
              <span className="bg-slate-800 text-red-300 px-2.5 py-1 rounded-lg border border-slate-700/60">Avian Flu (Zoonotic Alert)</span>
            </div>
          </div>
        </div>

        {/* Quick Question Cards */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Quick Advisory Topics</span>
          <div className="space-y-2">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickQuestion(q.query)}
                className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-emerald-300 bg-slate-50/50 hover:bg-emerald-50/20 text-xs text-slate-700 hover:text-emerald-950 font-medium transition-all flex items-center justify-between group cursor-pointer"
              >
                <span className="truncate pr-4">{q.title}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-700 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Professional Veterinary Warning Banner */}
        <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl space-y-2">
          <div className="flex items-center gap-1 text-orange-850 font-bold text-xs uppercase tracking-wide">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            Disclaimer and Referrals
          </div>
          <p className="text-[11px] text-orange-950 leading-relaxed">
            Conversational suggestions are diagnostic pre-screens based on statistical patterns. <strong>Do NOT replace certified pathologists.</strong> Contact MoFA veterinary extension officers for critical medication prescriptions.
          </p>
        </div>

      </div>

      {/* Right Chatbot Panel: Message History & Input */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[520px] overflow-hidden">
        
        {/* Header toolbar */}
        <div className="p-4 border-b border-slate-100/80 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm font-sans">MoFA-Aligned AI Veterinarian</h4>
              <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                Using Gemini 3.5 Flash Model
              </p>
            </div>
          </div>

          {messages.length > 0 && (
            <div className="flex items-center gap-1.5">
              {showResetConfirm ? (
                <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-xl p-1 animate-in fade-in zoom-in-95 duration-100">
                  <span className="text-[10px] uppercase font-black text-rose-700 px-1.5">Clear history?</span>
                  <button
                    onClick={() => {
                      onClearHistory();
                      setShowResetConfirm(false);
                    }}
                    className="text-[10px] text-white bg-rose-600 hover:bg-rose-700 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer"
                  >
                    Yes, Clear
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="text-[10px] text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200/80 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer font-semibold shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Reset Advisor
                </button>
              )}
            </div>
          )}
        </div>

        {/* Messages list pane */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
          
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-700">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Empathetic AI Veterinary Advisor</h4>
              <p className="text-slate-500 text-xs max-w-sm leading-relaxed">
                Describe your birds' droppings, physical signs (e.g., gasping, swollen heads, drop in lay), or ask about vaccination protocols to receive instant clinical pre-screening.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"} items-start gap-2.5 max-w-full`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
                      <Sparkles className="w-4.5 h-4.5 text-emerald-400" />
                    </div>
                  )}

                  <div className={`p-4 rounded-2xl text-xs max-w-[85%] leading-relaxed shadow-xs ${
                    isUser
                      ? "bg-slate-900 text-slate-100 rounded-tr-none whitespace-pre-wrap"
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-none font-sans"
                  }`}>
                    {isUser ? (
                      m.content
                    ) : (
                      <div className="markdown-body text-slate-800 space-y-2">
                        <Markdown
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-sm font-black text-slate-950 mt-3 mb-1 bg-slate-100 px-2 py-1 rounded border border-slate-200" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-xs font-bold text-emerald-900 mt-2 mb-1 border-b border-emerald-100 pb-0.5" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-xs font-bold text-slate-900 mt-2 mb-1" {...props} />,
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed text-slate-700" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                            li: ({node, ...props}) => <li className="pl-0.5 text-slate-700" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-extrabold text-slate-950" {...props} />,
                          }}
                        >
                          {m.content}
                        </Markdown>
                      </div>
                    )}
                    
                    <div className="mt-2.5 pt-1.5 border-t border-slate-100 text-[9px] opacity-65 text-right flex items-center justify-end gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {m.timestamp}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-full bg-slate-250 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-slate-600" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex justify-start items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs shrink-0">
                <Sparkles className="w-4.5 h-4.5 text-emerald-400" />
              </div>
              <div className="bg-white border border-slate-200/85 p-4 rounded-2xl rounded-tl-none text-xs text-slate-600 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                Analyzing symptoms with GCA / FAO datasets...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form Bar */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-150/90 bg-white flex gap-2">
          <input
            type="text"
            required
            value={inputText}
            disabled={isLoading}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Describe symptoms (e.g., 'wet droppings', 'coughing layers')..."
            className="flex-1 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-medium transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white p-3 rounded-xl transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>

    </div>
  );
};
