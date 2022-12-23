import { ObjectId } from 'bson';
import { PipelineStage } from 'mongoose';
import { NextApiResponse } from 'next';
import NotificationType from '../../../constants/notificationType';
import { ValidEnum, ValidObjectId, ValidType } from '../../../helpers/apiWrapper';
import { clearNotifications, createNewWallPostNotification } from '../../../helpers/notificationHelper';
import cleanUser from '../../../lib/cleanUser';
import withAuth, { NextApiRequestWithAuth } from '../../../lib/withAuth';
import Comment, { EnrichedComment } from '../../../models/db/comment';
import User from '../../../models/db/user';
import { CommentModel } from '../../../models/mongoose';
import { USER_DEFAULT_PROJECTION } from '../../../models/schemas/userSchema';

export const COMMENT_QUERY_LIMIT = 10;

export interface CommentQuery {
  comments: EnrichedComment[];
  totalRows: number;
}

export default withAuth({
  GET: {
    query: {
      id: ValidObjectId(),
      skip: ValidType('string', false),
      targetModel: ValidType('string', false),
    },
  },
  POST: {
    body: {
      text: ValidType('string', true),
      targetModel: ValidEnum(['User', 'Comment'])
    },
    query: {
      id: ValidObjectId()
    }
  },
  DELETE: {
    query: {
      id: ValidObjectId()
    }
  }
}, async (req: NextApiRequestWithAuth, res: NextApiResponse) => {
  if (req.method === 'GET') {
    const { id, skip, targetModel } = req.query;

    let skipNum = 0;

    if (skip) {
      skipNum = parseInt(skip as string);
    }

    const tm = targetModel || 'User';

    const lookupStage = (tm === 'User' ? [{
      $lookup: {
        from: 'comments',
        localField: '_id',
        foreignField: 'target',
        as: 'children',
        pipeline: [
          {
            $sort: {
              createdAt: 1
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'author',
              foreignField: '_id',
              as: 'author',
              pipeline: [
                {
                  $project: {
                    ...USER_DEFAULT_PROJECTION
                  }
                }
              ]
            }
          },
          {
            $unwind: '$author'
          },
          { '$facet': {
            metadata: [ { $count: 'totalRows' } ],
            data: [ { $limit: COMMENT_QUERY_LIMIT } ]
          } },
          {
            $unwind: {
              path: '$metadata',
              preserveNullAndEmptyArrays: true,
            }
          },
        ]
      }
    }] : []) as PipelineStage[];

    const commentsAggregate = await CommentModel.aggregate([
      {
        $match: {
          deletedAt: null,
          target: new ObjectId(id as string),
          targetModel: tm,
        }
      },
      // conditionally look up model if target is not user
      ...lookupStage,
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author',
          pipeline: [
            {
              $project: {
                ...USER_DEFAULT_PROJECTION
              }
            }
          ]
        }
      },
      {
        $unwind: '$author'
      },
      {
        $sort: {
          createdAt: tm === 'User' ? -1 : 1,
        }
      },
      { '$facet': {
        metadata: [ { $count: 'totalRows' } ],
        data: [ { $skip: skipNum }, { $limit: COMMENT_QUERY_LIMIT } ]
      } },
      {
        $unwind: {
          path: '$metadata',
          preserveNullAndEmptyArrays: true,
        }
      },
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const comments = commentsAggregate[0]?.data as (EnrichedComment & { children: any })[];

    for (const comment of comments) {
      cleanUser(comment.author);

      if (comment.children) {
        comment.replies = comment.children[0]?.data;
        comment.totalReplies = comment.children[0]?.metadata?.totalRows || 0;

        for (const reply of comment.replies) {
          cleanUser(reply.author);
        }

        delete comment.children;
      }
    }

    return res.status(200).json({
      comments: comments as EnrichedComment[],
      totalRows: commentsAggregate[0]?.metadata?.totalRows || 0,
    } as CommentQuery);
  } else if (req.method === 'POST') {
    const { id } = req.query;
    const { text, targetModel } = req.body;
    const textTrimmed = text.trim();

    if (textTrimmed.length === 0 || textTrimmed.length > 1000) {
      return res.status(400).json({ error: 'Comment must be between 1-500 characters' });
    }

    const target = new ObjectId(id as string);
    // POST means create new comment
    const comment = await CommentModel.create({
      author: req.user._id,
      text: textTrimmed,
      target: target,
      targetModel: targetModel
    });

    // TODO: check if this target has a parent, if so that is the model we want to notify

    if (targetModel === 'User' && target.toString() !== req.user._id.toString()) {
      await createNewWallPostNotification(NotificationType.NEW_WALL_POST, target, comment.author, target, JSON.stringify(comment));
    } else {
      const parentComment = await CommentModel.findOne({
        _id: target,
        deletedAt: null
      }, {}, {
        lean: true
      });

      if (parentComment && parentComment?.author.toString() !== req.user._id.toString()) {
        await createNewWallPostNotification(NotificationType.NEW_WALL_REPLY, parentComment.author, req.user._id, parentComment.target, JSON.stringify(comment));
      }
    }

    return res.status(200).json(comment);
  } else if (req.method === 'DELETE') {
    const { id } = req.query;

    const deletedComment = await deleteComment(new ObjectId(id as string), req.user);

    if (!deletedComment) {
      return res.status(400).json({ error: 'There was a problem deleting this comment.' });
    }

    return res.status(200).json(deletedComment);
  }
}
);

async function deleteComment(commentId: ObjectId, reqUser: User): Promise<Comment | null> {
  // DELETE means delete comment
  const comment = await CommentModel.findOneAndUpdate({
    _id: commentId,
    author: reqUser._id,
    deletedAt: null
  }, {
    deletedAt: new Date()
  }, {
    new: true,
  });
  // TODO: delete all children? Probably not... Technically they are still there, just hidden from queries
  // this may be kind of complicated if we allow viewing your comments in your profile
  // if the parent of one of your comments was deleted... how do we handle that? do we care or just let it be?
  // maybe reddit style where you can see the parent comment but it's greyed out and says "deleted" or something

  if (!comment) {
    return null;
  }

  const [findParent, findChildren] = await Promise.all(
    [
      CommentModel.findOne({
        _id: comment.target,
        deletedAt: null
      }, {}, {
        lean: true
      }),
      CommentModel.find({
        target: comment._id,
        deletedAt: null
      }, {}, {
        lean: true
      })
    ]);

  const promises = [];

  for (const child of findChildren) {
    promises.push(deleteComment(child._id, child.author));
  }

  console.log('promises length: ', promises.length);
  promises.push(clearNotifications(comment.target, comment.author, comment.target, NotificationType.NEW_WALL_POST)),
  promises.push(clearNotifications(findParent?.author._id, comment.author, findParent?.author._id, NotificationType.NEW_WALL_REPLY)),

  await Promise.all(promises);

  return comment as Comment;
}
