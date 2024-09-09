// Convex is a Backend Application Platform designed to help developers focus on building their products. One of its main features is that it's live and real-time. The components, including Functions, Database, File Storage, Scheduling, and Search fit together cohesively, making it a highly efficient and user-friendly platform. It offers a predictive framework designed to guide developers into what they refer to as the "pit of success". This helps the developers to ensure their projects fare well over time, with enhanced understandability, easy refactorability, and top-notch performance.
// You
// How can I use convex mutation and query functions in next js
// Convex AI Bot
// In your Next.js application, you can use the Convex mutation and query functions under the Server Actions or a Route Handler. The `fetchQuery`, `fetchMutation` and `fetchAction` functions are used to load and edit Convex data in your Server Action or Route Handler.

// Here are examples of how you can call these functions:

// 1. Inline Server Action calling a Convex mutation:

//    ```tsx
//    import { api } from "@/convex/_generated/api";
//    import { fetchMutation, fetchQuery } from "convex/nextjs";
//    import { revalidatePath } from "next/cache";

//    export default async function PureServerPage() {
//      const tasks = await fetchQuery(api.tasks.list, { list: "default" });
//      async function createTask(formData: FormData) {
//        "use server";

//        await fetchMutation(api.tasks.create, {
//          text: formData.get("text") as string,
//        });
//        revalidatePath("/example");
//      }
//      // render tasks and task creation form
//      return <form action={createTask}>...</form>;
//    }
//    ```

// 2. Route Handler calling a Convex mutation:

//     ```tsx
//     import { NextResponse } from "next/server";
//     // Hack for TypeScript before 5.2
//     const Response = NextResponse;

//     import { api } from "@/convex/_generated/api";
//     import { fetchMutation } from "convex/nextjs";

//     export async function POST(request: Request) {
//       const args = await request.json();
//       await fetchMutation(api.tasks.create, { text: args.text });
//       return Response.json({ success: true });
//     }
//     ```

// Also, you can use Convex functions on the client-side using Convex's client library for React:

//    ```tsx
//    import { useConvex } from "convex/react";
//    import { api } from "../convex/_generated/api";

//    export function App() {
//      const convex = useConvex();
//      return (
//        <button
//          onClick={async () => {
//            console.log(await convex.query(api.functions.myQuery));
//          }}
//        >
//          Check
//        </button>
//      );
//    }
//    ```

// This allows you to fetch Convex queries on-demand via user actions.
