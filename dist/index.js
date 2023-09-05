"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const apollo_server_express_1 = require("apollo-server-express");
const type_graphql_1 = require("type-graphql");
const hello_1 = require("./resolvers/hello");
const postResolver_1 = require("./resolvers/postResolver");
const userResolver_1 = require("./resolvers/userResolver");
const ioredis_1 = __importDefault(require("ioredis"));
const express_session_1 = __importDefault(require("express-session"));
const typeorm_1 = require("typeorm");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const UserEntity_1 = require("./entities/UserEntity");
const post_1 = require("./entities/post");
const path_1 = __importDefault(require("path"));
const Updoot_1 = require("./entities/Updoot");
const createUserLoader_1 = require("./utils/loaders/createUserLoader");
const createUpdootLoader_1 = require("./utils/loaders/createUpdootLoader");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: "./config.env" });
console.log("typeof process.env.DB_PASSWORD--:", typeof process.env.DB_PASSWORD);
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, typeorm_1.createConnection)({
        type: "postgres",
        host: "db",
        database: "redit-clone2",
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        entities: [UserEntity_1.User, post_1.Post, Updoot_1.Updoot],
        logging: true,
        synchronize: true,
        migrations: [path_1.default.join(__dirname, "./migrations/*")],
    })
        .then(() => {
        console.log("connected to database");
    })
        .catch((error) => {
        console.log(error);
    });
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        credentials: true,
        origin: "http://localhost:3000",
    }));
    app.use((0, cookie_parser_1.default)());
    const RedisStore = require("connect-redis").default;
    const redis = new ioredis_1.default();
    const store = new RedisStore({
        client: redis,
        prefix: "myapp:",
        disableTouch: true,
    });
    app.use((0, express_session_1.default)({
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
    }));
    const apolloServer = new apollo_server_express_1.ApolloServer({
        schema: yield (0, type_graphql_1.buildSchema)({
            resolvers: [hello_1.HelloResolver, postResolver_1.PostResolver, userResolver_1.UserResolver],
            validate: false,
        }),
        context: ({ req, res }) => ({
            req,
            res,
            redis,
            userLoader: (0, createUserLoader_1.createUserLoader)(),
            updootLoader: (0, createUpdootLoader_1.createUpdootLoader)(),
        }),
    });
    yield apolloServer.start();
    apolloServer.applyMiddleware({ app, cors: false });
    app.listen(4000, () => {
        console.log("App listening on port 4000...");
    });
});
main().catch((err) => {
    console.error("Error:", err);
});
//# sourceMappingURL=index.js.map