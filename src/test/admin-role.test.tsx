import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: { user: null as { id: string } | null, loading: true }, query: vi.fn() }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => mocks.auth }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: mocks.query }) }) }) }) } }));
import { useAdminRole } from "@/hooks/useAdminRole";
describe("Administrator session resolution", () => {
  beforeEach(() => { mocks.auth = { user: null, loading: true }; mocks.query.mockReset(); });
  it("keeps access pending until the signed-in role is verified", async () => {
    let resolve: (value: unknown) => void = () => {};
    mocks.query.mockReturnValue(new Promise(r => { resolve = r; }));
    const { result, rerender } = renderHook(() => useAdminRole());
    expect(result.current.loading).toBe(true);
    mocks.auth = { user: { id: "admin" }, loading: false }; rerender();
    expect(result.current.loading).toBe(true);
    expect(result.current.isAdmin).toBe(false);
    await act(async () => { resolve({ data: { role: "admin" }, error: null }); });
    await waitFor(() => expect(result.current.isAdmin).toBe(true));
    expect(result.current.loading).toBe(false);
  });
  it("does not carry administrator privileges into a different account", async () => {
    mocks.auth = { user: { id: "admin" }, loading: false };
    mocks.query.mockResolvedValue({ data: { role: "admin" }, error: null });
    const { result, rerender } = renderHook(() => useAdminRole());
    await waitFor(() => expect(result.current.isAdmin).toBe(true));
    mocks.auth = { user: { id: "ordinary-user" }, loading: false };
    mocks.query.mockReturnValue(new Promise(() => {})); rerender();
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.loading).toBe(true);
  });
});