import { Suspense } from "react";
import TodayContainer from "@/components/checklists/TodayContainer";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function TodayPage() {
  return (
    <Suspense
      fallback={
        <LoadingSpinner
          message="Preparing today..."
          hint="Getting your planner ready."
        />
      }
    >
      <TodayContainer />
    </Suspense>
  );
}
