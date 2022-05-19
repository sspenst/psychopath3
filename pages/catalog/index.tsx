import Level from '../../models/db/level';
import { LevelModel } from '../../models/mongoose';
import Page from '../../components/page';
import React from 'react';
import Select from '../../components/select';
import SelectOption from '../../models/selectOption';
import StatsHelper from '../../helpers/statsHelper';
import { Types } from 'mongoose';
import User from '../../models/db/user';
import dbConnect from '../../lib/dbConnect';
import { useCallback } from 'react';
import useStats from '../../hooks/useStats';

export async function getStaticProps() {
  await dbConnect();

  const levels = await LevelModel
    .find<Level>({ isDraft: false }, '_id officialUserId userId')
    .populate('officialUserId', '_id isOfficial name')
    .populate('userId', '_id name');

  if (!levels) {
    throw new Error('Error finding Levels');
  }

  return {
    props: {
      levels: JSON.parse(JSON.stringify(levels)),
    } as CatalogProps,
    revalidate: 60 * 60,
  };
}

interface CatalogProps {
  levels: Level[];
}

export default function Catalog({ levels }: CatalogProps) {
  const { stats } = useStats();

  const getOptions = useCallback(() => {
    if (!levels) {
      return [];
    }

    const universes: User[] = [];
    const universesToLevelIds: {[userId: string]: Types.ObjectId[]} = {};

    for (let i = 0; i < levels.length; i++) {
      const level: Level = levels[i];
      const user: User = level.officialUserId ?? level.userId;

      if (!(user._id.toString() in universesToLevelIds)) {
        universes.push(user);
        universesToLevelIds[user._id.toString()] = [];
      }

      universesToLevelIds[user._id.toString()].push(level._id);
    }

    universes.sort((a, b) => {
      if (a.isOfficial === b.isOfficial) {
        return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
      }

      return a.isOfficial ? -1 : 1;
    });

    const officialOptions = [];
    const options = [];
    const universeStats = StatsHelper.universeStats(stats, universes, universesToLevelIds);

    for (let i = 0; i < universes.length; i++) {
      const universe = universes[i];
      const option = new SelectOption(
        universe.name,
        `/universe/${universe._id.toString()}`,
        universeStats[i],
      );

      if (universe.isOfficial) {
        officialOptions.push(option);
      } else {
        options.push(option);
      }
    }

    return (<>
      <Select options={officialOptions.filter(option => option ? option.stats?.total : true)}/>
      <div style={{ height: 32 }}/>
      <Select options={options.filter(option => option ? option.stats?.total : true)}/>
    </>);
  }, [levels, stats]);

  return (
    <Page title={'Catalog'}>
      <>
        {getOptions()}
      </>
    </Page>
  );
}
