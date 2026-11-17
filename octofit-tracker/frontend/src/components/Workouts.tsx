import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title?: string;
  focus?: string;
  reason?: string;
};

export default function Workouts() {
  return (
    <CapabilityCard<WorkoutSuggestion>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      endpoint="/api/workouts/suggestions/mona@example.com"
      itemsKey="suggestions"
      emptyText="No workout suggestions"
      renderItem={(suggestion) => <>
        {suggestion.title ?? 'Workout'} · {suggestion.focus ?? 'general'} — {suggestion.reason ?? 'Based on recent activity.'}
      </>}
    />
  );
}
