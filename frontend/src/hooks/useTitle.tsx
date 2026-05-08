import { useEffect } from "react";

/**
 * Sets the document title. Always prepends {{appName}}.
 * 
 * @param subTitle Optional sub-title for the current page.
 * 
 * Usage:
 * 
 * `useTitle()` - "Sentinel ATK-VIG 3.1"
 *   
 * `useTitle("Home")` - "Sentinel ATK-VIG 3.1 | Home"
 */
export const useTitle = (subTitle?: string) => {
  useEffect(() => {
    const baseTitle = "Sentinel ATK-VIG 3.1";
    if (subTitle && subTitle.trim() !== "") {
      document.title = `${baseTitle} | ${subTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, [subTitle]);
};