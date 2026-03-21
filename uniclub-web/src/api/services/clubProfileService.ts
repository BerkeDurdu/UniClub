import type { ClubLocalProfile } from "../../types";

const CLUB_PROFILE_KEY = "uniclub.club.profiles";

type ClubProfileMap = Record<number, ClubLocalProfile>;

function readMap(): ClubProfileMap {
  const raw = window.localStorage.getItem(CLUB_PROFILE_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as ClubProfileMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map: ClubProfileMap): void {
  window.localStorage.setItem(CLUB_PROFILE_KEY, JSON.stringify(map));
}

export function getClubLocalProfile(clubId: number): ClubLocalProfile {
  const map = readMap();
  return map[clubId] ?? {};
}

export function upsertClubLocalProfile(clubId: number, payload: Partial<ClubLocalProfile>): ClubLocalProfile {
  const map = readMap();
  const merged: ClubLocalProfile = {
    ...(map[clubId] ?? {}),
    ...payload,
  };
  map[clubId] = merged;
  writeMap(map);
  return merged;
}
