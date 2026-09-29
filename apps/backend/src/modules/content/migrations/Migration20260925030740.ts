import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260925030740 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_story" rename column "silo" to "product_name";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product_story" rename column "product_name" to "silo";`);
  }

}
