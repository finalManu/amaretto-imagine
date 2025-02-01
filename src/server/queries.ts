import "server-only";
import { db } from "./db";
import { auth } from "@clerk/nextjs/server";

//could have getMyImages(userId: string) or just do auth in here (current)
//just choose one pattern and stick with it
//or have a consistent wrapper pattern where always have the auth calls in the same place, otherwise gets messy fast
export async function getMyImages() {
  const user = await auth();

  /*Certain that there is no way a user will see images that don't belong to them and as
    long as we're not calling DB queries in other places it should be relatively easy for us 
    to look through this one file and make sure all the places that return images are properly authenticated 
    once you want to implement things like delete this gets even more important so */

  if (!user.userId) throw new Error("Unauthorized");

  const images = await db.query.images.findMany({
    where: (model, { eq }) => eq(model.userId, user.userId),
    orderBy: (model, { desc }) => desc(model.id),
  });

  return images;
}
