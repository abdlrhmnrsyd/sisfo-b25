"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";

interface NavbarProps {
  onHeightChange?: (height: number) => void;
}

const navLinks = [
  { name: "Dashboard", href: "/" },
  { name: "Jadwal", href: "/schedule" },
  { name: "Tugas", href: "/task" },
  { name: "Uang Kas", href: "/cash" },
];

const Navbar = ({ onHeightChange }: NavbarProps) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (navRef.current && onHeightChange) {
      const observer = new ResizeObserver(entries => {
        for (const entry of entries) {
          onHeightChange(entry.contentRect.height);
        }
      });
      observer.observe(navRef.current);
      return () => observer.disconnect();
    }
  }, [onHeightChange]);

  return (
    <motion.nav
      ref={navRef}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="fixed top-0 left-0 right-0 z-50 p-4 backdrop-blur-xl"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        borderBottom: '1px solid rgba(71, 85, 105, 0.3)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
      }}
    >

      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo or Site Title */}
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-transparent flex items-center space-x-2">
          <Image src="/logo.png" alt="Logo" width={40} height={40} className="h-10 w-10" />
          <span>TRPL 1B</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-6">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href}>
              <motion.div
                className={`relative text-lg px-3 py-2 rounded-md transition-all duration-300 ${pathname === link.href ? 'text-purple-300' : 'text-slate-300 hover:text-white'}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {link.name}
                {pathname === link.href && (
                  <motion.div
                    layoutId="underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full"
                  />
                )}
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-md p-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden mt-4 space-y-2"
          >
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href}>
                <motion.div
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-300 ${pathname === link.href ? 'bg-purple-800/50 text-purple-200' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'}`}
                  onClick={() => setIsOpen(false)} // Close menu on link click
                  whileHover={{ scale: 0.98 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {link.name}
                </motion.div>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
