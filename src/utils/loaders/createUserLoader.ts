import DataLoader from "dataloader";
import { User } from "../../entities/UserEntity";

export const createUserLoader = () =>
  new DataLoader<number, User>(async (userIds) => {
    const users = await User.findByIds(userIds as number[]);

    const userToUserId: Record<number, User> = {};

    users.forEach((user) => {
      userToUserId[user._id] = user;
    });

    return userIds.map((userId) => userToUserId[userId]);
  });
