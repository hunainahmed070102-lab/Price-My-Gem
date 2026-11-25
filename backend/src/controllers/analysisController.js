const crypto   = require('crypto');
const path     = require('path');
const axios    = require('axios');
const fs       = require('fs');
const FormData = require('form-data');
const Report   = require('../models/Report');
const Price    = require('../models/Price');
const User     = require('../models/User');
const Admin    = require('../models/Admin');

/**
 * Resolves a valid `users.id` for `reports.user_id` FK.
 * Mobile users map directly to `reqUser.id`; admin logins are linked to (or provisioned)
 * a matching `users` row by email because `reports.user_id` references `users(id)`.
 */
async function resolveReportUserId(reqUser) {
  if (reqUser.userType !== 'admin') {
    return reqUser.id;
  }

  let linkedUser = await User.findByEmail(reqUser.email);
  if (linkedUser) {
    return linkedUser.id;
  }

  const adminRecord = await Admin.findByIdSafe(reqUser.id);
  const email = (adminRecord?.email || reqUser.email).toLowerCase().trim();
  const fullName = adminRecord?.full_name || 'Administrator';

  try {
    linkedUser = await User.create({
      full_name: fullName,
      email,
      password: crypto.randomBytes(32).toString('hex')
    });
    return linkedUser.id;
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const existing = await User.findByEmail(email);
      if (existing) return existing.id;
    }
    throw err;
  }
}

/**
 * Builds a lowercase lookup map from `prices` and resolves direct or fuzzy
 * keyword matches so both fresh scans and history reports reflect live valuations.
 */
async function buildPriceLookup() {
  const allPrices = await Price.getAll();
  const map = new Map();
  for (const row of allPrices) {
    if (row.gemstone_type) {
      map.set(row.gemstone_type.trim().toLowerCase(), row);
    }
  }
  return map;
}

function matchPriceFromMap(priceMap, gemstoneType) {
  const clean = String(gemstoneType || '').trim().toLowerCase();
  if (!clean) return null;
  if (priceMap.has(clean)) return priceMap.get(clean);

  for (const word of clean.split(/\s+/)) {
    if (word.length >= 4 && priceMap.has(word)) {
      return priceMap.get(word);
    }
  }
  return null;
}

async function resolvePriceInfo(gemstoneType) {
  let priceInfo = await Price.findByType(gemstoneType);
  if (!priceInfo && gemstoneType) {
    for (const word of String(gemstoneType).split(/\s+/)) {
      if (word.length >= 4) {
        const matched = await Price.findByType(word);
        if (matched) {
          priceInfo = matched;
          break;
        }
      }
    }
  }
  return priceInfo;
}

function formatPriceRange(priceInfo, fallback = 'Price estimation upon lab verification') {
  if (!priceInfo) return fallback;
  return `Rs ${Number(priceInfo.price_per_carat).toLocaleString()} ${priceInfo.currency || 'PKR'}/carat`;
}

function formatGemstoneDetails(priceInfo) {
  if (!priceInfo) return null;
  return {
    mineralFamily: priceInfo.mineral_family || null,
    mohsHardness: priceInfo.mohs_hardness || null,
    primaryOrigins: priceInfo.primary_origins || null,
    characteristics: priceInfo.characteristics || null,
    description: priceInfo.description || null,
    infoSourceName: priceInfo.info_source_name || null,
    infoSourceUrl: priceInfo.info_source_url || null,
    priceSourceName: priceInfo.price_source_name || null,
    priceSourceUrl: priceInfo.price_source_url || null,
    sources: Array.isArray(priceInfo.sources) ? priceInfo.sources : []
  };
}

function enrichReportWithPrice(report, priceInfo) {
  if (!report || !priceInfo) return report;
  return {
    ...report,
    price_range: formatPriceRange(priceInfo, report.price_range),
    price_details: {
      pricePerCarat: Number(priceInfo.price_per_carat),
      currency: priceInfo.currency || 'PKR'
    },
    gemstone_details: formatGemstoneDetails(priceInfo)
  };
}

// ─── Analyze gemstone image ───────────────────────────────────────────────────
exports.analyzeGemstone = async (req, res, next) => {
  let imagePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    imagePath = req.file.path;
    const imageUrl = `/uploads/${req.file.filename}`;

    // Call real AI model service
    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));

    const aiModelUrl = process.env.AI_MODEL_URL || 'http://localhost:8000/predict';
    let aiResponse;

    try {
      aiResponse = await axios.post(
        aiModelUrl,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 15000,
          maxContentLength: 20 * 1024 * 1024,
          maxBodyLength: 20 * 1024 * 1024,
        }
      );
    } catch (aiError) {
      console.error('❌ AI model inference failed:', aiError.message);
      // Clean up uploaded image if AI service is offline/errored
      if (imagePath && fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      return res.status(503).json({
        success: false,
        message: 'AI gemstone identification service is currently unavailable. Please verify the AI service is running on port 8000.'
      });
    }

    const aiData = aiResponse.data;
    const isGemstone = aiData.is_gemstone !== false;
    const rawGemType = (aiData.gemstone_type || '').trim();
    const isNotGemstone =
      !isGemstone ||
      rawGemType.toLowerCase() === 'not_gemstone' ||
      rawGemType.toLowerCase() === 'not a gemstone';

    // ─── Non-Gemstone / Out-of-Distribution Guardrail Rejection ─────────────
    if (isNotGemstone) {
      // Discard image file for non-gemstones
      if (imagePath && fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      return res.status(422).json({
        success: false,
        is_gemstone: false,
        message: 'This item is not a gemstone. Please scan a valid gemstone.',
        data: {
          gemstoneType: 'Not a Gemstone',
          confidence: aiData.confidence || 0,
          authenticity: 'Not a Gemstone',
          topCandidates: aiData.top_candidates || []
        }
      });
    }

    // ─── Valid Gemstone Processing ─────────────────────────────────────────
    const gemstone_type = rawGemType;
    let confidenceFloat = parseFloat(aiData.confidence) || 0;
    if (confidenceFloat > 1.0) {
      confidenceFloat = confidenceFloat / 100.0;
    }

    // Price lookup (direct or fuzzy match)
    const priceInfo = await resolvePriceInfo(gemstone_type);
    const priceRange = formatPriceRange(priceInfo);

    const rawAuth = (aiData.authenticity || 'real').toLowerCase();
    const authenticity = ['real', 'synthetic', 'uncertain'].includes(rawAuth)
      ? rawAuth
      : 'real';

    const reportUserId = await resolveReportUserId(req.user);

    // Save report record in MySQL
    const report = await Report.create({
      user_id:       reportUserId,
      image_url:     imageUrl,
      gemstone_type,
      confidence:    confidenceFloat,
      authenticity,
      price_range:   priceRange
    });

    return res.json({
      success: true,
      message: 'Gemstone identified successfully',
      data: {
        reportId:     report.id,
        imageUrl,
        gemstoneType: gemstone_type,
        confidence:   confidenceFloat,
        authenticity: authenticity.charAt(0).toUpperCase() + authenticity.slice(1),
        priceRange,
        priceDetails: priceInfo
          ? {
              pricePerCarat: Number(priceInfo.price_per_carat),
              currency: priceInfo.currency || 'PKR'
            }
          : null,
        gemstoneDetails: formatGemstoneDetails(priceInfo),
        topCandidates: aiData.top_candidates || []
      }
    });

  } catch (error) {
    if (imagePath && fs.existsSync(imagePath)) {
      try { fs.unlinkSync(imagePath); } catch (_) {}
    }
    next(error);
  }
};

// ─── Get user's analysis history ──────────────────────────────────────────────
exports.getHistory = async (req, res, next) => {
  try {
    const reportUserId = await resolveReportUserId(req.user);
    const [reports, priceMap] = await Promise.all([
      Report.findByUserId(reportUserId),
      buildPriceLookup()
    ]);

    const enriched = reports.map((report) =>
      enrichReportWithPrice(report, matchPriceFromMap(priceMap, report.gemstone_type))
    );

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    next(error);
  }
};

// ─── Get specific report by id ────────────────────────────────────────────────
exports.getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (String(report.user_id) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const priceInfo = await resolvePriceInfo(report.gemstone_type);
    res.json({ success: true, data: enrichReportWithPrice(report, priceInfo) });
  } catch (error) {
    next(error);
  }
};

// ─── Clear user history ───────────────────────────────────────────────────────
exports.clearHistory = async (req, res, next) => {
  try {
    const reportUserId = await resolveReportUserId(req.user);
    const deletedCount = await Report.deleteByUserId(reportUserId);
    res.json({ success: true, message: 'History cleared successfully', deletedCount });
  } catch (error) {
    next(error);
  }
};

// ─── Delete single report owned by authenticated user ─────────────────────────
exports.deleteReportById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reportUserId = await resolveReportUserId(req.user);
    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (String(report.user_id) !== String(reportUserId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const deletedCount = await Report.deleteByIdForUser(id, reportUserId);
    if (!deletedCount) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (typeof report.image_url === 'string' && report.image_url.startsWith('/uploads/')) {
      const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_PATH || './uploads');
      const filename = path.basename(report.image_url);
      if (filename && !filename.includes('..')) {
        const filePath = path.join(uploadDir, filename);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (_) {}
        }
      }
    }

    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    next(error);
  }
};
