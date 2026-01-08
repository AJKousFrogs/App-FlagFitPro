import { inject } from "@angular/core";
import { Router, CanActivateFn } from "@angular/router";
import { ProfileCompletionService } from "../services/profile-completion.service";

/**
 * Guard that restricts access to female athletes only.
 * Used for features like cycle tracking.
 *
 * If the user is not female or gender is not set, redirects to wellness page.
 */
export const femaleAthleteGuard: CanActivateFn = async () => {
  const profileService = inject(ProfileCompletionService);
  const router = inject(Router);

  // Ensure profile data is loaded
  await profileService.loadProfileData();

  // Check if user is female
  if (profileService.isFemale()) {
    return true;
  }

  // Redirect non-female users to wellness page
  router.navigate(["/wellness"]);
  return false;
};
