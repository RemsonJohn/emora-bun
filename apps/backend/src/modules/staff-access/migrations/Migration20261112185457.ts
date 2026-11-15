import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261112185457 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "staff_grant" drop constraint if exists "staff_grant_user_id_unique";`);
    this.addSql(`create table if not exists "staff_grant" ("id" text not null, "user_id" text not null, "role" text not null, "overrides" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "staff_grant_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_staff_grant_user_id_unique" ON "staff_grant" ("user_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_staff_grant_deleted_at" ON "staff_grant" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "staff_grant" cascade;`);
  }

}
