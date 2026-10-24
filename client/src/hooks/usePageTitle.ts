import { useEffect } from "react";

const APP_NAME = "AmpShare";

// Sets the browser tab title: "Find Chargers | AmpShare".
// Pass no title (or undefined while loading) to show just "AmpShare".
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${APP_NAME}` : APP_NAME;
  }, [title]);
}