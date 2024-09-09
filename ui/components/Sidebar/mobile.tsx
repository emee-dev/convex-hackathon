"use client";

import LockIcon from "@/components/icons/lock";
import MenuIcon from "@/components/icons/menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type MobileSidebarProps = {
  links: {
    label: string;
    component: JSX.Element;
    path: string;
  }[];
};

export const MobileSidebar = ({ links }: MobileSidebarProps) => {
  const currentPath = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="sm:hidden">
          <MenuIcon className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-xs">
        <nav className="grid gap-6 text-lg font-medium">
          <Link
            href="#"
            className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            prefetch={false}
          >
            <LockIcon className="h-5 w-5 transition-all group-hover:scale-110" />
          </Link>
          {links.map((link) => {
            return (
              <Link
                href={link.path}
                key={crypto.randomUUID()}
                className={`flex items-center gap-4 px-2.5 ${currentPath.includes(link.path) && currentPath.endsWith(link.path) ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {link.component}
                {link.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
};
