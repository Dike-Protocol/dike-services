type ContractMetric = {
  contractId: string;
  module: string;
  lastIndexedLedger: number;
  latestLedger: number;
  lagLedgers: number;
};

export class MetricsStore {
  private latestLedger = 0;
  private rpcFailureCount = 0;
  private reconciliationMismatchCount = 0;
  private processingFailures = 0;
  private contractMetrics = new Map<string, ContractMetric>();

  setLatestLedger(sequence: number) {
    this.latestLedger = sequence;
  }

  noteRpcFailure() {
    this.rpcFailureCount += 1;
  }

  noteProcessingFailure() {
    this.processingFailures += 1;
  }

  setReconciliationMismatchCount(count: number) {
    this.reconciliationMismatchCount = count;
  }

  setContractLag(contractId: string, module: string, lastIndexedLedger: number, latestLedger: number) {
    this.contractMetrics.set(contractId, {
      contractId,
      module,
      lastIndexedLedger,
      latestLedger,
      lagLedgers: Math.max(latestLedger - lastIndexedLedger, 0),
    });
  }

  snapshot() {
    return {
      latestLedger: this.latestLedger,
      rpcFailureCount: this.rpcFailureCount,
      reconciliationMismatchCount: this.reconciliationMismatchCount,
      processingFailures: this.processingFailures,
      contracts: [...this.contractMetrics.values()],
    };
  }
}
