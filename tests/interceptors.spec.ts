import axios from 'axios';
import nock from 'nock';

import { IAuthTokens, ITokensStorage, Token } from '../src/contracts';
import { applyInterceptors } from '../src/interceptors';

class InMemoryTokensStorage implements ITokensStorage {
  private accessToken = '';
  private refreshToken = '';

  async saveTokens(tokens: IAuthTokens): Promise<void> {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
  }

  async clearTokens(): Promise<void> {
    this.accessToken = '';
    this.refreshToken = '';
  }

  async getAccessToken(): Promise<string> {
    return this.accessToken;
  }

  async getRefreshToken(): Promise<string> {
    return this.refreshToken;
  }
}

const baseURL = 'https://localhost:9999';

describe('JWT interceptor', () => {
  const getAxiosInstance = () => {
    const tokensStorage = new InMemoryTokensStorage();

    const refreshTokens = async (token: Token) => {
      const { data } = await axios.post<IAuthTokens>(`${baseURL}/api/refresh`, { token });

      return data;
    };

    const axiosInstance = axios.create({ baseURL });
    applyInterceptors(axiosInstance, { refreshTokens, tokensStorage });

    return { axiosInstance, tokensStorage };
  };

  it('should apply access token', async () => {
    const accessToken = 'xxxx-xxxx-xxxx-xxxx';
    const scope = nock(baseURL)
      .get('/api/test')
      .matchHeader('authorization', `Bearer ${accessToken}`)
      .reply(200, { ok: 'ok' });

    const { axiosInstance, tokensStorage } = getAxiosInstance();

    tokensStorage.saveTokens({ accessToken, refreshToken: '' });

    const { data } = await axiosInstance.get('/api/test');

    expect(data).toEqual({ ok: 'ok' });
    expect(scope.isDone()).toBe(true);
  });

  it('should refresh tokens when 401 status is received', async () => {
    const accessToken = 'xxxx-xxxx-xxxx-xxxx';
    const refreshToken = 'xxxx-refresh-xxxx';
    const newTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    const scope = nock(baseURL)
      .get('/api/test')
      .reply(401)
      .post('/api/refresh')
      .reply(200, newTokens)
      .get('/api/test')
      .matchHeader('authorization', `Bearer ${newTokens.accessToken}`)
      .reply(200, { ok: 'ok' });

    const { axiosInstance, tokensStorage } = getAxiosInstance();

    tokensStorage.saveTokens({ accessToken, refreshToken });

    const { data } = await axiosInstance.get('/api/test');

    expect(data).toEqual({ ok: 'ok' });
    expect(scope.isDone()).toBe(true);
    expect(await tokensStorage.getRefreshToken()).toEqual(newTokens.refreshToken);
    expect(await tokensStorage.getAccessToken()).toEqual(newTokens.accessToken);
  });

  it('new requests should wait till refresh is resolved', async () => {
    const accessToken = 'xxxx-xxxx-xxxx-xxxx';
    const refreshToken = 'xxxx-refresh-xxxx';
    const newTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };
    const scope = nock(baseURL)
      .get('/api/test')
      .reply(401)
      .post('/api/refresh')
      .delay(300)
      .reply(200, newTokens)
      .get('/api/test')
      .matchHeader('authorization', `Bearer ${newTokens.accessToken}`)
      .thrice()
      .reply(200, { ok: 'ok' });

    const { axiosInstance, tokensStorage } = getAxiosInstance();

    tokensStorage.saveTokens({ accessToken, refreshToken });

    axiosInstance.get('/api/test');

    await new Promise((r) => setTimeout(r, 100));

    await Promise.all([axiosInstance.get('/api/test'), axiosInstance.get('/api/test')]);

    expect(scope.isDone()).toBe(true);
  });

  it('should refresh only once when several parallel requests resolve with 401', async () => {
    const accessToken = 'xxxx-xxxx-xxxx-xxxx';
    const refreshToken = 'xxxx-refresh-xxxx';
    const newTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };
    const scope = nock(baseURL)
      .get('/api/test')
      .thrice()
      .reply(401)
      .post('/api/refresh')
      .reply(200, newTokens)
      .get('/api/test')
      .matchHeader('authorization', `Bearer ${newTokens.accessToken}`)
      .thrice()
      .reply(200, { ok: 'ok' });

    const { axiosInstance, tokensStorage } = getAxiosInstance();

    tokensStorage.saveTokens({ accessToken, refreshToken });

    await Promise.all([
      axiosInstance.get('/api/test'),
      axiosInstance.get('/api/test'),
      axiosInstance.get('/api/test'),
    ]);

    expect(scope.isDone()).toBe(true);
  });

  it('should reject requests if refresh fails', async () => {
    expect.assertions(4);

    const accessToken = 'xxxx-xxxx-xxxx-xxxx';
    const refreshToken = 'xxxx-refresh-xxxx';

    const scope = nock(baseURL)
      .get('/api/test')
      .thrice()
      .reply(401)
      .post('/api/refresh')
      .reply(500);

    const { axiosInstance, tokensStorage } = getAxiosInstance();

    tokensStorage.saveTokens({ accessToken, refreshToken });

    const requests = [
      axiosInstance.get('/api/test'),
      axiosInstance.get('/api/test'),
      axiosInstance.get('/api/test'),
    ];

    for (const r of requests) {
      await expect(r).rejects.toMatchSnapshot();
    }

    expect(scope.isDone()).toBe(true);
  });

  it('should reject queued requests if refresh fails', async () => {
    expect.assertions(4);

    const accessToken = 'xxxx-xxxx-xxxx-xxxx';
    const refreshToken = 'xxxx-refresh-xxxx';

    const scope = nock(baseURL)
      .get('/api/test')
      .reply(401)
      .post('/api/refresh')
      .delay(300)
      .reply(500);

    const { axiosInstance, tokensStorage } = getAxiosInstance();

    tokensStorage.saveTokens({ accessToken, refreshToken });

    const initial = axiosInstance.get('/api/test');

    await new Promise((r) => setTimeout(r, 100));

    const requests = [initial, axiosInstance.get('/api/test'), axiosInstance.get('/api/test')];

    for (const r of requests) {
      await expect(r).rejects.toMatchSnapshot();
    }

    expect(scope.isDone()).toBe(true);
  });
});
