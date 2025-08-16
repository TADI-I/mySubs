import React from 'react';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx'; 
import AddSubscription from './pages/add-subscriptions.jsx';
import EditSubscriptionModal from './pages/EditSubscriptionModal.jsx'; // Keep the import with .jsx extension if your file is named that
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx'; // Ensure this is the correct path

function App() {
  return (
    <Router>
      <Routes>
        {/* URL path should not include .jsx */}
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}></Route>
        <Route path="/add-subscription" element={<ProtectedRoute><AddSubscription /></ProtectedRoute>} />
        <Route path="/edit-subscription/:id" element={<ProtectedRoute><EditSubscriptionModal /></ProtectedRoute>} />
        {/* Redirect root path to login */}
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
