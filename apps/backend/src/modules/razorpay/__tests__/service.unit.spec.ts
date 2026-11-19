import crypto from "crypto"
import RazorpayProviderService, { mapPaymentStatus, toMinorUnits } from "../service"

const secret = "test_secret"
const webhookSecret = "hook_secret"
const sign = (body: string, key: string) => crypto.createHmac("sha256", key).update(body).digest("hex")

function provider(payment: Record<string, unknown> = {}, order: Record<string, unknown> = {}) {
  const service = new RazorpayProviderService(
    { logger: { warn: jest.fn(), info: jest.fn() } },
    { key_id: "rzp_test_key", key_secret: secret, webhook_secret: webhookSecret }
  )
  ;(service as unknown as { client_: unknown }).client_ = {
    payments: { fetch: jest.fn(async () => payment) },
    orders: { fetch: jest.fn(async () => order), create: jest.fn() },
  }
  return service
}

describe("Razorpay provider", () => {
  it("converts rupees to paise", () => {
    expect(toMinorUnits(799)).toBe(79900)
    expect(toMinorUnits(10.5)).toBe(1050)
  })

  it("maps Razorpay statuses", () => {
    expect(mapPaymentStatus("captured")).toBe("captured")
    expect(mapPaymentStatus("authorized")).toBe("authorized")
    expect(mapPaymentStatus("failed")).toBe("error")
    expect(mapPaymentStatus("created")).toBe("pending")
  })

  it("stays pending until the checkout response arrives", async () => {
    const result = await provider().authorizePayment({ data: { razorpay_order_id: "order_1", amount: 79900 } } as never)
    expect(result.status).toBe("pending")
  })

  it("rejects a forged signature", async () => {
    const result = await provider({ status: "captured", order_id: "order_1", amount: 79900 }).authorizePayment({
      data: {
        razorpay_order_id: "order_1",
        amount: 79900,
        client: { razorpay_payment_id: "pay_1", razorpay_signature: sign("order_1|pay_1", "wrong") },
      },
    } as never)
    expect(result.status).toBe("error")
  })

  it("verifies the signature against the server's order id and checks the amount", async () => {
    const data = {
      razorpay_order_id: "order_1",
      amount: 79900,
      client: { razorpay_payment_id: "pay_1", razorpay_signature: sign("order_1|pay_1", secret) },
    }
    const ok = await provider({ status: "captured", order_id: "order_1", amount: 79900 }).authorizePayment({ data } as never)
    expect(ok.status).toBe("captured")
    const wrongAmount = await provider({ status: "captured", order_id: "order_1", amount: 100 }).authorizePayment({ data } as never)
    expect(wrongAmount.status).toBe("error")
  })

  it("accepts only signed webhooks and takes the session from Razorpay's order", async () => {
    const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { order_id: "order_1", amount: 79900 } } } })
    const service = provider({}, { notes: { session_id: "payses_1" }, receipt: "payses_1" })
    const unsigned = await service.getWebhookActionAndData({ data: JSON.parse(body), rawData: body, headers: {} })
    expect(unsigned.action).toBe("not_supported")
    const signed = await service.getWebhookActionAndData({
      data: JSON.parse(body),
      rawData: body,
      headers: { "x-razorpay-signature": sign(body, webhookSecret) },
    })
    expect(signed.action).toBe("captured")
    expect(signed.data?.session_id).toBe("payses_1")
  })
})
