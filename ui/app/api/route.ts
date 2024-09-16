import { FRONTEND_URL } from "@/const";
import { formatZodError } from "@/lib/utils";
import { createClerkClient } from "@clerk/backend";
import { z } from "zod";
import { Unkey } from "@unkey/api";

type InvitationParams = { email: string; role_code: string };
type IntegrationParams = {
  label: string;
  project_role: string;
  uniqueProjectId: string;
};

export const dynamic = "force-dynamic";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const invitationSchema = z.object({
  email: z.string().email("Please provide a valid email."),
  role_code: z.union([z.literal("basic_user"), z.literal("admin_user")]),
});

const integrationSchema = z.object({
  label: z.string().min(1, "Please provide a valid email."),
  uniqueProjectId: z.string().min(1, "Please provide a valid project id."),
  project_role: z.literal("basic_user"),
});

// Handle creating invitations
export const POST = async (req: Request) => {
  try {
    let body = (await req.json()) as InvitationParams;

    let validate = invitationSchema.safeParse(body);

    if (!validate.success) {
      return Response.json(
        { message: formatZodError(validate), data: null },
        { status: 404 }
      );
    }

    const response = await clerkClient.invitations.createInvitation({
      emailAddress: body.email,
      redirectUrl: `${FRONTEND_URL}/sign-up`,
      publicMetadata: {
        role: body.role_code,
      },
    });

    if (response.status !== "pending" || "accepted") {
      return Response.json(
        {
          message: "Invitation could not be sent.",
          data: null,
        },
        {
          status: 500,
        }
      );
    }

    // return Response.json({ data: user.emailAddresses[0].emailAddress });
    return Response.json({
      message: "An invitation was sent.",
      data: {
        pending: true,
      },
    });
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

// Handle creating api integrations
export const PUT = async (req: Request) => {
  try {
    let body = (await req.json()) as IntegrationParams;

    let validate = integrationSchema.safeParse(body);

    if (!validate.success) {
      return Response.json(
        { message: formatZodError(validate), data: null },
        { status: 404 }
      );
    }

    const token = process.env.UNKEY_MASTER_KEY!;
    const apiId = process.env.UNKEY_API_ID!;

    const unkey = new Unkey({ token });

    let key = await unkey.keys.create({
      apiId,
      name: body.label,
      externalId: body.uniqueProjectId,
      meta: {
        project_role: body.project_role,
      },
      prefix: "dxenv",
    });

    return Response.json({ key: key.result });
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
