'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Mic, Play } from 'lucide-react';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';
import { Luckiest_Guy } from 'next/font/google';

const luckiestGuy = Luckiest_Guy({
  weight: '400',
  subsets: ['latin'],
});

export const Hero = () => {
  return (
    <section className="relative min-h-[100dvh] flex items-end sm:items-center overflow-hidden">
      {/* Professional photo background */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-bg.png"
          alt="Open road stretching into Monument Valley at sunset"
          fill
          className="object-cover object-center"
          priority
          quality={90}
        />
        {/* Cinematic overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-rs-deep-brown/80 via-rs-deep-brown/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-rs-deep-brown/90 via-transparent to-rs-deep-brown/20" />
      </div>

      {/* Content — left-aligned, professional layout */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pb-16 sm:pb-0 pt-28 sm:pt-0">
        <div className="max-w-2xl">
          {/* Subtle pill badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-white/20"
          >
            <div className="w-2 h-2 rounded-full bg-rs-neon-teal animate-pulse" />
            <span className="text-white/90 text-xs sm:text-sm font-medium tracking-wide">
              AI-Powered Trip Planning
            </span>
          </motion.div>

          {/* Main heading — clean, impactful */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className={`${luckiestGuy.className} text-[2.75rem] sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] mb-6`}
          >
            <span className="block text-white">Plan Your</span>
            <span className="block text-rs-neon-amber mt-1">Perfect Road Trip</span>
            <span className="block text-white/80 text-[1.75rem] sm:text-4xl md:text-5xl mt-2">
              With Just Your Voice
            </span>
          </motion.h1>

          {/* Description — concise, professional */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-white/75 text-base sm:text-lg md:text-xl max-w-lg leading-relaxed mb-8"
          >
            Speak your destination. Our AI crafts personalized routes with scenic
            stops, local favorites, and real-time weather updates —
            all in seconds.
          </motion.p>

          {/* CTA Buttons — professional sizing */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-3 mb-10"
          >
            <Link href="/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="primary"
                className="w-full sm:w-auto text-base px-7 py-4 shadow-xl shadow-rs-terracotta/30 bg-gradient-to-r from-rs-terracotta to-rs-sunset-orange hover:from-rs-terracotta-dark hover:to-rs-terracotta"
              >
                <span className="font-semibold">Get Started Free</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-base px-7 py-4 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
            >
              <Play className="mr-2 h-4 w-4 fill-current" />
              <span className="font-semibold">Watch Demo</span>
            </Button>
          </motion.div>

          {/* Social proof — subtle, professional */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="flex items-center gap-6"
          >
            {/* Avatars */}
            <div className="flex -space-x-2">
              {['#C75B39', '#40C9B0', '#E8842A', '#5BA4CF'].map((color, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-rs-deep-brown"
                  style={{ background: color }}
                />
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-3.5 h-3.5 text-rs-neon-amber fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-white/50 text-xs font-medium">
                Trusted by 10,000+ road trippers
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 hidden sm:block"
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-white/50 rounded-full" />
        </div>
      </motion.div>
    </section>
  );
};