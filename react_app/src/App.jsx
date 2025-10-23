import { useState } from 'react'
import reactLogo from '@/assets/react.svg'
import viteLogo from '/vite.svg'
import '@/styles/App.css'
import { useTranslation } from 'react-i18next';

function App() {
  const {t, i18n} = useTranslation();

  function changeLanguage() {
    i18n.changeLanguage(i18n.language=="ar"?"en":"ar");
  }

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>React + Vite</h1>
      <p className=''>{t("welcomeMsg")}</p>
      <button onClick={changeLanguage}>{i18n.language=="ar"?"English":"عربي"}</button>

    </>
  )
}

export default App
