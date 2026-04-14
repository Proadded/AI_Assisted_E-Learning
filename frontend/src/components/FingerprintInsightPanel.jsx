import React from 'react';

const STYLES = `
  .fip-panel {
    background: #fff;
    border-radius: 16px;
    padding: 24px;
    border: 1px solid var(--border, rgba(42,39,35,0.1));
    margin-bottom: 20px;
    font-family: 'DM Sans', sans-serif;
  }
  .fip-title {
    font-family: 'DM Serif Display', serif;
    font-size: 14px;
    color: var(--charcoal, #2A2723);
    margin-bottom: 20px;
  }
  .fip-summary-row {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .fip-summary-pill {
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
  }
  .fip-pill-needs-work {
    background: #F5E6E6;
    color: #8B2020;
  }
  .fip-pill-tracking {
    background: var(--amber-pale, #FDF3E1);
    color: var(--amber, #D4860A);
  }
  .fip-pill-minor-slips {
    background: #E8F5E8;
    color: #2D6A2D;
  }
  
  .fip-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .fip-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border, rgba(42,39,35,0.1));
  }
  .fip-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  
  .fip-label {
    font-family: 'DM Mono', monospace;
    font-size: 14px;
    color: var(--ink, #1A1815);
    flex: 1;
    min-width: 150px;
  }
  
  .fip-content {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 2;
    justify-content: flex-end;
  }
  
  .fip-badge {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
  }
  
  .fip-bar-wrapper {
    width: 100px;
    height: 8px;
    background: var(--ivory-dark, #EDE9E1);
    border-radius: 4px;
    overflow: hidden;
  }
  .fip-bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.4s ease;
  }
  
  .fip-attempts {
    font-size: 12px;
    color: var(--text-muted, #7A756D);
    min-width: 70px;
    text-align: right;
  }
  
  .fip-still-learning {
    font-size: 13px;
    color: var(--text-muted, #7A756D);
    font-style: italic;
  }

  .fip-empty {
    text-align: center;
    color: var(--text-muted, #7A756D);
    padding: 40px 20px;
  }
`;

export default function FingerprintInsightPanel({ fingerprints = [] }) {
  const processedFp = fingerprints.map((fp) => ({
    ...fp,
    hasMinimumData: fp.hasMinimumData !== undefined ? fp.hasMinimumData : fp.attempts >= 3
  }));

  let needsWorkCount = 0;
  let minorSlipsCount = 0;
  let trackingCount = 0;

  processedFp.forEach((fp) => {
    if (fp.classification === "ConceptualGap") needsWorkCount++;
    if (fp.classification === "CarelessError") minorSlipsCount++;
    if (fp.classification === "Uncertain") trackingCount++;
  });

  const sorted = [...processedFp].sort((a, b) => {
    if (a.fingerprintScore === null && b.fingerprintScore === null) return 0;
    if (a.fingerprintScore === null) return 1;
    if (b.fingerprintScore === null) return -1;
    return b.fingerprintScore - a.fingerprintScore;
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="fip-panel db-panel">
        <div className="fip-title">Understanding Depth</div>
        
        {sorted.length === 0 ? (
          <div className="fip-empty">
            Complete more tests to unlock concept-level insights.
          </div>
        ) : (
          <>
            <div className="fip-summary-row">
              <div className="fip-summary-pill fip-pill-needs-work">
                {needsWorkCount} needs work
              </div>
              <div className="fip-summary-pill fip-pill-tracking">
                {trackingCount} tracking
              </div>
              <div className="fip-summary-pill fip-pill-minor-slips">
                {minorSlipsCount} minor slips
              </div>
            </div>

            <div className="fip-list">
              {sorted.map((fp, idx) => {
                const isReady = fp.hasMinimumData;
                let badgeText = "";
                let badgeClass = "";
                let barColor = "";

                if (isReady) {
                  switch (fp.classification) {
                    case "ConceptualGap":
                      badgeText = "Needs work";
                      badgeClass = "fip-pill-needs-work";
                      barColor = "#8B2020";
                      break;
                    case "CarelessError":
                      badgeText = "Minor slips";
                      badgeClass = "fip-pill-minor-slips";
                      barColor = "#2D6A2D";
                      break;
                    case "Uncertain":
                    default:
                      badgeText = "Tracking";
                      badgeClass = "fip-pill-tracking";
                      barColor = "var(--amber, #D4860A)";
                      break;
                  }
                }

                return (
                  <div key={idx} className="fip-row">
                    <div className="fip-label">{fp.conceptTag}</div>
                    
                    <div className="fip-content">
                      {!isReady ? (
                        <div className="fip-still-learning">Still learning...</div>
                      ) : (
                        <>
                          <div className={`fip-badge ${badgeClass}`}>
                            {badgeText}
                          </div>
                          <div className="fip-bar-wrapper">
                            <div 
                              className="fip-bar-fill"
                              style={{ 
                                width: `${(fp.fingerprintScore || 0) * 100}%`,
                                backgroundColor: barColor
                              }}
                            />
                          </div>
                        </>
                      )}
                      
                      <div className="fip-attempts">
                        {fp.attempts} attempt{fp.attempts !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
