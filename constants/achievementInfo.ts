import { DIFFICULTY_NAMES, getDifficultyFromValue, getDifficultyList } from '@root/components/formatted/formattedDifficulty';
import Level from '@root/models/db/level';
import User from '@root/models/db/user';
import AchievementType from './achievementType';

export interface IAchievementFeatureUser {
  user: User;
}

export interface IAchievementInfo {
  name: string;
  emoji?: string;
  description: string;

}

export interface IAchievementInfoLevelCompletion extends IAchievementInfo {
  unlocked: ({ rollingLevelCompletionSum }: {rollingLevelCompletionSum: number[]}) => boolean;
}
export interface IAchievementInfoUser extends IAchievementInfo {
  unlocked: ({ user }: {user: User}) => boolean;
}
export interface IAchievementInfoCreator extends IAchievementInfo {
  unlocked: ({ levelsCreated }: {levelsCreated: Level[]}) => boolean;
}

// Now for the score achievements
export const AchievementRulesTableUser: {[achievementType: string]: IAchievementInfoUser} = {
  [AchievementType.COMPLETED_LEVELS_100]: {
    name: 'Getting Started',
    emoji: '🏁',
    description: 'Completed 100 levels',

    unlocked: ({ user }) => {
      return user.score >= 100;
    },

  },
  [AchievementType.COMPLETED_LEVELS_500]: {
    name: 'We\'re serious',
    // choose an emoji  that represents the achievement (not a duplicate)
    emoji: '👀',
    description: 'Completed 500 levels',

    unlocked: ({ user }) => {
      return user.score >= 500;
    }

  },
  [AchievementType.COMPLETED_LEVELS_1000]: {
    name: 'Getting Good',
    emoji: '🫢',
    description: 'Completed 1000 levels',

    unlocked: ({ user }) => {
      return user.score >= 1000;
    }

  },
  [AchievementType.COMPLETED_LEVELS_2000]: {
    name: 'Getting Great',
    emoji: '🤭',
    description: 'Completed 2000 levels',

    unlocked: ({ user }) => {
      return user.score >= 2000;
    }

  },
  [AchievementType.COMPLETED_LEVELS_3000]: {
    name: 'Getting Amazing',
    emoji: '🙊',
    description: 'Completed 3000 levels',

    unlocked: ({ user }) => {
      return user.score >= 3000;
    }

  },
  [AchievementType.COMPLETED_LEVELS_4000]: {
    name: 'Getting Incredible',
    emoji: '‼️',
    description: 'Completed 4000 levels',

    unlocked: ({ user }) => {
      return user.score >= 4000;
    }

  },
  [AchievementType.COMPLETED_LEVELS_5000]: {
    name: 'Getting Legendary',
    emoji: '🐉',
    description: 'Completed 5000 levels',

    unlocked: ({ user }) => {
      return user.score >= 5000;
    }

  },
};
export const AchievementRulesTableCreator: {[achievementType: string]: IAchievementInfoCreator} = {
  [AchievementType.CREATOR_CREATED_1_LEVEL]: {
    name: 'Handyman',
    emoji: '🔧',
    description: 'Created your first level',
    unlocked: ({ levelsCreated }) => {
      return levelsCreated.length >= 1;
    },
  },
  [AchievementType.CREATOR_CREATED_5_LEVELS]: {
    name: 'Apprentice',
    emoji: '🛠️',
    description: 'Created 5 levels',
    unlocked: ({ levelsCreated }) => {
      return levelsCreated.length >= 5;
    },
  },

  // now one for creating 10 levels, maybe call them a builder
  [AchievementType.CREATOR_CREATED_10_LEVELS]: {
    name: 'Builder',
    emoji: '🏗️',
    description: 'Created 10 levels',

    unlocked: ({ levelsCreated }) => {
      return levelsCreated.length >= 10;
    },
  },
  // now one for creating 10 levels, maybe call them a builder
  [AchievementType.CREATOR_CREATED_25_LEVELS]: {
    name: 'Developer',
    emoji: '🏘',
    description: 'Created 25 levels',

    unlocked: ({ levelsCreated }) => {
      return levelsCreated.length >= 25;
    },
  },
  // now one for creating 50 levels, maybe call them an architect
  [AchievementType.CREATOR_CREATED_50_LEVELS]: {
    name: 'Engineer',
    emoji: '📐',
    description: 'Created 50 levels',

    unlocked: ({ levelsCreated }) => {
      return levelsCreated.length >= 50;
    },
  },
  [AchievementType.CREATOR_CREATED_100_LEVELS]: {
    name: 'Architect',
    emoji: '🏛️',
    description: 'Created 100 quality levels',
    unlocked: ({ levelsCreated }) => {
      return levelsCreated.length >= 100;
    },
  },
  [AchievementType.CREATOR_CREATED_200_LEVELS]: {
    name: 'Master Architect',
    emoji: '🏯',
    description: 'Created 200 quality levels',
    unlocked: ({ levelsCreated }) => {
      return levelsCreated.length >= 200;
    },
  },
  [AchievementType.CREATOR_CREATED_300_LEVELS]: {
    name: 'Visionary Architect',
    emoji: '🏯',
    description: 'Created 300 quality levels',
    unlocked: ({ levelsCreated }) => {
      return levelsCreated.length >= 300;
    },
  },
};
const difficultyList = getDifficultyList();

export const AchievementRulesTableLevelCompletion: {[achievementType: string]: IAchievementInfoLevelCompletion} = {
  [AchievementType.PLAYER_RANK_KINDERGARTEN]: {
    name: 'Kindergarten',
    emoji: difficultyList[DIFFICULTY_NAMES.KINDERGARTEN].emoji,
    description: 'Completed 10 levels on Kindergarten difficulty',

    unlocked: ({ rollingLevelCompletionSum }) => {
      return rollingLevelCompletionSum[DIFFICULTY_NAMES.KINDERGARTEN] >= 10;
    },
  },
  [AchievementType.PLAYER_RANK_ELEMENTARY]: {
    name: 'Elementary',
    emoji: difficultyList[DIFFICULTY_NAMES.ELEMENTARY].emoji,
    description: 'Completed 25 levels on Elementary difficulty',

    unlocked: ({ rollingLevelCompletionSum }) => {
      return rollingLevelCompletionSum[DIFFICULTY_NAMES.ELEMENTARY] >= 25;
    },
  },
  [AchievementType.PLAYER_RANK_JUNIOR_HIGH]: {
    name: 'Junior High',
    emoji: difficultyList[DIFFICULTY_NAMES.JUNIOR_HIGH].emoji,
    description: 'Completed 25 levels on Junior High difficulty',

    unlocked: ({ rollingLevelCompletionSum }) => {
      return rollingLevelCompletionSum[DIFFICULTY_NAMES.JUNIOR_HIGH] >= 25;
    },
  },
  [AchievementType.PLAYER_RANK_HIGH_SCHOOL]: {
    name: 'High Schooler',
    emoji: difficultyList[DIFFICULTY_NAMES.HIGH_SCHOOL].emoji,
    description: 'Completed 25 levels on High School difficulty',

    unlocked: ({ rollingLevelCompletionSum }) => {
      return rollingLevelCompletionSum[DIFFICULTY_NAMES.HIGH_SCHOOL] >= 25;
    },
  },
  [AchievementType.PLAYER_RANK_BACHELORS]: {
    name: 'Bachelor',
    emoji: difficultyList[DIFFICULTY_NAMES.BACHELORS].emoji,
    description: 'Completed 25 levels on Bachelor\'s difficulty',

    unlocked: ({ rollingLevelCompletionSum }) => {
      return rollingLevelCompletionSum[DIFFICULTY_NAMES.BACHELORS] >= 25;
    },
  },
  [AchievementType.PLAYER_RANK_MASTERS]: {
    name: 'Master',
    emoji: difficultyList[DIFFICULTY_NAMES.MASTERS].emoji,
    description: 'Completed 10 levels on Master\'s difficulty',

    unlocked: ({ rollingLevelCompletionSum }) => {
      return rollingLevelCompletionSum[DIFFICULTY_NAMES.MASTERS] >= 10;
    },
  },
  [AchievementType.PLAYER_RANK_PHD]: {
    name: 'PhD',
    emoji: difficultyList[DIFFICULTY_NAMES.PHD].emoji,
    description: 'Completed 10 levels on PhD difficulty',

    unlocked: ({ rollingLevelCompletionSum }) => {
      return rollingLevelCompletionSum[DIFFICULTY_NAMES.PHD] >= 10;
    },
  },
  [AchievementType.PLAYER_RANK_PROFESSOR]: {
    name: 'Professor',
    emoji: difficultyList[DIFFICULTY_NAMES.PROFESSOR].emoji,
    description: 'Completed 10 levels on Professor difficulty',

    unlocked: ({ rollingLevelCompletionSum }) => {
      return rollingLevelCompletionSum[DIFFICULTY_NAMES.PROFESSOR] >= 10;
    },
  },
  [AchievementType.PLAYER_RANK_GRANDMASTER]: {
    name: 'Grandmaster',
    emoji: difficultyList[DIFFICULTY_NAMES.GRANDMASTER].emoji,
    description: 'Completed 7 levels on Grandmaster difficulty',

    unlocked: ({ rollingLevelCompletionSum }) => {
      return rollingLevelCompletionSum[DIFFICULTY_NAMES.GRANDMASTER] >= 7;
    },
  },
  [AchievementType.PLAYER_RANK_SUPER_GRANDMASTER]: {
    name: 'Super Grandmaster',
    emoji: difficultyList[DIFFICULTY_NAMES.SUPER_GRANDMASTER].emoji,
    description: 'Completed 7 levels on Super Grandmaster difficulty',

    unlocked: ({ rollingLevelCompletionSum }) => {
      return rollingLevelCompletionSum[DIFFICULTY_NAMES.SUPER_GRANDMASTER] >= 7;
    },
  },
};

export enum AchievementCategory {
  'USER' = 'USER',
  'CREATOR' = 'CREATOR',
  'LEVEL_COMPLETION' = 'LEVEL_COMPLETION',
}

export const AchievementCategoryMapping = {
  [AchievementCategory.USER]: AchievementRulesTableUser,
  [AchievementCategory.CREATOR]: AchievementRulesTableCreator,
  [AchievementCategory.LEVEL_COMPLETION]: AchievementRulesTableLevelCompletion,
};

// dynamically calculate
export const AchievementRulesCombined = Object.assign({}, ...Object.values(AchievementCategoryMapping));
