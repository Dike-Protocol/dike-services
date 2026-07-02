import { describe, expect, it, vi } from "vitest";
import { ReconciliationService } from "./reconciliation.js";

describe("ReconciliationService", () => {
  it("prefers direct governance reads and records persistent mismatch metrics", async () => {
    const contracts = {
      getTreasury: vi.fn().mockResolvedValue("GTREASURY"),
      getTimelock: vi.fn().mockResolvedValue("CTIMELOCK"),
      getPauseAuthority: vi.fn().mockResolvedValue("GPAUSER"),
      getFeeConfig: vi.fn().mockResolvedValue({ trading_fee_bps: 100 }),
      getModule: vi.fn().mockResolvedValue("CMODULE"),
    };
    const repository = {
      upsertGovernanceConfig: vi.fn().mockResolvedValue(undefined),
      getLatestGovernanceApprovals: vi
        .fn()
        .mockResolvedValueOnce([{ address: "GCREATOR", approved: true }])
        .mockResolvedValueOnce([{ address: "GMEMBER", approved: true }]),
      upsertGovernanceList: vi.fn().mockResolvedValue(undefined),
      upsertGovernanceModule: vi.fn().mockResolvedValue(undefined),
      getMismatchCount: vi.fn().mockResolvedValue(3),
      getPersistentMismatchCount: vi.fn().mockResolvedValue(2),
    };
    const metrics = {
      setReconciliationMismatchCount: vi.fn(),
      setPersistentReconciliationMismatchCount: vi.fn(),
    };
    const logger = {
      warn: vi.fn(),
      debug: vi.fn(),
    };

    const service = new ReconciliationService(
      {
        data: {
          network: "testnet",
          contracts: {
            dike_governance: "CGOV",
            market_factory: "CFACTORY",
            council_of_dike: "CCOUNCIL",
            dike_timelock: "CTIMELOCK",
          },
        },
      } as never,
      contracts as never,
      repository as never,
      logger as never,
      metrics as never,
    );

    await service.reconcileGovernance(123);

    expect(repository.upsertGovernanceConfig).toHaveBeenCalledWith(
      "testnet",
      expect.objectContaining({
        treasury: "GTREASURY",
        timelock: "CTIMELOCK",
        pause_authority: "GPAUSER",
      }),
    );
    expect(metrics.setReconciliationMismatchCount).toHaveBeenCalledWith(3);
    expect(metrics.setPersistentReconciliationMismatchCount).toHaveBeenCalledWith(2);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ persistentMismatchCount: 2, latestLedger: 123 }),
      "Reconciliation mismatches have persisted across at least two passes",
    );
  });
});
