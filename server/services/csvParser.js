const fs = require('fs');
const { parse } = require('csv-parse');

/**
 * Normalizes headers to standard keys
 */
const ALIASES = {
  date: ['date', 'publish date', 'posted at', 'timestamp', 'created at', 'time', 'post date', 'published', 'date posted'],
  id: ['post id', 'id', 'permalink', 'url', 'post link', 'content id'],
  type: ['post type', 'media type', 'type', 'format', 'content type'],
  caption: ['caption', 'title', 'text', 'post title', 'message', 'description', 'post caption', 'copy'],
  likes: ['likes', 'like count', 'like', 'reactions', 'post likes'],
  comments: ['comments', 'comment count', 'comment', 'post comments'],
  shares: ['shares', 'share count', 'share', 'post shares'],
  saves: ['saves', 'save count', 'save', 'saved', 'post saves'],
  reach: ['reach', 'unique accounts reached', 'accounts reached', 'post reach'],
  impressions: ['impressions', 'total impressions', 'views', 'post impressions'],
  followers: ['followers', 'follower count', 'total followers', 'audience', 'audience size', 'follower total']
};

function resolveColumnKey(header) {
  if (!header || typeof header !== 'string') return '';
  // Normalize: trim, lowercase, remove underscores and dashes, collapse whitespace
  const clean = header.trim().toLowerCase().replace(/[_\-]/g, ' ').replace(/\s+/g, ' ');
  
  for (const [standardKey, aliasList] of Object.entries(ALIASES)) {
    if (aliasList.includes(clean)) {
      return standardKey;
    }
  }
  return clean;
}

function parseNumber(val) {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  // Handle strings with commas, percent signs, currency, spaces: "12,450", "13.6%", "$50"
  const cleaned = String(val).replace(/[, %$]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Robust date parser supporting YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, timestamps, etc.
 */
function parseDate(val) {
  if (!val) return null;
  const str = String(val).trim();
  if (!str) return null;

  // 1. Check for DD/MM/YYYY or MM/DD/YYYY (e.g. 15/08/2026 or 08/15/2026 or 8/1/2026)
  const slashMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})(.*)$/);
  if (slashMatch) {
    let p1 = parseInt(slashMatch[1], 10);
    let p2 = parseInt(slashMatch[2], 10);
    const year = parseInt(slashMatch[3], 10);

    let month, day;
    if (p1 > 12) {
      // Must be DD/MM/YYYY
      day = p1;
      month = p2;
    } else if (p2 > 12) {
      // Must be MM/DD/YYYY
      month = p1;
      day = p2;
    } else {
      // Ambiguous: default to MM/DD/YYYY (standard US export format)
      month = p1;
      day = p2;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const pad = (n) => String(n).padStart(2, '0');
      return new Date(`${year}-${pad(month)}-${pad(day)}T12:00:00Z`);
    }
  }

  // 2. Standard ISO / native Date parsing
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d;
  }

  return null;
}

/**
 * Formats a Date object or string as YYYY-MM-DD
 */
function formatDate(d, fallback = '') {
  if (!d) return fallback;
  if (typeof d === 'string') {
    const parsed = parseDate(d);
    if (parsed) return parsed.toISOString().split('T')[0];
    return d;
  }
  if (d instanceof Date && !isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return fallback;
}

/**
 * Parses an Instagram analytics CSV file and computes core metrics.
 * @param {string|Buffer} input - File path or buffer of CSV content
 * @returns {Promise<Object>} Computed metrics object
 */
async function parseInstagramCSV(input) {
  return new Promise((resolve, reject) => {
    const records = [];
    const sourceStream = typeof input === 'string'
      ? fs.createReadStream(input)
      : require('stream').Readable.from(input);

    const parser = parse({
      columns: (headers) => headers.map(resolveColumnKey),
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true,
      cast: false
    });

    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        records.push(record);
      }
    });

    parser.on('error', (err) => {
      reject(new Error(`Malformed CSV file: ${err.message}. Please verify the file formatting.`));
    });

    parser.on('end', () => {
      try {
        if (records.length === 0) {
          return reject(new Error('The uploaded CSV file is empty. Please upload an Instagram export with post and engagement data.'));
        }

        // Validate that we have at least one recognized engagement column
        const firstRecord = records[0];
        const keys = Object.keys(firstRecord);
        const hasEngagementField = keys.some(k => ['likes', 'comments', 'shares', 'saves', 'reach', 'impressions'].includes(k));

        if (!hasEngagementField) {
          return reject(new Error(
            'Invalid Instagram CSV format: No recognized engagement columns (Likes, Comments, Shares, Reach) were found. Please upload a valid Instagram analytics export.'
          ));
        }

        const metrics = computeMetrics(records);
        resolve(metrics);
      } catch (err) {
        reject(err);
      }
    });

    sourceStream.pipe(parser);
  });
}

/**
 * Computes core business metrics from normalized Instagram records
 */
function computeMetrics(records) {
  const posts = [];
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;
  let totalSaves = 0;
  let totalReach = 0;
  let totalImpressions = 0;

  records.forEach((row, index) => {
    const likes = parseNumber(row.likes);
    const comments = parseNumber(row.comments);
    const shares = parseNumber(row.shares);
    const saves = parseNumber(row.saves);
    const reach = parseNumber(row.reach);
    const impressions = parseNumber(row.impressions);
    const followers = parseNumber(row.followers);

    const totalPostEngagement = likes + comments + shares + saves;
    const postEngagementRate = reach > 0
      ? (totalPostEngagement / reach) * 100
      : (followers > 0 ? (totalPostEngagement / followers) * 100 : 0);

    const parsedDate = parseDate(row.date);
    const formattedDate = parsedDate ? formatDate(parsedDate) : (row.date ? String(row.date).trim() : `Post #${index + 1}`);

    totalLikes += likes;
    totalComments += comments;
    totalShares += shares;
    totalSaves += saves;
    totalReach += reach;
    totalImpressions += impressions;

    posts.push({
      id: row.id || `post_${index + 1}`,
      rawIndex: index,
      date: formattedDate,
      timestamp: parsedDate ? parsedDate.getTime() : index,
      type: row.type ? String(row.type).trim() : 'Post',
      caption: row.caption ? String(row.caption).trim() : '(No caption provided)',
      likes,
      comments,
      shares,
      saves,
      reach,
      impressions,
      followers,
      totalEngagement: totalPostEngagement,
      engagementRate: isFinite(postEngagementRate) ? parseFloat(postEngagementRate.toFixed(2)) : 0
    });
  });

  // Sort posts chronologically to determine period start/end and trend
  posts.sort((a, b) => a.timestamp - b.timestamp);

  const periodStart = posts.length > 0 ? posts[0].date : 'N/A';
  const periodEnd = posts.length > 0 ? posts[posts.length - 1].date : 'N/A';

  // Follower count analysis
  const postsWithFollowers = posts.filter(p => p.followers > 0);
  let startFollowers = 0;
  let endFollowers = 0;
  let followerChange = 0;
  let followerGrowthPct = 0;
  let hasFollowerData = false;

  if (postsWithFollowers.length >= 2) {
    startFollowers = postsWithFollowers[0].followers;
    endFollowers = postsWithFollowers[postsWithFollowers.length - 1].followers;
    followerChange = endFollowers - startFollowers;
    followerGrowthPct = startFollowers > 0
      ? parseFloat(((followerChange / startFollowers) * 100).toFixed(2))
      : 0;
    hasFollowerData = true;
  } else if (postsWithFollowers.length === 1) {
    startFollowers = postsWithFollowers[0].followers;
    endFollowers = postsWithFollowers[0].followers;
    hasFollowerData = true;
  }

  // Total engagement and overall engagement rate
  const totalEngagement = totalLikes + totalComments + totalShares + totalSaves;
  let overallEngagementRate = 0;
  if (totalReach > 0) {
    overallEngagementRate = parseFloat(((totalEngagement / totalReach) * 100).toFixed(2));
  } else if (endFollowers > 0) {
    overallEngagementRate = parseFloat(((totalEngagement / (endFollowers * (posts.length || 1))) * 100).toFixed(2));
  }

  // Top 3 posts sorted by total engagement descending
  const sortedByEngagement = [...posts].sort((a, b) => b.totalEngagement - a.totalEngagement);
  const top3Posts = sortedByEngagement.slice(0, 3).map((p, idx) => ({
    rank: idx + 1,
    id: p.id,
    date: p.date,
    type: p.type,
    caption: p.caption,
    likes: p.likes,
    comments: p.comments,
    shares: p.shares,
    saves: p.saves,
    reach: p.reach,
    totalEngagement: p.totalEngagement,
    engagementRate: p.engagementRate
  }));

  // Period trend (split chronologically into first half vs second half)
  let periodTrendPct = 0;
  let trendDirection = 'flat';
  let trendDescription = '';

  if (posts.length === 1) {
    // Exactly 1 post
    periodTrendPct = 0;
    trendDirection = 'flat';
    trendDescription = 'Single post in reporting period — baseline established';
  } else if (posts.length >= 2) {
    const midpoint = Math.floor(posts.length / 2);
    const firstHalf = posts.slice(0, midpoint);
    const secondHalf = posts.slice(midpoint);

    const firstHalfEngagement = firstHalf.reduce((sum, p) => sum + p.totalEngagement, 0);
    const secondHalfEngagement = secondHalf.reduce((sum, p) => sum + p.totalEngagement, 0);

    const avgFirst = firstHalfEngagement / (firstHalf.length || 1);
    const avgSecond = secondHalfEngagement / (secondHalf.length || 1);

    if (avgFirst > 0) {
      periodTrendPct = parseFloat((((avgSecond - avgFirst) / avgFirst) * 100).toFixed(1));
    } else if (avgSecond > 0) {
      periodTrendPct = 100;
    } else {
      periodTrendPct = 0;
    }

    if (periodTrendPct > 0.5) trendDirection = 'up';
    else if (periodTrendPct < -0.5) trendDirection = 'down';
    else trendDirection = 'flat';

    if (posts.length === 2) {
      trendDescription = periodTrendPct >= 0
        ? `+${periodTrendPct}% change from Post 1 to Post 2`
        : `${periodTrendPct}% change from Post 1 to Post 2`;
    } else {
      trendDescription = periodTrendPct >= 0
        ? `+${periodTrendPct}% change compared to the first half of the period`
        : `${periodTrendPct}% change compared to the first half of the period`;
    }
  }

  // Time-series data points for interactive charts
  const timeline = posts.map(p => ({
    date: p.date,
    type: p.type,
    engagement: p.totalEngagement,
    likes: p.likes,
    comments: p.comments,
    shares: p.shares,
    reach: p.reach,
    followers: p.followers
  }));

  // Breakdown by post format / media type (Reel, Carousel, Photo, etc.)
  const typeBreakdown = {};
  posts.forEach(p => {
    const t = p.type || 'Other';
    if (!typeBreakdown[t]) {
      typeBreakdown[t] = { count: 0, totalEngagement: 0, avgEngagement: 0 };
    }
    typeBreakdown[t].count += 1;
    typeBreakdown[t].totalEngagement += p.totalEngagement;
  });
  Object.keys(typeBreakdown).forEach(t => {
    typeBreakdown[t].avgEngagement = Math.round(typeBreakdown[t].totalEngagement / typeBreakdown[t].count);
  });

  return {
    period: {
      start: periodStart,
      end: periodEnd,
      totalPosts: posts.length
    },
    followers: {
      hasData: hasFollowerData,
      start: startFollowers,
      end: endFollowers,
      netChange: followerChange,
      growthRatePct: followerGrowthPct
    },
    engagement: {
      total: totalEngagement,
      likes: totalLikes,
      comments: totalComments,
      shares: totalShares,
      saves: totalSaves,
      reach: totalReach,
      impressions: totalImpressions,
      engagementRatePct: isFinite(overallEngagementRate) ? overallEngagementRate : 0
    },
    trend: {
      percentageChange: isFinite(periodTrendPct) ? periodTrendPct : 0,
      direction: trendDirection,
      description: trendDescription
    },
    topPosts: top3Posts,
    formatBreakdown: typeBreakdown,
    timeline
  };
}

module.exports = {
  parseInstagramCSV,
  computeMetrics,
  parseDate,
  formatDate
};
