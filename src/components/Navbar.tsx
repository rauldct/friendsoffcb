'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LanguageSelector from './LanguageSelector';
import { useLanguage, useLocalePath } from '@/lib/LanguageContext';
import SearchModal from './SearchModal';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { t } = useLanguage();
  const lp = useLocalePath();

  const navLinks = [
    { href: lp('/'), label: t('nav.home') },
    { href: lp('/competitions'), label: t('nav.competitions') },
    { href: lp('/packages'), label: t('nav.packages') },
    { href: lp('/calendar'), label: t('nav.calendar') },
    { href: lp('/gallery'), label: t('nav.gallery') },
    { href: lp('/news'), label: t('nav.news') },
    { href: lp('/blog'), label: t('nav.blog') },
    { href: lp('/guides'), label: t('nav.guides') },
    { href: lp('/history'), label: t('nav.history') },
    { href: lp('/about'), label: t('nav.about') },
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <header className={`sticky top-0 z-50 w-full bg-white transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'shadow-none'}`}>
      <nav aria-label="Main navigation" className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <Image src="/images/fcb-crest.png" alt="FC Barcelona" width={32} height={32} className="h-8 w-8" priority />
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
          <button onClick={() => setSearchOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors" aria-label="Search">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          </button>
          <LanguageSelector />
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
        <div className="mt-auto border-t border-gray-100 p-6 space-y-3">
          <button onClick={() => { setMobileOpen(false); setSearchOpen(true); }} className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-5 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            {t('nav.home') === 'Inicio' ? 'Buscar...' : 'Search...'}
          </button>
        </div>
      </div>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
