CREATE TABLE "endpoint_health" (
	"endpoint_id" uuid NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status_code" integer,
	"latency_ms" integer,
	"is_up" boolean,
	CONSTRAINT "endpoint_health_endpoint_id_checked_at_pk" PRIMARY KEY("endpoint_id","checked_at")
);
--> statement-breakpoint
CREATE TABLE "endpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid,
	"url" text NOT NULL,
	"method" text DEFAULT 'GET',
	"description" text,
	"category" text NOT NULL,
	"price_usdc" numeric(20, 8) NOT NULL,
	"input_schema" jsonb,
	"output_schema" jsonb,
	"network" text DEFAULT 'eip155:8453',
	"active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "endpoints_url_method_unique" UNIQUE("url","method")
);
--> statement-breakpoint
CREATE TABLE "sellers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" text NOT NULL,
	"display_name" text,
	"api_key" text NOT NULL,
	"verified" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "sellers_wallet_address_unique" UNIQUE("wallet_address"),
	CONSTRAINT "sellers_api_key_unique" UNIQUE("api_key")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"endpoint_id" uuid,
	"buyer_wallet" text NOT NULL,
	"amount_usdc" numeric(20, 8) NOT NULL,
	"tx_hash" text,
	"latency_ms" integer,
	"status" text DEFAULT 'settled',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "endpoint_health" ADD CONSTRAINT "endpoint_health_endpoint_id_endpoints_id_fk" FOREIGN KEY ("endpoint_id") REFERENCES "public"."endpoints"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "endpoints" ADD CONSTRAINT "endpoints_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_endpoint_id_endpoints_id_fk" FOREIGN KEY ("endpoint_id") REFERENCES "public"."endpoints"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_health_endpoint" ON "endpoint_health" USING btree ("endpoint_id","checked_at");--> statement-breakpoint
CREATE INDEX "idx_endpoints_category" ON "endpoints" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_endpoints_active" ON "endpoints" USING btree ("active") WHERE active = TRUE;--> statement-breakpoint
CREATE INDEX "idx_transactions_endpoint" ON "transactions" USING btree ("endpoint_id");--> statement-breakpoint
CREATE INDEX "idx_transactions_created" ON "transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_transactions_buyer" ON "transactions" USING btree ("buyer_wallet");