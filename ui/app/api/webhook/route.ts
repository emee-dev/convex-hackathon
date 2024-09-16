import { roles, WebhookUserCreatedPayload } from "@/types";
import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { __handleWebhookCreateUser } from "@/lib/action";
class NoSvixNoHeadersError extends Error {
  public code;
  constructor(message: string, code: number) {
    super(message);
    this.name = "NoSvixNoHeadersError";
    this.code = code;
  }
}

class SvixVerificationError extends Error {
  public code;
  constructor(message: string, code: number) {
    super(message);
    this.name = "SvixVerificationError";
    this.code = code;
  }
}

export const dynamic = "force-dynamic";

export const POST = async (req: Request) => {
  try {
    let payload = await verifyWebhookEvent(req);

    if (!payload) {
      return Response.json({ message: "Invalid payload." }, { status: 404 });
    }

    if (payload.type !== "user.created") {
      return Response.json({ message: "Invalid event type." }, { status: 404 });
    }

    // console.log(payload);
    let { id, email_addresses, first_name, last_name } = payload.data;

    // sync db
    let createUser = await __handleWebhookCreateUser({
      clerkUserId: id,
      firstName: first_name,
      lastName: last_name,
      email: email_addresses[0].email_address,
      system_role: roles["basic_user"].code as "basic_user",
    });

    if (!createUser || !createUser.data.created) {
      return Response.json(
        { message: "Error creating user account." },
        { status: 500 }
      );
    }

    return Response.json({ message: "Data was recieved." }, { status: 200 });
  } catch (error: any) {
    console.error(error.message);

    if (
      error instanceof NoSvixNoHeadersError ||
      error instanceof SvixVerificationError
    ) {
      return Response.json({ message: error.message }, { status: error.code });
    }

    return Response.json(
      { message: "Internal server error, please try again." },
      { status: 500 }
    );
  }
};

async function verifyWebhookEvent(req: Request) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the endpoint
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    throw new NoSvixNoHeadersError("Error occured -- no svix headers", 400);
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    throw new SvixVerificationError("Error verifying webhook", 400);
  }

  // Do something with the payload
  // For this guide, you simply log the payload to the console
  return evt as unknown as WebhookUserCreatedPayload;
}
