import React from 'react';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx'; // Keep the import with .jsx extension if your file is named that
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx'; // Ensure this is the correct path

function App() {
  return (
    <Router>
      <Routes>
        {/* URL path should not include .jsx */}
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}></Route>
      </Routes>
    </Router>
  );
}

export default App;
