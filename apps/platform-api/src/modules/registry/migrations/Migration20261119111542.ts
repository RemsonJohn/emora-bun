import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261119111542 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "merchant" drop constraint if exists "merchant_handle_unique";`);
    this.addSql(`create table if not exists "audit_event" ("id" text not null, "actor_id" text null, "actor_email" text null, "merchant_id" text null, "action" text not null, "details" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "audit_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_audit_event_deleted_at" ON "audit_event" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "merchant" ("id" text not null, "name" text not null, "handle" text not null, "status" text check ("status" in ('draft', 'active', 'suspended')) not null default 'draft', "owner_email" text null, "storefront_url" text null, "storefront_host" text null, "backend_url" text null, "backend_host" text null, "dashboard_url" text null, "notes" text null, "secret_ciphertext" text null, "secret_set_at" timestamptz null, "check_status" text check ("check_status" in ('not_checked', 'connected', 'needs_attention')) not null default 'not_checked', "checked_at" timestamptz null, "check_latency_ms" integer null, "check_error" text null, "summary" jsonb null, "features" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "merchant_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_merchant_handle_unique" ON "merchant" ("handle") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_merchant_deleted_at" ON "merchant" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "audit_event" cascade;`);

    this.addSql(`drop table if exists "merchant" cascade;`);
  }

}
