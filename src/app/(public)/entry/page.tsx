"use client";

import { Suspense } from "react";
import PublicIssueEntryPageContent from "./PublicIssueEntryPageContent";

export default function PublicIssueEntryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PublicIssueEntryPageContent />
    </Suspense>
  );
}
