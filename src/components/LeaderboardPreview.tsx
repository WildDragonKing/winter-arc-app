import { Link } from 'react-router-dom';

import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getGroupMembers } from '../services/firestoreService';

type LeaderboardEntry = {
  userId: string;
  nickname: string;
  score: number;
  rank: number;
};

function LeaderboardPreview() {
  const user = useStore((state) => state.user);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!user?.groupCode) return;

      setLoading(true);
      try {
        const result = await getGroupMembers(user.groupCode);
        if (result.success && result.data) {
          // Calculate scores and sort
          const scored: LeaderboardEntry[] = result.data.map((member: any, index: number) => ({
            userId: String(member.id),
            nickname: String(member.nickname),
            score: 100, // Placeholder score
            rank: index + 1,
          }));
          setLeaderboard(scored.slice(0, 5)); // Top 5
        }
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [user?.groupCode]);

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-500';
      case 2:
        return 'text-gray-400';
      case 3:
        return 'text-orange-600';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          🏆 Leaderboard
        </h2>
        <Link
          to="/leaderboard"
          className="text-sm font-medium text-winter-600 dark:text-winter-400 hover:text-winter-700 dark:hover:text-winter-300"
        >
          Alle anzeigen →
        </Link>
      </div>

      {/* Group Info */}
      <div className="mb-4 p-3 bg-winter-50 dark:bg-winter-900/20 rounded-lg">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Gruppe:{' '}
          <span className="font-semibold text-gray-900 dark:text-white">
            {user?.groupCode || 'Keine Gruppe'}
          </span>
        </div>
      </div>

      {/* Leaderboard List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">Laden...</div>
        </div>
      ) : leaderboard.length > 0 ? (
        <div className="space-y-3">
          {leaderboard.map((entry: LeaderboardEntry) => {
            const isCurrentUser = user?.nickname === entry.nickname;
            return (
              <div
                key={entry.userId}
                className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                  isCurrentUser
                    ? 'bg-winter-100 dark:bg-winter-900 ring-2 ring-winter-500'
                    : 'bg-gray-50 dark:bg-gray-700'
                }`}
              >
                {/* Rank */}
                <div
                  className={`flex-shrink-0 w-12 text-center font-bold ${getRankColor(
                    entry.rank
                  )}`}
                >
                  {getRankIcon(entry.rank)}
                </div>

                {/* Nickname */}
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {entry.nickname}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs text-winter-600 dark:text-winter-400">
                        (Du)
                      </span>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {entry.score}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Punkte
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">
            Noch keine Gruppenmitglieder
          </div>
        </div>
      )}

      {/* Join Group CTA */}
      {!user?.groupCode && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
            Du bist noch keiner Gruppe beigetreten!
          </p>
          <Link
            to="/settings"
            className="text-sm font-medium text-yellow-600 dark:text-yellow-400 hover:underline"
          >
            Jetzt Gruppe beitreten →
          </Link>
        </div>
      )}
    </div>
  );
}

export default LeaderboardPreview;
