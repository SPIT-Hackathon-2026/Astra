'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';
import { Luckiest_Guy } from 'next/font/google';

const luckiestGuy = Luckiest_Guy({
  weight: '400',
  subsets: ['latin'],
});

export const CTA = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Full-width image CTA */}
      <div className="relative h-[480px] sm:h-[520px]">
        <Image
          src="/images/trip-route66.png"
          alt="Route 66 at golden hour"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-rs-deep-brown/90 via-rs-deep-brown/70 to-rs-deep-brown/40" />

        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="max-w-lg"
            >
              <p className="text-rs-neon-amber text-sm font-semibold tracking-widest uppercase mb-4">
                Ready to Go?
              </p>
              <h2 className={`${luckiestGuy.className} text-3xl sm:text-4xl md:text-5xl text-white mb-4 leading-tight`}>
                Your Next Adventure Is One Voice Command Away
              </h2>
              <p className="text-white/70 text-base sm:text-lg mb-8 leading-relaxed">
                Join 10,000+ travelers who plan smarter road trips.
                Start for free — no credit card required.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="primary"
                    className="w-full sm:w-auto text-base px-7 py-4 shadow-xl shadow-rs-terracotta/30 bg-gradient-to-r from-rs-terracotta to-rs-sunset-orange"
                  >
                    <span className="font-semibold">Get Started Free</span>
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/features" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto text-base px-7 py-4 border-white/30 text-white hover:bg-white/10"
                  >
                    View Features
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-rs-deep-brown py-8 sm:py-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Image
                src="/images/logo-icon.png"
                alt="Radiator Routes"
                width={28}
                height={28}
                className="rounded-md opacity-80"
              />
              <span className={`${luckiestGuy.className} text-white/60 text-base`}>
                Radiator Routes
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-white/40 text-sm hover:text-white/60 transition-colors">Privacy</Link>
              <Link href="/terms" className="text-white/40 text-sm hover:text-white/60 transition-colors">Terms</Link>
              <Link href="/contact" className="text-white/40 text-sm hover:text-white/60 transition-colors">Contact</Link>
            </div>
            <p className="text-white/30 text-sm">
              © 2026 Radiator Routes
            </p>
          </div>
        </div>
      </footer>
    </section>
  );
};