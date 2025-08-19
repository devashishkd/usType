import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!username.trim()) {
      setError("username is required");
      return;
    }
    if (!password.trim()) {
      setError("password is required");
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { username, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      navigate("/dashboard");
    } catch (e) {
      console.error("Login error:", e);
      if (e.response) {
        setError(e.response.data.message || e.response.statusText);
      } else if (e.request) {
        setError("network error: unable to reach server");
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '4rem' }}>
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-4">
          <h1 className="text-accent mb-2" style={{ fontSize: '2.5rem', fontWeight: '300' }}>
            login
          </h1>
          <p className="text-dim">enter your credentials to continue</p>
        </div>

        <form onSubmit={onSubmit} className="card">
          <div className="mb-3">
            <label htmlFor="username" className="block text-dim mb-1" style={{ fontSize: '0.875rem' }}>
              username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="input"
              placeholder="enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-dim mb-1" style={{ fontSize: '0.875rem' }}>
              password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="input"
              placeholder="enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="mb-3 p-2 text-center" style={{
              backgroundColor: 'var(--error-extra-color)',
              borderRadius: '0.5rem',
              color: 'var(--error-color)',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full mb-3"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%'
            }}
          >
            {loading ? (
              <>
                <span className="loading"></span>
                <span>logging in...</span>
              </>
            ) : (
              'sign in'
            )}
          </button>

          <div className="text-center">
            <span className="text-dim" style={{ fontSize: '0.875rem' }}>
              don't have an account?{' '}
            </span>
            <Link to="/signup" className="text-accent" style={{ fontSize: '0.875rem' }}>
              register
            </Link>
          </div>
        </form>

        <div className="text-center mt-4">
          <div className="flex items-center justify-center gap-2">
            <div style={{
              height: '1px',
              width: '60px',
              backgroundColor: 'var(--sub-alt-color)'
            }}></div>
            <span className="text-dim" style={{ fontSize: '0.75rem' }}>or</span>
            <div style={{
              height: '1px',
              width: '60px',
              backgroundColor: 'var(--sub-alt-color)'
            }}></div>
          </div>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-ghost mt-3"
            style={{ fontSize: '0.875rem' }}
          >
            continue as guest
          </button>
        </div>
      </div>
    </div>
  );
}