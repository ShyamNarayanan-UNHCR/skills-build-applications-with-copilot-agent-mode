import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  rank?: number;
  teamName?: string;
  totalPoints?: number;
};

export default function Leaderboard() {
  return (
    <CapabilityCard<LeaderboardEntry>
      title="Leaderboard"
      description="Compare team point totals."
      endpoint="/api/leaderboard"
      itemsKey="leaderboard"
      emptyText="No leaderboard"
      renderItem={(entry) => <>
        #{entry.rank ?? '?'} · {entry.teamName ?? 'Team'} · {entry.totalPoints ?? 0} points
      </>}
    />
  );
}
