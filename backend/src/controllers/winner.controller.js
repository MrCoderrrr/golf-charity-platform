const Winner = require("../models/winner.model");
const AuditLog = require("../models/auditLog.model");
const cloudinary = require("../config/cloudinary");
const {
  REVIEW_APPROVED,
  REVIEW_REJECTED,
  REVIEW_PENDING,
  normalizeReviewStatus,
  recalculateTierPayouts,
  serializeWinner,
} = require("../utils/winnerLifecycle");

const streamUpload = (fileBuffer, resourceType = "auto") =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "proofs", resource_type: resourceType },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    stream.end(fileBuffer);
  });

const reviewWinnerInternal = async ({ winnerId, reviewStatus, actorUserId, ip, userAgent }) => {
  const winner = await Winner.findById(winnerId);
  if (!winner) {
    const err = new Error("Winner not found");
    err.statusCode = 404;
    throw err;
  }

  const normalizedStatus = normalizeReviewStatus(reviewStatus);
  if (normalizedStatus === REVIEW_APPROVED && !(winner.proofUrl || winner.proofImage)) {
    const err = new Error("Proof upload is required before approval.");
    err.statusCode = 400;
    throw err;
  }

  winner.reviewStatus = normalizedStatus;
  if (normalizedStatus === REVIEW_APPROVED) {
    winner.verifiedAt = winner.verifiedAt || new Date();
  } else if (normalizedStatus === REVIEW_REJECTED) {
    winner.verifiedAt = null;
    winner.paidAt = null;
  }
  await winner.save();

  await recalculateTierPayouts(winner.drawId, winner.matchCount);

  if (actorUserId) {
    await AuditLog.create({
      actorUserId,
      action: normalizedStatus === REVIEW_APPROVED ? "winner.approve" : "winner.reject",
      entityType: "Winner",
      entityId: winner._id,
      meta: { drawId: winner.drawId, matchCount: winner.matchCount, reviewStatus: normalizedStatus },
      ip,
      userAgent,
    });
  }

  const fresh = await Winner.findById(winner._id).populate("drawId").populate("userId", "name email");
  return serializeWinner(fresh);
};

exports.reviewWinnerInternal = reviewWinnerInternal;

exports.getMyWinnings = async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { userId: req.user._id };

    const winnings = await Winner.find(filter)
      .populate("drawId")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json(winnings.map(serializeWinner));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.uploadProof = async (req, res) => {
  try {
    const { winnerId } = req.body;
    if (!winnerId) return res.status(400).json({ message: "winnerId required" });
    if (!req.file) {
      return res.status(400).json({ message: "Proof file is required" });
    }

    const mimeType = String(req.file.mimetype || "");
    if (!mimeType.startsWith("image/") && mimeType !== "application/pdf") {
      return res.status(400).json({ message: "Only image or PDF proof files are allowed." });
    }

    const winner = await Winner.findById(winnerId);
    if (!winner) return res.status(404).json({ message: "Winner not found" });
    if (req.user.role !== "admin" && String(winner.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (normalizeReviewStatus(winner.reviewStatus) !== REVIEW_PENDING) {
      return res.status(409).json({ message: "Proof can only be uploaded while verification is pending." });
    }

    const result = await streamUpload(req.file.buffer, "auto");
    winner.proofUrl = result.secure_url;
    winner.proofImage = result.secure_url;
    winner.proofMimeType = mimeType;
    winner.proofUploadedAt = new Date();
    winner.status = "under_review";
    await winner.save();

    const updated = await Winner.findById(winnerId).populate("drawId").populate("userId", "name email");
    res.json(serializeWinner(updated));
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message });
  }
};

exports.verifyWinner = async (req, res) => {
  try {
    const { winnerId } = req.body;
    if (!winnerId) return res.status(400).json({ message: "winnerId required" });

    const winner = await reviewWinnerInternal({
      winnerId,
      reviewStatus: REVIEW_APPROVED,
      actorUserId: req.user._id,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json(winner);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message });
  }
};

exports.rejectWinnerProof = async (req, res) => {
  try {
    const { winnerId } = req.body;
    if (!winnerId) return res.status(400).json({ message: "winnerId required" });

    const winner = await reviewWinnerInternal({
      winnerId,
      reviewStatus: REVIEW_REJECTED,
      actorUserId: req.user._id,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json(winner);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message });
  }
};
