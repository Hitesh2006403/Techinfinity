import { useState } from "react";
import { assistantService } from "../../services/assistantService";
import {
  Sparkles,
  Send,
  BookOpen,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  User,
  Bot
} from "lucide-react";

export function LearningAssistantPage() {
  const [messages, setMessages] = useState([
    {
      id: "m_1",
      sender: "assistant",
      text: "Hello! I am your **EduInfinity Learning Assistant**. I can help explain conceptual physics, verify turns ratio formulas, or clarify rubric criteria for your courses. How can I assist you today?",
      timestamp: "Just now",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const quickPrompts = [
    "Explain Transformer turns ratio logic",
    "Why is the core made of laminated silicon steel?",
    "Step-by-step derivation of the EMF 4.44 factor",
    "What is mutual induction between stationary windings?",
  ];

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const userMsg = {
      id: `u_${Date.now()}`,
      sender: "user",
      text,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const replyData = await assistantService.askAssistant(text);

    const botMsg = {
      id: `b_${Date.now()}`,
      sender: "assistant",
      text: replyData.reply,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, botMsg]);
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)] pb-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-outline-variant/60 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-secondary-fixed text-tertiary flex items-center justify-center border border-secondary shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-headline text-xl font-medium text-primary dark:text-inverse-primary leading-tight">
              Academic Learning Assistant
            </h1>
            <p className="text-xs text-outline">
              Context-aware conceptual tutoring & syllabus rubric guidance
            </p>
          </div>
        </div>
        <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-surface-container text-outline border border-outline-variant">
          Course: BEE-104
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-4">
        {messages.map((m) => {
          const isBot = m.sender === "assistant";
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isBot ? "justify-start" : "justify-end"}`}
            >
              {isBot && (
                <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                  <Bot className="w-4 h-4 text-secondary-fixed" />
                </div>
              )}
              <div
                className={`max-w-xl p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  isBot
                    ? "bg-surface-container-lowest dark:bg-primary-container border border-outline-variant text-on-surface dark:text-inverse-primary shadow-folio"
                    : "bg-primary dark:bg-primary-fixed text-white dark:text-primary shadow-xs"
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>
                <div
                  className={`text-[10px] mt-2 font-mono text-right ${
                    isBot ? "text-outline" : "text-white/60 dark:text-primary/60"
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
              {!isBot && (
                <div className="w-8 h-8 rounded-xl bg-surface-container-high dark:bg-primary flex items-center justify-center shrink-0 text-xs font-bold border border-outline-variant">
                  <User className="w-4 h-4 text-primary dark:text-inverse-primary" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-outline italic">
            <Sparkles className="w-4 h-4 animate-spin text-secondary" />
            <span>Analyzing syllabus and reference rubrics...</span>
          </div>
        )}
      </div>

      {/* Quick Prompt Chips */}
      <div className="pt-2 pb-3 overflow-x-auto flex gap-2 shrink-0">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q)}
            className="whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium border border-outline-variant bg-surface-container-lowest dark:bg-primary-container text-on-surface-variant dark:text-outline hover:text-primary hover:border-primary transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 pt-2 border-t border-outline-variant/60 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your exam topics, formulas, or rubric marks..."
          className="flex-1 bg-surface-container-lowest dark:bg-primary-container border border-outline-variant rounded-xl px-4 py-2.5 text-xs text-on-surface dark:text-inverse-primary focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-4 py-2.5 bg-primary dark:bg-primary-fixed text-white dark:text-primary rounded-xl text-xs font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
