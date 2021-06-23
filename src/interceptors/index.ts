import { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

import { Token, Config } from '../contracts';
import { defaultTokensStorage } from '../storage';

let refreshPromise: Promise<Token> | null = null;

const defaultApplyAccessToken: Config['applyAccessToken'] = (requestConfig, token) => {
  requestConfig.headers.Authorization = `Bearer ${token}`;
};

const requestInterceptor =
  ({ applyAccessToken = defaultApplyAccessToken, tokensStorage = defaultTokensStorage }: Config) =>
  async (requestConfig: AxiosRequestConfig): Promise<AxiosRequestConfig> => {
    let accessToken = await tokensStorage.getAccessToken();

    if (refreshPromise) {
      accessToken = await refreshPromise;
    }

    applyAccessToken(requestConfig, accessToken);

    return requestConfig;
  };

const responseErrorInterceptor =
  (axios: AxiosInstance, { tokensStorage = defaultTokensStorage, refreshTokens }: Config) =>
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (refreshPromise) {
        await refreshPromise;

        return axios.request(error.config);
      }

      refreshPromise = new Promise(async (resolve, reject) => {
        try {
          const refreshToken = await tokensStorage.getRefreshToken();
          if (!refreshToken) {
            throw error;
          }

          const tokens = await refreshTokens(refreshToken);

          await tokensStorage.saveTokens(tokens);

          resolve(tokens.accessToken);
        } catch (e) {
          await tokensStorage.clearTokens();

          reject(e);
        } finally {
          refreshPromise = null;
        }
      });

      await refreshPromise;

      return axios.request(error.config);
    }

    throw error;
  };

export const applyInterceptors = (axios: AxiosInstance, config: Config): void => {
  axios.interceptors.request.use(requestInterceptor(config));
  axios.interceptors.response.use(undefined, responseErrorInterceptor(axios, config));
};
