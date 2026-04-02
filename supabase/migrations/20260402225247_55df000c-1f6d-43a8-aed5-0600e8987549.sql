CREATE POLICY "Admins remove members"
ON public.bolao_members
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));