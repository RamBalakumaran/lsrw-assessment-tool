import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import HistoryPage from './pages/History';
import Profile from './pages/Profile';
import PasswordReset from './pages/PasswordReset';
import UserManagement from './pages/UserManagement';
import GlobalTasks from './pages/GlobalTasks';
import TeacherTasks from './pages/TeacherTasks';
import TeacherPerformance from './pages/TeacherPerformance';
import TeacherGroups from './pages/TeacherGroups';
import GroupStudentsPage from './pages/GroupStudentsPage';

// Import the Video-Style Tests (The ones ending in 'Test.jsx')
import TestInterface from './pages/TestInterface'; // Speaking
import ListeningTest from './pages/ListeningTest';
import ReadingTest from './pages/ReadingTest';
import WritingTest from './pages/WritingTest';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/tasks" element={<GlobalTasks />} />

          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/groups" element={<TeacherGroups />} />
          <Route path="/teacher/tasks" element={<TeacherTasks />} />
          <Route path="/teacher/performance" element={<TeacherPerformance />} />

          <Route path="/groups/:groupId/students" element={<GroupStudentsPage />} />

          <Route path="/history" element={<HistoryPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/reset-password" element={<PasswordReset />} />

          {/* Speaking Module */}
          <Route path="/test/:id" element={<TestInterface />} />
          <Route path="/speaking-test/:id" element={<TestInterface />} />
          <Route path="/speaking" element={<TestInterface />} />

          {/* Other Modules */}
          <Route path="/listening" element={<ListeningTest />} />
          <Route path="/listening-test/:id" element={<ListeningTest />} />
          
          <Route path="/reading" element={<ReadingTest />} />
          <Route path="/reading-test/:id" element={<ReadingTest />} />
          
          <Route path="/writing" element={<WritingTest />} />
          <Route path="/writing-test/:id" element={<WritingTest />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;