import { NextApiResponse } from 'next';
import { NextApiRequestWithAuth } from '../lib/withAuth';

export default async function revalidateUniverse(req: NextApiRequestWithAuth, res: NextApiResponse) {
  try {
    const revalidateRes = await fetch(`${req.headers.origin}/api/revalidate/universe/${req.userId}?secret=${process.env.REVALIDATE_SECRET}`);
    if (revalidateRes.status === 200) {
      return res.status(200).json({ updated: true });
    } else {
      throw await revalidateRes.text();
    }
  } catch (err) {
    console.error(err);
    console.trace()
    return res.status(500).json({
      error: 'Error revalidating universe ' + err,
    });
  }
}
