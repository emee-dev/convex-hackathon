"use client";

import { CodeEditorHeader, useCodeEditor } from "@/components/CodeEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useChat } from "ai/react";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat/chat-bubble";
import { ChatInput } from "@/components/ui/chat/chat-input";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import {
  ExpandableChat,
  ExpandableChatBody,
  ExpandableChatFooter,
  ExpandableChatHeader,
} from "@/components/ui/chat/expandable-chat";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import { defaultKeyMapping } from "@/types";
import { useUser } from "@clerk/nextjs";
import "@uiw/react-textarea-code-editor/dist.css";
import { useMutation, useQuery } from "convex/react";
import { ListChecks, Loader2, Send, User, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Loader from "./loading";
import { Textarea } from "@/components/ui/textarea";
import { decryptInDashboard } from "./actions";
const CodeEditor = dynamic(() => import("@/components/CodeEditor/editor"), {
  ssr: false,
  loading: () => <Loader />,
});

type EnvironmentComponentProps = {
  environments: {
    label: string;
    component: JSX.Element;
  }[];
  // currentEnvironment: string;
  // setCurrentEnvironment: (value: string) => void;
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

function VariablePage() {
  const params = useSearchParams();
  const uniqueProjectId = params.get("pid");
  const projectLabel = params.get("label");
  const { isLoaded, isSignedIn, user } = useUser();
  const [editorContent, setEditorContent] = useState<string>("");
  const [contentVersion, setContentVersion] = useState<string>("");
  const [currentEnvironment, setCurrentEnvironment] =
    useState<string>("development");
  const [visible, setVisible] = useState<boolean>(false);
  const [editable, setEditable] = useState<boolean>(false);
  const [showDocsPanel, setShowDocsPanel] = useState<boolean>(true);

  // encrypted content
  let envFileContent = useQuery(
    api.env.getEnvByFileName,
    uniqueProjectId
      ? {
          fileName: defaultKeyMapping[currentEnvironment] || "",
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
        setContentVersion("8s9mx7");
        setEditorContent(env);
        return;
      }

      let fileName = defaultKeyMapping[currentEnvironment] || "";
      let encryptedData = envFileContent.data.encryptedData;
      let edit_version = envFileContent.data.version;
      let clerkUserId = user?.id!;

      if (!fileName) {
        console.warn(`Environment ${fileName} does not exist.`);
      }

      let data = await decryptInDashboard({
        fileName,
        clerkUserId,
        edit_version,
        encryptedData,
        uniqueProjectId,
      }).catch((e) => {
        // TODO display appropriate toast
        console.log(e.message);
      });

      if (!data) {
        console.warn("No data");
        return;
      }

      setEditorContent(data);
      setContentVersion(edit_version);
    };

    decryptedContent();
  }, [envFileContent, currentEnvironment, uniqueProjectId, user]);

  if (!uniqueProjectId || !projectLabel) {
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button variant={"outline"} asChild>
                    <Link href={"/console/variable/configure"}>
                      <ListChecks strokeWidth={2} className="mr-2 h-4 w-4" />
                      <div>Configure</div>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Configure environments</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <SelectEnvironment environments={environments} />
          </div>
        </div>
        <Separator orientation="vertical" />

        {/* {showDocsPanel && (
          <div className="flex items-center gap-x-4 mt-4">
            <Card className="outline-neutral-400 min-h-12 p-2 flex-1 outline outline-1">
              This will be
            </Card>
            <X
              strokeWidth={2}
              className="size-5 transition ease-in-out delay-150 duration-300 hover:scale-150"
              onClick={() => setShowDocsPanel(!showDocsPanel)}
            />
          </div>
        )} */}

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
          <ChatSupport alias={currentEnvironment} />
        </div>
      </div>
    </main>
  );
}

const SelectEnvironment = ({ environments }: EnvironmentComponentProps) => {
  const { alias, setAlias } = useCodeEditor();

  return (
    <Select value={alias} onValueChange={(value) => setAlias(value)}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder={"development"} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel className="px-1">Environments</SelectLabel>
          {environments.map((env) => {
            return (
              <SelectItem key={crypto.randomUUID()} value={env.label}>
                <div className="flex items-center">
                  {env.component}
                  <span>{env.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

function ChatSupport({ alias }: { alias: string }) {
  const [document, setDocument] = useState("");

  let queryDocs = useQuery(
    api.docs.searchDocumentByFileName,
    alias ? { fileName: defaultKeyMapping[alias] || "" } : "skip"
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
