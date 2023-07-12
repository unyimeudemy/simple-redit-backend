import { getConnection } from "typeorm";
// import { Redis } from "ioredis";
import { Post } from "../entities/post";
// import { MyContext } from "src/types";
import {
  Resolver,
  Query,
  Arg,
  Int,
  Mutation,
  Ctx,
  InputType,
  Field,
  FieldResolver,
  Root,
  //   UseMiddleware,
} from "type-graphql";
import { MyContext } from "src/types";
import { Session } from "express-session";
// import { isAuth } from "src/utils/middlewares/isAuth";
import { Updoot } from "../entities/Updoot";
import { User } from "../entities/UserEntity";
// import { isAuth } from "../utils/middlewares/isAuth";

interface MySession extends Session {
  userID?: number;
}

@InputType()
class PostInput {
  @Field()
  title?: string;

  @Field()
  text?: string;
}

//FETCHING ALL POST
@Resolver(Post)
export class PostResolver {
  //************************* getting snippet of the post **************************** */
  @FieldResolver(() => String, { nullable: true })
  textSnippet(@Root() root: Post) {
    return root.text?.slice(0, 50);
  }

  @FieldResolver(() => User)
  creator(@Root() root: Post, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(root.creatorID);
  }

  @FieldResolver(() => Int, { nullable: true })
  async voteStatus(@Root() root: Post, @Ctx() { updootLoader }: MyContext) {
    const updoot = await updootLoader.load({
      postID: root._id,
      userID: 1,
    });
    console.log("updoot- ", updoot);

    return updoot ? updoot.value : null;
  }

  //********************************** For upvoting *************************** */
  @Mutation(() => Boolean)
  //   @UseMiddleware(isAuth)
  async vote(
    @Arg("postID", () => Int) postID: number,
    @Arg("userID", () => Int, { nullable: true }) userID: number,
    @Arg("value", () => Int) value: number
    // @Ctx() { req }: MyContext
  ) {
    const isUpdoot = value !== -1;
    const realValue = isUpdoot ? 1 : -1;
    // const userId = (req.session as MySession).userID;

    const hasVoted = await Updoot.findOne({ where: { postID, userID } });

    //user has voted before and wants to change the vote
    console.log("hasvoted: ", hasVoted && hasVoted.value !== realValue);
    if (hasVoted && hasVoted.value !== realValue) {
      console.log("has voted before ");
      //
      const res1 = await getConnection().transaction(
        async (transactionManger) => {
          await transactionManger.query(
            `
        update updoot 
        set value = $1
        where "postID" = $2 
        `,
            [realValue, postID]
          );
          // await transactionManger.query(
          //   `
          // update updoot
          // set value = $1
          // where "postID" = $2 and "userID" = $3
          // `,
          //   [realValue, postID, userID]
          // );

          await transactionManger.query(
            `
              update post 
              set points = points + $1
              where _id = $2;
                `,
            [2 * realValue, postID]
          );
        }
      );
      console.log("res1: ", res1);
    } else if (hasVoted === null) {
      console.log("has not voted");
      //user is just voting for the first time.
      const res2 = await getConnection().transaction(
        async (transactionManger) => {
          await transactionManger.query(
            `
        insert into updoot ("userID", "postID", value)
        values($1, $2, $3)
        `,
            [userID, postID, realValue]
          );

          await transactionManger.query(
            `
        update post 
        set points = points + $1
        where _id = $2;
          `,
            [realValue, postID]
          );
        }
      );
      console.log("res2: ", res2);
    }

    return true;
  }

  @Query(() => [Post])
  //   async posts(@Ctx() { em }: MyContext): Promise<Post[]> {
  //     const posts = await em.find(Post, {});
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
    // @Ctx() {req} : MyContext
  ): Promise<Post[]> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;
    // const userID = (req.session as MySession).userID  // this should come from context
    // const userID = 1;

    const replacement: any[] = [realLimitPlusOne];

    if (cursor) {
      replacement.push(new Date(parseInt(cursor)));
    }
    const queryBuilder = await getConnection().query(
      `
        select p.*
        from post p
        left join public.user u on u._id = p."creatorID"
        ${cursor ? `where p."createdAt" < $2` : ""}
        order by p."createdAt" DESC
        limit $1
    `,
      replacement
    );

    return queryBuilder;
  }

  //FETCHING A POST
  @Query(() => Post, { nullable: true })
  async post(@Arg("id", () => Int) id: number): Promise<Post | null> {
    // const post = await Post.findOne({ where: { id } });
    const post = await Post.findOneBy({ _id: id });
    return post;
  }
  //   @Query(() => Post, { nullable: true })
  //   async post(
  //     @Arg("id", () => Int) id: number,
  //     @Ctx()
  //     { em }: MyContext
  //   ): Promise<Post | null> {
  //     const post = await em.findOne(Post, { _id: id });
  //     return post;
  //   }

  // CREATE NEW POST
  @Mutation(() => Post)
  //   @UseMiddleware(isAuth)
  async createPost(
    // @Arg("input", () => String, { nullable: true }) input: postInput
    @Arg("input") input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    const post = await Post.create({
      ...input,
      creatorID: (req.session as MySession).userID,
    }).save();
    return post;
  }
  //   @Mutation(() => Post)
  //   async createPost(
  //     @Arg("title", () => String, { nullable: true }) title: string,
  //     @Arg("createdAt", () => String, { nullable: true }) createdAt: string,
  //     @Arg("updatedAt", () => String, { nullable: true }) updatedAt: string,
  //     @Ctx()
  //     { em }: MyContext
  //   ): Promise<Post> {
  //     const post = em.create(Post, { title, createdAt, updatedAt });
  //     await em.persistAndFlush(post);
  //     return post;
  //   }

  //UPDATING A POST

  @Mutation(() => Post, { nullable: true })
  //   @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int, { nullable: true }) id: number,
    @Arg("title", () => String, { nullable: true }) title: string,
    @Arg("text", () => String, { nullable: true }) text: string
    // @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    const result = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ text, title })
      .where("_id = :id", { id })
      .returning("*")
      .execute();

    return result.raw[0];
  }

  //   @Mutation(() => Post, { nullable: true })
  //   async updatePost(
  //     @Arg("id", () => Int, { nullable: true }) id: number,
  //     @Arg("title", () => String, { nullable: true }) title: string,
  //     @Arg("createdAt", () => String, { nullable: true })
  //     @Arg("updatedAt", () => String, { nullable: true })
  //     @Ctx()
  //     { em }: MyContext
  //   ): Promise<Post | null> {
  //     const post = await em.findOne(Post, { _id: id });
  //     if (!post) {
  //       return null;
  //     } else {
  //       post.title = title;
  //       await em.persistAndFlush(post);
  //       return post;
  //     }
  //   }

  //DELETING A POST

  @Mutation(() => Boolean)
  //   @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id", () => Int) id: number
    // @Ctx(){req} : MyContext
  ): Promise<boolean> {
    // const post = await Post.findOneBy({ _id: id, creatorID: (req.session as MySession).userID });
    const post = await Post.findOneBy({ _id: id });
    if (!post) {
      return false;
    } else {
      await Post.remove(post);
      return true;
    }
  }
}
//   @Mutation(() => Boolean)
//   async deletePost(
//     @Arg("id", () => Int, { nullable: true }) id: number,
//     @Ctx()
//     { em }: MyContext
//   ): Promise<boolean> {
//     const post = await em.findOne(Post, { _id: id });
//     if (!post) {
//       return false;
//     } else {
//       await em.removeAndFlush(post);
//       return true;
//     }
//   }
// }

//////////////////////////////////////////
