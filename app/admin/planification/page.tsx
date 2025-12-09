"use client";

import { useState } from "react";
import Link from "next/link";

// Mock data
const members = [
  { id: 1, name: "Clara", avatar: "https://placehold.co/40x40?text=C" },
  { id: 2, name: "ThT...", avatar: "https://placehold.co/40x40?text=T" },
  { id: 3, name: "Nexou31", avatar: "https://placehold.co/40x40?text=N" },
  { id: 4, name: "Red", avatar: "https://placehold.co/40x40?text=R" },
];

const events = [
  {
    id: 1,
    date: "2024-04-11",
    title: "Soirée communautaire",
    category: "Soirée communautaire",
  },
  {
    id: 2,
    date: "2024-04-15",
    title: "Spotlight Clara",
    category: "Spotlight",
  },
];

const categories = [
  "Spotlight",
  "Soirée communautaire",
  "Atelier créateur",
  "Aventura 2025",
];

const daysOfWeek = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export default function PlanificationPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Spotlight",
    selectedDate: new Date(),
    invitedMembers: [] as typeof members,
    image: null as File | null,
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const filteredMembers = members.filter(
    (member) =>
      !formData.invitedMembers.some((invited) => invited.id === member.id) &&
      member.name.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const handleAddMember = (member: typeof members[0]) => {
    setFormData({
      ...formData,
      invitedMembers: [...formData.invitedMembers, member],
    });
    setMemberSearch("");
    setShowMemberDropdown(false);
  };

  const handleRemoveMember = (memberId: number) => {
    setFormData({
      ...formData,
      invitedMembers: formData.invitedMembers.filter((m) => m.id !== memberId),
    });
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setFormData({ ...formData, selectedDate: date });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Jours du mois précédent (pour remplir la première semaine)
    const prevMonth = new Date(year, month - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, daysInPrevMonth - i));
    }

    // Jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    // Jours du mois suivant (pour remplir la dernière semaine)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push(new Date(year, month + 1, day));
    }

    return days;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getMonthName = (date: Date) => {
    const months = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ];
    return months[date.getMonth()];
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return events.filter((event) => event.date === dateStr);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, image: e.target.files[0] });
    }
  };

  const handleSubmit = () => {
    alert("Événement ajouté au calendrier !");
    // Reset form
    setFormData({
      title: "",
      description: "",
      category: "Spotlight",
      selectedDate: new Date(),
      invitedMembers: [],
      image: null,
    });
    setSelectedDate(null);
  };

  const navLinks = [
    { href: "/admin/dashboard", label: "Dashboard Général" },
    { href: "/admin/membres", label: "Gestion des Membres" },
    { href: "/admin/evaluation-mensuelle", label: "Évaluation Mensuelle" },
    { href: "/admin/spotlight", label: "Gestion Spotlight" },
    { href: "/admin/planification", label: "Planification Évènements", active: true },
  ];

  const calendarDays = getDaysInMonth(currentMonth);

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white">
      <div className="p-8">
        {/* Header avec navigation */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-6">
            Planification Événements
          </h1>
          <div className="flex flex-wrap gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  link.active
                    ? "bg-[#9146ff] text-white"
                    : "bg-[#1a1a1d] text-gray-300 hover:bg-[#252529] hover:text-white border border-gray-700"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Grille principale - 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COLONNE GAUCHE - FORMULAIRE */}
          <div className="space-y-6">
            <div className="bg-[#1a1a1d] border border-[#2a2a2d] rounded-lg p-6">
              {/* Upload d'image */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Image de l'événement
                </label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-[#9146ff] transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer block"
                  >
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm text-gray-400 mb-2">
                      Importer une image (webp recommandé)
                    </p>
                    <button
                      type="button"
                      className="bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      Choisir un fichier
                    </button>
                    {formData.image && (
                      <p className="text-xs text-green-400 mt-2">
                        {formData.image.name}
                      </p>
                    )}
                  </label>
                </div>
              </div>

              {/* Titre */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Titre de l'événement
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Nom de l'événement"
                  className="w-full bg-[#0e0e10] border border-[#2a2a2d] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff]"
                />
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Description de l'événement"
                  rows={4}
                  className="w-full bg-[#0e0e10] border border-[#2a2a2d] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff] resize-none"
                />
              </div>

              {/* Catégorie */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Catégorie
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full bg-[#0e0e10] border border-[#2a2a2d] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#9146ff]"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Inviter des membres */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Inviter des membres
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => {
                      setMemberSearch(e.target.value);
                      setShowMemberDropdown(true);
                    }}
                    onFocus={() => setShowMemberDropdown(true)}
                    placeholder="Rechercher un membre..."
                    className="w-full bg-[#0e0e10] border border-[#2a2a2d] rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff]"
                  />
                  {showMemberDropdown && filteredMembers.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-[#1a1a1d] border border-[#2a2a2d] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredMembers.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => handleAddMember(member)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#0e0e10] transition-colors text-left"
                        >
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="text-white">{member.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Membres invités */}
                {formData.invitedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.invitedMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 bg-[#0e0e10] border border-[#2a2a2d] rounded-lg px-3 py-2"
                      >
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-sm text-white">{member.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-gray-400 hover:text-white transition-colors ml-1"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bouton Ajouter */}
              <button
                onClick={handleSubmit}
                className="w-full bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Ajouter au calendrier
              </button>
            </div>
          </div>

          {/* COLONNE DROITE - CALENDRIER */}
          <div className="space-y-6">
            {/* Grand calendrier */}
            <div className="bg-[#1a1a1d] border border-[#2a2a2d] rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => navigateMonth("prev")}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <h2 className="text-xl font-semibold text-white">
                  {getMonthName(currentMonth)} {currentMonth.getFullYear()}
                </h2>
                <button
                  onClick={() => navigateMonth("next")}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>

              {/* Jours de la semaine */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {daysOfWeek.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-semibold text-gray-400 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Grille des jours */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  const dayEvents = getEventsForDate(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isCurrentMonthDay = isCurrentMonth(day);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <button
                      key={index}
                      onClick={() => handleDateSelect(day)}
                      className={`aspect-square p-2 rounded-lg text-sm transition-colors relative ${
                        !isCurrentMonthDay
                          ? "text-gray-600"
                          : isSelected
                          ? "bg-[#9146ff] text-white"
                          : isToday
                          ? "bg-[#9146ff]/20 text-white border border-[#9146ff]"
                          : "text-gray-300 hover:bg-[#0e0e10]"
                      }`}
                    >
                      <div className="text-center">{day.getDate()}</div>
                      {dayEvents.length > 0 && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                          <div className="w-1 h-1 bg-[#9146ff] rounded-full"></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aperçu Agenda */}
            <div className="bg-[#1a1a1d] border border-[#2a2a2d] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Aperçu</h3>
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="bg-[#0e0e10] border border-[#2a2a2d] rounded-lg p-3"
                  >
                    <div className="text-xs text-gray-400 mb-1">
                      {new Date(event.date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                      })}
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {event.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {event.category}
                    </div>
                  </div>
                ))}
                {events.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    Aucun événement prévu
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


