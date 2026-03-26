import { useState, useRef } from 'react';
import { Camera, Loader2, X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface Photo {
  id: string;
  photo_url: string;
  display_order: number;
}

interface MultiPhotoUploadProps {
  userId: string;
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  maxPhotos?: number;
}

export function MultiPhotoUpload({ 
  userId, 
  photos, 
  onPhotosChange,
  maxPhotos = 3 
}: MultiPhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 5MB',
        variant: 'destructive',
      });
      return;
    }

    if (photos.length >= maxPhotos) {
      toast({
        title: 'Maximum photos reached',
        description: `You can only upload up to ${maxPhotos} photos`,
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;

      // Insert into profile_photos table
      const { data: newPhoto, error: insertError } = await supabase
        .from('profile_photos')
        .insert({
          profile_id: userId,
          photo_url: urlWithTimestamp,
          display_order: photos.length,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      onPhotosChange([...photos, newPhoto]);
      
      toast({
        title: 'Photo uploaded',
        description: 'Your photo has been added',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload photo',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async (photoId: string, photoUrl: string) => {
    try {
      // Extract file path from URL
      const urlPath = new URL(photoUrl.split('?')[0]).pathname;
      const storagePath = urlPath.split('/avatars/')[1];

      if (storagePath) {
        await supabase.storage.from('avatars').remove([storagePath]);
      }

      const { error } = await supabase
        .from('profile_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      onPhotosChange(photos.filter(p => p.id !== photoId));
      
      toast({
        title: 'Photo removed',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to remove photo',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {photos.map((photo) => (
          <div key={photo.id} className="relative aspect-square">
            <img
              src={photo.photo_url}
              alt="Profile"
              className="w-full h-full object-cover rounded-lg border border-border"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={() => handleRemovePhoto(photo.id, photo.photo_url)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        
        {photos.length < maxPhotos && (
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors bg-muted/50"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <Plus className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-muted-foreground text-center">
        Upload up to {maxPhotos} photos (max 5MB each)
      </p>
    </div>
  );
}
