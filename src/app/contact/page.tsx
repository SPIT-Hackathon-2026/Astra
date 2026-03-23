'use client';

import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Luckiest_Guy } from 'next/font/google';
import { Mail, MapPin, Phone, Send, MessageCircle, Twitter, Instagram, Github, ArrowRight, Zap, Navigation, Clock } from 'lucide-react';
import { useState } from 'react';

const luckiestGuy = Luckiest_Guy({
    weight: '400',
    subsets: ['latin'],
});

export default function ContactPage() {
    const [formData, setFormData] = useState({ name: '', email: '', subject: 'Support', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
            // Reset after success
            setTimeout(() => { setIsSuccess(false); setFormData({ name: '', email: '', subject: 'Support', message: '' }); }, 3000);
        }, 1500);
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#FDF6ED]">
            <Navbar />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="py-24 px-6 relative overflow-hidden text-center">
                    <div className="max-w-4xl mx-auto z-10 relative">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rs-terracotta/10 text-rs-terracotta text-[11px] font-black tracking-widest mb-6 uppercase">
                            <MessageCircle className="h-4 w-4" /> Reach the Tribe
                        </div>
                        <h1 className={`${luckiestGuy.className} text-5xl md:text-7xl mb-8 uppercase leading-tight text-[#3D2B1F]`}>
                            Let's <span className="text-rs-terracotta">Connect</span>.
                        </h1>
                        <p className="text-lg opacity-70 max-w-2xl mx-auto leading-relaxed" style={{ color: '#8B6D47' }}>
                            Got a custom route request? Partnering with us? Or just lost on the digital highroad? We're here to guide you.
                        </p>
                    </div>

                    {/* Background floating icons */}
                    <div className="absolute top-1/2 left-1/4 -translate-y-1/2 opacity-[0.03] scale-150 animate-pulse pointer-events-none">
                        <Navigation className="w-[300px] h-[300px] rotate-45" />
                    </div>
                </section>

                {/* Contact Grid */}
                <section className="py-12 px-6 max-w-7xl mx-auto mb-24">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border-2 border-rs-sand-dark/15 overflow-hidden relative">

                        {/* Information Slot (Left) */}
                        <div className="lg:col-span-5 bg-[#3D2B1F] rounded-[2.5rem] p-10 text-white relative transition-transform hover:-translate-x-1 duration-500 overflow-hidden">
                            {/* Pattern Overlay */}
                            <div className="absolute inset-0 opacity-[0.05] pointer-events-none select-none">
                                <svg viewBox="0 0 100 100" className="w-full h-full"><pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="white" /></pattern><rect width="100%" height="100%" fill="url(#dots)" /></svg>
                            </div>

                            <h2 className={`${luckiestGuy.className} text-3xl mb-12 uppercase leading-tight`}>Route <span className="text-rs-terracotta underline decoration-2 underline-offset-8 decoration-white/20">Stations</span></h2>

                            <div className="space-y-10 relative z-10">
                                <div className="flex gap-6 group cursor-pointer">
                                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-rs-terracotta transition-all duration-300">
                                        <Mail className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-[#DFC9AD] mb-1">Email Our Dispatch</p>
                                        <p className="text-lg font-bold">hello@radiatorroutes.travel</p>
                                    </div>
                                </div>

                                <div className="flex gap-6 group cursor-pointer">
                                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-rs-terracotta transition-all duration-300">
                                        <MapPin className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-[#DFC9AD] mb-1">Our Main Hub</p>
                                        <p className="text-lg font-bold">Station 66, Radiator Springs,<br />Route 66, Arizona, USA</p>
                                    </div>
                                </div>

                                <div className="flex gap-6 group cursor-pointer">
                                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-rs-terracotta transition-all duration-300">
                                        <Clock className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-[#DFC9AD] mb-1">Working Hours</p>
                                        <p className="text-lg font-bold">Mon – Fri: From Sun up to Sunset</p>
                                        <p className="text-xs opacity-60 mt-1 italic">Weekends: We're out driving.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Socials Bottom */}
                            <div className="mt-20 pt-10 border-t border-white/10 flex items-center gap-4 relative z-10">
                                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-rs-terracotta transition-all"><Twitter className="h-4 w-4" /></a>
                                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-rs-terracotta transition-all"><Instagram className="h-4 w-4" /></a>
                                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-rs-terracotta transition-all"><Github className="h-4 w-4" /></a>
                            </div>
                        </div>

                        {/* Form Slot (Right) */}
                        <div className="lg:col-span-7 py-4">
                            <form onSubmit={handleSubmit} className="space-y-8 h-full flex flex-col">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-widest text-rs-deep-brown" style={{ opacity: 0.6 }}>Highroad Name</label>
                                        <input
                                            type="text"
                                            placeholder="Your Name"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-5 py-4 rounded-2xl bg-[#FDF6ED] border-2 border-rs-sand-dark/10 focus:border-rs-terracotta focus:outline-none transition-all font-medium text-[#3D2B1F]"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-widest text-rs-deep-brown" style={{ opacity: 0.6 }}>Return Address</label>
                                        <input
                                            type="email"
                                            placeholder="Email Address"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-5 py-4 rounded-2xl bg-[#FDF6ED] border-2 border-rs-sand-dark/10 focus:border-rs-terracotta focus:outline-none transition-all font-medium text-[#3D2B1F]"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase tracking-widest text-rs-deep-brown" style={{ opacity: 0.6 }}>Reason for Contact</label>
                                    <select
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full px-5 py-4 rounded-2xl bg-[#FDF6ED] border-2 border-rs-sand-dark/10 focus:border-rs-terracotta focus:outline-none transition-all font-medium text-[#3D2B1F]"
                                    >
                                        <option>Support Request</option>
                                        <option>Route Suggestion</option>
                                        <option>Partnership Inquiry</option>
                                        <option>Critique or Love</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5 flex-1 flex flex-col">
                                    <label className="text-xs font-black uppercase tracking-widest text-rs-deep-brown" style={{ opacity: 0.6 }}>A Detailed Dispatch</label>
                                    <textarea
                                        placeholder="How can we help your journey?"
                                        required
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        className="w-full flex-1 min-h-[160px] px-5 py-4 rounded-3xl bg-[#FDF6ED] border-2 border-rs-sand-dark/10 focus:border-rs-terracotta focus:outline-none transition-all font-medium text-[#3D2B1F] resize-none"
                                    />
                                </div>

                                <button
                                    disabled={isSubmitting || isSuccess}
                                    className={`w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${isSuccess ? 'bg-[#40C9B0] text-white' : 'bg-rs-terracotta text-white hover:brightness-110'}`}
                                >
                                    {isSubmitting ? <span className="animate-spin">🌀</span> : isSuccess ? <>Success! Sent <Zap className="h-4 w-4 fill-current" /></> : <>Send Dispatch <Send className="h-4 w-4" /></>}
                                </button>
                            </form>
                        </div>
                    </div>
                </section>

                {/* Community FAQ Link */}
                <section className="pb-24 px-6 text-center">
                    <div className="max-w-2xl mx-auto rounded-3xl py-12 px-8 border-2 border-dashed border-rs-sand-dark/40 border-rs-terracotta/20">
                        <p className="text-[#8B6D47] font-bold mb-4">Need instant navigation guidance?</p>
                        <button className="flex items-center gap-2 mx-auto font-black uppercase tracking-tighter text-rs-terracotta hover:underline">
                            Browse the Radiator FAQ <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
