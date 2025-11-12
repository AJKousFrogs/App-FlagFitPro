// Real International Flag Football Team Data
// Updated with actual player names, jersey numbers, and nationalities

export const REAL_TEAM_DATA = {
  // Players organized by position
  players: {
    quarterback: [
      {
        id: "vince_machi",
        name: "Vince Machi",
        jersey: 10,
        position: "QB",
        nationality: "🇺🇸🇬🇧",
        country: "USA/GBR",
        isPrimary: true,
        stats: {
          completionPercentage: 68.5,
          touchdownPasses: 24,
          passingYards: 2847,
          interceptions: 6,
          qbRating: 142.3,
        },
      },
      {
        id: "oscar_broge",
        name: "Oscar Omöe Broge-Starck",
        jersey: 0,
        position: "WR/QB2",
        nationality: "🇩🇰",
        country: "DNK",
        isPrimary: false,
        stats: {
          completionPercentage: 71.2,
          touchdownPasses: 8,
          passingYards: 892,
          interceptions: 2,
          qbRating: 128.7,
        },
      },
    ],
    center: [
      {
        id: "aljosa_kous",
        name: "Aljoša Kous",
        jersey: 55,
        position: "C",
        nationality: "🇸🇮",
        country: "SVN",
        isPrimary: true,
        stats: {
          snapAccuracy: 98.7,
          protectionRating: 9.2,
          rushingYards: 0,
          penalties: 1,
        },
      },
      {
        id: "tihomir_todorov",
        name: "Tihomir Todorov",
        jersey: 17,
        position: "WR/C",
        nationality: "🇷🇸",
        country: "SRB",
        isPrimary: false,
        stats: {
          snapAccuracy: 94.3,
          protectionRating: 8.8,
          receptions: 18,
          receivingYards: 245,
        },
      },
    ],
    wideReceivers: [
      {
        id: "valentin_ehrenfried",
        name: "Valentin Ehrenfried",
        jersey: 22,
        position: "WR",
        nationality: "🇦🇹",
        country: "AUT",
        stats: {
          receptions: 42,
          receivingYards: 687,
          touchdowns: 9,
          averageYAC: 8.3,
        },
      },
      {
        id: "aleks_bordon",
        name: "Aleks Bordon",
        jersey: 9,
        position: "WR",
        nationality: "🇸🇮",
        country: "SVN",
        stats: {
          receptions: 38,
          receivingYards: 612,
          touchdowns: 7,
          averageYAC: 7.9,
        },
      },
      {
        id: "august_ilkjaer",
        name: "August Ilkjær",
        jersey: 84,
        position: "WR",
        nationality: "🇩🇰",
        country: "DNK",
        stats: {
          receptions: 35,
          receivingYards: 578,
          touchdowns: 6,
          averageYAC: 9.1,
        },
      },
      {
        id: "joao_maioto",
        name: "Joao Maioto",
        jersey: 1,
        position: "WR",
        nationality: "🇵🇹",
        country: "PRT",
        stats: {
          receptions: 29,
          receivingYards: 445,
          touchdowns: 5,
          averageYAC: 7.2,
        },
      },
      {
        id: "matheus_silva",
        name: "Matheus Silva",
        jersey: 14,
        position: "WR",
        nationality: "🇧🇷",
        country: "BRA",
        stats: {
          receptions: 31,
          receivingYards: 398,
          touchdowns: 4,
          averageYAC: 6.8,
        },
      },
      {
        id: "mohamed_tazi",
        name: "Mohamed Tazi",
        jersey: 88,
        position: "WR/DB",
        nationality: "🇲🇦",
        country: "MAR",
        stats: {
          receptions: 22,
          receivingYards: 334,
          touchdowns: 3,
          interceptions: 4,
        },
      },
      {
        id: "nils_linder",
        name: "Nils Linder",
        jersey: 89,
        position: "WR/Blitz",
        nationality: "🇩🇪",
        country: "DEU",
        stats: {
          receptions: 18,
          receivingYards: 287,
          touchdowns: 2,
          sacks: 6,
        },
      },
      {
        id: "goran_zec",
        name: "Goran Zec",
        jersey: 5,
        position: "DB/WR",
        nationality: "🇷🇸",
        country: "SRB",
        stats: {
          receptions: 15,
          receivingYards: 198,
          touchdowns: 1,
          interceptions: 7,
        },
      },
      {
        id: "james_lightbody",
        name: "James Lightbody",
        jersey: 4,
        position: "Blitz/WR",
        nationality: "🇬🇧",
        country: "GBR",
        stats: {
          receptions: 12,
          receivingYards: 156,
          touchdowns: 1,
          sacks: 8,
        },
      },
    ],
    defensive: [
      {
        id: "lorenzo_scaperrotta",
        name: "Lorenzo Scaperrotta",
        jersey: 21,
        position: "DB",
        nationality: "🇮🇹",
        country: "ITA",
        stats: {
          interceptions: 9,
          passBreakups: 15,
          tackles: 34,
          touchdownsAllowed: 2,
        },
      },
      {
        id: "alessio_sollevanti",
        name: "Alessio Sollevanti",
        jersey: 3,
        position: "DB",
        nationality: "🇮🇹",
        country: "ITA",
        stats: {
          interceptions: 7,
          passBreakups: 12,
          tackles: 28,
          touchdownsAllowed: 3,
        },
      },
      {
        id: "nils_just",
        name: "Nils Just",
        jersey: 7,
        position: "DB",
        nationality: "🇩🇪",
        country: "DEU",
        stats: {
          interceptions: 6,
          passBreakups: 18,
          tackles: 31,
          touchdownsAllowed: 1,
        },
      },
      {
        id: "luca_bultmann",
        name: "Luca Bultmann",
        jersey: 19,
        position: "DB",
        nationality: "🇩🇪",
        country: "DEU",
        stats: {
          interceptions: 5,
          passBreakups: 14,
          tackles: 26,
          touchdownsAllowed: 2,
        },
      },
      {
        id: "daniel_gaiger",
        name: "Daniel Gaiger",
        jersey: 99,
        position: "DB",
        nationality: "🇦🇹",
        country: "AUT",
        stats: {
          interceptions: 4,
          passBreakups: 11,
          tackles: 22,
          touchdownsAllowed: 3,
        },
      },
      {
        id: "samuel_ringheim",
        name: "Samuel Ringheim",
        jersey: 13,
        position: "Blitz/DB",
        nationality: "🇩🇰",
        country: "DNK",
        stats: {
          sacks: 12,
          interceptions: 3,
          tackles: 38,
          forcedFumbles: 2,
        },
      },
      {
        id: "matthew_mcconnell",
        name: "Matthew McConnell",
        jersey: 8,
        position: "Blitz/DB",
        nationality: "🇮🇪",
        country: "IRL",
        stats: {
          sacks: 10,
          interceptions: 2,
          tackles: 35,
          forcedFumbles: 3,
        },
      },
    ],
  },

  // Coaching staff and support team
  staff: {
    headCoach: {
      id: "ales_zaksek",
      name: "Aleš Zakšek",
      position: "Head Coach",
      nationality: "🇸🇮",
      country: "SVN",
      experience: "15 years",
      achievements: [
        "European Championship Silver Medal 2023",
        "World Championship Qualifier 2024",
        "Olympic Preparation Program Lead",
      ],
    },
    offensiveCoordinator: {
      id: "oscar_deluna",
      name: "Oscar DeLuna",
      position: "Offensive Coordinator",
      nationality: "🇪🇸",
      country: "ESP",
      experience: "12 years",
      specialties: ["Pass Game Design", "Red Zone Efficiency", "Tempo Offense"],
    },
    strengthConditioning: {
      id: "tomaz_stimec",
      name: "Tomaž Štimec",
      position: "Strength & Conditioning",
      nationality: "🇸🇮",
      country: "SVN",
      experience: "10 years",
      certifications: ["CSCS", "Olympic Lifting Coach", "Sports Nutrition"],
    },
    nutritionist: {
      id: "luka_bashota",
      name: "Luka Bashota",
      position: "Nutritionist",
      nationality: "🇭🇷",
      country: "HRV",
      experience: "8 years",
      specialties: [
        "Performance Nutrition",
        "Recovery Protocols",
        "Hydration Strategy",
      ],
    },
    videoAnalyst: {
      id: "phil_cutler",
      name: "Phil Cutler",
      position: "Video Analyst",
      nationality: "🇨🇦",
      country: "CAN",
      experience: "6 years",
      specialties: [
        "Game Film Analysis",
        "Opponent Scouting",
        "Performance Metrics",
      ],
    },
  },

  // Team information
  teamInfo: {
    name: "International Flag Football Team",
    founded: 2024,
    league: "International Flag Football League",
    homeCity: "Multiple Locations",
    colors: {
      primary: "#667eea",
      secondary: "#764ba2",
      accent: "#10b981",
    },
    motto: "Unity Through Sport",
    achievements: [
      "European Championship Runners-up 2023",
      "World Championship Qualifier 2024",
      "Olympic Preparation Team 2024-2025",
    ],
  },

  // Player statistics summary
  teamStats: {
    totalPlayers: 20,
    countries: 12,
    averageAge: 24.8,
    totalExperience: "156 years combined",
    seasonsPlayed: 3,
    winLossRecord: "28-7-2",
    olympicQualificationScore: 87.3,
  },
};

// Utility functions for working with real team data
export const getPlayersByPosition = (position) => {
  switch (position.toLowerCase()) {
    case "qb":
    case "quarterback":
      return REAL_TEAM_DATA.players.quarterback;
    case "c":
    case "center":
      return REAL_TEAM_DATA.players.center;
    case "wr":
    case "wide receiver":
    case "receiver":
      return REAL_TEAM_DATA.players.wideReceivers;
    case "db":
    case "defensive back":
    case "defense":
      return REAL_TEAM_DATA.players.defensive;
    default:
      return [];
  }
};

export const getAllPlayers = () => {
  return [
    ...REAL_TEAM_DATA.players.quarterback,
    ...REAL_TEAM_DATA.players.center,
    ...REAL_TEAM_DATA.players.wideReceivers,
    ...REAL_TEAM_DATA.players.defensive,
  ];
};

export const getPlayerById = (id) => {
  const allPlayers = getAllPlayers();
  return allPlayers.find((player) => player.id === id);
};

export const getPlayerByJersey = (jersey) => {
  const allPlayers = getAllPlayers();
  return allPlayers.find((player) => player.jersey === jersey);
};

export const getStaffMember = (position) => {
  switch (position.toLowerCase()) {
    case "head coach":
    case "hc":
      return REAL_TEAM_DATA.staff.headCoach;
    case "offensive coordinator":
    case "oc":
      return REAL_TEAM_DATA.staff.offensiveCoordinator;
    case "strength conditioning":
    case "s&c":
      return REAL_TEAM_DATA.staff.strengthConditioning;
    case "nutritionist":
      return REAL_TEAM_DATA.staff.nutritionist;
    case "video analyst":
      return REAL_TEAM_DATA.staff.videoAnalyst;
    default:
      return null;
  }
};

export const getCountryStats = () => {
  const allPlayers = getAllPlayers();
  const countries = {};

  allPlayers.forEach((player) => {
    const country = player.country;
    countries[country] = (countries[country] || 0) + 1;
  });

  // Add staff countries
  Object.values(REAL_TEAM_DATA.staff).forEach((staff) => {
    const country = staff.country;
    countries[country] = (countries[country] || 0) + 1;
  });

  return countries;
};

// Mock data replacement function
export const replaceWithRealData = (mockData) => {
  // This function can be used to replace any mock data with real team data
  if (Array.isArray(mockData)) {
    return getAllPlayers().slice(0, mockData.length);
  }

  if (mockData && mockData.name) {
    return getPlayerById(mockData.id) || getAllPlayers()[0];
  }

  return REAL_TEAM_DATA;
};
