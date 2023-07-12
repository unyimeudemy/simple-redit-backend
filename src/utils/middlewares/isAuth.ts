import { Session } from "express-session";
import { MyContext } from "src/types";
import { MiddlewareFn } from "type-graphql";

interface MySession extends Session {
  userID?: number;
}

export const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => {
  if (!(context.req.session as MySession).userID) {
    throw new Error("you are not authenticated");
  }

  return next();
};
