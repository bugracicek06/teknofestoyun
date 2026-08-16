import React from 'react';
import { GameContainer } from './components/GameContainer';
import { KioskOverlay } from './components/KioskOverlay';
import './styles/index.css';

export const App: React.FC = () => {
  return (
    <div className="kiosk-wrapper">
      <KioskOverlay />
      <GameContainer />
    </div>
  );
};

export default App;
