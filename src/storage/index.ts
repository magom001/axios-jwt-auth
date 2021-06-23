import { IAuthTokens, ITokensStorage } from '../contracts';

class LocalStorageTokensStorage implements ITokensStorage {
  private static ACCESS_KEY_LS_KEY = 'accessToken';
  private static REFRESH_KEY_LS_KEY = 'refreshToken';

  async saveTokens(tokens: IAuthTokens): Promise<void> {
    localStorage.setItem(LocalStorageTokensStorage.ACCESS_KEY_LS_KEY, tokens.accessToken);
    localStorage.setItem(LocalStorageTokensStorage.REFRESH_KEY_LS_KEY, tokens.refreshToken);
  }

  async clearTokens(): Promise<void> {
    localStorage.removeItem(LocalStorageTokensStorage.ACCESS_KEY_LS_KEY);
    localStorage.removeItem(LocalStorageTokensStorage.REFRESH_KEY_LS_KEY);
  }

  async getAccessToken(): Promise<string> {
    return localStorage.getItem(LocalStorageTokensStorage.ACCESS_KEY_LS_KEY) ?? '';
  }

  async getRefreshToken(): Promise<string> {
    return localStorage.getItem(LocalStorageTokensStorage.REFRESH_KEY_LS_KEY) ?? '';
  }
}

export const defaultTokensStorage = new LocalStorageTokensStorage();
