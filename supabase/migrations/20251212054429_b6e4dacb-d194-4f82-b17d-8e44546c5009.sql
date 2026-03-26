-- Create profile_photos table for multiple photos
CREATE TABLE public.profile_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for profile_photos
CREATE POLICY "Users can view all profile photos"
ON public.profile_photos FOR SELECT
USING (true);

CREATE POLICY "Users can manage their own photos"
ON public.profile_photos FOR ALL
USING (profile_id = auth.uid());

-- Add pitch_deck_url column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pitch_deck_url TEXT;

-- Create indexes for performance
CREATE INDEX idx_profile_photos_profile_id ON public.profile_photos(profile_id);
CREATE INDEX idx_messages_match_id_read_at ON public.messages(match_id, read_at);