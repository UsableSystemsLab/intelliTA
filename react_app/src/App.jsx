import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/utils/firebase.js'
import Login from '@/pages/Login.jsx'
import SignUp from '@/pages/SignUp.jsx'
import Home from '@/pages/Home.jsx'
import Courses from "@/pages/Courses.jsx";
import '@/styles/App.css'
import ProtectedRoutes from '@/utils/ProtectedRoutes'
import { useTranslation } from 'react-i18next';

 function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const { i18n } = useTranslation() 
  const isArabic = i18n.language === 'ar'

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])
   useEffect(() => {
    document.documentElement.lang = i18n.language
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr'
  }, [i18n.language, isArabic])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <h2>Loading...</h2>
      </div>
    )
  }

  return (
    <Router>
  <Routes>

    {/* Here are public pages, which means any user can access it without login  */}
    <Route path="/" element={<Home user={user} />} />
    <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
    <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/" />} />

    {/* Here is protected pages, which means user can not see it unless he is logged in */}
    <Route element={<ProtectedRoutes user={user} />}>
      <Route path="/courses" element={<Courses user={user} />} />
    </Route>

  </Routes>
</Router>

  )
}

export default App