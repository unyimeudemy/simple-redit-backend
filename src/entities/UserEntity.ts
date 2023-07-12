import { Updoot } from "./Updoot";
// import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Post } from "./post";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  _id!: number;

  @Field(() => String, { nullable: true }) // defines the property of data sent in
  @Column({ unique: true }) // defines the property of data stored
  username!: string;

  @Field(() => String, { nullable: true })
  @Column({ unique: true })
  email!: string;

  @Field(() => String, { nullable: true })
  @Column()
  password!: string;

  @OneToMany(() => Post, (post) => post.creator)
  posts!: Post[];

  @OneToMany(() => Updoot, (updoot) => updoot.user)
  updoots!: Updoot[];

  @Field(() => String, { nullable: true })
  @CreateDateColumn()
  createdAt: Date = new Date();

  @Field(() => String, { nullable: true })
  @UpdateDateColumn()
  updatedAt: Date = new Date();
}
