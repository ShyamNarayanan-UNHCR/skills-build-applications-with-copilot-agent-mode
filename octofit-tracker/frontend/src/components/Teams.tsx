import { CapabilityCard } from './CapabilityCard.js';

type TeamRecord = {
  name?: string;
  mascot?: string;
  members?: Array<string | { toString(): string }>;
};

export default function Teams() {
  return (
    <CapabilityCard<TeamRecord>
      title="Teams"
      description="Manage teams and members."
      endpoint="/api/teams"
      itemsKey="teams"
      emptyText="No teams"
      renderItem={(team) => <>
        {team.name ?? 'Team'} ({team.mascot ?? 'Mascot'}) · {team.members?.length ?? 0} members
      </>}
    />
  );
}
