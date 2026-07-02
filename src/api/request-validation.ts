type QueryScalar = string | number | boolean;
const STELLAR_ADDRESS_REGEX = /^[A-Z2-7]{56}$/;
const COUNCIL_CASE_STATUSES = new Set([
  "Opened",
  "CommitPhase",
  "RevealPhase",
  "ReadyToFinalize",
  "Finalized",
  "Cancelled",
]);

export class RequestValidationError extends Error {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = "RequestValidationError";
  }
}

function queryScalar(value: unknown, field: string): QueryScalar | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (Array.isArray(value)) {
    throw new RequestValidationError(`${field} must be provided once`);
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  throw new RequestValidationError(`${field} must be a scalar value`);
}

function queryString(value: unknown, field: string): string | undefined {
  const scalar = queryScalar(value, field);
  return scalar === undefined ? undefined : String(scalar);
}

function integerValue(
  value: unknown,
  field: string,
  options: {
    min: number;
    max?: number;
    defaultValue?: number;
  },
) {
  const scalar = queryScalar(value, field);
  if (scalar === undefined) {
    return options.defaultValue;
  }

  const text = String(scalar);
  if (!/^\d+$/.test(text)) {
    throw new RequestValidationError(`${field} must be an integer`);
  }

  const parsed = Number(text);
  if (!Number.isSafeInteger(parsed) || parsed < options.min) {
    throw new RequestValidationError(`${field} must be at least ${options.min}`);
  }
  if (options.max !== undefined && parsed > options.max) {
    throw new RequestValidationError(`${field} must be at most ${options.max}`);
  }

  return parsed;
}

export function parseMarketId(value: unknown) {
  const parsed = integerValue(value, "id", {
    min: 0,
  });
  if (parsed === undefined) {
    throw new RequestValidationError("id is required");
  }
  return parsed;
}

export function parseAddress(value: unknown, field: string) {
  if (typeof value !== "string") {
    throw new RequestValidationError(`${field} must be a string`);
  }
  const normalized = value.trim().toUpperCase();
  if (!STELLAR_ADDRESS_REGEX.test(normalized)) {
    throw new RequestValidationError(`${field} must be a valid Stellar address`);
  }
  return normalized;
}

export function parseCouncilCaseStatus(value: unknown) {
  const status = queryString(value, "status");
  if (status === undefined) {
    return undefined;
  }
  if (!COUNCIL_CASE_STATUSES.has(status)) {
    throw new RequestValidationError("status must be a valid council case status");
  }
  return status;
}

export function parseMarketListQuery(query: unknown) {
  const record = query && typeof query === "object" ? query as Record<string, unknown> : {};
  const limit = integerValue(record.limit, "limit", {
    min: 1,
    max: 100,
    defaultValue: 20,
  });
  const cursor = integerValue(record.cursor, "cursor", {
    min: 0,
  });

  return {
    status: queryString(record.status, "status"),
    creator: queryString(record.creator, "creator"),
    collateral: queryString(record.collateral, "collateral"),
    limit: limit ?? 20,
    ...(cursor === undefined ? {} : { cursor }),
  };
}
