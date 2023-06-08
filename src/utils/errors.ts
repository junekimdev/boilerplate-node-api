export interface IError {
  status: number;
  code: string;
  error_in: string;
  message: string;
}

export type errDefType = {
  [codeName: string]: { [errorName: string]: IError };
};

export class AppError extends Error implements IError {
  status: number;
  code: string;
  error_in: string;

  constructor(obj: IError = errDef[500].InternalError, options?: ErrorOptions) {
    super(obj.message, options);
    this.status = obj.status;
    this.code = obj.code;
    this.error_in = obj.error_in;
  }
}

export const errDef: errDefType = {
  '400': {
    InvalidEmailFormat: {
      status: 400,
      code: 'E400-InvalidEmailFormat',
      error_in: 'ReqBody',
      message: 'Invalid Email Format',
    },
    InvalidEmailFormatAuth: {
      status: 400,
      code: 'E400-InvalidEmailFormatAuth',
      error_in: 'ReqHeaders',
      message: 'Invalid Email Format',
    },
    DeviceIdNotFound: {
      status: 400,
      code: 'E400-DeviceIdNotFound',
      error_in: 'ReqBody',
      message: 'Device Id Not Found',
    },
    InvalidPayload: {
      status: 400,
      code: 'E400-InvalidPayload',
      error_in: 'ReqBody',
      message: 'Invalid Payload',
    },
    InvalidPushSubscription: {
      status: 400,
      code: 'E400-InvalidPushSubscription',
      error_in: 'ReqBody',
      message: 'Invalid Push Subscription',
    },
    InvalidPushTopic: {
      status: 400,
      code: 'E400-InvalidPushTopic',
      error_in: 'ReqBody',
      message: 'Invalid Push Topic',
    },
  },
  '401': {
    AuthorizationNotFound: {
      status: 401,
      code: 'E401-AuthorizationNotFound',
      error_in: 'ReqHeaders',
      message: 'Authorization Not Found',
    },
    InvalidAuthScheme: {
      status: 401,
      code: 'E401-InvalidAuthScheme',
      error_in: 'ReqHeaders',
      message: 'Invalid Auth Scheme',
    },
    UserCredentialNotFound: {
      status: 401,
      code: 'E401-UserCredentialNotFound',
      error_in: 'ReqHeaders',
      message: 'User Credential Not Found',
    },
    AccessTokenNotFound: {
      status: 401,
      code: 'E401-AccessTokenNotFound',
      error_in: 'ReqHeaders',
      message: 'Access Token Not Found',
    },
    RefreshTokenNotFound: {
      status: 401,
      code: 'E401-RefreshTokenNotFound',
      error_in: 'ReqHeaders',
      message: 'Refresh Token Not Found',
    },
    InvalidCredential: {
      status: 401,
      code: 'E401-InvalidCredential',
      error_in: 'Auth',
      message: 'Invalid Credential',
    },
    InvalidToken: {
      status: 401,
      code: 'E401-InvalidToken',
      error_in: 'Auth',
      message: 'Invalid Token',
    },
    TokenExpired: {
      status: 401,
      code: 'E401-TokenExpired',
      error_in: 'Auth',
      message: 'Token Expired',
    },
  },
  '403': {
    AccessDenied: {
      status: 403,
      code: 'E403-AccessDenied',
      error_in: 'Auth',
      message: 'Not Allowed To Access Resources',
    },
    AccessUndefined: {
      status: 403,
      code: 'E403-AccessUndefined',
      error_in: 'Auth',
      message: 'Access Control is undefined',
    },
  },
  '409': {
    UserAlreadyExists: {
      status: 409,
      code: 'E409-UserAlreadyExists',
      error_in: 'Auth',
      message: 'User Already Exists',
    },
  },
  '500': {
    InternalError: {
      status: 500,
      code: 'E500-InternalError',
      error_in: 'Unknown',
      message: 'Internal Server Error',
    },
  },
};
