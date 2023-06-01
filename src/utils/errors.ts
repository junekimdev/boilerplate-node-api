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
  message: string;

  constructor(obj: IError = errDef[500].InternalError, options?: ErrorOptions) {
    super(obj.message, options);
    this.status = obj.status;
    this.code = obj.code;
    this.error_in = obj.error_in;
    this.message = obj.message;
  }
}

export const errDef: errDefType = {
  '400': {
    InvalidEmailFormat: {
      status: 400,
      code: 'E400-1',
      error_in: 'ReqBody',
      message: 'Invalid Email Format',
    },
    InvalidPayload: {
      status: 400,
      code: 'E400-2',
      error_in: 'ReqBody',
      message: 'Invalid Payload',
    },
    InvalidPushSubscription: {
      status: 400,
      code: 'E400-3',
      error_in: 'ReqBody',
      message: 'Invalid Push Subscription',
    },
    InvalidPushTopic: {
      status: 400,
      code: 'E400-4',
      error_in: 'ReqBody',
      message: 'Invalid Push Topic',
    },
  },
  '401': {
    UserCredentialNotFound: {
      status: 401,
      code: 'E401-1',
      error_in: 'ReqHeaders',
      message: 'User Credential Not Found',
    },
    AccessTokenNotFound: {
      status: 401,
      code: 'E401-2',
      error_in: 'ReqHeaders',
      message: 'Access Token Not Found',
    },
    InvalidCredential: {
      status: 401,
      code: 'E401-3',
      error_in: 'Auth',
      message: 'Invalid Credential',
    },
    InvalidToken: {
      status: 401,
      code: 'E401-4',
      error_in: 'Auth',
      message: 'Invalid Token',
    },
  },
  '403': {
    AccessDenied: {
      status: 403,
      code: 'E403-1',
      error_in: 'Auth',
      message: 'Not Allowed To Access Resources',
    },
  },
  '406': {
    EmailTooLong: {
      status: 406,
      code: 'E406-1',
      error_in: 'ReqBody',
      message: 'Email Is Too Long',
    },
  },
  '500': {
    InternalError: {
      status: 500,
      code: 'E500-1',
      error_in: 'Unknown',
      message: 'Internal Server Error',
    },
  },
};
