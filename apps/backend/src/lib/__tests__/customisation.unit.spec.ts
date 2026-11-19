import { storeLineItemMetadataSchema } from "../customisation"

describe("line item customisation", () => {
  it("accepts a version 1 customisation", () => {
    const result = storeLineItemMetadataSchema.safeParse({
      customisation: { version: 1, team_name: "Chavakkad FC", player_number: "10", primary_colour: "#E31E24" },
    })
    expect(result.success).toBe(true)
  })
  it("rejects reserved Complete the Look keys and unknown fields", () => {
    expect(storeLineItemMetadataSchema.safeParse({ set_key: "x" }).success).toBe(false)
    expect(storeLineItemMetadataSchema.safeParse({ customisation: { version: 1, price: 1 } }).success).toBe(false)
  })
  it("limits lengths and formats", () => {
    expect(storeLineItemMetadataSchema.safeParse({ customisation: { version: 1, player_number: "1000" } }).success).toBe(false)
    expect(storeLineItemMetadataSchema.safeParse({ customisation: { version: 1, team_name: "x".repeat(41) } }).success).toBe(false)
  })
})
