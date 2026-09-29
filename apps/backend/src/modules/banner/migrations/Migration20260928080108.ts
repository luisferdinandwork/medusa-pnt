import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260928080108 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "banner" ("id" text not null, "storefront_key" text not null, "placement" text check ("placement" in ('hero', 'category', 'promo', 'feature')) not null, "image_url" text not null, "mobile_image_url" text null, "image_alt" text null, "eyebrow" text null, "title" text null, "subtitle" text null, "cta_label" text null, "text_align" text check ("text_align" in ('left', 'center', 'right')) not null default 'left', "text_theme" text check ("text_theme" in ('light', 'dark')) not null default 'light', "link_type" text check ("link_type" in ('category', 'collection', 'product', 'url')) not null default 'category', "link_value" text not null, "is_active" boolean not null default true, "starts_at" timestamptz null, "ends_at" timestamptz null, "rank" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "banner_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_banner_deleted_at" ON "banner" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_banner_storefront_key_placement_rank" ON "banner" ("storefront_key", "placement", "rank") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "banner" cascade;`);
  }

}
