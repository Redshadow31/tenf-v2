// Composant pour afficher les badges des membres (VIP Élite, Modérateur Junior, etc.)

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
        let badgeClass = "px-2 py-0.5 rounded text-xs font-semibold";
        
        // Styles selon le type de badge
        if (badge === "VIP Élite") {
          badgeClass += " bg-gradient-to-r from-[#9146ff] to-[#5a32b4] text-white";
        } else if (badge === "Modérateur Junior") {
          badgeClass += " bg-blue-900/30 text-blue-300 border border-blue-500/30";
        } else if (badge === "Modérateur Mentor") {
          badgeClass += " bg-purple-900/30 text-purple-300 border border-purple-500/30";
        } else {
          badgeClass += " bg-gray-700/30 text-gray-300 border border-gray-600/30";
        }

        return (
          <span key={badge} className={badgeClass}>
            {badge}
          </span>
        );
      })}
    </div>
  );
}










