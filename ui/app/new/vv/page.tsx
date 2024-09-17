"use client";

import { decryptInDashboard } from "@/app/console/variable/actions";
import { CodeEditorHeader, useCodeEditor } from "@/components/CodeEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import {
  ExpandableChat,
  ExpandableChatBody,
  ExpandableChatFooter,
  ExpandableChatHeader,
} from "@/components/ui/chat/expandable-chat";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import "@uiw/react-textarea-code-editor/dist.css";
import { useChat } from "ai/react";
import axios from "axios";
import { useQuery } from "convex/react";
import { ListChecks, Loader2, Send, User } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Loader from "./loading";
const CodeEditor = dynamic(() => import("@/components/CodeEditor/editor"), {
  ssr: false,
  loading: () => <Loader />,
});

type EnvironmentComponentProps = {
  environments: {
    label: string;
    component: JSX.Element;
  }[];
};

const environments = [
  {
    label: "development",
    component: <User strokeWidth={2} className="mr-2 h-4 w-4" />,
  },
  {
    label: "ci",
    component: <User strokeWidth={2} className="mr-2 h-4 w-4" />,
  },
  {
    label: "staging",
    component: <User strokeWidth={2} className="mr-2 h-4 w-4" />,
  },
  {
    label: "production",
    component: <User strokeWidth={2} className="mr-2 h-4 w-4" />,
  },
];

let env = `# dxenv CLI Usage

## Welcome to dxenv Vault!

1. Connect Locally (One-Time Setup):

$ cd /path/to/project
$ npx @dxenv/cli login --open

2. Pull Environment Variables:

$ npx @dxenv/cli pull development

3. Push Your Environment Variables:

$ npx @dxenv/cli push production

Enjoy managing your environment variables securely! 🌍

Coming soon. See cli workspace for usage instructions.
`;

type DashboardProps = {
  params: {};
  searchParams: {
    label: string | null;
    pid: string | null;
    var: string | null;
  };
};

function VariablePage({ searchParams }: DashboardProps) {
  const projectLabel = searchParams.label;
  const uniqueProjectId = searchParams.pid;
  const fileName = searchParams.var;

  const { toast } = useToast();
  const { setVersion, setEditorContent } = useCodeEditor();

  const { isLoaded, isSignedIn, user } = useUser();

  const [showDocsPanel, setShowDocsPanel] = useState<boolean>(true);

  let envFileContent = useQuery(
    api.env.getEnvByFileName,
    uniqueProjectId && fileName
      ? {
          fileName,
          projectId: uniqueProjectId,
        }
      : "skip"
  );

  useEffect(() => {
    let decryptedContent = async () => {
      if (
        !envFileContent ||
        !envFileContent.data ||
        !uniqueProjectId ||
        !user
      ) {
        console.error("Error loading environment file content.");
        setVersion("0000");
        setEditorContent("Failed to load variable data.");
        return;
      }

      let encryptedData = envFileContent.data.encryptedData;
      let edit_version = envFileContent.data.version;
      let clerkUserId = user?.id!;

      if (!fileName) {
        console.warn(`Environment ${fileName} does not exist.`);
        return;
      }

      let data = await decryptInDashboard({
        fileName,
        clerkUserId,
        edit_version,
        encryptedData,
        uniqueProjectId,
      }).catch((e) => {
        console.error(e.message);

        toast({
          variant: "destructive",
          description: e.message,
        });
      });

      if (!data) {
        toast({
          variant: "destructive",
          description: "Encountered error decrypting file data. Try again.",
        });
        return;
      }

      toast({
        description: "Variable was loaded sucessfully.",
      });

      setVersion(edit_version);
      setEditorContent(data);
    };

    decryptedContent();
  }, [envFileContent, uniqueProjectId, isLoaded, isSignedIn, user, fileName]);

  if (!projectLabel || !uniqueProjectId || !fileName) {
    return notFound();
  }

  const handleVariableClick = (args: any) => {
    console.log("args", args);
  };

  return (
    <main className="flex-1 p-4 sm:px-6 sm:py-0 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {decodeURIComponent(projectLabel)}
            </h1>
          </div>

          <div className="flex items-center gap-x-2">
            <ModifyVariable
              fileName={fileName}
              clerkUserId={user?.id!}
              uniqueProjectId={uniqueProjectId}
            />
          </div>
        </div>
        <Separator orientation="vertical" />

        <div className="grid grid-cols-1 gap-y-2 mt-5">
          {/* <div className="grid relative gap-2 grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(390px,1fr))] mt-5"> */}
          <Card className="outline-neutral-400 h-full flex-1 outline outline-1">
            <CardHeader className="bg-neutral-200 rounded-t-lg h-8 justify-center">
              <CodeEditorHeader>
                <CodeEditorHeader.Version />
                <CodeEditorHeader.EditToggle />
                <CodeEditorHeader.CopyIcon />
                <CodeEditorHeader.CompareIcon />
                <CodeEditorHeader.VisibilityToggle />
              </CodeEditorHeader>
            </CardHeader>
            <CardContent className="flex min-h-[450px] pt-6">
              <CodeEditor handleClick={handleVariableClick} />
            </CardContent>
          </Card>

          {/* Docs popup */}
          {/* TODO make this draggable */}
          <ChatSupport alias={fileName} />
        </div>
      </div>
    </main>
  );
}

type PushChanges = {
  path?: string;
  content: string;
  message?: string;
  fileName: string;
  projectId: string;
  clerkUserId: string;
};

const modifyVariableSchema = z.object({
  fileName: z.string().min(1),
  projectId: z.string().min(1),
  path: z.string().optional().or(z.literal("./")),
  message: z.string().optional().or(z.literal("")),
});

const ModifyVariable = ({
  clerkUserId,
  uniqueProjectId,
  fileName,
}: {
  clerkUserId: string;
  fileName: string;
  uniqueProjectId: string;
}) => {
  const { toast } = useToast();
  const location = useRouter();
  const { editorContent } = useCodeEditor();

  const { mutateAsync, isPending } = useMutation<
    unknown,
    Error,
    Pick<PushChanges, "path" | "message" | "fileName" | "projectId">
  >({
    mutationFn: async ({ path, fileName, projectId, message }) => {
      try {
        let req = await axios.post("/api/env", {
          path,
          message,
          fileName,
          projectId,
          clerkUserId,
          content: editorContent || "",
        } as PushChanges);

        if (!req.data) {
          toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem with your request.",
          });
          return Promise.reject("There was a problem with your request.");
        }

        let res = (await req.data) as {
          message: string;
          data: {
            modified: boolean;
            acknowledged: boolean;
          };
        };

        if (!res) {
          toast({
            variant: "destructive",
            description: "Failed to create environment variable.",
          });
          return Promise.reject("Failed to create environment variable.");
        }

        toast({
          description: `Environment variable: ${fileName} was created.`,
        });

        // location.push(
        //   `/new/vv?label=${projectLabel}&pid=${projectId}&var=${fileName}`
        // );

        return Promise.resolve(res);
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: "There was a problem with your request. Try again",
        });
      }
    },
  });

  const form = useForm<z.infer<typeof modifyVariableSchema>>({
    resolver: zodResolver(modifyVariableSchema),
    defaultValues: {
      path: "./",
      fileName,
      message: "",
      projectId: uniqueProjectId,
    },
  });

  const onSubmit = async ({
    path,
    message,
    fileName,
    projectId,
  }: z.infer<typeof modifyVariableSchema>) => {
    await mutateAsync({
      path,
      message,
      fileName,
      projectId,
    });
  };

  return (
    <Form {...form}>
      <Dialog>
        <DialogTrigger asChild>
          <Button type="button" variant="outline">
            <ListChecks strokeWidth={2} className="mr-2 h-4 w-4" />
            Save file
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Variable</DialogTitle>
            <DialogDescription>
              Configure a new environment variable.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 pt-4">
              <FormField
                control={form.control}
                name="fileName"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel htmlFor="file_name">File Name</FormLabel>
                    <FormControl>
                      <Input
                        id="file_name"
                        autoComplete="off"
                        placeholder=".env"
                        {...field}
                      />
                    </FormControl>

                    {form.formState.errors.fileName && (
                      <FormMessage>
                        {form.formState.errors.fileName.message}
                      </FormMessage>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="path"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel htmlFor="path">File Path</FormLabel>
                    <FormControl>
                      <Input
                        id="path"
                        autoComplete="off"
                        placeholder="./"
                        {...field}
                      />
                    </FormControl>

                    {form.formState.errors.path && (
                      <FormMessage>
                        {form.formState.errors.path.message}
                      </FormMessage>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel htmlFor="message">Message</FormLabel>
                    <FormControl>
                      <Input
                        id="message"
                        autoComplete="off"
                        placeholder="Why did you make these changes?"
                        {...field}
                      />
                    </FormControl>

                    {form.formState.errors.message && (
                      <FormMessage>
                        {form.formState.errors.message.message}
                      </FormMessage>
                    )}
                  </FormItem>
                )}
              />

              {!isPending && (
                <Button className={"w-full mt-3"} type="submit">
                  Save Integration
                </Button>
              )}

              {isPending && (
                <Button
                  className={"w-full mt-3"}
                  type="button"
                  disabled={isPending}
                >
                  Working.. <Loader2 className="h-4 w-4 animate-spin" />
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Form>
  );
};

function ChatSupport({ alias }: { alias: string }) {
  const [document, setDocument] = useState("");

  let queryDocs = useQuery(
    api.docs.searchDocumentByFileName,
    alias ? { fileName: alias } : "skip"
  );

  useEffect(() => {
    console.log("queryDocs", queryDocs);

    if (queryDocs) {
      console.log("queryDocs", queryDocs);
      setDocument(queryDocs.document);
    } else {
      setDocument(
        "Dotenv documentation context could not be found. Please respond appropriately."
      );
    }
  }, [queryDocs]);

  const { messages, input, isLoading, handleInputChange, handleSubmit } =
    useChat({
      // this is important so useChat will not use "/console/api/chat"
      api: "../api/chat",
      onError: (e) => {
        console.log(e);
      },
      body: { document },
    });

  return (
    <ExpandableChat size="md" position="bottom-right">
      <ExpandableChatHeader className="flex-col text-center justify-center">
        <h1 className="text-xl font-semibold">Chat with our AI ✨</h1>
        <p>Ask any question for our AI to answer</p>
        <div className="flex gap-2 items-center pt-2">
          {/* <Button variant="secondary">New Chat</Button> */}
          {/* <Button variant="secondary">See FAQ</Button> */}
        </div>
      </ExpandableChatHeader>
      <ExpandableChatBody>
        <ChatMessageList>
          {messages.map((item) => {
            if (item.role === "user")
              return (
                <ChatBubble key={crypto.randomUUID()}>
                  <ChatBubbleAvatar fallback={<User />} />
                  <ChatBubbleMessage>{item.content}</ChatBubbleMessage>
                </ChatBubble>
              );

            if (item.role === "assistant")
              return (
                <ChatBubble className="ml-auto" key={crypto.randomUUID()}>
                  <ChatBubbleAvatar src={robotImg(300)} />
                  <ChatBubbleMessage>{item.content}</ChatBubbleMessage>
                </ChatBubble>
              );
          })}
        </ChatMessageList>
      </ExpandableChatBody>
      <ExpandableChatFooter className="flex items-center h-20 p-3">
        <form
          onSubmit={handleSubmit}
          className="flex w-full gap-x-2 items-center"
        >
          <Input
            value={input}
            name="messages"
            onChange={handleInputChange}
            placeholder="Enter your questions."
          />

          {!isLoading && (
            <Button type="submit" size="icon">
              <Send className="size-4" />
            </Button>
          )}

          {isLoading && (
            <Button
              disabled
              size="icon"
              className="flex items-center justify-center"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
          )}
        </form>
      </ExpandableChatFooter>
    </ExpandableChat>
  );
}

const robotImg = (size: number) =>
  `https://robohash.org/convex_hackathon/set_set1?size=${size}x${size}`;

export default VariablePage;
