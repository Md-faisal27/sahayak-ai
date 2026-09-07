'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ArrowRight } from 'lucide-react';

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Assessment Modes', href: '#modes' },
    { label: 'Grounding Architecture', href: '#architecture' },
    { label: 'Why Sahayak', href: '#comparison' },
  ];

  return (
    <>
      <header
        className={`fixed z-50 transition-all duration-500 ease-in-out ${
          scrolled
            ? 'top-4 left-4 right-4 max-w-[1200px] mx-auto h-14 bg-background/80 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-lg px-6'
            : 'top-0 left-0 right-0 h-20 bg-transparent px-6 lg:px-12'
        } flex items-center justify-between`}
      >
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 shrink-0 flex items-center justify-center shadow-xs">
            <Image
              src="/logo-icon.png"
              alt="Sahayak AI Logo"
              width={24}
              height={24}
              className="w-full h-full object-cover rounded-md"
              priority
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-sans font-extrabold text-xl tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              Sahayak <span className="text-brand-600 dark:text-brand-400">AI</span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links with animated expanding underline */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="relative text-sm text-foreground/70 hover:text-foreground transition-colors font-sans py-1 group"
            >
              <span>{link.label}</span>
              <span className="absolute left-0 bottom-0 w-0 h-px bg-foreground transition-all duration-300 ease-out group-hover:w-full" />
            </a>
          ))}
        </nav>

        {/* Header Actions */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase bg-foreground text-background hover:bg-foreground/90 rounded-full h-10 px-5 transition-all active:scale-[0.98]"
          >
            <span>Launch Studio</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
          className="md:hidden p-2 text-foreground/80 hover:text-foreground transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Full-Screen Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background flex flex-col justify-between p-8 pt-28 animate-in fade-in duration-300">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-3 text-xs font-mono text-muted-foreground">
              <span className="w-8 h-px bg-foreground/30" />
              Navigation
            </span>
            <div className="flex flex-col space-y-4">
              {navLinks.map((link, idx) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ animationDelay: `${idx * 75}ms` }}
                  className="font-display text-4xl sm:text-5xl text-foreground hover:text-muted-foreground transition-colors animate-char-in"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-8 border-t border-foreground/10">
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 bg-foreground text-background font-mono text-xs uppercase tracking-widest rounded-full h-14 transition-all"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center border border-foreground/20 text-foreground font-mono text-xs uppercase tracking-widest rounded-full h-14 transition-colors hover:bg-foreground/5"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
