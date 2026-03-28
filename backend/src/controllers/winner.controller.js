const Winner = require("../models/winner.model");
const Transaction = require("../models/transaction.model");
const AuditLog = require("../models/auditLog.model");
const cloudinary = require("../config/cloudinary");

exports.getMyWinnings = async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { userId: req.user._id };

    const winnings = await Winner.find(filter)
      .populate("drawId")
      .sort({ createdAt: -1 });

    res.json(winnings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.uploadProof = async (req, res) => {
  try {
    const { winnerId } = req.body;
    if (!winnerId) return res.status(400).json({ message: "winnerId required" });

    if (!req.file) {
      return res.status(400).json({ message: "Proof image is required" });
    }

    const winner = await Winner.findById(winnerId);
    if (!winner) return res.status(404).json({ message: "Winner not found" });
    if (req.user.role !== "admin" && String(winner.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const streamUpload = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "proofs" },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        stream.end(fileBuffer);
      });
    };

    const result = await streamUpload(req.file.buffer);

    const updated = await Winner.findByIdAndUpdate(
      winnerId,
      {
        proofImage: result.secure_url,
        verified: false,
        verifiedAt: null,
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyWinner = async (req, res) => {
  try {
    const { winnerId, status } = req.body;
    if (!winnerId) return res.status(400).json({ message: "winnerId required" });

    const nextStatus = status || "paid";
    const now = new Date();

    const winner = await Winner.findByIdAndUpdate(
      winnerId,
      {
        verified: true,
        verifiedAt: now,
        status: nextStatus,
        ...(nextStatus === "paid" ? { paidAt: now } : {}),
      },
      { new: true }
    );

    if (!winner) return res.status(404).json({ message: "Winner not found" });

    if (nextStatus === "paid") {
      await Transaction.findOneAndUpdate(
        { "ref.winnerId": winner._id, type: "payout" },
        { status: "completed" }
      );
    }

    await AuditLog.create({
      actorUserId: req.user._id,
      action: "winner.verify",
      entityType: "Winner",
      entityId: winner._id,
      meta: { status: nextStatus },
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.json(winner);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.rejectWinnerProof = async (req, res) => {
  try {
    const { winnerId } = req.body;
    if (!winnerId) return res.status(400).json({ message: "winnerId required" });

    const winner = await Winner.findByIdAndUpdate(
      winnerId,
      {
        verified: false,
        status: "pending",
        proofImage: null,
      },
      { new: true }
    );

    if (!winner) return res.status(404).json({ message: "Winner not found" });
    res.json(winner);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
