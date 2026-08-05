'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';
type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'teal';
type Density = 'comfortable' | 'compact';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isFocusMode: boolean;
  toggleFocusMode: () => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  density: Density;
  setDensity: (density: Density) => void;
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (isOpen: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [accentColor, setAccentColorState] = useState<AccentColor>('blue');
  const [density, setDensityState] = useState<Density>('comfortable');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const savedSidebar = localStorage.getItem('sidebar_collapsed');

    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    if (savedSidebar === 'true') {
      setIsSidebarCollapsed(true);
      document.documentElement.setAttribute('data-sidebar', 'collapsed');
    }
    
    const savedFocus = localStorage.getItem('focus_mode');
    if (savedFocus === 'true') {
      setIsFocusMode(true);
      document.documentElement.setAttribute('data-focus', 'true');
    }
    
    const savedAccent = localStorage.getItem('accent_color') as AccentColor;
    if (savedAccent) {
      setAccentColorState(savedAccent);
      document.documentElement.setAttribute('data-accent', savedAccent);
    } else {
      document.documentElement.setAttribute('data-accent', 'blue');
    }
    
    const savedDensity = localStorage.getItem('density') as Density;
    if (savedDensity) {
      setDensityState(savedDensity);
      document.documentElement.setAttribute('data-density', savedDensity);
    } else {
      document.documentElement.setAttribute('data-density', 'comfortable');
    }

    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      if (next) {
        document.documentElement.setAttribute('data-sidebar', 'collapsed');
      } else {
        document.documentElement.removeAttribute('data-sidebar');
      }
      return next;
    });
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);
  const setMobileMenuOpen = (isOpen: boolean) => setIsMobileMenuOpen(isOpen);

  const toggleFocusMode = () => {
    setIsFocusMode(prev => {
      const next = !prev;
      localStorage.setItem('focus_mode', String(next));
      if (next) {
        document.documentElement.setAttribute('data-focus', 'true');
      } else {
        document.documentElement.removeAttribute('data-focus');
      }
      return next;
    });
  };

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color);
    localStorage.setItem('accent_color', color);
    document.documentElement.setAttribute('data-accent', color);
  };
  
  const setDensity = (d: Density) => {
    setDensityState(d);
    localStorage.setItem('density', d);
    document.documentElement.setAttribute('data-density', d);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, toggleTheme, 
      isSidebarCollapsed, toggleSidebar,
      isFocusMode, toggleFocusMode,
      accentColor, setAccentColor,
      density, setDensity,
      isMobileMenuOpen,
      toggleMobileMenu,
      setMobileMenuOpen
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
