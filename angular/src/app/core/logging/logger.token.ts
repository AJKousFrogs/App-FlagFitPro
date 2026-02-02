import { InjectionToken } from "@angular/core";
import type { Logger } from "./logger";

export const LOGGER = new InjectionToken<Logger>("LOGGER");
