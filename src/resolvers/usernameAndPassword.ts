import { Field, InputType } from "type-graphql";

//COLLECTING USER INPUT

@InputType()
export class usernameAndPassword {
  @Field(() => String, { nullable: true })
  username!: string;

  @Field(() => String, { nullable: true })
  email!: string;

  @Field(() => String, { nullable: true })
  password!: string;

  @Field(() => String, { nullable: true })
  createdAt!: string;

  @Field(() => String, { nullable: true })
  updatedAt!: string;
}
