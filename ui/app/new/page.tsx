"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import useCopyToClipboard from "@/hooks/useCopyToClipboard";
import { generateConfig, getRelative } from "@/lib/utils";
import { useConvexMutation } from "@convex-dev/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation as tuseMutation } from "@tanstack/react-query";
import axios from "axios";
import { usePaginatedQuery, useQuery } from "convex/react";
import { CopyCheck, CopyIcon, EllipsisVertical, Loader2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type DashboardProps = {
  params: {};
  searchParams: { label: string | null; pid: string | null };
};

type DashboardView = "all" | "variables" | "logs" | "team" | "integrations";

const Dashboard = ({ searchParams }: DashboardProps) => {
  const uniqueProjectId = searchParams.pid;
  const projectLabel = searchParams.label;
  const [view, setView] = useState<DashboardView>("all");

  // TODO deligate the request by making sure the tab is active before fetching data.
  let {
    results: variables,
    status: variableStatus,
    loadMore: loadMoreVariables,
    isLoading: isLoadingVariables,
  } = usePaginatedQuery(
    api.env.listVariables,
    uniqueProjectId
      ? {
          uniqueProjectId,
        }
      : "skip",
    { initialNumItems: 5 }
  );

  let {
    results: logs,
    status: logStatus,
    loadMore: LoadMoreLogs,
    isLoading: isLoadingLogs,
  } = usePaginatedQuery(
    api.env.listAuditLogs,
    uniqueProjectId
      ? {
          uniqueProjectId,
        }
      : "skip",
    { initialNumItems: 5 }
  );

  let teamData = useQuery(
    api.project.listProjectTeam,
    uniqueProjectId ? { uniqueProjectId } : "skip"
  );

  let {
    results: integrations,
    status: integrationsStatus,
    loadMore: LoadMoreIntegrations,
    isLoading: isLoadingIntegrations,
  } = usePaginatedQuery(
    api.integrations.listIntegrations,
    uniqueProjectId
      ? {
          uniqueProjectId,
        }
      : "skip",
    { initialNumItems: 5 }
  );

  if (!uniqueProjectId || !projectLabel) {
    return notFound();
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/80">
      <main className="grid flex-1 items-start mt-5 gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="flex w-full items-center justify-start gap-4 border-b bg-background px-4 sm:px-6">
            <TabsTrigger value="all" onClick={() => setView("all")}>
              All
            </TabsTrigger>
            <TabsTrigger value="variables" onClick={() => setView("variables")}>
              Variables
            </TabsTrigger>
            <TabsTrigger value="logs" onClick={() => setView("logs")}>
              Logs
            </TabsTrigger>
            <TabsTrigger value="team" onClick={() => setView("team")}>
              Team
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              onClick={() => setView("integrations")}
            >
              Integrations
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Overview</CardTitle>
                <CardDescription>
                  This is the main dashboard view with high-level metrics.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConfigCard uniqueProjectId={uniqueProjectId} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="variables">
            <Card>
              <CardHeader className="grid grid-cols-5">
                <div className="flex flex-col col-span-4">
                  <CardTitle>Variables</CardTitle>
                  <CardDescription>
                    Manage your application variables here.
                  </CardDescription>
                </div>

                <div>
                  <Link
                    href={`/new/nv?pid=${uniqueProjectId}&label=${projectLabel}`}
                    prefetch={true}
                  >
                    <Button size="sm" className="w-full">
                      Create
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>
                        <span>Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingVariables && variableStatus !== "Exhausted" ? (
                      <TableLoading />
                    ) : variables.length > 0 ? (
                      variables.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell className="font-medium">
                            {item.fileName}
                          </TableCell>
                          <TableCell>
                            {getRelative(item._creationTime)} ago
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  aria-haspopup="true"
                                  size="icon"
                                  variant="ghost"
                                >
                                  <EllipsisVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>
                                  <Link
                                    href={`/new/vv?pid=${uniqueProjectId}&label=${projectLabel}&var=${item.fileName}`}
                                  >
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableNoData />
                    )}
                  </TableBody>
                </Table>
                <Pagination className="mt-4" />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Logs</CardTitle>
                <CardDescription>
                  View your application logs here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>
                        <span>Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingLogs && logStatus !== "Exhausted" ? (
                      <TableLoading />
                    ) : logs.length > 0 ? (
                      logs.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>
                            {getRelative(item._creationTime)} ago
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.type}</Badge>
                          </TableCell>
                          <TableCell>{item.message}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  aria-haspopup="true"
                                  size="icon"
                                  variant="ghost"
                                >
                                  <EllipsisVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>
                                  View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableNoData />
                    )}
                  </TableBody>

                  <Button className="w-full">Load more</Button>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="team">
            <Card>
              <CardHeader className="grid grid-cols-5">
                <div className="flex flex-col col-span-4">
                  <CardTitle>Team</CardTitle>
                  <CardDescription>
                    View and manage your team members.
                  </CardDescription>
                </div>
                <div>
                  <CreateInvitation />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>
                        <span>Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamData && teamData.length > 0 ? (
                      teamData.map((item) => (
                        <TableRow key={crypto.randomUUID()}>
                          <TableCell className="font-medium">
                            {item?.firstName.toUpperCase()}{" "}
                            {item?.lastName.toUpperCase()}
                          </TableCell>
                          <TableCell>{item?.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item?.role}</Badge>

                            {item?.isOwner ? (
                              <Badge variant="secondary">{"owner"}</Badge>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  aria-haspopup="true"
                                  size="icon"
                                  variant="ghost"
                                >
                                  <EllipsisVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Remove</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableNoData />
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations">
            <Card>
              <CardHeader className="grid grid-cols-5">
                <div className="flex flex-col col-span-4">
                  <CardTitle>Integrations</CardTitle>
                  <CardDescription>
                    View your application api integrations here.
                  </CardDescription>
                </div>
                <div>
                  <CreateIntegration uniqueProjectId={uniqueProjectId} />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Label</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>
                        <span>Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingIntegrations &&
                    integrationsStatus !== "Exhausted" ? (
                      <TableLoading />
                    ) : integrations.length > 0 ? (
                      integrations.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>{item.label}</TableCell>
                          <TableCell>
                            {getRelative(item._creationTime)} ago
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  aria-haspopup="true"
                                  size="icon"
                                  variant="ghost"
                                >
                                  <EllipsisVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>Delete Key</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableNoData />
                    )}
                  </TableBody>
                </Table>
                <Pagination className="mt-4" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

const TableLoading = () => (
  <TableRow>
    <TableCell colSpan={4} className="py-8 text-center">
      <div className="h-6 w-6 animate-spin" />
      <span className="ml-2">Loading...</span>
    </TableCell>
  </TableRow>
);

const TableNoData = () => (
  <TableRow>
    <TableCell colSpan={4} className="py-8 text-center">
      <p className="text-muted-foreground">No data available</p>
    </TableCell>
  </TableRow>
);

function ConfigCard({ uniqueProjectId }: { uniqueProjectId: string }) {
  const [config, setConfig] = useState("");
  const { copied, copyToClipboard } = useCopyToClipboard();

  useEffect(() => {
    if (uniqueProjectId) {
      setConfig(generateConfig(uniqueProjectId));
    }
  }, [uniqueProjectId]);

  return (
    <div className="flex flex-col md:flex-row w-full max-w-6xl mx-auto p-2 gap-3">
      <div className="">
        <h1 className="text-2xl font-semibold">Setup project</h1>
        <p className="text-muted-foreground mt-2">
          Get the config for your app
        </p>
      </div>
      <div className="flex-1 grid">
        <Card>
          <CardContent className="grid pt-4">
            <Tabs defaultValue="config">
              <div className="flex">
                <TabsList>
                  <TabsTrigger value="config">dxenv.config.json</TabsTrigger>
                </TabsList>

                <Button
                  variant="outline"
                  type="button"
                  className="ml-auto"
                  size={"icon"}
                  onClick={() => copyToClipboard(config)}
                >
                  {copied ? (
                    <CopyCheck className="size-4" />
                  ) : (
                    <CopyIcon className="size-4" />
                  )}
                </Button>
              </div>

              <TabsContent value="config">
                <Textarea className="w-full h-48" defaultValue={config} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const formSchema = z.object({
  email: z.string().email("Please provide a valid email."),
  role_code: z.union([z.literal("basic_user"), z.literal("admin_user")]),
});

const integrationSchema = z.object({
  label: z.string().min(1, "Please provide a valid email."),
  uniqueProjectId: z.string().min(1, "Please provide a valid project id."),
  project_role: z.literal("basic_user"),
});

const CreateInvitation = () => {
  const { toast } = useToast();
  let listRoles = useQuery(api.roles.listRoles);

  const { data, mutateAsync, isPending } = tuseMutation<
    unknown,
    Error,
    { email: string; role_code: "basic_user" | "admin_user" }
  >({
    mutationFn: async ({ email, role_code }) => {
      try {
        let req = await axios.post("/api", { email, role_code });

        if (!req.data) {
          toast({
            variant: "destructive",
            description: "There was an error processing this request.",
          });
          return;
        }

        let isPending = await req.data.pending;

        if (isPending) {
          toast({
            description: "Your invite has been sent.",
          });
          return;
        }

        return Promise.resolve(isPending);
      } catch (error) {
        console.log(error);
      }
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      role_code: "basic_user",
    },
  });

  const onSubmit = async ({ email, role_code }: z.infer<typeof formSchema>) => {
    await mutateAsync({ email, role_code });
  };

  return (
    <Form {...form}>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Invite Team Member</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Enter the email address and select the user role to invite a new
              team member.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel htmlFor="email">Email</FormLabel>
                    <FormControl>
                      <Input
                        id="email"
                        autoComplete="off"
                        placeholder="Enter email address"
                        {...field}
                      />
                    </FormControl>

                    {form.formState.errors.email && (
                      <FormMessage>
                        {form.formState.errors.email.message}
                      </FormMessage>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role_code"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel htmlFor="role">Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {listRoles && listRoles.length > 0
                          ? listRoles.map((item) => {
                              return (
                                <SelectItem value={item.code} key={item._id}>
                                  {item.name}
                                </SelectItem>
                              );
                            })
                          : null}
                      </SelectContent>
                    </Select>

                    {form.formState.errors.role_code && (
                      <FormMessage>
                        {form.formState.errors.role_code.message}
                      </FormMessage>
                    )}
                  </FormItem>
                )}
              />

              {!isPending && (
                <Button className={`w-full`} type="submit">
                  Send Invitation
                </Button>
              )}

              {isPending && (
                <Button className={`w-full`} type="submit" disabled={isPending}>
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

const CreateIntegration = ({
  uniqueProjectId,
}: {
  uniqueProjectId: string;
}) => {
  const { toast } = useToast();
  const { copied, copyToClipboard } = useCopyToClipboard();
  const [key, setKey] = useState("");
  const [maskedKey, setMaskedKey] = useState("");
  const [loading, setLoading] = useState(false);

  const { data, isPending, error, mutateAsync } = tuseMutation({
    mutationFn: useConvexMutation(api.integrations.storeIntegration),
  });

  const form = useForm<z.infer<typeof integrationSchema>>({
    resolver: zodResolver(integrationSchema),
    defaultValues: {
      label: "",
      project_role: "basic_user",
      uniqueProjectId,
    },
  });

  const maskKey = (key: string) => {
    const prefix = "dxenv_";
    return prefix + "*".repeat(key.length - prefix.length);
  };

  const onSubmit = async ({
    label,
    project_role,
    uniqueProjectId,
  }: z.infer<typeof integrationSchema>) => {
    try {
      setLoading(true);
      let req = await axios.put("/api", {
        label,
        uniqueProjectId,
        project_role,
      });

      if (!req.data) {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: "There was a problem with your request.",
        });
        return;
      }

      let integration = (await req.data.key) as
        | { keyId: string; key: string }
        | undefined;

      if (!integration) {
        toast({
          variant: "destructive",
          title: "Failed to create integration.",
          description: req.data.message,
        });
        return;
      }

      toast({
        description: `An integration for: '${label}' was created.`,
      });

      // store integration
      await mutateAsync({
        label,
        project_role,
        uniqueProjectId,
        unkeyKeyId: integration.keyId,
      });

      setLoading(false);

      // Set both the real key and the masked key
      setKey(integration.key);
      setMaskedKey(maskKey(integration.key));
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Add Integration</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Integration</DialogTitle>
            <DialogDescription>
              Generate an API key and label it for your new integration.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel htmlFor="label">Label</FormLabel>
                    <FormControl>
                      <Input
                        id="label"
                        autoComplete="off"
                        placeholder="Enter a label for your API key"
                        {...field}
                      />
                    </FormControl>

                    {form.formState.errors.label && (
                      <FormMessage>
                        {form.formState.errors.label.message}
                      </FormMessage>
                    )}
                  </FormItem>
                )}
              />

              <div className={`space-y-2 ${key ? "visible" : "hidden"}`}>
                <Label htmlFor="api-key">API Key</Label>
                <DialogDescription>
                  This key is only shown once and cannot be recovered.
                </DialogDescription>
                <div className="flex items-center gap-2">
                  <Input id="api-key" value={maskedKey} readOnly />
                  <Button
                    variant="ghost"
                    type="button"
                    className="px-2"
                    onClick={() => copyToClipboard(key)}
                  >
                    {copied ? (
                      <CopyCheck className="w-5 h-5" />
                    ) : (
                      <CopyIcon className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>

              {!isPending && !loading ? (
                <Button
                  className={`w-full ${key ? "mt-0" : "mt-4"}`}
                  type="submit"
                >
                  Save Integration
                </Button>
              ) : null}

              {loading || isPending ? (
                <Button
                  className={`w-full ${key ? "mt-0" : "mt-4"}`}
                  type="submit"
                  disabled={isPending && loading ? true : false}
                >
                  Working.. <Loader2 className="h-4 w-4 animate-spin" />
                </Button>
              ) : null}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Form>
  );
};

export default Dashboard;
