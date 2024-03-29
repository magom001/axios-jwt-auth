import { AxiosError, AxiosHeaders, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

import { Token, Config } from '../interfaces';
import { defaultTokensStorage } from '../storage';

let refreshPromise: Promise<Token> | null = null;

const defaultApplyAccessToken: Config['applyAccessToken'] = (requestConfig, token) => {
  requestConfig.headers = new AxiosHeaders({ Authorization: `Bearer ${token}` });
};

const defaultShouldRefresh: Config['shouldRefresh'] = async (error: AxiosError) => {
  return error.response?.status === 401;
};

const requestInterceptor =
  ({ applyAccessToken = defaultApplyAccessToken, tokensStorage = defaultTokensStorage }: Config) =>
  async (requestConfig: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    let accessToken = await tokensStorage.getAccessToken();

    if (refreshPromise) {
      accessToken = await refreshPromise;
    }

    applyAccessToken(requestConfig, accessToken);

    return requestConfig;
  };

const responseErrorInterceptor =
  (
    axios: AxiosInstance,
    {
      tokensStorage = defaultTokensStorage,
      shouldRefresh = defaultShouldRefresh,
      refreshTokens,
      onFailedToRefresh,
    }: Config,
  ) =>
  async (error: AxiosError) => {
    if (await shouldRefresh(error)) {
      if (refreshPromise) {
        await refreshPromise;

        return axios.request(error.config ?? {});
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

          onFailedToRefresh?.(e as AxiosError<unknown>);
        } finally {
          refreshPromise = null;
        }
      });

      await refreshPromise;

      return axios.request(error.config ?? {});
    }

    throw error;
  };

/**
 * @param {AxiosInstance} axios
 * @param {Config} config
 */
export const applyInterceptors = (axios: AxiosInstance, config: Config): void => {
  axios.interceptors.request.use(requestInterceptor(config));
  axios.interceptors.response.use(undefined, responseErrorInterceptor(axios, config));
};
