-- Allow users to update matches they are part of (for accept/reject)
CREATE POLICY "Users can update matches they are part of"
ON public.matches FOR UPDATE
USING (user_id = auth.uid() OR matched_user_id = auth.uid());