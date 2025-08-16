import React from 'react';
import Login from './pages/Login.jsx'; // Keep the import with .jsx extension if your file is named that
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        {/* URL path should not include .jsx */}
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
