import { MyContext } from "./../types";
// import { MyContext } from "src/types";
import { User } from "./../entities/UserEntity";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
} from "type-graphql";
import argon2 from "argon2";
import { Session } from "express-session";
// import {   TOKEN_EXP } from "../constants";
import { usernameAndPassword } from "./usernameAndPassword";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";

interface MySession extends Session {
  userID?: number;
}

//ERROR MESSAGE TO RETURN
@ObjectType()
class FieldError {
  @Field()
  field?: string;

  @Field()
  message?: string;
}

//SPECIFYING THE TYPES FOR USER RESPONSE
@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver(User)
export class UserResolver {
  //MIDDLEWARE FOR DETERMING USER DATA TO BE RETURNED
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    //this is the current user
    if ((req.session as MySession).userID == user._id) {
      return user.email;
    }

    // this is for a visitor
    return "";
  }

  //  CHANGE PASSWORD
  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    //checking if password is valid
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

    //checking if token is valid
    const tokenKey = process.env.FORGOT_PASSWORD_PREFIX + token;
    const userID = await redis.get(tokenKey);
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

    //checking if user still exist
    // const user = await em.findOne(User, { _id: parseInt(userID) });
    const userIdNum = parseInt(userID);
    const user = await User.findOneBy({ _id: userIdNum });
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

    //hashing the password
    const hashedPassword = await argon2.hash(newPassword);

    //updating the password
    // user.password = hashedPassword;
    // await em.persistAndFlush(user);
    // await User.save(user);
    await User.update({ _id: userIdNum }, { password: hashedPassword });
    await redis.del(tokenKey);

    //logging in user
    (req.session as MySession).userID = user._id;

    return { user };
  }

  //FORGOT PASSWORD
  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx()
    { redis }: MyContext
  ) {
    // const user = await em.findOne(User, { email });
    const user = await User.findOneBy({ email });
    if (!user) {
      return true;
    }
    const token = v4();
    await redis.set(
      process.env.FORGOT_PASSWORD_PREFIX + token,
      user._id,
      "EX",
      process.env.TOKEN_EXP as string
    );
    sendEmail(
      email,
      `<a href='http://localhost:3000/change-password/${token}'>reset password</a>`
    );
    return true;
  }

  //GET CURRENT USER PROFILE
  @Query(() => User, { nullable: true })
  async me(
    @Ctx()
    { req }: MyContext
  ) {
    // console.log("💥💥💥", req.session);
    if (!(req.session as MySession).userID) {
      return null;
    }

    const currentUserID = (req.session as MySession).userID;
    const currentUser = User.findOneBy({ _id: currentUserID });
    // const currentUser = await em.findOne(User, {
    //   _id: currentUserID,
    // });
    return currentUser;
  }

  //CREATE NEW USER OR SIGNUP
  @Mutation(() => UserResponse)
  async register(
    @Arg("options", () => usernameAndPassword) options: usernameAndPassword,
    @Ctx()
    { req }: MyContext
  ): Promise<UserResponse | undefined | null> {
    // check user input
    const validateUserInput = validateRegister(options);

    if (validateUserInput) {
      return validateUserInput;
    }

    // check if username has been used
    // const usernameUsed = await em.findOne(User, { username: options.username });
    const usernameUsed = await User.findOneBy({ username: options.username });
    console.log(options);

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

    const hashedPassword = await argon2.hash(options.password);

    const user = await User.create({
      username: options.username,
      email: options.email,
      password: hashedPassword,
    }).save();

    // const user = em.create(User, {
    //   username: options.username,
    //   email: options.email,
    //   password: hashedPassword,
    //   createdAt: options.createdAt,
    //   updatedAt: options.updatedAt,
    // });
    // await em.persistAndFlush(user);

    // console.log(req);
    (req.session as MySession).userID = user._id;
    console.log(req.session);

    return { user };
  }

  //LOGIN
  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx()
    { req }: MyContext
  ): Promise<UserResponse | undefined> {
    // check if user already exist

    const user = await User.findOneBy(
      usernameOrEmail.includes("@")
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    );

    // const user = await em.findOne(
    //   User,
    //   usernameOrEmail.includes("@")
    //     ? { email: usernameOrEmail }
    //     : { username: usernameOrEmail }
    // );

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

    //check if user password is correct
    const checkPassword = await argon2.verify(user.password, password);

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

    // req.session.userId  = user._id;
    (req.session as MySession).userID = user._id;

    return { user };
  }

  // LOG OUT
  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) => {
      req.session.destroy((err) => {
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        res.clearCookie(process.env.COOKIE_NAME as string);
        resolve(true);
      });
    });
  }
}
