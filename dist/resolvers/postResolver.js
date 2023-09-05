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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostResolver = void 0;
const typeorm_1 = require("typeorm");
const post_1 = require("../entities/post");
const type_graphql_1 = require("type-graphql");
const Updoot_1 = require("../entities/Updoot");
const UserEntity_1 = require("../entities/UserEntity");
let PostInput = class PostInput {
};
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], PostInput.prototype, "title", void 0);
__decorate([
    (0, type_graphql_1.Field)(),
    __metadata("design:type", String)
], PostInput.prototype, "text", void 0);
PostInput = __decorate([
    (0, type_graphql_1.InputType)()
], PostInput);
let PostResolver = class PostResolver {
    textSnippet(root) {
        var _a;
        return (_a = root.text) === null || _a === void 0 ? void 0 : _a.slice(0, 50);
    }
    creator(root, { userLoader }) {
        return userLoader.load(root.creatorID);
    }
    voteStatus(root, { updootLoader }) {
        return __awaiter(this, void 0, void 0, function* () {
            const updoot = yield updootLoader.load({
                postID: root._id,
                userID: 1,
            });
            return updoot ? updoot.value : null;
        });
    }
    vote(postID, userID, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const isUpdoot = value !== -1;
            const realValue = isUpdoot ? 1 : -1;
            const hasVoted = yield Updoot_1.Updoot.findOne({ where: { postID, userID } });
            if (hasVoted && hasVoted.value !== realValue) {
                console.log("has voted before ");
                yield (0, typeorm_1.getConnection)().transaction((transactionManger) => __awaiter(this, void 0, void 0, function* () {
                    yield transactionManger.query(`
        update updoot 
        set value = $1
        where "postID" = $2 
        `, [realValue, postID]);
                    yield transactionManger.query(`
              update post 
              set points = points + $1
              where _id = $2;
                `, [2 * realValue, postID]);
                }));
            }
            else if (hasVoted === null) {
                console.log("has not voted");
                yield (0, typeorm_1.getConnection)().transaction((transactionManger) => __awaiter(this, void 0, void 0, function* () {
                    yield transactionManger.query(`
        insert into updoot ("userID", "postID", value)
        values($1, $2, $3)
        `, [userID, postID, realValue]);
                    yield transactionManger.query(`
        update post 
        set points = points + $1
        where _id = $2;
          `, [realValue, postID]);
                }));
            }
            return true;
        });
    }
    posts(limit, cursor) {
        return __awaiter(this, void 0, void 0, function* () {
            const realLimit = Math.min(50, limit);
            const realLimitPlusOne = realLimit + 1;
            const replacement = [realLimitPlusOne];
            console.log("fetching all post");
            if (cursor) {
                replacement.push(new Date(parseInt(cursor)));
            }
            const queryBuilder = yield (0, typeorm_1.getConnection)().query(`
        select p.*
        from post p
        left join public.user u on u._id = p."creatorID"
        ${cursor ? `where p."createdAt" < $2` : ""}
        order by p."createdAt" DESC
        limit $1
    `, replacement);
            return queryBuilder;
        });
    }
    post(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const post = yield post_1.Post.findOneBy({ _id: id });
            return post;
        });
    }
    createPost(input, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const post = yield post_1.Post.create(Object.assign(Object.assign({}, input), { creatorID: req.session.userID })).save();
            return post;
        });
    }
    updatePost(id, title, text) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, typeorm_1.getConnection)()
                .createQueryBuilder()
                .update(post_1.Post)
                .set({ text, title })
                .where("_id = :id", { id })
                .returning("*")
                .execute();
            return result.raw[0];
        });
    }
    deletePost(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const post = yield post_1.Post.findOneBy({ _id: id });
            if (!post) {
                return false;
            }
            else {
                yield post_1.Post.remove(post);
                return true;
            }
        });
    }
};
__decorate([
    (0, type_graphql_1.FieldResolver)(() => String, { nullable: true }),
    __param(0, (0, type_graphql_1.Root)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [post_1.Post]),
    __metadata("design:returntype", void 0)
], PostResolver.prototype, "textSnippet", null);
__decorate([
    (0, type_graphql_1.FieldResolver)(() => UserEntity_1.User),
    __param(0, (0, type_graphql_1.Root)()),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [post_1.Post, Object]),
    __metadata("design:returntype", void 0)
], PostResolver.prototype, "creator", null);
__decorate([
    (0, type_graphql_1.FieldResolver)(() => type_graphql_1.Int, { nullable: true }),
    __param(0, (0, type_graphql_1.Root)()),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [post_1.Post, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "voteStatus", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    __param(0, (0, type_graphql_1.Arg)("postID", () => type_graphql_1.Int)),
    __param(1, (0, type_graphql_1.Arg)("userID", () => type_graphql_1.Int, { nullable: true })),
    __param(2, (0, type_graphql_1.Arg)("value", () => type_graphql_1.Int)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "vote", null);
__decorate([
    (0, type_graphql_1.Query)(() => [post_1.Post]),
    __param(0, (0, type_graphql_1.Arg)("limit", () => type_graphql_1.Int)),
    __param(1, (0, type_graphql_1.Arg)("cursor", () => String, { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "posts", null);
__decorate([
    (0, type_graphql_1.Query)(() => post_1.Post, { nullable: true }),
    __param(0, (0, type_graphql_1.Arg)("id", () => type_graphql_1.Int)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "post", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => post_1.Post),
    __param(0, (0, type_graphql_1.Arg)("input")),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PostInput, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "createPost", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => post_1.Post, { nullable: true }),
    __param(0, (0, type_graphql_1.Arg)("id", () => type_graphql_1.Int, { nullable: true })),
    __param(1, (0, type_graphql_1.Arg)("title", () => String, { nullable: true })),
    __param(2, (0, type_graphql_1.Arg)("text", () => String, { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "updatePost", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    __param(0, (0, type_graphql_1.Arg)("id", () => type_graphql_1.Int)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "deletePost", null);
PostResolver = __decorate([
    (0, type_graphql_1.Resolver)(post_1.Post)
], PostResolver);
exports.PostResolver = PostResolver;
//# sourceMappingURL=postResolver.js.map