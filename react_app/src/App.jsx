import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { Loader } from 'lucide-react'
import { auth } from '@/utils/firebase.js'
import Login from '@/pages/Login.jsx'
import SignUp from '@/pages/SignUp.jsx'
import Home from '@/pages/Home.jsx'
import Courses from "@/pages/Courses.jsx";
import CourseLabs from "@/pages/CourseLabs.jsx";
import CreateCourse from "@/pages/CreateCourse.jsx";
import Settings from "@/pages/Settings.jsx";
import '@/styles/App.css'
import ProtectedRoutes from '@/utils/ProtectedRoutes'
import { useTranslation } from 'react-i18next';
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/utils/firebase";
import InstructorRoute from "@/utils/InstructorRoute"; 

 function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const { i18n } = useTranslation() 
  const isArabic = i18n.language === 'ar'

  useEffect(() => {
    // modify the useEffect so now when user logs into the system it takes his role from firestore
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUser({
          ...currentUser,
          role: docSnap.data().role, 
        });
      } else {
        setUser(currentUser);
      }
    } else {
      setUser(null);
    }

    setLoading(false);
  });

  return () => unsubscribe();
}, []);
   useEffect(() => {
    document.documentElement.lang = i18n.language
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr'
  }, [i18n.language, isArabic])

  if (loading) {
    return (
      // change this to a loader from lucide
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <Loader className="w-10 h-10 text-blue-500 animate-spin" />
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
      <Route path="/courses/:courseId" element={<CourseLabs user={user} />} />
      <Route path="/settings" element={<Settings user={user} />} />
      {/* This route can be accessed only by instructor */}
      <Route
        path="/courses/create"
        element={
       <InstructorRoute user={user}>
        <CreateCourse user={user} />
       </InstructorRoute>
        }
      />
    </Route>

  </Routes>
</Router>

  )
}

export default App