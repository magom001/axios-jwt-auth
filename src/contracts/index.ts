import { AxiosRequestConfig } from 'axios';

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
  applyAccessToken?: (requestConfig: AxiosRequestConfig, accessToken: Token) => void;
  tokensStorage?: ITokensStorage;
  refreshTokens(refreshToken: Token): Promise<IAuthTokens>;
}
