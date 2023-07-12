import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Field, ObjectType } from "type-graphql";
import { User } from "./UserEntity";
import { Post } from "./post";

@ObjectType()
@Entity()
export class Updoot extends BaseEntity {
  @Field(() => String, { nullable: true })
  @PrimaryColumn()
  userID!: number;

  @Field(() => String, { nullable: true })
  @PrimaryColumn()
  postID!: number;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, (user) => user.updoots)
  user!: User;

  @Field(() => Post, { nullable: true })
  @ManyToOne(() => Post, (post) => post.updoots)
  post!: Post;

  @Field()
  @Column({ type: "int" })
  value!: number;
}

//   @column({ type: "VARCHAR(500)" })
//   content!: string;
////////////////////////////
