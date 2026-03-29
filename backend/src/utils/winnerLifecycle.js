const mongoose = require("mongoose");
const Winner = require("../models/winner.model");
const PrizePool = require("../models/prizePool.model");
const Transaction = require("../models/transaction.model");
const User = require("../models/user.model");
const Donation = require("../models/donation.model");
const Charity = require("../models/charity.model");

const REVIEW_PENDING = "pending";
const REVIEW_APPROVED = "approved";
const REVIEW_REJECTED = "rejected";

const normalizeReviewStatus = (value) => {
  const raw = String(value || "").toLowerCase();
  if (raw.startsWith("approve")) return REVIEW_APPROVED;
  if (raw.startsWith("reject")) return REVIEW_REJECTED;
  return REVIEW_PENDING;
};

const splitEvenly = (total, count) => {
  const prize = Math.max(0, Math.round(Number(total) || 0));
  if (!count || count <= 0) return [];
  const base = Math.floor(prize / count);
  const remainder = prize - base * count;
  return Array.from({ length: count }).map((_, index) => base + (index < remainder ? 1 : 0));
};

const getTierPoolAmount = (prizePool, matchCount) => {
  if (!prizePool) return 0;
  if (Number(matchCount) === 5) return Number(prizePool.fiveMatchPool || 0);
  if (Number(matchCount) === 4) return Number(prizePool.fourMatchPool || 0);
  return Number(prizePool.threeMatchPool || 0);
};

const monthKeyUTC = (date) => {
  const safe = date ? new Date(date) : new Date();
  const y = String(safe.getUTCFullYear());
  const m = String(safe.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const syncUserWinnerCaches = async (userIds, session = null) => {
  const normalizedIds = Array.from(
    new Set((userIds || []).map((id) => String(id || "")).filter(Boolean))
  );
  if (!normalizedIds.length) return;

  const aggregates = await Winner.aggregate([
    {
      $match: {
        userId: { $in: normalizedIds.map((id) => new mongoose.Types.ObjectId(id)) },
        reviewStatus: { $in: [REVIEW_APPROVED, "Approve"] },
      },
    },
    {
      $group: {
        _id: "$userId",
        totalEarnings: { $sum: { $ifNull: ["$finalPrizeAmount", "$prizeAmount"] } },
        jackpot: {
          $sum: {
            $cond: [{ $eq: ["$matchCount", 5] }, 1, 0],
          },
        },
        fourPass: {
          $sum: {
            $cond: [{ $eq: ["$matchCount", 4] }, 1, 0],
          },
        },
        threePass: {
          $sum: {
            $cond: [{ $eq: ["$matchCount", 3] }, 1, 0],
          },
        },
      },
    },
  ]).session(session || null);

  const byId = new Map(aggregates.map((row) => [String(row._id), row]));
  const ops = normalizedIds.map((id) => {
    const hit = byId.get(id);
    return {
      updateOne: {
        filter: { _id: id },
        update: {
          $set: {
            totalEarnings: Number(hit?.totalEarnings || 0),
            "wins.jackpot": Number(hit?.jackpot || 0),
            "wins.fourPass": Number(hit?.fourPass || 0),
            "wins.threePass": Number(hit?.threePass || 0),
          },
        },
      },
    };
  });

  if (ops.length) {
    await User.bulkWrite(ops, { session });
  }
};

const recalculateTierPayouts = async (drawId, matchCount, session = null) => {
  const [prizePool, winners] = await Promise.all([
    PrizePool.findOne({ drawId }).session(session || null),
    Winner.find({ drawId, matchCount }).session(session || null),
  ]);

  if (!winners.length) return [];

  const tierTotal = getTierPoolAmount(prizePool, matchCount);
  const approved = winners.filter(
    (winner) => normalizeReviewStatus(winner.reviewStatus) === REVIEW_APPROVED
  );
  const payouts = splitEvenly(tierTotal, approved.length);
  const payoutMap = new Map(approved.map((winner, index) => [String(winner._id), payouts[index] || 0]));
  const affectedUserIds = new Set();
  const now = new Date();
  const approvedUserIds = approved.map((winner) => winner.userId);
  const users = approvedUserIds.length
    ? await User.find({ _id: { $in: approvedUserIds } }).select("selectedCharity charityPercentage subscriptionId").session(session || null)
    : [];
  const userMap = new Map(users.map((user) => [String(user._id), user]));
  const winnerIds = winners.map((winner) => winner._id);
  const existingDonations = winnerIds.length
    ? await Donation.find({ winnerId: { $in: winnerIds } }).session(session || null)
    : [];
  const oldDonationIds = existingDonations.map((donation) => donation._id);
  const charityDelta = new Map();

  for (const donation of existingDonations) {
    const key = String(donation.charityId);
    charityDelta.set(key, (charityDelta.get(key) || 0) - Number(donation.amount || 0));
  }

  for (const winner of winners) {
    const reviewStatus = normalizeReviewStatus(winner.reviewStatus);
    const isApproved = reviewStatus === REVIEW_APPROVED;
    const finalPrizeAmount = isApproved ? Number(payoutMap.get(String(winner._id)) || 0) : 0;
    const user = userMap.get(String(winner.userId));
    const pct = Math.max(10, Math.min(100, Number(user?.charityPercentage || 10)));
    const selectedCharityId = user?.selectedCharity ? String(user.selectedCharity) : null;
    const donationAmount =
      isApproved && selectedCharityId ? Math.max(0, Math.round((finalPrizeAmount * pct) / 100)) : 0;
    const netPayoutAmount = Math.max(0, finalPrizeAmount - donationAmount);
    const nextStatus =
      reviewStatus === REVIEW_APPROVED
        ? "approved"
        : reviewStatus === REVIEW_REJECTED
        ? "rejected"
        : winner.proofUrl || winner.proofImage
        ? "under_review"
        : "pending";

    winner.finalPrizeAmount = finalPrizeAmount;
    winner.prizeAmount = finalPrizeAmount;
    winner.paymentState = "pending";
    winner.status = nextStatus;
    winner.verifiedAt = isApproved ? winner.verifiedAt || now : null;
    winner.paidAt = null;
    await winner.save({ session });

    await Transaction.updateMany(
      { "ref.winnerId": winner._id, type: "payout" },
      {
        $set: {
          amount: isApproved ? netPayoutAmount : Number(winner.provisionalPrizeAmount || 0),
          status: reviewStatus === REVIEW_REJECTED ? "failed" : "pending",
        },
      },
      { session }
    );

    affectedUserIds.add(String(winner.userId));
  }

  if (oldDonationIds.length) {
    await Transaction.deleteMany(
      { type: "donation", "ref.donationId": { $in: oldDonationIds } },
      { session }
    );
    await Donation.deleteMany({ _id: { $in: oldDonationIds } }).session(session || null);
  }

  const newDonationDocs = approved
    .map((winner) => {
      const user = userMap.get(String(winner.userId));
      const charityId = user?.selectedCharity ? String(user.selectedCharity) : null;
      const percentage = Math.max(10, Math.min(100, Number(user?.charityPercentage || 10)));
      const grossAmount = Number(payoutMap.get(String(winner._id)) || 0);
      const amount = charityId ? Math.max(0, Math.round((grossAmount * percentage) / 100)) : 0;
      if (!charityId || amount <= 0) return null;
      charityDelta.set(charityId, (charityDelta.get(charityId) || 0) + amount);
      return {
        userId: winner.userId,
        charityId,
        winnerId: winner._id,
        subscriptionId: user?.subscriptionId || undefined,
        drawId,
        monthKey: monthKeyUTC(winner.createdAt || now),
        amount,
        percentage,
        status: "sent",
      };
    })
    .filter(Boolean);

  const createdDonations = newDonationDocs.length
    ? await Donation.insertMany(newDonationDocs, { session })
    : [];

  if (createdDonations.length) {
    await Transaction.insertMany(
      createdDonations.map((donation) => ({
        userId: donation.userId,
        type: "donation",
        amount: donation.amount,
        currency: "USD",
        status: "completed",
        provider: "manual",
        ref: { donationId: donation._id, winnerId: donation.winnerId, drawId: donation.drawId, subscriptionId: donation.subscriptionId },
      })),
      { session }
    );
  }

  const charityOps = Array.from(charityDelta.entries())
    .filter(([, delta]) => Number(delta) !== 0)
    .map(([charityId, delta]) => ({
      updateOne: {
        filter: { _id: charityId },
        update: { $inc: { totalDonations: Number(delta) } },
      },
    }));

  if (charityOps.length) {
    await Charity.bulkWrite(charityOps, { session });
  }

  await syncUserWinnerCaches(Array.from(affectedUserIds), session);
  return Winner.find({ drawId, matchCount }).session(session || null);
};

const serializeWinner = (winnerDoc) => {
  const winner = winnerDoc?.toObject ? winnerDoc.toObject() : { ...(winnerDoc || {}) };
  const reviewStatus = normalizeReviewStatus(winner.reviewStatus);
  const proofUrl = winner.proofUrl || winner.proofImage || null;
  const displayStatus =
    reviewStatus === REVIEW_APPROVED
      ? "Approved"
      : reviewStatus === REVIEW_REJECTED
      ? "Rejected"
      : proofUrl
      ? "Under review"
      : "Awaiting proof";

  return {
    ...winner,
    reviewStatus,
    proofUrl,
    proofImage: proofUrl,
    prizeAmount: Number(winner.prizeAmount || 0),
    provisionalPrizeAmount: Number(winner.provisionalPrizeAmount || 0),
    finalPrizeAmount: Number(winner.finalPrizeAmount || 0),
    paymentState: String(winner.paymentState || "").toLowerCase() === "paid" ? "paid" : "pending",
    status:
      reviewStatus === REVIEW_APPROVED
        ? "approved"
        : reviewStatus === REVIEW_REJECTED
        ? "rejected"
        : "pending",
    displayStatus,
    canUploadProof: reviewStatus === REVIEW_PENDING,
  };
};

module.exports = {
  REVIEW_PENDING,
  REVIEW_APPROVED,
  REVIEW_REJECTED,
  normalizeReviewStatus,
  recalculateTierPayouts,
  serializeWinner,
  syncUserWinnerCaches,
};
