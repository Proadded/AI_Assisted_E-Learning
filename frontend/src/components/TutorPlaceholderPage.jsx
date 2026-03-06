import React, { useEffect, useState } from 'react'
import garfield from './IMG-20260307-WA0000.png'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

:root {
  --ivory:        #F7F5F0;
  --ivory-dark:   #EDE9E1;
  --charcoal:     #2A2723;
  --ink:          #1A1815;
  --amber:        #D4860A;
  --amber-light:  #F0A830;
  --amber-pale:   #FDF3E1;
  --warm-grey:    #C8C2B8;
  --text-muted:   #7A756D;
  --border:       rgba(42,39,35,0.09);
  --t:            0.24s cubic-bezier(0.4,0,0.2,1);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }

body {
  background: var(--ivory);
  overflow: hidden;
}

/* noise */
body::before {
  content: '';
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.022'/%3E%3C/svg%3E");
  opacity: 0.55;
}

/* ── Shell ── */
.p404-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 20px;
}

/* ambient orbs */
.p404-orb {
  position: fixed; border-radius: 50%; pointer-events: none; z-index: 0;
  filter: blur(90px);
}
.p404-orb-1 {
  width: 560px; height: 560px;
  background: radial-gradient(circle, rgba(212,134,10,0.08) 0%, transparent 65%);
  top: -180px; left: -120px;
  animation: orbFloat 14s ease-in-out infinite alternate;
}
.p404-orb-2 {
  width: 420px; height: 420px;
  background: radial-gradient(circle, rgba(212,134,10,0.06) 0%, transparent 65%);
  bottom: -120px; right: -80px;
  animation: orbFloat 18s ease-in-out infinite alternate-reverse;
}
@keyframes orbFloat {
  from { transform: translate(0,0); }
  to   { transform: translate(18px,-18px); }
}

/* ── Top badge ── */
.p404-badge {
  position: relative; z-index: 10;
  display: inline-flex; align-items: center; gap: 7px;
  font-family: 'DM Mono', monospace;
  font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase;
  color: var(--amber);
  background: var(--amber-pale);
  border: 1px solid rgba(212,134,10,0.25);
  padding: 5px 14px; border-radius: 20px;
  margin-bottom: 28px;
  animation: fadeDown 0.6s ease both;
}
.p404-badge-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--amber); box-shadow: 0 0 8px var(--amber);
  animation: pulse 2.5s ease infinite;
}
@keyframes pulse {
  0%,100% { opacity:1; transform:scale(1); }
  50%      { opacity:0.4; transform:scale(0.6); }
}

/* ── 404 number stage ── */
.p404-stage {
  position: relative; z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: 0;
  animation: fadeUp 0.7s 0.1s ease both;
}

/* The giant digits */
.p404-digit {
  font-family: 'DM Serif Display', serif;
  font-size: clamp(160px, 22vw, 280px);
  line-height: 1;
  letter-spacing: -8px;
  color: var(--ink);
  opacity: 0.08;
  user-select: none;
  position: relative;
  z-index: 1;
}

/* The zero in the middle has Garfield layered on it */
.p404-zero-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.p404-zero-wrap .p404-digit {
  /* zero is slightly more visible */
  opacity: 0.07;
}

/* Garfield image — sits ON TOP of the zero, centered */
.p404-garfield {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: clamp(180px, 22vw, 300px);
  z-index: 10;
  filter: drop-shadow(0 20px 48px rgba(26,24,21,0.18));
  animation: garfieldIn 0.85s cubic-bezier(0.22,1,0.36,1) 0.25s both, garfieldFloat 5s ease-in-out 1.2s infinite alternate;
  pointer-events: none;
}
@keyframes garfieldIn {
  from { opacity: 0; transform: translateX(-50%) translateY(40px) scale(0.88); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1); }
}
@keyframes garfieldFloat {
  from { transform: translateX(-50%) translateY(0px); }
  to   { transform: translateX(-50%) translateY(-10px); }
}

/* ── Text below ── */
.p404-content {
  position: relative; z-index: 10;
  text-align: center;
  margin-top: -8px;
  animation: fadeUp 0.65s 0.35s ease both;
}

.p404-title {
  font-family: 'DM Serif Display', serif;
  font-size: clamp(22px, 3vw, 34px);
  letter-spacing: -0.6px;
  color: var(--ink);
  margin-bottom: 10px;
  line-height: 1.2;
}
.p404-title em { font-style: italic; color: var(--amber); }

.p404-sub {
  font-size: 15px; font-weight: 300;
  color: var(--text-muted); line-height: 1.7;
  max-width: 400px; margin: 0 auto 28px;
}

/* notify form */
.p404-notify {
  display: flex; gap: 8px;
  max-width: 360px; margin: 0 auto 24px;
  animation: fadeUp 0.65s 0.45s ease both;
}
.p404-input {
  flex: 1;
  padding: 11px 16px;
  background: #fff;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13.5px; color: var(--ink);
  outline: none;
  transition: border-color var(--t), box-shadow var(--t);
  box-shadow: 0 1px 4px rgba(26,24,21,0.05);
}
.p404-input::placeholder { color: #C0BAB2; }
.p404-input:focus {
  border-color: rgba(212,134,10,0.45);
  box-shadow: 0 0 0 3px rgba(212,134,10,0.1);
}
.p404-notify-btn {
  padding: 11px 20px;
  background: var(--charcoal); color: var(--ivory);
  border: none; border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13.5px; font-weight: 600;
  cursor: pointer; white-space: nowrap;
  transition: background var(--t), transform 0.15s ease, box-shadow var(--t);
  box-shadow: 0 2px 10px rgba(26,24,21,0.12);
  position: relative; overflow: hidden;
}
.p404-notify-btn::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(212,134,10,0.2) 0%, transparent 55%);
  opacity: 0; transition: opacity var(--t);
}
.p404-notify-btn:hover::before { opacity: 1; }
.p404-notify-btn:hover { background: var(--ink); transform: translateY(-1px); box-shadow: 0 5px 18px rgba(26,24,21,0.18); }
.p404-notify-btn:active { transform: translateY(0); }

.p404-notify-btn.sent {
  background: #5CB87A; pointer-events: none;
}

/* back link */
.p404-back {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  font-family: 'DM Mono', monospace;
  letter-spacing: 0.3px;
  transition: color var(--t);
  animation: fadeUp 0.65s 0.5s ease both;
}
.p404-back:hover { color: var(--amber); }
.p404-back svg { transition: transform var(--t); }
.p404-back:hover svg { transform: translateX(-3px); }

/* ── Animations ── */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeDown {
  from { opacity: 0; transform: translateY(-14px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Responsive ── */
@media (max-width: 540px) {
  .p404-notify { flex-direction: column; }
  .p404-garfield { width: clamp(140px, 45vw, 200px); }
}
`

const ArrowLeft = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)

const TutorPlaceholderPage = () => {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleNotify = () => {
    if (!email.trim()) return
    setSent(true)
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="p404-root">
        <div className="p404-orb p404-orb-1" />
        <div className="p404-orb p404-orb-2" />

        {/* Badge */}
        <div className="p404-badge">
          <span className="p404-badge-dot" />
          Instructors page · Coming soon
        </div>

        {/* 404 with Garfield */}
        <div className="p404-stage">
          <span className="p404-digit">4</span>

          <div className="p404-zero-wrap">
            <span className="p404-digit">0</span>
            <img
              src={garfield}
              alt="Garfield looking confused"
              className="p404-garfield"
            />
          </div>

          <span className="p404-digit">4</span>
        </div>

        {/* Text */}
        <div className="p404-content">
          <h1 className="p404-title">
            Even Garfield couldn't find<br /><em>this page.</em>
          </h1>
          <p className="p404-sub">
            The Instructors dashboard is still being built. Leave your email and we'll let you know the moment it's ready — probably before Monday. Maybe.
          </p>

          {/* Notify */}
          <div className="p404-notify">
            <input
              className="p404-input"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNotify()}
              disabled={sent}
            />
            <button
              className={`p404-notify-btn ${sent ? 'sent' : ''}`}
              onClick={handleNotify}
            >
              {sent ? '✓ Done!' : 'Notify me'}
            </button>
          </div>

          <a href="/" className="p404-back">
            <ArrowLeft /> Back to homepage
          </a>
        </div>
      </div>
    </>
  )
}

export default TutorPlaceholderPage