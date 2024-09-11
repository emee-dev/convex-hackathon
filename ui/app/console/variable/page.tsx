"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import useCopyToClipboard from "@/hooks/useCopyToClipboard";
import "@uiw/react-textarea-code-editor/dist.css";
import { useQuery } from "convex/react";
import {
  CheckCheck,
  ClipboardList,
  Eye,
  EyeOff,
  FilePenLine,
  GitBranch,
  ListChecks,
  Minimize,
  ToggleLeft,
  ToggleRight,
  User,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Loader from "./loading";
import { decryptInDashboard } from "./actions";
import { defaultKeyMapping } from "@/types";
import { useUser } from "@clerk/nextjs";
// import EventEmitter from "events";
import { Input } from "@/components/ui/input";
const CodeEditor = dynamic(() => import("@/components/CodeEditor"), {
  ssr: false,
  loading: () => <Loader />,
});

type EnvironmentComponentProps = {
  environments: {
    label: string;
    component: JSX.Element;
  }[];
  currentEnvironment: string;
  setCurrentEnvironment: (value: string) => void;
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

let env = `# development@v3
HELLO="development"

#
# Hi 👋, this is a real .env file.
#
# 1. Connect to it locally (one-time setup):
#
# $ cd ../path/to/testing
# $ npx dotenv-vault@latest new vlt_27abd8ad8ea4513faa1c3954f667224953f94966aa636f803671e8e151b1303e
#
# 2. Pull it down:
#
# $ npx dotenv-vault@latest pull
#
# 3. Or push yours up:
#
# $ npx dotenv-vault@latest push
#
# 
# Enjoy. 🌴
OPEN_AI_API_KEY="19225"`;

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

  // env.emit("click");

  // encrypted content
  // let envFileContent = useQuery(
  //   api.env.getEnvByFileName,
  //   uniqueProjectId
  //     ? {
  //         fileName: defaultKeyMapping[currentEnvironment] || "",
  //         projectId: uniqueProjectId,
  //       }
  //     : "skip"
  // );
  let envFileContent = useQuery(api.env.getEnvByFileName, "skip");

  useEffect(() => {
    let decryptedContent = async () => {
      if (!envFileContent || !envFileContent.data || !uniqueProjectId) {
        console.error("Error loading environment file content.");
        setContentVersion("8s9mx7");
        setEditorContent(env);
        return;
      }

      let fileName = defaultKeyMapping[currentEnvironment] || "";
      let encryptedData = envFileContent.data.encryptedData;
      let version = envFileContent.data.version;
      let clerkUserId = user?.id!;

      if (!fileName) {
        console.warn(`Environment ${fileName} does not exist.`);
      }

      // let data = await decryptInDashboard({
      //   fileName,
      //   clerkUserId,
      //   encryptedData,
      //   uniqueProjectId,
      // }).catch((e) => {
      //   // TODO display appropriate toast
      //   console.log(e.message);
      // });
      let data = "";

      if (!data) {
        console.warn("No data");
        return;
      }

      setEditorContent(data);
      setContentVersion(version);
    };

    decryptedContent();
  }, [envFileContent, currentEnvironment, uniqueProjectId, user]);

  if (!uniqueProjectId || !projectLabel) {
    return notFound();
  }

  const handleClick = (args: any) => {
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
            <EnvironmentComponent
              environments={environments}
              currentEnvironment={currentEnvironment}
              setCurrentEnvironment={setCurrentEnvironment}
            />
          </div>
        </div>
        <Separator orientation="vertical" />
        {/* <div className="grid grid-cols-1 gap-y-2 sm:grid-cols-2 sm:gap-x-2 mt-5"> */}
        <div className="grid relative gap-2 grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(390px,1fr))] mt-5">
          <Card className="outline-neutral-400 h-full flex-1 outline outline-1">
            <CardHeader className="bg-neutral-200 rounded-t-lg h-8 justify-center">
              <CodeEditorHeader
                visible={visible}
                editable={editable}
                version={contentVersion}
                editorContent={editorContent}
                setVisible={(state) => setVisible(state)}
                setEditable={(state) => setEditable(state)}
              />
            </CardHeader>
            <CardContent className="flex min-h-[450px] pt-6">
              {/* <CodeEditor
                editable={editable}
                handleClick={handleClick}
                content={editorContent}
              /> */}
            </CardContent>
          </Card>

          {/* Docs Panel */}
          {showDocsPanel && (
            <>
              <Card className="outline-neutral-400 relative outline outline-1">
                <CardHeader className="flex py-4 flex-row justify-between">
                  <div className="text-lg font-semibold">Documentation</div>
                  <X
                    strokeWidth={2}
                    className="size-4 transition ease-in-out delay-150 duration-300 hover:scale-150"
                    onClick={() => setShowDocsPanel(!showDocsPanel)}
                  />
                </CardHeader>
                <CardContent className="flex pt-2">
                  {/* This is for a This is for a This is for a This is for a This
                  is for a This is for a This is for a This is for a This is for
                  a This is for a This is for a This is for a This is for a This
                  is for a This is for a This is for a This is for a This is for
                  a This is for a This is for a This is for a This is for a This
                  is for a This is for a This is for a This is for a This is for
                  a This is for a This is for a This is for a This is for a This
                  is for a This is for a This is for a This is for a This is for
                  a This is for a This is for a This is for a This is for a This
                  is for a This is for a This is for a This is for a This is for
                  a This is for a This is for a This is for a This is for a This
                  is for a This is for a This is for a This is for a This is for
                  a This is for a This is for a This is for a This is for a This
                  is for a This is for a This is for a This is for a This is for
                  a This is for a This is for a This is for a This is for a This
                  is for a This is for a This is for a This is for a This is for
                  a */}
                </CardContent>

                {/* <CardFooter className="absolute bottom-2 w-full">
                  <Input
                    placeholder="Enter your question here."
                    className="w-full"
                  ></Input>
                </CardFooter> */}
              </Card>
            </>
          )}
        </div>

        <Card className="bottom-4 outline-1 outline-neutral-400 outline shadow-2xl w-full mt-4">
          <Input
            placeholder="Enter your question here."
            className="w-full"
          ></Input>
        </Card>
      </div>
    </main>
  );
}

type CodeEditorHeaderProps = {
  version: string;
  visible: boolean;
  editable: boolean;
  editorContent: string;
  setVisible: (state: boolean) => void;
  setEditable: (state: boolean) => void;
};

const CodeEditorHeader = ({
  version,
  visible,
  editable,
  setVisible,
  setEditable,
  editorContent,
}: CodeEditorHeaderProps) => {
  const { copied, copyToClipboard } = useCopyToClipboard();

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xl font-bold">.env</span>
      <div className="flex items-center ">
        <div className="text-sm flex items-center">
          <GitBranch className="mr-1 w-4 h-4" strokeWidth={1.5} />
          <Link
            href={"#"}
            className="text-blue-400 underline underline-offset-2"
          >
            {version}
          </Link>
        </div>
        <div className="flex items-center gap-x-3 ml-4 text-sm">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                {editable ? (
                  <ToggleRight
                    strokeWidth={1.5}
                    className="w-5 h-5"
                    onClick={() => setEditable(!editable)}
                  />
                ) : (
                  <ToggleLeft
                    strokeWidth={1.5}
                    className="w-5 h-5"
                    onClick={() => setEditable(!editable)}
                  />
                )}
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                {copied ? (
                  <CheckCheck strokeWidth={1.5} className="w-4 h-4" />
                ) : (
                  <ClipboardList
                    strokeWidth={1.5}
                    className="w-4 h-4"
                    onClick={() => copyToClipboard(editorContent)}
                  />
                )}
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <ListChecks strokeWidth={1.5} className="w-4 h-4" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Compare variables</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                {visible ? (
                  <Eye
                    strokeWidth={1.5}
                    className="w-4 h-4"
                    onClick={() => setVisible(!visible)}
                  />
                ) : (
                  <EyeOff
                    strokeWidth={1.5}
                    className="w-4 h-4"
                    onClick={() => setVisible(!visible)}
                  />
                )}
              </TooltipTrigger>
              <TooltipContent>
                <p>Visibility</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

const EnvironmentComponent = ({
  environments,
  currentEnvironment,
  setCurrentEnvironment,
}: EnvironmentComponentProps) => {
  return (
    <Select
      value={currentEnvironment}
      onValueChange={(value) => setCurrentEnvironment(value)}
    >
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

export default VariablePage;
