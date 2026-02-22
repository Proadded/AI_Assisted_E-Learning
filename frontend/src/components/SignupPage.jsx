import React, { useState } from 'react'
import { toast } from 'react-hot-toast'
import useAuthStore from '../store/useAuthStore'

/* ─────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────── */
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
  --radius:      14px;
  --radius-sm:   8px;
  --t:           0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
*, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
html { scroll-behavior: smooth; }
body { font-family: 'DM Sans', sans-serif; background: var(--ivory); color: var(--charcoal); -webkit-font-smoothing: antialiased; }

/* ── Shell ── */
.sp-root {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  position: relative; overflow: hidden;
}
.sp-root::before {
  content: '';
  position: fixed; inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
  pointer-events: none; z-index: 0; opacity: 0.6;
}

.sp-hero { 
  animation: fadeUp 0.85s 0.15s cubic-bezier(0.16, 1, 0.3, 1) both;
  flex-shrink: 0;
}

.sp-wordmark {
  display: flex; align-items: center; gap: 11px;
  animation: fadeUp 0.75s cubic-bezier(0.16, 1, 0.3, 1) both;
  flex-shrink: 0;
}   

/* ══ LEFT PANEL ══ */
.sp-left {
  position: relative;
  background: var(--charcoal);
  display: flex; flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 40px;
  padding: 52px 56px; z-index: 1; overflow: hidden;
}
.sp-left::after {
  content: '';
  position: absolute; top: -120px; right: -120px;
  width: 480px; height: 480px;
  background: radial-gradient(circle, rgba(212,134,10,0.18) 0%, transparent 65%);
  pointer-events: none;
}
.sp-left-grid {
  position: absolute; inset: 0; pointer-events: none;
  background-image: radial-gradient(circle, rgba(247,245,240,0.07) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
}

.sp-wordmark {
  display: flex; align-items: center; gap: 11px;
  animation: fadeUp 0.6s ease both;
}
.sp-logo {
  width: 38px; height: 38px;
  background: linear-gradient(135deg, var(--amber) 0%, var(--amber-light) 100%);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 0 1px rgba(212,134,10,0.3), 0 4px 16px rgba(212,134,10,0.25);
}
.sp-brand {
  font-family: 'DM Serif Display', serif;
  font-size: 22px; color: var(--ivory); letter-spacing: -0.3px;
}
.sp-brand em {
  font-style: italic;
  background: linear-gradient(90deg, var(--amber-light), var(--amber));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sp-hero { animation: fadeUp 0.7s 0.1s ease both; }
.sp-eyebrow {
  display: inline-flex; align-items: center; gap: 7px;
  font-family: 'DM Mono', monospace;
  font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase;
  color: var(--amber-light); margin-bottom: 22px;
}
.sp-eyebrow-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--amber); box-shadow: 0 0 8px var(--amber);
  animation: pulse 2.5s ease infinite;
}
@keyframes pulse {
  0%,100% { opacity:1; transform: scale(1); }
  50%      { opacity:0.5; transform: scale(0.7); }
}
.sp-headline {
  font-family: 'DM Serif Display', serif;
  font-size: clamp(34px, 3.2vw, 50px);
  line-height: 1.12; color: var(--ivory);
  letter-spacing: -1px; margin-bottom: 20px;
}
.sp-headline em { font-style: italic; color: var(--amber-light); }
.sp-subline {
  font-size: 15px; font-weight: 300;
  color: var(--warm-grey); line-height: 1.75;
  max-width: 340px;
}

.sp-ai-card {
  margin-top: 44px;
  background: rgba(247,245,240,0.05);
  border: 1px solid rgba(247,245,240,0.09);
  border-radius: var(--radius); padding: 20px 22px;
  animation: fadeUp 0.85s 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
  position: relative; overflow: hidden;
}
.sp-ai-card::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, var(--amber), transparent);
  opacity: 0.5;
}
.sp-ai-label {
  font-family: 'DM Mono', monospace;
  font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase;
  color: var(--amber-light); margin-bottom: 10px; opacity: 0.8;
}
.sp-ai-message {
  font-size: 13.5px; font-weight: 300;
  color: var(--ivory-dark); line-height: 1.6; margin-bottom: 14px;
}
.sp-ai-message strong { color: var(--ivory); font-weight: 500; }
.sp-ai-tags { display: flex; flex-wrap: wrap; gap: 7px; }
.sp-ai-tag {
  font-size: 11.5px; font-weight: 500;
  padding: 4px 11px; border-radius: 20px;
  border: 1px solid rgba(212,134,10,0.3);
  color: var(--amber-light); background: rgba(212,134,10,0.08);
}

/* Social proof */
.sp-proof {
  display: flex; align-items: center; gap: 14px;
  animation: fadeUp 0.85s 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.sp-avatars { display: flex; }
.sp-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  border: 2px solid var(--charcoal);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600; color: var(--charcoal);
  margin-left: -8px;
}
.sp-avatar:first-child { margin-left: 0; }
.sp-proof-text { font-size: 12.5px; color: var(--warm-grey); font-weight: 300; }
.sp-proof-text strong { color: var(--ivory); font-weight: 500; }

/* ══ RIGHT PANEL ══ */
.sp-right {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 52px 64px;
  background: var(--ivory);
  position: relative; z-index: 1; overflow-y: auto;
}
.sp-right::before {
  content: '';
  position: absolute; top: -80px; right: -80px;
  width: 320px; height: 320px;
  background: radial-gradient(circle, rgba(212,134,10,0.07) 0%, transparent 70%);
  pointer-events: none;
}

.sp-form-wrap {
  width: 100%; max-width: 400px;
  animation: fadeUp 0.8s 0.1s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.sp-form-header { margin-bottom: 36px; }
.sp-step-hint {
  font-family: 'DM Mono', monospace;
  font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
  color: var(--amber); margin-bottom: 10px;
  display: flex; align-items: center; gap: 8px;
}
.sp-step-hint::after {
  content: ''; flex: 1; height: 1px;
  background: linear-gradient(90deg, var(--amber-pale), transparent);
  max-width: 60px;
}
.sp-form-title {
  font-family: 'DM Serif Display', serif;
  font-size: 30px; letter-spacing: -0.6px;
  color: var(--ink); margin-bottom: 7px;
}
.sp-form-title em { font-style: italic; color: var(--amber); }
.sp-form-sub {
  font-size: 14px; font-weight: 300;
  color: var(--text-muted); line-height: 1.5;
}
.sp-form-sub a {
  color: var(--amber); text-decoration: none; font-weight: 500;
  border-bottom: 1px solid rgba(212,134,10,0.3);
  transition: border-color var(--t);
}
.sp-form-sub a:hover { border-color: var(--amber); }

/* Fields */
.sp-field { margin-bottom: 18px; }
.sp-label {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 7px;
}
.sp-label-text { font-size: 12px; font-weight: 500; color: var(--text-body); letter-spacing: 0.2px; }
.sp-input-wrap { position: relative; display: flex; align-items: center; }
.sp-input-icon {
  position: absolute; left: 14px;
  color: var(--warm-grey); pointer-events: none;
  transition: color var(--t);
  display: flex; align-items: center;
}
.sp-input-wrap:focus-within .sp-input-icon { color: var(--amber); }
.sp-input {
  width: 100%;
  padding: 13px 14px 13px 42px;
  background: #fff;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: 'DM Sans', sans-serif;
  font-size: 14px; color: var(--ink);
  outline: none;
  transition: border-color var(--t), box-shadow var(--t), background var(--t);
  box-shadow: var(--shadow-sm);
}
.sp-input::placeholder { color: #C0BAB2; }
.sp-input:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3.5px rgba(212,134,10,0.1), var(--shadow-sm);
}
.sp-input:hover:not(:focus) { border-color: rgba(42,39,35,0.2); }
.sp-input.has-toggle { padding-right: 44px; }

.sp-eye-btn {
  position: absolute; right: 12px;
  background: none; border: none; cursor: pointer;
  color: var(--warm-grey); padding: 4px; border-radius: 5px;
  display: flex; align-items: center;
  transition: color var(--t), background var(--t);
}
.sp-eye-btn:hover { color: var(--text-body); background: var(--ivory-dark); }

/* Password strength */
.sp-strength { margin-top: 7px; display: flex; gap: 4px; }
.sp-strength-bar {
  flex: 1; height: 3px; border-radius: 2px;
  background: var(--ivory-dark);
  transition: background 0.35s ease;
}
.sp-strength-bar.active-weak   { background: #E07070; }
.sp-strength-bar.active-fair   { background: #E0A83A; }
.sp-strength-bar.active-strong { background: #5CB87A; }

/* Role selection */
.sp-role-group {
  display: flex; gap: 10px;
}
.sp-role-opt {
  flex: 1;
  padding: 12px;
  text-align: center;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 13.5px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--t);
  background: #fff;
}
.sp-role-opt:hover {
  border-color: rgba(42,39,35,0.2);
}
.sp-role-opt.active {
  border-color: var(--amber);
  background: var(--amber-pale);
  color: var(--amber-light);
}
.sp-role-opt input {
  display: none;
}

/* Divider */
.sp-divider { display: flex; align-items: center; gap: 14px; margin: 22px 0; }
.sp-divider-line { flex: 1; height: 1px; background: var(--border); }
.sp-divider-label {
  font-family: 'DM Mono', monospace;
  font-size: 10px; color: var(--warm-grey);
  letter-spacing: 1px; text-transform: uppercase;
}

/* Submit */
.sp-submit {
  width: 100%; padding: 15px;
  background: var(--charcoal); color: var(--ivory);
  border: none; border-radius: var(--radius-sm);
  font-family: 'DM Sans', sans-serif;
  font-size: 15px; font-weight: 600; cursor: pointer;
  position: relative; overflow: hidden;
  transition: background var(--t), transform 0.15s ease, box-shadow var(--t);
  box-shadow: var(--shadow-md);
  margin-top: 6px;
  display: flex; align-items: center; justify-content: center; gap: 9px;
  letter-spacing: -0.1px;
}
.sp-submit::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(212,134,10,0.15) 0%, transparent 60%);
  opacity: 0; transition: opacity var(--t);
}
.sp-submit:hover:not(:disabled)::before { opacity: 1; }
.sp-submit:hover:not(:disabled) {
  background: var(--ink);
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(26,24,21,0.18);
}
.sp-submit:active:not(:disabled) { transform: translateY(0); }
.sp-submit:disabled { opacity: 0.55; cursor: not-allowed; }
.sp-submit-accent {
  position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, var(--amber), var(--amber-light), var(--amber));
  opacity: 0; transition: opacity var(--t);
}
.sp-submit:hover:not(:disabled) .sp-submit-accent { opacity: 1; }

.sp-spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(247,245,240,0.25);
  border-top-color: var(--ivory);
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Terms & trust */
.sp-terms {
  text-align: center; margin-top: 18px;
  font-size: 12px; font-weight: 300; color: var(--text-muted); line-height: 1.65;
}
.sp-terms a {
  color: var(--text-body); text-decoration: underline;
  text-decoration-color: var(--border);
  transition: text-decoration-color var(--t);
}
.sp-terms a:hover { text-decoration-color: var(--amber); }

.sp-trust {
  display: flex; align-items: center; justify-content: center; gap: 18px;
  margin-top: 28px; padding-top: 24px;
  border-top: 1px solid var(--border);
}
.sp-trust-item {
  display: flex; align-items: center; gap: 5px;
  font-size: 11.5px; color: var(--warm-grey);
}

/* Animations */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* Responsive */
@media (max-width: 860px) {
  .sp-root { grid-template-columns: 1fr; }
  .sp-left { display: none; }
  .sp-right { padding: 36px 24px; justify-content: flex-start; padding-top: 52px; }
}
`

/* ── Icons ── */
const I = {
    User: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    Mail: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>,
    Lock: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
    Eye: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
    EyeOff: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>,
    Shield: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    Check: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
    Zap: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
    Logo: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3L4 7.5V16.5L12 21L20 16.5V7.5L12 3Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" /><path d="M12 3V21M4 7.5L20 16.5M20 7.5L4 16.5" stroke="white" strokeWidth="1" strokeOpacity="0.5" strokeLinecap="round" /><circle cx="12" cy="12" r="2" fill="white" /></svg>,
}

/* ── Password strength ── */
function getStrength(pwd) {
    if (!pwd) return 0
    let s = 0
    if (pwd.length >= 8) s++
    if (/[A-Z]/.test(pwd)) s++
    if (/[0-9]/.test(pwd)) s++
    if (/[^A-Za-z0-9]/.test(pwd)) s++
    return s
}

/* ── Component ── */
const SignupPage = () => {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '', role: '' })
    const { signup, isSigningUp } = useAuthStore()

    const strength = getStrength(formData.password)
    const strengthClass = strength <= 1 ? 'weak' : strength <= 2 ? 'fair' : 'strong'
    const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
    const strengthColor = { weak: '#C0645A', fair: '#C08A2A', strong: '#5CB87A' }[strengthClass]

    const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }))

    const validateForm = () => {
        if (!formData.fullName.trim()) { toast.error('Name is required'); return false }
        if (!formData.email.trim()) { toast.error('Email is required'); return false }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) { toast.error('Please enter a valid email address'); return false }
        if (!formData.password.trim()) { toast.error('Password is required'); return false }
        if (!formData.confirmPassword.trim()) { toast.error('Confirm password is required'); return false }
        if (!formData.role.trim()) { toast.error('Role is required'); return false }
        if (formData.password !== formData.confirmPassword) { toast.error('Passwords do not match'); return false }
        return true
    }

    const handleSubmit = async e => {
        e.preventDefault()
        if (!validateForm()) return
        try { await signup(formData) } catch (err) { console.error(err) }
    }

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="sp-root">

                {/* ══ LEFT ══ */}
                <div className="sp-left">
                    <div className="sp-left-grid" />

                    <div className="sp-wordmark">
                        <div className="sp-logo"><I.Logo /></div>
                        <span className="sp-brand">learn<em>mind</em></span>
                    </div>

                    <div className="sp-hero">
                        <div className="sp-eyebrow">
                            <span className="sp-eyebrow-dot" />
                            AI-Powered Education
                        </div>
                        <h1 className="sp-headline">
                            Think deeper.<br />Learn <em>faster.</em><br />Grow further.
                        </h1>
                        <p className="sp-subline">
                            An intelligent learning environment that understands how you think — and builds a curriculum shaped entirely around you.
                        </p>

                        <div className="sp-ai-card">
                            <div className="sp-ai-label">✦ AI Tutor · Active</div>
                            <p className="sp-ai-message">
                                Based on your interests, I've prepared a <strong>personalised learning path</strong> in Machine Learning &amp; Product Design — ready to start the moment you join.
                            </p>
                            <div className="sp-ai-tags">
                                {['Neural Networks', 'UX Research', 'Python', 'Design Systems'].map(t => (
                                    <span className="sp-ai-tag" key={t}>{t}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>

                {/* ══ RIGHT ══ */}
                <div className="sp-right">
                    <div className="sp-form-wrap">
                        <div className="sp-form-header">
                            <div className="sp-step-hint">Create your account</div>
                            <h2 className="sp-form-title">Begin your<br /><em>learning journey</em></h2>
                            <p className="sp-form-sub">
                                Already a member? <a href="/login">Login</a>
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} noValidate>
                            {/* Name */}
                            <div className="sp-field">
                                <div className="sp-label"><span className="sp-label-text">Full name</span></div>
                                <div className="sp-input-wrap">
                                    <span className="sp-input-icon"><I.User /></span>
                                    <input className="sp-input" type="text" name="fullName"
                                        placeholder="Your full name" value={formData.fullName}
                                        onChange={handleChange} autoComplete="name" />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="sp-field">
                                <div className="sp-label"><span className="sp-label-text">Email address</span></div>
                                <div className="sp-input-wrap">
                                    <span className="sp-input-icon"><I.Mail /></span>
                                    <input className="sp-input" type="email" name="email"
                                        placeholder="you@example.com" value={formData.email}
                                        onChange={handleChange} autoComplete="email" />
                                </div>
                            </div>

                            {/* Role Selection */}
                            <div className="sp-field">
                                <div className="sp-label"><span className="sp-label-text">I want to...</span></div>
                                <div className="sp-role-group">
                                    <label className={`sp-role-opt ${formData.role === 'student' ? 'active' : ''}`}>
                                        <input type="radio" name="role" value="student" checked={formData.role === 'student'} onChange={handleChange} />
                                        <span>Learn as a Student</span>
                                    </label>
                                    <label className={`sp-role-opt ${formData.role === 'tutor' ? 'active' : ''}`}>
                                        <input type="radio" name="role" value="tutor" checked={formData.role === 'tutor'} onChange={handleChange} />
                                        <span>Teach as a Tutor</span>
                                    </label>
                                </div>
                            </div>

                            <div className="sp-divider">
                                <div className="sp-divider-line" />
                                <span className="sp-divider-label">Security</span>
                                <div className="sp-divider-line" />
                            </div>

                            {/* Password */}
                            <div className="sp-field">
                                <div className="sp-label">
                                    <span className="sp-label-text">Password</span>
                                    {formData.password && (
                                        <span style={{ fontSize: 11, fontWeight: 500, color: strengthColor }}>
                                            {strengthLabel}
                                        </span>
                                    )}
                                </div>
                                <div className="sp-input-wrap">
                                    <span className="sp-input-icon"><I.Lock /></span>
                                    <input className="sp-input has-toggle"
                                        type={showPassword ? 'text' : 'password'} name="password"
                                        placeholder="Create a strong password" value={formData.password}
                                        onChange={handleChange} autoComplete="new-password" />
                                    <button type="button" className="sp-eye-btn"
                                        onClick={() => setShowPassword(p => !p)}>
                                        {showPassword ? <I.EyeOff /> : <I.Eye />}
                                    </button>
                                </div>
                                {formData.password && (
                                    <div className="sp-strength">
                                        {[1, 2, 3, 4].map(n => (
                                            <div key={n} className={`sp-strength-bar ${strength >= n ? `active-${strengthClass}` : ''}`} />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Confirm */}
                            <div className="sp-field">
                                <div className="sp-label"><span className="sp-label-text">Confirm password</span></div>
                                <div className="sp-input-wrap">
                                    <span className="sp-input-icon"><I.Lock /></span>
                                    <input className="sp-input has-toggle"
                                        type={showConfirm ? 'text' : 'password'} name="confirmPassword"
                                        placeholder="Repeat your password" value={formData.confirmPassword}
                                        onChange={handleChange} autoComplete="new-password" />
                                    <button type="button" className="sp-eye-btn"
                                        onClick={() => setShowConfirm(p => !p)}>
                                        {showConfirm ? <I.EyeOff /> : <I.Eye />}
                                    </button>
                                </div>
                            </div>

                            {/* CTA */}
                            <button type="submit" className="sp-submit" disabled={isSigningUp}>
                                <span className="sp-submit-accent" />
                                {isSigningUp
                                    ? <><div className="sp-spinner" />Creating your account…</>
                                    : <>Create free account &rarr;</>}
                            </button>

                            <p className="sp-terms">
                                By creating an account you agree to our{' '}
                                <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.
                            </p>

                            <div className="sp-trust">
                                {[
                                    [<I.Shield />, 'SSL Secured'],
                                    [<I.Check />, 'Free forever plan'],
                                    [<I.Zap />, 'AI-powered'],
                                ].map(([icon, label]) => (
                                    <span className="sp-trust-item" key={label}>{icon}<span>{label}</span></span>
                                ))}
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </>
    )
}

export default SignupPage