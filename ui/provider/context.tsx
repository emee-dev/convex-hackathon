"use client";

import { create } from "zustand";

type AppContext = {
  app: { projectId: string | null };
};

const useApp = create<AppContext>(() => ({
  app: { projectId: null },
}));

const useAppContext = create<AppContext>((set) => ({
  ...useApp(),
}));

export default useAppContext;
