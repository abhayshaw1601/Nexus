"use client";

import { useState, useEffect, useRef } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useLanguage, LANGUAGES } from "../LanguageContext";

const BLACK = 'var(--border-color)';
const WHITE = 'var(--shadow-color)';
const PUR = 'var(--pur)';
const FG = 'var(--fg)';
const SIDEBAR_BG = 'var(--sidebar-bg)';

export function LanguageSelector() {
  const { currentLanguage, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectLanguage = (code: string) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          minHeight: 56,
          fontFamily: "'Plus Jakarta Sans',sans-serif",
          fontWeight: 900,
          fontSize: '0.75rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: FG,
          backgroundColor: '#fff',
          border: `3px solid ${BLACK}`,
          boxShadow: isOpen ? '0px 0px 0px #000' : `4px 4px 0px 0px ${BLACK}`,
          transform: isOpen ? 'translate(4px, 4px)' : 'none',
          cursor: 'pointer',
          transition: 'all 0.1s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Globe style={{ marginRight: 12, width: 18, height: 18, strokeWidth: 2, color: PUR }} />
          <span>{currentLanguage.name}</span>
        </div>
        <ChevronDown
          style={{
            width: 16,
            height: 16,
            strokeWidth: 3,
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'none'
          }}
        />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          backgroundColor: SIDEBAR_BG,
          border: `2.5px solid ${BLACK}`,
          boxShadow: `4px 4px 0 ${WHITE}`,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          padding: 4,
          maxHeight: 300,
          overflowY: 'auto'
        }}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => selectLanguage(lang.code)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                fontWeight: 700,
                fontSize: '0.7rem',
                color: FG,
                backgroundColor: currentLanguage.code === lang.code ? 'rgba(0, 137, 123, 0.1)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.1s ease',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.backgroundColor = 'rgba(0, 137, 123, 0.15)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.backgroundColor = currentLanguage.code === lang.code ? 'rgba(0, 137, 123, 0.1)' : 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.1rem' }}>{lang.flag}</span>
                <span>{lang.name}</span>
              </div>
              {currentLanguage.code === lang.code && (
                <Check style={{ width: 14, height: 14, color: PUR }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
