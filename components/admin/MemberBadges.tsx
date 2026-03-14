// Composant pour afficher les badges des membres (VIP Élite, Modérateur Junior, etc.)
import { getRoleBadgeClassName, getRoleBadgeLabel } from "@/lib/roleBadgeSystem";

interface MemberBadgesProps {
  badges: string[];
  isVip?: boolean;
  isModeratorJunior?: boolean;
  isModeratorMentor?: boolean;
}

export default function MemberBadges({ 
  badges, 
  isVip, 
  isModeratorJunior, 
  isModeratorMentor 
}: MemberBadgesProps) {
  const allBadges = [
    ...(isVip ? ["VIP Élite"] : []),
    ...(isModeratorJunior ? ["Modérateur Junior"] : []),
    ...(isModeratorMentor ? ["Modérateur Mentor"] : []),
    ...badges,
  ].filter((badge, index, self) => self.indexOf(badge) === index); // Supprimer les doublons

  if (allBadges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {allBadges.map((badge) => {
        return (
          <span key={badge} className={getRoleBadgeClassName(badge)}>
            {getRoleBadgeLabel(badge)}
          </span>
        );
      })}
    </div>
  );
}


















