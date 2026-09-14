import React, { useState, useEffect } from 'react';
import { MultiplayerPlayer, GamePhase } from '../types/game';
import { soundEngine } from '../utils/audio';
import { MessageSquare, Smile, Send, ChevronDown, ChevronUp } from 'lucide-react';

interface MultiplayerTableHudProps {
  phase: GamePhase;
  userLatencyMs: number;
}

const INITIAL_OTHER_PLAYERS: MultiplayerPlayer[] = [
  {
    id: 'p_1',
    name: 'Kenji_9',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    country: 'JP',
    seatIndex: 1,
    coins: 45200,
    currentBet: 250,
    betType: 'player',
    pingMs: 38,
    actionStatus: 'Bet Placed',
  },
  {
    id: 'p_2',
    name: 'Maria_Manila',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    country: 'PH',
    seatIndex: 2,
    coins: 38900,
    currentBet: 500,
    betType: 'banker',
    pingMs: 24,
    actionStatus: 'Bet Placed',
  },
  {
    id: 'p_3',
    name: 'SingaporeAce',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
    country: 'SG',
    seatIndex: 3,
    coins: 61400,
    currentBet: 300,
    betType: 'natural9',
    pingMs: 44,
    actionStatus: 'Bet Placed',
  },
];

const PRESET_MESSAGES = [
  'Good luck everyone! 🍀',
  'Natural 9 coming this round!',
  'Banker streak is hot! 🔥',
  'Always trust the 9!',
  'Nice win! 🎉',
  'What a round!',
];

export const MultiplayerTableHud: React.FC<MultiplayerTableHudProps> = ({
  phase,
  userLatencyMs,
}) => {
  const [players, setPlayers] = useState<MultiplayerPlayer[]>(INITIAL_OTHER_PLAYERS);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: 'Maria_Manila', text: 'Good luck table! Let’s get some Natural 9s!', time: '12:02' },
    { sender: 'Kenji_9', text: 'High stakes feeling good today.', time: '12:03' },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isChatExpanded, setIsChatExpanded] = useState(false);

  // Dynamic simulated actions when phase changes
  useEffect(() => {
    if (phase === 'BETTING') {
      setPlayers((prev) =>
        prev.map((p) => {
          const bets = [100, 250, 500, 1000];
          const newBet = bets[Math.floor(Math.random() * bets.length)];
          const betTypes: any[] = ['player', 'banker', 'natural9'];
          return {
            ...p,
            currentBet: newBet,
            betType: betTypes[Math.floor(Math.random() * betTypes.length)],
            actionStatus: 'Placed Bet',
            pingMs: Math.floor(Math.random() * 25 + 20),
          };
        })
      );
    } else if (phase === 'PLAYER_TURN') {
      setPlayers((prev) =>
        prev.map((p) => ({
          ...p,
          actionStatus: Math.random() > 0.5 ? 'Waiting for Card' : 'Standing Pat',
        }))
      );
    }
  }, [phase]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    soundEngine.playButtonClick();

    const newEntry = {
      sender: 'You',
      text: inputMsg.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev.slice(-15), newEntry]);
    setInputMsg('');

    // Simulated reply from table
    setTimeout(() => {
      const randomReplier = players[Math.floor(Math.random() * players.length)];
      const replies = ['Good play!', 'Let’s go!!', 'Nice read', '🍀🍀', 'Natural 9!'];
      const botReply = {
        sender: randomReplier.name,
        text: replies[Math.floor(Math.random() * replies.length)],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev.slice(-15), botReply]);
    }, 1200);
  };

  const handleQuickEmote = (emote: string) => {
    soundEngine.playButtonClick();
    setChatMessages((prev) => [
      ...prev.slice(-15),
      { sender: 'You', text: emote, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
  };

  return (
    <div className="absolute bottom-20 left-4 z-20 flex flex-col gap-2 max-w-[280px] sm:max-w-xs pointer-events-auto">
      {/* Active Table Players Drawer / Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {players.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur text-[11px] shadow-sm flex-shrink-0"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="font-semibold text-slate-200">{p.name}</span>
            <span className="font-mono-code text-[10px] text-amber-300">${p.currentBet}</span>
          </div>
        ))}
      </div>

      {/* Live Table Chat Box */}
      <div className="bg-slate-950/85 border border-slate-800/80 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden flex flex-col">
        {/* Toggle Chat Bar */}
        <div
          onClick={() => setIsChatExpanded(!isChatExpanded)}
          className="flex items-center justify-between px-3 py-1.5 bg-slate-900/60 cursor-pointer text-xs text-slate-300 select-none hover:bg-slate-900/90"
        >
          <span className="flex items-center gap-1.5 font-semibold text-[11px] text-slate-300">
            <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
            Table Chat & Reactions
          </span>
          {isChatExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </div>

        {isChatExpanded && (
          <div className="p-2.5 flex flex-col gap-2 animate-in fade-in">
            {/* Messages list */}
            <div className="h-28 overflow-y-auto flex flex-col gap-1 text-[11px]">
              {chatMessages.map((msg, i) => (
                <div key={i} className="leading-tight">
                  <span className={`font-bold ${msg.sender === 'You' ? 'text-amber-400' : 'text-sky-400'}`}>
                    {msg.sender}:{' '}
                  </span>
                  <span className="text-slate-200">{msg.text}</span>
                </div>
              ))}
            </div>

            {/* Quick Emotes */}
            <div className="flex items-center gap-1 pt-1 border-t border-slate-800">
              {['🔥', '🍀', '👏', '🎉', '😎'].map((emote) => (
                <button
                  key={emote}
                  onClick={() => handleQuickEmote(emote)}
                  className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-xs transition-transform hover:scale-115"
                >
                  {emote}
                </button>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="flex gap-1.5 pt-1">
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Say something to table..."
                maxLength={50}
                className="flex-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-[11px] outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
              >
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
