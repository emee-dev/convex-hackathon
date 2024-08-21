"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import "@uiw/react-textarea-code-editor/dist.css";
import {
  ChevronDown,
  ClipboardList,
  CreditCard,
  EyeOff,
  FilePenLine,
  Keyboard,
  ListChecks,
  Settings,
  User,
} from "lucide-react";
import dynamic from "next/dynamic";
import CodeEditor from "@uiw/react-textarea-code-editor";

// const CodeEditor = dynamic(
//   () => import("@uiw/react-textarea-code-editor").then((mod) => mod.default),
//   { ssr: false }
// );

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

export function Dashboard() {
  return (
    <main className="flex-1 p-4 sm:px-6 sm:py-0 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Paypal</h1>
            {/* <p className="text-muted-foreground">
              Manage your projects and view their details.
            </p> */}
          </div>
          {/* <Button>Add New Project</Button> */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-40">
                development <ChevronDown strokeWidth={1.5} className="ml-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Environments</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <User strokeWidth={2} className="mr-2 h-4 w-4" />
                  <span>development</span>
                  <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard strokeWidth={2} className="mr-2 h-4 w-4" />
                  <span>ci</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings strokeWidth={2} className="mr-2 h-4 w-4" />
                  <span>staging</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Keyboard strokeWidth={2} className="mr-2 h-4 w-4" />
                  <span>production</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem className="flex justify-center items-center text-blue-500 underline underline-offset-2">
                  <Settings strokeWidth={2} className="mr-2 h-4 w-4" />
                  <span className="text-sm font-extralight ">
                    Configure Environments
                  </span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Operations</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <ListChecks strokeWidth={2} className="mr-2 h-4 w-4" />
                  <span>
                    Compare{" "}
                    <span className="text-neutral-500 tracking-tighter text-sm">
                      Environments
                    </span>
                  </span>
                  {/* <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut> */}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Separator orientation="vertical" />
        <div className="grid grid-cols-1 mt-8">
          <Card className="outline-neutral-400 outline outline-1">
            <CardHeader className="bg-neutral-200 rounded-t-lg h-9 justify-center">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xl font-bold">.env</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-blue-400 underline underline-offset-2">
                    8s9mx7
                  </span>
                  <span>
                    <FilePenLine strokeWidth={1.5} className="w-4 h-4" />
                  </span>
                  <span>
                    <ClipboardList strokeWidth={1.5} className="w-4 h-4" />
                  </span>
                  <span>
                    <EyeOff strokeWidth={1.5} className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex items-center pt-6">
              <CodeEditor
                value={env}
                language="bash"
                placeholder="Please enter JS code."
                padding={15}
                style={{
                  padding: "0",
                  fontSize: 14,
                  backgroundColor: "#f5f5f5",
                  width: "100%",
                  fontFamily:
                    "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

export default Dashboard;
