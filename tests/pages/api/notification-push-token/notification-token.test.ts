import { enableFetchMocks } from 'jest-fetch-mock';
import { testApiHandler } from 'next-test-api-route-handler';
import TestId from '../../../../constants/testId';
import dbConnect, { dbDisconnect } from '../../../../lib/dbConnect';
import { getTokenCookieValue } from '../../../../lib/getTokenCookie';
import { NextApiRequestWithAuth } from '../../../../lib/withAuth';
import handler from '../../../../pages/api/notification-push-token/index';

afterEach(() => {
  jest.restoreAllMocks();
});
beforeAll(async () => {
  await dbConnect();
});
afterAll(async () => {
  await dbDisconnect();
});
enableFetchMocks();

describe('PUT /api/notification-push-token', () => {
  test('should return 200', async () => {
    await testApiHandler({
      handler: async (_, res) => {
        const req: NextApiRequestWithAuth = {
          cookies: {
            token: getTokenCookieValue(TestId.USER),
          },
          method: 'PUT',
          body: {
            deviceToken: 'testToken',
            deviceName: 'testName',
            deviceBrand: 'testBrand',
            deviceOSName: 'testOS',
            deviceOSVersion: 'testOSVersion',
          },
          headers: {
            'content-type': 'application/json',
          },

        } as unknown as NextApiRequestWithAuth;

        await handler(req, res);
      },
      test: async ({ fetch }) => {
        const res = await fetch();
        const response = await res.json();

        expect(response.error).toBeUndefined();
        expect(res.status).toBe(200);
        expect(response.deviceToken).toBe('testToken');
        expect(response.deviceName).toBe('testName');
        expect(response.deviceBrand).toBe('testBrand');
        expect(response.deviceOSName).toBe('testOS');
        expect(response.deviceOSVersion).toBe('testOSVersion');
      },
    });
  });
  test('should repeat 200', async () => {
    await testApiHandler({
      handler: async (_, res) => {
        const req: NextApiRequestWithAuth = {
          cookies: {
            token: getTokenCookieValue(TestId.USER),
          },
          method: 'PUT',
          body: {
            deviceToken: 'testToken',
            deviceName: 'testName',
            deviceBrand: 'testBrand2',
            deviceOSName: 'testOS',
            deviceOSVersion: 'testOSVersion',
          },
          headers: {
            'content-type': 'application/json',
          },

        } as unknown as NextApiRequestWithAuth;

        await handler(req, res);
      },
      test: async ({ fetch }) => {
        const res = await fetch();
        const response = await res.json();

        expect(response.error).toBeUndefined();
        expect(res.status).toBe(200);
        expect(response.deviceToken).toBe('testToken');
        expect(response.deviceName).toBe('testName');
        expect(response.deviceBrand).toBe('testBrand2');
        expect(response.deviceOSName).toBe('testOS');
        expect(response.deviceOSVersion).toBe('testOSVersion');
      },
    });
  });
  test('should delete 200', async () => {
    await testApiHandler({
      handler: async (_, res) => {
        const req: NextApiRequestWithAuth = {
          cookies: {
            token: getTokenCookieValue(TestId.USER),
          },
          method: 'DELETE',
          body: {
            deviceToken: 'testToken',
            deviceName: 'testName',
            deviceBrand: 'testBrand2',
            deviceOSName: 'testOS',
            deviceOSVersion: 'testOSVersion',
          },
          headers: {
            'content-type': 'application/json',
          },

        } as unknown as NextApiRequestWithAuth;

        await handler(req, res);
      },
      test: async ({ fetch }) => {
        const res = await fetch();
        const response = await res.json();

        expect(response.error).toBeUndefined();
        expect(res.status).toBe(200);
        expect(response.deviceToken).toBe('testToken');
        expect(response.deviceName).toBe('testName');
        expect(response.deviceBrand).toBe('testBrand2');
        expect(response.deviceOSName).toBe('testOS');
        expect(response.deviceOSVersion).toBe('testOSVersion');
      },
    });
  });
});
