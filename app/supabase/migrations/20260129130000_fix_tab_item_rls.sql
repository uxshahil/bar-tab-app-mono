-- Fix missing RLS policies for tab_item updates and deletes

CREATE POLICY "Users can update tab items" ON public.tab_item
  FOR UPDATE TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.tab
      WHERE id = tab_item.tab_id
      AND (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profile
        WHERE id = auth.uid() AND user_role = 'admin'
      ))
    ));

CREATE POLICY "Users can delete tab items" ON public.tab_item
  FOR DELETE TO authenticated
    USING (EXISTS (
      SELECT 1 FROM public.tab
      WHERE id = tab_item.tab_id
      AND (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profile
        WHERE id = auth.uid() AND user_role = 'admin'
      ))
    ));
