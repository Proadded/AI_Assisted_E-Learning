import React from 'react'
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
  --border:      rgba(42,39,35,0.1);
  --t:           0.22s cubic-bezier(0.4,0,0.2,1);
}

.nb-root {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  height: 64px;
  display: flex; align-items: center;
  padding: 0 40px;
  background: rgba(247,245,240,0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  justify-content: space-between;
  font-family: 'DM Sans', sans-serif;
}

/* subtle top amber line */
.nb-root::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent 0%, var(--amber) 40%, var(--amber-light) 60%, transparent 100%);
  opacity: 0.5;
}

/* ── Logo ── */
.nb-wordmark {
  display: flex; align-items: center; gap: 10px;
  text-decoration: none;
}
.nb-logo {
  width: 34px; height: 34px;
  background: linear-gradient(135deg, var(--amber) 0%, var(--amber-light) 100%);
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 0 1px rgba(212,134,10,0.25), 0 3px 12px rgba(212,134,10,0.2);
  flex-shrink: 0;
}
.nb-brand {
  font-family: 'DM Serif Display', serif;
  font-size: 20px; color: var(--charcoal); letter-spacing: -0.3px;
  line-height: 1;
}
.nb-brand em {
  font-style: italic;
  background: linear-gradient(90deg, var(--amber), var(--amber-light));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ── Right side ── */
.nb-right {
  display: flex; align-items: center; gap: 10px;
}

/* greeting */
.nb-greeting {
  font-size: 13.5px; font-weight: 400;
  color: var(--charcoal);
  font-family: 'DM Mono', monospace;
  letter-spacing: -0.2px;
  padding-right: 4px;
}
.nb-greeting strong {
  color: var(--charcoal); font-weight: 500;
}

/* divider pip */
.nb-pip {
  width: 1px; height: 18px;
  background: var(--border);
  margin: 0 4px;
}

/* Courses button */
.nb-btn-courses {
  padding: 8px 18px;
  background: var(--charcoal);
  color: var(--ivory);
  border: none; border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13.5px; font-weight: 500;
  cursor: pointer; text-decoration: none;
  display: inline-flex; align-items: center; gap: 6px;
  transition: background var(--t), transform 0.15s ease, box-shadow var(--t);
  box-shadow: 0 1px 4px rgba(26,24,21,0.12);
  position: relative; overflow: hidden;
  letter-spacing: -0.1px;
}
.nb-btn-courses::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(212,134,10,0.15) 0%, transparent 60%);
  opacity: 0; transition: opacity var(--t);
}
.nb-btn-courses:hover::before { opacity: 1; }
.nb-btn-courses:hover {
  background: var(--ink);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(26,24,21,0.18);
}
.nb-btn-courses:active { transform: translateY(0); }

/* Logout button */
.nb-btn-logout {
  padding: 8px 16px;
  background: transparent;
  color: var(--warm-grey);
  border: 1.5px solid var(--border);
  border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 13.5px; font-weight: 400;
  cursor: pointer;
  display: inline-flex; align-items: center; gap: 6px;
  transition: color var(--t), border-color var(--t), background var(--t);
  letter-spacing: -0.1px;
}
.nb-btn-logout:hover {
  color: var(--charcoal);
  border-color: rgba(42,39,35,0.25);
  background: var(--ivory-dark);
}

@media (max-width: 600px) {
  .nb-root { padding: 0 20px; }
  .nb-greeting { display: none; }
  .nb-pip { display: none; }
}
`

const LogoMark = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 3L4 7.5V16.5L12 21L20 16.5V7.5L12 3Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M12 3V21M4 7.5L20 16.5M20 7.5L4 16.5" stroke="white" strokeWidth="1" strokeOpacity="0.5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="2" fill="white" />
    </svg>
)

const Navbar = () => {
    const { authUser, logout } = useAuthStore()
    const role = authUser?.role
    const isStudent = role === "student"

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <nav className="nb-root">

                {/* Logo — always visible */}
                <a href="/" className="nb-wordmark">
                    <div className="nb-logo"><LogoMark /></div>
                    <span className="nb-brand">learn<em>mind</em></span>
                </a>

                {/* Right side — only when logged in */}
                {authUser && (
                    <div className="nb-right">
                        <span className="nb-greeting">
                            Hey, <strong>{authUser.name || authUser.fullName || 'there'}</strong>
                        </span>

                        <div className="nb-pip" />

                        <a href={isStudent ? "/dashboard" : "/tutor"} className="nb-btn-courses">
                            Dashboard
                        </a>

                        <a href="/course" className="nb-btn-courses">
                            Courses
                        </a>

                        <button className="nb-btn-logout" onClick={logout}>
                            Log out
                        </button>
                    </div>
                )}

            </nav>
        </>
    )
}

export default Navbar