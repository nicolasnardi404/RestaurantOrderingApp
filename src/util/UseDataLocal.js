// src/hooks/usePrimeReactLocale.js
import React from 'react';
import { useEffect } from 'react';
import { locale, addLocale } from 'primereact/api';

export function UseDataLocal(config) {
  useEffect(() => {
    locale('it');
    addLocale('it', config);
  }, []);

  return {
    setItalianLocale: () => {
      locale('it');
      addLocale('it', config);
    },
  };
}
