"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
    Send,
    Loader2,
    Plus,
    MessageSquare,
    Sparkles,
    User,
    Copy,
    ThumbsUp,
    ThumbsDown,
    RotateCcw,
    PanelLeftClose,
    PanelLeft,
    BookOpen,
    Headphones,
    MonitorPlay,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { MenuBar } from "@/components/layout/MenuBar";

const BOT_SRC = "/images/LIAface.png";


const LIA_SRC = "/images/LIA-Finalimage.png";


const LOGO_SRC = "/images/LIA-Logo.png";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date;
}

interface ChatResponse {
    answer: string;
}

interface ChatSession {
    id: string;
    title: string;
    timestamp: Date;
    preview: string;
}

export function ChatInterface() {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const autoResize = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    };

    useEffect(() => {
        autoResize();
    }, [input]);

    const sendMessageContent = async (userMessage: string) => {
        if (!userMessage.trim() || isLoading) return;

        const isFirstMessage = messages.length === 0;

        setMessages(prev => [
            ...prev,
            { role: 'user', content: userMessage, timestamp: new Date() },
        ]);
        setIsLoading(true);

        if (isFirstMessage) {
            const newSession: ChatSession = {
                id: Date.now().toString(),
                title:
                    userMessage.length > 40
                        ? userMessage.slice(0, 40) + '…'
                        : userMessage,
                timestamp: new Date(),
                preview: userMessage,
            };
            setSessions(prev => [newSession, ...prev]);
            setActiveSessionId(newSession.id);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/faq_chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    accept: 'application/json',
                },
                body: JSON.stringify({
                    user_question: userMessage,
                    session_id: 'default',
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ChatResponse = await response.json();
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: data.answer, timestamp: new Date() },
            ]);
        } catch (error) {
            console.error('Error:', error);
            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content:
                        'Sorry, I encountered an error processing your request. Please try again.',
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.focus();
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const userMessage = input.trim();
        if (!userMessage || isLoading) return;
        setInput('');
        await sendMessageContent(userMessage);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as unknown as React.FormEvent);
        }
    };

    const handleNewChat = () => {
        setMessages([]);
        setActiveSessionId(null);
        setInput('');
        textareaRef.current?.focus();
    };

    const handleSuggestedPrompt = (prompt: string) => {
        sendMessageContent(prompt);
    };

    const handleCopy = async (content: string, index: number) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 1500);
        } catch (err) {
            console.error('Copy failed', err);
        }
    };

    const handleRegenerate = async () => {
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
        if (!lastUserMsg) return;
        setMessages(prev => {
            const copy = [...prev];
            if (copy[copy.length - 1]?.role === 'assistant') copy.pop();
            return copy;
        });
        await sendMessageContent(lastUserMsg.content);
    };

    const formatTime = (date?: Date) => {
        if (!date) return '';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatSessionTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const hasMessages = messages.length > 0;

   
    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            <MenuBar />

            <div className="flex flex-1 overflow-hidden relative">

                <div
                    aria-hidden
                    className="absolute inset-0 z-0"
                    style={{
                        background:
                            "radial-gradient(1200px 480px at 78% -8%, rgba(51,45,125,0.06), transparent 60%)," +
                            "radial-gradient(900px 420px at 12% 4%, rgba(7,158,210,0.05), transparent 55%)," +
                            "#fffaf3",
                    }}
                />

                <aside
                    className={`${sidebarOpen ? 'w-72' : 'w-0'
                        } relative z-10 transition-all duration-300 ease-in-out flex flex-col overflow-hidden
                          border-r border-border bg-white`}
                >
                    {/* New chat */}
                    <div className="p-4 border-b border-border">
                        <button
                            onClick={handleNewChat}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5
                                       bg-gradient-to-r from-saffron to-primary
                                       hover:opacity-90
                                       text-white rounded-xl font-semibold text-sm
                                       transition-all shadow-lg shadow-primary/25
                                       hover:shadow-primary/35 hover:-translate-y-0.5"
                        >
                            <Plus className="w-4 h-4" />
                            New Chat
                        </button>
                    </div>

                    {/* Session list */}
                    <div className="flex-1 overflow-y-auto px-3 py-3">
                        <p className="px-2 pb-2 text-[10px] font-semibold tracking-[0.16em] uppercase text-muted-foreground">
                            Recent
                        </p>

                        {sessions.length === 0 ? (
                            <div className="px-3 py-10 text-center">
                                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-peacock-soft border border-peacock/20 flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5 text-peacock-deep" />
                                </div>
                                <p className="text-xs text-muted-foreground font-medium">No conversations yet</p>
                                <p className="text-[10px] text-muted-foreground/70 mt-1">Start a new chat above</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {sessions.map(session => (
                                    <button
                                        key={session.id}
                                        onClick={() => setActiveSessionId(session.id)}
                                        className={`w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 group border ${
                                            activeSessionId === session.id
                                                ? 'bg-primary/10 border-primary/20 shadow-sm'
                                                : 'border-transparent hover:bg-muted/60 hover:border-border'
                                        }`}
                                    >
                                        <div className="flex items-start gap-2.5">
                                            <MessageSquare
                                                className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                                                    activeSessionId === session.id
                                                        ? 'text-primary'
                                                        : 'text-muted-foreground group-hover:text-foreground/70'
                                                }`}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className={`text-sm font-medium truncate ${
                                                    activeSessionId === session.id
                                                        ? 'text-primary'
                                                        : 'text-foreground/80 group-hover:text-foreground'
                                                }`}>
                                                    {session.title}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                                    {formatSessionTime(session.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>

                <main className="relative z-10 flex-1 flex flex-col overflow-hidden">

                    {/* Top bar */}
                    <div className="flex items-center justify-between px-4 py-3
                                    border-b border-border bg-white">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                aria-label="Toggle sidebar"
                            >
                                {sidebarOpen
                                    ? <PanelLeftClose className="w-5 h-5" />
                                    : <PanelLeft className="w-5 h-5" />
                                }
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="relative w-9 h-9 rounded-xl overflow-hidden
                                                bg-gradient-to-br from-peacock-soft to-indigo-50
                                                border border-peacock/20 flex items-center justify-center
                                                shadow-sm">
                                    <img src={BOT_SRC} alt="LIA" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-foreground leading-tight">Library Intelligent Assistant</h2>
                                    <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-peacock-deep">
                                        <span className="w-1.5 h-1.5 rounded-full bg-leaf" />
                                        LIA · Virtual Assistant
                                    </span>
                                </div>
                            </div>
                        </div>

                        {hasMessages && (
                            <button
                                onClick={handleNewChat}
                                className="text-sm px-3.5 py-1.5 text-muted-foreground hover:text-foreground
                                           hover:bg-muted rounded-xl transition-all flex items-center gap-1.5
                                           border border-transparent hover:border-border"
                            >
                                <Plus className="w-4 h-4" />
                                New chat
                            </button>
                        )}
                    </div>

                    {/* Body */}
                    <div className="flex-1 flex overflow-hidden
                                    bg-gradient-to-br from-peacock-soft/50 via-white to-saffron-soft/40">

                        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">

                            {!hasMessages ? (
                                <div className="min-h-full w-full flex flex-col lg:flex-row">

                                    
                                    <div className="relative flex-shrink-0 self-stretch
                                                    w-full lg:w-[clamp(300px,28vw,460px)]
                                                    h-[38vh] min-h-[260px] lg:h-auto lg:min-h-[640px]">
                                        <img
                                            src={LIA_SRC}
                                            alt="LIA — Library Intelligent Assistant"
                                            className="absolute inset-0 w-full h-full object-contain object-bottom
                                                       pt-6 lg:pt-32 select-none pointer-events-none"
                                            draggable={false}
                                        />
                                    </div>

                                
                                    <div className="flex-1 flex flex-col justify-center px-8 lg:pl-4 xl:pl-8 lg:pr-12 py-8 lg:pt-[12vh]">
                                        <h1 className="font-display text-2xl md:text-3xl font-bold mb-4 leading-snug
                                                        bg-gradient-to-r from-saffron-deep via-primary to-peacock-deep
                                                        bg-clip-text text-transparent">
                                            I&apos;m LIA — Your Library Intelligent Assistant
                                        </h1>

                                        <p className="text-muted-foreground mb-8 text-sm md:text-base leading-relaxed max-w-xl">
                                            Need help finding information, exploring resources, services
                                            or getting research support? Just ask…
                                        </p>


                                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-w-2xl">
                                            {[
                                                { icon: BookOpen, title: 'SERVICES', desc: 'Know more about library services', prompt: 'What library services do you offer?' },
                                                { icon: Headphones, title: 'SUPPORT', desc: 'Get help with your queries and issues', prompt: 'I need help with a query or issue.' },
                                                { icon: MonitorPlay, title: 'RESOURCES', desc: 'Information on e-resources, books, journals, databases…', prompt: 'What e-resources, journals and databases are available?' },
                                            ].map(({ icon: Icon, title, desc, prompt }) => (
                                                <button
                                                    key={title}
                                                    type="button"
                                                    onClick={() => handleSuggestedPrompt(prompt)}
                                                    className="text-left bg-white border border-border rounded-xl p-4
                                                               shadow-sm
                                                               hover:shadow-lg hover:-translate-y-0.5 hover:border-peacock/30 transition-all"
                                                >
                                                    <Icon className="w-6 h-6 text-peacock-deep mb-2" strokeWidth={1.75} />
                                                    <p className="text-sm font-bold text-foreground tracking-wide">{title}</p>
                                                    <p className="text-xs text-muted-foreground mt-1 leading-snug">{desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="max-w-3xl mx-auto px-4 py-6 w-full">
                                <div className="space-y-6 pb-4">
                                    {messages.map((message, index) => {
                                        const isUser = message.role === 'user';
                                        const isLastAssistant =
                                            !isUser && index === messages.length - 1 && !isLoading;

                                        return (
                                            <div
                                                key={index}
                                                className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fadeIn`}
                                            >
                                                {/* Avatar */}
                                                <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${
                                                    isUser
                                                        ? 'bg-gradient-to-br from-primary to-peacock-deep shadow-lg shadow-primary/25'
                                                        : 'bg-gradient-to-br from-peacock-soft to-indigo-50 border border-peacock/20'
                                                }`}>
                                                    {isUser
                                                        ? <User className="w-4 h-4 text-white" />
                                                        : <img src={BOT_SRC} alt="LIA" className="w-full h-full object-cover" />
                                                    }
                                                </div>

                                                {/* Bubble */}
                                                <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                                                    <div className="flex items-center gap-2 mb-1 px-1">
                                                        {isUser
                                                            ? <span className="text-xs font-semibold text-muted-foreground">You</span>
                                                            : <img src={LOGO_SRC} alt="LIA" className="h-4 w-auto object-contain" />
                                                        }
                                                        <span className="text-[10px] text-muted-foreground/70">
                                                            {formatTime(message.timestamp)}
                                                        </span>
                                                    </div>

                                                    <div className={`rounded-2xl px-4 py-3 ${
                                                        isUser
                                                            ? 'bg-gradient-to-br from-primary to-peacock-deep text-white rounded-tr-sm shadow-lg shadow-primary/25'
                                                            : 'bg-white border border-border text-foreground/90 rounded-tl-sm shadow-sm'
                                                    }`}>
                                                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                                            {message.content}
                                                        </p>
                                                    </div>

                                                    {!isUser && (
                                                        <div className="flex items-center gap-0.5 mt-2 px-1">
                                                            <button
                                                                onClick={() => handleCopy(message.content, index)}
                                                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                                                title="Copy"
                                                            >
                                                                <Copy className="w-3.5 h-3.5" />
                                                            </button>
                                                            {copiedIndex === index && (
                                                                <span className="text-[10px] text-leaf font-medium ml-1">Copied!</span>
                                                            )}
                                                            <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors" title="Good response">
                                                                <ThumbsUp className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors" title="Bad response">
                                                                <ThumbsDown className="w-3.5 h-3.5" />
                                                            </button>
                                                            {isLastAssistant && (
                                                                <button
                                                                    onClick={handleRegenerate}
                                                                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                                                    title="Regenerate"
                                                                >
                                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {isLoading && (
                                        <div className="flex gap-3 animate-fadeIn">
                                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-peacock-soft to-indigo-50 border border-peacock/20 flex items-center justify-center flex-shrink-0">
                                                <img src={BOT_SRC} alt="LIA" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 mb-1 px-1">
                                                    <img src={LOGO_SRC} alt="LIA" className="h-4 w-auto object-contain" />
                                                    <span className="text-[10px] text-muted-foreground/70">typing…</span>
                                                </div>
                                                <div className="bg-white border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-2 h-2 bg-peacock rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                        <span className="w-2 h-2 bg-peacock rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                        <span className="w-2 h-2 bg-peacock rounded-full animate-bounce" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-border bg-white">
                        <div className="max-w-3xl mx-auto px-4 py-4">
                            <form
                                onSubmit={handleSubmit}
                                className="relative flex items-end gap-2
                                           bg-white
                                           border border-input
                                           focus-within:border-primary
                                           focus-within:shadow-[0_0_0_4px_rgba(51,45,125,0.12)]
                                           rounded-2xl px-4 py-3 transition-all"
                            >
                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder="Ask LIA…"
                                    className="flex-1 resize-none bg-transparent border-0 outline-none
                                               focus:ring-0 text-sm text-foreground placeholder-muted-foreground
                                               max-h-[200px] py-1 px-1 leading-relaxed"
                                    disabled={isLoading}
                                    rows={1}
                                    onKeyDown={handleKeyDown}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !input.trim()}
                                    className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                                        isLoading || !input.trim()
                                            ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                            : 'bg-gradient-to-br from-primary to-peacock-deep text-white shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-105 active:scale-95'
                                    }`}
                                    aria-label="Send message"
                                >
                                    {isLoading
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <Send className="w-4 h-4" />
                                    }
                                </button>
                            </form>
                        </div>
                    </div>
                </main>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
            ` }} />
        </div>
    );
}