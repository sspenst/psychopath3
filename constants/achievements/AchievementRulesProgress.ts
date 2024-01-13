import { getGameFromId } from '@root/helpers/getGameIdFromReq';
import UserConfig from '@root/models/db/userConfig';
import { GameType } from '../Games';
import { IAchievementInfo } from './achievementInfo';
import AchievementType from './achievementType';

interface IAchievementInfoUser extends IAchievementInfo {
  unlocked: ({ userConfig }: { userConfig: UserConfig; }) => boolean;
}

function getProgressCount(userConfig: UserConfig) {
  const game = getGameFromId(userConfig.gameId);

  if (game.type === GameType.COMPLETE_AND_SHORTEST) {
    return userConfig.calcLevelsCompletedCount || 0;
  } else {
    return userConfig.calcLevelsSolvedCount || 0;
  }
}

const AchievementRulesProgress: { [achievementType: string]: IAchievementInfoUser; } = {
  [AchievementType.SOLVED_LEVELS_5000]: {
    name: 'Legend',
    emoji: '🐉',
    description: 'Solved 5000 levels',
    discordNotification: true,
    unlocked: ({ userConfig }) => getProgressCount(userConfig) >= 5000,
  },
  [AchievementType.SOLVED_LEVELS_4000]: {
    name: 'Ludicrous',
    emoji: '💥',
    description: 'Solved 4000 levels',
    discordNotification: true,
    unlocked: ({ userConfig }) => getProgressCount(userConfig) >= 4000,
  },
  [AchievementType.SOLVED_LEVELS_3000]: {
    name: 'Obsessed',
    emoji: '🚀',
    description: 'Solved 3000 levels',
    discordNotification: true,
    unlocked: ({ userConfig }) => getProgressCount(userConfig) >= 3000,
  },
  [AchievementType.SOLVED_LEVELS_2000]: {
    name: 'Addicted',
    emoji: '🎯',
    description: 'Solved 2000 levels',
    discordNotification: true,
    unlocked: ({ userConfig }) => getProgressCount(userConfig) >= 2000,
  },
  [AchievementType.SOLVED_LEVELS_1000]: {
    name: 'Experienced',
    emoji: '🎖️',
    description: 'Solved 1000 levels',
    discordNotification: true,
    unlocked: ({ userConfig }) => getProgressCount(userConfig) >= 1000,
  },
  [AchievementType.SOLVED_LEVELS_500]: {
    name: 'We\'re serious',
    emoji: '🏆',
    description: 'Solved 500 levels',
    unlocked: ({ userConfig }) => getProgressCount(userConfig) >= 500,
  },
  [AchievementType.SOLVED_LEVELS_100]: {
    name: 'Getting Started',
    emoji: '🏁',
    description: 'Solved 100 levels',
    unlocked: ({ userConfig }) => getProgressCount(userConfig) >= 100,
  },
};

export default AchievementRulesProgress;
