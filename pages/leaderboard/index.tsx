import React, { useEffect, useState } from 'react';
import LeaderboardEntry from '../../models/leaderboardEntry';
import LeaderboardTable from '../../components/leaderboardTable';
import Level from '../../models/data/pathology/level';
import LevelModel from '../../models/mongoose/levelModel';
import Page from '../../components/page';
import User from '../../models/data/pathology/user';
import UserModel from '../../models/mongoose/userModel';
import dbConnect from '../../lib/dbConnect';

export async function getStaticProps() {
  const client = await dbConnect();
  // NB: https://jira.mongodb.org/browse/NODE-3648
  const session = await client.startSession();

  const [levels, users] = await Promise.all([
    LevelModel.find<Level>({}, '_id leastMoves', { session }),
    UserModel.find<User>({}, 'moves name', { session }),
  ]);

  await session.endSession();

  if (!levels) {
    throw new Error('Error finding Levels');
  }
  
  if (!users) {
    throw new Error('Error finding Users');
  }

  const leastMoves: {[levelId: string]: number} = {};
  const leaderboard: LeaderboardEntry[] = [];

  for (let i = 0; i < levels.length; i++) {
    leastMoves[levels[i]._id.toString()] = levels[i].leastMoves;
  }

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const moves = user.getMoves();
    let completed = 0;

    for (const levelId in moves) {
      if (moves[levelId] <= leastMoves[levelId]) {
        completed++;
      }
    }

    leaderboard.push({
      completed: completed,
      name: user.name,
    });
  }

  leaderboard.sort((a: LeaderboardEntry, b: LeaderboardEntry) => a.completed < b.completed ? 1 : -1);

  return {
    props: {
      leaderboard,
    } as LeaderboardProps,
  };
}

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[];
}

export default function Leaderboard({ leaderboard }: LeaderboardProps) {
  const [user, setUser] = useState<User>();

  useEffect(() => {
    fetch('/api/user', { credentials: 'include' })
    .then(async function(res) {
      setUser(await res.json());
    });
  }, []);

  return (
    <Page escapeHref={'/'} title={'Leaderboard'}>
      <LeaderboardTable leaderboard={leaderboard} user={user} />
    </Page>
  );
}
