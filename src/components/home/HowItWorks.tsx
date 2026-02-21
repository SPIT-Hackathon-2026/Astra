'use client';

import { Mic, Sparkles, MapPin, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import { Luckiest_Guy } from 'next/font/google';

const luckiestGuy = Luckiest_Guy({
  weight: '400',
  subsets: ['latin'],
});

export const HowItWorks = () => {
  const steps = [
    {
      icon: Mic,
      number: '01',
      title: 'Describe Your Trip',
      description: 'Tell us your destination, travel dates, and preferences — by voice or text.',
      color: 'from-rs-terracotta to-rs-sunset-orange',
    },
    {
      icon: Sparkles,
      number: '02',
      title: 'AI Builds Your Route',
      description: 'Our engine creates a personalized itinerary with optimal stops and scenic detours.',
      color: 'from-rs-neon-amber to-rs-sunset-orange',
    },
    {
      icon: MapPin,
      number: '03',
      title: 'Customize & Refine',
      description: 'Swap stops, add favorites, adjust timing. Make the trip completely yours.',
      color: 'from-rs-neon-teal to-rs-sky-blue',
    },
    {
      icon: Navigation,
      number: '04',
      title: 'Navigate & Enjoy',
      description: 'Real-time guidance that adapts to conditions. Just focus on the journey.',
      color: 'from-rs-sunset-purple to-rs-sunset-pink',
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-rs-deep-brown relative overflow-hidden">
      {/* Subtle texture */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
        backgroundSize: '24px 24px',
      }} />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-14 sm:mb-20"
        >
          <p className="text-rs-neon-teal text-sm font-semibold tracking-widest uppercase mb-3">
            How It Works
          </p>
          <h2 className={`${luckiestGuy.className} text-3xl sm:text-4xl md:text-5xl text-white mb-4`}>
            Four Simple Steps
          </h2>
          <p className="text-rs-sand/60 text-base sm:text-lg max-w-2xl mx-auto">
            From idea to open road in minutes — not hours.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.12 }}
              viewport={{ once: true }}
              className="relative group"
            >
              {/* Connector line on desktop */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-gradient-to-r from-white/20 to-white/5" />
              )}

              <div className="text-center">
                {/* Step number + icon */}
                <div className="relative inline-block mb-6">
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300`}>
                    <step.icon className="h-9 w-9 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-rs-neon-amber text-rs-deep-brown text-xs font-black flex items-center justify-center shadow-md">
                    {step.number}
                  </div>
                </div>

                {/* Text */}
                <h3 className="text-lg font-bold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-rs-sand/50 text-sm leading-relaxed max-w-[220px] mx-auto">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};