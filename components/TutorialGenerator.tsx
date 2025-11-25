"use client";

import { useState } from "react";
import { generateTutorial, askFollowUp, getTutorial } from "@/app/actions";
import { Step, Message, Tutorial } from "@/lib/types";
import {
  Send,
  ChevronDown,
  ChevronUp,
  Terminal,
  MessageSquare,
  Loader2,
  History,
  Plus,
  Menu,
  X,
  Cpu,
  Activity,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function TutorialGenerator({
  initialHistory,
}: {
  initialHistory: any[];
}) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [tutorial, setTutorial] = useState<{
    id?: string;
    topic?: string;
    steps: Step[];
  } | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [chatInputs, setChatInputs] = useState<Record<string, string>>({});
  const [sendingMsg, setSendingMsg] = useState<Record<string, boolean>>({});

  const [history, setHistory] = useState<any[]>(initialHistory);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setTutorial(null);
    try {
      const res = await generateTutorial(topic);
      if (res.error) {
        alert(res.error);
      } else {
        setTutorial(res as any);
        // Add to history immediately
        if (res.tutorial) {
          setHistory((prev) => [res.tutorial, ...prev]);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Errore generico");
    } finally {
      setLoading(false);
    }
  };

  const loadTutorial = async (id: string) => {
    setLoading(true);
    setTutorial(null);
    // Close sidebar on mobile when selecting
    if (window.innerWidth < 768) setIsSidebarOpen(false);

    try {
      const res = await getTutorial(id);
      if (res) {
        setTutorial(res as any);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startNew = () => {
    setTutorial(null);
    setTopic("");
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const toggleStep = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  const handleSendMessage = async (step: Step) => {
    const input = chatInputs[step.id];
    if (!input?.trim()) return;

    setSendingMsg((prev) => ({ ...prev, [step.id]: true }));

    // Optimistic update (optional, but let's stick to simple state for now)
    try {
      const res = await askFollowUp(
        step.id,
        `Title: ${step.title}\nContent: ${step.content}\nCommand: ${step.command}`,
        input
      );

      if (res.message && tutorial) {
        // Update local state with new messages
        const newMsgUser: Message = {
          id: "temp-user-" + Date.now(),
          step_id: step.id,
          role: "user",
          content: input,
          created_at: new Date().toISOString(),
        };
        const newMsgAssistant: Message = res.message;

        setTutorial((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            steps: prev.steps.map((s) => {
              if (s.id === step.id) {
                return {
                  ...s,
                  messages: [
                    ...(s.messages || []),
                    newMsgUser,
                    newMsgAssistant,
                  ],
                };
              }
              return s;
            }),
          };
        });

        setChatInputs((prev) => ({ ...prev, [step.id]: "" }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMsg((prev) => ({ ...prev, [step.id]: false }));
    }
  };

  return (
    <div className="flex h-screen overflow-hidden font-mono bg-background text-foreground">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed md:relative z-30 w-80 h-full bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 ease-in-out border-r-2 border-sidebar-border",
          isSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden md:border-none"
        )}>
        <div className="p-6 border-b border-sidebar-border flex items-center justify-between bg-sidebar">
          <div className="flex flex-col">
            <h2 className="font-bold text-xl tracking-tighter uppercase flex items-center gap-2 text-primary">
              <Activity className="w-5 h-5" /> LOG_SISTEMA
            </h2>
            <span className="text-xs text-muted mt-1">
              V 1.2 // RETE SICURA
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-primary">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b border-sidebar-border">
          <button
            onClick={startNew}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-black px-4 py-3 transition-colors font-bold uppercase tracking-wider border border-primary hover:border-primary-dark">
            <Plus className="w-5 h-5" /> INIZIA_NUOVA_SEQ
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          <div className="px-4 py-2 text-xs text-muted uppercase tracking-widest border-b border-sidebar-border bg-sidebar-accent">
            Operazioni Recenti
          </div>
          {history.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => loadTutorial(item.id)}
              className={cn(
                "w-full text-left px-6 py-4 text-sm transition-all border-b border-sidebar-border group relative overflow-hidden",
                tutorial?.id === item.id
                  ? "bg-sidebar-accent text-primary"
                  : "hover:bg-sidebar-accent text-gray-300 hover:text-white"
              )}>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold opacity-50 font-mono">
                  {(history.length - idx).toString().padStart(2, "0")}
                </span>
                <span className="truncate font-medium uppercase tracking-tight">
                  {item.topic}
                </span>
              </div>
              {tutorial?.id === item.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              )}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-sidebar-border text-xs text-muted-foreground uppercase text-center">
          Stato Sistema: ONLINE
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
        {/* Grid Background Pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(black 1px, transparent 1px), linear-gradient(90deg, black 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}></div>

        {/* Header */}
        <header className="h-20 border-b-2 border-black bg-background flex items-center px-6 justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-black hover:text-primary border border-transparent hover:border-black transition-all rounded-none">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="font-black text-3xl tracking-tighter uppercase italic">
                CMD_BLITZ <span className="text-primary not-italic">///</span>
              </h1>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs font-bold uppercase tracking-widest border border-black px-3 py-1 bg-white">
            <span>Utente: ADMIN</span>
            <span className="w-px h-3 bg-black"></span>
            <span className="text-primary">Connesso</span>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-12 relative z-10">
          <div className="max-w-4xl mx-auto space-y-12">
            {!tutorial && !loading && (
              <div className="text-center space-y-8 py-20 border-2 border-dashed border-black/20 p-12">
                <div className="w-24 h-24 bg-black text-primary flex items-center justify-center mx-auto mb-6 border-2 border-black shadow-[4px_4px_0px_0px_black]">
                  <Terminal className="w-12 h-12" />
                </div>
                <h2 className="text-4xl font-black uppercase tracking-tighter">
                  IN ATTESA DI INPUT
                </h2>
                <p className="text-black/60 max-w-md mx-auto font-medium uppercase tracking-wide text-sm">
                  Inizializza la sequenza di generazione per protocolli DevOps,
                  Cloud e Backend.
                </p>
              </div>
            )}

            {/* Search Form */}
            {(!tutorial || loading) && (
              <div className="relative">
                <div className="absolute -top-3 left-4 bg-background px-2 text-xs font-bold uppercase tracking-widest text-primary">
                  Interfaccia Riga di Comando
                </div>
                <form
                  onSubmit={handleGenerate}
                  className="flex flex-col md:flex-row gap-0 border-2 border-black bg-white shadow-[8px_8px_0px_0px_black] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[7px_7px_0px_0px_black]">
                  <div className="flex-1 flex items-center px-4 py-4 md:py-6">
                    <span className="text-primary mr-3 font-bold">{">"}</span>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="INSERISCI PARAMETRI PROTOCOLLO..."
                      className="flex-1 bg-transparent border-none focus:outline-none font-mono text-lg uppercase placeholder:text-black/30"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-4 md:py-6 bg-black text-white font-bold uppercase tracking-widest hover:bg-primary hover:text-black disabled:opacity-50 disabled:hover:bg-black disabled:hover:text-white transition-colors flex items-center justify-center gap-3 border-l-2 border-black md:w-auto w-full">
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin w-5 h-5" />
                        ELABORAZIONE
                      </>
                    ) : (
                      <>
                        ESEGUI <Send className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Tutorial View */}
            {tutorial && (
              <div className="space-y-8">
                <div className="flex items-end justify-between border-b-4 border-black pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-primary block mb-1">
                      Protocollo Attivo
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none">
                      {tutorial.topic}
                    </h2>
                  </div>
                  <div className="hidden md:block text-right">
                    <div className="text-xs font-bold uppercase tracking-widest text-black/50">
                      ID: {tutorial.id?.slice(0, 8)}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {tutorial.steps.map((step, idx) => (
                    <div
                      key={step.id}
                      className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_black] transition-all hover:shadow-[6px_6px_0px_0px_black] hover:-translate-y-0.5">
                      <div
                        onClick={() => toggleStep(step.id)}
                        className="p-6 cursor-pointer flex items-start gap-6 hover:bg-black/5 transition-colors">
                        <div className="flex-shrink-0 w-12 h-12 bg-primary text-black border-2 border-black flex items-center justify-center font-black text-xl shadow-[2px_2px_0px_0px_black]">
                          {(idx + 1).toString().padStart(2, "0")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-xl uppercase tracking-tight mb-2">
                            {step.title}
                          </h3>
                          <p className="text-black/70 text-sm leading-relaxed font-medium">
                            {step.content}
                          </p>
                          {step.command && (
                            <div className="mt-4 bg-black text-terminal p-4 border-2 border-black font-mono text-sm relative group">
                              <div className="flex items-start gap-3">
                                <Terminal className="w-4 h-4 text-primary shrink-0 mt-1" />
                                <pre className="whitespace-pre-wrap break-all font-inherit">
                                  {step.command}
                                </pre>
                              </div>
                              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-black text-[10px] px-1 font-bold uppercase">
                                COPIA
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-black pt-2">
                          {expandedStep === step.id ? (
                            <ChevronUp className="w-6 h-6" />
                          ) : (
                            <ChevronDown className="w-6 h-6" />
                          )}
                        </div>
                      </div>

                      {expandedStep === step.id && (
                        <div className="border-t-2 border-black bg-background p-6 space-y-6">
                          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-black mb-4 border-b border-black pb-2 w-fit">
                            <MessageSquare className="w-4 h-4" />
                            Diagnostica & Supporto
                          </div>

                          <div className="space-y-4 pl-4 border-l-2 border-black/20">
                            {step.messages?.map((msg) => (
                              <div
                                key={msg.id}
                                className={cn(
                                  "text-sm p-4 border-2 border-black shadow-[2px_2px_0px_0px_black/10]",
                                  msg.role === "assistant"
                                    ? "bg-white mr-8"
                                    : "bg-primary text-black ml-8 font-bold"
                                )}>
                                <strong className="block text-[10px] uppercase tracking-widest mb-1 opacity-70">
                                  {msg.role === "assistant"
                                    ? "SISTEMA_AI"
                                    : "INPUT_UTENTE"}
                                </strong>
                                {msg.content}
                              </div>
                            ))}
                            {(!step.messages || step.messages.length === 0) && (
                              <p className="text-xs text-black/40 uppercase tracking-widest">
                                // Nessun dato diagnostico disponibile.
                              </p>
                            )}
                          </div>

                          <div className="flex gap-0 mt-6 border-2 border-black bg-white">
                            <input
                              type="text"
                              value={chatInputs[step.id] || ""}
                              onChange={(e) =>
                                setChatInputs((prev) => ({
                                  ...prev,
                                  [step.id]: e.target.value,
                                }))
                              }
                              placeholder="PARAMETRI QUERY..."
                              className="flex-1 px-4 py-3 text-sm focus:outline-none bg-transparent font-mono uppercase placeholder:text-black/30"
                              onKeyDown={(e) =>
                                e.key === "Enter" && handleSendMessage(step)
                              }
                            />
                            <button
                              onClick={() => handleSendMessage(step)}
                              disabled={sendingMsg[step.id]}
                              className="px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-black disabled:opacity-50 border-l-2 border-black transition-colors">
                              {sendingMsg[step.id] ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "INVIA_QUERY"
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
