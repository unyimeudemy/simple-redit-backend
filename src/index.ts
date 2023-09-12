import "reflect-metadata";
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
import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });

console.log(
  "typeof process.env.DB_PASSWORD--:",
  typeof process.env.DB_PASSWORD
);

const main = async () => {
  let retries = 6;
  while (retries) {
    await createConnection({
      type: "postgres",
      host: "db",
      port: 5432,
      database: "redit-postgres",
      entities: [User, Post, Updoot],
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      logging: true,
      synchronize: true,
      migrations: [path.join(__dirname, "./migrations/*")],

      // host: "db",
      // url: "postgres://postgres:211999@localhost:5432/redit-postgres",
      // database: "redit-postgres",
      // username: process.env.DB_USERNAME,
      // password: process.env.DB_PASSWORD,
      //     type: "postgres",
      //     url: process.env.DATABASE_URL,
      //     logging: true,
      //     // synchronize: true,
      //     migrations: [path.join(__dirname, "./migrations/*")],
      //     entities: [Post, User, Updoot],
      //   });
    })
      .then(() => {
        console.log("connected to database");
      })
      .catch(async (error) => {
        console.log("💥💥 error: ", error);
        retries -= 1;
        console.log("retries left: ", retries);
        await new Promise((res) => setTimeout(res, 5000));
      });
  }

  const app = express();

  app.use(
    cors({
      credentials: true,
      origin: "http://localhost:3000",
      //   origin: "https://redit-clone-frontend.onrender.com",
      //   origin: "https://simple-redit-frontend.vercel.app",
    })
  );

  app.use(cookieParser());

  //   const RedisStore = connectRedis(session)
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
      name: process.env.COOKIE_NAME,
      store: store,
      resave: false,
      saveUninitialized: false,
      secret: "this_is_my_super_secured_redis_secret",
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365,
        httpOnly: true,
        secure: process.env.NODE_ENV !== "production",
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

// commit should work
// i meant without docker compose

// docker run -d --name my-app-container --network mynetwork -p 4000:4000 your-app-image:tag
// volumes: -./pgdata:/var/lib/postgresql/data

// version: "3"
// services:
//   db:
//     image: postgres
//     environment:
//       POSTGRES_DB: redit-postgres
//       POSTGRES_USER: postgres
//       POSTGRES_PASSWORD: "211999"
//     ports:
//       - 5432:5432
//     volumes:
//       - ./pgdata:/var/lib/postgresql/data
//   app:
//     build:
//       context: .
//       dockerfile: Dockerfile
//     ports:
//       - 4000:4000
//     depends_on:
//       - db
// volumes:
//   pgdata:
//*************************************************************************************** */
// version: "3"
// services:
//   db:
//     image: postgres
//     environment:
//       POSTGRES_DB: redit-postgres
//       POSTGRES_USER: postgres
//       POSTGRES_PASSWORD: "211999"
//     ports:
//       - 5432:5432
//     volumes:
//       - ./pgdata:/var/lib/postgresql/data
//   app:
//     build:
//       context: .
//       dockerfile: Dockerfile
//     ports:
//       - 4000:4000
//     links:
//   - db
