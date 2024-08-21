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
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDown,
  Cigarette,
  ClipboardList,
  CreditCard,
  Eye,
  EyeOff,
  FilePenLine,
  Keyboard,
  ListChecks,
  Settings,
  User,
} from "lucide-react";
// import dynamic from "next/dynamic";
import {
  Column,
  ColumnFiltersState,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ReactNode, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import Link from "next/link";

// const CodeEditor = dynamic(
//   () => import("@uiw/react-textarea-code-editor").then((mod) => mod.default),
//   { ssr: false }
// );

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Payment = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};

export type Environment = {
  development: string;
  ci: string;
  staging: string;
  production: string;
};

function getData(): Payment[] {
  // Fetch data from your API here.
  return [
    {
      id: "728ed52f",
      amount: 100,
      status: "pending",
      email: "m@example.com",
    },
    {
      id: "489e1d42",
      amount: 125,
      status: "processing",
      email: "example@gmail.com",
    },
    {
      id: "728ed52f",
      amount: 100,
      status: "pending",
      email: "m@example.com",
    },
  ];
}

export function Dashboard() {
  const data = getData();
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
        <div className="grid grid-cols-1 gap-3 mt-8">
          <div>
            <CopyFromTable />
          </div>
          <DataTable columns={columns} data={data} />
        </div>
      </div>
    </main>
  );
}

export const columns: ColumnDef<Payment>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: () => <div className="text-left">Id</div>,
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-center">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);

      return <div className="text-center font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "status",
    header: () => <div className="text-left">Status</div>,
    cell: ({ row }) => {
      const status = row.getValue("status" as keyof Payment) as ReactNode;
      return (
        <div className="text-right gap-3 flex items-center font-medium">
          {status}
          <span className="ml-auto text-blue-500">
            <Link href={"#"} prefetch={false}>
              <FilePenLine strokeWidth={1.5} className="w-4 h-4" />
            </Link>
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: () => <div className="text-left">Email</div>,
    cell: ({ row }) => {
      const status = row.getValue("email" as keyof Payment) as ReactNode;
      return (
        <div className="text-right gap-3 flex items-center font-medium">
          {status}
          <span className="ml-auto text-blue-500">
            <Link href={"#"} prefetch={false}>
              <FilePenLine strokeWidth={1.5} className="w-4 h-4" />
            </Link>
          </span>
        </div>
      );
    },
  },
];

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDownIcon className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUpIcon className="ml-2 h-4 w-4" />
            ) : (
              <Cigarette className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUpIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDownIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Desc
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Hide
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="rounded-md w-full border outline-neutral-400 outline outline-1">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex-1 text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
    </div>
  );
}

const CopyFromTable = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" className="w-24 flex items-center" size="sm">
        Copy <ChevronDown strokeWidth={1.5} className="ml-3" />
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
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
);

export default Dashboard;
