'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const EditTransactionContext = createContext(null);

export function EditTransactionProvider({ children }) {
  const [preFillData, setPreFillData] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const openEditModal = useCallback((data) => {
    setPreFillData(data);
    setIsOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setPreFillData(null);
    setIsOpen(false);
  }, []);

  return (
    <EditTransactionContext.Provider value={{ preFillData, isOpen, openEditModal, closeEditModal }}>
      {children}
    </EditTransactionContext.Provider>
  );
}

export function useEditTransaction() {
  const context = useContext(EditTransactionContext);
  if (!context) {
    throw new Error('useEditTransaction must be used within an EditTransactionProvider');
  }
  return context;
}
