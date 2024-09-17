"use client";

import { CodeEditorHeader, useCodeEditor } from "@/components/CodeEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@clerk/nextjs";
import "@uiw/react-textarea-code-editor/dist.css";
import axios from "axios";
import { ListChecks, Loader2, User } from "lucide-react";
import dynamic from "next/dynamic";
import { notFound, useRouter } from "next/navigation";
import Loader from "./loading";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
const CodeEditor = dynamic(() => import("@/components/CodeEditor/editor"), {
  ssr: false,
  loading: () => <Loader />,
});

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
  searchParams: { label: string | null; pid: string | null };
};

type PushChanges = {
  path?: string;
  content: string;
  message?: string;
  fileName: string;
  projectId: string;
  clerkUserId: string;
};

function VariablePage({ searchParams }: DashboardProps) {
  const uniqueProjectId = searchParams.pid;
  const projectLabel = searchParams.label;
  const { user } = useUser();

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
            <CreateVariable
              clerkUserId={user?.id!}
              uniqueProjectId={uniqueProjectId}
              searchParams={searchParams}
            />
          </div>
        </div>
        <Separator orientation="vertical" />

        <div className="grid grid-cols-1 gap-y-2 mt-5">
          <Card className="outline-neutral-400 h-full flex-1 outline outline-1">
            <CardHeader className="bg-neutral-200 rounded-t-lg h-8 justify-center">
              <CodeEditorHeader>
                <CodeEditorHeader.EditToggle />
                <CodeEditorHeader.CopyIcon />
                <CodeEditorHeader.VisibilityToggle />
              </CodeEditorHeader>
            </CardHeader>
            <CardContent className="flex min-h-[450px] pt-6">
              <CodeEditor handleClick={handleVariableClick} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

const createVariableSchema = z.object({
  fileName: z.string().min(1),
  projectId: z.string().min(1),
  path: z.string().optional().or(z.literal("./")),
  message: z.string().optional().or(z.literal("")),
});

const CreateVariable = ({
  clerkUserId,
  uniqueProjectId,
  searchParams,
}: {
  clerkUserId: string;
  uniqueProjectId: string;
  searchParams: DashboardProps["searchParams"];
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

        let projectLabel = searchParams.label;

        location.push(
          `/new/vv?label=${projectLabel}&pid=${projectId}&var=${fileName}`
        );

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

  const form = useForm<z.infer<typeof createVariableSchema>>({
    resolver: zodResolver(createVariableSchema),
    defaultValues: {
      path: "./",
      fileName: "",
      message: "",
      projectId: uniqueProjectId,
    },
  });

  const onSubmit = async ({
    path,
    message,
    fileName,
    projectId,
  }: z.infer<typeof createVariableSchema>) => {
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

export default VariablePage;
