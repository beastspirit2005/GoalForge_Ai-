import { describe, it, expect, beforeEach, vi } from "vitest"
import { getLocalAuditLogs, addLocalAuditLog, initialLogs } from "./local-audit-logs"

describe("local-audit-logs security guards", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
      },
      dispatchEvent: vi.fn(),
    })
  })

  it("should deep freeze returned logs to prevent client-side mutation", () => {
    const logs = getLocalAuditLogs()
    expect(Object.isFrozen(logs)).toBe(true)
    expect(Object.isFrozen(logs[0])).toBe(true)
    expect(() => {
      (logs as any)[0].user = "Mutated User"
    }).toThrow()
  })

  it("should successfully execute a strict prepend operation", () => {
    vi.spyOn(window.localStorage, "getItem").mockReturnValue(JSON.stringify(initialLogs))
    const spySet = vi.spyOn(window.localStorage, "setItem")

    expect(() => {
      addLocalAuditLog({
        user: "Security Auditor",
        action: "security_audit_verify",
        entity: "audit_system",
        entityId: 999,
        detail: "Passed strict append-only validation.",
      })
    }).not.toThrow()

    expect(spySet).toHaveBeenCalled()
  })
})
