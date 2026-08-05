'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

type FilterContextType = {
  globalTargetFilter: string;
  setGlobalTargetFilter: (filter: string) => void;
  globalPicFilter: string;
  setGlobalPicFilter: (pic: string) => void;
  globalCustomStartDate: string;
  setGlobalCustomStartDate: (date: string) => void;
  globalCustomEndDate: string;
  setGlobalCustomEndDate: (date: string) => void;
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const user = session?.user;
  const isMember = (user as any)?.role === 'MEMBER';

  const [globalTargetFilter, setTargetFilter] = useState('Semua Waktu');
  const [globalPicFilter, setPicFilter] = useState('Semua PIC');
  const [globalCustomStartDate, setCustomStartDate] = useState('');
  const [globalCustomEndDate, setCustomEndDate] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const storedTarget = localStorage.getItem('globalTargetFilter');
    const storedPic = localStorage.getItem('globalPicFilter');
    const storedStart = localStorage.getItem('globalCustomStartDate');
    const storedEnd = localStorage.getItem('globalCustomEndDate');
    
    if (storedTarget) setTargetFilter(storedTarget);
    
    // If the logged-in user is a member, default to their own name first.
    // Otherwise, default to the stored PIC filter or "Semua PIC".
    if (storedPic) {
      setPicFilter(storedPic);
    } else {
      setPicFilter('Semua PIC');
    }
    
    if (storedStart) setCustomStartDate(storedStart);
    if (storedEnd) setCustomEndDate(storedEnd);
  }, [isMember, user?.name]);

  // Update state and localStorage
  const setGlobalTargetFilter = (val: string) => {
    setTargetFilter(val);
    localStorage.setItem('globalTargetFilter', val);
  };

  const setGlobalPicFilter = (val: string) => {
    setPicFilter(val);
    localStorage.setItem('globalPicFilter', val);
  };

  const setGlobalCustomStartDate = (val: string) => {
    setCustomStartDate(val);
    localStorage.setItem('globalCustomStartDate', val);
  };

  const setGlobalCustomEndDate = (val: string) => {
    setCustomEndDate(val);
    localStorage.setItem('globalCustomEndDate', val);
  };

  return (
    <FilterContext.Provider value={{
      globalTargetFilter,
      setGlobalTargetFilter,
      globalPicFilter,
      setGlobalPicFilter,
      globalCustomStartDate,
      setGlobalCustomStartDate,
      globalCustomEndDate,
      setGlobalCustomEndDate
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
