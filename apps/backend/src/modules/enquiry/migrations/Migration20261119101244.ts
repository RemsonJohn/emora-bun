import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261119101244 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "enquiry" ("id" text not null, "kind" text check ("kind" in ('bulk_order')) not null default 'bulk_order', "status" text check ("status" in ('new', 'quoted', 'won', 'lost')) not null default 'new', "name" text not null, "phone" text not null, "email" text null, "organisation" text null, "details" jsonb not null, "staff_notes" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "enquiry_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_enquiry_deleted_at" ON "enquiry" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "enquiry" cascade;`);
  }

}
