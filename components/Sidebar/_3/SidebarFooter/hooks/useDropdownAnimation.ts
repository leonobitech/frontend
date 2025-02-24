import { useEffect, useState, RefObject } from "react";

/**
 * Custom hook for calculating animation-related values for the dropdown menu.
 *
 * @param isOpen - Boolean indicating whether the dropdown is open or closed
 * @param avatarSmallRef - Ref object pointing to the small avatar DOM element
 * @returns Object containing the calculated position of the small avatar and the window width
 */
export function useDropdownAnimation(
  isOpen: boolean,
  avatarRef: RefObject<HTMLDivElement>
) {
  // State to store the position of the small avatar
  const [avatarPosition, setAvatarPosition] = useState({
    x: 0,
    y: 0,
  });
  // State to store the current window width
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    /**
     * Updates the position of the small avatar and the window width.
     * This function is called on mount, when isOpen changes, and on window resize.
     */
    const updatePositions = () => {
      // Calculate the position of the small avatar if the ref is available
      if (avatarRef.current) {
        const rect = avatarRef.current.getBoundingClientRect();
        // Set the position to the center of the avatar
        setAvatarPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      }
      // Update the window width
      setWindowWidth(window.innerWidth);
    };

    // Call updatePositions immediately to set initial values
    updatePositions();

    // Add event listener for window resize
    window.addEventListener("resize", updatePositions);

    // Cleanup function to remove the event listener
    return () => window.removeEventListener("resize", updatePositions);
  }, [isOpen, avatarRef]); // Re-run effect when isOpen or avatarSmallRef changes

  // Return the calculated values
  return { avatarPosition, windowWidth };
}
