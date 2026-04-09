import Link from "next/link";

import { RelationshipEdgeCard, RelationshipSection } from "@/components/relationship-ui";
import type { VideoRow } from "@/components/directory/directory-types";
import { normalizeVideoSessionLink } from "@/components/directory/directory-types";

export function VideoRelationshipsPanel({ video }: { video: VideoRow }) {
  const sessLinks = normalizeVideoSessionLink(video.session_recorded_as_video);
  const matchedSession = sessLinks[0]?.session;

  return (
    <div className="w-full space-y-3">
      <h2 className="text-sm font-semibold tracking-tight text-foreground">Relationships</h2>
      <div className="space-y-4">
        {matchedSession ? (
          <RelationshipSection
            title="Session match"
            relation="RECORDED_AS"
            description="Session inferred from title / metadata similarity."
          >
            {matchedSession.session_id ? (
              <Link
                href={`/directory?openSession=${encodeURIComponent(matchedSession.session_id)}`}
                className="block rounded-lg transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RelationshipEdgeCard
                  primary={matchedSession.title ?? matchedSession.session_id ?? "Session"}
                />
              </Link>
            ) : (
              <RelationshipEdgeCard
                primary={matchedSession.title ?? matchedSession.session_id ?? "Session"}
              />
            )}
          </RelationshipSection>
        ) : null}
        {video.person_appeared_in_video?.length ? (
          <RelationshipSection
            title="People"
            relation="APPEARED_IN"
            description="People detected in this video."
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {video.person_appeared_in_video.map((row, i) => {
                const pid = row.person?.person_id;
                const card = (
                  <RelationshipEdgeCard
                    primary={row.person?.full_name ?? row.person?.person_id ?? "Person"}
                    secondary={row.matched_name_variant ?? undefined}
                  />
                );
                return pid ? (
                  <Link
                    key={i}
                    href={`/directory?openPerson=${encodeURIComponent(pid)}`}
                    className="block rounded-lg transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {card}
                  </Link>
                ) : (
                  <div key={i}>{card}</div>
                );
              })}
            </div>
          </RelationshipSection>
        ) : null}
        {!matchedSession && !video.person_appeared_in_video?.length ? (
          <p className="text-sm text-muted-foreground">No linked session or people for this recording.</p>
        ) : null}
      </div>
    </div>
  );
}
