import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PhotoUpload } from "@/components/PhotoUpload";
import { MultiPhotoUpload } from "@/components/MultiPhotoUpload";
import { FileUpload } from "@/components/FileUpload";
import syncFoundLogo from "@/assets/syncfound-logo.png";

interface ProfileData {
  id: string;
  full_name: string;
  email: string | null;
  age: number | null;
  city: string | null;
  bio: string | null;
  primary_role: string | null;
  secondary_role: string | null;
  domain: string | null;
  startup_idea: string | null;
  time_commitment: string | null;
  funding_stage: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  intro_video_url: string | null;
  pitch_deck_url: string | null;
}

interface ProfilePhoto {
  id: string;
  photo_url: string;
  display_order: number;
}

const Profile = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    // Fetch profile data
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } else {
      setProfile(profileData);
    }

    // Fetch skills
    const { data: skillsData } = await supabase
      .from("skills")
      .select("skill")
      .eq("profile_id", session.user.id);

    if (skillsData) {
      setSkills(skillsData.map(s => s.skill));
    }

    // Fetch profile photos
    const { data: photosData } = await supabase
      .from("profile_photos")
      .select("*")
      .eq("profile_id", session.user.id)
      .order("display_order");

    if (photosData) {
      setPhotos(photosData);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        age: profile.age,
        city: profile.city,
        bio: profile.bio,
        primary_role: profile.primary_role,
        secondary_role: profile.secondary_role,
        domain: profile.domain,
        startup_idea: profile.startup_idea,
        time_commitment: profile.time_commitment,
        funding_stage: profile.funding_stage,
        linkedin_url: profile.linkedin_url,
      })
      .eq("id", profile.id);

    if (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    }

    setSaving(false);
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim() || !profile) return;

    const { error } = await supabase
      .from("skills")
      .insert({
        profile_id: profile.id,
        skill: newSkill.trim(),
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add skill",
        variant: "destructive",
      });
    } else {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    if (!profile) return;

    const { error } = await supabase
      .from("skills")
      .delete()
      .eq("profile_id", profile.id)
      .eq("skill", skillToRemove);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove skill",
        variant: "destructive",
      });
    } else {
      setSkills(skills.filter(s => s !== skillToRemove));
    }
  };

  if (loading || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <img 
            src={syncFoundLogo} 
            alt="SyncFound" 
            className="h-8 w-auto"
          />
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

        <div className="space-y-6">
          {/* Avatar */}
          <Card className="p-6">
            <Label className="text-sm font-medium mb-4 block">Profile Photo</Label>
            <PhotoUpload
              userId={profile.id}
              currentAvatarUrl={profile.avatar_url}
              onUploadComplete={(url) => setProfile({ ...profile, avatar_url: url })}
            />
          </Card>

          {/* Additional Photos */}
          <Card className="p-6">
            <Label className="text-sm font-medium mb-4 block">Additional Photos</Label>
            <MultiPhotoUpload
              userId={profile.id}
              photos={photos}
              onPhotosChange={setPhotos}
              maxPhotos={3}
            />
          </Card>

          {/* Media Files */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Media</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Intro Video</Label>
                <FileUpload
                  userId={profile.id}
                  currentUrl={profile.intro_video_url}
                  onUploadComplete={(url) => setProfile({ ...profile, intro_video_url: url })}
                  type="video"
                  label="Intro Video"
                  accept="video/*"
                  maxSizeMB={50}
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Pitch Deck</Label>
                <FileUpload
                  userId={profile.id}
                  currentUrl={profile.pitch_deck_url}
                  onUploadComplete={(url) => setProfile({ ...profile, pitch_deck_url: url })}
                  type="document"
                  label="Pitch Deck"
                  accept=".pdf,.ppt,.pptx"
                  maxSizeMB={20}
                />
              </div>
            </div>
          </Card>

          {/* Basic Info */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={profile.age || ""}
                    onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || null })}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={profile.city || ""}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  rows={3}
                  value={profile.bio || ""}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
          </Card>

          {/* Professional Info */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Professional Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primary_role">Primary Role</Label>
                  <Input
                    id="primary_role"
                    value={profile.primary_role || ""}
                    onChange={(e) => setProfile({ ...profile, primary_role: e.target.value })}
                    placeholder="e.g., Technical Co-founder"
                  />
                </div>
                <div>
                  <Label htmlFor="secondary_role">Secondary Role</Label>
                  <Input
                    id="secondary_role"
                    value={profile.secondary_role || ""}
                    onChange={(e) => setProfile({ ...profile, secondary_role: e.target.value })}
                    placeholder="e.g., Growth"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={profile.domain || ""}
                  onChange={(e) => setProfile({ ...profile, domain: e.target.value })}
                  placeholder="e.g., AI/ML, SaaS, FinTech"
                />
              </div>
              <div>
                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                <Input
                  id="linkedin_url"
                  type="url"
                  value={profile.linkedin_url || ""}
                  onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
            </div>
          </Card>

          {/* Skills */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1">
                  {skill}
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill..."
                onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
              />
              <Button onClick={handleAddSkill}>Add</Button>
            </div>
          </Card>

          {/* Startup Info */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Startup Preferences</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="startup_idea">Startup Idea</Label>
                <Textarea
                  id="startup_idea"
                  rows={3}
                  value={profile.startup_idea || ""}
                  onChange={(e) => setProfile({ ...profile, startup_idea: e.target.value })}
                  placeholder="Describe your startup idea or what you're looking to build..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="time_commitment">Time Commitment</Label>
                  <Input
                    id="time_commitment"
                    value={profile.time_commitment || ""}
                    onChange={(e) => setProfile({ ...profile, time_commitment: e.target.value })}
                    placeholder="e.g., Full-time, Part-time"
                  />
                </div>
                <div>
                  <Label htmlFor="funding_stage">Funding Stage</Label>
                  <Input
                    id="funding_stage"
                    value={profile.funding_stage || ""}
                    onChange={(e) => setProfile({ ...profile, funding_stage: e.target.value })}
                    placeholder="e.g., Bootstrapped, Pre-seed"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
