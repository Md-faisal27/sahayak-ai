'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="border-t border-foreground/10 bg-background py-12">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs font-mono text-muted-foreground">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-foreground/15 bg-background p-0.5 shrink-0 flex items-center justify-center">
            <Image
              src="/logo-icon.png"
              alt="Sahayak AI Logo"
              width={32}
              height={32}
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div>
            <span className="font-display text-xl text-foreground tracking-tight">Sahayak AI</span>
            <span className="text-muted-foreground ml-2 font-sans font-light">Your Reliable AI Assistant</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/login" className="hover:text-foreground transition-colors">
            Sign In
          </Link>
          <Link href="/signup" className="hover:text-foreground transition-colors">
            Get Started
          </Link>
          <span className="hidden md:inline text-muted-foreground/60">•</span>
          <span className="hidden md:inline font-sans font-light">
            Document-grounded voice learning and oral exam assessment system.
          </span>
        </div>
      </div>
    </footer>
  );
}
