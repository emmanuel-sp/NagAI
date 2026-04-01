import { Suspense } from "react";
import TodayContainer from "@/components/checklists/TodayContainer";

export default function TodayPage() {
  return (
    <Suspense fallback={null}>
      <TodayContainer />
    </Suspense>
  );
}
