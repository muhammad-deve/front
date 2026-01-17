"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { MessageSquare, X, Send, Sparkles, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "./auth-provider"

interface ChatMessage {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
}

export function StreamlyChat() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [inputValue, setInputValue] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const { user, isAuthenticated } = useAuth()

    // Initial greeting
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                {
                    id: "welcome",
                    role: "assistant",
                    content: "Hey there! 🎬 I'm Streamly, your personal entertainment guide. Whether you're looking for a movie recommendation, want to know about a specific show, or just need help finding something great to watch tonight — I've got you covered! What are you in the mood for?",
                    timestamp: new Date(),
                },
            ])
        }
    }, [isOpen, messages.length])

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [isOpen])

    const sendMessage = useCallback(async () => {
        const message = inputValue.trim()
        if (!message || isLoading) return

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "user",
            content: message,
            timestamp: new Date(),
        }

        setMessages((prev) => [...prev, userMessage])
        setInputValue("")
        setIsLoading(true)

        try {
            const conversationHistory = messages.map((m) => ({
                role: m.role,
                content: m.content,
            }))

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message,
                    conversationHistory,
                    userId: user?.id,
                    context: {
                        watchlist: user?.watchlist || [],
                        recentlyWatched: user?.watchHistory || [],
                    },
                }),
            })

            const data = await response.json()

            if (data.error) {
                throw new Error(data.error)
            }

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.reply,
                timestamp: new Date(),
            }

            setMessages((prev) => [...prev, assistantMessage])
        } catch (error) {
            console.error("Chat error:", error)
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "Oops! I'm having a bit of trouble right now. Give me a moment and try again! 🎬",
                timestamp: new Date(),
            }
            setMessages((prev) => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }, [inputValue, isLoading, messages, user])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const handleClose = () => {
        setIsOpen(false)
    }

    return (
        <>
            {/* Floating Chat Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "fixed bottom-8 right-6 z-50 flex items-center gap-2 px-4 py-3",
                    "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground",
                    "rounded-full shadow-2xl shadow-primary/30",
                    "hover:shadow-primary/50 hover:scale-105",
                    "transition-all duration-300 group",
                    isOpen && "hidden"
                )}
                aria-label="Open Streamly AI Chat"
            >
                <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                <span className="font-semibold hidden sm:inline">Ask Streamly</span>
                <MessageSquare className="w-5 h-5 sm:hidden" />
            </button>

            {/* Chat Drawer Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={handleClose}
                />
            )}

            {/* Chat Drawer */}
            <div
                className={cn(
                    "fixed right-0 top-0 z-50 h-full w-full sm:w-[420px] md:w-[460px]",
                    "flex flex-col",
                    "bg-background/95 backdrop-blur-xl border-l border-border/50",
                    "shadow-2xl shadow-black/50",
                    "transition-transform duration-300 ease-out",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-card to-card/80">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                                <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                        </div>
                        <div>
                            <h2 className="font-bold text-foreground text-lg">Streamly AI</h2>
                            <p className="text-xs text-muted-foreground">Your entertainment guide</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                        className="text-muted-foreground hover:text-foreground hover:bg-secondary"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                    {messages.map((message, index) => (
                        <div
                            key={message.id}
                            className={cn(
                                "flex gap-3 animate-in slide-in-from-bottom-2 duration-300",
                                message.role === "user" ? "flex-row-reverse" : "flex-row"
                            )}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Avatar */}
                            {message.role === "assistant" ? (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                                    <span className="text-xs font-bold text-primary-foreground">S</span>
                                </div>
                            ) : (
								isAuthenticated ? (
									<Link
										href="/profile"
										aria-label="Open profile"
										className="flex-shrink-0"
									>
										{user?.avatar ? (
											<img
												src={user.avatar}
												alt="Profile"
												className="w-8 h-8 rounded-full object-cover"
												referrerPolicy="no-referrer"
											/>
										) : (
											<div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
												<span className="text-xs font-semibold text-foreground">
													{user?.firstName?.[0] || "U"}
												</span>
											</div>
										)}
									</Link>
								) : (
									<div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
										<span className="text-xs font-semibold text-foreground">U</span>
									</div>
								)
                            )}

                            {/* Message Bubble */}
                            <div
                                className={cn(
                                    "max-w-[80%] p-3 rounded-2xl",
                                    message.role === "assistant"
                                        ? "bg-card/80 backdrop-blur-sm border border-border/50 text-foreground rounded-tl-md"
                                        : "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-tr-md"
                                )}
                            >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                <p
                                    className={cn(
                                        "text-[10px] mt-1.5 opacity-70",
                                        message.role === "assistant" ? "text-muted-foreground" : "text-primary-foreground"
                                    )}
                                >
                                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </p>
                            </div>
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {isLoading && (
                        <div className="flex gap-3 animate-in fade-in duration-200">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                                <span className="text-xs font-bold text-primary-foreground">S</span>
                            </div>
                            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl rounded-tl-md p-3 px-4">
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions */}
                {messages.length <= 1 && !isLoading && (
                    <div className="px-4 pb-2 flex flex-wrap gap-2">
                        {[
                            "🔥 What's trending?",
                            "🎬 Recommend a movie",
                            "📺 New TV shows",
                        ].map((action) => (
                            <button
                                key={action}
                                onClick={() => {
                                    setInputValue(action)
                                    inputRef.current?.focus()
                                }}
                                className="text-xs px-3 py-1.5 rounded-full border border-border/50 bg-card/50 text-muted-foreground hover:text-foreground hover:bg-card hover:border-primary/50 transition-all duration-200"
                            >
                                {action}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t border-border/50 bg-card/50">
                    <div className="flex items-end gap-2">
                        <div className="flex-1 relative">
                            <textarea
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask Streamly anything..."
                                className={cn(
                                    "w-full resize-none rounded-xl bg-secondary border border-border/50",
                                    "px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground",
                                    "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
                                    "transition-all duration-200",
                                    "min-h-[48px] max-h-[120px]"
                                )}
                                rows={1}
                                disabled={isLoading}
                            />
                        </div>
                        <Button
                            onClick={sendMessage}
                            disabled={!inputValue.trim() || isLoading}
                            className={cn(
                                "h-12 w-12 rounded-xl",
                                "bg-gradient-to-r from-primary to-primary/80",
                                "hover:shadow-lg hover:shadow-primary/30",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                "transition-all duration-200"
                            )}
                        >
                            <Send className="w-5 h-5" />
                        </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center mt-2">
                        Press Enter to send • Shift+Enter for new line
                    </p>
                </div>
            </div>
        </>
    )
}
