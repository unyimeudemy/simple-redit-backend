import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
// import { Entity, PrimaryKey, property } from "@mikro-orm/core";
import { Field, Int, ObjectType } from "type-graphql";
import { User } from "./UserEntity";
import { Updoot } from "./Updoot";

@ObjectType()
@Entity()
export class Post extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  _id!: number;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  creatorID!: number;

  @Field({ nullable: true })
  @ManyToOne(() => User, (user) => user.posts)
  creator!: User;

  @OneToMany(() => Updoot, (updoot) => updoot.post)
  updoots!: Updoot[];

  @Field(() => String, { nullable: true })
  @Column({ type: "varchar" })
  title!: string | null;

  /*
    the voteStatus field will return a computed value to the client and this 
    computation will be done in the sql command. The values expected
    here are 1, -1, null
  */
  @Field(() => Int, { nullable: true })
  voteStatus?: number | null;

  @Field(() => String, { nullable: true })
  @Column({ type: "varchar" })
  text!: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: "int", default: 0 })
  points!: number | null;

  @Field(() => String, { nullable: true }) // defines the property of the data sent in
  @CreateDateColumn() //defines the property of the data stored
  createdAt: Date = new Date();

  @Field(() => String, { nullable: true })
  @UpdateDateColumn()
  updatedAt: Date = new Date();
}

//   @column({ type: "VARCHAR(500)" })
//   content!: string;
////////////////////////////
