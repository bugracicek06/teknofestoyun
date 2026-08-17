import React from 'react';
import { GameContainer } from './components/GameContainer';
import './styles/index.css';

export const App: React.FC = () => {
  return (
    <div className="kiosk-wrapper">
      <GameContainer />
    </div>
  );
};

export default App;
