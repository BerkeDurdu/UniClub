import type { UserRole } from "../types";

export type AppSection =
  | "clubs_manage"
  | "budgets"
  | "sponsorships"
  | "registrations_manage"
  | "participants_manage"
  | "venues_manage"
  | "board_manage";

export type AppAction =
  | "create_club"
  | "update_club"
  | "create_event"
  | "update_event"
  | "delete_event"
  | "create_advisor"
  | "create_venue"
  | "create_budget"
  | "create_sponsorship"
  | "self_register_event"
  | "register_other_member"
  | "add_external_participant"
  | "add_quick_tag"
  | "add_metadata_label"
  | "edit_event_metadata";

const sectionPermissions: Record<AppSection, UserRole[]> = {
  clubs_manage: ["advisor", "board_member"],
  budgets: ["advisor", "board_member"],
  sponsorships: ["advisor", "board_member"],
  registrations_manage: ["advisor", "board_member"],
  participants_manage: ["advisor", "board_member"],
  venues_manage: ["advisor", "board_member"],
  board_manage: ["advisor", "board_member"],
};

const actionPermissions: Record<AppAction, UserRole[]> = {
  create_club: ["advisor", "board_member"],
  update_club: ["advisor", "board_member"],
  create_event: ["advisor", "board_member"],
  update_event: ["advisor", "board_member"],
  delete_event: ["advisor", "board_member"],
  create_advisor: ["advisor", "board_member"],
  create_venue: ["advisor", "board_member"],
  create_budget: ["advisor", "board_member"],
  create_sponsorship: ["advisor", "board_member"],
  self_register_event: ["member", "advisor", "board_member"],
  register_other_member: ["advisor", "board_member"],
  add_external_participant: ["advisor", "board_member"],
  add_quick_tag: ["advisor", "board_member"],
  add_metadata_label: ["advisor", "board_member"],
  edit_event_metadata: ["advisor", "board_member"],
};

export function canViewSection(role: UserRole | null | undefined, section: AppSection): boolean {
  if (!role) {
    return false;
  }
  return sectionPermissions[section].includes(role);
}

export function canPerformAction(role: UserRole | null | undefined, action: AppAction): boolean {
  if (!role) {
    return false;
  }
  return actionPermissions[action].includes(role);
}

export function isMember(role: UserRole | null | undefined): boolean {
  return role === "member";
}

export function isStaffRole(role: UserRole | null | undefined): boolean {
  return role === "advisor" || role === "board_member";
}

export function isSameClub(
  userClubId: number | null | undefined,
  resourceClubId: number | null | undefined,
): boolean {
  if (typeof userClubId !== "number") {
    return false;
  }
  if (typeof resourceClubId !== "number") {
    return false;
  }
  return userClubId === resourceClubId;
}

export function canManageClubResource(
  role: UserRole | null | undefined,
  userClubId: number | null | undefined,
  resourceClubId: number | null | undefined,
): boolean {
  if (!isStaffRole(role)) {
    return false;
  }
  return isSameClub(userClubId, resourceClubId);
}
