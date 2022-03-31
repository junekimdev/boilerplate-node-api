const { CORS_ORIGIN = 'http://localhost:3000' } = process.env;

export const corsOption = { origin: CORS_ORIGIN, optionsSuccessStatus: 200 };
