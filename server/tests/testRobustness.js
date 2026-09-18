const assert = require('assert');
const { parseInstagramCSV } = require('../services/csvParser');
const { generateFallbackSummary } = require('../services/aiSummary');

async function runRobustnessChecks() {
  console.log('🛡️ Starting Robustness & Security Checks...\n');

  // -------------------------------------------------------------
  // Check 1.1: Missing 'Saves' column (Common in some Meta exports)
  // -------------------------------------------------------------
  console.log('[1.1] Testing CSV with missing Saves column...');
  const csvNoSaves = `Date,Post ID,Post Type,Caption,Likes,Comments,Shares,Reach,Impressions,Followers
2026-08-01,101,Reel,"Launch Day Post",1000,100,50,10000,15000,5000
2026-08-05,102,Photo,"Product shot",500,50,20,5000,7000,5100
2026-08-10,103,Carousel,"Educational carousel",800,80,40,8000,11000,5200`;

  const metricsNoSaves = await parseInstagramCSV(Buffer.from(csvNoSaves));
  // Total engagement: (1000+100+50) + (500+50+20) + (800+80+40) = 1150 + 570 + 920 = 2640
  assert.strictEqual(metricsNoSaves.engagement.total, 2640, 'Total engagement should equal likes+comments+shares');
  assert.strictEqual(metricsNoSaves.engagement.saves, 0, 'Saves should be 0 when missing from export');
  assert.strictEqual(metricsNoSaves.topPosts.length, 3, 'Top posts should be computed');
  assert.strictEqual(metricsNoSaves.topPosts[0].totalEngagement, 1150, 'Top post engagement correct');
  console.log('✅ Passed: Missing Saves column handled gracefully without errors or NaN.\n');

  // -------------------------------------------------------------
  // Check 1.2: Scrambled column order
  // -------------------------------------------------------------
  console.log('[1.2] Testing CSV with completely reversed/scrambled column order...');
  const csvScrambled = `Caption,Followers,Shares,Likes,Date,Comments,Reach,Post Type,Saves
"Summer Sale Reel",6000,200,1500,2026-07-15,120,20000,Reel,300
"Team Behind Scenes",6150,50,600,2026-07-20,40,8000,Photo,90`;

  const metricsScrambled = await parseInstagramCSV(Buffer.from(csvScrambled));
  assert.strictEqual(metricsScrambled.period.totalPosts, 2);
  assert.strictEqual(metricsScrambled.engagement.likes, 2100);
  assert.strictEqual(metricsScrambled.engagement.comments, 160);
  assert.strictEqual(metricsScrambled.engagement.shares, 250);
  assert.strictEqual(metricsScrambled.engagement.saves, 390);
  assert.strictEqual(metricsScrambled.followers.start, 6000);
  assert.strictEqual(metricsScrambled.followers.end, 6150);
  assert.strictEqual(metricsScrambled.followers.netChange, 150);
  console.log('✅ Passed: Column order invariance verified.\n');

  // -------------------------------------------------------------
  // Check 1.3: Different Date Formats (MM/DD/YYYY and M/D/YYYY)
  // -------------------------------------------------------------
  console.log('[1.3] Testing CSV with MM/DD/YYYY and M/D/YYYY date formats...');
  const csvUSDates = `Date,Post Type,Caption,Likes,Comments,Shares,Reach
08/01/2026,Reel,"First Post",1000,50,20,5000
8/15/2026,Photo,"Middle Post",800,40,10,4000
08/30/2026,Carousel,"Final Post",1200,60,30,6000`;

  const metricsUSDates = await parseInstagramCSV(Buffer.from(csvUSDates));
  assert.strictEqual(metricsUSDates.period.start, '2026-08-01', 'Start date should format as YYYY-MM-DD');
  assert.strictEqual(metricsUSDates.period.end, '2026-08-30', 'End date should format as YYYY-MM-DD');
  assert.strictEqual(metricsUSDates.timeline[1].date, '2026-08-15', 'Middle date should format as 2026-08-15');
  console.log('✅ Passed: MM/DD/YYYY dates parsed and normalized to YYYY-MM-DD cleanly.\n');

  // -------------------------------------------------------------
  // Check 1.4: Numbers with commas, spaces, currency symbols
  // -------------------------------------------------------------
  console.log('[1.4] Testing numbers formatted with commas and spaces ("1,420")...');
  const csvFormattedNumbers = `Date,Likes,Comments,Shares,Reach,Followers
2026-08-01,"1,420","180","310","18,500","12,450"
2026-08-02,"2,150","290","640","26,400","13,920"`;

  const metricsFormatted = await parseInstagramCSV(Buffer.from(csvFormattedNumbers));
  assert.strictEqual(metricsFormatted.followers.start, 12450);
  assert.strictEqual(metricsFormatted.followers.end, 13920);
  assert.strictEqual(metricsFormatted.followers.netChange, 1470);
  assert.strictEqual(metricsFormatted.engagement.likes, 3570);
  assert.strictEqual(metricsFormatted.engagement.reach, 44900);
  console.log('✅ Passed: Formatted numbers with commas parsed without NaN.\n');

  // -------------------------------------------------------------
  // Check 5.1: Sparse Dataset (Only 1 Post)
  // -------------------------------------------------------------
  console.log('[5.1] Testing Sparse Dataset: Exactly 1 Post...');
  const csvSinglePost = `Date,Post Type,Caption,Likes,Comments,Shares,Reach,Followers
2026-09-01,Reel,"Single announcement post for new collection",950,85,45,12000,8500`;

  const metricsSingle = await parseInstagramCSV(Buffer.from(csvSinglePost));
  assert.strictEqual(metricsSingle.period.totalPosts, 1);
  assert.strictEqual(metricsSingle.trend.direction, 'flat');
  assert(metricsSingle.trend.description.includes('Single post in reporting period'), 'Should note single post');
  
  const summarySingle = generateFallbackSummary(metricsSingle, 'Luxe Apparel');
  console.log('Generated Summary for 1 Post:');
  console.log(`"${summarySingle}"\n`);
  
  // Verify strict fidelity (no hallucinated weekly trends or fake follower changes)
  assert(summarySingle.includes('published 1 Reel'), 'Must accurately describe 1 Reel');
  assert(summarySingle.includes('1,080 total interactions'), 'Must state exact computed engagement (950+85+45=1080)');
  assert(summarySingle.includes('single post record'), 'Must note that it is a single post');
  assert(!summarySingle.includes('week-over-week'), 'Must NOT invent weekly trends');
  assert(!summarySingle.includes('+0% change compared to the first half'), 'Must NOT use misleading half-over-half wording');
  console.log('✅ Passed: 1-post dataset adheres strictly to facts without hallucination.\n');

  // -------------------------------------------------------------
  // Check 5.2: Sparse Dataset (Only 2 Posts)
  // -------------------------------------------------------------
  console.log('[5.2] Testing Sparse Dataset: Exactly 2 Posts...');
  const csvTwoPosts = `Date,Post Type,Caption,Likes,Comments,Shares,Reach,Followers
2026-09-01,Photo,"First launch post",400,30,10,5000,8000
2026-09-05,Reel,"Follow-up tutorial",800,60,30,9000,8050`;

  const metricsTwo = await parseInstagramCSV(Buffer.from(csvTwoPosts));
  assert.strictEqual(metricsTwo.period.totalPosts, 2);
  
  const summaryTwo = generateFallbackSummary(metricsTwo, 'Luxe Apparel');
  console.log('Generated Summary for 2 Posts:');
  console.log(`"${summaryTwo}"\n`);
  
  assert(summaryTwo.includes('two-post sample'), 'Must state two-post sample');
  assert(summaryTwo.includes('1,330 interactions'), 'Must match exact total engagement (440+890=1330)');
  console.log('✅ Passed: 2-post dataset adheres strictly to facts without hallucination.\n');

  console.log('🎉 ALL ROBUSTNESS, FORMAT, AND DATA FIDELITY CHECKS PASSED!');
}

runRobustnessChecks().catch(err => {
  console.error('❌ Robustness check failed:', err);
  process.exit(1);
});
