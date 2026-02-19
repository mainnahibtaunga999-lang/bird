import React, { useState, useEffect, useCallback } from 'react';
import { GameState, PlayerStats } from './types';
import GameView from './components/GameView';
import ShopView from './components/ShopView';
import AdScreen from './components/AdScreen';
import StartScreen from './components/StartScreen';

const STORAGE_KEY = 'capitalism_bird_save_v1';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [stats, setStats] = useState<PlayerStats>({
    totalCash: 0,
    bagLevel: 0
  });
  const [lastRunCash, setLastRunCash] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Load state
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setStats(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load save", e);
      }
    }

    // Capture PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Save state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  }, [stats]);

  const handleGameOver = useCallback((collectedThisRun: number) => {
    setLastRunCash(collectedThisRun);
    setStats(prev => ({
      ...prev,
      totalCash: prev.totalCash + collectedThisRun
    }));
    setGameState(GameState.WATCHING_AD);
  }, []);

  const handleAdFinished = () => {
    setGameState(GameState.SHOP);
  };

  const handleUpgrade = (cost: number) => {
    setStats(prev => ({
      ...prev,
      totalCash: prev.totalCash - cost,
      bagLevel: prev.bagLevel + 1
    }));
  };

  const handleStartGame = () => {
    setGameState(GameState.PLAYING);
  };

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="relative w-full max-w-[400px] h-full max-h-[600px] bg-sky-400 overflow-hidden shadow-2xl border-4 border-gray-800 rounded-lg">
      {gameState === GameState.START && (
        <StartScreen 
          onStart={handleStartGame} 
          stats={stats} 
          onInstall={deferredPrompt ? handleInstallApp : undefined}
        />
      )}

      {gameState === GameState.PLAYING && (
        <GameView 
          bagLevel={stats.bagLevel} 
          onGameOver={handleGameOver} 
        />
      )}

      {gameState === GameState.WATCHING_AD && (
        <AdScreen onFinished={handleAdFinished} />
      )}

      {gameState === GameState.SHOP && (
        <ShopView 
          stats={stats} 
          onUpgrade={handleUpgrade} 
          onPlayAgain={handleStartGame}
          lastRunCash={lastRunCash}
        />
      )}
    </div>
  );
};

export default App;
