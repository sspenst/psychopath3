import withAuth, { NextApiRequestWithAuth } from '../../../lib/withAuth';

import Level from '../../../models/db/level';
import { LevelModel } from '../../../models/mongoose';
import type { NextApiResponse } from 'next';
import dbConnect from '../../../lib/dbConnect';

export default withAuth(async (req: NextApiRequestWithAuth, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  await dbConnect();

  const { user_id, time_range, rating, sort_by } = req.query as {user_id: string, time_range:string, rating:string, sort_by:string};

  try {
    const levels = await LevelModel.find<Level>({
      userId: user_id,
    }).sort({ name: 1 });

    if (!levels) {
      return res.status(500).json({
        error: 'Error finding Levels',
      });
    }

    return res.status(200).json(levels);
  }
  catch (e){
    return res.status(500).json({
      error: 'Error finding Levels',
    });
  }
});
