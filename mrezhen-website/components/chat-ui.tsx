"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { jsonrepair } from 'jsonrepair';
import ReactMarkdown from 'react-markdown';
import { Send, User, Bot, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils"; 
import { analyzeAgentAction } from '@/app/actions/ai-chat'; 
import { RoadmapProposal } from '@/components/roadmap-proposal';
import { useTranslations } from "next-intl";
import { getAiChatMessages, saveAiChatMessage } from "@/app/actions/ai-chat-sessions";

type ChatMessage = {
    sender: 'user' | 'ai' | 'system';
    text: string;
    isStreaming?: boolean;
    proposalData?: any; 
};

export default function ChatUI({ userId, sessionId, onTitleUpdate }: { userId: string; sessionId: string | null; onTitleUpdate?: (sessionId: string, title: string) => void }) {
    const t = useTranslations("aiChat")
    const tCommon = useTranslations("common")
    const [message, setMessage] = useState<string>('');
    const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const rawAiResponseRef = useRef<string>("");
    const currentSessionRef = useRef<string | null>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatLog]);

    // Load history when session changes
    useEffect(() => {
        if (!sessionId) {
            setChatLog([]);
            currentSessionRef.current = null;
            return;
        }
        if (sessionId === currentSessionRef.current) return;
        currentSessionRef.current = sessionId;
        
        let cancelled = false;
        setIsLoadingHistory(true);
        setChatLog([]);
        
        getAiChatMessages(sessionId).then((msgs) => {
            if (cancelled) return;
            const loaded: ChatMessage[] = msgs.map((m) => ({
                sender: m.role as 'user' | 'ai' | 'system',
                text: m.content,
                proposalData: m.metadata ? (() => { try { return JSON.parse(m.metadata) } catch { return undefined } })() : undefined,
            }));
            setChatLog(loaded);
            setIsLoadingHistory(false);
        }).catch(() => {
            if (!cancelled) setIsLoadingHistory(false);
        });
        
        return () => { cancelled = true };
    }, [sessionId]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isLoading || !sessionId) return;

        const userMessage: ChatMessage = { sender: 'user', text: message };
        const aiMessagePlaceholder: ChatMessage = { sender: 'ai', text: '', isStreaming: true };
        
        setChatLog(prev => [...prev, userMessage, aiMessagePlaceholder]);
        const currentInput = message;
        setMessage('');
        setIsLoading(true);
        rawAiResponseRef.current = "";

        // Save user message to DB
        if (sessionId) {
            saveAiChatMessage(sessionId, "user", currentInput).then((res) => {
                // If title was auto-generated, notify parent to refresh sidebar
                if (res && 'data' in res && onTitleUpdate) {
                    // Fetch updated session title
                    import("@/app/actions/ai-chat-sessions").then(({ getAiChatSessions }) => {
                        getAiChatSessions().then((sessions) => {
                            const updated = sessions.find((s) => s.id === sessionId);
                            if (updated && updated.title !== "New Chat") {
                                onTitleUpdate(sessionId, updated.title);
                            }
                        });
                    });
                }
            }).catch(() => {});
        }

        try {
            const streamIterator = await analyzeAgentAction(userId, currentInput);

            for await (const chunk of streamIterator) {
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataContent = line.replace('data: ', '').trim();

                        if (dataContent === '[DONE]') {
                            setIsLoading(false);
                            setChatLog(prev => {
                                const newLog = [...prev];
                                const lastMsg = newLog[newLog.length - 1];
                                if (lastMsg) lastMsg.isStreaming = false;
                                
                                // Save final AI message to DB
                                if (sessionId && lastMsg?.text) {
                                    const metadata = lastMsg.proposalData ? JSON.stringify(lastMsg.proposalData) : undefined;
                                    saveAiChatMessage(sessionId, "ai", lastMsg.text, metadata).catch(() => {});
                                }
                                
                                return newLog;
                            });
                            break;
                        }

                        try {
                            const parsedChunk = JSON.parse(dataContent);
                            
                            if (parsedChunk.chunk) {
                                rawAiResponseRef.current += parsedChunk.chunk;
                                try {
                                    const repairedJson = JSON.parse(jsonrepair(rawAiResponseRef.current));
                                    
                                    setChatLog(prev => {
                                        const newLog = [...prev];
                                        const aiIndex = newLog.length - 1;
                                        if (newLog[aiIndex]) {
                                            if (repairedJson.message) {
                                                newLog[aiIndex].text = repairedJson.message;
                                            }
                                            if (repairedJson.milestones && repairedJson.milestones.length > 0) {
                                                newLog[aiIndex].proposalData = repairedJson;
                                            }
                                        }
                                        return newLog;
                                    });
                                } catch (e) { /* Buffer incomplete */ }
                            } else if (parsedChunk.error) {
                                setChatLog(prev => [...prev, { sender: 'system', text: `Error: ${parsedChunk.error}` }]);
                            }
                        } catch (e) {
                            console.error("Error parsing chunk", e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Action error:', error);
            setChatLog(prev => {
                const newLog = [...prev];
                if (newLog[newLog.length - 1]?.sender === 'ai') {
                    newLog[newLog.length - 1].isStreaming = false;
                }
                return [...newLog, { sender: 'system', text: t('connectionFailed') }];
            });
            setIsLoading(false);
        }
    }, [message, isLoading, userId, sessionId]);

    return (
        <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto border border-border rounded-xl bg-card shadow-sm overflow-hidden">
            <div className="bg-muted border-b border-border p-4 flex items-center gap-2">
                <div className="bg-purple-100 p-2 rounded-lg">
                    <Bot className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">{t("analystTitle")}</h3>
                    <p className="text-xs text-muted-foreground">{t("liveContext")}</p>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-muted/50">
                {!sessionId && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                        <Bot className="w-12 h-12 mb-4 opacity-20" />
                        <p>{t("selectOrCreate")}</p>
                    </div>
                )}

                {sessionId && isLoadingHistory && (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                )}

                {sessionId && !isLoadingHistory && chatLog.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                        <Bot className="w-12 h-12 mb-4 opacity-20" />
                        <p>{t("emptyState")}</p>
                    </div>
                )}
                
                {chatLog.map((msg, index) => (
                    <div key={index} className={cn("flex flex-col gap-2", msg.sender === 'user' ? "items-end" : "items-start")}>
                        <div className={cn("flex gap-3 max-w-[90%]", msg.sender === 'user' ? "flex-row-reverse" : "flex-row")}>
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                msg.sender === 'user' ? "bg-blue-100 text-blue-600" : 
                                msg.sender === 'ai' ? "bg-purple-100 text-purple-600" : "bg-red-100 text-red-600"
                            )}>
                                {msg.sender === 'user' ? <User className="w-4 h-4" /> : 
                                 msg.sender === 'ai' ? <Bot className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            </div>

                            <div className={cn(
                                "rounded-2xl px-4 py-3 text-sm shadow-sm",
                                msg.sender === 'user' ? "bg-blue-600 text-white rounded-tr-none" : 
                                msg.sender === 'system' ? "bg-red-50 text-red-800 border border-red-100" :
                                "bg-card border border-border text-foreground rounded-tl-none"
                            )}>
                                <div className="leading-relaxed">
                                    <ReactMarkdown
                                        components={{
                                            // Override basic elements to match Tailwind styles
                                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                            ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                                            ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                                            li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                            strong: ({node, ...props}) => <span className="font-bold" {...props} />,
                                        }}
                                    >
                                        {msg.text}
                                    </ReactMarkdown>
                                </div>

                                {msg.isStreaming && (
                                    <div className="mt-2 flex items-center gap-1 text-muted-foreground">
                                        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {msg.sender === 'ai' && msg.proposalData && !msg.isStreaming && (
                            <div className="w-full max-w-[90%] pl-11">
                                <RoadmapProposal data={msg.proposalData} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            <div className="p-4 bg-card border-t border-border">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input 
                        className="flex-1 px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm"
                        type="text" 
                        value={message} 
                        onChange={(e) => setMessage(e.target.value)} 
                        placeholder={t("typePlaceholder")}
                        disabled={isLoading}
                    />
                    <button 
                        type="submit" 
                        className="px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 disabled:opacity-50 transition-colors flex items-center gap-2"
                        disabled={isLoading || !message.trim() || !sessionId}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span className="hidden sm:inline">{tCommon("send")}</span>
                    </button>
                </form>
            </div>
        </div>
    );
}