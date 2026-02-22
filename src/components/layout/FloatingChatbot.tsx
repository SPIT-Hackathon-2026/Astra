'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Minus, MessageCircle, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const FloatingChatbot = () => {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "🗺️ Welcome traveler! 🎒 Let's embark on an adventure together. Where shall we begin, and where would you like to go? 🌍" }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [tripData, setTripData] = useState<any>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isLoading]);

    useEffect(() => {
        if (isOpen && !isMinimized) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen, isMinimized]);

    const handleSendMessage = async (e?: React.FormEvent, customMesaage?: string) => {
        e?.preventDefault();
        const messageToSend = customMesaage || input;
        if (!messageToSend.trim() || isLoading) return;

        const userMessage = { role: 'user', content: messageToSend };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: messageToSend, history: messages }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            setMessages(prev => [...prev, { role: 'assistant', content: data.response || data.reply }]);
            if (data.tripData) setTripData(data.tripData);

            if (data.triggerPlan) {
                const isShort = data.isShortTrip;
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: isShort
                        ? "🚗 Since it's a quick trip, I'm taking you to our Short-Trip Express Planner!"
                        : "🪄 Perfect! I've synchronized your details. Redirecting you to the final planning dashboard now..."
                }]);

                setTimeout(() => {
                    if (isShort) {
                        router.push('/plan?plan=true');
                    } else {
                        router.push('/dashboard?plan=true');
                    }
                    setIsOpen(false);
                }, 2000);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting to my brain right now. Please try again later!" }]);
        } finally {
            setIsLoading(false);
        }
    };

    const getProgress = () => {
        if (!tripData) return 0;
        const fields = ['source', 'destination', 'startDate', 'endDate', 'budget', 'travelers', 'budgetType', 'travelerContacts', 'interests'];
        const filled = fields.filter(f => {
            if (f === 'interests') return tripData.interests?.length > 0;
            return tripData[f] !== null && tripData[f] !== undefined && tripData[f] !== '';
        });
        return Math.round((filled.length / fields.length) * 100);
    };

    const quickChips = [
        { label: '🏖️ Beach', value: 'I love beaches!' },
        { label: '🏔️ Mountains', value: 'I want to go to the mountains' },
        { label: '🏛️ History', value: 'I like historical places' },
        { label: '🍱 Foodie', value: 'Show me the best food spots' },
    ];

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 45 }}
                        onClick={() => setIsOpen(true)}
                        className="w-16 h-16 rounded-full bg-gradient-to-br from-rs-terracotta to-rs-sunset-orange shadow-lg shadow-rs-terracotta/40 flex items-center justify-center text-white hover:scale-110 transition-transform group relative"
                    >
                        <Bot className="h-8 w-8 group-hover:hidden" />
                        <MessageCircle className="h-8 w-8 hidden group-hover:block" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-rs-neon-teal rounded-full animate-ping" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-rs-neon-teal rounded-full border-2 border-white" />
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className={`w-[350px] sm:w-[400px] ${isMinimized ? 'h-16' : 'h-[600px]'} transition-all`}
                    >
                        <Card className="h-full flex flex-col shadow-2xl border-rs-terracotta/20 bg-white/95 backdrop-blur-md overflow-hidden rounded-3xl">
                            {/* Header */}
                            <div className="p-4 bg-gradient-to-r from-rs-terracotta to-rs-sunset-orange text-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                        <Sparkles className="h-5 w-5 text-yellow-200" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm tracking-wide">Astra Concierge</h3>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rs-neon-teal animate-pulse" />
                                            <span className="text-[10px] text-white/80 font-bold uppercase tracking-tighter">Live Assistance</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 hover:bg-white/10 rounded-md transition-colors">
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-md transition-colors">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {!isMinimized && (
                                <>
                                    {/* Progress Bar */}
                                    <div className="h-1 w-full bg-rs-sand/30 overflow-hidden">
                                        <motion.div
                                            className="h-full bg-rs-neon-teal"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${getProgress()}%` }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-rs-sand/5 custom-scrollbar" ref={scrollRef}>
                                        {messages.map((msg, i) => (
                                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                                                {msg.role === 'assistant' && (
                                                    <div className="w-8 h-8 rounded-full bg-rs-terracotta/10 flex items-center justify-center p-1.5 shrink-0 border border-rs-terracotta/20">
                                                        <Bot className="h-full w-full text-rs-terracotta" />
                                                    </div>
                                                )}
                                                <div className={`max-w-[80%] p-3.5 rounded-2xl text-[14px] leading-relaxed shadow-sm whitespace-pre-wrap ${msg.role === 'user'
                                                    ? 'bg-rs-terracotta text-white rounded-br-none font-medium'
                                                    : 'bg-white text-rs-deep-brown border border-rs-sand-dark rounded-bl-none'
                                                    }`}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ))}
                                        {isLoading && (
                                            <div className="flex justify-start gap-2">
                                                <div className="w-8 h-8 rounded-full bg-rs-terracotta/10 flex items-center justify-center p-1.5 shrink-0 animate-pulse">
                                                    <Bot className="h-full w-full text-rs-terracotta/40" />
                                                </div>
                                                <div className="bg-rs-sand/20 p-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                                                    <div className="w-2 h-2 bg-rs-terracotta/30 rounded-full animate-bounce" />
                                                    <div className="w-2 h-2 bg-rs-terracotta/30 rounded-full animate-bounce [animation-delay:0.2s]" />
                                                    <div className="w-2 h-2 bg-rs-terracotta/30 rounded-full animate-bounce [animation-delay:0.4s]" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer / Input Area */}
                                    <div className="p-4 bg-white border-t border-rs-sand-dark space-y-3">
                                        {/* Quick Chips */}
                                        {!isLoading && messages.length < 10 && (
                                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                                {quickChips.map((chip, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleSendMessage(undefined, chip.value)}
                                                        className="whitespace-nowrap px-3 py-1.5 bg-rs-sand/40 hover:bg-rs-terracotta/10 border border-rs-sand-dark hover:border-rs-terracotta/30 rounded-full text-[11px] font-bold text-rs-deep-brown transition-all"
                                                    >
                                                        {chip.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        <form onSubmit={handleSendMessage} className="relative">
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                placeholder="Ask Astra anything..."
                                                className="w-full px-4 py-3.5 bg-rs-sand/20 border border-rs-sand-dark rounded-2xl text-[14px] focus:outline-none focus:ring-2 focus:ring-rs-terracotta/20 pr-12 text-rs-deep-brown font-medium placeholder:text-rs-deep-brown/40 transition-all"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!input.trim() || isLoading}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-rs-terracotta text-white rounded-xl shadow-md shadow-rs-terracotta/20 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                                            >
                                                <Send className="h-4 w-4" />
                                            </button>
                                        </form>
                                        <div className="flex items-center justify-between px-1">
                                            <p className="text-[10px] text-rs-desert-brown font-bold uppercase tracking-widest opacity-60">
                                                Premium Travel AI
                                            </p>
                                            <div className="text-[10px] text-rs-neon-teal font-black uppercase tracking-widest">
                                                {getProgress()}% Ready
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
