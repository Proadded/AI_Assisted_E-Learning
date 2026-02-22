import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import useAuthStore from '../store/useAuthStore'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

:root {
  --ivory:       #F7F5F0;
  --ivory-dark:  #EDE9E1;
  --warm-grey:   #C8C2B8;
  --charcoal:    #2A2723;
  --ink:         #1A1815;
  --amber:       #D4860A;
  --amber-light: #F0A830;
  --amber-pale:  #FDF3E1;
  --text-muted:  #7A756D;
  --text-body:   #4A4540;
  --border:      rgba(42,39,35,0.1);
  --border-focus:rgba(212,134,10,0.45);
  --shadow-sm:   0 1px 3px rgba(26,24,21,0.06), 0 1px 2px rgba(26,24,21,0.04);
  --shadow-md:   0 4px 16px rgba(26,24,21,0.08), 0 2px 6px rgba(26,24,21,0.05);
  --shadow-lg:   0 24px 64px rgba(26,24,21,0.1), 0 8px 24px rgba(26,24,21,0.06);
  --radius:      16px;
  --radius-sm:   8px;
  --t:           0.22s cubic-bezier(0.4,0,0.2,1);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: 'DM Sans', sans-serif; background: var(--ivory); -webkit-font-smoothing: antialiased; }

/* ── Page shell ── */
.lp-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ivory);
  position: relative;
  overflow: hidden;
  padding: 80px 24px 40px;
}

/* noise texture */
.lp-root::before {
  content: '';
  position: fixed; inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
  pointer-events: none; z-index: 0; opacity: 0.6;
}

/* ambient orbs */
.lp-orb {
  position: fixed; border-radius: 50%;
  pointer-events: none; z-index: 0;
  filter: blur(72px);
}
.lp-orb-1 {
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(212,134,10,0.07) 0%, transparent 70%);
  top: -160px; left: -160px;
  animation: orbDrift 14s ease-in-out infinite alternate;
}
.lp-orb-2 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(42,39,35,0.05) 0%, transparent 70%);
  bottom: -120px; right: -120px;
  animation: orbDrift 18s ease-in-out infinite alternate-reverse;
}
@keyframes orbDrift {
  from { transform: translate(0, 0); }
  to   { transform: translate(24px, -24px); }
}

/* ── Card ── */
.lp-card {
  position: relative; z-index: 1;
  width: 100%; max-width: 420px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 48px 44px;
  box-shadow: var(--shadow-lg);
  animation: cardIn 0.55s cubic-bezier(0.22,1,0.36,1) both;
}

/* top amber rule */
.lp-card::before {
  content: '';
  position: absolute; top: 0; left: 10%; right: 10%; height: 2px;
  background: linear-gradient(90deg, transparent, var(--amber), var(--amber-light), var(--amber), transparent);
  border-radius: 0 0 2px 2px;
  opacity: 0.6;
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(28px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0)   scale(1); }
}

/* ── Header ── */
.lp-header { margin-bottom: 36px; animation: fadeUp 0.5s 0.1s ease both; }

.lp-wordmark {
  display: flex; align-items: center; gap: 9px;
  margin-bottom: 28px; text-decoration: none;
}
.lp-logo {
  width: 32px; height: 32px;
  background: linear-gradient(135deg, var(--amber) 0%, var(--amber-light) 100%);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 0 1px rgba(212,134,10,0.25), 0 3px 10px rgba(212,134,10,0.2);
}
.lp-brand {
  font-family: 'DM Serif Display', serif;
  font-size: 19px; color: var(--charcoal); letter-spacing: -0.3px;
}
.lp-brand em {
  font-style: italic;
  background: linear-gradient(90deg, var(--amber), var(--amber-light));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}

.lp-step-hint {
  font-family: 'DM Mono', monospace;
  font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
  color: var(--amber); margin-bottom: 10px;
  display: flex; align-items: center; gap: 8px;
}
.lp-step-hint::after {
  content: ''; flex: 1; height: 1px;
  background: linear-gradient(90deg, var(--amber-pale), transparent);
  max-width: 60px;
}

.lp-title {
  font-family: 'DM Serif Display', serif;
  font-size: 28px; letter-spacing: -0.6px;
  color: var(--ink); margin-bottom: 7px; line-height: 1.2;
}
.lp-title em { font-style: italic; color: var(--amber); }
.lp-sub {
  font-size: 14px; font-weight: 300;
  color: var(--text-muted); line-height: 1.5;
}
.lp-sub a {
  color: var(--amber); text-decoration: none; font-weight: 500;
  border-bottom: 1px solid rgba(212,134,10,0.3);
  transition: border-color var(--t);
}
.lp-sub a:hover { border-color: var(--amber); }

/* ── Fields ── */
.lp-field { margin-bottom: 18px; animation: fadeUp 0.5s 0.15s ease both; }
.lp-field:nth-child(2) { animation-delay: 0.2s; }

.lp-label {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 7px;
}
.lp-label-text { font-size: 12px; font-weight: 500; color: var(--text-body); letter-spacing: 0.2px; }
.lp-forgot {
  font-size: 12px; font-weight: 400;
  color: var(--text-muted); text-decoration: none;
  transition: color var(--t);
  font-family: 'DM Mono', monospace; letter-spacing: 0.3px;
}
.lp-forgot:hover { color: var(--amber); }

.lp-input-wrap { position: relative; display: flex; align-items: center; }
.lp-input-icon {
  position: absolute; left: 14px;
  color: var(--warm-grey); pointer-events: none;
  display: flex; align-items: center;
  transition: color var(--t);
}
.lp-input-wrap:focus-within .lp-input-icon { color: var(--amber); }

.lp-input {
  width: 100%;
  padding: 13px 14px 13px 42px;
  background: var(--ivory);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: 'DM Sans', sans-serif;
  font-size: 14px; color: var(--ink);
  outline: none;
  transition: border-color var(--t), box-shadow var(--t), background var(--t);
  box-shadow: var(--shadow-sm);
}
.lp-input::placeholder { color: #C0BAB2; }
.lp-input:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3.5px rgba(212,134,10,0.1), var(--shadow-sm);
  background: #fff;
}
.lp-input:hover:not(:focus) { border-color: rgba(42,39,35,0.2); }
.lp-input.has-toggle { padding-right: 44px; }

.lp-eye-btn {
  position: absolute; right: 12px;
  background: none; border: none; cursor: pointer;
  color: var(--warm-grey); padding: 4px; border-radius: 5px;
  display: flex; align-items: center;
  transition: color var(--t), background var(--t);
}
.lp-eye-btn:hover { color: var(--text-body); background: var(--ivory-dark); }

/* ── Submit ── */
.lp-submit {
  width: 100%; padding: 15px;
  background: var(--charcoal); color: var(--ivory);
  border: none; border-radius: var(--radius-sm);
  font-family: 'DM Sans', sans-serif;
  font-size: 15px; font-weight: 600; cursor: pointer;
  position: relative; overflow: hidden;
  transition: background var(--t), transform 0.15s ease, box-shadow var(--t);
  box-shadow: var(--shadow-md);
  margin-top: 8px;
  display: flex; align-items: center; justify-content: center; gap: 9px;
  letter-spacing: -0.1px;
  animation: fadeUp 0.5s 0.25s ease both;
}
.lp-submit::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(212,134,10,0.15) 0%, transparent 60%);
  opacity: 0; transition: opacity var(--t);
}
.lp-submit:hover:not(:disabled)::before { opacity: 1; }
.lp-submit:hover:not(:disabled) {
  background: var(--ink);
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(26,24,21,0.18);
}
.lp-submit:active:not(:disabled) { transform: translateY(0); }
.lp-submit:disabled { opacity: 0.55; cursor: not-allowed; }

.lp-submit-accent {
  position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, var(--amber), var(--amber-light), var(--amber));
  opacity: 0; transition: opacity var(--t);
}
.lp-submit:hover:not(:disabled) .lp-submit-accent { opacity: 1; }

.lp-spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(247,245,240,0.25);
  border-top-color: var(--ivory);
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Footer ── */
.lp-footer {
  margin-top: 28px; padding-top: 24px;
  border-top: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center; gap: 18px;
  animation: fadeUp 0.5s 0.3s ease both;
}
.lp-trust-item {
  display: flex; align-items: center; gap: 5px;
  font-size: 11.5px; color: var(--warm-grey);
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (max-width: 480px) {
  .lp-card { padding: 36px 24px; }
}
`

const I = {
    Mail: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
    ),
    Lock: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    ),
    Eye: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
        </svg>
    ),
    EyeOff: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    ),
    Shield: () => (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    ),
    Check: () => (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    Zap: () => (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    ),
    Logo: () => (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M12 3L4 7.5V16.5L12 21L20 16.5V7.5L12 3Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M12 3V21M4 7.5L20 16.5M20 7.5L4 16.5" stroke="white" strokeWidth="1" strokeOpacity="0.5" strokeLinecap="round" />
            <circle cx="12" cy="12" r="2" fill="white" />
        </svg>
    ),
}

const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({ email: '', password: '' })
    const { login, isLoggingIn } = useAuthStore()

    const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }))

    const validateForm = () => {
        if (!formData.email.trim()) { toast.error('Email is required'); return false }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
            toast.error('Please enter a valid email address'); return false
        }
        if (!formData.password.trim()) { toast.error('Password is required'); return false }
        return true
    }

    const handleSubmit = async e => {
        e.preventDefault()
        if (!validateForm()) return
        try { await login(formData) } catch (err) { console.error(err) }
    }

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="lp-root">
                <div className="lp-orb lp-orb-1" />
                <div className="lp-orb lp-orb-2" />

                <div className="lp-card">

                    {/* Header */}
                    <div className="lp-header">
                        <Link to="/" className="lp-wordmark">
                            <div className="lp-logo"><I.Logo /></div>
                            <span className="lp-brand">learn<em>mind</em></span>
                        </Link>
                        <div className="lp-step-hint">Welcome back</div>
                        <h1 className="lp-title">Sign in to your<br /><em>learning space</em></h1>
                        <p className="lp-sub" style={{ marginTop: 8 }}>
                            No account yet? <Link to="/signup">Create one free</Link>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate>

                        {/* Email */}
                        <div className="lp-field">
                            <div className="lp-label">
                                <span className="lp-label-text">Email address</span>
                            </div>
                            <div className="lp-input-wrap">
                                <span className="lp-input-icon"><I.Mail /></span>
                                <input
                                    className="lp-input" type="email" name="email"
                                    placeholder="you@example.com"
                                    value={formData.email} onChange={handleChange}
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="lp-field">
                            <div className="lp-label">
                                <span className="lp-label-text">Password</span>
                                <Link to="/forgot-password" className="lp-forgot">Forgot password?</Link>
                            </div>
                            <div className="lp-input-wrap">
                                <span className="lp-input-icon"><I.Lock /></span>
                                <input
                                    className="lp-input has-toggle"
                                    type={showPassword ? 'text' : 'password'} name="password"
                                    placeholder="Your password"
                                    value={formData.password} onChange={handleChange}
                                    autoComplete="current-password"
                                />
                                <button type="button" className="lp-eye-btn"
                                    onClick={() => setShowPassword(p => !p)}>
                                    {showPassword ? <I.EyeOff /> : <I.Eye />}
                                </button>
                            </div>
                        </div>

                        {/* CTA */}
                        <button type="submit" className="lp-submit" disabled={isLoggingIn}>
                            <span className="lp-submit-accent" />
                            {isLoggingIn
                                ? <><div className="lp-spinner" />Signing you in…</>
                                : <>Sign in &rarr;</>
                            }
                        </button>

                    </form>

                    {/* Trust footer */}
                    <div className="lp-footer">
                        {[
                            [<I.Shield />, 'SSL Secured'],
                            [<I.Check />, 'No spam, ever'],
                            [<I.Zap />, 'AI-powered'],
                        ].map(([icon, label]) => (
                            <span className="lp-trust-item" key={label}>{icon}<span>{label}</span></span>
                        ))}
                    </div>

                </div>
            </div>
        </>
    )
}

export default LoginPage