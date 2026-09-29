import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260928082314 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "storefront" add column if not exists "editorial_image_url" text null, add column if not exists "editorial_image_alt" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "storefront" drop column if exists "editorial_image_url", drop column if exists "editorial_image_alt";`);
  }

}
