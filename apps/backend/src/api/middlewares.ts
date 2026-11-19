import { configureStoreSearch, defineMiddlewares, validateAndTransformBody } from '@medusajs/framework/http'
import { staffAccessGuard } from '../access-control/guard'
import { rateLimit } from '../lib/rate-limit'
import { validateLineItemMetadata } from './store/line-item-metadata'
import { AddLookSchema, CreateEnquirySchema } from './store/validators'
import { UpdateEnquirySchema } from './admin/enquiries/validators'
import { verifyPlatformRequest } from './platform/verify-platform-request'
import { OwnerInviteSchema, UpdateFeaturesSchema } from './platform/validators'
import { requireFeature } from '../lib/require-feature'

// The product index declares filterable `status` and `sales_channel_ids`, so
// the route narrows it to published products in the key's sales channels.
export default defineMiddlewares({
  routes: [
    { matcher: '/admin*', middlewares: [staffAccessGuard] },
    {
      method: ['POST'],
      matcher: '/store/search',
      middlewares: [
        configureStoreSearch({
          allowed_indexes: {
            product: true,
          },
        }),
      ],
    },
    // Customer login, registration and password reset.
    {
      method: ['POST'],
      matcher: '/auth/customer/*',
      middlewares: [rateLimit({ name: 'customer-auth', limit: 10, windowSeconds: 60 })],
    },
    {
      method: ['POST'],
      matcher: '/store/customers',
      middlewares: [rateLimit({ name: 'customer-signup', limit: 10, windowSeconds: 600 })],
    },
    {
      method: ['POST'],
      matcher: '/store/carts/:id/complete',
      middlewares: [rateLimit({ name: 'checkout', limit: 10, windowSeconds: 60 })],
    },
    {
      method: ['POST'],
      matcher: '/store/carts/:id/line-items',
      middlewares: [validateLineItemMetadata],
    },
    {
      method: ['POST'],
      matcher: '/store/carts/:id/line-items/:line_id',
      middlewares: [validateLineItemMetadata],
    },
    {
      method: ['POST'],
      matcher: '/store/carts/:id/looks',
      middlewares: [
        rateLimit({ name: 'add-look', limit: 30, windowSeconds: 60 }),
        requireFeature('complete_the_look'),
        validateAndTransformBody(AddLookSchema),
      ],
    },
    {
      method: ['POST'],
      matcher: '/store/enquiries',
      middlewares: [
        rateLimit({ name: 'enquiry', limit: 5, windowSeconds: 600 }),
        requireFeature('bulk_orders'),
        validateAndTransformBody(CreateEnquirySchema),
      ],
    },
    {
      method: ['POST'],
      matcher: '/admin/enquiries/:id',
      middlewares: [validateAndTransformBody(UpdateEnquirySchema)],
    },
    // Emora platform access: signed requests only (see lib/platform-signature.ts).
    {
      matcher: '/platform*',
      bodyParser: { preserveRawBody: true },
      middlewares: [verifyPlatformRequest],
    },
    {
      method: ['POST'],
      matcher: '/platform/features',
      middlewares: [validateAndTransformBody(UpdateFeaturesSchema)],
    },
    {
      method: ['POST'],
      matcher: '/platform/owner-invite',
      middlewares: [validateAndTransformBody(OwnerInviteSchema)],
    },
  ],
})
