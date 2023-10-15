import { GameId } from '@root/constants/GameId';
import { Types } from 'mongoose';
import { GetServerSidePropsContext } from 'next';
import { Logger } from 'winston';
import TestId from '../../../constants/testId';
import { logger } from '../../../helpers/logger';
import dbConnect, { dbDisconnect } from '../../../lib/dbConnect';
import { getTokenCookieValue } from '../../../lib/getTokenCookie';
import { CampaignModel } from '../../../models/mongoose';
import { getServerSideProps } from '../../../pages/chapter1';

beforeAll(async () => {
  await dbConnect();
  await CampaignModel.create({
    _id: new Types.ObjectId(),
    collections: [new Types.ObjectId(TestId.COLLECTION)],
    gameId: GameId.PATHOLOGY,
    name: 'Chapter 1',
    slug: 'chapter1',
  });
});
afterAll(async () => {
  await dbDisconnect();
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('pages/chapter1 page', () => {
  test('getServerSideProps not logged in', async () => {
    // Created from initialize db file
    const context = {

    };
    const ret = await getServerSideProps(context as GetServerSidePropsContext);

    expect(ret).toBeDefined();
    expect((ret as any).props).toBeUndefined();
  });
  test('getServerSideProps logged in', async () => {
    // Created from initialize db file
    const context = {
      req: {
        cookies: {
          token: getTokenCookieValue(TestId.USER)
        }
      },
    };
    const ret = await getServerSideProps(context as unknown as GetServerSidePropsContext);

    expect(ret).toBeDefined();
    expect((ret as any).props).toBeDefined();
    expect((ret as any).props?.enrichedCollections).toBeDefined();
    expect((ret as any).props?.enrichedCollections[0]._id).toBe(TestId.COLLECTION);
  });
  test('getServerSideProps logged in no collection exists', async () => {
    jest.spyOn(logger, 'error').mockImplementation(() => ({} as Logger));
    await CampaignModel.deleteOne({ 'slug': 'chapter1' });
    // Created from initialize db file
    const context = {
      req: {
        cookies: {
          token: getTokenCookieValue(TestId.USER)
        }
      },
    };
    const ret = await getServerSideProps(context as unknown as GetServerSidePropsContext);

    expect(ret).toBeDefined();
    expect((ret as any).props).toBeUndefined();
  });
});
