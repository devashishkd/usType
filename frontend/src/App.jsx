import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Footer from "./components/Footer";

export default function App() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username");
  
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <div className="container">
        <nav className="nav">
          <div className="nav-brand">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>TypeX</span>
          </div>
          
          <div className="nav-links">
            {username ? (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="nav-link"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    font: 'inherit'
                  }}
                >
                  Home
                </button>
                <span className="text-dim">|</span>
                <span className="nav-link">
                  <span className="text-dim">User: </span> <span className="text-accent">{username}</span>
                </span>
                <span className="text-dim">|</span>
                <button
                  onClick={logout}
                  className="nav-link"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    font: 'inherit'
                  }}
                >
                  logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="nav-link"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    font: 'inherit'
                  }}
                >
                  login
                </button>
                <span className="text-dim">|</span>
                <button
                  onClick={() => navigate('/signup')}
                  className="nav-link"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    font: 'inherit'
                  }}
                >
                  register
                </button>
              </>
            )}
          </div>
        </nav>
        
        <main className="fade-in">
          <Outlet />
        </main>
        
       <Footer/>
      </div>
    </div>
  );
}
