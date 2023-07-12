import DataLoader from "dataloader";
import { Updoot } from "../../entities/Updoot";

export const createUpdootLoader = () =>
  new DataLoader<{ postID: number; userID: number }, Updoot | null>(
    async (keys) => {
      const updoots = await Updoot.findByIds(keys as any);
      console.log("updoot: ", updoots);

      const updootIdToUpdoot: Record<string, Updoot> = {};

      updoots.forEach((updoot) => {
        updootIdToUpdoot[`${updoot.userID}|${updoot.postID}`] = updoot;
      });

      return keys.map((key) => updootIdToUpdoot[`${key.userID}|${key.postID}`]);
    }
  );
