// Sustainability Scoring System
// Calculates environmental impact based on garment type and repair type

const GARMENT_DATA = {
  cotton: {
    name: 'Cotton',
    waterPerGarment: 2700, // liters
    co2PerGarment: 1.5, // kg
    wastePerGarment: 0.2 // kg
  },
  polyester: {
    name: 'Polyester',
    waterPerGarment: 1800,
    co2PerGarment: 2.5,
    wastePerGarment: 0.3
  },
  denim: {
    name: 'Denim',
    waterPerGarment: 7000,
    co2PerGarment: 3.0,
    wastePerGarment: 0.4
  },
  wool: {
    name: 'Wool',
    waterPerGarment: 4000,
    co2PerGarment: 2.0,
    wastePerGarment: 0.25
  },
  silk: {
    name: 'Silk',
    waterPerGarment: 2700,
    co2PerGarment: 1.8,
    wastePerGarment: 0.15
  },
  linen: {
    name: 'Linen',
    waterPerGarment: 1800,
    co2PerGarment: 1.2,
    wastePerGarment: 0.1
  },
  synthetic: {
    name: 'Synthetic',
    waterPerGarment: 1500,
    co2PerGarment: 3.0,
    wastePerGarment: 0.35
  },
  blended: {
    name: 'Blended',
    waterPerGarment: 3000,
    co2PerGarment: 2.2,
    wastePerGarment: 0.25
  }
};

const REPAIR_MULTIPLIERS = {
  repair: {
    name: 'Repair',
    scoreMultiplier: 1.0,
    impactMultiplier: 1.0,
    description: 'Fix tears, holes, and damage'
  },
  alteration: {
    name: 'Alteration',
    scoreMultiplier: 0.8,
    impactMultiplier: 0.8,
    description: 'Adjust fit and size'
  },
  stitching: {
    name: 'Custom Stitching',
    scoreMultiplier: 0.6,
    impactMultiplier: 0.6,
    description: 'Create custom designs'
  }
};

const BADGES = {
  firstRepair: {
    id: 'first_repair',
    name: 'First Step',
    description: 'Complete your first repair',
    icon: '🌱',
    requirement: 1
  },
  ecoWarrior: {
    id: 'eco_warrior',
    name: 'Eco Warrior',
    description: 'Complete 10 repairs',
    icon: '♻️',
    requirement: 10
  },
  waterSaver: {
    id: 'water_saver',
    name: 'Water Saver',
    description: 'Save 50,000 liters of water',
    icon: '💧',
    requirement: 50000,
    type: 'water'
  },
  carbonNeutral: {
    id: 'carbon_neutral',
    name: 'Carbon Neutral',
    description: 'Reduce 50 kg of CO2',
    icon: '🌍',
    requirement: 50,
    type: 'co2'
  },
  wasteLess: {
    id: 'waste_less',
    name: 'Waste Less',
    description: 'Prevent 10 kg of waste',
    icon: '🗑️',
    requirement: 10,
    type: 'waste'
  },
  fashionista: {
    id: 'fashionista',
    name: 'Fashionista',
    description: 'Complete 50 repairs',
    icon: '👗',
    requirement: 50
  },
  legendaryTailor: {
    id: 'legendary_tailor',
    name: 'Legendary Tailor',
    description: 'Earn 10,000 points',
    icon: '👑',
    requirement: 10000,
    type: 'points'
  }
};

/**
 * Calculate sustainability score and environmental impact
 * @param {string} garmentType - Type of garment (cotton, polyester, etc.)
 * @param {string} repairType - Type of repair (repair, alteration, stitching)
 * @returns {object} Score and impact data
 */
function calculateSustainabilityScore(garmentType, repairType) {
  const garment = GARMENT_DATA[garmentType.toLowerCase()] || GARMENT_DATA.cotton;
  const repair = REPAIR_MULTIPLIERS[repairType.toLowerCase()] || REPAIR_MULTIPLIERS.repair;

  // Base score calculation (0-100)
  const baseScore = 50; // Starting score
  const garmentImpactScore = Math.min(50, (garment.waterPerGarment / 100)); // Up to 50 points
  const repairScore = baseScore + garmentImpactScore * repair.scoreMultiplier;
  const finalScore = Math.min(100, Math.round(repairScore));

  // Calculate environmental impact
  const waterSaved = Math.round(garment.waterPerGarment * repair.impactMultiplier);
  const co2Reduced = Math.round(garment.co2PerGarment * repair.impactMultiplier * 10) / 10;
  const wasteReduced = Math.round(garment.wastePerGarment * repair.impactMultiplier * 100) / 100;

  // Calculate reward points
  const rewardPoints = Math.round(finalScore * 1.5); // 1.5x multiplier for points

  return {
    score: finalScore,
    rewardPoints,
    impact: {
      waterSaved,
      co2Reduced,
      wasteReduced
    },
    garmentType: garment.name,
    repairType: repair.name,
    messages: generateMessages(waterSaved, co2Reduced, wasteReduced, finalScore)
  };
}

/**
 * Generate user-friendly messages about environmental impact
 */
function generateMessages(water, co2, waste, score) {
  const messages = [];

  if (water > 0) {
    messages.push(`💧 You saved ${water.toLocaleString()} liters of water`);
  }

  if (co2 > 0) {
    messages.push(`🌍 You reduced ${co2} kg of CO2 emissions`);
  }

  if (waste > 0) {
    messages.push(`🗑️ You prevented ${waste} kg of textile waste`);
  }

  // Add motivational message based on score
  if (score >= 90) {
    messages.push('🌟 Excellent! You\'re an environmental champion!');
  } else if (score >= 75) {
    messages.push('🎉 Great job! You\'re making a real difference!');
  } else if (score >= 60) {
    messages.push('👍 Good work! Keep up the sustainable choices!');
  } else {
    messages.push('🌱 Every repair counts towards a better planet!');
  }

  return messages;
}

/**
 * Check which badges user has earned
 * @param {object} userStats - User statistics
 * @returns {array} Array of earned badges
 */
function checkBadges(userStats) {
  const earnedBadges = [];

  // First Repair
  if (userStats.totalRepairs >= BADGES.firstRepair.requirement) {
    earnedBadges.push(BADGES.firstRepair);
  }

  // Eco Warrior
  if (userStats.totalRepairs >= BADGES.ecoWarrior.requirement) {
    earnedBadges.push(BADGES.ecoWarrior);
  }

  // Water Saver
  if (userStats.totalWaterSaved >= BADGES.waterSaver.requirement) {
    earnedBadges.push(BADGES.waterSaver);
  }

  // Carbon Neutral
  if (userStats.totalCO2Reduced >= BADGES.carbonNeutral.requirement) {
    earnedBadges.push(BADGES.carbonNeutral);
  }

  // Waste Less
  if (userStats.totalWasteReduced >= BADGES.wasteLess.requirement) {
    earnedBadges.push(BADGES.wasteLess);
  }

  // Fashionista
  if (userStats.totalRepairs >= BADGES.fashionista.requirement) {
    earnedBadges.push(BADGES.fashionista);
  }

  // Legendary Tailor
  if (userStats.totalPoints >= BADGES.legendaryTailor.requirement) {
    earnedBadges.push(BADGES.legendaryTailor);
  }

  return earnedBadges;
}

/**
 * Get all available badges
 */
function getAllBadges() {
  return Object.values(BADGES);
}

/**
 * Get garment types
 */
function getGarmentTypes() {
  return Object.entries(GARMENT_DATA).map(([key, value]) => ({
    id: key,
    name: value.name
  }));
}

/**
 * Get repair types
 */
function getRepairTypes() {
  return Object.entries(REPAIR_MULTIPLIERS).map(([key, value]) => ({
    id: key,
    name: value.name,
    description: value.description
  }));
}

module.exports = {
  calculateSustainabilityScore,
  checkBadges,
  getAllBadges,
  getGarmentTypes,
  getRepairTypes,
  GARMENT_DATA,
  REPAIR_MULTIPLIERS,
  BADGES
};
