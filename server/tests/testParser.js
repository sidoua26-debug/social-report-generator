const path = require('path');
const assert = require('assert');
const { parseInstagramCSV } = require('../services/csvParser');

async function runTests() {
  console.log('🧪 Starting CSV Parser & Metrics Computation Tests...\n');

  // Test 1: Valid Instagram export CSV
  const samplePath = path.join(__dirname, '../data/sample_instagram_export.csv');
  console.log(`[Test 1] Parsing valid sample CSV at ${samplePath}...`);
  
  const metrics = await parseInstagramCSV(samplePath);

  console.log('Parsed Metrics Summary:');
  console.log('- Period:', `${metrics.period.start} to ${metrics.period.end} (${metrics.period.totalPosts} posts)`);
  console.log('- Followers:', `${metrics.followers.start} -> ${metrics.followers.end} (Net: +${metrics.followers.netChange}, Growth: +${metrics.followers.growthRatePct}%)`);
  console.log('- Total Engagement:', metrics.engagement.total, `(Likes: ${metrics.engagement.likes}, Comments: ${metrics.engagement.comments}, Shares: ${metrics.engagement.shares}, Saves: ${metrics.engagement.saves})`);
  console.log('- Engagement Rate:', `${metrics.engagement.engagementRatePct}%`);
  console.log('- Period Trend:', metrics.trend.description);
  console.log('- Top 3 Posts Count:', metrics.topPosts.length);

  assert.strictEqual(metrics.period.totalPosts, 12, 'Expected 12 posts');
  assert.strictEqual(metrics.followers.start, 12450, 'Start followers should be 12450');
  assert.strictEqual(metrics.followers.end, 13920, 'End followers should be 13920');
  assert.strictEqual(metrics.followers.netChange, 1470, 'Net follower change should be 1470');
  assert.strictEqual(metrics.topPosts.length, 3, 'Should have exactly 3 top posts');
  
  // Post #1 should be the launch day POV Reel with 3240 likes + 410 comments + 780 shares + 620 saves = 5050 engagement
  assert.strictEqual(metrics.topPosts[0].totalEngagement, 5050, 'Top post total engagement should be 5050');
  assert.strictEqual(metrics.topPosts[0].type, 'Reel', 'Top post should be a Reel');
  console.log('✅ Test 1 Passed: Valid Instagram export calculated correctly.\n');

  // Test 2: Invalid/Wrong CSV (e.g. no social media columns)
  console.log('[Test 2] Testing error handling with a wrong/unrelated CSV...');
  const fakeCSV = 'Account,Amount,Category\n1234,450.00,Groceries\n5678,120.00,Dining';
  
  try {
    await parseInstagramCSV(Buffer.from(fakeCSV));
    assert.fail('Expected error was not thrown for invalid CSV');
  } catch (err) {
    console.log('Captured expected error:', err.message);
    assert(err.message.includes('Invalid Instagram CSV format'), 'Error should describe missing columns');
    console.log('✅ Test 2 Passed: Invalid CSV format caught with informative error.\n');
  }

  // Test 3: Empty CSV
  console.log('[Test 3] Testing error handling with an empty CSV...');
  try {
    await parseInstagramCSV(Buffer.from(''));
    assert.fail('Expected error was not thrown for empty CSV');
  } catch (err) {
    console.log('Captured expected error:', err.message);
    assert(err.message.includes('empty'), 'Error should mention empty file');
    console.log('✅ Test 3 Passed: Empty CSV caught properly.\n');
  }

  console.log('🎉 ALL CSV PARSER & METRICS TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
