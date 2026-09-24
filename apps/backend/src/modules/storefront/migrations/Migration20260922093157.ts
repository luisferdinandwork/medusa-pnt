import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260922093157 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "storefront" add column if not exists "editorial_eyebrow" text null, add column if not exists "editorial_heading" text null, add column if not exists "editorial_body" text null, add column if not exists "editorial_cta_label" text null, add column if not exists "guide_cards" jsonb null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "storefront" drop column if exists "editorial_eyebrow", drop column if exists "editorial_heading", drop column if exists "editorial_body", drop column if exists "editorial_cta_label", drop column if exists "guide_cards";`);
  }

}
