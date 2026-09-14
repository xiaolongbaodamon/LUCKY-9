import { Card, Suit, Rank, HandEvaluation, RoundResult, BetMap } from '../types/game';

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

/**
 * Calculates point value in Lucky 9:
 * A = 1
 * 2 - 9 = 2 - 9
 * 10, J, Q, K = 0
 */
export function getCardValue(rank: Rank): number {
  if (rank === 'A') return 1;
  if (['10', 'J', 'Q', 'K'].includes(rank)) return 0;
  return parseInt(rank, 10);
}

/**
 * Generates a fresh standard 52-card deck
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${suit}-${rank}-${Math.random().toString(36).substring(2, 7)}`,
        suit,
        rank,
        value: getCardValue(rank),
        faceUp: false,
      });
    }
  }
  return deck;
}

/**
 * Provably fair shuffle using Fisher-Yates with simulated crypto seed
 */
export function shuffleDeck(deck: Card[], seedString?: string): { shuffled: Card[]; hash: string } {
  const arr = [...deck];
  const seed = seedString || `${Date.now()}-${Math.random()}`;

  // Simple pseudo-random generator seeded from string for anti-cheat verification
  let hashVal = 0;
  for (let i = 0; i < seed.length; i++) {
    hashVal = (hashVal << 5) - hashVal + seed.charCodeAt(i);
    hashVal |= 0;
  }

  const seededRandom = () => {
    hashVal = (hashVal * 9301 + 49297) % 233280;
    return Math.abs(hashVal / 233280);
  };

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  // Generate round SHA-style proof string
  const hash = `L9-${Math.abs(hashVal).toString(16).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  return { shuffled: arr, hash };
}

/**
 * Computes Lucky 9 Hand Evaluation
 */
export function evaluateHand(cards: Card[]): HandEvaluation {
  const rawSum = cards.reduce((acc, card) => acc + card.value, 0);
  const score = rawSum % 10;
  const isTwoCards = cards.length === 2;

  const isNatural9 = isTwoCards && score === 9;
  const isNatural8 = isTwoCards && score === 8;
  const isPair = isTwoCards && cards[0].rank === cards[1].rank;

  return {
    cards,
    score,
    isNatural9,
    isNatural8,
    isPair,
    rawSum,
  };
}

/**
 * Determines if Player MUST draw a third card
 * Rules:
 * 0 - 4: Player MUST draw
 * 5: Optional (can hit or stand)
 * 6 - 7: MUST stand
 * 8 - 9: Natural (no draw)
 */
export function playerCanDraw(hand: HandEvaluation): boolean {
  if (hand.cards.length >= 3) return false;
  if (hand.isNatural8 || hand.isNatural9) return false;
  return hand.score <= 5;
}

export function playerMustDraw(hand: HandEvaluation): boolean {
  if (hand.cards.length >= 3) return false;
  if (hand.isNatural8 || hand.isNatural9) return false;
  return hand.score <= 4;
}

/**
 * Banker drawing rules in Lucky 9:
 * If either player or banker has a Natural, banker does NOT draw.
 * If player didn't draw a 3rd card: Banker draws on 0-5, stands on 6-7.
 * If player drew a 3rd card: Banker draws on 0-5, stands on 6-9.
 */
export function bankerShouldDraw(bankerHand: HandEvaluation, playerHand: HandEvaluation): boolean {
  if (bankerHand.cards.length >= 3) return false;
  if (bankerHand.isNatural8 || bankerHand.isNatural9) return false;
  if (playerHand.isNatural8 || playerHand.isNatural9) return false;

  return bankerHand.score <= 5;
}

/**
 * Compare hands and calculate round payout
 */
export function determineWinner(
  playerHand: HandEvaluation,
  bankerHand: HandEvaluation
): 'player' | 'banker' | 'tie' {
  // Check Naturals first
  if (playerHand.isNatural9 && !bankerHand.isNatural9) return 'player';
  if (bankerHand.isNatural9 && !playerHand.isNatural9) return 'banker';
  if (playerHand.isNatural9 && bankerHand.isNatural9) return 'tie';

  if (playerHand.isNatural8 && !bankerHand.isNatural8 && !bankerHand.isNatural9) return 'player';
  if (bankerHand.isNatural8 && !playerHand.isNatural8 && !playerHand.isNatural9) return 'banker';
  if (playerHand.isNatural8 && bankerHand.isNatural8) return 'tie';

  // Compare raw Lucky 9 scores (0 to 9)
  if (playerHand.score > bankerHand.score) return 'player';
  if (bankerHand.score > playerHand.score) return 'banker';

  // Tie if scores are equal
  return 'tie';
}

/**
 * Compute round payouts based on bets
 */
export function calculatePayouts(
  bets: BetMap,
  playerHand: HandEvaluation,
  bankerHand: HandEvaluation,
  roundHash: string
): RoundResult {
  const winner = determineWinner(playerHand, bankerHand);
  const totalBet = Object.values(bets).reduce((a, b) => a + b, 0);

  const payouts: RoundResult['payouts'] = {};
  let totalWon = 0;

  // 1. Player Bet (1:1 standard; Natural 9 pays 2:1)
  if (bets.player > 0) {
    if (winner === 'player') {
      const payoutMultiplier = playerHand.isNatural9 ? 2.0 : 1.0;
      const winAmount = bets.player + Math.floor(bets.player * payoutMultiplier);
      payouts.player = { bet: bets.player, won: true, payout: winAmount };
      totalWon += winAmount;
    } else if (winner === 'tie') {
      // Push: return original bet
      payouts.player = { bet: bets.player, won: false, payout: bets.player };
      totalWon += bets.player;
    } else {
      payouts.player = { bet: bets.player, won: false, payout: 0 };
    }
  }

  // 2. Banker Bet (1:1 standard; push on tie)
  if (bets.banker > 0) {
    if (winner === 'banker') {
      const winAmount = bets.banker + bets.banker;
      payouts.banker = { bet: bets.banker, won: true, payout: winAmount };
      totalWon += winAmount;
    } else if (winner === 'tie') {
      payouts.banker = { bet: bets.banker, won: false, payout: bets.banker };
      totalWon += bets.banker;
    } else {
      payouts.banker = { bet: bets.banker, won: false, payout: 0 };
    }
  }

  // 3. Tie Bet (8:1 payout)
  if (bets.tie > 0) {
    if (winner === 'tie') {
      const winAmount = bets.tie + bets.tie * 8;
      payouts.tie = { bet: bets.tie, won: true, payout: winAmount };
      totalWon += winAmount;
    } else {
      payouts.tie = { bet: bets.tie, won: false, payout: 0 };
    }
  }

  // 4. Player Pair Side Bet (11:1 payout)
  if (bets.playerPair > 0) {
    if (playerHand.isPair) {
      const winAmount = bets.playerPair + bets.playerPair * 11;
      payouts.playerPair = { bet: bets.playerPair, won: true, payout: winAmount };
      totalWon += winAmount;
    } else {
      payouts.playerPair = { bet: bets.playerPair, won: false, payout: 0 };
    }
  }

  // 5. Banker Pair Side Bet (11:1 payout)
  if (bets.bankerPair > 0) {
    if (bankerHand.isPair) {
      const winAmount = bets.bankerPair + bets.bankerPair * 11;
      payouts.bankerPair = { bet: bets.bankerPair, won: true, payout: winAmount };
      totalWon += winAmount;
    } else {
      payouts.bankerPair = { bet: bets.bankerPair, won: false, payout: 0 };
    }
  }

  // 6. Natural 9 Side Bet (3:1 payout if either player or banker gets Natural 9)
  if (bets.natural9 > 0) {
    if (playerHand.isNatural9 || bankerHand.isNatural9) {
      const winAmount = bets.natural9 + bets.natural9 * 3;
      payouts.natural9 = { bet: bets.natural9, won: true, payout: winAmount };
      totalWon += winAmount;
    } else {
      payouts.natural9 = { bet: bets.natural9, won: false, payout: 0 };
    }
  }

  const netProfit = totalWon - totalBet;

  return {
    playerHand,
    bankerHand,
    winner,
    payouts,
    totalWon,
    totalBet,
    netProfit,
    roundHash,
    timestamp: Date.now(),
  };
}
