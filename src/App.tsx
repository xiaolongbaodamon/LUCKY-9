import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  BetMap,
  BetType,
  GamePhase,
  HandEvaluation,
  RoundResult,
  PlayerProfile,
  MultiplayerRoom,
  RecentEnemy,
} from './types/game';
import {
  createDeck,
  shuffleDeck,
  evaluateHand,
  playerCanDraw,
  bankerShouldDraw,
  calculatePayouts,
} from './utils/lucky9';
import { soundEngine } from './utils/audio';
import { firebaseSync } from './services/firebase';
import { Lucky9Scene } from './components/Lucky9Scene';
import { TableControls } from './components/TableControls';
import { TopNav } from './components/TopNav';
import { LobbyView } from './components/LobbyView';
import { TableSeatsHud } from './components/TableSeatsHud';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { GlobalLeaderboard } from './components/GlobalLeaderboard';
import { AntiCheatModal } from './components/AntiCheatModal';
import { ReportPlayerModal } from './components/ReportPlayerModal';
import { RulesModal } from './components/RulesModal';
import { MultiplayerLobby } from './components/MultiplayerLobby';
import { MultiplayerTableHud } from './components/MultiplayerTableHud';
import { RoundResultBanner } from './components/RoundResultBanner';
import { AuthScreen } from './components/AuthScreen';
import { MatchmakingModal } from './components/MatchmakingModal';
import { multiplayerSync } from './services/multiplayerSync';
import { LiveMultiplayerTable } from './types/game';
import { ArrowLeft } from 'lucide-react';

const DEFAULT_ROOM: MultiplayerRoom = {
  id: 'room_manila',
  name: 'Manila Solaire VIP Lounge',
  minBet: 50,
  maxBet: 5000,
  location: 'Manila, Philippines 🇵🇭',
  tier: 'High Roller',
  activePlayersCount: 5,
  maxPlayers: 7,
};

export default function App() {
  // Main View: Starts in 'auth' if not authenticated, otherwise 'lobby'
  const [currentView, setCurrentView] = useState<'auth' | 'lobby' | 'table'>(() => {
    const hasAuth = sessionStorage.getItem('lucky9_authenticated');
    return hasAuth ? 'lobby' : 'auth';
  });

  // Real Multiplayer Matchmaking & Live Table State
  const [showMatchmakingModal, setShowMatchmakingModal] = useState(false);
  const [liveTableId, setLiveTableId] = useState<string | null>(null);
  const [liveTable, setLiveTable] = useState<LiveMultiplayerTable | null>(null);
  const [mySeat, setMySeat] = useState<'player1' | 'player2'>('player1');

  // Game & Deck State
  const [deck, setDeck] = useState<Card[]>([]);
  const [roundHash, setRoundHash] = useState<string>('L9-INIT-89B');
  const [phase, setPhase] = useState<GamePhase>('BETTING');

  // Hands & Scores:
  // Player (bottom), Enemy (in front across), Banker (on left side)
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [enemyCards, setEnemyCards] = useState<Card[]>([]);
  const [bankerCards, setBankerCards] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<HandEvaluation | null>(null);
  const [enemyHand, setEnemyHand] = useState<HandEvaluation | null>(null);
  const [bankerHand, setBankerHand] = useState<HandEvaluation | null>(null);

  // Active Rival / Enemy at the table
  const [activeEnemy, setActiveEnemy] = useState<RecentEnemy | null>(() => {
    const list = firebaseSync.getRecentEnemies();
    return list.length > 0 ? list[0] : null;
  });

  // Bets & Chips
  const [selectedChip, setSelectedChip] = useState<number>(100);
  const [bets, setBets] = useState<BetMap>({
    player: 0,
    banker: 0,
    tie: 0,
    playerPair: 0,
    bankerPair: 0,
    natural9: 0,
  });
  const [previousBets, setPreviousBets] = useState<BetMap>({
    player: 0,
    banker: 0,
    tie: 0,
    playerPair: 0,
    bankerPair: 0,
    natural9: 0,
  });

  // Outcome
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [winner, setWinner] = useState<'player' | 'banker' | 'tie' | null>(null);

  // Profile & Persistent Cloud State
  const [profile, setProfile] = useState<PlayerProfile>(() => firebaseSync.getProfile());

  // Multiplayer & Latency State
  const [currentRoom, setCurrentRoom] = useState<MultiplayerRoom>(DEFAULT_ROOM);
  const [latencyMs, setLatencyMs] = useState<number>(32);

  // 3D Camera Preset
  const [cameraPreset, setCameraPreset] = useState<'player' | 'overview' | 'cinematic'>('player');

  // Modals
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showAntiCheatModal, setShowAntiCheatModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTargetName, setReportTargetName] = useState<string | undefined>(undefined);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showLobbyModal, setShowLobbyModal] = useState(false);

  // Initialize fresh shoe on startup
  useEffect(() => {
    const rawDeck = createDeck();
    const { shuffled, hash } = shuffleDeck(rawDeck);
    setDeck(shuffled);
    setRoundHash(hash);
  }, []);

  // Real-time latency simulation with realistic jitter
  useEffect(() => {
    const interval = setInterval(() => {
      setLatencyMs((prev) => {
        const jitter = Math.floor(Math.random() * 9) - 4;
        return Math.max(18, Math.min(65, prev + jitter));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to live Firestore multiplayer table session
  useEffect(() => {
    if (!liveTableId) {
      setLiveTable(null);
      return;
    }

    const unsubscribe = multiplayerSync.subscribeTable(liveTableId, (table) => {
      setLiveTable(table);
      setRoundHash(table.roundHash);

      const isP1 = mySeat === 'player1';
      const myPlayerSeat = isP1 ? table.player1 : table.player2;
      const oppPlayerSeat = isP1 ? table.player2 : table.player1;

      if (myPlayerSeat) {
        setPlayerCards(myPlayerSeat.cards || []);
        setPlayerHand(myPlayerSeat.cards && myPlayerSeat.cards.length > 0 ? evaluateHand(myPlayerSeat.cards) : null);
        if (myPlayerSeat.bet) {
          setBets((prev) => ({ ...prev, player: myPlayerSeat.bet }));
        }
      }

      if (oppPlayerSeat) {
        setEnemyCards(oppPlayerSeat.cards || []);
        setEnemyHand(oppPlayerSeat.cards && oppPlayerSeat.cards.length > 0 ? evaluateHand(oppPlayerSeat.cards) : null);
        setActiveEnemy({
          id: oppPlayerSeat.id,
          name: oppPlayerSeat.name,
          avatar: oppPlayerSeat.avatar,
          country: oppPlayerSeat.country,
          title: 'Real Opponent (1v1)',
          coins: oppPlayerSeat.coins,
          lastMatchResult: 'WON',
          playerScore: myPlayerSeat?.score || 0,
          enemyScore: oppPlayerSeat.score || 0,
          playedAgo: 'Just now',
          pingMs: latencyMs,
        });
      }

      setBankerCards(table.banker.cards || []);
      setBankerHand(table.banker.cards && table.banker.cards.length > 0 ? evaluateHand(table.banker.cards) : null);

      // Phase synchronization
      if (table.status === 'BETTING') {
        setPhase('BETTING');
        setWinner(null);
        setRoundResult(null);
      } else if (table.status === 'DEALING') {
        setPhase('DEALING');
      } else if (table.status === 'PLAYING') {
        setPhase('PLAYER_TURN');
      } else if (table.status === 'ROUND_OVER') {
        setPhase('SETTLING');
        const isWinner = table.winner === mySeat;
        const isTie = table.winner === 'tie';
        const isBanker = table.winner === 'banker';
        const outcomeWinner = isWinner ? 'player' : isBanker ? 'banker' : 'tie';
        setWinner(outcomeWinner);

        const currentBet = myPlayerSeat?.bet || 100;
        const payout = isWinner ? currentBet * 2 : isTie ? currentBet : 0;
        const netProfit = isWinner ? currentBet : isTie ? 0 : -currentBet;

        setRoundResult({
          roundId: table.id,
          winner: isWinner ? 'PLAYER' : isBanker ? 'BANKER' : 'TIE',
          playerScore: myPlayerSeat?.score ?? 0,
          bankerScore: table.banker.score ?? 0,
          payouts: {
            playerWin: isWinner ? payout : 0,
            bankerWin: 0,
            tieWin: isTie ? payout : 0,
            playerPairWin: 0,
            bankerPairWin: 0,
            natural9Win: 0,
            totalPayout: payout,
            netProfit,
          },
          playerNatural9: !!myPlayerSeat?.isNatural9,
          bankerNatural9: !!table.banker.isNatural9,
          playerPair: false,
          bankerPair: false,
          hash: table.roundHash,
          verified: true,
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [liveTableId, mySeat, latencyMs]);

  // Real Matchmaking Handlers
  const handleMatchFound = (tableId: string, seat: 'player1' | 'player2') => {
    setLiveTableId(tableId);
    setMySeat(seat);
    setShowMatchmakingModal(false);
    setCurrentView('table');
  };

  const handleLeaveTable = () => {
    soundEngine.playButtonClick();
    if (liveTableId) {
      multiplayerSync.leaveTable(liveTableId, mySeat);
      setLiveTableId(null);
    }
    setCurrentView('lobby');
  };

  const handleSignOut = () => {
    soundEngine.playButtonClick();
    sessionStorage.removeItem('lucky9_authenticated');
    if (liveTableId) {
      multiplayerSync.leaveTable(liveTableId, mySeat);
      setLiveTableId(null);
    }
    setCurrentView('auth');
  };

  // Navigation handlers
  const handleEnterTableFromLobby = (room?: MultiplayerRoom, selectedEnemy?: RecentEnemy) => {
    if (room) setCurrentRoom(room);
    if (selectedEnemy) setActiveEnemy(selectedEnemy);
    setShowMatchmakingModal(true);
  };

  // Place Bet
  const handlePlaceBet = useCallback(
    (type: BetType) => {
      if (phase !== 'BETTING' && phase !== 'ROUND_OVER') return;
      if (profile.coins < selectedChip) {
        soundEngine.playLossSound();
        return;
      }

      setBets((prev) => {
        const updated = {
          ...prev,
          [type]: prev[type] + selectedChip,
        };
        if (liveTableId && type === 'player') {
          multiplayerSync.placeBet(liveTableId, mySeat, updated.player);
        }
        return updated;
      });

      setProfile((prev) => {
        const nextCoins = prev.coins - selectedChip;
        return firebaseSync.saveProfile({ coins: nextCoins });
      });
    },
    [phase, profile.coins, selectedChip, liveTableId, mySeat]
  );

  // Clear Bets
  const handleClearBets = useCallback(() => {
    const totalCurrentBet = (Object.values(bets) as number[]).reduce((a, b) => a + b, 0);
    if (totalCurrentBet <= 0) return;

    setProfile((prev) => {
      const nextCoins = prev.coins + totalCurrentBet;
      return firebaseSync.saveProfile({ coins: nextCoins });
    });

    setBets({
      player: 0,
      banker: 0,
      tie: 0,
      playerPair: 0,
      bankerPair: 0,
      natural9: 0,
    });
  }, [bets]);

  // Rebet / Double Bet
  const handleRebet = useCallback(() => {
    const totalCurrentBet = (Object.values(bets) as number[]).reduce((a, b) => a + b, 0);
    if (totalCurrentBet <= 0 || profile.coins < totalCurrentBet) return;

    setBets((prev) => ({
      player: prev.player * 2,
      banker: prev.banker * 2,
      tie: prev.tie * 2,
      playerPair: prev.playerPair * 2,
      bankerPair: prev.bankerPair * 2,
      natural9: prev.natural9 * 2,
    }));

    setProfile((prev) => {
      const nextCoins = prev.coins - totalCurrentBet;
      return firebaseSync.saveProfile({ coins: nextCoins });
    });

    soundEngine.playChipStack();
  }, [bets, profile.coins]);

  // Settle Round Outcome
  const settleRound = useCallback(
    (
      finalPlayerHand: HandEvaluation,
      finalEnemyHand: HandEvaluation | null,
      finalBankerHand: HandEvaluation,
      currentBets: BetMap
    ) => {
      setPhase('SETTLING');

      const outcome = calculatePayouts(currentBets, finalPlayerHand, finalBankerHand, roundHash);
      setRoundResult(outcome);
      setWinner(outcome.winner);

      // Audio feedback
      if (outcome.netProfit > 0) {
        if (finalPlayerHand.isNatural9 || finalBankerHand.isNatural9) {
          soundEngine.playNatural9Celebration();
        } else {
          soundEngine.playWinFanfare(false);
        }
      } else if (outcome.winner === 'tie') {
        soundEngine.playWinFanfare(false);
      } else {
        soundEngine.playLossSound();
      }

      // Record profile progress in Firestore
      const resultType = outcome.winner === 'player' ? 'win' : outcome.winner === 'banker' ? 'lose' : 'tie';
      const updatedProfile = firebaseSync.recordGameResult(resultType, outcome.netProfit, outcome.totalBet);
      setProfile(updatedProfile);

      // Record Match with Enemy in Recent Enemies list
      if (activeEnemy && finalEnemyHand) {
        const enemyMatchResult: 'WON' | 'LOST' | 'TIE' =
          finalPlayerHand.score > finalEnemyHand.score
            ? 'WON'
            : finalPlayerHand.score < finalEnemyHand.score
            ? 'LOST'
            : 'TIE';

        firebaseSync.recordMatchEnemy({
          ...activeEnemy,
          lastMatchResult: enemyMatchResult,
          playerScore: finalPlayerHand.score,
          enemyScore: finalEnemyHand.score,
          playedAgo: 'Just now',
        });
      }

      setPhase('ROUND_OVER');
    },
    [roundHash, activeEnemy]
  );

  // Deal Cards:
  // Deals 2 cards each to Player (bottom), Enemy (in front across), Banker (left side)
  const handleDeal = useCallback(() => {
    const totalBet = (Object.values(bets) as number[]).reduce((a, b) => a + b, 0);
    if (totalBet <= 0) return;

    if (liveTableId) {
      soundEngine.playCardFlip();
      multiplayerSync.dealRound(liveTableId);
      return;
    }

    setPreviousBets({ ...bets });
    setRoundResult(null);
    setWinner(null);
    setPlayerCards([]);
    setEnemyCards([]);
    setBankerCards([]);
    setPlayerHand(null);
    setEnemyHand(null);
    setBankerHand(null);
    setPhase('DEALING');

    let activeDeck = [...deck];
    if (activeDeck.length < 20) {
      const fresh = shuffleDeck(createDeck());
      activeDeck = fresh.shuffled;
      setRoundHash(fresh.hash);
    }

    // Card draw sequence:
    // P1 -> E1 -> B1 -> P2 -> E2 -> B2
    const p1 = activeDeck.pop()!;
    const e1 = activeDeck.pop()!;
    const b1 = activeDeck.pop()!;
    const p2 = activeDeck.pop()!;
    const e2 = activeDeck.pop()!;
    const b2 = activeDeck.pop()!;

    setDeck(activeDeck);

    // Timed card slides
    // 1. Player Card 1
    setTimeout(() => {
      soundEngine.playCardSlide(0);
      setPlayerCards([p1]);
    }, 200);

    // 2. Enemy Card 1 (across in front)
    setTimeout(() => {
      soundEngine.playCardSlide(0);
      setEnemyCards([e1]);
    }, 450);

    // 3. Banker Card 1 (left side)
    setTimeout(() => {
      soundEngine.playCardSlide(-0.6);
      setBankerCards([b1]);
    }, 700);

    // 4. Player Card 2
    setTimeout(() => {
      soundEngine.playCardSlide(0);
      const initialPlayerCards = [p1, p2];
      setPlayerCards(initialPlayerCards);
      const initialPHand = evaluateHand(initialPlayerCards);
      setPlayerHand(initialPHand);
    }, 950);

    // 5. Enemy Card 2
    setTimeout(() => {
      soundEngine.playCardSlide(0);
      const initialEnemyCards = [e1, e2];
      setEnemyCards(initialEnemyCards);
      const initialEHand = evaluateHand(initialEnemyCards);
      setEnemyHand(initialEHand);
    }, 1200);

    // 6. Banker Card 2
    setTimeout(() => {
      soundEngine.playCardSlide(-0.6);
      const initialBankerCards = [b1, b2];
      setBankerCards(initialBankerCards);
      const initialBHand = evaluateHand(initialBankerCards);
      setBankerHand(initialBHand);

      const initialPHand = evaluateHand([p1, p2]);
      const initialEHand = evaluateHand([e1, e2]);

      // Check for Naturals (Natural 9 or Natural 8)
      if (initialPHand.isNatural9 || initialPHand.isNatural8 || initialBHand.isNatural9 || initialBHand.isNatural8) {
        setTimeout(() => {
          settleRound(initialPHand, initialEHand, initialBHand, bets);
        }, 800);
      } else {
        setTimeout(() => {
          setPhase('PLAYER_TURN');
        }, 500);
      }
    }, 1450);
  }, [bets, deck, settleRound]);

  // Banker Turn Logic (with Enemy 3rd card resolution if needed)
  const handleBankerTurn = useCallback(
    (currentPHand: HandEvaluation) => {
      if (!bankerHand) return;
      setPhase('BANKER_TURN');

      let activeDeck = [...deck];
      let currentEnemyHand = enemyHand;

      // Enemy draws 3rd card if score <= 5
      if (currentEnemyHand && currentEnemyHand.score <= 5 && currentEnemyHand.cards.length < 3) {
        const enemyThirdCard = activeDeck.pop()!;
        const updatedECards = [...currentEnemyHand.cards, enemyThirdCard];
        setEnemyCards(updatedECards);
        currentEnemyHand = evaluateHand(updatedECards);
        setEnemyHand(currentEnemyHand);
      }

      // Banker draws 3rd card if rules require
      if (bankerShouldDraw(bankerHand, currentPHand)) {
        setTimeout(() => {
          soundEngine.playTensionPulse();
          const bankerThirdCard = activeDeck.pop()!;
          setDeck(activeDeck);

          soundEngine.playCardSlide(-0.6);
          const updatedBCards = [...bankerHand.cards, bankerThirdCard];
          setBankerCards(updatedBCards);
          const updatedBHand = evaluateHand(updatedBCards);
          setBankerHand(updatedBHand);

          setTimeout(() => {
            settleRound(currentPHand, currentEnemyHand, updatedBHand, bets);
          }, 800);
        }, 700);
      } else {
        setDeck(activeDeck);
        setTimeout(() => {
          settleRound(currentPHand, currentEnemyHand, bankerHand, bets);
        }, 500);
      }
    },
    [bankerHand, enemyHand, deck, bets, settleRound]
  );

  // Player Hits (draws 3rd card)
  const handleHit = useCallback(() => {
    if (phase !== 'PLAYER_TURN' || !playerHand || playerHand.cards.length >= 3) return;

    if (liveTableId) {
      soundEngine.playTensionPulse();
      multiplayerSync.playerHit(liveTableId, mySeat);
      return;
    }

    soundEngine.playTensionPulse();
    const activeDeck = [...deck];
    const thirdCard = activeDeck.pop()!;
    setDeck(activeDeck);

    setTimeout(() => {
      soundEngine.playCardSlide(0);
      const updatedCards = [...playerHand.cards, thirdCard];
      setPlayerCards(updatedCards);
      const updatedPHand = evaluateHand(updatedCards);
      setPlayerHand(updatedPHand);

      setTimeout(() => {
        handleBankerTurn(updatedPHand);
      }, 700);
    }, 300);
  }, [phase, playerHand, deck, handleBankerTurn, liveTableId, mySeat]);

  // Player Stands
  const handleStand = useCallback(() => {
    if (phase !== 'PLAYER_TURN' || !playerHand) return;
    soundEngine.playButtonClick();

    if (liveTableId) {
      multiplayerSync.playerStand(liveTableId, mySeat);
      return;
    }

    handleBankerTurn(playerHand);
  }, [phase, playerHand, handleBankerTurn, liveTableId, mySeat]);

  // Player Doubles Down
  const handleDoubleDown = useCallback(() => {
    if (phase !== 'PLAYER_TURN' || !playerHand || playerHand.cards.length >= 3) return;
    const currentMainBet = bets.player;
    if (profile.coins < currentMainBet) return;

    setBets((prev) => ({ ...prev, player: prev.player * 2 }));
    setProfile((prev) => firebaseSync.saveProfile({ coins: prev.coins - currentMainBet }));

    soundEngine.playChipStack();
    handleHit();
  }, [phase, playerHand, bets.player, profile.coins, handleHit]);

  // Start Next Round
  const handleNextRound = useCallback(() => {
    if (liveTableId) {
      soundEngine.playCardFlip();
      multiplayerSync.resetNextRound(liveTableId);
      return;
    }

    setRoundResult(null);
    setWinner(null);
    setPlayerCards([]);
    setEnemyCards([]);
    setBankerCards([]);
    setPlayerHand(null);
    setEnemyHand(null);
    setBankerHand(null);
    setBets({
      player: 0,
      banker: 0,
      tie: 0,
      playerPair: 0,
      bankerPair: 0,
      natural9: 0,
    });
    setPhase('BETTING');
    setRoundHash(`L9-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`);
  }, [liveTableId]);

  // Rebet Previous Bets
  const handleRebetPrevious = useCallback(() => {
    handleNextRound();
    const totalPrev = (Object.values(previousBets) as number[]).reduce((a, b) => a + b, 0);
    if (totalPrev > 0 && profile.coins >= totalPrev) {
      setBets({ ...previousBets });
      setProfile((prev) => firebaseSync.saveProfile({ coins: prev.coins - totalPrev }));
      soundEngine.playChipStack();
    }
  }, [handleNextRound, previousBets, profile.coins]);

  // Cycle Camera Views
  const handleCycleCamera = useCallback(() => {
    setCameraPreset((prev) => {
      if (prev === 'player') return 'overview';
      if (prev === 'overview') return 'cinematic';
      return 'player';
    });
  }, []);

  // Show Auth Screen if unauthenticated
  if (currentView === 'auth') {
    return (
      <AuthScreen
        onAuthenticated={(newProfile) => {
          setProfile(newProfile);
          sessionStorage.setItem('lucky9_authenticated', 'true');
          setCurrentView('lobby');
        }}
      />
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-slate-950 font-sans select-none">
      {/* Top Navigation Bar */}
      <TopNav
        profile={profile}
        currentRoom={currentRoom}
        latencyMs={latencyMs}
        cameraPreset={cameraPreset}
        currentView={currentView}
        onToggleView={(v) => setCurrentView(v)}
        onCycleCamera={handleCycleCamera}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenLeaderboard={() => setShowLeaderboardModal(true)}
        onOpenLobby={() => setCurrentView('lobby')}
        onOpenAntiCheat={() => setShowAntiCheatModal(true)}
        onOpenReport={() => {
          setReportTargetName(undefined);
          setShowReportModal(true);
        }}
        onOpenRules={() => setShowRulesModal(true)}
        onSignOut={handleSignOut}
      />

      {/* Main Viewport: Either Lobby View or 3D Table */}
      {currentView === 'lobby' ? (
        <main className="relative flex-1 w-full h-full overflow-y-auto">
          <LobbyView
            profile={profile}
            onEnterTable={handleEnterTableFromLobby}
            onFindMatch={() => setShowMatchmakingModal(true)}
            onOpenProfile={() => setShowProfileModal(true)}
            onOpenLeaderboard={() => setShowLeaderboardModal(true)}
            onOpenReportModal={(enemyName) => {
              setReportTargetName(enemyName);
              setShowReportModal(true);
            }}
            onOpenRules={() => setShowRulesModal(true)}
          />
        </main>
      ) : (
        <main className="relative flex-1 w-full h-full overflow-hidden">
          {/* Return to Lobby Button Overlay */}
          <div className="absolute top-3 left-3 z-30 pointer-events-auto">
            <button
              id="table-return-lobby-btn"
              onClick={handleLeaveTable}
              className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white font-cinzel font-bold text-xs flex items-center gap-1.5 shadow-xl backdrop-blur cursor-pointer transition-all hover:border-amber-400/50"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Lobby Hub</span>
            </button>
          </div>

          {/* 3D WebGL Canvas Layer: Banker on Left, Enemy in front across, Player at bottom */}
          <Lucky9Scene
            playerCards={playerCards}
            enemyCards={enemyCards}
            bankerCards={bankerCards}
            playerHand={playerHand}
            enemyHand={enemyHand}
            bankerHand={bankerHand}
            bets={bets}
            winner={winner}
            isDealing={phase === 'DEALING'}
            cameraPreset={cameraPreset}
            enemyProfile={
              activeEnemy
                ? {
                    name: activeEnemy.name,
                    avatar: activeEnemy.avatar,
                    coins: activeEnemy.coins,
                    currentBet: 250,
                  }
                : null
            }
            onPlaceBetDirect={handlePlaceBet}
          />

          {/* Dedicated Table Seats HUD: Banker on Left Side, Enemy in Front Across */}
          <TableSeatsHud
            bankerCards={bankerCards}
            bankerHand={bankerHand}
            enemyCards={enemyCards}
            enemyHand={enemyHand}
            playerCards={playerCards}
            playerHand={playerHand}
            activeEnemy={activeEnemy}
            winner={winner}
            liveTable={liveTable}
            mySeat={mySeat}
          />

          {/* Multiplayer Table Players Drawer & Chat */}
          <MultiplayerTableHud phase={phase} userLatencyMs={latencyMs} />

          {/* Player Action & Betting Controls (Bottom Center) */}
          <div className="absolute bottom-3 inset-x-0 mx-auto max-w-4xl px-3 z-20 pointer-events-auto">
            <TableControls
              phase={phase}
              bets={bets}
              selectedChip={selectedChip}
              playerCoins={profile.coins}
              playerHand={playerHand}
              bankerHand={bankerHand}
              onSelectChip={setSelectedChip}
              onPlaceBet={handlePlaceBet}
              onClearBets={handleClearBets}
              onRebet={handleRebet}
              onDeal={handleDeal}
              onHit={handleHit}
              onStand={handleStand}
              canHit={phase === 'PLAYER_TURN' && !!playerHand && playerCanDraw(playerHand)}
              canStand={phase === 'PLAYER_TURN' && !!playerHand}
              canDouble={
                phase === 'PLAYER_TURN' &&
                !!playerHand &&
                playerHand.cards.length === 2 &&
                profile.coins >= bets.player
              }
              onDouble={handleDoubleDown}
            />
          </div>
        </main>
      )}

      {/* Matchmaking Queue Modal */}
      <MatchmakingModal
        isOpen={showMatchmakingModal}
        onClose={() => setShowMatchmakingModal(false)}
        profile={profile}
        onMatchFound={handleMatchFound}
      />

      {/* Round Result Banner */}
      <RoundResultBanner
        result={roundResult}
        onNextRound={handleNextRound}
        onRebet={handleRebetPrevious}
        onOpenAntiCheat={() => setShowAntiCheatModal(true)}
      />

      {/* Account Settings & 500x500 Base64 Profile Picture Modal */}
      <ProfileSettingsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        profile={profile}
        onProfileUpdate={(updated) => setProfile(updated)}
      />

      {/* Hourly Refreshing Global Leaderboard Modal */}
      <GlobalLeaderboard
        isOpen={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
        currentProfile={profile}
      />

      {/* Anti-Cheat Verification Modal */}
      <AntiCheatModal
        isOpen={showAntiCheatModal}
        onClose={() => setShowAntiCheatModal(false)}
        lastRoundHash={roundHash}
      />

      {/* Report Suspicious Activity Modal */}
      <ReportPlayerModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setReportTargetName(undefined);
        }}
        currentRoundHash={roundHash}
        reporterId={profile.id}
        initialPlayerName={reportTargetName}
      />

      {/* Rules Modal */}
      <RulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} />

      {/* Multiplayer Rooms Modal */}
      <MultiplayerLobby
        isOpen={showLobbyModal}
        onClose={() => setShowLobbyModal(false)}
        currentRoom={currentRoom}
        onSelectRoom={(room) => setCurrentRoom(room)}
        latencyMs={latencyMs}
      />
    </div>
  );
}
