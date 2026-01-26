import { db, auth } from '../firebaseConfig';
import {
    collection,
    doc,
    setDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';

export interface LeaderboardEntry {
    uid: string;
    displayName: string;
    xp: number;
    timestamp: Date;
    lastUpdate: Date;
}

const LEADERBOARD_COLLECTION = 'leaderboard';
const MAX_ENTRIES = 100;
const RATE_LIMIT_MS = 60000; // 1 minute

let lastSubmitTime = 0;

/**
 * Submit or update user's score to global leaderboard
 */
export async function submitScore(displayName: string, xp: number): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('Must be signed in to submit score');
    }

    // Client-side rate limiting
    const now = Date.now();
    if (now - lastSubmitTime < RATE_LIMIT_MS) {
        const remainingSeconds = Math.ceil((RATE_LIMIT_MS - (now - lastSubmitTime)) / 1000);
        throw new Error(`Please wait ${remainingSeconds} seconds before updating again`);
    }

    // Input validation
    if (!displayName || displayName.trim().length === 0) {
        throw new Error('Display name is required');
    }
    if (displayName.length > 50) {
        throw new Error('Display name too long (max 50 characters)');
    }
    if (xp < 0 || xp > 1000000) {
        throw new Error('Invalid XP value');
    }

    const leaderboardRef = doc(db, LEADERBOARD_COLLECTION, user.uid);

    await setDoc(leaderboardRef, {
        uid: user.uid,
        displayName: displayName.trim(),
        xp: xp,
        timestamp: serverTimestamp(),
        lastUpdate: serverTimestamp(),
    }, { merge: true });

    lastSubmitTime = now;
}

/**
 * Subscribe to real-time leaderboard updates
 */
export function subscribeToLeaderboard(
    callback: (entries: LeaderboardEntry[]) => void,
    onError?: (error: Error) => void
): () => void {
    const leaderboardQuery = query(
        collection(db, LEADERBOARD_COLLECTION),
        orderBy('xp', 'desc'),
        orderBy('timestamp', 'asc'),
        limit(MAX_ENTRIES)
    );

    const unsubscribe = onSnapshot(
        leaderboardQuery,
        (snapshot) => {
            const entries: LeaderboardEntry[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    uid: data.uid,
                    displayName: data.displayName,
                    xp: data.xp,
                    timestamp: (data.timestamp as Timestamp)?.toDate() || new Date(),
                    lastUpdate: (data.lastUpdate as Timestamp)?.toDate() || new Date(),
                };
            });
            callback(entries);
        },
        (error) => {
            console.error('Leaderboard subscription error:', error);
            onError?.(error);
        }
    );

    return unsubscribe;
}

/**
 * Get user's current rank
 */
export function getUserRank(entries: LeaderboardEntry[], uid: string): number | null {
    const index = entries.findIndex(entry => entry.uid === uid);
    return index >= 0 ? index + 1 : null;
}
