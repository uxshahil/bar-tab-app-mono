-- Create a view to calculate tab totals on the fly
CREATE OR REPLACE VIEW public.view_tab_totals AS
SELECT
  t.id AS tab_id,
  COALESCE(SUM(ti.item_total), 0) AS subtotal,
  COALESCE(SUM(ti.item_total), 0) * 0.15 AS tax_amount,
  COALESCE(SUM(ti.item_total), 0) * 1.15 AS total_before_tip,
  (COALESCE(SUM(ti.item_total), 0) * 1.15) + COALESCE(t.tip_amount, 0) AS total_owed
FROM
  public.tab t
  LEFT JOIN public.tab_item ti ON t.id = ti.tab_id
GROUP BY
  t.id;

-- Grant access to authenticated users
GRANT SELECT ON public.view_tab_totals TO authenticated;
