"use client";

import useCopyToClipboard from "@/hooks/useCopyToClipboard";
import { defaultKeyMapping } from "@/types";
import {
  CheckCheck,
  ClipboardList,
  Eye,
  EyeOff,
  GitBranch,
  ListChecks,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import Link from "next/link";
import React, { createContext, useContext, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

type CodeEditorContextType = {
  alias: string;
  version: string;
  visible: boolean;
  editable: boolean;
  editorContent: string;
  copied: boolean;
  children?: React.ReactNode;
  setAlias: (state: string) => void;
  setVersion: (state: string) => void;
  setVisible: (state: boolean) => void;
  setEditable: (state: boolean) => void;
  copyToClipboard: (content: string) => void;

  setEditorContent: (val: string) => void;
};

const CodeEditorContext = createContext<CodeEditorContextType | null>(null);

export const CodeEditorProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [visible, setVisible] = useState(true);
  const [editable, setEditable] = useState(true);
  const [version, setVersion] = useState("8s9mx7");
  const [editorContent, setEditorContent] = useState(""); // Set initial content as needed
  const [alias, setAlias] = useState(".env"); // Set initial content as needed
  const { copied, copyToClipboard } = useCopyToClipboard(); // Assuming this returns [copied, copyToClipboard]

  return (
    <CodeEditorContext.Provider
      value={{
        alias,
        copied,
        version,
        visible,
        editable,
        setAlias,
        setVisible,
        setVersion,
        setEditable,
        editorContent,
        copyToClipboard,
        setEditorContent,
      }}
    >
      {children}
    </CodeEditorContext.Provider>
  );
};
CodeEditorProvider.displayName = "CodeEditorProvider";

const CodeEditorHeader = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <CodeEditorHeader.Title />
      <div className="flex items-center gap-x-3 ml-3 text-sm">{children}</div>
    </div>
  );
};
CodeEditorHeader.displayName = "CodeEditorHeader";

const Title = () => {
  const { alias } = useCodeEditor();

  return (
    <span className="text-xl font-bold">
      {defaultKeyMapping[alias] || ".env"}
    </span>
  );
};

const Version = () => {
  const { version } = useCodeEditor();

  return (
    <div className="text-sm flex items-center">
      <GitBranch className="mr-1 w-4 h-4" strokeWidth={1.5} />
      <Link
        // TODO list versions
        href={"/new"}
        className="text-blue-400 underline underline-offset-2"
      >
        {version}
      </Link>
    </div>
  );
};

const EditToggle = () => {
  const { editable, setEditable } = useCodeEditor();
  return (
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
        <TooltipContent>Edit</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const CopyIcon = () => {
  const { copied, copyToClipboard, editorContent } = useCodeEditor();
  return (
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
        <TooltipContent>Copy</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const VisibilityToggle = () => {
  const { visible, setVisible } = useCodeEditor();
  return (
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
        <TooltipContent>Visibility</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const CompareIcon = () => {
  return (
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
  );
};

export const useCodeEditor = (): CodeEditorContextType => {
  const context = useContext(CodeEditorContext);
  if (!context) {
    throw new Error("useCodeEditor must be used within a CodeEditorProvider");
  }
  return context;
};

CodeEditorHeader.Title = Title;
CodeEditorHeader.Version = Version;
CodeEditorHeader.CopyIcon = CopyIcon;
CodeEditorHeader.EditToggle = EditToggle;
CodeEditorHeader.CompareIcon = CompareIcon;
CodeEditorHeader.VisibilityToggle = VisibilityToggle;

export { CodeEditorHeader };
