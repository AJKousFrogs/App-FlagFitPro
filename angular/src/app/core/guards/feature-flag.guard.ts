import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { FeatureFlagsService } from "../services/feature-flags.service";

export function featureFlagGuard(
  flagAccessor: (flags: FeatureFlagsService) => boolean,
  redirectTo = "/todays-practice",
): CanActivateFn {
  return (_route, state) => {
    const featureFlags = inject(FeatureFlagsService);
    const router = inject(Router);

    if (flagAccessor(featureFlags)) {
      return true;
    }

    return router.createUrlTree([redirectTo], {
      queryParams: { returnUrl: state.url },
    });
  };
}

export const nextGenMetricsGuard: CanActivateFn = featureFlagGuard(
  (flags) => flags.nextGenMetricsPreview(),
);
