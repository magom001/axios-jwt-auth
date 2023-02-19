import { AxiosError, InternalAxiosRequestConfig } from 'axios';

export type Token = string;

export interface IAuthTokens {
  accessToken: Token;
  refreshToken: Token;
}

export interface ITokensStorage {
  saveTokens(tokens: IAuthTokens): Promise<void>;
  clearTokens(): Promise<void>;
  getAccessToken(): Promise<Token>;
  getRefreshToken(): Promise<Token>;
}

export interface Config {
  /**
   * Provide a custom function to attach access token to the outcoming request.
   * By default Bearer Authentication is used.
   *
   * @param {InternalAxiosRequestConfig} requestConfig
   */
  applyAccessToken?: (requestConfig: InternalAxiosRequestConfig, accessToken: Token) => void;
  /**
   * Provide a custom storage for the tokens. Should implement ITokensStorage interfaces.
   * Default to localStorage.
   */
  tokensStorage?: ITokensStorage;
  /**
   * A callback called to refresh tokens. The response should extend IAuthTokens interface.
   *
   * @param {Token} refreshToken
   */
  refreshTokens(refreshToken: Token): Promise<IAuthTokens>;
  /**
   * A callback that accepts an AxiosError and resolves into a boolean.
   * By default will refresh tokens on 401 status code.
   *
   * @param {AxiosError} error
   * @returns {Promise<boolean>}
   */
  shouldRefresh?: (error: AxiosError) => Promise<boolean>;

  /**
   * Optional callback fired when refresh requests fails.
   *
   * @param {AxiosError} error
   */
  onFailedToRefresh?: (error: AxiosError) => void;
}
