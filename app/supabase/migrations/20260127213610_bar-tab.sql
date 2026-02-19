-- ============== TAB SYSTEM MIGRATION ==============
-- Core tables for bar tab management with item tracking, splits, and payments
-- Main tab/bill table
CREATE TABLE IF NOT EXISTS public.tab(
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  tab_number text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'settled', 'split')),
  bar_id bigint NOT NULL REFERENCES public.bar(id) ON DELETE CASCADE,
  -- Pricing
  subtotal numeric(10, 2) NOT NULL DEFAULT 0,
  tax_amount numeric(10, 2) NOT NULL DEFAULT 0,
  total_before_tip numeric(10, 2) NOT NULL DEFAULT 0,
  tip_amount numeric(10, 2) DEFAULT 0,
  total_owed numeric(10, 2) NOT NULL DEFAULT 0,
  -- Split tracking
  is_split boolean NOT NULL DEFAULT FALSE,
  split_count integer DEFAULT 1,
  -- Notes
  special_notes text,
  -- Metadata
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  settled_at timestamp with time zone
);

-- Individual items in a tab
CREATE TABLE IF NOT EXISTS public.tab_item(
  id bigserial PRIMARY KEY,
  tab_id bigint NOT NULL REFERENCES public.tab(id) ON DELETE CASCADE,
  menu_item_id bigint NOT NULL REFERENCES public.menu_item(id) ON DELETE RESTRICT,
  -- Item details
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10, 2) NOT NULL,
  item_total numeric(10, 2) NOT NULL,
  -- Special instructions per item
  special_instructions text,
  -- Metadata
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bill split tracking (when a tab is split between multiple payments)
CREATE TABLE IF NOT EXISTS public.tab_split(
  id bigserial PRIMARY KEY,
  tab_id bigint NOT NULL REFERENCES public.tab(id) ON DELETE CASCADE,
  split_number integer NOT NULL,
  -- Split payment details
  items_included text[] NOT NULL DEFAULT '{}',
  subtotal numeric(10, 2) NOT NULL,
  tax_on_split numeric(10, 2) NOT NULL,
  total_owed numeric(10, 2) NOT NULL,
  amount_paid numeric(10, 2) NOT NULL DEFAULT 0,
  tip_amount numeric(10, 2) DEFAULT 0,
  -- Status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'settled')),
  -- Metadata
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  settled_at timestamp with time zone,
  CONSTRAINT valid_split UNIQUE (tab_id, split_number)
);

-- Payment records
CREATE TABLE IF NOT EXISTS public.tab_payment(
  id bigserial PRIMARY KEY,
  tab_id bigint NOT NULL REFERENCES public.tab(id) ON DELETE CASCADE,
  split_id bigint REFERENCES public.tab_split(id) ON DELETE CASCADE,
  -- Payment details
  amount_paid numeric(10, 2) NOT NULL,
  tip_added numeric(10, 2) DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'mobile', 'mixed')),
  -- Status
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  -- Metadata
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============== INDEXES FOR PERFORMANCE ==============
CREATE INDEX IF NOT EXISTS idx_tab_user_id ON public.tab(user_id);

CREATE INDEX IF NOT EXISTS idx_tab_status ON public.tab(status);

CREATE INDEX IF NOT EXISTS idx_tab_created_at ON public.tab(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tab_item_tab_id ON public.tab_item(tab_id);

CREATE INDEX IF NOT EXISTS idx_tab_item_menu_item_id ON public.tab_item(menu_item_id);

CREATE INDEX IF NOT EXISTS idx_tab_split_tab_id ON public.tab_split(tab_id);

CREATE INDEX IF NOT EXISTS idx_tab_split_status ON public.tab_split(status);

CREATE INDEX IF NOT EXISTS idx_tab_payment_tab_id ON public.tab_payment(tab_id);

CREATE INDEX IF NOT EXISTS idx_tab_payment_split_id ON public.tab_payment(split_id);

-- ============== TRIGGERS FOR AUTOMATIC UPDATES ==============
-- Function to update tab total when items are added/modified
CREATE OR REPLACE FUNCTION public.update_tab_totals()
  RETURNS TRIGGER
  AS $$
BEGIN
  -- Recalculate subtotal for the tab
  UPDATE
    public.tab
  SET
    subtotal = COALESCE((
      SELECT
        SUM(item_total)
      FROM public.tab_item
      WHERE
        tab_id = COALESCE(NEW.tab_id, OLD.tab_id)), 0),
    updated_at = CURRENT_TIMESTAMP
  WHERE
    id = COALESCE(NEW.tab_id, OLD.tab_id);
  RETURN COALESCE(NEW, OLD);
END;
$$
LANGUAGE plpgsql;

-- Trigger to update tab totals when items change
CREATE TRIGGER tab_item_update_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.tab_item
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tab_totals();

-- Function to update tab updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_tab_timestamp()
  RETURNS TRIGGER
  AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$
LANGUAGE plpgsql;

-- Trigger to update tab timestamp
CREATE TRIGGER tab_update_timestamp
  BEFORE UPDATE ON public.tab
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tab_timestamp();

-- ============== ROW LEVEL SECURITY ==============
-- All users can see all tabs (for serving patrons)
ALTER TABLE public.tab ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all tabs" ON public.tab
  FOR SELECT TO authenticated
    USING (TRUE);

CREATE POLICY "Users can create tabs" ON public.tab
  FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Assigned user or admin can update tab" ON public.tab
  FOR UPDATE TO authenticated
    USING (user_id = auth.uid()
      OR EXISTS (
        SELECT
          1
        FROM
          public.profile
        WHERE
          id = auth.uid() AND user_role = 'admin'));

-- Enable RLS for tab items
ALTER TABLE public.tab_item ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tab items" ON public.tab_item
  FOR SELECT TO authenticated
    USING (TRUE);

CREATE POLICY "Users can manage tab items for their tabs" ON public.tab_item
  FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
      SELECT
        1
      FROM
        public.tab
      WHERE
        id = tab_id AND (user_id = auth.uid() OR EXISTS (
          SELECT
            1
          FROM
            public.profile
          WHERE
            id = auth.uid() AND user_role = 'admin'))));

-- Enable RLS for splits
ALTER TABLE public.tab_split ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view splits" ON public.tab_split
  FOR SELECT TO authenticated
    USING (TRUE);

