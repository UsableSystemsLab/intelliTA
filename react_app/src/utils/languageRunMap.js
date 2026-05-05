export const LANGUAGE_RUN_MAP = {
  py: { language: 'python', version: '3.10.0' },
  js: { language: 'javascript', version: '18.15.0' },
  java: { language: 'java', version: '15.0.2' },
};

const getExt = (fileName) => fileName?.split('.').pop()?.toLowerCase();

export const isRunnable = (fileName) => Boolean(LANGUAGE_RUN_MAP[getExt(fileName)]);

export const getRunConfig = (fileName) => LANGUAGE_RUN_MAP[getExt(fileName)] || null;
