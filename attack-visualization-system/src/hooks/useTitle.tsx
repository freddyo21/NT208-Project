import { useEffect } from "react";

/**
 * Sets the document title. Always prepends {{appName}}.
 * 
 * @param subTitle Optional sub-title for the current page.
 * 
 * Usage:
 * 
 * `useTitle()` - "Attack Visualization System"
 *   
 * `useTitle("Home")` - "Attack Visualization System | Home"
 */
export const useTitle = (subTitle?: string) => {
  useEffect(() => {
    const baseTitle = "Attack Visualization System";
    if (subTitle && subTitle.trim() !== "") {
      document.title = `${baseTitle} | ${subTitle}`;
    } else {
      document.title = baseTitle;
    }
  }, [subTitle]);
};