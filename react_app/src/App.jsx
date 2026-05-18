import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { Loader } from 'lucide-react'
import { auth, db } from '@/utils/firebase.js' // Ensure db is exported from your firebase config
import { doc, getDoc } from "firebase/firestore";
import { useTranslation } from 'react-i18next';
import { isKauEmail } from '@/utils/kauDomain';
import { API_BASE, getAuthHeaders } from '@/config/api';

import Login from '@/pages/Login.jsx'
import SignUp from '@/pages/SignUp.jsx'
import Home from '@/pages/Home.jsx'
import Courses from "@/pages/Courses.jsx";
import CourseLabs from "@/pages/CourseLabs.jsx";
import CreateCourse from "@/pages/CreateCourse.jsx";
import Settings from "@/pages/Settings.jsx";
import Rewards from "@/pages/Rewards.jsx";
import Leaderboard from "@/pages/Leaderboard.jsx";
import UserBadges from "@/pages/UserBadges.jsx";
import Calendar from "@/pages/Calendar.jsx";
import Activity from './pages/Activity' // Added from incoming branch
import TestExamples from '@/pages/TestExamples.jsx'
import LabGuide from '@/pages/LabGuide.jsx'
import DocsLayout from '@/components/Docs/DocsLayout'
import DocsLanding from '@/components/Docs/DocsLanding'
import DocsGitHubGuide from '@/components/Docs/DocsGitHubGuide'
import '@/styles/App.css'
import { applySize, FONT_SIZE_KEY, applyHighContrast, HIGH_CONTRAST_KEY, applyTheme, THEME_KEY } from '@/components/Settings/AccessibilitySettings'
import ProtectedRoutes from '@/utils/ProtectedRoutes'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const { i18n } = useTranslation()
  const isArabic = i18n.language === 'ar'

  useEffect(() => {
    // Fetches user role from firestore upon auth state change
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && !isKauEmail(currentUser.email)) {
        try {
          await currentUser.delete();
        } catch {
          await signOut(auth);
        }
        setUser(null);
        setLoading(false);
        return;
      }
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);

          let dbId;
          try {
            const profileRes = await fetch(
              `${API_BASE}/users/${currentUser.uid}/profile`,
              { headers: await getAuthHeaders(currentUser) },
            );
            if (profileRes.ok) {
              dbId = (await profileRes.json())?.id;
            }
          } catch {
            
          }

          if (docSnap.exists()) {
            setUser({
              ...currentUser,
              ...docSnap.data(),
              ...(dbId !== undefined ? { id: dbId } : {}),
            });
          } else {
            setUser(
              dbId !== undefined
                ? Object.assign(currentUser, { id: dbId })
                : currentUser,
            );
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
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
    applySize(localStorage.getItem(FONT_SIZE_KEY) || 'md');
    applyHighContrast(localStorage.getItem(HIGH_CONTRAST_KEY) === 'true');
    applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
  }, []);

  useEffect(() => {
    document.documentElement.lang = i18n.language
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr'
  }, [i18n.language, isArabic])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <Loader className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home user={user} />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/" />} />

        {/* Docs portal */}
        <Route element={<DocsLayout user={user} />}>
          <Route path="/docs" element={<DocsLanding />} />
          <Route path="/docs/labs" element={<LabGuide user={user} />} />
          <Route path="/docs/tests" element={<TestExamples user={user} />} />
          <Route path="/docs/github" element={<DocsGitHubGuide />} />
        </Route>

        {/* Legacy redirects */}
        <Route path="/docs/test-examples" element={<Navigate to="/docs/tests" replace />} />
        <Route path="/docs/lab-guides" element={<Navigate to="/docs/labs" replace />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoutes user={user} />}>
          <Route path="/courses" element={<Courses user={user} />} />
          <Route path="/courses/:courseId" element={<CourseLabs user={user} />} />
          <Route path="/courses/create" element={<CreateCourse user={user} />} />
          <Route path="/settings" element={<Settings user={user} setUser={setUser} />} />
          <Route path="/rewards/me" element={<Rewards user={user} />} />
          <Route path="/leaderboard" element={<Leaderboard user={user} />} />
          <Route path="/users/:userId/badges" element={<UserBadges user={user} />} />
          <Route path="/calendar" element={<Calendar user={user} />} />
          {/* Resolved: Added Activity route from incoming branch */}
          <Route path="/courses/:courseId/activities/:activityId" element={<Activity user={user} />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App