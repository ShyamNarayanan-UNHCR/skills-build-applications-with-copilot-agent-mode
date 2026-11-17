import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function notFound(message: string) {
  return Object.assign(new Error(message), { status: 404 });
}

function parseObjectId(value: unknown, label: string) {
  if (typeof value !== 'string' || !mongoose.Types.ObjectId.isValid(value)) {
    throw badRequest(`${label} must be a valid MongoDB ObjectId`);
  }
  return new mongoose.Types.ObjectId(value);
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  const body = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const userId = parseObjectId(body.userId, 'userId');
  const teamId = parseObjectId(body.teamId, 'teamId');
  const user = await User.findById(userId);
  if (!user) {
    throw notFound('User not found');
  }
  const team = await Team.findById(teamId);
  if (!team) {
    throw notFound('Team not found');
  }

  const type = typeof body.type === 'string' ? body.type.trim() : '';
  const minutesValue = Number(body.minutes);
  if (!type || !Number.isFinite(minutesValue) || minutesValue <= 0) {
    throw badRequest('Activity type and minutes are required');
  }

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes: minutesValue,
    points: minutesValue,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  const body = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const mascot = typeof body.mascot === 'string' ? body.mascot.trim() : '';

  if (!name) {
    throw badRequest('Team name is required');
  }
  if (!mascot) {
    throw badRequest('Team mascot is required');
  }

  const memberValues = Array.isArray(body.members) ? body.members : [];
  const seen = new Set<string>();
  const members = memberValues.map((member) => {
    const id = parseObjectId(member, 'member');
    const value = id.toString();
    if (seen.has(value)) {
      return id;
    }
    seen.add(value);
    return id;
  });

  const team = await Team.create({ name, mascot, members });
  return team.toObject();
}

export async function getLeaderboard() {
  const teams = await Team.find().lean();
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
  ]);

  const totalsByTeam = new Map<string, number>(
    totals.map((entry) => [entry._id.toString(), Number(entry.totalPoints) || 0]),
  );

  const leaderboard = teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: totalsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  return leaderboard;
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = decodeURIComponent(userEmail).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).lean();

  if (!user) {
    throw notFound('User not found');
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const preferredFocus = (user.fitnessGoal ?? recentActivities[0]?.type ?? 'endurance').toString().trim();
  const workouts = await Workout.find().lean();
  const matched = workouts.filter((workout) => workout.focus?.toString().toLowerCase() === preferredFocus.toLowerCase());
  const candidates = matched.length > 0 ? matched : workouts;

  return candidates.slice(0, 3).map((workout) => ({
    title: workout.title,
    focus: workout.focus,
    minutes: workout.minutes,
    difficulty: workout.difficulty,
    reason: `Matches your ${preferredFocus} goal and recent ${recentActivities[0]?.type ?? 'activity'} pattern.`,
  }));
}

export { User };
