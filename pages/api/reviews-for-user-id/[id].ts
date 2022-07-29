import { LevelModel, ReviewModel } from '../../../models/mongoose';
import type { NextApiRequest, NextApiResponse } from 'next';
import Level from '../../../models/db/level';
import Review from '../../../models/db/review';
import { cleanUser } from '../../../lib/cleanUser';
import dbConnect from '../../../lib/dbConnect';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  const { id } = req.query;
  const reviews = await getReviewsForUserId(id);

  if (!reviews) {
    return res.status(500).json({
      error: 'Error finding Reviews',
    });
  }

  return res.status(200).json(reviews);
}

export async function getReviewsForUserId(id: string | string[] | undefined) {
  await dbConnect();

  try {
    const levels = await LevelModel.find<Level>({ isDraft: false, userId: id }, '_id');
    const reviews = await ReviewModel.find<Review>({
      levelId: { $in: levels.map(level => level._id) },
    }).populate('levelId', 'name slug').sort({ ts: -1 }).populate('userId', '-email -password');

    reviews.forEach(review => cleanUser(review.userId));

    return reviews;
  } catch (err) {
    console.trace(err);

    return null;
  }
}
