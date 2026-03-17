-- Migration: Token-based dynamic pricing
-- Run against Supabase DB manually

-- 1. Provider rates table
CREATE TABLE IF NOT EXISTS provider_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_rate_per_1k NUMERIC(20, 10) NOT NULL,
  output_rate_per_1k NUMERIC(20, 10),
  unit TEXT NOT NULL DEFAULT 'tokens',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS provider_rates_provider_model_unique
  ON provider_rates (provider, model);

-- 2. Add pricing columns to endpoints
ALTER TABLE endpoints
  ADD COLUMN IF NOT EXISTS pricing_mode TEXT NOT NULL DEFAULT 'flat',
  ADD COLUMN IF NOT EXISTS pricing_config JSONB;

-- 3. Usage tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID REFERENCES endpoints(id),
  transaction_id UUID REFERENCES transactions(id),
  input_tokens INTEGER,
  output_tokens INTEGER,
  estimated_output_tokens INTEGER,
  actual_cost_usdc NUMERIC(20, 8),
  charged_usdc NUMERIC(20, 8),
  margin_usdc NUMERIC(20, 8),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_endpoint ON usage_tracking (endpoint_id);
CREATE INDEX IF NOT EXISTS idx_usage_created ON usage_tracking (created_at);
