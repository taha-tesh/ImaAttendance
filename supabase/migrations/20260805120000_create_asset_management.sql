-- Create asset management tables

CREATE TABLE IF NOT EXISTS asset_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE asset_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS read_asset_types ON asset_types;
CREATE POLICY read_asset_types ON asset_types FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS insert_asset_types ON asset_types;
CREATE POLICY insert_asset_types ON asset_types FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS update_asset_types ON asset_types;
CREATE POLICY update_asset_types ON asset_types FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS delete_asset_types ON asset_types;
CREATE POLICY delete_asset_types ON asset_types FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS asset_funds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_id uuid NOT NULL REFERENCES asset_types(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE asset_funds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS read_asset_funds ON asset_funds;
CREATE POLICY read_asset_funds ON asset_funds FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS insert_asset_funds ON asset_funds;
CREATE POLICY insert_asset_funds ON asset_funds FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS delete_asset_funds ON asset_funds;
CREATE POLICY delete_asset_funds ON asset_funds FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS asset_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_id uuid NOT NULL REFERENCES asset_types(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity integer NOT NULL,
  quantity_in_stock integer NOT NULL DEFAULT 0,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE asset_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS read_asset_items ON asset_items;
CREATE POLICY read_asset_items ON asset_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS insert_asset_items ON asset_items;
CREATE POLICY insert_asset_items ON asset_items FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS delete_asset_items ON asset_items;
CREATE POLICY delete_asset_items ON asset_items FOR DELETE TO authenticated USING (true);

ALTER TABLE asset_items ADD COLUMN IF NOT EXISTS quantity_in_stock integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_asset_items_type_id ON asset_items(type_id);
CREATE INDEX IF NOT EXISTS idx_asset_funds_type_id ON asset_funds(type_id);
