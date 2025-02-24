import { useState } from "react";
import { UserStatus } from "../types/types";

export function useUserStatus() {
  const [isOpen, setIsOpen] = useState(false);
  const [userStatus, setUserStatus] = useState<UserStatus>("online");

  return { isOpen, setIsOpen, userStatus, setUserStatus };
}
