import { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export interface Filters {
  role: string;
  domain: string;
  city: string;
  timeCommitment: string;
  fundingStage: string;
  minCompatibility: number;
}

interface DiscoveryFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onApply: () => void;
  onReset: () => void;
}

const ROLES = [
  'Technical Co-founder',
  'Business Co-founder',
  'Product Manager',
  'Designer',
  'Growth/Marketing',
  'Sales',
  'Operations',
];

const DOMAINS = [
  'AI/ML',
  'SaaS',
  'FinTech',
  'HealthTech',
  'EdTech',
  'E-commerce',
  'Web3/Crypto',
  'CleanTech',
  'Consumer',
  'B2B',
  'Other',
];

const TIME_COMMITMENTS = [
  'Full-time',
  'Part-time',
  'Weekends',
  'Flexible',
];

const FUNDING_STAGES = [
  'Idea Stage',
  'Bootstrapped',
  'Pre-seed',
  'Seed',
  'Series A+',
];

export function DiscoveryFilters({ filters, onFiltersChange, onApply, onReset }: DiscoveryFiltersProps) {
  const [open, setOpen] = useState(false);

  const activeFilterCount = [
    filters.role,
    filters.domain,
    filters.city,
    filters.timeCommitment,
    filters.fundingStage,
    filters.minCompatibility > 0,
  ].filter(Boolean).length;

  const handleApply = () => {
    onApply();
    setOpen(false);
  };

  const handleReset = () => {
    onReset();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md bg-background">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Filter Founders
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground">
                <X className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Role Filter */}
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={filters.role}
              onValueChange={(value) => onFiltersChange({ ...filters, role: value })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Any role" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="any">Any role</SelectItem>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City/Location Filter */}
          <div className="space-y-2">
            <Label>Location</Label>
            <input
              type="text"
              value={filters.city}
              onChange={(e) => onFiltersChange({ ...filters, city: e.target.value })}
              placeholder="Enter city name..."
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {/* Domain Filter */}
          <div className="space-y-2">
            <Label>Domain</Label>
            <Select
              value={filters.domain}
              onValueChange={(value) => onFiltersChange({ ...filters, domain: value })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Any domain" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="any">Any domain</SelectItem>
                {DOMAINS.map((domain) => (
                  <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Commitment Filter */}
          <div className="space-y-2">
            <Label>Time Commitment</Label>
            <Select
              value={filters.timeCommitment}
              onValueChange={(value) => onFiltersChange({ ...filters, timeCommitment: value })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Any commitment" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="any">Any commitment</SelectItem>
                {TIME_COMMITMENTS.map((time) => (
                  <SelectItem key={time} value={time}>{time}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Funding Stage Filter */}
          <div className="space-y-2">
            <Label>Funding Stage</Label>
            <Select
              value={filters.fundingStage}
              onValueChange={(value) => onFiltersChange({ ...filters, fundingStage: value })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Any stage" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="any">Any stage</SelectItem>
                {FUNDING_STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Min Compatibility Score */}
          <div className="space-y-4">
            <div className="flex justify-between">
              <Label>Minimum Compatibility</Label>
              <span className="text-sm text-muted-foreground">{filters.minCompatibility}%</span>
            </div>
            <Slider
              value={[filters.minCompatibility]}
              onValueChange={([value]) => onFiltersChange({ ...filters, minCompatibility: value })}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Apply Button */}
          <div className="pt-4 space-y-3">
            <Button onClick={handleApply} className="w-full">
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
