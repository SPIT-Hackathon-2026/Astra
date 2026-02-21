'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Luckiest_Guy } from 'next/font/google';

const luckiestGuy = Luckiest_Guy({
  weight: '400',
  subsets: ['latin'],
});

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Features', href: '/features' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-xl z-50 border-b border-rs-sand-dark/30 shadow-sm">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-16 sm:h-[68px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/images/logo-icon.png"
              alt="Radiator Routes"
              width={36}
              height={36}
              className="rounded-lg"
            />
            <span className={`${luckiestGuy.className} text-xl text-rs-terracotta hidden sm:block`}>
              Radiator Routes
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.href)
                    ? 'text-rs-terracotta bg-rs-terracotta/8'
                    : 'text-rs-deep-brown/70 hover:text-rs-terracotta hover:bg-rs-sand/50'
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <button className="px-4 py-2 text-sm font-medium text-rs-deep-brown/70 hover:text-rs-terracotta transition-colors">
                Log in
              </button>
            </Link>
            <Link href="/signup">
              <Button variant="primary" size="sm" className="shadow-sm">
                Start Free
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-rs-deep-brown hover:bg-rs-sand/50 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-1 border-t border-rs-sand-dark/20">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive(item.href)
                    ? 'text-rs-terracotta bg-rs-terracotta/8'
                    : 'text-rs-deep-brown/70 hover:bg-rs-sand/50'
                  }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-3 mt-2 border-t border-rs-sand-dark/15 space-y-2">
              <Link href="/login" onClick={() => setIsOpen(false)}>
                <button className="w-full text-left px-4 py-3 text-sm font-medium text-rs-deep-brown/70 hover:bg-rs-sand/50 rounded-lg">
                  Log in
                </button>
              </Link>
              <Link href="/signup" onClick={() => setIsOpen(false)}>
                <Button variant="primary" className="w-full">Start Free</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};