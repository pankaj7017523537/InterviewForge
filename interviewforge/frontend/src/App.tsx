import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import './index.css';
import Dashboard from './pages/Dashboard';
import NewSession from './pages/NewSession';
import InterviewRoom from './pages/InterviewRoom';
import SessionReport from './pages/SessionReport';

function App() {
  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <nav className="nav">
          <div className="nav-logo">
            Interview<span style={{WebkitTextFillColor: '#f59e0b', color: '#f59e0b'}}>Forge</span>
          </div>
          <div className="nav-links">
            <NavLink to="/" end className={({isActive}) => `nav-link${isActive ? ' active' : ''}`}>
              📊 Dashboard
            </NavLink>
            <NavLink to="/new" className={({isActive}) => `nav-link${isActive ? ' active' : ''}`}>
              ⚡ New Interview
            </NavLink>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new" element={<NewSession />} />
          <Route path="/interview/:id" element={<InterviewRoom />} />
          <Route path="/report/:id" element={<SessionReport />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
