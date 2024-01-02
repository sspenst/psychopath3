import { pathologySolveState, sokobanSolveState } from '@root/components/level/solutionStates/helpers';
import { GameState } from '@root/helpers/gameStateHelpers';
import validatePathologySolution from '@root/helpers/solutionValidators/validatePathologySolution';
import validateSokobanSolution from '@root/helpers/solutionValidators/validateSokobanSolution';
import Level from '@root/models/db/level';
import Direction from './direction';
import { GameId } from './GameId';
import Theme from './theme';

export enum GameType {
  COMPLETE_AND_SHORTEST = 'COMPLETE_AND_SHORTEST',
  SHORTEST_PATH = 'SHORTEST_PATH',
  NONE = 'NONE'
}
export const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'thinky.gg';

export const Games: Record<GameId, Game> = {
  [GameId.THINKY]: {
    id: GameId.THINKY,
    baseUrl: process.env.NODE_ENV !== 'development' ? `https://${APP_DOMAIN}` : 'http://localhost:3000',
    subdomain: 'www',
    defaultTheme: Theme.Dark,
    displayName: 'Thinky.gg',
    disableCampaign: true,
    disableCommunityCampaigns: true,
    disableGames: true,
    disableMultiplayer: true,
    disableRanked: true,
    disableTutorial: true,
    favicon: '/logos/thinky/thinky.svg',
    logo: '/logos/thinky/thinky.svg',
    subtitle: 'Thinky Games',
    SEOTitle: 'Thinky Puzzle Games',
    SEODescription: 'Thinky Games is a collection of puzzle games',
    type: GameType.NONE,
    gameStateIsSolveFunction: pathologySolveState,
    validateSolutionFunction: validatePathologySolution,
  },
  [GameId.PATHOLOGY]: {
    id: GameId.PATHOLOGY,
    baseUrl: process.env.NODE_ENV !== 'development' ? `https://pathology.${APP_DOMAIN}` : 'http://pathology.localhost:3000',
    defaultTheme: Theme.Modern,
    displayName: 'Pathology',
    favicon: '/logos/pathology/pathology.svg',
    logo: '/logos/pathology/pathology.svg',
    subtitle: 'Find the way',
    subdomain: 'pathology',
    SEOTitle: 'Pathology - Shortest Path Puzzle Game',
    SEODescription: 'The goal of Pathology is simple. Get to the exit in the least number of moves. Sounds easy right? Yet, this sokoban style game is one of the most mind-bending puzzle games you will find. Different blocks stand in your way to the exit, and your job is to figure out the optimal route',
    shortDescription: 'Get to the exit in the least number of moves',
    stripePaymentLinkMonthly: process.env.STRIPE_PAYMENT_LINK,
    stripePaymentLinkYearly: process.env.STRIPE_PAYMENT_LINK_YEARLY,
    stripeGiftPriceIdMonthly: process.env.STRIPE_GIFT_MONTHLY_PRICE_ID,
    stripeGiftPriceIdYearly: process.env.STRIPE_GIFT_YEARLY_PRICE_ID,
    type: GameType.SHORTEST_PATH,
    videoDemo: 'https://i.imgur.com/bZpBEUW.mp4',
    gameStateIsSolveFunction: pathologySolveState,
    validateSolutionFunction: validatePathologySolution,
  },
  [GameId.SOKOBAN]: {
    id: GameId.SOKOBAN,
    baseUrl: process.env.NODE_ENV !== 'development' ? `https://sokoban.${APP_DOMAIN}` : 'http://sokoban.localhost:3000',
    disableCampaign: true,
    disableCommunityCampaigns: true,
    disableMultiplayer: true,
    disableRanked: true,
    defaultTheme: Theme.Winter,
    displayName: 'Sokoban',
    favicon: '/logos/sokoban/sokoban.webp',
    logo: '/logos/sokoban/sokoban.webp',
    SEOTitle: 'Sokoban - Push the boxes puzzle game',
    SEODescription: 'The goal of the puzzle game Sokoban is simple. Push the boxes onto the goals. Sounds easy right? Yet, this sokoban style game is one of the most mind-bending puzzle games you will find. The boxes can only be pushed, never pulled, and only one can be pushed at a time.',
    shortDescription: 'Push the boxes onto the goals',
    subtitle: 'Push the boxes',
    subdomain: 'sokoban',
    stripePaymentLinkMonthly: process.env.STRIPE_PAYMENT_LINK_SOKOBAN,
    stripePaymentLinkYearly: process.env.STRIPE_PAYMENT_LINK_YEARLY_SOKOBAN,
    stripeGiftPriceIdMonthly: process.env.STRIPE_GIFT_MONTHLY_PRICE_ID_SOKOBAN,
    stripeGiftPriceIdYearly: process.env.STRIPE_GIFT_YEARLY_PRICE_ID_SOKOBAN,
    type: GameType.COMPLETE_AND_SHORTEST,
    videoDemo: 'https://i.imgur.com/7qGspht.mp4',
    gameStateIsSolveFunction: sokobanSolveState,
    validateSolutionFunction: validateSokobanSolution,
  },
};

export interface Game {
  id: GameId;
  /**
     * Base URL for the game - only available on server side until we get NEXT_PUBLIC_APP_DOMAIN working
  */
  baseUrl: string;
  defaultTheme: Theme;
  displayName: string;
  disableCampaign?: boolean;
  disableCommunityCampaigns?: boolean;
  disableGames?: boolean;
  disableMultiplayer?: boolean;
  disableRanked?: boolean;
  disableTutorial?: boolean;
  favicon?: string;
  logo: string;
  subtitle: string;
  SEOTitle: string;
  SEODescription: string;
  shortDescription?: string;
  stripePaymentLinkMonthly?: string;
  stripePaymentLinkYearly?: string;
  stripeGiftPriceIdMonthly?: string;
  stripeGiftPriceIdYearly?: string;
  subdomain: string;
  type: GameType;
  videoDemo?: string;
  gameStateIsSolveFunction: (gameState: GameState) => boolean;
  validateSolutionFunction: (directions: Direction[], level: Level) => boolean;
}
