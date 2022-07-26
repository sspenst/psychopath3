import type { NextApiRequest, NextApiResponse } from 'next';
import Review from '../../../models/db/review';
import { ReviewModel } from '../../../models/mongoose';
import dbConnect from '../../../lib/dbConnect';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  await dbConnect();

  try {
    const reviews = await ReviewModel.find<Review>({ 'text': { '$exists': true } })
      .populate('levelId', '_id name slug')
      .populate('userId', 'avatarUpdatedAt name')
      .sort({ ts: -1 })
      .limit(10);

    if (!reviews) {
      return res.status(500).json({
        error: 'Error finding Reviews',
      });
    }

    return res.status(200).json(reviews);
  } catch (e) {
    return res.status(500).json({
      error: 'Error finding Reviews',
    });
  }
}
