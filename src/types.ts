// import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { Request, Response } from "express";
import Redis from "ioredis";
import { createUserLoader } from "./utils/loaders/createUserLoader";
import { createUpdootLoader } from "./utils/loaders/createUpdootLoader";

export type MyContext = {
  //   em: EntityManager<IDatabaseDriver<Connection>>;
  req: Request;
  res: Response;
  redis: Redis;
  userLoader: ReturnType<typeof createUserLoader>;
  updootLoader: ReturnType<typeof createUpdootLoader>;
};
