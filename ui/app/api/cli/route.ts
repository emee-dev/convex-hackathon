import { NextResponse } from "next/server";
import { __getUserProject } from "./handler";
import { roles } from "@/types";
import { createClerkClient } from "@clerk/backend";
import { z } from "zod";
import { formatZodError } from "@/lib/utils";

let requestBodySchema = z.object({
  code: z.string().min(1, "This is not a cli workflow. Use the cli."),
  redirect: z.string().min(1, "Please provide the cli redirect url."),
  clerkUserId: z.string().min(1, "Please login on the webapp to continue."),
  uniqueProjectId: z.string().min(1, "Please provide the project id."),
});

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// Handle CLI init command
// Returns the list of projects created by user with clerkUserId.
// Allows the user to choose, then writes the project id to config file.
// export const PUT = async (req: Request) => {};

// Handle CLI login
export const POST = async (req: Request) => {
  try {
    let params = (await req.json()) as {
      code: string;
      redirect: string;
      clerkUserId: string;
      uniqueProjectId: string;
    };

    let validate = requestBodySchema.safeParse(params);

    if (!validate.success) {
      return Response.json(
        {
          message: formatZodError(validate),
          data: null,
        },
        { status: 404 }
      );
    }

    const user = await clerkClient.users.getUser(params.clerkUserId);

    if (!user) {
      return Response.json(
        {
          message: "Error authenicating user.",
          data: null,
        },
        {
          status: 500,
        }
      );
    }

    // get their project id
    let project = await __getUserProject({
      clerkUserId: params.clerkUserId,
      uniqueProjectId: params.uniqueProjectId,
    });

    if (!project || !project.data) {
      return Response.json(
        { message: project.message, data: null },
        { status: 500 }
      );
    }

    return Response.json(
      {
        message: "User was authenticated.",
        data: {
          userId: user.id,
          code: params.code,
          redirectUrl: params.redirect,
          clerkUserId: params.clerkUserId,
          project_role: project.data.project_role,
          email: user.emailAddresses[0].emailAddress,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    // TODO handle clerk error and error retries
    console.log("CLI Authentication Error: ", error);

    return Response.json(
      { message: "Internal server error, please try again later.", data: null },
      {
        status: 500,
      }
    );
  }
};
