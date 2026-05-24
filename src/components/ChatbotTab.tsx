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
  const [mobileActiveSubTab, setMobileActiveSubTab] = useState<"chat" | "reference">("chat");
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
    <div id="chatbot-tab-view" className="flex flex-col lg:grid lg:grid-cols-12 gap-5 h-full min-h-0 lg:overflow-hidden">
      
      {/* Mobile Sub-Tab Switcher (styled optimally with brand aesthetics, visible on mobile only) */}
      <div className="lg:hidden flex p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shrink-0">
        <button
          type="button"
          onClick={() => setMobileActiveSubTab("chat")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            mobileActiveSubTab === "chat"
              ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <HeartPulse className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Advisor Chat</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileActiveSubTab("reference")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            mobileActiveSubTab === "reference"
              ? "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Reference Guides</span>
        </button>
      </div>

      {/* Left Chatbot Sidebar: Reference Info & Quick Prompts */}
      <div className={`lg:col-span-4 space-y-6 flex-col justify-start lg:overflow-y-auto lg:max-h-full lg:pr-1.5 min-h-0 ${
        mobileActiveSubTab === "reference" ? "flex h-full overflow-y-auto" : "hidden lg:flex"
      }`}>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white font-sans">
              AI Diagnostic Context
            </h3>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
            This chatbot is tuned with the Ministry of Food & Agriculture (MoFA) biosecurity protocols and FAO guidelines for West Africa. Ask diagnostic or nutritional questions.
          </p>

          <div className="pt-3 border-t border-slate-150 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-2 font-sans">Ghana Pathogens Profiled</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 text-[11px] font-semibold">
              <button 
                type="button"
                onClick={() => {
                  handleQuickQuestion("Provide an advisory profile for Newcastle Disease: symptoms, transmission, prevention, and Ghana MoFA guidelines.");
                  setMobileActiveSubTab("chat");
                }}
                className="w-full text-left p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/30 bg-rose-50/50 hover:bg-rose-100/80 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-900 dark:text-rose-200 transition-all cursor-pointer flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                <span className="truncate flex-1">Newcastle (Highly Infectious)</span>
              </button>
              
              <button 
                type="button"
                onClick={() => {
                  handleQuickQuestion("Provide an advisory profile for Coccidiosis: symptoms, treatment options (e.g. Amprolium), wet litter management, and prevention.");
                  setMobileActiveSubTab("chat");
                }}
                className="w-full text-left p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/30 bg-amber-50/50 hover:bg-amber-100/80 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 text-amber-955 or text-amber-950 dark:text-amber-200 transition-all cursor-pointer flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                <span className="truncate flex-1">Coccidiosis (Wet Litter/Parasitic)</span>
              </button>
              
              <button 
                type="button"
                onClick={() => {
                  handleQuickQuestion("Provide an advisory profile for Gumboro / Infectious Bursal Disease (IBD): signs in chicks, severity, and vaccination schedule.");
                  setMobileActiveSubTab("chat");
                }}
                className="w-full text-left p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/30 bg-indigo-50/50 hover:bg-indigo-100/80 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 transition-all cursor-pointer flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
                <span className="truncate flex-1">Gumboro / IBD (Chicks Focus)</span>
              </button>
              
              <button 
                type="button"
                onClick={() => {
                  handleQuickQuestion("Provide an advisory profile for Fowl Pox: clinical signs like wing nodules, transmission, risk, and treatment/management rules.");
                  setMobileActiveSubTab("chat");
                }}
                className="w-full text-left p-2.5 rounded-xl border border-purple-200 dark:border-purple-900/30 bg-purple-50/50 hover:bg-purple-100/80 dark:bg-purple-950/30 dark:hover:bg-purple-900/40 text-purple-900 dark:text-purple-200 transition-all cursor-pointer flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
                <span className="truncate flex-1">Fowl Pox (Wing Nodules)</span>
              </button>
              
              <button 
                type="button"
                onClick={() => {
                  handleQuickQuestion("Provide an advisory profile for Avian Flu (Avian Influenza): signs, extremely dangerous zoonotic risk to humans, and strict quarantine and biosecurity reporting guidelines.");
                  setMobileActiveSubTab("chat");
                }}
                className="w-full text-left p-2.5 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50/50 hover:bg-red-100/80 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-900 dark:text-red-200 transition-all cursor-pointer flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                <span className="truncate flex-1">Avian Flu (Zoonotic Alert)</span>
              </button>
              
              <button 
                type="button"
                onClick={() => {
                  handleQuickQuestion("Provide an advisory profile for Infectious Coryza / Chronic Respiratory Disease (CRD): signs around the eyes and face, treatment via antibiotics, environmental triggers, and control strategies.");
                  setMobileActiveSubTab("chat");
                }}
                className="w-full text-left p-2.5 rounded-xl border border-teal-200 dark:border-teal-900/30 bg-teal-50/50 hover:bg-teal-100/80 dark:bg-teal-950/30 dark:hover:bg-teal-900/40 text-teal-900 dark:text-teal-200 transition-all cursor-pointer flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-teal-550 shrink-0"></span>
                <span className="truncate flex-1">Infectious Coryza (Swollen Eye)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Question Cards */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
          <span className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase tracking-widest block font-sans">Quick Advisory Topics</span>
          <div className="space-y-2">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  handleQuickQuestion(q.query);
                  setMobileActiveSubTab("chat");
                }}
                className="w-full text-left p-3 rounded-xl border border-slate-150 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-emerald-50/20 dark:hover:bg-emerald-900/10 text-xs text-slate-700 dark:text-slate-300 hover:text-emerald-950 dark:hover:text-emerald-400 font-medium transition-all flex items-center justify-between group cursor-pointer"
              >
                <span className="truncate pr-4 flex-1">{q.title}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-505 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Professional Veterinary Warning Banner */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl space-y-2">
          <div className="flex items-center gap-1 text-amber-800 dark:text-amber-400 font-bold text-xs uppercase tracking-wide">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500" />
            Disclaimer and Referrals
          </div>
          <p className="text-[11px] text-amber-900 dark:text-amber-200/90 leading-relaxed font-sans font-medium">
            Conversational suggestions are diagnostic pre-screens based on statistical patterns. <strong>Do NOT replace certified pathologists.</strong> Contact MoFA veterinary extension officers for critical medication prescriptions.
          </p>
        </div>
      </div>

      {/* Right Chatbot Panel: Message History & Input */}
      <div className={`lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col min-h-0 overflow-hidden ${
        mobileActiveSubTab === "chat" ? "flex-1 h-full" : "hidden lg:flex lg:h-full lg:max-h-full"
      }`}>
        
        {/* Header toolbar */}
        <div className="p-4 border-b border-slate-100/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-xl">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm font-sans">FlockIntel AI</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                Predictive Veterinarian & Diagnostic Advisor
              </p>
            </div>
          </div>

          {messages.length > 0 && (
            <div className="flex items-center gap-1.5">
              {showResetConfirm ? (
                <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl p-1 animate-in fade-in zoom-in-95 duration-100">
                  <span className="text-[10px] uppercase font-black text-rose-700 dark:text-rose-300 px-1.5">Clear history?</span>
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
                    className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-slate-950 hover:bg-rose-50 dark:hover:bg-rose-950/25 border border-slate-200/80 dark:border-slate-800 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer font-semibold shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Reset Advisor
                </button>
              )}
            </div>
          )}
        </div>

        {/* Messages list pane */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-slate-950/35">
          
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/45 rounded-full flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white text-sm">Empathetic FlockIntel AI Advisor</h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm leading-relaxed">
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
                    <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
                      <Sparkles className="w-4.5 h-4.5 text-emerald-400" />
                    </div>
                  )}

                  <div className={`p-4 rounded-2xl text-xs max-w-[85%] leading-relaxed shadow-xs ${
                    isUser
                      ? "bg-slate-900 dark:bg-emerald-600 text-slate-100 dark:text-white rounded-tr-none whitespace-pre-wrap"
                      : "bg-white dark:bg-slate-950/65 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none font-sans"
                  }`}>
                    {isUser ? (
                      m.content
                    ) : (
                      <div className="markdown-body text-slate-800 dark:text-slate-200 space-y-2">
                        <Markdown
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-sm font-black text-slate-950 dark:text-white mt-3 mb-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-xs font-bold text-emerald-900 dark:text-emerald-400 mt-2 mb-1 border-b border-emerald-100 dark:border-emerald-900/30 pb-0.5" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-2 mb-1" {...props} />,
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed text-slate-700 dark:text-slate-300" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                            li: ({node, ...props}) => <li className="pl-0.5 text-slate-700 dark:text-slate-300" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-extrabold text-slate-950 dark:text-white" {...props} />,
                          }}
                        >
                          {m.content}
                        </Markdown>
                      </div>
                    )}
                    
                    <div className="mt-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/60 text-[9px] opacity-65 text-right flex items-center justify-end gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {m.timestamp}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex justify-start items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center text-xs shrink-0">
                <Sparkles className="w-4.5 h-4.5 text-emerald-400" />
              </div>
              <div className="bg-white dark:bg-slate-950/65 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl rounded-tl-none text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 shadow-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                Analyzing symptoms with GCA / FAO datasets...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form Bar */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-150/90 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
          <input
            type="text"
            required
            value={inputText}
            disabled={isLoading}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Describe symptoms (e.g., 'wet droppings', 'coughing layers')..."
            className="flex-1 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/50 dark:hover:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 dark:focus:border-emerald-500 font-medium transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white px-4 py-3 rounded-xl transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>

    </div>
  );
};
