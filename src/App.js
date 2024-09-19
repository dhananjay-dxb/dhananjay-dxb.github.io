import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 
'react-router-dom';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { useAuth } from './hooks/useAuth';
import './App.css';

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>School Drop Coordination App</h1>
        </header>
        <main>
          <Routes>
            <Route 
              path="/" 
              element={user ? <Navigate to="/dashboard" /> : <Auth />} 
            />
            <Route 
              path="/dashboard" 
              element={user ? <Dashboard /> : <Navigate to="/" />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
