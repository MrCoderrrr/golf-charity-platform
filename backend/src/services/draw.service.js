const mongoose = require("mongoose");
const Draw = require("../models/draw.model");
const User = require("../models/user.model");
const Subscription = require("../models/subscription.model");
const Winner = require("../models/winner.model");
const PrizePool = require("../models/prizePool.model");

// Helper to generate 5 random numbers 1-45 without replacement
const generateRandomNumbers = () => {
  const nums = new Set();
  while (nums.size < 5) {
    nums.add(Math.floor(Math.random() * 45) + 1);
  }
  return Array.from(nums).sort((a, b) => a - b);
};

// Helper for algorithm generation weighted by freq
const generateAlgorithmNumbers = async () => {
  // Aggregate to find most frequent scores across all users
  const frequencyMap = {};
  for (let i = 1; i <= 45; i++) frequencyMap[i] = 0;

  // We find active subs, get their users, and count frequencies
  const activeSubs = await Subscription.find({ status: "active" }).select("userId");
  const userIds = activeSubs.map(s => s.userId);
  const users = await User.find({ _id: { $in: userIds } }).select("scores");

  users.forEach(u => {
    if (u.scores && Array.isArray(u.scores)) {
      u.scores.forEach(s => {
        if (s.score >= 1 && s.score <= 45) {
          frequencyMap[s.score]++;
        }
      });
    }
  });

  // Sort by frequency descending
  const sortedPairs = Object.entries(frequencyMap).sort((a, b) => b[1] - a[1]);
  const sortedNumbers = sortedPairs.map(p => Number(p[0]));
  
  // Pick 4 from top half (frequent), 1 from bottom half (infrequent)
  const topHalf = sortedNumbers.slice(0, 22);
  const bottomHalf = sortedNumbers.slice(22);

  const picked = new Set();
  
  // Robust picking helper
  const pickRandomFromArr = (arr, count) => {
    let internalArr = [...arr];
    for (let i = 0; i < count; i++) {
        if (internalArr.length === 0) break;
        const idx = Math.floor(Math.random() * internalArr.length);
        picked.add(internalArr[idx]);
        internalArr.splice(idx, 1);
    }
  };

  pickRandomFromArr(topHalf, 4);
  pickRandomFromArr(bottomHalf, 1);
  
  // Fill remaining if needed (e.g. array was empty somehow)
  while (picked.size < 5) {
    picked.add(Math.floor(Math.random() * 45) + 1);
  }

  return Array.from(picked).sort((a, b) => a - b);
};

exports.executeDraw = async (drawId, isSimulation = false) => {
  const draw = await Draw.findById(drawId);
  if (!draw) throw new Error("Draw not found");

  if (draw.status === "completed" && !isSimulation) {
    throw new Error("Draw already completed");
  }

  // 1. Generate numbers
  const drawNumbers = draw.type === "algorithm" ? await generateAlgorithmNumbers() : generateRandomNumbers();

  if (!isSimulation) {
    draw.drawNumbers = drawNumbers;
    draw.status = "completed";
  }

  // 2. Matching Engine
  const activeSubs = await Subscription.find({ status: "active" }).select("userId");
  const userIds = activeSubs.map(s => s.userId);
  const activeUsers = await User.find({ _id: { $in: userIds } });

  const winnersMap = {
    fiveMatch: [],
    fourMatch: [],
    threeMatch: []
  };

  const dbWinners = []; // For storing in DB

  for (const user of activeUsers) {
    if (!user.scores || user.scores.length === 0) continue;
    
    // Convert current user scores to simple array
    const userScoreSet = new Set(user.scores.map(s => s.score));
    let matchCount = 0;
    
    drawNumbers.forEach(n => {
      if (userScoreSet.has(n)) matchCount++;
    });

    if (matchCount === 5) {
        winnersMap.fiveMatch.push(user._id);
        dbWinners.push({ userId: user._id, matchCount: 5 });
    } else if (matchCount === 4) {
        winnersMap.fourMatch.push(user._id);
        dbWinners.push({ userId: user._id, matchCount: 4 });
    } else if (matchCount === 3) {
        winnersMap.threeMatch.push(user._id);
        dbWinners.push({ userId: user._id, matchCount: 3 });
    }
  }

  // 3. Prize Distribution
  // Calculate total amount. If it was already calculated dynamically or set manually, we use it.
  const poolBaseAmount = draw.totalPrizePoolAmount || 0;
  
  // Check if there's an existing prize pool record with a rollover that we should add
  let existingPrizePool = await PrizePool.findOne({ drawId: draw._id });
  const rolloverAmount = existingPrizePool ? existingPrizePool.rolloverAmount : 0;
  const grandTotalAmount = poolBaseAmount + rolloverAmount;

  const fiveTierTotal = (grandTotalAmount * 0.40);
  const fourTierTotal = (grandTotalAmount * 0.35);
  const threeTierTotal = (grandTotalAmount * 0.25);

  const calcPrizePerWinner = (tierTotal, count) => count > 0 ? (tierTotal / count) : 0;

  const fivePrizePerPerson = calcPrizePerWinner(fiveTierTotal, winnersMap.fiveMatch.length);
  const fourPrizePerPerson = calcPrizePerWinner(fourTierTotal, winnersMap.fourMatch.length);
  const threePrizePerPerson = calcPrizePerWinner(threeTierTotal, winnersMap.threeMatch.length);

  // 4. Update the DB
  if (!isSimulation) {
    // Save winners with split amounts
    const finalWinnerDocs = dbWinners.map(w => {
        let amt = 0;
        let tierName = "";
        if (w.matchCount === 5) { amt = fivePrizePerPerson; tierName = "grand_legacy"; }
        if (w.matchCount === 4) { amt = fourPrizePerPerson; tierName = "prestige"; }
        if (w.matchCount === 3) { amt = threePrizePerPerson; tierName = "impact"; }
        
        return {
           userId: w.userId,
           drawId: draw._id,
           matchCount: w.matchCount,
           prizeAmount: amt,
           tier: tierName,
           paymentState: "Pending",
           reviewStatus: "Pending"
        };
    });

    if (finalWinnerDocs.length > 0) {
      // It's safer to clear previous identical winners, or we just insert if this draw wasn't already calculated
      await Winner.deleteMany({ drawId: draw._id });
      await Winner.insertMany(finalWinnerDocs);
    }

    draw.winners = {
      fiveMatch: winnersMap.fiveMatch,
      fourMatch: winnersMap.fourMatch,
      threeMatch: winnersMap.threeMatch
    };
    await draw.save();

    // Upsert PrizePool
    await PrizePool.findOneAndUpdate(
        { drawId: draw._id },
        {
          totalAmount: grandTotalAmount,
          fiveMatchPool: fiveTierTotal,
          fourMatchPool: fourTierTotal,
          threeMatchPool: threeTierTotal,
          rolloverAmount: rolloverAmount // what we inherited
        },
        { upsert: true, new: true }
    );

    // 5. Carry forward logic (rollover) for next month if 0 winners in 5-match tier
    if (winnersMap.fiveMatch.length === 0 && fiveTierTotal > 0) {
        let nextMonth = draw.month + 1;
        let nextYear = draw.year;
        if (nextMonth > 12) {
           nextMonth = 1;
           nextYear += 1;
        }

        // Find the next upcoming draw
        let nextDraw = await Draw.findOne({ month: nextMonth, year: nextYear, status: { $in: ["upcoming", "pending"] } });
        
        // Ensure there is a next draw or create one
        if (!nextDraw) {
            nextDraw = await Draw.create({
                month: nextMonth,
                year: nextYear,
                drawDate: new Date(Date.UTC(nextYear, nextMonth - 1, 28)), // Approx
                status: "upcoming",
                type: draw.type,
                totalPrizePoolAmount: 0 // Webhook will add to this
            });
        }

        // Add to its PrizePool
        await PrizePool.findOneAndUpdate(
            { drawId: nextDraw._id },
            {
               rolloverFromDrawId: draw._id,
               $inc: { rolloverAmount: fiveTierTotal }
            },
            { upsert: true, new: true }
        );
    }
  }

  // Return the calculated data regardless of simulation flag
  return {
      drawId: draw._id,
      month: draw.month,
      year: draw.year,
      drawNumbers,
      isSimulation,
      grandTotalAmount,
      fiveMatch: { count: winnersMap.fiveMatch.length, pool: fiveTierTotal, perPerson: fivePrizePerPerson },
      fourMatch: { count: winnersMap.fourMatch.length, pool: fourTierTotal, perPerson: fourPrizePerPerson },
      threeMatch: { count: winnersMap.threeMatch.length, pool: threeTierTotal, perPerson: threePrizePerPerson },
  };
};
