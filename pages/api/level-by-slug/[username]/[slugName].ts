import type { NextApiRequest, NextApiResponse } from 'next';
import { enrichLevels } from '../../../../helpers/enrich';
import { logger } from '../../../../helpers/logger';
import cleanUser from '../../../../lib/cleanUser';
import dbConnect from '../../../../lib/dbConnect';
import { getUserFromToken } from '../../../../lib/withAuth';
import User from '../../../../models/db/user';
import { LevelModel } from '../../../../models/mongoose';
import { LevelUrlQueryParams } from '../../../level/[username]/[slugName]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  const { slugName, username } = req.query as LevelUrlQueryParams;
  const token = req?.cookies?.token;
  const reqUser = token ? await getUserFromToken(token) : null;
  const level = await getLevelByUrlPath(username, slugName, reqUser);

  if (!level) {
    return res.status(404).json({
      error: 'Level not found',
    });
  }

  return res.status(200).json(level);
}

export async function getLevelByUrlPath(username: string, slugName: string, reqUser: User | null) {
  await dbConnect();

  try {
    const level = await LevelModel.findOne({
      slug: username + '/' + slugName,
      isDraft: false
    }, '_id data name userId points ts width height leastMoves slug authorNote')
      .populate('userId', '-email -password');

    cleanUser(level.userId);

    const enrichedLevelArr = await enrichLevels([level], reqUser);
    const ret = enrichedLevelArr[0];

    return ret;
  } catch (err) {
    logger.trace(err);

    return null;
  }
}
