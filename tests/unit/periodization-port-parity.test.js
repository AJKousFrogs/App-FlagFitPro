import { describe, it, expect } from "vitest";
import { prescribeFor as clientPrescribe } from "../../angular/src/app/core/services/periodization-engine.ts";
import { prescribeFor as portPrescribe } from "../../netlify/functions/utils/periodization-engine.js";
import { CASES } from "./periodization-cases.js";

/**
 * BACKEND PORT PARITY — the server engine (netlify/functions/utils/periodization-
 * engine.js, generated from the TS source via `npm run build:periodization-engine`)
 * must produce byte-for-byte identical prescriptions to the client engine for every
 * fixture. This is the guarantee that lets the client be switched to consume the
 * server without an athlete ever seeing a different prescription.
 *
 * It is ALSO a staleness guard: if the TS engine changes and the port is not
 * regenerated, the outputs diverge and this test fails — enforcing single-source.
 */
describe("periodization backend port ⇔ client parity", () => {
  for (const c of CASES) {
    it(`port matches client for case: ${c.name}`, () => {
      const clientOut = clientPrescribe(structuredClone(c.input));
      const portOut = portPrescribe(structuredClone(c.input));
      expect(portOut.intent).toBeTruthy();
      expect(portOut).toEqual(clientOut);
    });
  }
});
