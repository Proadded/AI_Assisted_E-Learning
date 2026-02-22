import React, { useEffect, useRef, useState } from 'react'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

:root {
  --ivory:        #F7F5F0;
  --ivory-dark:   #EDE9E1;
  --ivory-mid:    #F2EFE8;
  --warm-grey:    #C8C2B8;
  --charcoal:     #2A2723;
  --ink:          #1A1815;
  --amber:        #D4860A;
  --amber-light:  #F0A830;
  --amber-pale:   #FDF3E1;
  --amber-border: rgba(212,134,10,0.2);
  --text-muted:   #7A756D;
  --text-body:    #4A4540;
  --border:       rgba(42,39,35,0.09);
  --shadow-sm:    0 1px 4px rgba(26,24,21,0.06);
  --shadow-md:    0 4px 20px rgba(26,24,21,0.08);
  --shadow-lg:    0 20px 60px rgba(26,24,21,0.1);
  --t:            0.24s cubic-bezier(0.4,0,0.2,1);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  font-family: 'DM Sans', sans-serif;
  background: var(--ivory);
  color: var(--charcoal);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

/* ─── noise texture ─── */
body::before {
  content: '';
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.022'/%3E%3C/svg%3E");
  opacity: 0.55;
}

/* ══════════════════════════════════════
   HERO
══════════════════════════════════════ */
.hero {
  min-height: 100vh;
  display: flex; align-items: center;
  padding: 120px 80px 80px;
  position: relative; overflow: hidden;
}

.hero-orb {
  position: absolute; border-radius: 50%; pointer-events: none;
  filter: blur(90px);
}
.hero-orb-1 {
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(212,134,10,0.09) 0%, transparent 65%);
  top: -180px; right: -100px;
  animation: orbDrift 16s ease-in-out infinite alternate;
}
.hero-orb-2 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, rgba(42,39,35,0.04) 0%, transparent 70%);
  bottom: -80px; left: -80px;
  animation: orbDrift 20s ease-in-out infinite alternate-reverse;
}
@keyframes orbDrift {
  from { transform: translate(0,0); }
  to   { transform: translate(20px,-20px); }
}

.hero-inner {
  max-width: 1200px; margin: 0 auto; width: 100%;
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 80px; align-items: center;
  position: relative; z-index: 1;
}

.hero-left {}

.hero-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: 'DM Mono', monospace;
  font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase;
  color: var(--amber); margin-bottom: 24px;
  animation: fadeUp 0.6s ease both;
}
.hero-eyebrow-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--amber); box-shadow: 0 0 10px var(--amber);
  animation: pulse 2.5s ease infinite;
}
@keyframes pulse {
  0%,100% { opacity:1; transform:scale(1); }
  50%      { opacity:0.4; transform:scale(0.65); }
}

.hero-headline {
  font-family: 'DM Serif Display', serif;
  font-size: clamp(42px, 5vw, 68px);
  line-height: 1.08; letter-spacing: -1.5px;
  color: var(--ink);
  margin-bottom: 24px;
  animation: fadeUp 0.65s 0.08s ease both;
}
.hero-headline em {
  font-style: italic; color: var(--amber);
}

.hero-sub {
  font-size: 17px; font-weight: 300;
  color: var(--text-body); line-height: 1.75;
  max-width: 440px; margin-bottom: 40px;
  animation: fadeUp 0.65s 0.16s ease both;
}

.hero-ctas {
  display: flex; gap: 12px; flex-wrap: wrap;
  animation: fadeUp 0.65s 0.24s ease both;
}

.btn-primary {
  padding: 14px 28px;
  background: var(--charcoal); color: var(--ivory);
  border: none; border-radius: 9px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14.5px; font-weight: 600;
  cursor: pointer; text-decoration: none;
  display: inline-flex; align-items: center; gap: 7px;
  transition: background var(--t), transform 0.15s ease, box-shadow var(--t);
  box-shadow: var(--shadow-md);
  position: relative; overflow: hidden; letter-spacing: -0.1px;
}
.btn-primary::before {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(212,134,10,0.18) 0%, transparent 55%);
  opacity: 0; transition: opacity var(--t);
}
.btn-primary:hover::before { opacity: 1; }
.btn-primary:hover { background: var(--ink); transform: translateY(-2px); box-shadow: 0 8px 28px rgba(26,24,21,0.18); }
.btn-primary:active { transform: translateY(0); }

.btn-ghost {
  padding: 14px 26px;
  background: transparent; color: var(--charcoal);
  border: 1.5px solid var(--border);
  border-radius: 9px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14.5px; font-weight: 500;
  cursor: pointer; text-decoration: none;
  display: inline-flex; align-items: center; gap: 7px;
  transition: border-color var(--t), background var(--t), transform 0.15s ease;
  letter-spacing: -0.1px;
}
.btn-ghost:hover {
  border-color: rgba(42,39,35,0.25);
  background: var(--ivory-dark);
  transform: translateY(-2px);
}

/* AI insight card */
.hero-right {
  display: flex; justify-content: center; align-items: center;
  animation: fadeUp 0.7s 0.3s ease both;
}

.insight-card {
  width: 100%; max-width: 380px;
  background: var(--charcoal);
  border-radius: 18px;
  padding: 28px;
  box-shadow: var(--shadow-lg), 0 0 0 1px rgba(255,255,255,0.04) inset;
  position: relative; overflow: hidden;
}
.insight-card::before {
  content: '';
  position: absolute; top: -80px; right: -80px;
  width: 240px; height: 240px;
  background: radial-gradient(circle, rgba(212,134,10,0.2) 0%, transparent 65%);
  pointer-events: none;
}
.insight-card::after {
  content: '';
  position: absolute; top: 0; left: 8%; right: 8%; height: 1.5px;
  background: linear-gradient(90deg, transparent, var(--amber), var(--amber-light), transparent);
  opacity: 0.55;
}

.ic-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px;
}
.ic-label {
  font-family: 'DM Mono', monospace;
  font-size: 10px; letter-spacing: 1.8px; text-transform: uppercase;
  color: var(--amber-light); opacity: 0.9;
  display: flex; align-items: center; gap: 7px;
}
.ic-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--amber); box-shadow: 0 0 8px var(--amber);
  animation: pulse 2.5s ease infinite;
}
.ic-score {
  font-family: 'DM Serif Display', serif;
  font-size: 13px; color: rgba(247,245,240,0.4);
}
.ic-score span { color: var(--amber-light); font-size: 18px; }

.ic-student {
  font-size: 13px; font-weight: 300; color: rgba(247,245,240,0.55);
  margin-bottom: 16px; font-family: 'DM Mono', monospace;
}
.ic-student strong { color: rgba(247,245,240,0.85); font-weight: 500; }

.ic-feedback {
  font-size: 14px; font-weight: 300;
  color: rgba(247,245,240,0.75); line-height: 1.65;
  margin-bottom: 20px; border-left: 2px solid rgba(212,134,10,0.4);
  padding-left: 14px;
}
.ic-feedback strong { color: var(--ivory); font-weight: 500; }

.ic-tags-label {
  font-family: 'DM Mono', monospace;
  font-size: 9.5px; letter-spacing: 1.5px; text-transform: uppercase;
  color: rgba(247,245,240,0.3); margin-bottom: 9px;
}
.ic-tags { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 8px; }
.ic-tag {
  font-size: 11.5px; padding: 4px 11px; border-radius: 20px;
  font-weight: 500;
}
.ic-tag.weak {
  background: rgba(224,112,112,0.15); color: #F09090;
  border: 1px solid rgba(224,112,112,0.25);
}
.ic-tag.strong {
  background: rgba(92,184,122,0.15); color: #7FD49A;
  border: 1px solid rgba(92,184,122,0.25);
}

/* video thumbnail preview */
.ic-video {
  margin-top: 20px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex; align-items: center; gap: 12px;
}
.ic-video-thumb {
  width: 42px; height: 30px; border-radius: 5px;
  background: linear-gradient(135deg, rgba(212,134,10,0.3), rgba(212,134,10,0.1));
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.ic-video-info { flex: 1; min-width: 0; }
.ic-video-title {
  font-size: 12px; font-weight: 500; color: var(--ivory);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: 3px;
}
.ic-video-sub {
  font-size: 10.5px; color: rgba(247,245,240,0.35);
  font-family: 'DM Mono', monospace;
}
.ic-video-badge {
  font-size: 10px; padding: 2px 8px; border-radius: 20px;
  background: rgba(92,184,122,0.15); color: #7FD49A;
  border: 1px solid rgba(92,184,122,0.25);
  font-weight: 500; white-space: nowrap;
}

/* ══════════════════════════════════════
   HOW IT WORKS
══════════════════════════════════════ */
.hiw {
  padding: 120px 80px;
  position: relative; z-index: 1;
}
.hiw-inner { max-width: 1100px; margin: 0 auto; }

.section-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: 'DM Mono', monospace;
  font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase;
  color: var(--amber); margin-bottom: 16px;
}
.section-headline {
  font-family: 'DM Serif Display', serif;
  font-size: clamp(32px, 4vw, 46px);
  letter-spacing: -1px; color: var(--ink);
  margin-bottom: 12px; line-height: 1.15;
}
.section-headline em { font-style: italic; color: var(--amber); }
.section-sub {
  font-size: 16px; font-weight: 300;
  color: var(--text-muted); line-height: 1.7;
  max-width: 480px; margin-bottom: 64px;
}

.hiw-steps {
  display: grid; grid-template-columns: 1fr 1fr 1fr;
  gap: 0; position: relative;
}

/* dashed connector line */
.hiw-steps::before {
  content: '';
  position: absolute; top: 36px; left: calc(16.66% + 20px); right: calc(16.66% + 20px);
  height: 1px;
  background: repeating-linear-gradient(90deg, var(--amber) 0, var(--amber) 6px, transparent 6px, transparent 14px);
  opacity: 0.35;
  z-index: 0;
}

.hiw-step {
  padding: 0 32px;
  position: relative; z-index: 1;
  opacity: 0; transform: translateY(24px);
  transition: opacity 0.55s ease, transform 0.55s ease;
}
.hiw-step.visible { opacity: 1; transform: translateY(0); }
.hiw-step:nth-child(2) { transition-delay: 0.12s; }
.hiw-step:nth-child(3) { transition-delay: 0.24s; }
.hiw-step:first-child { padding-left: 0; }
.hiw-step:last-child  { padding-right: 0; }

.hiw-step-num {
  width: 52px; height: 52px; border-radius: 14px;
  background: #fff;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 24px;
  font-size: 22px;
  transition: box-shadow var(--t), transform var(--t);
}
.hiw-step:hover .hiw-step-num {
  box-shadow: var(--shadow-md), 0 0 0 3px var(--amber-pale);
  transform: translateY(-2px);
}

.hiw-step-title {
  font-family: 'DM Serif Display', serif;
  font-size: 22px; letter-spacing: -0.4px;
  color: var(--ink); margin-bottom: 10px;
}
.hiw-step-title em { font-style: italic; color: var(--amber); }
.hiw-step-desc {
  font-size: 14.5px; font-weight: 300;
  color: var(--text-muted); line-height: 1.7;
}

/* ══════════════════════════════════════
   FEATURES
══════════════════════════════════════ */
.features {
  padding: 80px 80px 120px;
  position: relative; z-index: 1;
}
.features-inner { max-width: 1100px; margin: 0 auto; }

.features-grid {
  display: flex; flex-direction: column; gap: 80px;
}

.feature-row {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 80px; align-items: center;
  opacity: 0; transform: translateY(32px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.feature-row.visible { opacity: 1; transform: translateY(0); }
.feature-row.reverse { direction: rtl; }
.feature-row.reverse > * { direction: ltr; }

.feature-text {}
.feature-tag {
  display: inline-block;
  font-family: 'DM Mono', monospace;
  font-size: 10px; letter-spacing: 1.8px; text-transform: uppercase;
  color: var(--amber);
  background: var(--amber-pale);
  border: 1px solid var(--amber-border);
  padding: 4px 12px; border-radius: 20px;
  margin-bottom: 20px;
}
.feature-title {
  font-family: 'DM Serif Display', serif;
  font-size: clamp(26px, 3vw, 36px);
  letter-spacing: -0.7px; color: var(--ink);
  line-height: 1.2; margin-bottom: 16px;
}
.feature-title em { font-style: italic; color: var(--amber); }
.feature-desc {
  font-size: 15px; font-weight: 300;
  color: var(--text-body); line-height: 1.8;
  margin-bottom: 24px;
}
.feature-points { display: flex; flex-direction: column; gap: 10px; }
.feature-point {
  display: flex; align-items: flex-start; gap: 10px;
  font-size: 14px; font-weight: 400; color: var(--text-body);
  line-height: 1.5;
}
.feature-point-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--amber); flex-shrink: 0; margin-top: 7px;
}

/* Feature visual panels */
.feature-visual {
  border-radius: 16px; overflow: hidden;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border);
}

/* AI feedback mockup */
.fv-ai {
  background: var(--charcoal);
  padding: 28px;
  position: relative; overflow: hidden;
}
.fv-ai::before {
  content: '';
  position: absolute; top: -60px; right: -60px;
  width: 220px; height: 220px;
  background: radial-gradient(circle, rgba(212,134,10,0.15) 0%, transparent 65%);
}
.fv-ai-header {
  font-family: 'DM Mono', monospace;
  font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase;
  color: var(--amber-light); margin-bottom: 16px; opacity: 0.8;
  display: flex; align-items: center; gap: 8px;
}
.fv-ai-header-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--amber); animation: pulse 2.5s ease infinite;
}
.fv-ai-score {
  display: flex; align-items: baseline; gap: 8px; margin-bottom: 18px;
}
.fv-ai-score-num {
  font-family: 'DM Serif Display', serif;
  font-size: 52px; color: var(--ivory); letter-spacing: -2px; line-height: 1;
}
.fv-ai-score-label {
  font-size: 13px; font-weight: 300; color: rgba(247,245,240,0.4);
}
.fv-ai-bar-wrap { margin-bottom: 20px; }
.fv-ai-bar-label {
  display: flex; justify-content: space-between;
  font-size: 11px; color: rgba(247,245,240,0.45);
  margin-bottom: 5px; font-family: 'DM Mono', monospace;
}
.fv-ai-bar {
  height: 4px; border-radius: 2px;
  background: rgba(255,255,255,0.07);
  overflow: hidden;
}
.fv-ai-bar-fill {
  height: 100%; border-radius: 2px;
  background: linear-gradient(90deg, var(--amber), var(--amber-light));
  animation: barGrow 1.2s 0.5s cubic-bezier(0.22,1,0.36,1) both;
}
@keyframes barGrow {
  from { width: 0 !important; }
}
.fv-ai-insight {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px; padding: 14px;
  font-size: 13px; font-weight: 300;
  color: rgba(247,245,240,0.7); line-height: 1.6;
}
.fv-ai-insight strong { color: var(--ivory); font-weight: 500; }

/* Progress dashboard mockup */
.fv-dash {
  background: #fff;
  padding: 28px;
}
.fv-dash-header {
  font-family: 'DM Mono', monospace;
  font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase;
  color: var(--text-muted); margin-bottom: 20px;
}
.fv-dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
.fv-dash-stat {
  background: var(--ivory);
  border: 1px solid var(--border);
  border-radius: 10px; padding: 14px;
}
.fv-dash-stat-num {
  font-family: 'DM Serif Display', serif;
  font-size: 28px; color: var(--ink); letter-spacing: -0.8px;
}
.fv-dash-stat-num.amber { color: var(--amber); }
.fv-dash-stat-label {
  font-size: 11px; color: var(--text-muted);
  font-family: 'DM Mono', monospace; margin-top: 3px;
}
.fv-topics { display: flex; flex-direction: column; gap: 8px; }
.fv-topic-row { display: flex; align-items: center; gap: 10px; }
.fv-topic-label { font-size: 12px; color: var(--text-body); width: 110px; flex-shrink: 0; }
.fv-topic-bar-wrap { flex: 1; height: 6px; border-radius: 3px; background: var(--ivory-dark); overflow: hidden; }
.fv-topic-bar { height: 100%; border-radius: 3px; }
.fv-topic-pct { font-size: 11px; color: var(--text-muted); font-family: 'DM Mono', monospace; width: 32px; text-align: right; }

/* Course structure mockup */
.fv-course {
  background: var(--ivory);
  padding: 28px;
}
.fv-course-title {
  font-family: 'DM Serif Display', serif;
  font-size: 18px; color: var(--ink); margin-bottom: 18px;
}
.fv-course-items { display: flex; flex-direction: column; gap: 8px; }
.fv-course-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 9px;
}
.fv-course-item.active { border-color: var(--amber-border); background: var(--amber-pale); }
.fv-ci-icon {
  width: 30px; height: 30px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; flex-shrink: 0;
}
.fv-ci-icon.done   { background: rgba(92,184,122,0.12); }
.fv-ci-icon.active { background: rgba(212,134,10,0.12); }
.fv-ci-icon.locked { background: var(--ivory-dark); }
.fv-ci-text { flex: 1; min-width: 0; }
.fv-ci-title { font-size: 13px; font-weight: 500; color: var(--charcoal); margin-bottom: 2px; }
.fv-ci-sub   { font-size: 11px; color: var(--text-muted); font-family: 'DM Mono', monospace; }
.fv-ci-badge {
  font-size: 10px; padding: 2px 8px; border-radius: 20px; font-weight: 500;
}
.fv-ci-badge.done   { background: rgba(92,184,122,0.12); color: #5CB87A; }
.fv-ci-badge.active { background: rgba(212,134,10,0.12); color: var(--amber); }
.fv-ci-badge.locked { background: var(--ivory-dark); color: var(--warm-grey); }

/* ══════════════════════════════════════
   TUTOR CTA
══════════════════════════════════════ */
.tutor-cta {
  padding: 100px 80px;
  background: var(--charcoal);
  position: relative; overflow: hidden; z-index: 1;
}
.tutor-cta::before {
  content: '';
  position: absolute; top: -120px; right: -120px;
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(212,134,10,0.14) 0%, transparent 65%);
  pointer-events: none;
}
.tutor-cta-grid {
  position: absolute; inset: 0; pointer-events: none;
  background-image: radial-gradient(circle, rgba(247,245,240,0.05) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
}
.tutor-cta-inner {
  max-width: 800px; margin: 0 auto;
  text-align: center; position: relative; z-index: 1;
  opacity: 0; transform: translateY(28px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.tutor-cta-inner.visible { opacity: 1; transform: translateY(0); }

.tutor-cta-tag {
  display: inline-block;
  font-family: 'DM Mono', monospace;
  font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
  color: var(--amber-light);
  background: rgba(212,134,10,0.12);
  border: 1px solid rgba(212,134,10,0.25);
  padding: 5px 14px; border-radius: 20px;
  margin-bottom: 24px;
}
.tutor-cta-headline {
  font-family: 'DM Serif Display', serif;
  font-size: clamp(32px, 4vw, 52px);
  line-height: 1.1; letter-spacing: -1px;
  color: var(--ivory); margin-bottom: 18px;
}
.tutor-cta-headline em { font-style: italic; color: var(--amber-light); }
.tutor-cta-sub {
  font-size: 16px; font-weight: 300;
  color: var(--warm-grey); line-height: 1.75;
  max-width: 520px; margin: 0 auto 36px;
}
.tutor-cta-sub strong { color: var(--ivory); font-weight: 500; }
.tutor-cta-steps {
  display: flex; justify-content: center; gap: 32px;
  margin-bottom: 40px; flex-wrap: wrap;
}
.tutor-cta-step {
  display: flex; align-items: center; gap: 9px;
  font-size: 13.5px; color: rgba(247,245,240,0.6);
}
.tutor-cta-step-icon {
  width: 28px; height: 28px; border-radius: 7px;
  background: rgba(212,134,10,0.15);
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; flex-shrink: 0;
}
.btn-amber {
  padding: 15px 32px;
  background: linear-gradient(135deg, var(--amber) 0%, var(--amber-light) 100%);
  color: var(--ink); border: none; border-radius: 9px;
  font-family: 'DM Sans', sans-serif;
  font-size: 15px; font-weight: 600;
  cursor: pointer; text-decoration: none;
  display: inline-flex; align-items: center; gap: 8px;
  transition: transform 0.15s ease, box-shadow var(--t), filter var(--t);
  box-shadow: 0 4px 20px rgba(212,134,10,0.35);
  letter-spacing: -0.1px;
}
.btn-amber:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(212,134,10,0.45); filter: brightness(1.05); }
.btn-amber:active { transform: translateY(0); }

/* ══════════════════════════════════════
   FOOTER
══════════════════════════════════════ */
.footer {
  padding: 64px 80px 48px;
  background: var(--ivory-mid);
  border-top: 1px solid var(--border);
  position: relative; z-index: 1;
}
.footer-inner {
  max-width: 1100px; margin: 0 auto;
  display: grid; grid-template-columns: 1.4fr 1fr 1fr;
  gap: 60px; margin-bottom: 52px;
}
.footer-brand {}
.footer-wordmark {
  display: flex; align-items: center; gap: 9px;
  margin-bottom: 14px; text-decoration: none;
}
.footer-logo {
  width: 30px; height: 30px;
  background: linear-gradient(135deg, var(--amber), var(--amber-light));
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 0 1px rgba(212,134,10,0.25);
}
.footer-brand-name {
  font-family: 'DM Serif Display', serif;
  font-size: 18px; color: var(--charcoal); letter-spacing: -0.3px;
}
.footer-brand-name em {
  font-style: italic;
  background: linear-gradient(90deg, var(--amber), var(--amber-light));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.footer-tagline {
  font-size: 13.5px; font-weight: 300;
  color: var(--text-muted); line-height: 1.65; max-width: 240px;
}
.footer-col-title {
  font-family: 'DM Mono', monospace;
  font-size: 10px; letter-spacing: 1.8px; text-transform: uppercase;
  color: var(--charcoal); margin-bottom: 18px;
}
.footer-links { display: flex; flex-direction: column; gap: 11px; }
.footer-link {
  font-size: 14px; font-weight: 300; color: var(--text-muted);
  text-decoration: none;
  transition: color var(--t);
  display: inline-block;
}
.footer-link:hover { color: var(--charcoal); }

.footer-bottom {
  max-width: 1100px; margin: 0 auto;
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 28px; border-top: 1px solid var(--border);
}
.footer-copy {
  font-size: 12.5px; font-weight: 300; color: var(--warm-grey);
  font-family: 'DM Mono', monospace;
}
.footer-legal { display: flex; gap: 20px; }
.footer-legal a {
  font-size: 12.5px; font-weight: 300; color: var(--warm-grey);
  text-decoration: none; font-family: 'DM Mono', monospace;
  transition: color var(--t);
}
.footer-legal a:hover { color: var(--charcoal); }

/* ── Scroll reveal ── */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Responsive ── */
@media (max-width: 960px) {
  .hero { padding: 100px 32px 64px; }
  .hero-inner { grid-template-columns: 1fr; gap: 48px; }
  .hiw { padding: 80px 32px; }
  .hiw-steps { grid-template-columns: 1fr; gap: 40px; }
  .hiw-steps::before { display: none; }
  .features { padding: 60px 32px 80px; }
  .feature-row { grid-template-columns: 1fr; gap: 36px; }
  .feature-row.reverse { direction: ltr; }
  .tutor-cta { padding: 80px 32px; }
  .footer { padding: 48px 32px 32px; }
  .footer-inner { grid-template-columns: 1fr; gap: 36px; }
  .footer-bottom { flex-direction: column; gap: 16px; text-align: center; }
}
`

/* ── Icons ── */
const PlayIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
        <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
)
const ArrowRight = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
)
const FooterLogo = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 3L4 7.5V16.5L12 21L20 16.5V7.5L12 3Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M12 3V21M4 7.5L20 16.5M20 7.5L4 16.5" stroke="white" strokeWidth="1" strokeOpacity="0.5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="2" fill="white" />
    </svg>
)

/* ── Scroll reveal hook ── */
function useScrollReveal(threshold = 0.18) {
    const ref = useRef(null)
    const [visible, setVisible] = useState(false)
    useEffect(() => {
        const el = ref.current; if (!el) return
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
            { threshold }
        )
        obs.observe(el)
        return () => obs.disconnect()
    }, [threshold])
    return [ref, visible]
}

/* ── Sub-components ── */
const HowItWorks = () => {
    const [ref, visible] = useScrollReveal(0.1)
    const steps = [
        { emoji: '▶️', title: 'Watch', italic: 'the video', desc: 'Stream any YouTube video embedded directly in the platform. No downloads, no extra apps — just focused learning at your own pace.' },
        { emoji: '📝', title: 'Take', italic: 'the test', desc: 'After each video, complete a short quiz to consolidate what you learned. Tests unlock automatically once you finish watching.' },
        { emoji: '🤖', title: 'Get', italic: 'AI feedback', desc: 'Our AI analyses every answer — not just the score — and tells you exactly which concepts need work and how to fix them.' },
    ]
    return (
        <section className="hiw" ref={ref}>
            <div className="hiw-inner">
                <div className="section-eyebrow">✦ The workflow</div>
                <h2 className="section-headline">Three steps to <em>genuine</em> mastery</h2>
                <p className="section-sub">No passive watching. Every video is followed by targeted testing and intelligent, personalised feedback.</p>
                <div className="hiw-steps">
                    {steps.map((s, i) => (
                        <div className={`hiw-step ${visible ? 'visible' : ''}`} key={i} style={{ transitionDelay: visible ? `${i * 0.12}s` : '0s' }}>
                            <div className="hiw-step-num">{s.emoji}</div>
                            <h3 className="hiw-step-title">{s.title} <em>{s.italic}</em></h3>
                            <p className="hiw-step-desc">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

const FeatureAI = () => {
    const [ref, visible] = useScrollReveal()
    return (
        <div className={`feature-row ${visible ? 'visible' : ''}`} ref={ref}>
            <div className="feature-text">
                <div className="feature-tag">AI Intelligence</div>
                <h3 className="feature-title">Not just a score.<br /><em>A diagnosis.</em></h3>
                <p className="feature-desc">
                    When you submit a test, the AI receives your answers, the correct answers, the questions, and the topic context. It doesn't just tell you what you got wrong — it explains <em>why</em> you got it wrong and exactly what to review next.
                </p>
                <div className="feature-points">
                    {['Identifies specific conceptual gaps per question', 'Explains misconceptions in plain language', 'Recommends targeted follow-up actions', 'Tracks weak areas across your full learning history'].map(p => (
                        <div className="feature-point" key={p}>
                            <div className="feature-point-dot" />
                            {p}
                        </div>
                    ))}
                </div>
            </div>
            <div className="feature-visual">
                <div className="fv-ai">
                    <div className="fv-ai-header"><span className="fv-ai-header-dot" />AI Analysis · Complete</div>
                    <div className="fv-ai-score">
                        <span className="fv-ai-score-num">74</span>
                        <span className="fv-ai-score-label">/ 100 · Recursion & Stacks</span>
                    </div>
                    {[['Conceptual understanding', '60%'], ['Problem application', '80%'], ['Edge case handling', '45%']].map(([l, w]) => (
                        <div className="fv-ai-bar-wrap" key={l}>
                            <div className="fv-ai-bar-label"><span>{l}</span><span>{w}</span></div>
                            <div className="fv-ai-bar"><div className="fv-ai-bar-fill" style={{ width: w }} /></div>
                        </div>
                    ))}
                    <div className="fv-ai-insight" style={{ marginTop: 18 }}>
                        You understand the <strong>base case</strong> correctly but consistently miss <strong>stack overflow conditions</strong> in unbounded recursion. Review the call stack visualisation from minute 14:20 of the video.
                    </div>
                </div>
            </div>
        </div>
    )
}

const FeatureDashboard = () => {
    const [ref, visible] = useScrollReveal()
    return (
        <div className={`feature-row reverse ${visible ? 'visible' : ''}`} ref={ref}>
            <div className="feature-text">
                <div className="feature-tag">Progress Dashboard</div>
                <h3 className="feature-title">See your learning<br /><em>journey clearly.</em></h3>
                <p className="feature-desc">
                    Your dashboard builds a live picture of your performance across every course — strong topics, weak areas, average scores, and AI recommendations all in one view.
                </p>
                <div className="feature-points">
                    {['Visual topic-by-topic performance breakdown', 'Weak areas automatically surfaced from AI analysis', 'Overall score trend across all videos', 'One-click access to recommended re-watch topics'].map(p => (
                        <div className="feature-point" key={p}>
                            <div className="feature-point-dot" />
                            {p}
                        </div>
                    ))}
                </div>
            </div>
            <div className="feature-visual">
                <div className="fv-dash">
                    <div className="fv-dash-header">Your progress · Data Structures</div>
                    <div className="fv-dash-grid">
                        <div className="fv-dash-stat"><div className="fv-dash-stat-num">78%</div><div className="fv-dash-stat-label">Avg score</div></div>
                        <div className="fv-dash-stat"><div className="fv-dash-stat-num amber">6/10</div><div className="fv-dash-stat-label">Videos done</div></div>
                    </div>
                    <div className="fv-topics">
                        {[['Arrays & Hashing', '92%', '#5CB87A'], ['Linked Lists', '85%', '#5CB87A'], ['Binary Trees', '71%', '#E0A83A'], ['Recursion', '54%', '#E07070'], ['Dynamic Programming', '38%', '#E07070']].map(([t, p, c]) => (
                            <div className="fv-topic-row" key={t}>
                                <span className="fv-topic-label">{t}</span>
                                <div className="fv-topic-bar-wrap">
                                    <div className="fv-topic-bar" style={{ width: p, background: c, opacity: 0.75 }} />
                                </div>
                                <span className="fv-topic-pct">{p}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

const FeatureCourses = () => {
    const [ref, visible] = useScrollReveal()
    return (
        <div className={`feature-row ${visible ? 'visible' : ''}`} ref={ref}>
            <div className="feature-text">
                <div className="feature-tag">Structured Courses</div>
                <h3 className="feature-title">Always know<br /><em>what's next.</em></h3>
                <p className="feature-desc">
                    Tutors organise content into Courses → Subjects → Topics with a defined video sequence. Students always know exactly where they are, what they've completed, and what's locked until they're ready.
                </p>
                <div className="feature-points">
                    {['Sequential video unlocking after test completion', 'Clear progress indicators per topic', 'Tutor-curated YouTube videos, zero hosting costs', 'Role-based access: tutors manage, students learn'].map(p => (
                        <div className="feature-point" key={p}>
                            <div className="feature-point-dot" />
                            {p}
                        </div>
                    ))}
                </div>
            </div>
            <div className="feature-visual">
                <div className="fv-course">
                    <div className="fv-course-title">Data Structures — Week 3</div>
                    <div className="fv-course-items">
                        {[
                            { icon: '✓', cls: 'done', title: 'Arrays & Hashing Basics', sub: 'Topic 1 · 18 min', badge: 'Completed', bcls: 'done' },
                            { icon: '▶', cls: 'active', title: 'Two Pointer Technique', sub: 'Topic 2 · 24 min', badge: 'In progress', bcls: 'active' },
                            { icon: '🔒', cls: 'locked', title: 'Sliding Window Pattern', sub: 'Topic 3 · 21 min', badge: 'Locked', bcls: 'locked' },
                            { icon: '🔒', cls: 'locked', title: 'Binary Search Deep Dive', sub: 'Topic 4 · 31 min', badge: 'Locked', bcls: 'locked' },
                        ].map(item => (
                            <div className={`fv-course-item ${item.cls === 'active' ? 'active' : ''}`} key={item.title}>
                                <div className={`fv-ci-icon ${item.cls}`}>{item.icon}</div>
                                <div className="fv-ci-text">
                                    <div className="fv-ci-title">{item.title}</div>
                                    <div className="fv-ci-sub">{item.sub}</div>
                                </div>
                                <span className={`fv-ci-badge ${item.bcls}`}>{item.badge}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

const TutorCTA = () => {
    const [ref, visible] = useScrollReveal()
    return (
        <section className="tutor-cta">
            <div className="tutor-cta-grid" />
            <div className={`tutor-cta-inner ${visible ? 'visible' : ''}`} ref={ref}>
                <div className="tutor-cta-tag">For educators</div>
                <h2 className="tutor-cta-headline">Are you a <em>tutor?</em></h2>
                <p className="tutor-cta-sub">
                    Add YouTube links, write tests, and let AI do the rest. <strong>No video hosting. No expensive infrastructure.</strong> Just intelligent, scalable teaching.
                </p>
                <div className="tutor-cta-steps">
                    {[['📹', 'Paste a YouTube link'], ['✏️', 'Write test questions'], ['🤖', 'AI tutors your students']].map(([icon, label]) => (
                        <div className="tutor-cta-step" key={label}>
                            <div className="tutor-cta-step-icon">{icon}</div>
                            {label}
                        </div>
                    ))}
                </div>
                <a href="/signup?role=tutor" className="btn-amber">
                    Start teaching free <ArrowRight />
                </a>
            </div>
        </section>
    )
}

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
const HomePage = () => {
    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />

            {/* ── HERO ── */}
            <section className="hero">
                <div className="hero-orb hero-orb-1" />
                <div className="hero-orb hero-orb-2" />
                <div className="hero-inner">
                    <div className="hero-left">
                        <div className="hero-eyebrow">
                            <span className="hero-eyebrow-dot" />
                            AI-Powered E-Learning
                        </div>
                        <h1 className="hero-headline">
                            Learn smarter.<br />Not <em>harder.</em>
                        </h1>
                        <p className="hero-sub">
                            Watch curated videos, take structured tests, and receive personalised AI feedback that identifies your exact weak spots — so you always know what to study next.
                        </p>
                        <div className="hero-ctas">
                            <a href="/course" className="btn-ghost">
                                Browse courses
                            </a>
                        </div>
                    </div>

                    <div className="hero-right">
                        <div className="insight-card">
                            <div className="ic-header">
                                <div className="ic-label"><span className="ic-dot" />AI Feedback · Live</div>
                                <div className="ic-score">Score <span>74</span></div>
                            </div>
                            <div className="ic-student">Analysing results for <strong>Aryan M.</strong></div>
                            <div className="ic-feedback">
                                You have a solid grasp of <strong>base cases</strong> but are missing <strong>stack overflow edge conditions</strong> in recursive problems. This is a common gap — review the call stack section before attempting dynamic programming.
                            </div>
                            <div className="ic-tags-label">Weak areas</div>
                            <div className="ic-tags">
                                {['Recursion depth', 'Stack overflow', 'Memoisation'].map(t => <span className="ic-tag weak" key={t}>{t}</span>)}
                            </div>
                            <div className="ic-tags-label" style={{ marginTop: 10 }}>Strong topics</div>
                            <div className="ic-tags">
                                {['Arrays', 'Hashing', 'Two pointers'].map(t => <span className="ic-tag strong" key={t}>{t}</span>)}
                            </div>
                            <div className="ic-video">
                                <div className="ic-video-thumb"><PlayIcon /></div>
                                <div className="ic-video-info">
                                    <div className="ic-video-title">Recursion & Call Stacks — Full Walkthrough</div>
                                    <div className="ic-video-sub">Data Structures · Topic 6</div>
                                </div>
                                <span className="ic-video-badge">Rewatch →</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <HowItWorks />

            {/* ── FEATURES ── */}
            <section className="features">
                <div className="features-inner">
                    <div className="section-eyebrow">✦ What makes us different</div>
                    <h2 className="section-headline">Built around <em>how you actually learn</em></h2>
                    <p className="section-sub">Three core systems working together — structured content, mandatory testing, and AI that truly understands where you're stuck.</p>
                    <div className="features-grid">
                        <FeatureAI />
                        <FeatureDashboard />
                        <FeatureCourses />
                    </div>
                </div>
            </section>

            {/* ── TUTOR CTA ── */}
            <TutorCTA />

            {/* ── FOOTER ── */}
            <footer className="footer">
                <div className="footer-inner">
                    <div className="footer-brand">
                        <a href="/" className="footer-wordmark">
                            <div className="footer-logo"><FooterLogo /></div>
                            <span className="footer-brand-name">learn<em>mind</em></span>
                        </a>
                        <p className="footer-tagline">Intelligent e-learning for the next generation of students and educators.</p>
                    </div>
                    <div>
                        <div className="footer-col-title">Platform</div>
                        <div className="footer-links">
                            {[['Home', '/'], ['Courses', '/courses'], ['Sign up', '/signup'], ['Log in', '/login']].map(([l, h]) => (
                                <a href={h} className="footer-link" key={l}>{l}</a>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="footer-col-title">Legal</div>
                        <div className="footer-links">
                            {[['Terms of Service', '/terms'], ['Privacy Policy', '/privacy'], ['Cookie Policy', '/cookies']].map(([l, h]) => (
                                <a href={h} className="footer-link" key={l}>{l}</a>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <span className="footer-copy">© 2025 learnmind. All rights reserved.</span>
                    <div className="footer-legal">
                        <a href="/terms">Terms</a>
                        <a href="/privacy">Privacy</a>
                        <a href="/cookies">Cookies</a>
                    </div>
                </div>
            </footer>
        </>
    )
}

export default HomePage