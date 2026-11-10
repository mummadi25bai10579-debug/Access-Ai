import React from "react";
import { FullScreenLoader } from "@/components/ui/FullScreenLoader";

export default function RootLoading() {
  return (
    <FullScreenLoader
      label="Loading AccessAI Platform..."
      subLabel="Synchronizing accessible resources and multi-tenant domain context"
    />
  );
}
