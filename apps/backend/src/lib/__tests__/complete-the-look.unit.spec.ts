import { discountedPrice, findLookProblems, readDiscountSettings } from "../complete-the-look"

describe("Complete the Look", () => {
  const main = { id: "l1", title: "Kurti", quantity: 1, metadata: { set_key: "s1", set_role: "main" } }
  const piece = { id: "l2", title: "Dupatta", quantity: 1, metadata: { set_key: "s1", set_role: "dupatta", set_of: "prod_k" } }

  it("accepts a kurti with its pieces", () => {
    expect(findLookProblems([main, piece])).toEqual([])
  })
  it("rejects pieces without their kurti", () => {
    expect(findLookProblems([piece])).toHaveLength(1)
  })
  it("rejects more pieces than kurtis", () => {
    expect(findLookProblems([main, { ...piece, quantity: 2 }])).toHaveLength(1)
  })
  it("rejects a set-only piece bought on its own", () => {
    expect(findLookProblems([{ id: "l3", quantity: 1, metadata: {}, product: { metadata: { set_only: true } } }])).toHaveLength(1)
  })
  it("applies the discount only when the store and the kurti both allow it", () => {
    const store = { ctl_discount_enabled: "true", ctl_discount_type: "percentage", ctl_discount_value: 10 }
    expect(readDiscountSettings(store, { ctl_discount_enabled: true }).enabled).toBe(true)
    expect(readDiscountSettings(store, {}).enabled).toBe(false)
    expect(readDiscountSettings({ ...store, ctl_discount_enabled: "false" }, { ctl_discount_enabled: true }).enabled).toBe(false)
  })
  it("calculates percentage and fixed discounts without going below zero", () => {
    expect(discountedPrice(1000, { enabled: true, type: "percentage", value: 10 })).toBe(900)
    expect(discountedPrice(100, { enabled: true, type: "fixed", value: 150 })).toBe(0)
    expect(discountedPrice(1000, { enabled: false, type: "fixed", value: 150 })).toBe(1000)
  })
})
