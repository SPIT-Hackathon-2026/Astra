'use client';

import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Luckiest_Guy } from 'next/font/google';
import { Mic, Navigation, Zap, Leaf, Shield, Map, Eye, Calendar, Sparkles, Smartphone, Train, Compass, Route } from 'lucide-react';

const luckiestGuy = Luckiest_Guy({
    weight: '400',
    subsets: ['latin'],
});

const FEATURE_LIST = [
    {
        icon: Mic,
        title: "Voice-Activated Planning",
        desc: "Simply talk to your trip. Tell us your destination, mood, and budget. Our AI hears the 'why' and plans the perfect 'how'.",
        color: "#C75B39"
    },
    {
        icon: Zap,
        title: "Instant AI Itineraries",
        desc: "Get curated, logically sequenced daily plans for any city in seconds. From local diners to hidden mountain trails.",
        color: "#E8842A"
    },
    {
        icon: Train,
        title: "Dynamic Multi-Modal Transit",
        desc: "Switch between bus, train, walking, and driving on the fly. We find the most efficient combination for your journey.",
        color: "#40C9B0"
    },
    {
        icon: Leaf,
        title: "Eco-Route Optimization",
        desc: "Calculate CO2 savings for every path. Choose the greenest route and see your impact on our planet dashboard.",
        color: "#40C9B0"
    },
    {
        icon: Eye,
        title: "360° VR Previews",
        desc: "Enter the 'Meta-Trip'. Experience any location in immersive Street View VR before you even leave home.",
        color: "#C75B39"
    },
    {
        icon: Shield,
        title: "Verified Safety Insights",
        desc: "Stay safe with live risk assessments, verified driver checks, and secure, encrypted journey tracking.",
        color: "#3D2B1F"
    },
    {
        icon: Smartphone,
        title: "Native Mobile Experience",
        desc: "A fully responsive design that feels like a native app. Perfectly optimized for the rugged road and small screens.",
        color: "#8B6D47"
    },
    {
        icon: Sparkles,
        title: "Smart Budget Insights",
        desc: "Real-time estimated fares for taxis, buses, and trains. Never get caught by surprise costs again.",
        color: "#E8842A"
    }
];

export default function FeaturesPage() {
    return (
        <div className="min-h-screen flex flex-col bg-[#FDF6ED]">
            <Navbar />

            <main className="flex-1 px-6">
                {/* Hero Section */}
                <section className="py-24 max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rs-terracotta/10 text-rs-terracotta text-sm font-bold mb-6 tracking-wide uppercase">
                        <Zap className="h-4 w-4" /> Power Your Adventure
                    </div>
                    <h1 className={`${luckiestGuy.className} text-5xl md:text-7xl mb-8 leading-tight`} style={{ color: '#3D2B1F' }}>
                        Tools Built for the <span className="text-rs-terracotta">Modern Nomad</span>.
                    </h1>
                    <p className="text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: '#8B6D47' }}>
                        We've packed Radiator Routes with futuristic tech that keeps the vintage soul of travel alive. Explore our high-performance feature engine.
                    </p>
                </section>

                {/* Dynamic Grid */}
                <section className="py-12 max-w-7xl mx-auto mb-24">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {FEATURE_LIST.map((feat, i) => (
                            <div key={i} className="group p-8 rounded-[2.5rem] bg-white border border-rs-sand-dark/20 hover:border-rs-terracotta/40 transition-all hover:shadow-2xl hover:-translate-y-2 flex flex-col items-start relative overflow-hidden">
                                {/* Underlay glow */}
                                <div className="absolute -right-10 -bottom-10 w-24 h-24 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: feat.color }} />

                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all" style={{ background: feat.color + '15' }}>
                                    <feat.icon className="h-7 w-7" style={{ color: feat.color }} />
                                </div>
                                <h3 className={`${luckiestGuy.className} text-xl mb-4 leading-tight`} style={{ color: '#3D2B1F' }}>{feat.title}</h3>
                                <p className="text-sm leading-relaxed opacity-70 mb-0 flex-1" style={{ color: '#3D2B1F' }}>{feat.desc}</p>

                                <button className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-rs-terracotta transition-colors" style={{ color: feat.color }}>
                                    Learn More <Compass className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Feature Spotlight (Interactive Experience) */}
                <section className="py-24 px-10 bg-[#3D2B1F] rounded-[3rem] mb-24 max-w-7xl mx-auto overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
                        <Navigation className="w-full h-full scale-110 rotate-12" />
                    </div>

                    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rs-terracotta/20 text-rs-terracotta text-[10px] font-black tracking-[0.2em] mb-4 uppercase">
                                Spotlight Feature
                            </div>
                            <h2 className={`${luckiestGuy.className} text-4xl text-white mb-6 uppercase leading-tight`}>
                                The <span className="text-rs-terracotta">Voice-AI</span> Navigator
                            </h2>
                            <div className="space-y-6 text-[#DFC9AD] opacity-80 mb-10 leading-relaxed">
                                <p>Our proprietary Voice Navigator isn't just a voice button. It's a context-aware engine that understands multi-step requests. Say: <i>"Hey Radiator, find me a sustainable route to Sedona with a stop at a highly-rated coffee shack, then book an auto for the last 2km"</i>.</p>
                                <p>We handle the geocoding, availability, and payment logic seamlessly while you keep your hands on the wheel.</p>
                            </div>
                            <ul className="space-y-4 mb-8">
                                {["Context-Aware Intelligence", "Multilingual Support", "Low Latency Processing"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-white font-bold text-sm">
                                        <div className="w-5 h-5 rounded-full bg-rs-terracotta flex items-center justify-center">
                                            <Zap className="h-3 w-3 text-white fill-current" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <button className="px-8 py-4 bg-white text-rs-deep-brown rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">
                                Try Voice Demo
                            </button>
                        </div>

                        <div className="relative">
                            {/* Simulated Voice Waveform */}
                            <div className="aspect-square rounded-[3rem] bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden group">
                                <div className="absolute inset-0 flex items-center justify-center gap-3">
                                    {[0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6].map((h, i) => (
                                        <div key={i} className="w-2 rounded-full bg-rs-terracotta animate-pulse" style={{ height: `${h * 100}px`, animationDelay: `${i * 0.1}s` }} />
                                    ))}
                                </div>
                                <div className="absolute bottom-8 left-8 right-8 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                                    <p className="text-[10px] uppercase font-black text-rs-terracotta mb-1 tracking-tighter">Live Transcription</p>
                                    <p className="text-xs text-white leading-relaxed">"Navigating to Sedona via Sustainable Parkway. Total distance 40km. CO2 savings estimate: 12kg..."</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Ready to Explore CTA */}
                <section className="pb-24 text-center max-w-4xl mx-auto">
                    <h2 className={`${luckiestGuy.className} text-4xl mb-6`} style={{ color: '#3D2B1F' }}>Ready to <span className="text-rs-terracotta">Level Up</span> Your Journey?</h2>
                    <p className="text-lg opacity-70 mb-10" style={{ color: '#8B6D47' }}>All these features come bundled in one clean, powerful interface. No subscriptions, no fluff. Just better adventure.</p>
                    <button className="px-10 py-5 bg-rs-terracotta text-white rounded-[2rem] text-xl font-bold shadow-2xl hover:scale-105 transition-all flex items-center gap-3 mx-auto">
                        Ignite Your Route <Route className="h-6 w-6" />
                    </button>
                </section>
            </main>

            <Footer />
        </div>
    );
}
