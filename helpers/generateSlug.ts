import { QueryOptions } from 'mongoose';
import Collection from '../models/db/collection';
import Level from '../models/db/level';
import { CollectionModel, LevelModel } from '../models/mongoose';

async function getLevelBySlug(slug: string, options?: QueryOptions): Promise<Level | null> {
  return await LevelModel.findOne({ slug: slug }, {}, options);
}

async function getCollectionBySlug(slug: string, options?: QueryOptions): Promise<Collection | null> {
  return await CollectionModel.findOne({ slug: slug }, {}, options);
}

function slugify(str: string) {
  const slug = str
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, '')
    .trim().replace(/\s+/g, '-');

  // return a dash for strings with no alphanumeric characters
  return slug === '' ? '-' : slug;
}

export async function generateCollectionSlug(
  userName: string,
  collectionName: string,
  existingCollectionId?: string,
  options?: QueryOptions,
) {
  const og_slug = slugify(userName) + '/' + slugify(collectionName);
  let slug = og_slug;
  let i = 2;

  while (i < 20) {
    const collection = await getCollectionBySlug(slug, options);

    if (!collection) {
      return slug;
    }

    if (collection._id.toString() === existingCollectionId) {
      return slug;
    }

    slug = og_slug + '-' + i;
    i++;
  }

  throw new Error('Couldn\'t generate a unique collection slug');
}

export async function generateLevelSlug(
  userName: string,
  levelName: string,
  existingLevelId?: string,
  options?: QueryOptions,
) {
  const og_slug = slugify(userName) + '/' + slugify(levelName);
  let slug = og_slug;
  let i = 2;

  while (i < 20) {
    const level = await getLevelBySlug(slug, options);

    if (!level) {
      return slug;
    }

    if (level._id.toString() === existingLevelId) {
      return slug;
    }

    slug = og_slug + '-' + i;
    i++;
  }

  throw new Error('Couldn\'t generate a unique level slug');
}
