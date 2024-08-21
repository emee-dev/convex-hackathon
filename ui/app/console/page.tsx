import BookOpenIcon from "@/components/icons/book-open";
import GitBranchIcon from "@/components/icons/git-branch";
import GithubIcon from "@/components/icons/github";
import HomeIcon from "@/components/icons/home";
import LayoutPanelLeftIcon from "@/components/icons/layout-panel-left";
import SmartphoneIcon from "@/components/icons/smart-phone";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

let projects = [
  {
    app_name: "Acme Website",
    app_url: "https://acme.com",
  },
  {
    app_name: "Docs Website",
    app_url: "https://acme.com",
  },
  {
    app_name: "Paypal",
    app_url: "https://paypal.com",
  },
  {
    app_name: "Mobile App",
    app_url: "https://acme.com",
  },
];

export function Dashboard() {
  return (
    <main className="flex-1 p-4 sm:px-6 sm:py-0 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">
              Manage your projects and view their details.
            </p>
          </div>
          <Button>Add New Project</Button>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
          {projects.map((project) => {
            return (
              <Card key={crypto.randomUUID()}>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <HomeIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <Link href={"/console/project"}>
                        <CardTitle>{project.app_name}</CardTitle>
                        <CardDescription>{project.app_url}</CardDescription>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <GithubIcon className="h-4 w-4" />
                    <span>3h ago</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <GitBranchIcon className="h-4 w-4" />
                    <span>main</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export default Dashboard;
