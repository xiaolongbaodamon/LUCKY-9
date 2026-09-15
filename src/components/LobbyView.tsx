import React, { useState, useEffect } from 'react';
import { PlayerProfile, RecentEnemy, FriendPlayer, MultiplayerRoom } from '../types/game';
import { firebaseSync } from '../services/firebase';
import { soundEngine } from '../utils/audio';
import { CoinAmount, CoinLogo, formatCoinsCompact, formatCoinsFull } from '../utils/coins';
import {
  Users,
  Swords,
  UserPlus,
  Play,
  Gift,
  ShieldAlert,
  Flame,
  Award,
  Circle,
  Clock,
  Sparkles,
  ChevronRight,
  UserX,
  Send,
  Trophy,
} from 'lucide-react';

interface LobbyViewProps {
  profile: PlayerProfile;
  onEnterTable: (room?: MultiplayerRoom, selectedEnemy?: RecentEnemy) => void;
  onFindMatch: () => void;
  onOpenProfile: () => void;
  onOpenLeaderboard: () => void;
  onOpenReportModal: (enemyName?: string) => void;
  onOpenRules: () => void;
}

const CASINO_ROOMS: MultiplayerRoom[] = [
  {
    id: 'room_manila',
    name: 'Manila Solaire Grand Lounge',
    minBet: 50,
    maxBet: 5000,
    location: 'Manila, Philippines 🇵🇭',
    tier: 'Casual',
    activePlayersCount: 6,
    maxPlayers: 8,
  },
  {
    id: 'room_macau',
    name: 'Macau Venetian High Roller',
    minBet: 500,
    maxBet: 25000,
    location: 'Macau SAR 🇲🇴',
    tier: 'High Roller',
    activePlayersCount: 4,
    maxPlayers: 6,
  },
  {
    id: 'room_singapore',
    name: 'Singapore Marina Bay Diamond',
    minBet: 1000,
    maxBet: 50000,
    location: 'Marina Bay, SG 🇸🇬',
    tier: 'Grand Diamond',
    activePlayersCount: 3,
    maxPlayers: 5,
  },
];

export const LobbyView: React.FC<LobbyViewProps> = ({
  profile,
  onEnterTable,
  onFindMatch,
  onOpenProfile,
  onOpenLeaderboard,
  onOpenReportModal,
  onOpenRules,
}) => {
  const [activeTab, setActiveTab] = useState<'enemies' | 'friends' | 'rooms'>('enemies');
  const [recentEnemies, setRecentEnemies] = useState<RecentEnemy[]>([]);
  const [friends, setFriends] = useState<FriendPlayer[]>([]);
  const [newFriendName, setNewFriendName] = useState('');
  const [friendFilter, setFriendFilter] = useState<'ALL' | 'ONLINE' | 'IN_GAME'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setRecentEnemies(firebaseSync.getRecentEnemies());
    setFriends(firebaseSync.getFriends());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleChallengeEnemy = (enemy: RecentEnemy) => {
    soundEngine.playCardFlip();
    showToast(`Challenging ${enemy.name} to 1v1 Table...`);
    onEnterTable(CASINO_ROOMS[0], enemy);
  };

  const handleAddEnemyToFriends = (enemy: RecentEnemy) => {
    soundEngine.playButtonClick();
    const added = firebaseSync.addFriend(enemy.name);
    setFriends(firebaseSync.getFriends());
    showToast(`Added ${added.name} to your friends list!`);
  };

  const handleAddFriendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendName.trim()) return;
    soundEngine.playButtonClick();
    const added = firebaseSync.addFriend(newFriendName.trim());
    setFriends(firebaseSync.getFriends());
    setNewFriendName('');
    showToast(`Friend invite sent to ${added.name}!`);
  };

  const handleRemoveFriend = (friendId: string, name: string) => {
    soundEngine.playButtonClick();
    const updated = firebaseSync.removeFriend(friendId);
    setFriends(updated);
    showToast(`Removed ${name} from friends list.`);
  };

  const handleGiftCoins = (friend: FriendPlayer) => {
    if (profile.coins < 100) {
      soundEngine.playLossSound();
      showToast('Insufficient coin balance to send gift.');
      return;
    }
    soundEngine.playChipStack();
    firebaseSync.giftChipsToFriend(friend.id, 100);
    showToast(`Sent 100 coins gift to ${friend.name}! 🪙`);
  };

  const handleInviteFriend = (friend: FriendPlayer) => {
    soundEngine.playButtonClick();
    showToast(`Invite sent to ${friend.name} to join your table!`);
  };

  const filteredFriends = friends.filter((f) => {
    if (friendFilter === 'ONLINE') return f.status === 'ONLINE_LOBBY' || f.status === 'IN_GAME';
    if (friendFilter === 'IN_GAME') return f.status === 'IN_GAME';
    return true;
  });

  return (
    <div className="relative w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-y-auto">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-slate-900/95 border border-amber-500/50 text-amber-300 text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Player Profile Card & Instant Action */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-950/90 via-slate-900/90 to-slate-950/90 border-2 border-amber-500/40 shadow-2xl backdrop-blur-xl flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5 w-full lg:w-auto">
            <div
              onClick={onOpenProfile}
              className="relative cursor-pointer group flex-shrink-0"
              title="Edit Profile"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-amber-400 group-hover:border-amber-300 shadow-xl bg-slate-800 transition-all group-hover:scale-105">
                <img
                  src={profile.avatarBase64}
                  alt={profile.username}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black font-cinzel text-white">
                  {profile.username}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-mono-code font-bold">
                  {profile.country}
                </span>
              </div>
              <p className="text-xs text-amber-300 font-bold tracking-wide">{profile.title}</p>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono-code">
                <span>
                  Winrate: <strong className="text-emerald-400">{profile.winrate}%</strong>
                </span>
                <span>•</span>
                <span>
                  W/L: <strong className="text-slate-200">{profile.wins}W / {profile.losses}L</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-rose-400 font-bold">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  {profile.currentStreak} Streak
                </span>
              </div>
            </div>
          </div>

          {/* Quick Bankroll & Enter Table CTA */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800">
            <div className="flex flex-col items-start sm:items-end">
              <div className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">
                Total Coins
              </div>
              <div
                className="font-mono-code text-2xl sm:text-3xl font-black text-amber-300 flex items-center gap-1.5"
                title={`${formatCoinsFull(profile.coins)} Total Coins`}
              >
                <CoinAmount amount={profile.coins} compact={true} size="xl" />
              </div>
            </div>

            <button
              id="lobby-find-match-btn"
              onClick={() => {
                soundEngine.playCardFlip();
                onFindMatch();
              }}
              className="px-7 py-3.5 rounded-2xl btn-game-gold text-slate-950 font-cinzel font-black text-sm tracking-wider uppercase flex items-center gap-2.5 cursor-pointer"
            >
              <Swords className="w-4 h-4" />
              <span>Find Match (1v1)</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <button
              onClick={() => {
                soundEngine.playButtonClick();
                setActiveTab('enemies');
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-cinzel font-black tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'enemies'
                  ? 'bg-amber-500 text-slate-950 shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800/60'
              }`}
            >
              <Swords className="w-4 h-4" />
              <span>Recent Enemies ({recentEnemies.length})</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playButtonClick();
                setActiveTab('friends');
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-cinzel font-black tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'friends'
                  ? 'bg-amber-500 text-slate-950 shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Friends ({friends.length})</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playButtonClick();
                setActiveTab('rooms');
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-cinzel font-black tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'rooms'
                  ? 'bg-amber-500 text-slate-950 shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800/60'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Casino Tables</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={onOpenLeaderboard}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold px-3.5 py-2 rounded-xl bg-slate-900 border border-amber-500/30 hover:border-amber-400 cursor-pointer shadow transition-all"
            >
              Leaderboard
            </button>
            <button
              onClick={onOpenRules}
              className="text-xs text-slate-300 hover:text-white font-bold px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer shadow transition-all"
            >
              Rules
            </button>
          </div>
        </div>

        {/* Tab 1: Recent Enemies */}
        {activeTab === 'enemies' && (
          <div className="flex flex-col gap-4">
            {recentEnemies.length === 0 ? (
              <div className="p-10 rounded-2xl bg-slate-900/50 border border-slate-800 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Swords className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="font-cinzel font-bold text-base text-white">No Live Match History Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Every match is played with real players across the globe. Click Find A Match to seat against a real opponent.
                </p>
                <button
                  onClick={() => {
                    soundEngine.playCardFlip();
                    onFindMatch();
                  }}
                  className="mt-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-cinzel font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Swords className="w-3.5 h-3.5" />
                  <span>Find Real Match (1v1)</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentEnemies.map((enemy) => (
                  <div
                    key={enemy.id}
                    className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700 bg-slate-800 flex-shrink-0">
                          <img src={enemy.avatar} alt={enemy.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-white">{enemy.name}</span>
                            <span className="text-[10px] text-slate-400">{enemy.country}</span>
                          </div>
                          <div className="text-xs text-amber-400/80 font-mono-code">{enemy.title}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono-code font-bold ${
                            enemy.lastMatchResult === 'WON'
                              ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-400'
                              : enemy.lastMatchResult === 'LOST'
                              ? 'bg-rose-950 border border-rose-500/40 text-rose-400'
                              : 'bg-slate-800 border border-slate-600 text-slate-300'
                          }`}
                        >
                          {enemy.lastMatchResult} ({enemy.playerScore} vs {enemy.enemyScore})
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">{enemy.playedAgo}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <div className="flex items-center gap-1 text-slate-400 font-mono-code">
                        <span>Coins:</span>
                        <CoinAmount amount={enemy.coins} compact={true} size="xs" />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAddEnemyToFriends(enemy)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="Add to Friends"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenReportModal(enemy.name)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400"
                          title="Report Player"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleChallengeEnemy(enemy)}
                          className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 font-cinzel font-bold text-xs flex items-center gap-1 transition-all"
                        >
                          <Swords className="w-3 h-3" />
                          <span>Rematch 1v1</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: In-Game Friends */}
        {activeTab === 'friends' && (
          <div className="flex flex-col gap-4">
            {/* Add Friend bar & filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <form onSubmit={handleAddFriendSubmit} className="flex items-center gap-2 w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Enter player username..."
                  value={newFriendName}
                  onChange={(e) => setNewFriendName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 text-xs text-white outline-none"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-cinzel flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>

              <div className="flex items-center gap-1.5">
                {(['ALL', 'ONLINE', 'IN_GAME'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setFriendFilter(filter)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      friendFilter === filter
                        ? 'bg-slate-800 text-amber-300 border border-amber-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {filter === 'ALL' ? 'All' : filter === 'ONLINE' ? 'Online' : 'In Game'}
                  </button>
                ))}
              </div>
            </div>

            {/* Friends Grid */}
            {filteredFriends.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center flex flex-col items-center justify-center gap-2">
                <Users className="w-8 h-8 text-slate-600" />
                <div className="text-sm font-bold text-slate-300">No Friends Added Yet</div>
                <p className="text-xs text-slate-500">
                  Search a player username above to add friends and invite them to live tables.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700 bg-slate-800">
                            <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
                          </div>
                          <span
                            className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                              friend.status === 'ONLINE_LOBBY'
                                ? 'bg-emerald-400 animate-pulse'
                                : friend.status === 'IN_GAME'
                                ? 'bg-sky-400 animate-pulse'
                                : 'bg-slate-500'
                            }`}
                          />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white">{friend.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {friend.status === 'ONLINE_LOBBY'
                              ? 'Online in Lobby'
                              : friend.status === 'IN_GAME'
                              ? `Playing in ${friend.currentRoomName || 'Room'}`
                              : 'Offline'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-xs font-mono-code flex flex-col items-end">
                        <CoinAmount amount={friend.coins} compact={true} size="xs" />
                        <div className="text-[10px] text-slate-400 mt-0.5">{friend.winrate}% winrate</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <span className="text-slate-400 text-[11px]">{friend.mutualGames} games played together</span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleGiftCoins(friend)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs flex items-center gap-1.5"
                          title="Send 100 Coins Gift"
                        >
                          <Gift className="w-3 h-3" />
                          <span>Send 100 🪙</span>
                        </button>

                        <button
                          onClick={() => handleInviteFriend(friend)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-xs flex items-center gap-1 transition-all"
                        >
                          <Send className="w-3 h-3" />
                          <span>Invite</span>
                        </button>

                        <button
                          onClick={() => handleRemoveFriend(friend.id, friend.name)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-500"
                          title="Remove Friend"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Casino Tables / Rooms */}
        {activeTab === 'rooms' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CASINO_ROOMS.map((room) => (
              <div
                key={room.id}
                className="p-6 rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-950/90 to-slate-900/90 border-2 border-slate-800 hover:border-amber-400/80 transition-all flex flex-col justify-between gap-5 shadow-xl group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs px-3 py-1 rounded-full bg-slate-950 border border-amber-500/40 text-amber-300 font-mono-code font-black shadow-inner">
                      {room.tier}
                    </span>
                    <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-mono-code font-bold bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      {room.activePlayersCount}/{room.maxPlayers} Live
                    </span>
                  </div>
                  <h3 className="text-lg font-black font-cinzel text-white group-hover:text-amber-300 transition-colors">
                    {room.name}
                  </h3>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <span>{room.location}</span>
                  </div>

                  <div className="flex justify-between text-xs font-mono-code mt-4 pt-3 border-t border-slate-800/80 text-slate-300">
                    <div className="flex items-center gap-1 text-slate-400">
                      <span>Min:</span>
                      <CoinAmount amount={room.minBet} compact={true} size="xs" />
                    </div>
                    <div className="flex items-center gap-1 text-slate-400">
                      <span>Max:</span>
                      <CoinAmount amount={room.maxBet} compact={true} size="xs" />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    soundEngine.playCardFlip();
                    onEnterTable(room);
                  }}
                  className="w-full py-3 rounded-2xl btn-game-gold text-slate-950 font-cinzel font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>SEAT AT TABLE</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
