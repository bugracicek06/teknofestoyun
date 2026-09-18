import React from 'react';

export interface MissionCardProps {
  index: number;
  id: string;
  title: string;
  era: string;
  description: string;
  icon: string;
  imageSrc: string;
  status: 'locked' | 'selected' | 'completed' | 'available';
  score?: number;
  isSelected: boolean;
  onSelect: () => void;
}

export const MissionCard: React.FC<MissionCardProps> = ({
  index,
  id: _id,
  title,
  era: _era,
  imageSrc,
  status,
  score,
  isSelected,
  onSelect,
}) => {
  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';
  const numStr = String(index + 1).padStart(2, '0');

  // Split title e.g. "Göbeklitepe – Taşın Hafızası" -> mainTitle and subTitle
  const titleParts = title.split(' – ');
  const mainTitle = titleParts[0] || title;
  const subTitle = titleParts[1] || '';

  return (
    <button
      type="button"
      className={`journey-mission-card status-${status} ${isSelected ? 'is-selected' : ''}`}
      disabled={isLocked}
      aria-pressed={isSelected}
      aria-label={`${numStr} ${mainTitle}: ${subTitle}. Durum: ${isLocked ? 'Kilitli' : isCompleted ? 'Tamamlandı' : 'Keşfetmeye hazır'}`}
      onClick={onSelect}
    >
      {/* Background artwork with dark gradient overlay */}
      <div className="card-bg-wrap">
        <img
          src={imageSrc}
          alt=""
          aria-hidden="true"
          className="card-bg-img"
          loading="lazy"
        />
        <div className="card-gradient-overlay" aria-hidden="true" />
      </div>

      {/* Top row: Number and Status Action Badge */}
      <div className="card-top-row">
        <span className="card-number">{numStr}</span>
        <div className="card-status-badge" aria-hidden="true">
          {isLocked ? (
            <svg className="badge-icon lock-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          ) : isCompleted ? (
            <svg className="badge-icon check-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : isSelected ? (
            <svg className="badge-icon arrow-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          ) : (
            <span className="badge-available-dot" />
          )}
        </div>
      </div>

      {/* Bottom text information */}
      <div className="card-body">
        <h2 className="card-title">{mainTitle}</h2>
        {subTitle && <p className="card-subtitle">{subTitle}</p>}

        <div className="card-footer-status">
          {isLocked ? (
            <>
              <svg className="status-mini-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Önceki görevi tamamla</span>
            </>
          ) : isCompleted ? (
            <>
              <svg className="status-mini-icon check-green" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{score !== undefined ? `${score} puan` : 'Tamamlandı'}</span>
            </>
          ) : isSelected ? (
            <>
              <span className="status-active-beacon" aria-hidden="true" />
              <span className="text-cyan">Keşfetmeye hazırsın</span>
            </>
          ) : (
            <>
              <span className="status-ready-dot" aria-hidden="true" />
              <span>Hazır</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
};
