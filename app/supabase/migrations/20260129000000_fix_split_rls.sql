-- Fix RLS policies for tab_split table

-- Allow users to insert splits for their own tabs or if they are admin
CREATE POLICY "Users can create splits for their tabs" ON public.tab_split
  FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
      SELECT 1
      FROM public.tab
      WHERE id = tab_id AND (
        user_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.profile 
          WHERE id = auth.uid() AND user_role = 'admin'
        )
      )
    ));

-- Allow users to update splits for their own tabs or if they are admin
CREATE POLICY "Users can update splits for their tabs" ON public.tab_split
  FOR UPDATE TO authenticated
    USING (EXISTS (
      SELECT 1
      FROM public.tab
      WHERE id = tab_id AND (
        user_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.profile 
          WHERE id = auth.uid() AND user_role = 'admin'
        )
      )
    ));

-- Allow users to delete splits for their own tabs or if they are admin
CREATE POLICY "Users can delete splits for their tabs" ON public.tab_split
  FOR DELETE TO authenticated
    USING (EXISTS (
      SELECT 1
      FROM public.tab
      WHERE id = tab_id AND (
        user_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.profile 
          WHERE id = auth.uid() AND user_role = 'admin'
        )
      )
    ));
