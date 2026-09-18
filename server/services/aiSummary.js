/**
 * Generates an executive summary (2-4 sentences) based on computed metrics.
 * Uses Gemini API if GEMINI_API_KEY is configured, with a smart rule-based fallback.
 */

function generateFallbackSummary(metrics, clientName = 'the client') {
  const totalPosts = metrics.period?.totalPosts || 0;
  const followers = metrics.followers || {};
  const engagement = metrics.engagement || {};
  const trend = metrics.trend || {};
  const topPost = metrics.topPosts?.[0];

  // Case 1: Sparse Dataset — Exactly 1 Post
  if (totalPosts === 1) {
    const postType = topPost?.type || 'content';
    const totalInteractions = (topPost?.totalEngagement || engagement.total || 0).toLocaleString('en-US');
    const rateText = engagement.engagementRatePct > 0 ? ` with an engagement rate of ${engagement.engagementRatePct}%` : '';
    
    let followerSentence = '';
    if (followers.hasData && followers.start > 0) {
      followerSentence = ` Audience size is currently recorded at ${followers.end.toLocaleString('en-US')} followers.`;
    }

    return `For this reporting period, ${clientName} published 1 ${postType} on ${topPost?.date || 'the recorded date'}, generating ${totalInteractions} total interactions (${(topPost?.likes || 0).toLocaleString('en-US')} likes, ${(topPost?.comments || 0).toLocaleString('en-US')} comments)${rateText}.${followerSentence} As this is a single post record, additional content published over time will be needed to establish velocity and trend benchmarks.`;
  }

  // Case 2: Sparse Dataset — Exactly 2 Posts
  if (totalPosts === 2) {
    const totalInteractions = engagement.total.toLocaleString('en-US');
    const post2 = metrics.topPosts?.[1];
    const topType = topPost?.type || 'post';

    let trendSentence = '';
    if (trend.percentageChange !== 0) {
      trendSentence = ` Engagement shifted ${trend.percentageChange >= 0 ? '+' : ''}${trend.percentageChange}% between the two publications.`;
    }

    return `Across this two-post sample, ${clientName} generated a combined ${totalInteractions} interactions with an average engagement rate of ${engagement.engagementRatePct}%. Activity was led by a ${topType} on ${topPost?.date || 'the first date'} delivering ${topPost?.totalEngagement?.toLocaleString('en-US')} interactions.${trendSentence} Continued publishing will provide a robust multi-week sample for audience trajectory analysis.`;
  }

  // Case 3: Standard Dataset (3+ Posts)
  let sentence1 = '';
  if (followers.hasData && followers.netChange !== 0) {
    sentence1 = `During this period, ${clientName} gained ${followers.netChange.toLocaleString('en-US')} new followers, reaching ${followers.end.toLocaleString('en-US')} (${followers.growthRatePct >= 0 ? '+' : ''}${followers.growthRatePct}%).`;
  } else if (followers.hasData && followers.end > 0) {
    sentence1 = `${clientName} maintained a steady audience of ${followers.end.toLocaleString('en-US')} followers over the ${totalPosts} posts published.`;
  } else {
    sentence1 = `${clientName} published ${totalPosts} posts during this performance reporting period.`;
  }

  let sentence2 = `Audience engagement totaled ${engagement.total.toLocaleString('en-US')} interactions across ${engagement.likes.toLocaleString('en-US')} likes and ${engagement.comments.toLocaleString('en-US')} comments, yielding an engagement rate of ${engagement.engagementRatePct}%.`;

  let sentence3 = '';
  if (topPost) {
    sentence3 = `Top performance was driven by a ${topPost.type} on ${topPost.date} capturing ${topPost.totalEngagement.toLocaleString('en-US')} interactions.`;
  }

  let sentence4 = trend.percentageChange >= 0
    ? `Overall momentum demonstrated positive growth with a ${trend.percentageChange}% lift into the second half of the reporting cycle.`
    : `Engagement velocity reflected a ${trend.percentageChange}% adjustment period-over-period, indicating an opportunity to lean into high-performing formats.`;

  return `${sentence1} ${sentence2} ${sentence3} ${sentence4}`;
}

async function generateExecutiveSummary(metrics, clientName = 'the client') {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_GEMINI_API_KEY') {
    return generateFallbackSummary(metrics, clientName);
  }

  try {
    const { GoogleGenAI } = require('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const isSparse = (metrics.period?.totalPosts || 0) <= 2;

    const prompt = `
You are a senior social media data analyst writing an executive summary for a client performance report.
Write a concise 2 to 4 sentence plain-English summary based strictly on the structured metrics below.

Client Name: ${clientName}
Metrics:
- Total Posts Published: ${metrics.period?.totalPosts || 0}
- Period Range: ${metrics.period?.start || 'N/A'} to ${metrics.period?.end || 'N/A'}
- Followers: ${metrics.followers?.hasData ? `${metrics.followers.start} -> ${metrics.followers.end} (Net: ${metrics.followers.netChange}, Growth: ${metrics.followers.growthRatePct}%)` : 'No follower tracking column in this export'}
- Total Engagement: ${metrics.engagement?.total || 0} (Likes: ${metrics.engagement?.likes || 0}, Comments: ${metrics.engagement?.comments || 0}, Shares: ${metrics.engagement?.shares || 0}, Saves: ${metrics.engagement?.saves || 0})
- Engagement Rate: ${metrics.engagement?.engagementRatePct || 0}%
- Trend Note: ${metrics.trend?.description || 'N/A'}
- Top Post: Type: ${metrics.topPosts?.[0]?.type || 'N/A'}, Interactions: ${metrics.topPosts?.[0]?.totalEngagement || 0}, Date: ${metrics.topPosts?.[0]?.date || 'N/A'}

STRICT DATA FIDELITY RULES:
1. Ground every statement strictly in the numbers above. Do NOT hallucinate or invent outside numbers, benchmark averages, or imaginary campaigns.
2. ${isSparse ? 'IMPORTANT: This is a sparse dataset with only 1-2 posts. Explicitly acknowledge the small sample size and do NOT claim weekly trends or long-term follower trajectories.' : 'Highlight the follower growth, overall engagement rate, top content driver, and trend direction.'}
3. If follower data says "No follower tracking column", do NOT mention follower growth or make up follower counts.
4. Professional, encouraging, factual, executive tone. Return ONLY the 2 to 4 sentences without bullet points, greeting, or conversational wrapper.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const summary = response.text ? response.text.trim() : null;
    if (summary && summary.length > 20) {
      return summary;
    }
    return generateFallbackSummary(metrics, clientName);
  } catch (err) {
    console.warn('⚠️ Gemini API call error, falling back to smart template:', err.message);
    return generateFallbackSummary(metrics, clientName);
  }
}

module.exports = {
  generateExecutiveSummary,
  generateFallbackSummary
};
