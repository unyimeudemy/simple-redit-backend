import "reflect-metadata";
// import { MikroORM } from "@mikro-orm/core";
import { COOKIE_NAME, __prod__ } from "./constants";
// import mikroOrmConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/postResolver";
import { UserResolver } from "./resolvers/userResolver";
import Redis from "ioredis";
import session from "express-session";
import { createConnection } from "typeorm";
// import connectRedis from "connect-redis";
import cookieParser from "cookie-parser";
import cors from "cors";
import { User } from "./entities/UserEntity";
import { Post } from "./entities/post";
import path from "path";
import { Updoot } from "./entities/Updoot";
import { createUserLoader } from "./utils/loaders/createUserLoader";
import { createUpdootLoader } from "./utils/loaders/createUpdootLoader";

const main = async () => {
  ///////////////////////////////////////
  await createConnection({
    type: "postgres",
    database: "redit-clone2",
    username: "postgres",
    password: "211999",
    entities: [User, Post, Updoot],
    logging: true,
    synchronize: true,
    migrations: [path.join(__dirname, "./migrations/*")],
  })
    .then(() => {
      console.log("connected to database");
    })
    .catch((error) => {
      console.log(error);
    });

  //   await conn.runMigrations();
  //   await Post.delete({});

  ///////////////////////////////////////
  // const orm = await MikroORM.init(mikroOrmConfig);
  //   await orm.getMigrator().up();
  //   console.log("Connected to the database");

  const app = express();

  app.use(
    cors({
      credentials: true,
      origin: "http://localhost:3000",
    })
  );

  app.use(cookieParser());

  //   const RedisStore = connectRedis(session)
  const RedisStore = require("connect-redis").default;

  const redis = new Redis();
  const store = new RedisStore({
    client: redis,
    prefix: "myapp:",
    disableTouch: true,
  });

  app.use(
    session({
      name: COOKIE_NAME,
      store: store,
      resave: false,
      saveUninitialized: false,
      secret: "this_is_my_super_secured_redis_secret",
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365,
        httpOnly: true,
        secure: __prod__,
        sameSite: "lax",
      },
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    // context: ({ req, res }) => ({ em: orm.em, req, res, redis }),
    context: ({ req, res }) => ({
      req,
      res,
      redis,
      userLoader: createUserLoader(),
      updootLoader: createUpdootLoader(),
    }),
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(4000, () => {
    console.log("App listening on port 4000...");
  });
};

main().catch((err) => {
  console.error("Error:", err);
});