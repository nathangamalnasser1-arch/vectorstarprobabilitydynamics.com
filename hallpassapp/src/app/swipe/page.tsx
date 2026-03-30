import { SwipeDiscoverHeader } from "@/components/billing/SwipeDiscoverHeader";
import { SwipeClient } from "./swipe-client";

export default function SwipePage() {
  return (
    <div className="flex flex-1 flex-col items-center px-4 py-10 sm:px-8">
      <SwipeDiscoverHeader />
      <SwipeClient />
    </div>
  );
}
