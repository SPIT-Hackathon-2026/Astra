'use client';

import { Mic, Zap, Users, Calendar, Globe, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Luckiest_Guy } from 'next/font/google';

const luckiestGuy = Luckiest_Guy({
  weight: '400',
  subsets: ['latin'],
});

export const Features = () => {
  const features = [
    {
      icon: Mic,
      title: 'Voice-First Planning',
      description: 'Plan entire trips using natural voice commands. Just speak your destination and preferences.',
      gradient: 'from-rs-terracotta to-rs-sunset-orange',
    },
    {
      icon: Zap,
      title: 'Instant Itineraries',
      description: 'Get a personalized travel plan in seconds, optimized for scenic routes and local gems.',
      gradient: 'from-rs-neon-amber to-rs-sunset-orange',
    },
    {
      icon: Users,
      title: 'Group Planning',
      description: 'Collaborate with friends and family. Everyone adds stops and votes on the best routes.',
      gradient: 'from-rs-neon-teal to-rs-sky-blue',
    },
    {
      icon: Calendar,
      title: 'Smart Scheduling',
      description: 'Real-time weather and traffic data automatically adjusts your route for the best experience.',
      gradient: 'from-rs-sunset-purple to-rs-sunset-pink',
    },
    {
      icon: Globe,
      title: 'Hidden Gems',
      description: 'Discover roadside diners, scenic overlooks, and off-the-beaten-path destinations.',
      gradient: 'from-rs-dusty-red to-rs-terracotta',
    },
    {
      icon: TrendingUp,
      title: 'Adaptive Learning',
      description: 'The more you travel, the better our recommendations become. Your personal route advisor.',
      gradient: 'from-rs-desert-brown to-rs-terracotta-light',
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-14 sm:mb-20"
        >
          <p className="text-rs-terracotta text-sm font-semibold tracking-widest uppercase mb-3">
            Features
          </p>
          <h2 className={`${luckiestGuy.className} text-3xl sm:text-4xl md:text-5xl text-rs-deep-brown mb-4`}>
            Everything You Need
          </h2>
          <p className="text-rs-desert-brown text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Powerful tools designed to make road trip planning effortless,
            from the first idea to the final mile.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="relative p-7 sm:p-8 rounded-2xl border border-rs-sand-dark/25 bg-rs-sand-light/40 hover:bg-white hover:shadow-xl hover:shadow-rs-terracotta/5 hover:border-rs-terracotta/20 transition-all duration-300 h-full">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-md group-hover:scale-105 transition-transform duration-300`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-lg sm:text-xl font-bold text-rs-deep-brown mb-2 group-hover:text-rs-terracotta transition-colors duration-300">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-rs-desert-brown text-sm sm:text-[0.938rem] leading-relaxed">
                  {feature.description}
                </p>

                {/* Subtle accent line */}
                <div className={`mt-6 h-0.5 w-12 rounded-full bg-gradient-to-r ${feature.gradient} opacity-40 group-hover:w-20 group-hover:opacity-70 transition-all duration-500`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};