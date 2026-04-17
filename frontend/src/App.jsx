import React, { useEffect } from 'react'
import Navbar from './components/Navbar'
import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './components/HomePage'
import SignupPage from './components/SignupPage'
import LoginPage from './components/LoginPage'
import DashboardPage from './components/DashboardPage'
import CoursePage from './components/CoursePage'
import CourseDetailPage from "./pages/CourseDetailPage.jsx";
import CapstoneResultPage from "./components/CapstoneResultPage.jsx";
import CapstonePage from "./components/CapstonePage.jsx";

//Future pages
import TutorPlaceholderPage from './components/TutorPlaceholderPage'

import useAuthStore from './store/useAuthStore'
import { Toaster } from 'react-hot-toast'

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const role = authUser?.role
  const isStudent = role === "student"
  const isTutor = role === "instructor" || role === "tutor"

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  console.log({ authUser });

  if (isCheckingAuth && !authUser) return (
    <div className='flex items-center justify-center h-screen'>
      <div className='animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary'></div>
    </div>
  )


  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/signup"
          element={!authUser ? <SignupPage /> : <Navigate to={isStudent ? "/course" : "/tutor"} />}
        />
        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to={isStudent ? "/course" : "/tutor"} />}
        />
        <Route
          path="/dashboard"
          element={
            !authUser ? <Navigate to="/login" /> : isStudent ? <DashboardPage /> : <Navigate to="/tutor" />
          }
        />
        <Route
          path="/course"
          element={
            !authUser ? <Navigate to="/login" /> : isStudent ? <CoursePage /> : <Navigate to="/tutor" />
          }
        />
        <Route
          path="/tutor"
          element={
            !authUser ? <Navigate to="/login" /> : isTutor ? <TutorPlaceholderPage /> : <Navigate to="/course" />
          }
        />
        <Route path="/course/:courseId" element={authUser ? <CourseDetailPage /> : <Navigate to="/login" />} />
        <Route path="/capstone/:courseId" element={authUser ? <CapstonePage /> : <Navigate to="/login" />} />
        <Route path="/capstone/:courseId/result/:sessionId" element={authUser ? <CapstoneResultPage /> : <Navigate to="/login" />} />
      </Routes>
      <Toaster />
    </div>
  )
}

export default App