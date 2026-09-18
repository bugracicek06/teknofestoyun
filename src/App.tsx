import React, { useState, lazy, Suspense } from 'react';
import type Phaser from 'phaser';
import { KioskShell } from './components/KioskShell';
import { GameContainer } from './components/GameContainer';
import './styles/index.css';

// Lazy load the mobile certificate viewer so phones do not load Phaser or heavy game bundles
const CertificateViewPage = lazy(() => import('./components/CertificateViewPage'));

export const App: React.FC = () => {
  const [game, setGame] = useState<Phaser.Game | null>(null);

  // Check if current route is a standalone certificate view
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const certMatch = pathname.match(/^\/certificate\/([^/?#]+)/);
  const certificateId = certMatch ? decodeURIComponent(certMatch[1]) : null;

  if (certificateId) {
    return (
      <Suspense
        fallback={
          <div className="cert-page-container">
            <div className="cert-card cert-status-card">
              <div className="cert-spinner" aria-hidden="true" />
              <h2>Sertifika Yükleniyor…</h2>
            </div>
          </div>
        }
      >
        <CertificateViewPage certificateId={certificateId} />
      </Suspense>
    );
  }

  return (
    <div className="kiosk-wrapper">
      <GameContainer onGameReady={setGame} />
      <KioskShell game={game} />
    </div>
  );
};

export default App;
