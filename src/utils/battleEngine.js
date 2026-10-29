import countryMetadata from '../data/countryMetadata.json';

// Calculate multiplier based on population
// Smaller countries ~1.0, medium ~1.1, large ~1.2 to 1.6
export function calculateMultiplier(population) {
  if (population < 8000000) return 1.0;
  if (population < 25000000) return 1.1;
  if (population < 60000000) return 1.2;
  if (population < 120000000) return 1.3;
  if (population < 250000000) return 1.4;
  if (population < 600000000) return 1.5;
  return 1.6;
}

export function formatNumber(num) {
  if (!num && num !== 0) return '0';
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatArea(areaKm2) {
  if (areaKm2 >= 1000000) {
    return `${Math.round(areaKm2 / 1000000)}M km²`;
  }
  if (areaKm2 >= 1000) {
    return `${Math.round(areaKm2 / 1000)}K km²`;
  }
  return `${areaKm2} km²`;
}

// Roll 3 dice pairs and compute points with exact decimals (e.g. 3 * 1.1 = 3.3)
export function executeDiceClash(attackerMultiplier = 1.0, defenderMultiplier = 1.0) {
  const rounds = [];
  let attackerRawPoints = 0;
  let defenderRawPoints = 0;

  for (let i = 0; i < 3; i++) {
    const aDie = Math.floor(Math.random() * 6) + 1;
    const dDie = Math.floor(Math.random() * 6) + 1;
    let diff = aDie - dDie;
    let winner = null;
    let points = 0;

    if (diff > 0) {
      winner = 'attacker';
      points = diff;
      attackerRawPoints += points;
    } else if (diff < 0) {
      winner = 'defender';
      points = Math.abs(diff);
      defenderRawPoints += points;
    } else {
      winner = 'tie';
      points = 0;
    }

    rounds.push({
      attackerDie: aDie,
      defenderDie: dDie,
      winner,
      points
    });
  }

  // Exact decimal multiplication as requested (e.g. 3 * 1.1 = 3.3)
  let finalAttackerPoints = Number((attackerRawPoints * attackerMultiplier).toFixed(1));
  let finalDefenderPoints = Number((defenderRawPoints * defenderMultiplier).toFixed(1));

  // If exact tie, tiebreaker
  if (finalAttackerPoints === finalDefenderPoints) {
    if (attackerMultiplier > defenderMultiplier) {
      finalAttackerPoints = Number((finalAttackerPoints + 0.1).toFixed(1));
    } else if (defenderMultiplier > attackerMultiplier) {
      finalDefenderPoints = Number((finalDefenderPoints + 0.1).toFixed(1));
    } else {
      if (Math.random() > 0.5) {
        finalAttackerPoints = Number((finalAttackerPoints + 0.1).toFixed(1));
      } else {
        finalDefenderPoints = Number((finalDefenderPoints + 0.1).toFixed(1));
      }
    }
  }

  const battleWinner = finalAttackerPoints > finalDefenderPoints ? 'attacker' : 'defender';

  return {
    rounds,
    attackerRawPoints,
    defenderRawPoints,
    finalAttackerPoints,
    finalDefenderPoints,
    winner: battleWinner
  };
}
