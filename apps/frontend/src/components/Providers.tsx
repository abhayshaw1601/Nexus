"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode, createContext, useContext, useEffect, useState } from "react";

export const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
};
