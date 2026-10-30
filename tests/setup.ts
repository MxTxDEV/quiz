import { vi } from "vitest";

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/funnelos_test";
process.env.APP_SECRET = "test-secret";

// server-only lança fora do bundler do Next; nos testes é um no-op
vi.mock("server-only", () => ({}));
