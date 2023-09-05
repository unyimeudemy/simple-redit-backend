"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
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
exports.UserResolver = void 0;
const UserEntity_1 = require("./../entities/UserEntity");
const type_graphql_1 = require("type-graphql");
const argon2_1 = __importDefault(require("argon2"));
const usernameAndPassword_1 = require("./usernameAndPassword");
const validateRegister_1 = require("../utils/validateRegister");
const sendEmail_1 = require("../utils/sendEmail");
const uuid_1 = require("uuid");
let FieldError = class FieldError {
};
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], FieldError.prototype, "field", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], FieldError.prototype, "message", void 0);
FieldError = __decorate([
    (0, type_graphql_1.ObjectType)()
], FieldError);
let UserResponse = class UserResponse {
};
__decorate([
    (0, type_graphql_1.Field)(() => [FieldError], { nullable: true }),
    __metadata("design:type", Array)
], UserResponse.prototype, "errors", void 0);
__decorate([
    (0, type_graphql_1.Field)(() => UserEntity_1.User, { nullable: true }),
    __metadata("design:type", UserEntity_1.User)
], UserResponse.prototype, "user", void 0);
UserResponse = __decorate([
    (0, type_graphql_1.ObjectType)()
], UserResponse);
let UserResolver = class UserResolver {
    email(user, { req }) {
        if (req.session.userID == user._id) {
            return user.email;
        }
        return "";
    }
    changePassword(token, newPassword, { redis, req }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (newPassword.length < 6) {
                return {
                    errors: [
                        {
                            field: "newPassword",
                            message: "Password should be atleast 6 characters",
                        },
                    ],
                };
            }
            const tokenKey = process.env.FORGOT_PASSWORD_PREFIX + token;
            const userID = yield redis.get(tokenKey);
            if (!userID) {
                return {
                    errors: [
                        {
                            field: "newPassword",
                            message: "token expired",
                        },
                    ],
                };
            }
            const userIdNum = parseInt(userID);
            const user = yield UserEntity_1.User.findOneBy({ _id: userIdNum });
            if (!user) {
                return {
                    errors: [
                        {
                            field: "newPassword",
                            message: "user no longer exist",
                        },
                    ],
                };
            }
            const hashedPassword = yield argon2_1.default.hash(newPassword);
            yield UserEntity_1.User.update({ _id: userIdNum }, { password: hashedPassword });
            yield redis.del(tokenKey);
            req.session.userID = user._id;
            return { user };
        });
    }
    forgotPassword(email, { redis }) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield UserEntity_1.User.findOneBy({ email });
            if (!user) {
                return true;
            }
            const token = (0, uuid_1.v4)();
            yield redis.set(process.env.FORGOT_PASSWORD_PREFIX + token, user._id, "EX", process.env.TOKEN_EXP);
            (0, sendEmail_1.sendEmail)(email, `<a href='http://localhost:3000/change-password/${token}'>reset password</a>`);
            return true;
        });
    }
    me({ req }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.session.userID) {
                return null;
            }
            const currentUserID = req.session.userID;
            const currentUser = UserEntity_1.User.findOneBy({ _id: currentUserID });
            return currentUser;
        });
    }
    register(options, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const validateUserInput = (0, validateRegister_1.validateRegister)(options);
            if (validateUserInput) {
                return validateUserInput;
            }
            const usernameUsed = yield UserEntity_1.User.findOneBy({ username: options.username });
            if (usernameUsed) {
                return {
                    errors: [
                        {
                            field: "username",
                            message: "Username has been taken, please choose another name",
                        },
                    ],
                };
            }
            const hashedPassword = yield argon2_1.default.hash(options.password);
            const user = yield UserEntity_1.User.create({
                username: options.username,
                email: options.email,
                password: hashedPassword,
            }).save();
            req.session.userID = user._id;
            return { user };
        });
    }
    login(usernameOrEmail, password, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield UserEntity_1.User.findOneBy(usernameOrEmail.includes("@")
                ? { email: usernameOrEmail }
                : { username: usernameOrEmail });
            if (!user) {
                return {
                    errors: [
                        {
                            field: "UOP",
                            message: "username or email does not exist oo",
                        },
                    ],
                };
            }
            const checkPassword = yield argon2_1.default.verify(user.password, password);
            if (!checkPassword) {
                return {
                    errors: [
                        {
                            field: "password",
                            message: "password not correct",
                        },
                    ],
                };
            }
            req.session.userID = user._id;
            return { user };
        });
    }
    logout({ req, res }) {
        return new Promise((resolve) => {
            req.session.destroy((err) => {
                if (err) {
                    resolve(false);
                    return;
                }
                res.clearCookie(process.env.COOKIE_NAME);
                resolve(true);
            });
        });
    }
};
__decorate([
    (0, type_graphql_1.FieldResolver)(() => String),
    __param(0, (0, type_graphql_1.Root)()),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserEntity_1.User, Object]),
    __metadata("design:returntype", void 0)
], UserResolver.prototype, "email", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => UserResponse),
    __param(0, (0, type_graphql_1.Arg)("token")),
    __param(1, (0, type_graphql_1.Arg)("newPassword")),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "changePassword", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    __param(0, (0, type_graphql_1.Arg)("email")),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "forgotPassword", null);
__decorate([
    (0, type_graphql_1.Query)(() => UserEntity_1.User, { nullable: true }),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "me", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => UserResponse),
    __param(0, (0, type_graphql_1.Arg)("options", () => usernameAndPassword_1.usernameAndPassword)),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [usernameAndPassword_1.usernameAndPassword, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "register", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => UserResponse),
    __param(0, (0, type_graphql_1.Arg)("usernameOrEmail")),
    __param(1, (0, type_graphql_1.Arg)("password")),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "login", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserResolver.prototype, "logout", null);
UserResolver = __decorate([
    (0, type_graphql_1.Resolver)(UserEntity_1.User)
], UserResolver);
exports.UserResolver = UserResolver;
//# sourceMappingURL=userResolver.js.map