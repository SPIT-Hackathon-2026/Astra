'use client';

import Link from 'next/link';
import { Mail, Github, Instagram, Twitter, Navigation, MapPin, Heart } from 'lucide-react';
import { Luckiest_Guy } from 'next/font/google';

const luckiestGuy = Luckiest_Guy({
    weight: '400',
    subsets: ['latin'],
});

export const Footer = () => {
    return (
        <footer className="bg-[#3D2B1F] text-[#DFC9AD] py-16 px-6 relative overflow-hidden">
            {/* Decal background */}
            <div className="absolute opacity-[0.03] -right-20 -bottom-20 pointer-events-none">
                <Navigation className="w-[400px] h-[400px] rotate-12" />
            </div>

            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <Link href="/" className="flex items-center gap-3 mb-6 group">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform" style={{ background: 'linear-gradient(135deg, #C75B39, #E8842A)' }}>
                                <Navigation className="h-5 w-5 text-white" />
                            </div>
                            <span className={`${luckiestGuy.className} text-2xl text-white`}>
                                Radiator Routes
                            </span>
                        </Link>
                        <p className="text-sm leading-relaxed mb-6 opacity-80">
                            The ultimate voice-first AI travel companion for modern explorers inspired by the spirit of Route 66.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-rs-terracotta transition-colors">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-rs-terracotta transition-colors">
                                <Instagram className="h-5 w-5" />
                            </a>
                            <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-rs-terracotta transition-colors">
                                <Github className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Explore</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="/" className="hover:text-rs-terracotta transition-colors">Home</Link></li>
                            <li><Link href="/features" className="hover:text-rs-terracotta transition-colors">Features</Link></li>
                            <li><Link href="/about" className="hover:text-rs-terracotta transition-colors">About Story</Link></li>
                            <li><Link href="/contact" className="hover:text-rs-terracotta transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Services</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="/plan" className="hover:text-rs-terracotta transition-colors">Trip Planning</Link></li>
                            <li><Link href="/city-rides" className="hover:text-rs-terracotta transition-colors">City Transport</Link></li>
                            <li><Link href="#" className="hover:text-rs-terracotta transition-colors">Sustainable Routes</Link></li>
                            <li><Link href="#" className="hover:text-rs-terracotta transition-colors">Community</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Newsletter</h4>
                        <p className="text-sm mb-4 opacity-80">Join the tribe for exclusive deals & routes.</p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Your email"
                                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 flex-1 text-sm focus:outline-none focus:border-rs-terracotta"
                            />
                            <button className="bg-rs-terracotta text-white px-4 py-2 rounded-lg text-sm font-bold hover:brightness-110 transition-all">
                                Go
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-xs opacity-60">
                        © 2026 Radiator Routes. All rights reserved. Built with <Heart className="h-3 w-3 inline-block mx-1 fill-current text-rs-terracotta" /> for road tripping enthusiasts.
                    </p>
                    <div className="flex gap-8 text-xs opacity-60">
                        <Link href="#" className="hover:text-white">Privacy Policy</Link>
                        <Link href="#" className="hover:text-white">Terms of Service</Link>
                        <Link href="#" className="hover:text-white">Cookie Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
