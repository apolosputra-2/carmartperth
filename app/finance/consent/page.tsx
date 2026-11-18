
import { Suspense } from "react";
import ConsentClient from "./ConsentClient";

export default function ConsentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p>Loading consent form...</p>
        </div>
      }
    >
      <ConsentClient />
    </Suspense>
  );
}
