"use client";

import { useMemo, useState, useTransition } from "react";
import { Link2, Save } from "lucide-react";
import { toast } from "sonner";

import { AvatarUpload } from "@/components/settings/avatar-upload";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChipPicker, type Chip } from "@/components/wizard/chip-picker";
import { LayerCard } from "@/components/wizard/layer-card";
import { updateProfileFields } from "@/lib/actions/profile";
import {
  CATEGORY_KEYS,
  CATEGORY_LABELS,
  CATEGORY_TO_LAYER,
  DOMAIN_LAYERS,
  DOMAIN_LAYER_META,
  EXPERIENCE_LEVELS,
  EXPERIENCE_LEVEL_LABELS,
  GOAL_KEYS,
  GOAL_LABELS,
  POPULAR_CATEGORIES,
  type CategoryKey,
  type DomainLayer,
  type ExperienceLevel,
  type GoalKey,
} from "@/lib/schema/taxonomy";

type Props = {
  userId: string;
  profile: {
    display_name: string | null;
    username: string | null;
    headline: string | null;
    bio: string | null;
    country: string | null;
    location: string | null;
    timezone: string | null;
    current_role_title: string | null;
    is_public: boolean;
    experience_level: string | null;
    home_layer: string | null;
    interest_tags: string[];
    expertise_tags: string[];
    goals: string[];
    avatar_url: string | null;
    email: string | null;
  };
};

const CATEGORY_CHIPS: Chip[] = CATEGORY_KEYS.map((value) => ({
  value,
  label: CATEGORY_LABELS[value],
  group: CATEGORY_TO_LAYER[value],
}));

const GROUP_LABELS = Object.fromEntries(
  Object.entries(DOMAIN_LAYER_META).map(([key, meta]) => [
    key,
    `${meta.code} — ${meta.label}`,
  ]),
);

const GOAL_CHIPS: Chip[] = GOAL_KEYS.map((value) => ({
  value,
  label: GOAL_LABELS[value],
}));

function avatarFallback(name: string, email: string | null): string {
  return (
    (name || email || "?")
      .replace(/@.*/, "")
      .split(/[\s._-]+/)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join("") || "?"
  );
}

export function ProfileSettingsForm({ userId, profile }: Props) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [username, setUsername] = useState(profile.username ?? "");
  const [headline, setHeadline] = useState(profile.headline ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [timezone, setTimezone] = useState(profile.timezone ?? "");
  const [roleTitle, setRoleTitle] = useState(profile.current_role_title ?? "");
  const [isPublic, setIsPublic] = useState(profile.is_public);
  const [experience, setExperience] = useState<ExperienceLevel | null>(
    EXPERIENCE_LEVELS.includes(
      (profile.experience_level ?? "") as ExperienceLevel,
    )
      ? (profile.experience_level as ExperienceLevel)
      : null,
  );
  const [layer, setLayer] = useState<DomainLayer | null>(
    DOMAIN_LAYERS.includes((profile.home_layer ?? "") as DomainLayer)
      ? (profile.home_layer as DomainLayer)
      : null,
  );
  const [interests, setInterests] = useState<string[]>(profile.interest_tags);
  const [expertise, setExpertise] = useState<string[]>(profile.expertise_tags);
  const [goals, setGoals] = useState<string[]>(profile.goals);
  const [pending, start] = useTransition();
  const fallback = useMemo(
    () => avatarFallback(displayName, profile.email),
    [displayName, profile.email],
  );

  function onSave() {
    start(async () => {
      const result = await updateProfileFields({
        display_name: displayName || null,
        username: username || null,
        headline: headline || null,
        bio: bio || null,
        country: country || null,
        location: location || null,
        timezone: timezone || null,
        current_role_title: roleTitle || null,
        is_public: isPublic,
        experience_level: experience,
        home_layer: layer,
        interest_tags: interests as CategoryKey[],
        expertise_tags: expertise as CategoryKey[],
        goals: goals as GoalKey[],
      });
      if (result.ok) {
        toast.success("Profile saved.");
      } else if (result.fieldErrors) {
        const first = Object.entries(result.fieldErrors)[0];
        toast.error(`${first?.[0]}: ${first?.[1]?.[0] ?? result.error}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <Section
        title="Identity"
        description="Public name, handle, and where you live online."
      >
        <AvatarUpload
          userId={userId}
          initialUrl={profile.avatar_url}
          fallbackText={fallback}
        />
        <Grid>
          <Field label="Display name">
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Shreya Shankar"
            />
          </Field>
          <Field label="Username" hint="Lower-case, 3–39 characters.">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="shreya"
            />
          </Field>
        </Grid>
        <Field label="Headline">
          <Input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="AI-curious staff engineer @ ..."
          />
        </Field>
        <Grid>
          <Field label="Role title">
            <Input
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="Staff engineer"
            />
          </Field>
          <Field label="Country">
            <Input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="United States"
            />
          </Field>
        </Grid>
        <Grid>
          <Field label="Location">
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="San Francisco, CA"
            />
          </Field>
          <Field label="Time zone">
            <Input
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="America/Los_Angeles"
            />
          </Field>
        </Grid>
      </Section>

      <Section
        title="About"
        description="A short bio. Markdown rendering arrives with the public profile in M8."
      >
        <Field label="Bio">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder="What you work on, what you're curious about…"
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring/50 focus-visible:border-ring w-full rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:ring-3 focus-visible:outline-none"
          />
          <p className="text-muted-foreground mt-1 text-xs">
            {bio.length} / 2000
          </p>
        </Field>
      </Section>

      <Section
        title="Experience & home layer"
        description="Sets your default altitude through the curriculum."
      >
        <Field label="Experience level">
          <div className="flex flex-wrap gap-1.5">
            {EXPERIENCE_LEVELS.map((l) => {
              const on = experience === l;
              return (
                <button
                  key={l}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setExperience(on ? null : l)}
                  className={
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
                    (on
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground")
                  }
                >
                  {EXPERIENCE_LEVEL_LABELS[l]}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Home layer">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DOMAIN_LAYERS.map((value) => {
              const meta = DOMAIN_LAYER_META[value];
              return (
                <LayerCard
                  key={value}
                  code={meta.code}
                  label={meta.label}
                  tagline={meta.tagline}
                  selected={layer === value}
                  onSelect={() => setLayer(layer === value ? null : value)}
                />
              );
            })}
          </div>
        </Field>
      </Section>

      <Section
        title="Tags & goals"
        description="Drives recommendations and matchmaking. Pick from the canonical list."
      >
        <Field label="Interests" hint="What you want to learn.">
          <ChipPicker
            options={CATEGORY_CHIPS}
            value={interests}
            onChange={setInterests}
            max={20}
            popularValues={POPULAR_CATEGORIES}
            groupLabels={GROUP_LABELS}
            searchPlaceholder="Search interests…"
          />
        </Field>
        <Field label="Expertise" hint="What you can already help others with.">
          <ChipPicker
            options={CATEGORY_CHIPS}
            value={expertise}
            onChange={setExpertise}
            max={20}
            popularValues={POPULAR_CATEGORIES}
            groupLabels={GROUP_LABELS}
            searchPlaceholder="Search expertise…"
          />
        </Field>
        <Field label="Goals">
          <ChipPicker
            options={GOAL_CHIPS}
            value={goals}
            onChange={setGoals}
            searchable={false}
            max={6}
          />
        </Field>
      </Section>

      <Section
        title="Linked accounts"
        description="Connect to populate your profile and unlock notifications. Coming soon."
      >
        <div className="flex flex-wrap gap-2">
          <LinkedAccountButton icon={<Link2 className="size-4" />} label="GitHub" />
          <LinkedAccountButton icon={<Link2 className="size-4" />} label="LinkedIn" />
          <LinkedAccountButton icon={<Link2 className="size-4" />} label="X / Twitter" />
        </div>
      </Section>

      <Section
        title="Visibility"
        description="When public, your profile is reachable via /u/<username>. Notes, saves, and attempts always stay private."
      >
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="border-input text-primary focus:ring-ring/50 size-4 rounded"
          />
          <span>
            <span className="text-foreground font-medium">Public profile</span>
            <span className="text-muted-foreground ml-2 text-xs">
              {isPublic ? "Visible to anyone" : "Only you"}
            </span>
          </span>
        </label>
      </Section>

      <Section title="Danger zone" description="Permanent actions live here.">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() =>
            toast.message("Account deletion", {
              description: "Email-confirmed deletion ships in M8.",
            })
          }
        >
          Delete account
        </Button>
      </Section>

      <div className="border-border/60 bg-background/95 sticky bottom-0 -mx-4 flex items-center justify-end gap-2 border-t px-4 py-3 backdrop-blur md:mx-0">
        <Button type="button" onClick={onSave} disabled={pending} size="lg">
          <Save className="size-4" />
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-foreground text-sm font-medium">{label}</label>
      {children}
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function LinkedAccountButton({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() =>
        toast.message(`${label}`, {
          description: "Connection flow ships in a later milestone.",
        })
      }
    >
      {icon}
      Connect {label}
    </Button>
  );
}
