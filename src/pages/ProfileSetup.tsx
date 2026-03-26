import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { checkProfileCompleteness, getProfileProgressColor } from "@/lib/profileCompleteness";
import syncFoundLogo from "@/assets/syncfound-logo.png";
import { CheckCircle2, AlertCircle } from "lucide-react";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  
  const [formData, setFormData] = useState({
    age: "",
    city: "",
    bio: "",
    primary_role: "",
    secondary_role: "",
    domain: "",
    startup_idea: "",
    funding_stage: "",
    time_commitment: "",
    work_style: "",
    risk_appetite: "",
    mbti: "",
    linkedin_url: "",
    skills: "",
  });

  // Calculate completeness based on current form data
  const completeness = useMemo(() => {
    const profileData = {
      full_name: fullName,
      age: formData.age ? parseInt(formData.age) : null,
      city: formData.city || null,
      bio: formData.bio || null,
      primary_role: formData.primary_role || null,
      secondary_role: formData.secondary_role || null,
      domain: formData.domain || null,
      startup_idea: formData.startup_idea || null,
      funding_stage: formData.funding_stage || null,
      time_commitment: formData.time_commitment || null,
      mbti: formData.mbti || null,
      work_style: formData.work_style || null,
      risk_appetite: formData.risk_appetite || null,
      linkedin_url: formData.linkedin_url || null,
      avatar_url: null,
      skills: formData.skills ? formData.skills.split(",").map(s => ({ skill: s.trim() })).filter(s => s.skill) : [],
    };
    return checkProfileCompleteness(profileData);
  }, [formData, fullName]);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      
      setUserId(user.id);
      
      // Load existing profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("*, skills(skill)")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        setFullName(profile.full_name || "");
        setFormData({
          age: profile.age?.toString() || "",
          city: profile.city || "",
          bio: profile.bio || "",
          primary_role: profile.primary_role || "",
          secondary_role: profile.secondary_role || "",
          domain: profile.domain || "",
          startup_idea: profile.startup_idea || "",
          funding_stage: profile.funding_stage || "",
          time_commitment: profile.time_commitment || "",
          work_style: profile.work_style || "",
          risk_appetite: profile.risk_appetite || "",
          mbti: profile.mbti || "",
          linkedin_url: profile.linkedin_url || "",
          skills: profile.skills?.map((s: { skill: string }) => s.skill).join(", ") || "",
        });
      }
    };
    
    loadProfile();
  }, [navigate]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    // Validate required fields
    if (!formData.primary_role || !formData.domain) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Please fill in your Primary Role and Industry/Domain",
      });
      return;
    }
    
    setLoading(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          age: formData.age ? parseInt(formData.age) : null,
          city: formData.city || null,
          bio: formData.bio || null,
          primary_role: formData.primary_role || null,
          secondary_role: formData.secondary_role || null,
          domain: formData.domain || null,
          startup_idea: formData.startup_idea || null,
          funding_stage: formData.funding_stage || null,
          time_commitment: formData.time_commitment || null,
          work_style: formData.work_style || null,
          risk_appetite: formData.risk_appetite || null,
          mbti: formData.mbti || null,
          linkedin_url: formData.linkedin_url || null,
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Add skills if provided
      if (formData.skills) {
        const skillsArray = formData.skills.split(",").map(s => s.trim()).filter(s => s);
        
        const skillsData = skillsArray.map(skill => ({
          profile_id: userId,
          skill: skill,
        }));

        const { error: skillsError } = await supabase
          .from("skills")
          .insert(skillsData);

        if (skillsError) throw skillsError;
      }

      toast({
        title: "Profile completed!",
        description: "Welcome to SyncFound. Let's find your co-founder!",
      });
      
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start px-4 py-8 overflow-y-auto">
      <img 
        src={syncFoundLogo} 
        alt="SyncFound" 
        className="h-16 w-auto mb-6"
      />
      
      <Card className="w-full max-w-2xl mb-8">
        <CardHeader>
          <CardTitle>Complete Your Founder Profile</CardTitle>
          <CardDescription>
            Help us match you with the perfect co-founder by sharing more about yourself
          </CardDescription>
          
          {/* Progress indicator */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Profile Completeness</span>
              <span className={`font-medium ${getProfileProgressColor(completeness.percentage)}`}>
                {completeness.percentage}%
              </span>
            </div>
            <Progress value={completeness.percentage} className="h-2" />
            
            {completeness.missingRequired.length > 0 && (
              <div className="flex items-start gap-2 mt-3 p-3 bg-destructive/10 rounded-lg">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div className="text-sm">
                  <span className="font-medium text-destructive">Required: </span>
                  <span className="text-muted-foreground">
                    {completeness.missingRequired.join(", ")}
                  </span>
                </div>
              </div>
            )}
            
            {completeness.isComplete && (
              <div className="flex items-center gap-2 mt-3 p-3 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">All required fields completed!</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="28"
                  value={formData.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="San Francisco"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_role">Primary Role *</Label>
                <Select value={formData.primary_role} onValueChange={(value) => handleChange("primary_role", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CEO">CEO</SelectItem>
                    <SelectItem value="CTO">CTO</SelectItem>
                    <SelectItem value="CPO">CPO</SelectItem>
                    <SelectItem value="CMO">CMO</SelectItem>
                    <SelectItem value="CFO">CFO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary_role">Secondary Role (Optional)</Label>
                <Select value={formData.secondary_role} onValueChange={(value) => handleChange("secondary_role", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Industry/Domain *</Label>
              <Input
                id="domain"
                placeholder="FinTech, HealthTech, SaaS..."
                value={formData.domain}
                onChange={(e) => handleChange("domain", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startup_idea">Startup Idea</Label>
              <Textarea
                id="startup_idea"
                placeholder="What are you building?"
                value={formData.startup_idea}
                onChange={(e) => handleChange("startup_idea", e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="funding_stage">Funding Stage</Label>
                <Select value={formData.funding_stage} onValueChange={(value) => handleChange("funding_stage", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pre-seed">Pre-seed</SelectItem>
                    <SelectItem value="Seed">Seed</SelectItem>
                    <SelectItem value="Series A">Series A</SelectItem>
                    <SelectItem value="Series B+">Series B+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time_commitment">Time Commitment</Label>
                <Select value={formData.time_commitment} onValueChange={(value) => handleChange("time_commitment", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select commitment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="work_style">Work Style</Label>
                <Select value={formData.work_style} onValueChange={(value) => handleChange("work_style", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Remote">Remote</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                    <SelectItem value="In-person">In-person</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="risk_appetite">Risk Appetite</Label>
                <Select value={formData.risk_appetite} onValueChange={(value) => handleChange("risk_appetite", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select appetite" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mbti">MBTI (Optional)</Label>
                <Input
                  id="mbti"
                  placeholder="INTJ, ENFP..."
                  value={formData.mbti}
                  onChange={(e) => handleChange("mbti", e.target.value)}
                  maxLength={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                <Input
                  id="linkedin_url"
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={formData.linkedin_url}
                  onChange={(e) => handleChange("linkedin_url", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input
                id="skills"
                placeholder="React, Python, Marketing, Design..."
                value={formData.skills}
                onChange={(e) => handleChange("skills", e.target.value)}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Complete Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;
