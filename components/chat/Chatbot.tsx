import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactMarkdown from "react-markdown";
import {
    Send,
    X,
    GripVertical,
    ZoomIn,
    Maximize2,
    Minimize2,
    Minus,
    Sparkles,
    User,
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const CONTENT_FONT =
    "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";


const INTELLIDOC_MD_CSS = `
.intellidoc-md{font-family:${CONTENT_FONT};font-size:16px;line-height:1.6;color:inherit;}
.intellidoc-md > :first-child{margin-top:0;}
.intellidoc-md > :last-child{margin-bottom:0;}
.intellidoc-md p{margin:0 0 6px;}
.intellidoc-md strong{font-weight:700;}
.intellidoc-md em{font-style:italic;}
.intellidoc-md h1,.intellidoc-md h2,.intellidoc-md h3,.intellidoc-md h4{font-size:16px;font-weight:700;line-height:1.35;margin:12px 0 4px;}
.intellidoc-md ul,.intellidoc-md ol{margin:6px 0;padding-left:22px;}
.intellidoc-md ul{list-style:disc;}
.intellidoc-md ol{list-style:decimal;}
.intellidoc-md li{margin:3px 0;}
.intellidoc-md li::marker{color:#7c3aed;}
.intellidoc-md code{font-size:.9em;background:rgba(7,158,210,.08);padding:.1em .35em;border-radius:4px;}
.intellidoc-md a{color:inherit;text-decoration:underline;}
.intellidoc-md blockquote{border-left:3px solid #ddd6fe;padding-left:12px;margin:6px 0;}
`;


const formatAssistantContent = (text: string): string => {
    if (!text) return text;
    return text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => {
            const isHeading =
                /:$/.test(line) &&
                line.split(/\s+/).length <= 6 &&
                !line.includes("•");
            return isHeading ? `### ${line}` : line;
        })
        .join("\n\n");
};

interface Position {
    x: number;
    y: number;
}

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface ChatbotProps {
    docId?: string;
    docKey?: string;        
    windowIndex: number;
    docTitle?: string;
    author?: string;
    summary: string;
    onClose: () => void;
    error?: string | null;
}
type Size = "normal" | "large" | "full";

const sizeConfig = {
    normal: {
        width: "w-80 md:w-96",
        height: "h-[520px]",
        scrollHeight: "h-[360px]",
        minWidth: 384,
        minHeight: 520,
    },
    large: {
        width: "w-[700px] md:w-[800px]",
        height: "h-[560px]",
        scrollHeight: "h-[400px]",
        minWidth: 800,
        minHeight: 560,
    },
    full: {
        width: "w-[1000px] md:w-[1200px]",
        height: "h-[640px]",
        scrollHeight: "h-[480px]",
        minWidth: 1200,
        minHeight: 640,
    },
};

// The page header (MenuBar) is a sticky h-16 (64px) bar plus a 5px tricolour
// strip — HEADER_CLEARANCE keeps the chat window's own header (with its
// minimize/maximize/close controls) from ever landing behind it.
const HEADER_CLEARANCE = 84;
const EDGE_MARGIN = 20;
const BOTTOM_MARGIN = 60;

// Both clamps share the same shape: clamp `pos` into [floor, max], but `max`
// itself is floored too. Without that second floor, a window taller/wider
// than the available viewport (short screen height, narrow browser window,
// heavy zoom, devtools open, etc.) makes `max` go below `floor`, and
// `Math.min(Math.max(floor, pos), max)` then returns `max` — a value *less*
// than floor — silently defeating the "never go above this edge" guarantee
// and pushing the window (and its controls) off-screen. This bit every call
// site below until each `max` was floored the same way.
const clampY = (y: number, chatHeight: number, viewportHeight: number = window.innerHeight): number => {
    const maxY = Math.max(HEADER_CLEARANCE, viewportHeight - chatHeight - BOTTOM_MARGIN);
    return Math.min(Math.max(HEADER_CLEARANCE, y), maxY);
};

const clampX = (x: number, chatWidth: number, viewportWidth: number = window.innerWidth): number => {
    const maxX = Math.max(EDGE_MARGIN, viewportWidth - chatWidth - EDGE_MARGIN);
    return Math.min(Math.max(EDGE_MARGIN, x), maxX);
};

// "large" (800px min width) is the default on desktop, but doesn't fit
// comfortably on a narrower browser window/tablet-width viewport — falling
// back to "normal" there avoids opening a window wider than the screen.
const getInitialSize = (): Size => {
    if (typeof window === "undefined") return "large";
    return window.innerWidth < sizeConfig.large.minWidth + EDGE_MARGIN * 2 ? "normal" : "large";
};

export default function Chatbot({
    docId,
    docKey,                 
    docTitle,
    author,
    summary,
    onClose,
    error,
}: ChatbotProps) {
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        if (summary) {
            return [
                {
                    role: "assistant",
                    content: summary,
                    timestamp: new Date(),
                },
            ];
        }
        return [];
    });

    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [size, setSize] = useState<Size>(getInitialSize);
    const [isMinimized, setIsMinimized] = useState(false);
    const [position, setPosition] = useState<Position>(() => {
        const initialConfig = sizeConfig[getInitialSize()];
        const viewportWidth = window.innerWidth;
        const initialY = window.innerHeight - initialConfig.minHeight - 80;

        // Slots are computed from the actual viewport width and chat width
        // rather than fixed pixel offsets — on a narrow window the old fixed
        // slots (20/440/860/1280) could land a window partially or fully
        // off-screen; this always produces at least one on-screen slot.
        const slotGap = EDGE_MARGIN;
        const slotStride = initialConfig.minWidth + slotGap;
        const slotCount = Math.max(1, Math.min(4, Math.floor((viewportWidth - slotGap) / slotStride)));
        const slotPositions = Array.from({ length: slotCount }, (_, i) => slotGap + i * slotStride);

        const existingChats = Array.from(
            globalThis.document.querySelectorAll(".chatbox-window")
        );

        const occupiedSlots = existingChats.map((chat) => {
            const left = window.getComputedStyle(chat).left;
            return parseInt(left, 10);
        });

        const freeSlot =
            slotPositions.find((slot) => !occupiedSlots.includes(slot)) ?? slotPositions[0];

        return {
            x: clampX(freeSlot, initialConfig.minWidth, viewportWidth),
            y: clampY(initialY, initialConfig.minHeight),
        };
    });

    const scrollRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const dragArmed = useRef(false);
    const dragStart = useRef<Position>({ x: 0, y: 0 });
    const dragOffset = useRef<Position>({ x: 0, y: 0 });
    const [isDraggingState, setIsDraggingState] = useState(false);
    const DRAG_THRESHOLD = 4;

    useEffect(() => {
        if (typeof window === "undefined") return;
        const d = globalThis.document;
        if (d.getElementById("intellidoc-md-styles")) return;
        const styleEl = d.createElement("style");
        styleEl.id = "intellidoc-md-styles";
        styleEl.textContent = INTELLIDOC_MD_CSS;
        d.head.appendChild(styleEl);
    }, []);

    useEffect(() => {
        if (summary) {
            setMessages((prev) => {
                if (prev.length === 0 || prev[0].content !== summary) {
                    return [
                        {
                            role: "assistant",
                            content: summary,
                            timestamp: new Date(),
                        },
                        ...prev,
                    ];
                }
                return prev;
            });
        }
    }, [summary]);

    const handleSizeChange = useCallback((newSize: Size) => {
        const newConfig = sizeConfig[newSize];
        setPosition((prev) => ({
            x: clampX(prev.x, newConfig.minWidth),
            y: clampY(prev.y, newConfig.minHeight),
        }));
        setSize(newSize);
    }, []);

    const toggleSize = useCallback(() => {
        const sizeOrder: Size[] = ["normal", "large", "full"];
        const currentIndex = sizeOrder.indexOf(size);
        const nextSize = sizeOrder[(currentIndex + 1) % sizeOrder.length];
        handleSizeChange(nextSize);
    }, [size, handleSizeChange]);

    useEffect(() => {
        const handleResize = () => {
            const currentConfig = sizeConfig[size];
            setPosition((prev) => ({
                x: clampX(prev.x, currentConfig.minWidth),
                y: clampY(prev.y, currentConfig.minHeight),
            }));
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [size]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const hasUserMessage = messages.some((m) => m.role === "user");
        el.scrollTop = hasUserMessage ? el.scrollHeight : 0;
    }, [messages]);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest("button, a, input, textarea, select")) return;

            e.preventDefault();
            dragArmed.current = true;
            dragStart.current = { x: e.clientX, y: e.clientY };
            dragOffset.current = {
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            };
        },
        [position]
    );

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!dragArmed.current) return;
            e.preventDefault();

            if (!isDragging.current) {
                const moved = Math.hypot(
                    e.clientX - dragStart.current.x,
                    e.clientY - dragStart.current.y
                );
                if (moved < DRAG_THRESHOLD) return;
                isDragging.current = true;
                setIsDraggingState(true);
            }

            const currentConfig = sizeConfig[size];
            const newX = clampX(e.clientX - dragOffset.current.x, currentConfig.minWidth);
            const newY = clampY(e.clientY - dragOffset.current.y, currentConfig.minHeight);

            setPosition({ x: newX, y: newY });
        },
        [size]
    );

    const handleMouseUp = useCallback(() => {
        dragArmed.current = false;
        if (isDragging.current) {
            isDragging.current = false;
            setIsDraggingState(false);
        }
    }, []);

    useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    // Chat handlers
    const sendMessage = async (content: string) => {
        if (!content.trim()) return;

        const userMessage: ChatMessage = {
            role: "user",
            content,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: "POST",
                headers: {
                    accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: content,
                    doc_reference_id: docId?.toString() || "",
                    session_id: "default",
                }),
            });
            if (!response.ok) throw new Error("Failed to fetch response");

            const data = await response.json();
            if (!data.answer) {
                throw new Error("Invalid response format");
            }

            const assistantMessage: ChatMessage = {
                role: "assistant",
                content: data.answer,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage: ChatMessage = {
                role: "assistant",
                content:
                    "Sorry, I encountered an error processing your request.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;
        const messageToSend = inputValue;
        setInputValue("");
        await sendMessage(messageToSend);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div
            data-doc-key={docKey}
            className={`chatbox-window fixed z-50 ${isMinimized ? "w-80 h-auto" : `${sizeConfig[size].width} ${sizeConfig[size].height}`}
                        bg-white border border-slate-200 rounded-2xl overflow-hidden
                        shadow-[0_1px_0_rgba(13,20,36,0.02),0_16px_36px_-16px_rgba(13,20,36,0.18)]
                        flex flex-col
                        ${isDraggingState ? "select-none" : "transition-all duration-300"}`}
            style={{
                top: `${position.y}px`,
                left: `${position.x}px`,
                cursor: isDraggingState ? "grabbing" : "grab",
            }}
        >
            {/* Violet color rail — matches IntelliDoc button identity */}
            <div
                className="absolute left-0 top-0 bottom-0 w-[3px] bg-sky-500"
                aria-hidden
            />

            {/* ============ HEADER ============ */}
            <div
                className="flex items-center justify-between px-5 py-4
                           bg-gradient-to-b from-sky-50/70 to-transparent
                           border-b border-slate-200 flex-shrink-0"
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <GripVertical className="h-4 w-4 text-slate-400 flex-shrink-0" />

                    <div className="min-w-0 flex-1">
                        {/* Micro-label */}
                        <div className="flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3 text-sky-600" />
                            <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-sky-700">
                                IntelliDoc
                            </span>
                        </div>

                        {/* Title — normal system font */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <h3 className="text-[15px] leading-tight font-semibold text-slate-900 truncate mt-0.5">
                                        {docTitle ? docTitle : "Global Chat"}
                                    </h3>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-normal">
                                        {docTitle ? docTitle : "Global Chat"}
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {author && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <p className="text-[12px] text-slate-500 truncate mt-0.5">
                                            <span className="text-[10px] tracking-[0.06em] uppercase text-slate-400 mr-1.5">
                                                Author
                                            </span>
                                            {author}
                                        </p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="font-normal">{author}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setIsMinimized((prev) => !prev)}
                                    className="cursor-pointer p-1.5 hover:bg-sky-100 rounded-md
                                               text-slate-500 hover:text-sky-700 transition-colors"
                                >
                                    <Minus className="h-3.5 w-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{isMinimized ? "Restore" : "Minimize"}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => {
                                        setIsMinimized(false);
                                        toggleSize();
                                    }}
                                    className="cursor-pointer p-1.5 hover:bg-sky-100 rounded-md
                                               text-slate-500 hover:text-sky-700 transition-colors"
                                >
                                    {size === "normal" ? (
                                        <Maximize2 className="h-3.5 w-3.5" />
                                    ) : size === "large" ? (
                                        <ZoomIn className="h-3.5 w-3.5" />
                                    ) : (
                                        <Minimize2 className="h-3.5 w-3.5" />
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    {size === "normal"
                                        ? "Enlarge"
                                        : size === "large"
                                        ? "Maximize"
                                        : "Shrink to normal"}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <button
                        onClick={onClose}
                        className="cursor-pointer p-1.5 hover:bg-red-50 rounded-md
                                   text-slate-500 hover:text-red-600 transition-colors"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {!isMinimized && (
            <>
            {/* ============ DISCLAIMER ============ */}
            <div className="px-5 py-2 text-[11px] leading-snug text-amber-800 bg-amber-50 border-b border-amber-200">
                This is an AI-generated summary for quick understanding, it may not include every
                detail. Please refer to the original document for complete information.
            </div>

            {/* ============ MESSAGES ============ */}
            <div
                className={`overflow-y-auto px-5 py-4 ${sizeConfig[size].scrollHeight} bg-slate-50/30 flex-1`}
                ref={scrollRef}
            >
                <div className="space-y-3">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center text-center h-full min-h-[280px] px-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-100 to-orange-100 flex items-center justify-center mb-3">
                                <Sparkles className="h-5 w-5 text-sky-600" />
                            </div>
                            <span className="text-[10px] tracking-[0.12em] uppercase text-slate-400 mb-2">
                                Ready to assist
                            </span>
                            <p className="text-[14px] text-slate-500 max-w-xs leading-relaxed">
                                Summaries are disabled for Ebooks. You can still
                                interact with the document by asking questions.
                            </p>
                        </div>
                    )}

                    {messages.map((message, index) => {
                        const isUser = message.role === "user";
                        return (
                            <div
                                key={index}
                                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[88%] flex flex-col gap-1.5 ${
                                        isUser ? "items-end" : "items-start"
                                    }`}
                                >
                                    {/* Role label */}
                                    <div
                                        className={`flex items-center gap-1.5 px-1 ${
                                            isUser ? "flex-row-reverse" : "flex-row"
                                        }`}
                                    >
                                        {isUser ? (
                                            <User className="h-3 w-3 text-slate-400" />
                                        ) : (
                                            <Sparkles className="h-3 w-3 text-sky-600" />
                                        )}
                                        <span
                                            className={`text-[10px] font-bold tracking-[0.1em] uppercase ${
                                                isUser
                                                    ? "text-slate-400"
                                                    : "text-sky-700"
                                            }`}
                                        >
                                            {isUser ? "You" : "IntelliDoc"}
                                        </span>
                                    </div>

                                    {/* Message bubble — readable normal font */}
                                    <div
                                        className={`rounded-2xl px-4 py-3 ${
                                            isUser
                                                ? "bg-sky-600 text-white rounded-tr-sm shadow-[0_4px_12px_-4px_rgba(7,158,210,0.35)]"
                                                : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-[0_1px_0_rgba(13,20,36,0.02)]"
                                        }`}
                                    >
                                        <div
                                            className="intellidoc-md"
                                        >
                                            <ReactMarkdown>
                                                {isUser
                                                    ? message.content
                                                    : formatAssistantContent(
                                                          message.content
                                                      )}
                                            </ReactMarkdown>
                                        </div>
                                    </div>

                                    {/* Timestamp */}
                                    <span
                                        className={`text-[10px] tracking-[0.04em] uppercase text-slate-400 px-1 ${
                                            isUser ? "text-right" : "text-left"
                                        }`}
                                    >
                                        {message.timestamp.toLocaleTimeString(
                                            [],
                                            { hour: "2-digit", minute: "2-digit" }
                                        )}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="flex items-center gap-3 bg-gradient-to-r from-sky-50 to-orange-50 border border-sky-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                                <div className="flex gap-1.5">
                                    <span className="w-2.5 h-2.5 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-2.5 h-2.5 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-2.5 h-2.5 bg-sky-500 rounded-full animate-bounce" />
                                </div>
                                <span className="text-[13px] font-medium text-sky-700">
                                    IntelliDoc is thinking…
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ============ INPUT ============ */}
            <div className="px-5 py-3.5 border-t border-slate-200 bg-white flex-shrink-0">
                <div
                    className="flex gap-2 items-center rounded-xl border border-slate-300 bg-white px-3 py-1.5
                               focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100
                               transition-all duration-200"
                >
                    <input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Deep dive into docs…"
                        className="flex-1 border-0 bg-transparent p-1.5 text-[14px] text-slate-800
                                   placeholder:text-slate-400
                                   focus:outline-none focus:ring-0"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading || !inputValue.trim()}
                        className="h-8 w-8 p-0 flex items-center justify-center
                                   bg-gradient-to-br from-sky-600 to-orange-600 text-white
                                   rounded-lg
                                   hover:shadow-[0_4px_12px_-2px_rgba(7,158,210,0.45)]
                                   disabled:opacity-40 disabled:cursor-not-allowed
                                   disabled:bg-slate-200 disabled:bg-none disabled:text-slate-400
                                   transition-all duration-200"
                    >
                        <Send className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
            </>
            )}
        </div>
    );
}