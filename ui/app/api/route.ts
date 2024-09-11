import { FRONTEND_URL } from "@/const";
// import { roles } from "@/types";
import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// Handle invitations
export const POST = async (req: Request) => {
  try {
    let params = (await req.json()) as { email: string; role_code: string };

    const response = await clerkClient.invitations.createInvitation({
      emailAddress: params.email,
      redirectUrl: `${FRONTEND_URL}/sign-up`,
      publicMetadata: {
        role: params.role_code,
      },
    });

    if (response.status !== "pending" || "accepted") {
      return Response.json(
        {
          message: "Could not sent the invitation.",
          data: [],
        },
        {
          status: 500,
        }
      );
    }

    // TODO use convex scheduling functions to schedule pending events.

    // return Response.json({ data: user.emailAddresses[0].emailAddress });
    return Response.json(
      {
        message: "An invitation was sent.",
        data: response,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.log("Error: ", error.message);
    return Response.json(
      { message: "Internal server error, please try again.", data: [] },
      {
        status: 500,
      }
    );
  }
};
