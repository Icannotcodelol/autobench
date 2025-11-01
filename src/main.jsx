import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import App from './App.jsx';
import DailyChallenges from './DailyChallenges.jsx';
import TestingPage from './TestingPage.jsx';
import './index.css';

function AppRouter() {
  return (
    <BrowserRouter>
      <nav className="main-nav">
        <Link to="/">Model Comparison</Link>
        <Link to="/daily">Daily Challenges</Link>
        <Link to="/testing">Testing</Link>
      </nav>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/daily" element={<DailyChallenges />} />
        <Route path="/testing" element={<TestingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
);
