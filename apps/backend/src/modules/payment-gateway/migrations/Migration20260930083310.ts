import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260930083310 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "payment_gateway_transaction" drop constraint if exists "payment_gateway_transaction_reference_unique";`);
    this.addSql(`create table if not exists "payment_gateway" ("id" text not null, "name" text not null, "description" text null, "provider" text check ("provider" in ('midtrans', 'doku')) not null, "environment" text check ("environment" in ('sandbox', 'production')) not null default 'sandbox', "is_active" boolean not null default false, "rank" integer not null default 0, "credentials" jsonb null, "payment_methods" jsonb null, "expiry_minutes" integer not null default 1440, "success_url" text null, "pending_url" text null, "failure_url" text null, "notification_url" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payment_gateway_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_gateway_deleted_at" ON "payment_gateway" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "payment_gateway_transaction" ("id" text not null, "gateway_id" text not null, "provider" text check ("provider" in ('midtrans', 'doku')) not null, "reference" text not null, "session_id" text not null, "cart_id" text null, "amount" numeric not null, "currency_code" text not null, "status" text check ("status" in ('created', 'pending', 'authorized', 'paid', 'failed', 'expired', 'canceled', 'refunded')) not null default 'created', "gateway_status" text null, "payment_method" text null, "redirect_url" text null, "expires_at" timestamptz null, "paid_at" timestamptz null, "last_payload" jsonb null, "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payment_gateway_transaction_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payment_gateway_transaction_reference_unique" ON "payment_gateway_transaction" ("reference") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_gateway_transaction_deleted_at" ON "payment_gateway_transaction" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_gateway_transaction_gateway_id_created_at" ON "payment_gateway_transaction" ("gateway_id", "created_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_gateway_transaction_session_id" ON "payment_gateway_transaction" ("session_id") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "payment_gateway" cascade;`);

    this.addSql(`drop table if exists "payment_gateway_transaction" cascade;`);
  }

}
