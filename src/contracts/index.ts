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