import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260924144035 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_story" drop constraint if exists "product_story_handle_unique";`);
    this.addSql(`alter table if exists "article" drop constraint if exists "article_handle_unique";`);
    this.addSql(`create table if not exists "article" ("id" text not null, "handle" text not null, "storefront_key" text null, "title" text not null, "subtitle" text null, "excerpt" text null, "content" text null, "status" text check ("status" in ('draft', 'published')) not null default 'draft', "published_at" timestamptz null, "rank" integer not null default 0, "is_featured" boolean not null default false, "category" text null, "tags" jsonb null, "cover_image_url" text null, "cover_image_alt" text null, "read_minutes" integer null, "author_name" text null, "author_role" text null, "seo_title" text null, "seo_description" text null, "seo_keywords" jsonb null, "canonical_url" text null, "og_image_url" text null, "noindex" boolean not null default false, "answer_summary" text null, "key_takeaways" jsonb null, "faqs" jsonb null, "sources" jsonb null, "geo_locale" text null, "geo_target_area" text null, "related_product_handles" jsonb null, "related_category_handles" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "article_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_article_handle_unique" ON "article" ("handle") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_article_deleted_at" ON "article" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_story" ("id" text not null, "handle" text not null, "storefront_key" text null, "title" text not null, "subtitle" text null, "excerpt" text null, "silo" text not null, "category_handle" text null, "product_handles" jsonb null, "intro" text null, "sections" jsonb null, "highlights" jsonb null, "faqs" jsonb null, "cover_image_url" text null, "cover_image_alt" text null, "cta_label" text null, "cta_href" text null, "status" text check ("status" in ('draft', 'published')) not null default 'draft', "published_at" timestamptz null, "rank" integer not null default 0, "seo_title" text null, "seo_description" text null, "seo_keywords" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_story_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_product_story_handle_unique" ON "product_story" ("handle") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_story_deleted_at" ON "product_story" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "article" cascade;`);

    this.addSql(`drop table if exists "product_story" cascade;`);
  }

}
