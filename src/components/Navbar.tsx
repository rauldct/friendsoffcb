'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '@/lib/LanguageContext';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useLanguage();

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/competitions', label: t('nav.competitions') },
    { href: '/packages', label: t('nav.packages') },
    { href: '/calendar', label: t('nav.calendar') },
    { href: '/gallery', label: t('nav.gallery') },
    { href: '/news', label: t('nav.news') },
    { href: '/blog', label: t('nav.blog') },
    { href: '/guides', label: t('nav.guides') },
    { href: '/about', label: t('nav.about') },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <header className={`sticky top-0 z-50 w-full bg-white transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'shadow-none'}`}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" className="h-8 w-8" aria-hidden="true">
            <circle cx="18" cy="18" r="17" fill="#1A1A2E" />
            <path d="M18 3a15 15 0 1 0 0 30A15 15 0 0 0 18 3Zm0 2c1.5 0 2.9.3 4.2.7L18 9l-4.2-3.3A13 13 0 0 1 18 5Zm-8.5 4.3L13 12l-1.5 5-4.8 1.5A13 13 0 0 1 9.5 9.3ZM8 22.5l4.5-1L15 26l-2 4.5A13 13 0 0 1 8 22.5Zm15 8L21 26l2.5-4.5 4.5 1A13 13 0 0 1 23 30.5Zm7.3-11L25.5 17 24 12l3.5-2.7A13 13 0 0 1 30.3 19.5Z" fill="white" opacity="0.9" />
            <circle cx="18" cy="18" r="4" fill="#EDBB00" />
          </svg>
          <span>Friends of <span className="text-[#A50044]">Bar&ccedil;a</span></span>
        </Link>

        <ul className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-sm font-medium text-[#1A1A2E] transition-colors hover:text-[#A50044]">{link.label}</Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSelector />
          <Link href="/packages" className="rounded-lg bg-[#EDBB00] px-5 py-2.5 text-sm font-semibold text-[#1A1A2E] transition-all hover:bg-[#d4a800] hover:shadow-lg">
            {t('nav.planTrip')}
          </Link>
        </div>

        <button type="button" onClick={() => setMobileOpen(!mobileOpen)} className="relative z-50 flex h-10 w-10 items-center justify-center rounded-lg text-[#1A1A2E] transition-colors hover:bg-gray-100 lg:hidden" aria-label={mobileOpen ? 'Close menu' : 'Open menu'}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
            {mobileOpen ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />}
          </svg>
        </button>
      </nav>

      <div className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden ${mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`} onClick={() => setMobileOpen(false)} aria-hidden="true" />

      <div className={`fixed right-0 top-0 z-40 flex h-full w-72 flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out lg:hidden ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <span className="text-lg font-bold text-[#1A1A2E]">Menu</span>
          <LanguageSelector />
        </div>
        <ul className="flex flex-col gap-1 px-4 py-6">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} onClick={() => setMobileOpen(false)} className="block rounded-lg px-4 py-3 text-base font-medium text-[#1A1A2E] transition-colors hover:bg-gray-50 hover:text-[#A50044]">{link.label}</Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto border-t border-gray-100 p-6">
          <Link href="/packages" onClick={() => setMobileOpen(false)} className="block w-full rounded-lg bg-[#EDBB00] px-5 py-3 text-center text-sm font-semibold text-[#1A1A2E] transition-all hover:bg-[#d4a800] hover:shadow-lg">
            {t('nav.planTrip')}
          </Link>
        </div>
      </div>
    </header>
  );
}
