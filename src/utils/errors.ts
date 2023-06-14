export interface IError {
  status: number;
  message: string;
  error_in: string;
}

export type errDefType = {
  [status: string]: { [errorName: string]: IError };
};

export class AppError extends Error implements IError {
  status: number;
  error_in: string;

  constructor(obj: IError = errDef[500].InternalError, options?: ErrorOptions) {
    super(obj.message, options);
    this.status = obj.status;
    this.error_in = obj.error_in;
  }
}

export const errDef: errDefType = {
  '400': {
    InvalidRoleName: {
      status: 400,
      message: 'E400-InvalidRoleName',
      error_in: 'ReqBody',
    },
    InvalidRolePermission: {
      status: 400,
      message: 'E400-InvalidRolePermission',
      error_in: 'ReqBody',
    },
    InvalidUserId: {
      status: 400,
      message: 'E400-InvalidUserId',
      error_in: 'ReqParams',
    },
    InvalidEmailFormat: {
      status: 400,
      message: 'E400-InvalidEmailFormat',
      error_in: 'ReqBody',
    },
    InvalidEmailFormatAuth: {
      status: 400,
      message: 'E400-InvalidEmailFormatAuth',
      error_in: 'ReqHeaders',
    },
    invalidPassword: {
      status: 400,
      message: 'E400-invalidPassword',
      error_in: 'ReqBody',
    },
    InvalidDeviceId: {
      status: 400,
      message: 'E400-InvalidDeviceId',
      error_in: 'ReqBody',
    },
    InvalidPayload: {
      status: 400,
      message: 'E400-InvalidPayload',
      error_in: 'ReqBody',
    },
    InvalidPushSubscription: {
      status: 400,
      message: 'E400-InvalidPushSubscription',
      error_in: 'ReqBody',
    },
    InvalidPushTopic: {
      status: 400,
      message: 'E400-InvalidPushTopic',
      error_in: 'ReqBody',
    },
  },
  '401': {
    AuthorizationNotFound: {
      status: 401,
      message: 'E401-AuthorizationNotFound',
      error_in: 'ReqHeaders',
    },
    InvalidAuthScheme: {
      status: 401,
      message: 'E401-InvalidAuthScheme',
      error_in: 'ReqHeaders',
    },
    UserCredentialNotFound: {
      status: 401,
      message: 'E401-UserCredentialNotFound',
      error_in: 'ReqHeaders',
    },
    AccessTokenNotFound: {
      status: 401,
      message: 'E401-AccessTokenNotFound',
      error_in: 'ReqHeaders',
    },
    RefreshTokenNotFound: {
      status: 401,
      message: 'E401-RefreshTokenNotFound',
      error_in: 'ReqBody',
    },
    InvalidCredential: {
      status: 401,
      message: 'E401-InvalidCredential',
      error_in: 'Auth',
    },
    InvalidToken: {
      status: 401,
      message: 'E401-InvalidToken',
      error_in: 'Auth',
    },
    TokenExpired: {
      status: 401,
      message: 'E401-TokenExpired',
      error_in: 'Auth',
    },
  },
  '403': {
    AccessDenied: {
      status: 403,
      message: 'E403-AccessDenied',
      error_in: 'Auth',
    },
    AccessUndefined: {
      status: 403,
      message: 'E403-AccessUndefined',
      error_in: 'Auth',
    },
  },
  '404': {
    UserNotFound: {
      status: 404,
      message: 'E404-UserNotFound',
      error_in: 'Auth',
    },
  },
  '409': {
    RoleAlreadyExists: {
      status: 409,
      message: 'E409-RoleAlreadyExists',
      error_in: 'Auth',
    },
    UserAlreadyExists: {
      status: 409,
      message: 'E409-UserAlreadyExists',
      error_in: 'Auth',
    },
    PushSubscriptionAlreadyExists: {
      status: 409,
      message: 'E409-UserAlreadyExists',
      error_in: 'Push',
    },
  },
  '500': {
    InternalError: {
      status: 500,
      message: 'E500-InternalError',
      error_in: 'Unknown',
    },
    FailedToInsert: {
      status: 500,
      message: 'E500-FailedToInsert',
      error_in: 'database',
    },
  },
};
