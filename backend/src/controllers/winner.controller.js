const Winner = require("../models/winner.model");
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

    if (!req.file) {
      return res.status(400).json({ message: "Proof image is required" });
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

    const winner = await Winner.findByIdAndUpdate(
      winnerId,
      {
        proofImage: result.secure_url,
        verified: false,
      },
      { new: true }
    );

    res.json(winner);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyWinner = async (req, res) => {
  try {
    const { winnerId, status } = req.body;

    const winner = await Winner.findByIdAndUpdate(
      winnerId,
      {
        verified: true,
        status: status || "paid",
      },
      { new: true }
    );

    res.json(winner);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
