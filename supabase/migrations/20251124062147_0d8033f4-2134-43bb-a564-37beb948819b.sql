-- Add missing email column to profiles so handle_new_user trigger works
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email text;