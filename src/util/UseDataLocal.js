import { locale, addLocale } from 'primereact/api';

export function UseDataLocal(config) {

  return {
    setItalianLocale: () => {
      locale('it');
      addLocale('it', config);
    },
  };
}
