import { ObjectId } from 'bson';
import { PipelineStage } from 'mongoose';
import type { NextApiResponse } from 'next';
import { ValidObjectId, ValidObjectIdArray, ValidType } from '../../../helpers/apiWrapper';
import { enrichLevels } from '../../../helpers/enrich';
import { generateCollectionSlug } from '../../../helpers/generateSlug';
import dbConnect from '../../../lib/dbConnect';
import withAuth, { NextApiRequestWithAuth } from '../../../lib/withAuth';
import Collection from '../../../models/db/collection';
import { CollectionModel } from '../../../models/mongoose';
import { LEVEL_DEFAULT_PROJECTION } from '../../../models/schemas/levelSchema';
import { USER_DEFAULT_PROJECTION } from '../../../models/schemas/userSchema';

type UpdateLevelParams = {
  authorNote?: string,
  levels?: (string | ObjectId)[],
  name?: string,
  slug?: string,
}

export async function getCollection( matchQuery: PipelineStage) {
  await dbConnect();

  const collectionAgg = await CollectionModel.aggregate<Collection>([
    {
      ...matchQuery,
    },

    {
      $lookup: {
        as: 'levels',
        foreignField: '_id',
        from: 'levels',
        localField: 'levels',
        // project only the fields we need
        pipeline: [
          {
            $match: {
              isDraft: false,
            }
          },
          {
            $project: {
              ...LEVEL_DEFAULT_PROJECTION
            }
          }
        ],
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userId',
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
      $unwind: {
        path: '$userId',
        preserveNullAndEmptyArrays: true,
      }
    },
  ]);

  const collection = collectionAgg.length > 0 ? collectionAgg[0] : null;

  return collection;
}

export default withAuth({
  GET: {
    query: {
      id: ValidObjectId(),
    }
  },
  PUT: {
    query: {
      id: ValidObjectId(),
    },
    body: {
      authorNote: ValidType('string', false),
      levels: ValidObjectIdArray(false),
      name: ValidType('string', false),
    },
  },
  DELETE: {
    query: {
      id: ValidObjectId(),
    }
  }
}, async (req: NextApiRequestWithAuth, res: NextApiResponse) => {
  if (req.method === 'GET') {
    const { id } = req.query;

    await dbConnect();

    const collection = await getCollection({ $match: {
      _id: new ObjectId(id as string),
      userId: req.user._id,
    } });

    if (!collection) {
      return res.status(404).json({
        error: 'Error finding Collection',
      });
    }

    const enrichedCollectionLevels = await enrichLevels(collection.levels, req.user);
    const newCollection = JSON.parse(JSON.stringify(collection));

    newCollection.levels = enrichedCollectionLevels;

    return res.status(200).json(newCollection);
  } else if (req.method === 'PUT') {
    const { id } = req.query;
    const { authorNote, name, levels } = req.body as UpdateLevelParams;

    if (!authorNote && !name && !levels) {
      res.status(400).json({ error: 'Missing required fields' });

      return;
    }

    await dbConnect();

    const setObj: UpdateLevelParams = {};

    if (authorNote) {
      setObj.authorNote = authorNote.trim();
    }

    if (name) {
      const trimmedName = name.trim();

      setObj.name = trimmedName;
      // TODO: in extremely rare cases there could be a race condition, might need a transaction here
      setObj.slug = await generateCollectionSlug(req.user.name, trimmedName, id as string);
    }

    if (levels) {
      setObj.levels = (levels as string[]).map(i => new ObjectId(i));
    }

    const collection = await CollectionModel.findOneAndUpdate({
      _id: id,
      userId: req.userId,
    }, {
      $set: setObj,
    }, {
      new: true,
      runValidators: true,
    }).populate({ path: 'levels' });

    if (!collection) {
      return res.status(401).json({ error: 'User is not authorized to perform this action' });
    }

    const enrichedCollectionLevels = await enrichLevels(collection.levels, req.user);
    const newCollection = JSON.parse(JSON.stringify(collection));

    newCollection.levels = enrichedCollectionLevels;

    return res.status(200).json(newCollection);
  } else if (req.method === 'DELETE') {
    const { id } = req.query;

    const collection = await CollectionModel.findById<Collection>(id);

    if (!collection) {
      return res.status(404).json({
        error: 'Collection not found',
      });
    }

    if (collection.userId.toString() !== req.userId) {
      return res.status(401).json({
        error: 'Not authorized to delete this Collection',
      });
    }

    await CollectionModel.deleteOne({ _id: id });

    return res.status(200).json({ updated: true });
  }
});
