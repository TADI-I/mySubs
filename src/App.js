import React from 'react';
import Login from './pages/Login.jsx'; // Fixed import path and case

function App() {
  return (
    <div className="app">
      <Login /> {/* Fixed component name (PascalCase) */}
    </div>
  );
}

export default App;