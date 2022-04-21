import { ReviewModel, StatModel, UserModel } from '../../../models/mongoose';
import withAuth, { NextApiRequestWithAuth } from '../../../lib/withAuth';
import type { NextApiResponse } from 'next';
import User from '../../../models/db/user';
import clearTokenCookie from '../../../lib/clearTokenCookie';
import dbConnect from '../../../lib/dbConnect';

export default withAuth(async (req: NextApiRequestWithAuth, res: NextApiResponse) => {
  if (req.method === 'GET') {
    await dbConnect();
    const user = await UserModel.findById<User>(req.userId, '-password');
  
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }
  
    res.status(200).json(user);
  } else if (req.method === 'PUT') {
    await dbConnect();

    const { email, name } = req.body;

    const setObj: {[k: string]: string} = {};

    if (email) {
      setObj['email'] = email;
    }

    if (name) {
      setObj['name'] = name;
    }

    try {
      await UserModel.updateOne({ _id: req.userId }, { $set: setObj });
      res.status(200).json({ updated: true });
    } catch {
      res.status(200).json({ updated: false });
    }
  } else if (req.method === 'DELETE') {
    await dbConnect();

    await Promise.all([
      ReviewModel.deleteMany({ userId: req.userId }),
      StatModel.deleteMany({ userId: req.userId }),
      UserModel.deleteOne({ _id: req.userId }),
    ]);

    res.setHeader('Set-Cookie', clearTokenCookie())
      .status(200).json({ success: true });
  } else {
    return res.status(405).json({
      error: 'Method not allowed',
    });
  }
});
