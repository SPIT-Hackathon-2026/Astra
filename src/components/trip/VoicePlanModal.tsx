'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, X, Send, Loader, Sparkles, AlertCircle, CheckCircle2, Volume2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface VoicePlanModalProps {
    onClose: () => void;
    onSuccess?: () => void;
}

export const VoicePlanModal = ({ onClose, onSuccess }: VoicePlanModalProps) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                const current = event.resultIndex;
                const result = event.results[current];
                const text = result[0].transcript;
                setTranscript(text);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech Recognition Error:', event.error);
                setIsListening(false);
                if (event.error === 'not-allowed') {
                    setError('Microphone access denied. Please type your request.');
                } else {
                    setError('Speech recognition failed. Please try typing.');
                }
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            setError('');
            setTranscript('');
            try {
                recognitionRef.current?.start();
                setIsListening(true);
            } catch (e) {
                setError('Could not start microphone. Please type instead.');
            }
        }
    };

    const handleCreatePlan = async () => {
        if (!transcript.trim()) return;

        setIsLoading(true);
        setError('');

        try {
            // 1. Parse Voice
            const parseRes = await fetch('/api/trips/parse-voice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript }),
            });

            const parseData = await parseRes.json();
            if (!parseRes.ok) throw new Error(parseData.error || 'Failed to parse request');

            // 2. Create Plan
            const planRes = await fetch('/api/trips/plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parseData.parsed),
            });

            const planData = await planRes.json();
            if (!planRes.ok) throw new Error(planData.error || 'Failed to create trip');

            setSuccess(true);
            if (onSuccess) onSuccess();

            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Something went wrong');
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-rs-deep-brown/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <Card className="w-full max-w-lg bg-white relative overflow-hidden rounded-3xl shadow-2xl">
                {/* Progress header */}
                <div className={`h-1.5 w-full ${isLoading ? 'bg-rs-sand' : 'bg-transparent'}`}>
                    {isLoading && (
                        <div className="h-full bg-rs-terracotta animate-[progress_2s_ease-in-out_infinite]" style={{ width: '40%' }} />
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-rs-sand rounded-full transition-colors z-10"
                >
                    <X className="h-5 w-5 text-rs-desert-brown" />
                </button>

                <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-rs-terracotta/10 rounded-2xl">
                            <Mic className={`h-6 w-6 text-rs-terracotta ${isListening ? 'animate-pulse' : ''}`} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-rs-deep-brown">Voice Trip Planner</h2>
                            <p className="text-rs-desert-brown text-sm">Tell Astra where you want to go</p>
                        </div>
                    </div>

                    {!success ? (
                        <div className="space-y-6">
                            <div
                                className={`relative min-h-[120px] p-4 rounded-2xl border-2 transition-all ${isListening ? 'border-rs-terracotta bg-rs-terracotta/5 ring-4 ring-rs-terracotta/10' : 'border-rs-sand-dark bg-rs-sand/10'
                                    }`}
                            >
                                <textarea
                                    className="w-full h-full bg-transparent border-none outline-none resize-none text-rs-deep-brown font-medium placeholder:text-rs-desert-brown/50"
                                    placeholder='Try: "I want to visit Goa from Mumbai for three days starting tomorrow with 2 people and a budget of 20k"'
                                    value={transcript}
                                    onChange={(e) => setTranscript(e.target.value)}
                                />

                                {isListening && (
                                    <div className="absolute bottom-4 right-4 flex gap-1 items-center">
                                        <div className="w-1 h-3 bg-rs-terracotta animate-[bounce_1s_infinite]" />
                                        <div className="w-1 h-5 bg-rs-terracotta animate-[bounce_1s_infinite_200ms]" />
                                        <div className="w-1 h-4 bg-rs-terracotta animate-[bounce_1s_infinite_400ms]" />
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={toggleListening}
                                    variant={isListening ? 'primary' : 'outline'}
                                    className={`w-full py-6 rounded-2xl text-lg font-bold transition-all ${isListening ? 'bg-rs-deep-brown hover:bg-rs-deep-brown/90 shadow-lg' : 'border-rs-terracotta text-rs-terracotta hover:bg-rs-terracotta/5'
                                        }`}
                                >
                                    {isListening ? (
                                        <><Volume2 className="mr-2 h-5 w-5" /> Stop Listening</>
                                    ) : (
                                        <><Mic className="mr-2 h-5 w-5" /> Start Speaking</>
                                    )}
                                </Button>

                                <Button
                                    onClick={handleCreatePlan}
                                    disabled={!transcript.trim() || isLoading}
                                    className="w-full py-6 rounded-2xl bg-gradient-to-r from-rs-terracotta to-rs-sunset-orange text-white font-bold text-lg shadow-xl shadow-rs-terracotta/20 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <><Loader className="animate-spin mr-2 h-5 w-5" /> Astra is Thinking...</>
                                    ) : (
                                        <><Sparkles className="mr-2 h-5 w-5" /> Create Premium Plan</>
                                    )}
                                </Button>
                            </div>

                            <p className="text-center text-[10px] text-rs-desert-brown uppercase tracking-widest font-black opacity-40">
                                Powered by Astra Research Engine
                            </p>
                        </div>
                    ) : (
                        <div className="py-12 text-center animate-in fade-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-rs-deep-brown mb-2">Itinerary Synchronized!</h3>
                            <p className="text-rs-desert-brown">Your premium route has been created successfully.</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};
