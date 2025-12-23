// Official 2026-2027 International Flag Football Tournament Schedule
// Real tournament dates and locations for the international team

export const TOURNAMENT_SCHEDULE = {
  // 2026 Season
  2026: [
    {
      id: "adria_bowl_2026",
      name: "Adria Bowl",
      location: "Poreč, Croatia",
      country: "HRV",
      flag: "🇭🇷",
      startDate: "2026-04-11",
      endDate: "2026-04-12",
      type: "Regional Championship",
      status: "upcoming",
      description: "Flag football tournament in Poreč, Croatia",
      venue: "TBD",
      expectedTeams: "TBD",
      registrationDeadline: "TBD",
      prizePool: "TBD",
      qualificationPoints: "TBD",
    },
    {
      id: "copenhagen_bowl_2026",
      name: "Copenhagen Bowl",
      location: "Copenhagen, Denmark",
      country: "DNK",
      flag: "🇩🇰",
      startDate: "2026-05-23",
      endDate: "2026-05-24",
      type: "International Championship",
      status: "upcoming",
      description: "Flag football tournament in Copenhagen, Denmark",
      venue: "TBD",
      expectedTeams: "TBD",
      registrationDeadline: "TBD",
      prizePool: "TBD",
      qualificationPoints: "TBD",
    },
    {
      id: "big_bowl_2026",
      name: "Big Bowl",
      location: "Frankfurt, Germany",
      country: "DEU",
      flag: "🇩🇪",
      startDate: "2026-06-06",
      endDate: "2026-06-07",
      type: "Major Championship",
      status: "upcoming",
      description: "Flag football tournament in Frankfurt, Germany",
      venue: "TBD",
      expectedTeams: "TBD",
      registrationDeadline: "TBD",
      prizePool: "TBD",
      qualificationPoints: "TBD",
    },
    {
      id: "capital_bowl_2026",
      name: "Capital Bowl",
      location: "Paris, France",
      country: "FRA",
      flag: "🇫🇷",
      startDate: "2026-07-04",
      endDate: "2026-07-05",
      type: "Elite Championship",
      status: "upcoming",
      description: "Flag football tournament in Paris, France",
      venue: "TBD",
      expectedTeams: "TBD",
      registrationDeadline: "TBD",
      prizePool: "TBD",
      qualificationPoints: "TBD",
    },
    {
      id: "elite_8_2026",
      name: "Elite 8",
      location: "Slovenia",
      country: "SVN",
      flag: "🇸🇮",
      startDate: "2026-09-18",
      endDate: "2026-09-20",
      type: "Elite Invitational",
      status: "upcoming",
      description: "Elite invitation-only tournament in Slovenia",
      venue: "TBD",
      expectedTeams: 8,
      registrationDeadline: "Invitation Only",
      prizePool: "TBD",
      qualificationPoints: "TBD",
      isInvitationOnly: true,
    },
  ],

  // 2027 Season
  2027: [
    {
      id: "flagging_new_year_2027",
      name: "Flagging New Year",
      location: "Ravenscraig, Scotland",
      country: "GBR",
      flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
      startDate: "TBD",
      endDate: "TBD",
      month: "January",
      type: "New Year Championship",
      status: "upcoming",
      description: "New Year flag football tournament in Scotland",
      venue: "TBD",
      expectedTeams: "TBD",
      registrationDeadline: "TBD",
      prizePool: "TBD",
      qualificationPoints: "TBD",
      note: "Date TBD January 2027",
    },
    {
      id: "flag_tech_2027",
      name: "Flag Tech",
      location: "Spain",
      country: "ESP",
      flag: "🇪🇸",
      startDate: "TBD",
      endDate: "TBD",
      month: "February",
      type: "Technology & Innovation Tournament",
      status: "upcoming",
      description: "Flag football tournament in Spain",
      venue: "TBD",
      expectedTeams: "TBD",
      registrationDeadline: "TBD",
      prizePool: "TBD",
      qualificationPoints: "TBD",
      note: "Date TBD February 2027",
    },
  ],
};

// Tournament types and their characteristics
export const TOURNAMENT_TYPES = {
  "Regional Championship": {
    color: "#10b981",
    icon: "🏆",
    description: "Regional level competition",
  },
  "International Championship": {
    color: "#3b82f6",
    icon: "🌍",
    description: "International level competition",
  },
  "Major Championship": {
    color: "#8b5cf6",
    icon: "⭐",
    description: "Major championship event",
  },
  "Elite Championship": {
    color: "#f59e0b",
    icon: "👑",
    description: "Elite level championship",
  },
  "Elite Invitational": {
    color: "#ef4444",
    icon: "💎",
    description: "Exclusive invitation-only event",
  },
  "New Year Championship": {
    color: "#06b6d4",
    icon: "🎊",
    description: "New Year celebration tournament",
  },
  "Technology & Innovation Tournament": {
    color: "#84cc16",
    icon: "⚡",
    description: "Innovation-focused tournament",
  },
};

// Helper functions
export const getAllTournaments = () => {
  return [...TOURNAMENT_SCHEDULE["2026"], ...TOURNAMENT_SCHEDULE["2027"]];
};

export const getTournamentsByYear = (year) => {
  return TOURNAMENT_SCHEDULE[year] || [];
};

export const getNextTournament = () => {
  const now = new Date();
  const allTournaments = getAllTournaments();

  const upcomingTournaments = allTournaments
    .filter((tournament) => {
      if (tournament.startDate === "TBD") {
        // For TBD tournaments, consider them as upcoming
        return true;
      }
      const tournamentDate = new Date(tournament.startDate);
      return tournamentDate > now;
    })
    .sort((a, b) => {
      if (a.startDate === "TBD" && b.startDate === "TBD") {
        return 0;
      }
      if (a.startDate === "TBD") {
        return 1;
      }
      if (b.startDate === "TBD") {
        return -1;
      }
      return new Date(a.startDate) - new Date(b.startDate);
    });

  return upcomingTournaments[0] || null;
};

export const getTournamentById = (id) => {
  const allTournaments = getAllTournaments();
  return allTournaments.find((tournament) => tournament.id === id);
};

export const getDaysUntilTournament = (tournament) => {
  if (tournament.startDate === "TBD") {
    return null;
  }

  const now = new Date();
  const tournamentDate = new Date(tournament.startDate);
  const diffTime = tournamentDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
};

export const formatTournamentDate = (tournament) => {
  if (tournament.startDate === "TBD") {
    return `${tournament.month} 2027 (Date TBD)`;
  }

  const startDate = new Date(tournament.startDate);
  const endDate = new Date(tournament.endDate);

  const options = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };

  if (tournament.startDate === tournament.endDate) {
    return startDate.toLocaleDateString("en-US", options);
  } else {
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const month = startDate.toLocaleDateString("en-US", { month: "long" });
    const year = startDate.getFullYear();

    // Format with ordinal suffixes (11th, 12th, etc.)
    const getOrdinalSuffix = (day) => {
      if (day > 3 && day < 21) {
        return day + "th";
      }
      switch (day % 10) {
        case 1:
          return day + "st";
        case 2:
          return day + "nd";
        case 3:
          return day + "rd";
        default:
          return day + "th";
      }
    };

    const startDayFormatted = getOrdinalSuffix(startDay);
    const endDayFormatted = getOrdinalSuffix(endDay);

    return `${startDayFormatted} - ${endDayFormatted} of ${month} ${year}`;
  }
};

export const getTournamentTypeInfo = (type) => {
  return (
    TOURNAMENT_TYPES[type] || {
      color: "#6b7280",
      icon: "🏟️",
      description: "Tournament",
    }
  );
};

// Tournament preparation timeline
export const getTournamentPreparation = (tournament) => {
  if (tournament.startDate === "TBD") {
    return {
      phase: "planning",
      description: "Tournament details being finalized",
      tasks: [
        "Stay tuned for official announcement",
        "Prepare training schedule",
        "Monitor registration updates",
      ],
    };
  }

  const daysUntil = getDaysUntilTournament(tournament);

  if (daysUntil > 90) {
    return {
      phase: "early_preparation",
      description: "Early preparation phase",
      tasks: [
        "Focus on basic skills",
        "Build team chemistry",
        "Develop strategy",
      ],
    };
  } else if (daysUntil > 30) {
    return {
      phase: "intensive_training",
      description: "Intensive training phase",
      tasks: [
        "Advanced drills",
        "Tactical preparation",
        "Physical conditioning",
      ],
    };
  } else if (daysUntil > 7) {
    return {
      phase: "final_preparation",
      description: "Final preparation phase",
      tasks: ["Fine-tune plays", "Mental preparation", "Equipment check"],
    };
  } else {
    return {
      phase: "tournament_week",
      description: "Tournament week",
      tasks: ["Light training", "Team meetings", "Final preparations"],
    };
  }
};
