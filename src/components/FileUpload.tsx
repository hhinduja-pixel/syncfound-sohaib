import { useState, useRef } from 'react';
import { Loader2, X, Upload, FileText, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  userId: string;
  currentUrl?: string | null;
  onUploadComplete: (url: string | null) => void;
  type: 'video' | 'document';
  label: string;
  accept: string;
  maxSizeMB?: number;
}

export function FileUpload({
  userId,
  currentUrl,
  onUploadComplete,
  type,
  label,
  accept,
  maxSizeMB = 50
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: `Please select a file under ${maxSizeMB}MB`,
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;

      // Update profile with the URL
      const updateField = type === 'video' ? 'intro_video_url' : 'pitch_deck_url';
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [updateField]: urlWithTimestamp })
        .eq('id', userId);

      if (updateError) throw updateError;

      onUploadComplete(urlWithTimestamp);
      
      toast({
        title: `${label} uploaded`,
        description: `Your ${label.toLowerCase()} has been saved`,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!currentUrl) return;

    setUploading(true);
    try {
      const urlPath = new URL(currentUrl.split('?')[0]).pathname;
      const storagePath = urlPath.split('/avatars/')[1];

      if (storagePath) {
        await supabase.storage.from('avatars').remove([storagePath]);
      }

      const updateField = type === 'video' ? 'intro_video_url' : 'pitch_deck_url';
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [updateField]: null })
        .eq('id', userId);

      if (updateError) throw updateError;

      onUploadComplete(null);
      
      toast({
        title: `${label} removed`,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to remove file',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const Icon = type === 'video' ? Video : FileText;

  return (
    <div className="space-y-3">
      {currentUrl ? (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <Icon className="h-5 w-5 text-primary shrink-0" />
          <span className="text-sm truncate flex-1">{label} uploaded</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={handleRemove}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        </div>
      ) : (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="flex items-center gap-3 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">
            {uploading ? 'Uploading...' : `Upload ${label}`}
          </span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
