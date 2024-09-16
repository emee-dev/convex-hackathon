"use client";

import GitBranchIcon from "@/components/icons/git-branch";
import HomeIcon from "@/components/icons/home";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { getRelative } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Project = {
  _id: string;
  _creationTime: number;
  website?: string | undefined;
  label: string;
  uniqueProjectId: string;
  team: {
    clerkUserId: string;
    project_role: "basic_user" | "admin_user";
  }[];
  maintainedByClerkUserId: string;
};

const Dashboard = () => {
  const { isSignedIn, user, isLoaded } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);

  let getProjects = useQuery(
    api.project.listProjects,
    user && isLoaded && isSignedIn ? { clerkUserId: user.id } : "skip"
  );

  useEffect(() => {
    if (getProjects && getProjects.data) {
      setProjects(getProjects.data);
    }
  }, [getProjects]);

  return (
    <main className="flex-1 p-4 sm:px-6 sm:py-0 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="text-pretty">
            <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">
              Manage your projects and view their details.
            </p>
          </div>
          <Link href={`/new/np`}>
            <Button size="sm">Add New Project</Button>
          </Link>
        </div>
        <section>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
              {projects.map((project) => {
                return (
                  <Card key={crypto.randomUUID()}>
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <HomeIcon className="size-4" />
                        </div>
                        <div>
                          <Link
                            href={`/new?pid=${project.uniqueProjectId}&label=${encodeURIComponent(project.label)}`}
                          >
                            <CardTitle className="text-xl hover:underline hover:underline-offset-4">
                              {project.label}
                            </CardTitle>
                            <CardDescription>{project.website}</CardDescription>
                          </Link>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <GitBranchIcon className="h-4 w-4" />
                        <span>{getRelative(project._creationTime)} ago</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <NoProjectError />
          )}
        </section>
      </div>
    </main>
  );
};

function NoProjectError() {
  return (
    <div className="flex flex-col w-full items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto text-center">
        <TriangleAlertIcon className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Oops, projects not found!
        </h1>
        <p className="mt-4 text-muted-foreground">
          {
            "The data you're looking for doesn't exist. Please create a project to get started."
          }
        </p>
        <div className="mt-6">
          <Link
            href={"/console/project/new"}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            prefetch={false}
          >
            Add New Project
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
