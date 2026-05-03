const changeLanguage = jest.fn(() => Promise.resolve());

export const useTranslation = () => ({
  t: (key) => key,
  i18n: {
    language: 'en',
    changeLanguage,
    dir: () => 'ltr',
  },
  ready: true,
});

export const Trans = ({ children, i18nKey }) => children || i18nKey || null;

export const initReactI18next = {
  type: '3rdParty',
  init: () => {},
};

export const I18nextProvider = ({ children }) => children;

export default {
  useTranslation,
  Trans,
  initReactI18next,
  I18nextProvider,
};
