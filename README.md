# Axios JWT authentication interceptor

[![Tests](https://github.com/magom001/axios-jwt-auth/actions/workflows/node.js.yml/badge.svg)](https://github.com/magom001/axios-jwt-auth/actions/workflows/node.js.yml)

`npm i axios-jwt-auth`

Attach authorization token to outcoming requests. Intercept response errors, refresh if needed. Fully customizable.

100% TypeScript. No external dependencies.

## Minimal configuration

```typescript
/**
 * Do not use the same axios instance to refresh tokens as you do for your authenticated requests!.
 */
const refreshTokens = async (token: Token) => {
  const { data } = (await axios.post)<IAuthTokens>('/api/refresh', { token });

  return data;
};

const axiosInstance = axios.create();
const config: Config = { refreshTokens };

applyInterceptors(axiosInstance, config);
```

## Additional configuration

By default localStorage is used to store auth tokens. You can provide your own storage by implementing `ITokensStorage` interface.

Tokens are refreshed if a request returns with 401 status. Override `shouldRefresh` to change this behavior.

Access token is attached to headers using Bearer scheme. Override `applyAccessToken` to change this behavior.

If refresh tokens requests fails an optional `onFailedToRefresh` is fired with the request's error object as argument.
