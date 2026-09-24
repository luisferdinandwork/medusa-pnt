import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260921020738 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "storefront" drop constraint if exists "storefront_key_unique";`);
    this.addSql(`create table if not exists "storefront" ("id" text not null, "key" text not null, "name" text not null, "short_name" text not null, "tagline" text null, "default_title" text null, "default_description" text null, "announcement_items" jsonb null, "hero_eyebrow" text null, "hero_heading" text null, "hero_body" text null, "hero_price" text null, "hero_compare_price" text null, "hero_badge" text null, "hero_cta_label" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "storefront_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_storefront_key_unique" ON "storefront" ("key") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_storefront_deleted_at" ON "storefront" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "storefront" cascade;`);
  }

}
