import { describe, it, expect } from "vitest";
import { toSftJsonl, toDpoJsonl, type StagedPair } from "@/lib/curation";

const base = { reasons: [], source_kind: "message", prompt: "Q" };
const rows: StagedPair[] = [
  { ...base, id: "1", track: "sft", status: "approved", chosen: "A", rejected: null },
  { ...base, id: "2", track: "sft", status: "pending_review", chosen: "B", rejected: null },
  { ...base, id: "3", track: "dpo", status: "approved", chosen: "good", rejected: "bad" },
  { ...base, id: "4", track: "dpo", status: "approved", chosen: null, rejected: "bad" },
];

describe("dataset export", () => {
  it("exports only approved SFT pairs in messages schema", () => {
    const lines = toSftJsonl(rows).split("\n");
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0]).messages.map((m: { role: string }) => m.role)).toEqual(["system", "user", "assistant"]);
  });
  it("exports only complete approved DPO pairs", () => {
    const lines = toDpoJsonl(rows).split("\n");
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0])).toMatchObject({ prompt: "Q", chosen: "good", rejected: "bad" });
  });
});
