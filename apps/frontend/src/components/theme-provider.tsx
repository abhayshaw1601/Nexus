"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: React.PropsWithChildren<Omit<ThemeProviderProps, 'children'>>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
