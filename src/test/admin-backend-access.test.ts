import { describe, it, expect, vi } from "vitest";
import { assertStoredAdmin } from "../../supabase/functions/_shared/adminAccess";

describe("Stored administrator authorization", () => {
  it("rejects unauthenticated privileged execution with 403 before role queries", async () => {
    const check = vi.fn().mockResolvedValue(true);
    await expect(assertStoredAdmin(null, check)).rejects.toMatchObject({ status: 403 });
    expect(check).not.toHaveBeenCalled();
  });
  it("rejects a standard user with 403", async () => {
    await expect(assertStoredAdmin("standard", async () => false)).rejects.toMatchObject({ status: 403 });
  });
  it("permits a stored administrator", async () => {
    const check = vi.fn().mockResolvedValue(true);
    await expect(assertStoredAdmin("admin", check)).resolves.toBeUndefined();
    expect(check).toHaveBeenCalledWith("admin");
  });
  it("does not authorize when database role verification fails", async () => {
    await expect(assertStoredAdmin("admin", async () => { throw new Error("Database unavailable"); })).rejects.toThrow();
  });
});