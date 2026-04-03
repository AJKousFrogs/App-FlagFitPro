import { of } from "rxjs";
import { vi } from "vitest";

import { mockProgramAssignment } from "../../../../test/mock-data/program-assignment.mock";

export const mockPlayerProgramService = () => ({
  getMyProgramAssignment: vi
    .fn()
    .mockReturnValue(of(mockProgramAssignment)),
  assignMyProgram: vi.fn().mockReturnValue(of({ assignment: mockProgramAssignment })),
  switchProgram: vi.fn().mockReturnValue(of({ success: true })),
});
