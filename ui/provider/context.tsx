"use client";

import { create } from "zustand";

type AppContext = {
  app: { projectId: string } | null;
};

const useApp = create<AppContext>(() => ({
  app: null,
}));

const useAppContext = create<AppContext /* AuthContext */>((set) => ({
  ...useApp(),
}));

export default useAppContext;
