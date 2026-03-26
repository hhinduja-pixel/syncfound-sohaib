export interface ProfileData {
  full_name: string;
  age: number | null;
  city: string | null;
  bio: string | null;
  primary_role: string | null;
  secondary_role: string | null;
  domain: string | null;
  startup_idea: string | null;
  funding_stage: string | null;
  time_commitment: string | null;
  mbti: string | null;
  work_style: string | null;
  risk_appetite: string | null;
  linkedin_url: string | null;
  avatar_url: string | null;
  skills?: { skill: string }[];
}

interface CompletenessResult {
  isComplete: boolean;
  percentage: number;
  missingRequired: string[];
  missingOptional: string[];
}

const REQUIRED_FIELDS = [
  { key: 'full_name', label: 'Full Name' },
  { key: 'primary_role', label: 'Primary Role' },
  { key: 'domain', label: 'Industry/Domain' },
] as const;

const OPTIONAL_FIELDS = [
  { key: 'age', label: 'Age' },
  { key: 'city', label: 'City' },
  { key: 'bio', label: 'Bio' },
  { key: 'secondary_role', label: 'Secondary Role' },
  { key: 'startup_idea', label: 'Startup Idea' },
  { key: 'funding_stage', label: 'Funding Stage' },
  { key: 'time_commitment', label: 'Time Commitment' },
  { key: 'work_style', label: 'Work Style' },
  { key: 'risk_appetite', label: 'Risk Appetite' },
  { key: 'mbti', label: 'MBTI' },
  { key: 'linkedin_url', label: 'LinkedIn URL' },
  { key: 'avatar_url', label: 'Profile Photo' },
] as const;

export function checkProfileCompleteness(profile: ProfileData | null): CompletenessResult {
  if (!profile) {
    return {
      isComplete: false,
      percentage: 0,
      missingRequired: REQUIRED_FIELDS.map(f => f.label),
      missingOptional: OPTIONAL_FIELDS.map(f => f.label),
    };
  }

  const missingRequired: string[] = [];
  const missingOptional: string[] = [];

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    const value = profile[field.key as keyof ProfileData];
    if (!value || (typeof value === 'string' && !value.trim())) {
      missingRequired.push(field.label);
    }
  }

  // Check optional fields
  for (const field of OPTIONAL_FIELDS) {
    const value = profile[field.key as keyof ProfileData];
    if (!value || (typeof value === 'string' && !value.trim())) {
      missingOptional.push(field.label);
    }
  }

  // Check skills separately
  const hasSkills = profile.skills && profile.skills.length > 0;
  if (!hasSkills) {
    missingOptional.push('Skills');
  }

  // Calculate percentage
  const totalFields = REQUIRED_FIELDS.length + OPTIONAL_FIELDS.length + 1; // +1 for skills
  const filledRequired = REQUIRED_FIELDS.length - missingRequired.length;
  const filledOptional = OPTIONAL_FIELDS.length - missingOptional.length;
  const filledSkills = hasSkills ? 1 : 0;
  
  const percentage = Math.round(((filledRequired + filledOptional + filledSkills) / totalFields) * 100);

  return {
    isComplete: missingRequired.length === 0,
    percentage,
    missingRequired,
    missingOptional,
  };
}

export function getProfileProgressColor(percentage: number): string {
  if (percentage >= 80) return 'text-green-500';
  if (percentage >= 50) return 'text-yellow-500';
  return 'text-red-500';
}
