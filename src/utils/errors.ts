export interface IError {
  status: number;
  message: string;
  error_in: string;
}

export class AppError extends Error implements IError {
  status: number;
  error_in: string;

  constructor(obj: IError = errDef[500].InternalError, options?: ErrorOptions) {
    super(obj.message, options);
    this.status = obj.status;
    this.error_in = obj.error_in;
  }
}

export const errDef = {
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
    InvalidData: {
      status: 400,
      message: 'E400-InvalidData',
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
    RoleHasUsers: {
      status: 403,
      message: 'E403-RoleHasUsers',
      error_in: 'Req',
    },
  },
  '404': {
    RoleNotFound: {
      status: 404,
      message: 'E404-RoleNotFound',
      error_in: 'Req',
    },
    UserNotFound: {
      status: 404,
      message: 'E404-UserNotFound',
      error_in: 'Req',
    },
    TopicNotFound: {
      status: 404,
      message: 'E404-TopicNotFound',
      error_in: 'Req',
    },
    DataNotFound: {
      status: 404,
      message: 'E404-DataNotFound',
      error_in: 'Req',
    },
  },
  '409': {
    RoleAlreadyExists: {
      status: 409,
      message: 'E409-RoleAlreadyExists',
      error_in: 'Req',
    },
    UserAlreadyExists: {
      status: 409,
      message: 'E409-UserAlreadyExists',
      error_in: 'Req',
    },
    PushTopicAlreadyExists: {
      status: 409,
      message: 'E409-PushTopicAlreadyExists',
      error_in: 'Req',
    },
    PushSubscriptionAlreadyExists: {
      status: 409,
      message: 'E409-PushSubscriptionAlreadyExists',
      error_in: 'Req',
    },
  },
  '500': {
    InternalError: {
      status: 500,
      message: 'E500-InternalError',
      error_in: 'Unknown',
    },
  },
};

export const NULL_ERR_CODE = '23502';
export const FK_ERR_CODE = '23503';
export const UK_ERR_CODE = '23505';
