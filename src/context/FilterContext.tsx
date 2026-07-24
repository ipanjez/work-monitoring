'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type FilterContextType = {
  globalTargetFilter: string;
  setGlobalTargetFilter: (filter: string) => void;
  globalPicFilter: string;
  setGlobalPicFilter: (pic: string) => void;
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [globalTargetFilter, setTargetFilter] = useState('Hari Ini');
  const [globalPicFilter, setPicFilter] = useState('Semua PIC');
  const [isMounted, setIsMounted] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const storedTarget = localStorage.getItem('globalTargetFilter');
    const storedPic = localStorage.getItem('globalPicFilter');
    
    if (storedTarget) setTargetFilter(storedTarget);
    if (storedPic) setPicFilter(storedPic);
  }, []);

  // Update state and localStorage
  const setGlobalTargetFilter = (val: string) => {
    setTargetFilter(val);
    localStorage.setItem('globalTargetFilter', val);
  };

  const setGlobalPicFilter = (val: string) => {
    setPicFilter(val);
    localStorage.setItem('globalPicFilter', val);
  };

  return (
    <FilterContext.Provider value={{
      globalTargetFilter,
      setGlobalTargetFilter,
      globalPicFilter,
      setGlobalPicFilter
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
}
