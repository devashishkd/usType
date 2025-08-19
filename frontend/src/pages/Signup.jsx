import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    if (username.length < 3) {
      setError("username must be at least 3 characters");
      return;
    }
    if (!password.trim()) {
      setError("password is required");
      return;
    }
    if (password.length < 6) {
      setError("password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("passwords do not match");
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", { username, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      navigate("/dashboard");
    } catch (e) {
      console.error("Signup error:", e);
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
            register
          </h1>
          <p className="text-dim">create your account to start typing</p>
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
              placeholder="choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
              autoFocus
            />
            <p className="text-dim mt-1" style={{ fontSize: '0.75rem' }}>
              minimum 3 characters
            </p>
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="block text-dim mb-1" style={{ fontSize: '0.875rem' }}>
              password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="input"
              placeholder="create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
            />
            <p className="text-dim mt-1" style={{ fontSize: '0.75rem' }}>
              minimum 6 characters
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="confirmPassword" className="block text-dim mb-1" style={{ fontSize: '0.875rem' }}>
              confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="input"
              placeholder="confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
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
                <span>creating account...</span>
              </>
            ) : (
              'create account'
            )}
          </button>

          <div className="text-center">
            <span className="text-dim" style={{ fontSize: '0.875rem' }}>
              already have an account?{' '}
            </span>
            <Link to="/login" className="text-accent" style={{ fontSize: '0.875rem' }}>
              sign in
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
            <span className="text-dim" style={{ fontSize: '0.75rem' }}>tips</span>
            <div style={{
              height: '1px',
              width: '60px',
              backgroundColor: 'var(--sub-alt-color)'
            }}></div>
          </div>
          
          <div className="mt-3 text-dim" style={{ fontSize: '0.75rem', lineHeight: '1.5' }}>
            <p>• use a unique username</p>
            <p>• choose a strong password</p>
            <p>• start practicing immediately</p>
          </div>
        </div>
      </div>
    </div>
  );
}
