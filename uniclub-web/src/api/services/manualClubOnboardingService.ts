import type { ManualClubOnboardingDraft } from "../../types";

const MANUAL_CLUB_ONBOARDING_KEY = "uniclub.manualClubOnboarding";

export function saveManualClubOnboardingDraft(draft: ManualClubOnboardingDraft): void {
  window.localStorage.setItem(MANUAL_CLUB_ONBOARDING_KEY, JSON.stringify(draft));
}

export function getManualClubOnboardingDraft(): ManualClubOnboardingDraft | null {
  const raw = window.localStorage.getItem(MANUAL_CLUB_ONBOARDING_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ManualClubOnboardingDraft;
  } catch {
    return null;
  }
}

export function clearManualClubOnboardingDraft(): void {
  window.localStorage.removeItem(MANUAL_CLUB_ONBOARDING_KEY);
}
