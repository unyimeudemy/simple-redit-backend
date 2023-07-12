export const __prod__ = process.env.NODE_ENV !== "production"; // this sets debugging to true on development
export const COOKIE_NAME = "qid";
export const FORGOT_PASSWORD_PREFIX = "forgot-password:";
export const TOKEN_EXP = 1000 * 60 * 60 * 24 * 3;
