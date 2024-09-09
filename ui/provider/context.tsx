"use client";

import { create } from "zustand";

type AuthContext = {
  user: { email: string; clerkUserId: string } | null;
};

type AppContext = {
  app: { projectId: string } | null;
};

// const useAuth = create<AuthContext>((set) => ({
//   user: null,
// }));

const useApp = create<AppContext>(() => ({
  app: null,
}));

const useContext = create<AppContext /* AuthContext */>((set) => ({
  ...useApp(),
  // ...useAuth(),
}));

export default useContext;
