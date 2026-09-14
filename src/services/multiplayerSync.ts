import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  PlayerProfile,
  LiveMultiplayerTable,
  RealPlayerSeat,
  Card,
  MatchmakingTicket,
} from '../types/game';
import {
  createDeck,
  shuffleDeck,
  evaluateHand,
  bankerShouldDraw,
} from '../utils/lucky9';

export class MultiplayerSyncService {
  private activeTicketId: string | null = null;
  private unsubscribeQueue: (() => void) | null = null;
  private unsubscribeTable: (() => void) | null = null;

  /**
   * Enters the real-time matchmaking queue in Firestore.
   * Matches against other real players waiting in the queue.
   */
  public async findRealPlayerMatch(
    profile: PlayerProfile,
    onProgress: (msg: string) => void
  ): Promise<{ tableId: string; seat: 'player1' | 'player2' }> {
    onProgress('Connecting to matchmaking queue...');

    try {
      // 1. Search for existing waiting real players in Firestore queue
      const queueRef = collection(db, 'matchmaking_queue');
      const now = Date.now();
      const q = query(queueRef, where('status', '==', 'SEARCHING'), limit(10));
      const snapshot = await getDocs(q);

      let matchedTicket: MatchmakingTicket | null = null;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as MatchmakingTicket;
        // Don't match with yourself and ignore tickets older than 90 seconds
        if (data.playerId !== profile.id && now - data.createdAt < 90000 && !matchedTicket) {
          matchedTicket = { ...data, ticketId: docSnap.id };
        }
      });

      // 2. If a waiting real player was found, create the shared table!
      if (matchedTicket) {
        const opponent = matchedTicket as MatchmakingTicket;
        onProgress(`Opponent found: ${opponent.playerName}! Setting up table...`);

        const tableId = `tbl_${Math.random().toString(36).substring(2, 9)}`;
        const freshDeck = shuffleDeck(createDeck());

        const player1Seat: RealPlayerSeat = {
          id: opponent.playerId,
          name: opponent.playerName,
          avatar: opponent.playerAvatar,
          country: opponent.playerCountry,
          coins: opponent.playerCoins,
          bet: 100,
          ready: false,
          cards: [],
          score: 0,
          hasHit: false,
          hasStood: false,
        };

        const player2Seat: RealPlayerSeat = {
          id: profile.id,
          name: profile.username,
          avatar: profile.avatarBase64,
          country: profile.country,
          coins: profile.coins,
          bet: 100,
          ready: false,
          cards: [],
          score: 0,
          hasHit: false,
          hasStood: false,
        };

        const newTable: LiveMultiplayerTable = {
          id: tableId,
          name: 'VIP High Stakes 1v1 Arena',
          minBet: 50,
          maxBet: 5000,
          createdAt: Date.now(),
          status: 'BETTING',
          player1: player1Seat,
          player2: player2Seat,
          banker: {
            cards: [],
            score: 0,
          },
          deck: freshDeck.shuffled,
          roundHash: freshDeck.hash,
          roundNumber: 1,
          currentTurnPlayerId: opponent.playerId,
        };

        // Create table in Firestore
        await setDoc(doc(db, 'tables', tableId), newTable);

        // Update opponent's ticket so their app automatically joins this table
        await updateDoc(doc(db, 'matchmaking_queue', opponent.ticketId), {
          status: 'MATCHED',
          tableId,
          matchedOpponentId: profile.id,
          matchedOpponentName: profile.username,
        });

        return { tableId, seat: 'player2' };
      }

      // 3. If no opponent currently waiting, create our ticket and wait
      onProgress('Searching for real online players...');
      const myTicketId = `tkt_${profile.id}`;
      this.activeTicketId = myTicketId;

      const myTicket: MatchmakingTicket = {
        ticketId: myTicketId,
        playerId: profile.id,
        playerName: profile.username,
        playerAvatar: profile.avatarBase64,
        playerCountry: profile.country,
        playerCoins: profile.coins,
        status: 'SEARCHING',
        createdAt: Date.now(),
      };

      await setDoc(doc(db, 'matchmaking_queue', myTicketId), myTicket);

      // Listen for incoming match
      return new Promise<{ tableId: string; seat: 'player1' | 'player2' }>((resolve, reject) => {
        this.unsubscribeQueue = onSnapshot(
          doc(db, 'matchmaking_queue', myTicketId),
          (docSnap) => {
            if (!docSnap.exists()) return;
            const data = docSnap.data() as MatchmakingTicket;

            if (data.status === 'MATCHED' && data.tableId) {
              onProgress(`Matched with ${data.matchedOpponentName || 'real player'}! Seating...`);
              this.cleanupMatchmakingTicket();
              resolve({ tableId: data.tableId, seat: 'player1' });
            }
          },
          (err) => {
            console.error('[Matchmaking] Listener error:', err);
            reject(err);
          }
        );
      });
    } catch (err) {
      console.error('[Matchmaking] Error:', err);
      throw err;
    }
  }

  /**
   * Cancel matchmaking ticket
   */
  public async cancelMatchmaking(): Promise<void> {
    this.cleanupMatchmakingTicket();
  }

  private async cleanupMatchmakingTicket(): Promise<void> {
    if (this.unsubscribeQueue) {
      this.unsubscribeQueue();
      this.unsubscribeQueue = null;
    }
    if (this.activeTicketId) {
      try {
        await deleteDoc(doc(db, 'matchmaking_queue', this.activeTicketId));
      } catch (err) {
        console.warn('Failed to delete queue ticket:', err);
      }
      this.activeTicketId = null;
    }
  }

  /**
   * Real-time subscription to a Live Table document
   */
  public subscribeTable(
    tableId: string,
    onUpdate: (table: LiveMultiplayerTable) => void
  ): () => void {
    if (this.unsubscribeTable) {
      this.unsubscribeTable();
    }

    const tableRef = doc(db, 'tables', tableId);
    this.unsubscribeTable = onSnapshot(tableRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as LiveMultiplayerTable;
        onUpdate(data);
      }
    });

    return () => {
      if (this.unsubscribeTable) {
        this.unsubscribeTable();
        this.unsubscribeTable = null;
      }
    };
  }

  /**
   * Place a bet on the table
   */
  public async placeBet(
    tableId: string,
    seat: 'player1' | 'player2',
    amount: number
  ): Promise<void> {
    const tableRef = doc(db, 'tables', tableId);
    const snap = await getDoc(tableRef);
    if (!snap.exists()) return;

    const table = snap.data() as LiveMultiplayerTable;
    const player = seat === 'player1' ? table.player1 : table.player2;
    if (!player) return;

    const updatedSeat: RealPlayerSeat = {
      ...player,
      bet: amount,
      ready: true,
    };

    await updateDoc(tableRef, {
      [seat]: updatedSeat,
    });
  }

  /**
   * Deal cards to Player 1, Player 2, and Banker (left side)
   */
  public async dealRound(tableId: string): Promise<void> {
    const tableRef = doc(db, 'tables', tableId);
    const snap = await getDoc(tableRef);
    if (!snap.exists()) return;

    const table = snap.data() as LiveMultiplayerTable;
    let deck = [...table.deck];

    if (deck.length < 15) {
      const fresh = shuffleDeck(createDeck());
      deck = fresh.shuffled;
    }

    // Deal sequence: P1 -> P2 -> Banker -> P1 -> P2 -> Banker
    const p1Card1 = deck.pop()!;
    const p2Card1 = deck.pop()!;
    const bCard1 = deck.pop()!;
    const p1Card2 = deck.pop()!;
    const p2Card2 = deck.pop()!;
    const bCard2 = deck.pop()!;

    const p1Cards = [p1Card1, p1Card2];
    const p2Cards = [p2Card1, p2Card2];
    const bCards = [bCard1, bCard2];

    const p1Eval = evaluateHand(p1Cards);
    const p2Eval = evaluateHand(p2Cards);
    const bEval = evaluateHand(bCards);

    const hasNatural =
      p1Eval.isNatural9 ||
      p1Eval.isNatural8 ||
      p2Eval.isNatural9 ||
      p2Eval.isNatural8 ||
      bEval.isNatural9 ||
      bEval.isNatural8;

    const updatedP1: RealPlayerSeat = {
      ...table.player1,
      cards: p1Cards,
      score: p1Eval.score,
      isNatural9: p1Eval.isNatural9,
      isNatural8: p1Eval.isNatural8,
      hasHit: false,
      hasStood: false,
    };

    const updatedP2: RealPlayerSeat = {
      ...(table.player2 || table.player1),
      cards: p2Cards,
      score: p2Eval.score,
      isNatural9: p2Eval.isNatural9,
      isNatural8: p2Eval.isNatural8,
      hasHit: false,
      hasStood: false,
    };

    const updatedBanker = {
      cards: bCards,
      score: bEval.score,
      isNatural9: bEval.isNatural9,
      isNatural8: bEval.isNatural8,
    };

    if (hasNatural) {
      // Natural 9 or 8 ends round immediately!
      const outcome = this.computeMultiplayerWinner(updatedP1, updatedP2, updatedBanker);
      await updateDoc(tableRef, {
        player1: updatedP1,
        player2: updatedP2,
        banker: updatedBanker,
        deck,
        status: 'ROUND_OVER',
        winner: outcome.winner,
        winnerReason: outcome.reason,
      });
    } else {
      await updateDoc(tableRef, {
        player1: updatedP1,
        player2: updatedP2,
        banker: updatedBanker,
        deck,
        status: 'PLAYING',
        currentTurnPlayerId: updatedP1.id,
      });
    }
  }

  /**
   * Player Hits (draws 3rd card)
   */
  public async playerHit(tableId: string, seat: 'player1' | 'player2'): Promise<void> {
    const tableRef = doc(db, 'tables', tableId);
    const snap = await getDoc(tableRef);
    if (!snap.exists()) return;

    const table = snap.data() as LiveMultiplayerTable;
    const player = seat === 'player1' ? table.player1 : table.player2;
    if (!player || player.cards.length >= 3) return;

    const deck = [...table.deck];
    const card = deck.pop()!;
    const newCards = [...player.cards, card];
    const handEval = evaluateHand(newCards);

    const updatedPlayer: RealPlayerSeat = {
      ...player,
      cards: newCards,
      score: handEval.score,
      hasHit: true,
      hasStood: true,
    };

    // If both players have completed their turns (or stood/hit), trigger Banker draw
    const otherSeat = seat === 'player1' ? 'player2' : 'player1';
    const otherPlayer = table[otherSeat];

    const bothDone = !otherPlayer || otherPlayer.hasStood || otherPlayer.hasHit;

    if (bothDone) {
      await this.settleBankerAndRound(tableRef, table, updatedPlayer, seat, deck);
    } else {
      await updateDoc(tableRef, {
        [seat]: updatedPlayer,
        deck,
        currentTurnPlayerId: otherPlayer.id,
      });
    }
  }

  /**
   * Player Stands
   */
  public async playerStand(tableId: string, seat: 'player1' | 'player2'): Promise<void> {
    const tableRef = doc(db, 'tables', tableId);
    const snap = await getDoc(tableRef);
    if (!snap.exists()) return;

    const table = snap.data() as LiveMultiplayerTable;
    const player = seat === 'player1' ? table.player1 : table.player2;
    if (!player) return;

    const updatedPlayer: RealPlayerSeat = {
      ...player,
      hasStood: true,
    };

    const otherSeat = seat === 'player1' ? 'player2' : 'player1';
    const otherPlayer = table[otherSeat];

    const bothDone = !otherPlayer || otherPlayer.hasStood || otherPlayer.hasHit;

    if (bothDone) {
      await this.settleBankerAndRound(tableRef, table, updatedPlayer, seat, table.deck);
    } else {
      await updateDoc(tableRef, {
        [seat]: updatedPlayer,
        currentTurnPlayerId: otherPlayer.id,
      });
    }
  }

  /**
   * Settle Banker rules and determine winners
   */
  private async settleBankerAndRound(
    tableRef: any,
    table: LiveMultiplayerTable,
    actingPlayer: RealPlayerSeat,
    actingSeat: 'player1' | 'player2',
    deck: Card[]
  ): Promise<void> {
    let p1 = actingSeat === 'player1' ? actingPlayer : table.player1;
    let p2 = actingSeat === 'player2' ? actingPlayer : table.player2;
    let activeDeck = [...deck];
    let bankerCards = [...table.banker.cards];

    const p1Hand = evaluateHand(p1.cards);
    const bHand = evaluateHand(bankerCards);

    // Banker on the left side draws if score requires
    if (bankerShouldDraw(bHand, p1Hand) && bankerCards.length < 3) {
      const bCard3 = activeDeck.pop()!;
      bankerCards.push(bCard3);
    }

    const finalBHand = evaluateHand(bankerCards);
    const updatedBanker = {
      cards: bankerCards,
      score: finalBHand.score,
      isNatural9: finalBHand.isNatural9,
      isNatural8: finalBHand.isNatural8,
    };

    const outcome = this.computeMultiplayerWinner(p1, p2, updatedBanker);

    await updateDoc(tableRef, {
      player1: p1,
      player2: p2,
      banker: updatedBanker,
      deck: activeDeck,
      status: 'ROUND_OVER',
      winner: outcome.winner,
      winnerReason: outcome.reason,
    });
  }

  /**
   * Determine overall winner
   */
  private computeMultiplayerWinner(
    p1: RealPlayerSeat,
    p2: RealPlayerSeat | null,
    banker: { score: number; isNatural9?: boolean }
  ): { winner: 'player1' | 'player2' | 'banker' | 'tie'; reason: string } {
    const p1Score = p1.score;
    const p2Score = p2 ? p2.score : -1;
    const bScore = banker.score;

    const highestScore = Math.max(p1Score, p2Score, bScore);

    if (highestScore === bScore && bScore > p1Score && bScore > p2Score) {
      return { winner: 'banker', reason: `Banker wins with score ${bScore}` };
    }

    if (p1Score === highestScore && p1Score > p2Score && p1Score > bScore) {
      return { winner: 'player1', reason: `${p1.name} wins with score ${p1Score}` };
    }

    if (p2 && p2Score === highestScore && p2Score > p1Score && p2Score > bScore) {
      return { winner: 'player2', reason: `${p2.name} wins with score ${p2Score}` };
    }

    if (p1Score === p2Score && p1Score > bScore) {
      return { winner: 'tie', reason: `Players tie with ${p1Score} against Banker ${bScore}` };
    }

    return { winner: 'tie', reason: `Push with score ${highestScore}` };
  }

  /**
   * Prepare next round on the same table
   */
  public async resetNextRound(tableId: string): Promise<void> {
    const tableRef = doc(db, 'tables', tableId);
    const snap = await getDoc(tableRef);
    if (!snap.exists()) return;

    const table = snap.data() as LiveMultiplayerTable;
    const fresh = shuffleDeck(createDeck());

    await updateDoc(tableRef, {
      status: 'BETTING',
      deck: fresh.shuffled,
      roundHash: fresh.hash,
      roundNumber: table.roundNumber + 1,
      winner: null,
      winnerReason: null,
      banker: { cards: [], score: 0 },
      'player1.cards': [],
      'player1.score': 0,
      'player1.hasHit': false,
      'player1.hasStood': false,
      'player1.ready': false,
      'player2.cards': [],
      'player2.score': 0,
      'player2.hasHit': false,
      'player2.hasStood': false,
      'player2.ready': false,
    });
  }

  /**
   * Leave Table
   */
  public async leaveTable(tableId: string, seat: 'player1' | 'player2'): Promise<void> {
    if (this.unsubscribeTable) {
      this.unsubscribeTable();
      this.unsubscribeTable = null;
    }
    try {
      const tableRef = doc(db, 'tables', tableId);
      if (seat === 'player2') {
        await updateDoc(tableRef, { player2: null });
      } else {
        await deleteDoc(tableRef);
      }
    } catch (err) {
      console.warn('Error leaving table:', err);
    }
  }
}

export const multiplayerSync = new MultiplayerSyncService();
