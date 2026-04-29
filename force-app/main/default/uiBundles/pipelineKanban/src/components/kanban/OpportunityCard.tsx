import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Opportunity } from '@/types/opportunity';
import { formatCloseDate, formatCurrency, initials } from '@/utils/format';

export interface OpportunityCardProps {
  opportunity: Opportunity;
}

// Salesforce profile-photo URLs require the user's session cookie to load.
// Through `sf ui-bundle dev`'s proxy that cookie isn't injected on image
// requests, so the photo redirects to the login page and the <img> errors
// out. We skip the image entirely until a real org session is available
// and rely on the initials fallback. Production deploys (Phase 6) where
// the bundle runs inside Lightning will have the cookie and the avatar
// will render.
const ALLOW_PROFILE_PHOTOS = import.meta.env.PROD;

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const { Name, Amount, CloseDate, Owner } = opportunity;

  return (
    <Card size="sm" className="hover:ring-foreground/30 transition">
      <CardHeader className="pb-1">
        <CardTitle className="line-clamp-2 text-sm font-medium">
          {Name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col text-xs text-muted-foreground">
          <span className="font-mono text-foreground">{formatCurrency(Amount)}</span>
          <span>{formatCloseDate(CloseDate)}</span>
          <span className="truncate">{Owner.Name}</span>
        </div>
        <Avatar size="sm" title={Owner.Name}>
          {ALLOW_PROFILE_PHOTOS && Owner.SmallPhotoUrl && (
            <AvatarImage src={Owner.SmallPhotoUrl} alt={Owner.Name} />
          )}
          <AvatarFallback>{initials(Owner.Name) || '?'}</AvatarFallback>
        </Avatar>
      </CardContent>
    </Card>
  );
}
