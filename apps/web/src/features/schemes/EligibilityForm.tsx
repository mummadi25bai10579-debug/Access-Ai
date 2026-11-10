import React from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";

interface EligibilityFormProps {
  profile: {
    stateCode: string;
    annualFamilyIncome: number;
    educationLevel: string;
    gender: string;
    category: string;
  };
  onChangeProfile: (updated: {
    stateCode: string;
    annualFamilyIncome: number;
    educationLevel: string;
    gender: string;
    category: string;
  }) => void;
  onReset: () => void;
}

export const EligibilityForm: React.FC<EligibilityFormProps> = ({
  profile,
  onChangeProfile,
  onReset,
}) => {
  return (
    <Card className="space-y-4">
      <CardHeader>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm sm:text-base text-foreground">
            Citizen Eligibility Parameters
          </h3>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </CardHeader>

      <CardContent className="space-y-4 text-xs sm:text-sm">
        {/* Domicile State */}
        <div className="space-y-1.5">
          <label htmlFor="scheme-state-select" className="font-semibold text-foreground block">
            Domicile State
          </label>
          <select
            id="scheme-state-select"
            value={profile.stateCode}
            onChange={(e) => onChangeProfile({ ...profile, stateCode: e.target.value })}
            className="w-full p-2.5 bg-card border border-border rounded-lg text-foreground focus-visible:ring-2 focus-visible:ring-primary outline-none"
          >
            <option value="AP" className="bg-card text-foreground">Andhra Pradesh</option>
            <option value="TS" className="bg-card text-foreground">Telangana</option>
            <option value="KA" className="bg-card text-foreground">Karnataka</option>
            <option value="TN" className="bg-card text-foreground">Tamil Nadu</option>
            <option value="MH" className="bg-card text-foreground">Maharashtra</option>
            <option value="DL" className="bg-card text-foreground">Delhi (NCT)</option>
          </select>
        </div>

        {/* Annual Family Income */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="scheme-income-input" className="font-semibold text-foreground">
              Annual Family Income:
            </label>
            <span className="font-mono font-bold text-primary">
              ₹{(profile.annualFamilyIncome / 100000).toFixed(2)} Lakhs
            </span>
          </div>
          <input
            id="scheme-income-input"
            type="range"
            min={50000}
            max={1000000}
            step={25000}
            value={profile.annualFamilyIncome}
            onChange={(e) =>
              onChangeProfile({
                ...profile,
                annualFamilyIncome: Number(e.target.value),
              })
            }
            className="w-full accent-primary cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-muted">
            <span>₹50K</span>
            <span>₹5 Lakhs</span>
            <span>₹10 Lakhs</span>
          </div>
        </div>

        {/* Education Level */}
        <div className="space-y-1.5">
          <label htmlFor="scheme-education-select" className="font-semibold text-foreground block">
            Enrolled Education Level
          </label>
          <select
            id="scheme-education-select"
            value={profile.educationLevel}
            onChange={(e) =>
              onChangeProfile({ ...profile, educationLevel: e.target.value })
            }
            className="w-full p-2.5 bg-card border border-border rounded-lg text-foreground focus-visible:ring-2 focus-visible:ring-primary outline-none"
          >
            <option value="secondary" className="bg-card text-foreground">10th Class (Secondary)</option>
            <option value="higher_secondary" className="bg-card text-foreground">12th / Intermediate</option>
            <option value="diploma" className="bg-card text-foreground">Polytechnic / Diploma</option>
            <option value="undergraduate" className="bg-card text-foreground">Undergraduate (B.Tech, B.Sc, B.A)</option>
            <option value="postgraduate" className="bg-card text-foreground">Postgraduate (M.Tech, M.Sc, MCA)</option>
          </select>
        </div>

        {/* Gender */}
        <div className="space-y-1.5">
          <label htmlFor="scheme-gender-select" className="font-semibold text-foreground block">
            Gender
          </label>
          <select
            id="scheme-gender-select"
            value={profile.gender}
            onChange={(e) => onChangeProfile({ ...profile, gender: e.target.value })}
            className="w-full p-2.5 bg-card border border-border rounded-lg text-foreground focus-visible:ring-2 focus-visible:ring-primary outline-none"
          >
            <option value="female" className="bg-card text-foreground">Female</option>
            <option value="male" className="bg-card text-foreground">Male</option>
            <option value="other" className="bg-card text-foreground">Other</option>
          </select>
        </div>

        {/* Social Category */}
        <div className="space-y-1.5">
          <label htmlFor="scheme-category-select" className="font-semibold text-foreground block">
            Social Reservation Category
          </label>
          <select
            id="scheme-category-select"
            value={profile.category}
            onChange={(e) => onChangeProfile({ ...profile, category: e.target.value })}
            className="w-full p-2.5 bg-card border border-border rounded-lg text-foreground focus-visible:ring-2 focus-visible:ring-primary outline-none"
          >
            <option value="BC-A" className="bg-card text-foreground">BC-A (Backward Class A)</option>
            <option value="BC-B" className="bg-card text-foreground">BC-B (Backward Class B)</option>
            <option value="SC" className="bg-card text-foreground">SC (Scheduled Caste)</option>
            <option value="ST" className="bg-card text-foreground">ST (Scheduled Tribe)</option>
            <option value="EWS" className="bg-card text-foreground">EWS (Economically Weaker Section)</option>
            <option value="General" className="bg-card text-foreground">General / Open Category</option>
          </select>
        </div>
      </CardContent>
    </Card>
  );
};
