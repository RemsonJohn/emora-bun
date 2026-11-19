import Razorpay from "razorpay"
import { validatePaymentVerification, validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils"
import {
  AbstractPaymentProvider,
  BigNumber,
  MedusaError,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  BigNumberInput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  Logger,
  PaymentSessionStatus as PaymentSessionStatusType,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"

export type RazorpayOptions = {
  key_id: string
  key_secret: string
  webhook_secret?: string
}

/** Session data kept by Medusa. Only `client` is written by the storefront and is untrusted. */
type SessionData = {
  razorpay_order_id?: string
  razorpay_payment_id?: string
  amount?: number
  currency?: string
  key_id?: string
  client?: {
    razorpay_payment_id?: unknown
    razorpay_order_id?: unknown
    razorpay_signature?: unknown
  }
}

/** Medusa amounts are major units (rupees); Razorpay uses the smallest unit (paise). */
export function toMinorUnits(amount: BigNumberInput): number {
  return Math.round(new BigNumber(amount).numeric * 100)
}

/** Maps a Razorpay payment status to a Medusa payment session status. */
export function mapPaymentStatus(status: string | undefined): PaymentSessionStatusType {
  switch (status) {
    case "captured":
      return PaymentSessionStatus.CAPTURED
    case "authorized":
      return PaymentSessionStatus.AUTHORIZED
    case "failed":
      return PaymentSessionStatus.ERROR
    case "refunded":
      return PaymentSessionStatus.CANCELED
    default:
      return PaymentSessionStatus.PENDING
  }
}

class RazorpayProviderService extends AbstractPaymentProvider<RazorpayOptions> {
  static identifier = "razorpay"

  protected readonly options_: RazorpayOptions
  protected readonly client_: Razorpay
  protected readonly logger_: Logger

  static validateOptions(options: Record<string, unknown>) {
    if (!options.key_id || !options.key_secret) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Razorpay key_id and key_secret are required")
    }
  }

  constructor(cradle: Record<string, unknown>, options: RazorpayOptions) {
    super(cradle, options)
    this.options_ = options
    this.logger_ = cradle.logger as Logger
    this.client_ = new Razorpay({ key_id: options.key_id, key_secret: options.key_secret })
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const sessionId = String(input.data?.session_id ?? "")
    const currency = input.currency_code.toUpperCase()
    const amount = toMinorUnits(input.amount)
    const order = await this.client_.orders.create({
      amount,
      currency,
      // The receipt links Razorpay's order back to this Medusa payment session (max 40 chars).
      receipt: sessionId.slice(0, 40),
      notes: { session_id: sessionId },
    })
    return {
      id: order.id,
      data: {
        razorpay_order_id: order.id,
        amount,
        currency,
        // The key id is public and needed by Razorpay Checkout in the browser.
        key_id: this.options_.key_id,
      },
    }
  }

  /**
   * Called when the cart is completed. The storefront has sent the Checkout
   * response into `data.client`; it is verified against the server-side order
   * id with the key secret, then the payment is fetched from Razorpay.
   */
  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const data = (input.data ?? {}) as SessionData
    const orderId = data.razorpay_order_id
    const client = data.client ?? {}
    const paymentId = typeof client.razorpay_payment_id === "string" ? client.razorpay_payment_id : ""
    const signature = typeof client.razorpay_signature === "string" ? client.razorpay_signature : ""

    if (!orderId || !paymentId || !signature) {
      return { status: PaymentSessionStatus.PENDING, data: input.data ?? {} }
    }

    const verified = validatePaymentVerification(
      { order_id: orderId, payment_id: paymentId },
      signature,
      this.options_.key_secret
    )
    if (!verified) {
      this.logger_.warn(`Razorpay signature mismatch for order ${orderId}`)
      return { status: PaymentSessionStatus.ERROR, data: input.data ?? {} }
    }

    const payment = await this.client_.payments.fetch(paymentId)
    if (payment.order_id !== orderId || Number(payment.amount) !== Number(data.amount)) {
      this.logger_.warn(`Razorpay payment ${paymentId} does not match order ${orderId}`)
      return { status: PaymentSessionStatus.ERROR, data: input.data ?? {} }
    }

    return {
      status: mapPaymentStatus(payment.status),
      data: { ...data, razorpay_payment_id: paymentId, razorpay_status: payment.status },
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const data = (input.data ?? {}) as SessionData & { razorpay_status?: string }
    if (!data.razorpay_payment_id) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "No Razorpay payment to capture")
    }
    const current = await this.client_.payments.fetch(data.razorpay_payment_id)
    if (current.status === "captured") {
      return { data: { ...data, razorpay_status: "captured" } }
    }
    const captured = await this.client_.payments.capture(
      data.razorpay_payment_id,
      Number(data.amount),
      String(data.currency ?? "INR")
    )
    return { data: { ...data, razorpay_status: captured.status } }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const data = (input.data ?? {}) as SessionData
    if (!data.razorpay_payment_id) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "No Razorpay payment to refund")
    }
    const refund = await this.client_.payments.refund(data.razorpay_payment_id, {
      amount: toMinorUnits(input.amount),
    })
    return { data: { ...data, last_refund_id: refund.id } }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    // Razorpay orders cannot be cancelled; uncaptured payments are released automatically.
    return { data: input.data ?? {} }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data ?? {} }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const data = (input.data ?? {}) as SessionData
    if (!data.razorpay_payment_id) {
      return { status: PaymentSessionStatus.PENDING }
    }
    const payment = await this.client_.payments.fetch(data.razorpay_payment_id)
    return { status: mapPaymentStatus(payment.status) }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const data = (input.data ?? {}) as SessionData
    if (!data.razorpay_payment_id) {
      return { data: input.data ?? {} }
    }
    const payment = await this.client_.payments.fetch(data.razorpay_payment_id)
    return { data: { ...data, razorpay_status: payment.status } }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    // The amount changed (cart edited): a Razorpay order's amount is fixed, so create a new one.
    const data = (input.data ?? {}) as SessionData
    const amount = toMinorUnits(input.amount)
    if (data.razorpay_order_id && data.amount === amount) {
      return { data: input.data ?? {} }
    }
    const created = await this.initiatePayment({
      amount: input.amount,
      currency_code: input.currency_code,
      data: input.data,
      context: input.context,
    })
    // Clear any checkout response that belonged to the previous order.
    return { data: { ...created.data, client: null } }
  }

  async getWebhookActionAndData(payload: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
    const secret = this.options_.webhook_secret
    const signature = String(payload.headers["x-razorpay-signature"] ?? "")
    const raw = Buffer.isBuffer(payload.rawData) ? payload.rawData.toString("utf8") : String(payload.rawData ?? "")
    if (!secret || !signature || !validateWebhookSignature(raw, signature, secret)) {
      this.logger_.warn("Rejected a Razorpay webhook with a missing or invalid signature")
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const event = payload.data as {
      event?: string
      payload?: { payment?: { entity?: { order_id?: string; amount?: number } } }
    }
    const entity = event.payload?.payment?.entity
    if (!entity?.order_id) {
      return { action: PaymentActions.NOT_SUPPORTED }
    }
    // The session id is read from the Razorpay order we created, not from the webhook body.
    const order = await this.client_.orders.fetch(entity.order_id)
    const sessionId = String(order.notes?.session_id ?? order.receipt ?? "")
    if (!sessionId) {
      return { action: PaymentActions.NOT_SUPPORTED }
    }
    const amount = new BigNumber(Number(entity.amount ?? 0) / 100)

    switch (event.event) {
      case "payment.authorized":
        return { action: PaymentActions.AUTHORIZED, data: { session_id: sessionId, amount } }
      case "payment.captured":
      case "order.paid":
        return { action: PaymentActions.SUCCESSFUL, data: { session_id: sessionId, amount } }
      case "payment.failed":
        return { action: PaymentActions.FAILED, data: { session_id: sessionId, amount } }
      default:
        return { action: PaymentActions.NOT_SUPPORTED }
    }
  }
}

export default RazorpayProviderService
