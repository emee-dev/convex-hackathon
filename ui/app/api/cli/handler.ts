import { api } from "@/convex/_generated/api";
import { client } from "@/lib/utils";

export const __getUserProject = async ({
  clerkUserId,
  uniqueProjectId,
}: {
  clerkUserId: string;
  uniqueProjectId: string;
}) => {
  let record = await client.query(api.project.getProjectIdWithClerkUserId, {
    clerkUserId,
    uniqueProjectId,
  });

  return record;
};
