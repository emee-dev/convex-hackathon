"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const urlRegex =
  /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/;

const formSchema = z.object({
  label: z.string({ message: "Please provide a valid project name" }).min(1, {
    message: "Project name is too short.",
  }),
  website_url: z.union([
    z.literal(""),
    z
      .string()
      .trim()
      .regex(urlRegex, { message: "Please provide a valid website URL." }),
  ]),
});

function CreateProjectPage() {
  let createProject = useMutation(api.project.createProject);
  const { isLoaded, isSignedIn, user } = useUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: "",
      website_url: "",
    },
  });

  const onSubmit = async ({
    label,
    website_url,
  }: z.infer<typeof formSchema>) => {
    if (!isLoaded || !isSignedIn || !user) {
      return;
    }

    let userId = user.id;

    let res = await createProject({
      label,
      userId,
      uniqueProjectId: crypto.randomUUID(),
      website_url,
    });

    if (!res.data) {
      console.warn(res.message);
      return;
    }

    if (res.data.created) {
      // TODO show toast
      return console.log("Created");
    }
  };

  return (
    <>
      <div className="flex justify-end mt-14 px-24">
        <Button className="w-32">Go back</Button>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex w-full items-center justify-center mt-5"
        >
          <Card className="w-full max-w-xl">
            <CardHeader>
              <CardTitle className="text-2xl">New project</CardTitle>
              <CardDescription>
                Use the same project name as your local repository.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem className="grid gap-2">
                    <FormLabel>Project name</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Your local repo name"
                        autoComplete="off"
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
              <FormField
                control={form.control}
                name="website_url"
                render={({ field }) => (
                  <FormItem className="grid gap-2">
                    <FormLabel>Website Url (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="https://yoursite.com"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>

                    {form.formState.errors.website_url && (
                      <FormMessage>
                        {form.formState.errors.website_url.message}
                      </FormMessage>
                    )}
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                Submit
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </>
  );
}

export default CreateProjectPage;
