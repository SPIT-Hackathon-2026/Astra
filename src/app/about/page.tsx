'use client';

import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { Luckiest_Guy } from 'next/font/google';
import { Sparkles, Navigation, Shield, Compass, MapPin, Award, Heart, Globe, Route, Mic } from 'lucide-react';

const luckiestGuy = Luckiest_Guy({
    weight: '400',
    subsets: ['latin'],
});

export default function AboutPage() {
    return (
        <div className="min-h-screen flex flex-col bg-[#FDF6ED]">
            <Navbar />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative py-24 px-6 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#C75B39" strokeWidth="0.5" />
                            </pattern>
                            <rect width="100" height="100" fill="url(#grid)" />
                        </svg>
                    </div>

                    <div className="max-w-5xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rs-terracotta/10 text-rs-terracotta text-sm font-bold mb-6 tracking-wide uppercase">
                            <Sparkles className="h-4 w-4" /> Discover Our Story
                        </div>
                        <h1 className={`${luckiestGuy.className} text-5xl md:text-7xl mb-8 leading-tight`} style={{ color: '#3D2B1F' }}>
                            We're Reimagining the <span className="text-rs-terracotta">Road Trip</span> for the Future.
                        </h1>
                        <p className="text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: '#8B6D47' }}>
                            Inspired by the freedom of Route 66 and the spirit of curiosity. Radiator Routes blends cutting-edge voice AI with a heart for modern exploration.
                        </p>
                    </div>
                </section>

                {/* Story Section */}
                <section className="py-20 px-6 bg-white shadow-xl relative z-10 mx-6 rounded-[40px] border-2 border-rs-sand-dark/20 transform -translate-y-10">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h2 className={`${luckiestGuy.className} text-4xl`} style={{ color: '#3D2B1F' }}>
                                    The Spark Behind the <span className="text-rs-terracotta">Route</span>.
                                </h2>
                                <div className="h-1.5 w-24 bg-rs-terracotta rounded-full" />
                            </div>
                            <div className="space-y-6 text-[#3D2B1F] text-lg leading-relaxed opacity-90">
                                <p>
                                    Radiator Routes was born from a simple realization: travel planning is broken. It's cluttered, exhausting, and often removes the very joy it's meant to facilitate.
                                </p>
                                <p>
                                    We looked at the legendary <i>Route 66</i> and the neon-lit memories of Radiator Springs. We wanted that magic—the sense of discovery, the local charm—but powered by the intelligence and precision of tomorrow's AI.
                                </p>
                                <p>
                                    Our goal? To create a <b>voice-first</b> travel companion that talks back, understands nuance, and values sustainability as much as you do.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-10">
                                <div className="p-4 rounded-3xl bg-[#FDF6ED] border border-rs-sand-dark/30">
                                    <p className={`${luckiestGuy.className} text-3xl text-rs-terracotta`}>100k+</p>
                                    <p className="text-sm font-semibold opacity-70 uppercase tracking-widest mt-1">Routes Mapped</p>
                                </div>
                                <div className="p-4 rounded-3xl bg-[#FDF6ED] border border-rs-sand-dark/30">
                                    <p className={`${luckiestGuy.className} text-3xl text-[#40C9B0]`}>98%</p>
                                    <p className="text-sm font-semibold opacity-70 uppercase tracking-widest mt-1">Accuracy</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="aspect-[4/5] rounded-[2.5rem] bg-[#F5E6D3] overflow-hidden overflow-hidden relative shadow-2xl border-4 border-white rotate-2 hover:rotate-0 transition-transform duration-700">
                                <img src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop" alt="Road trip adventure" className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#3D2B1F]/60 to-transparent" />
                                <div className="absolute bottom-10 left-10 text-white">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Navigation className="h-6 w-6 text-rs-terracotta fill-current" />
                                        <span className="font-bold uppercase tracking-widest text-sm">Now Mapping...</span>
                                    </div>
                                    <h4 className="text-2xl font-black">Arizona Highroads</h4>
                                </div>
                            </div>

                            {/* Decorative element */}
                            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-rs-terracotta rounded-full blur-[100px] opacity-20 pointer-events-none" />
                        </div>
                    </div>
                </section>

                {/* Mission/Values Section */}
                <section className="py-24 px-6 max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className={`${luckiestGuy.className} text-4xl mb-4`} style={{ color: '#3D2B1F' }}>Our Core Pillars</h2>
                        <p className="text-lg opacity-70" style={{ color: '#8B6D47' }}>What drives every line of code we write.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Mic,
                                title: "Voice First",
                                desc: "We believe travel planning should be hands-free. Talk to your route, hear the suggestions, and stay focused on the horizon.",
                                color: "#C75B39"
                            },
                            {
                                icon: Globe,
                                title: "Eco-Conscious",
                                desc: "Every route highlights the greenest path. We track your carbon savings so you can explore while protecting the planet.",
                                color: "#40C9B0"
                            },
                            {
                                icon: Shield,
                                title: "Hyper-Local",
                                desc: "Our AI prioritizes genuine local landmarks over generic tourist traps. Experience the heart of the town, not just the billboard.",
                                color: "#E8842A"
                            }
                        ].map((pill, i) => (
                            <div key={i} className="p-10 rounded-[2.5rem] bg-white border-2 border-rs-sand-dark/10 hover:border-rs-terracotta/40 transition-all hover:shadow-xl group">
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform" style={{ background: pill.color + '15' }}>
                                    <pill.icon className="h-8 w-8" style={{ color: pill.color }} />
                                </div>
                                <h3 className={`${luckiestGuy.className} text-2xl mb-4`} style={{ color: '#3D2B1F' }}>{pill.title}</h3>
                                <p className="text-sm leading-relaxed opacity-80" style={{ color: '#3D2B1F' }}>{pill.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Team/Spirit Section */}
                <section className="py-24 px-6 bg-[#3D2B1F] relative overflow-hidden">
                    <div className="max-w-7xl mx-auto flex flex-col items-center">
                        <h2 className={`${luckiestGuy.className} text-4xl text-white mb-10 text-center`}>Join the Explorer Tribe</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                            {[
                                "https://images.unsplash.com/photo-1533167649158-6d508895b980?q=80&w=2013&auto=format&fit=crop",
                                "https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?q=80&w=2070&auto=format&fit=crop",
                                "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop"
                            ].map((img, i) => (
                                <div key={i} className="aspect-video rounded-3xl overflow-hidden border-2 border-white/10 opacity-70 hover:opacity-100 transition-opacity">
                                    <img src={img} className="w-full h-full object-cover" alt="Adventures" />
                                </div>
                            ))}
                        </div>
                        <div className="mt-16 text-center max-w-2xl">
                            <p className="text-[#DFC9AD] text-xl mb-8 font-medium">Radiator Routes is more than just an app. It's a tribute to the road. Ready to start your adventure?</p>
                            <button
                                className={`${luckiestGuy.className} px-10 py-5 bg-rs-terracotta text-white rounded-2xl text-xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto`}
                            >
                                Let's Go Exploring <Compass className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
