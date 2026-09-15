export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface RecentEnemy {
  id: string;
  name: string;
  avatar: string;
  country: string;
  title: string;
  coins: number;
  lastMatchResult: 'WON' | 'LOST' | 'TIE';
  playerScore: number;
  enemyScore: number;
  playedAgo: string;
  pingMs: number;
}

export interface FriendPlayer {
  id: string;
  name: string;
  avatar: string;
  country: string;
  coins: number;
  status: 'ONLINE_LOBBY' | 'IN_GAME' | 'OFFLINE';
  currentRoomName?: string;
  winrate: number;
  mutualGames: number;
}

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number; // A=1, 2-9=face value, 10/J/Q/K=0
  faceUp: boolean;
}

export type BetType = 'player' | 'banker' | 'tie' | 'playerPair' | 'bankerPair' | 'natural9';

export interface BetMap {
  player: number;
  banker: number;
  tie: number;
  playerPair: number;
  bankerPair: number;
  natural9: number;
}

export type GamePhase =
  | 'BETTING'
  | 'DEALING'
  | 'PLAYER_TURN'
  | 'BANKER_TURN'
  | 'SETTLING'
  | 'ROUND_OVER';

export interface HandEvaluation {
  cards: Card[];
  score: number; // 0 to 9
  isNatural9: boolean;
  isNatural8: boolean;
  isPair: boolean;
  rawSum: number;
}

export interface RoundResult {
  playerHand: HandEvaluation;
  bankerHand: HandEvaluation;
  enemyHand?: HandEvaluation | null;
  winner: 'player' | 'banker' | 'tie' | 'enemy';
  bankerSwept9?: boolean;
  pvpWinner?: 'player' | 'enemy' | 'tie';
  enemyBet?: number;
  pvpCoinsTransferred?: number;
  payouts: {
    [key in BetType]?: {
      bet: number;
      won: boolean;
      payout: number;
    };
  };
  totalWon: number;
  totalBet: number;
  netProfit: number;
  roundHash: string;
  timestamp: number;
}

export interface PlayerProfile {
  id: string;
  email?: string;
  isAdmin?: boolean;
  username: string;
  title: string;
  country: string;
  bio: string;
  avatarBase64: string; // 500x500 base64
  coins: number;
  wins: number;
  losses: number;
  ties: number;
  winrate: number;
  highestWin: number;
  totalWagered: number;
  currentStreak: number;
  luckyCharm: string;
  antiCheatStatus: 'VERIFIED' | 'UNDER_REVIEW' | 'SUSPECT';
  lastSyncedAt: number;
}

export interface LeaderboardUser {
  rank: number;
  id: string;
  username: string;
  title: string;
  country: string;
  avatarBase64: string;
  coins: number;
  wins: number;
  winrate: number;
  verified: boolean;
  badge: string;
}

export interface MultiplayerPlayer {
  id: string;
  name: string;
  avatar: string;
  country: string;
  seatIndex: number;
  coins: number;
  currentBet: number;
  betType: BetType;
  pingMs: number;
  isBanker?: boolean;
  actionStatus?: string;
}

export interface MultiplayerRoom {
  id: string;
  name: string;
  minBet: number;
  maxBet: number;
  location: string;
  tier: 'Casual' | 'High Roller' | 'Grand Diamond' | 'Elite';
  activePlayersCount: number;
  maxPlayers: number;
}

export interface SuspiciousActivityReport {
  id: string;
  targetPlayerId: string;
  targetPlayerName: string;
  reporterId: string;
  reason: 'SCORE_MANIPULATION' | 'BOT_ACTIVITY' | 'SPEED_HACK' | 'HARASSMENT' | 'OTHER';
  description: string;
  roundHash: string;
  reportedAt: number;
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  adminNotes?: string;
  resolvedAt?: number;
}

export interface AdminCoinGrant {
  id: string;
  targetPlayerId: string;
  targetPlayerName: string;
  amount: number;
  reason: string;
  grantedAt: number;
  grantedBy: string;
  previousBalance: number;
  newBalance: number;
}

export interface AntiCheatLog {
  roundId: string;
  serverSeed: string;
  clientSeed: string;
  deckHash: string;
  actionSequence: string[];
  latencyMs: number;
  timestamp: number;
  verified: boolean;
}

export interface RecentEnemy {
  id: string;
  name: string;
  avatar: string;
  country: string;
  title: string;
  coins: number;
  lastMatchResult: 'WON' | 'LOST' | 'TIE';
  playerScore: number;
  enemyScore: number;
  playedAgo: string;
  pingMs: number;
}

export interface FriendPlayer {
  id: string;
  name: string;
  avatar: string;
  country: string;
  coins: number;
  status: 'ONLINE_LOBBY' | 'IN_GAME' | 'OFFLINE';
  currentRoomName?: string;
  winrate: number;
  mutualGames: number;
}

export interface RealPlayerSeat {
  id: string;
  name: string;
  avatar: string;
  country: string;
  coins: number;
  bet: number;
  ready: boolean;
  cards: Card[];
  score: number;
  hasHit: boolean;
  hasStood: boolean;
  isNatural9?: boolean;
  isNatural8?: boolean;
}

export interface LiveMultiplayerTable {
  id: string;
  name: string;
  minBet: number;
  maxBet: number;
  createdAt: number;
  status: 'WAITING_FOR_PLAYERS' | 'BETTING' | 'DEALING' | 'PLAYING' | 'SETTLING' | 'ROUND_OVER';
  player1: RealPlayerSeat;
  player2: RealPlayerSeat | null;
  banker: {
    cards: Card[];
    score: number;
    isNatural9?: boolean;
    isNatural8?: boolean;
  };
  deck: Card[];
  roundHash: string;
  roundNumber: number;
  currentTurnPlayerId?: string;
  winner?: 'player1' | 'player2' | 'banker' | 'tie' | null;
  winnerReason?: string;
}

export interface MatchmakingTicket {
  ticketId: string;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  playerCountry: string;
  playerCoins: number;
  status: 'SEARCHING' | 'MATCHED' | 'CANCELLED';
  tableId?: string;
  matchedOpponentId?: string;
  matchedOpponentName?: string;
  createdAt: number;
}

