import type { Metadata } from "next"
import { PolicyPage } from "@modules/policies/templates"

export const metadata: Metadata = { title: "Contact | Sagar Sports", description: "Contact Sagar Sports about orders or teamwear." }

export default function ContactPage() {
  const email = process.env.NEXT_PUBLIC_STORE_CONTACT_EMAIL
  const validEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  return <PolicyPage title="Contact Sagar Sports"><p>Have a question about an order or looking for teamwear? We’d love to hear from you.</p>{validEmail ? <p>Email <a className="underline underline-offset-4" href={`mailto:${email}`}>{email}</a>. For an existing order, please include your order number.</p> : <p>Contact details are being updated. Please check back soon.</p>}</PolicyPage>
}
