const assert = require('assert');

async function testApi() {
  console.log('🚀 Running Backend API Integration Test...\n');
  const app = require('../server');

  // Wait 500ms for db init
  await new Promise(res => setTimeout(res, 500));

  const PORT = 5001;
  const server = app.listen(PORT, async () => {
    try {
      const baseUrl = `http://localhost:${PORT}/api`;

      // 1. Health check
      console.log('Checking health endpoint...');
      const healthRes = await fetch(`${baseUrl}/health`);
      const health = await healthRes.json();
      assert.strictEqual(health.status, 'ok');
      console.log('✅ Health check passed.');

      // 2. Register user
      const testEmail = `agent_test_${Date.now()}@agency.com`;
      console.log(`Registering test user: ${testEmail}...`);
      const regRes = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'password123',
          agency_name: 'Apex Digital Agency',
          brand_color: '#EC4899'
        })
      });
      const regData = await regRes.json();
      assert(regData.token, 'Token should be returned on registration');
      assert.strictEqual(regData.user.agency_name, 'Apex Digital Agency');
      assert.strictEqual(regData.user.brand_color, '#EC4899');
      console.log('✅ Registration & Auth token issuance passed.');

      const token = regData.token;

      // 3. Update Agency Branding
      console.log('Updating agency branding...');
      const brandRes = await fetch(`${baseUrl}/agency/branding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          agency_name: 'Apex Growth Studio',
          brand_color: '#8B5CF6'
        })
      });
      const brandData = await brandRes.json();
      assert.strictEqual(brandData.user.agency_name, 'Apex Growth Studio');
      assert.strictEqual(brandData.user.brand_color, '#8B5CF6');
      console.log('✅ Agency branding update passed.');

      // 4. Generate report using sample CSV
      console.log('Generating report with sample data...');
      const genRes = await fetch(`${baseUrl}/reports/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          client_name: 'Glow Botanicals',
          use_sample: true
        })
      });
      const genData = await genRes.json();
      assert(genData.report, 'Report should be returned');
      assert(genData.report.shareable_token, 'Shareable token should exist');
      assert.strictEqual(genData.report.client_name, 'Glow Botanicals');
      assert.strictEqual(genData.report.computed_metrics.followers.netChange, 1470);
      assert.strictEqual(genData.report.computed_metrics.topPosts.length, 3);
      assert(genData.report.summary_text.length > 20, 'Executive summary should be populated');
      console.log('✅ Report generation passed. Summary preview:', genData.report.summary_text.substring(0, 100) + '...');

      // 5. Test Public Access via shareable token (no auth header)
      console.log(`Checking public read-only access with token: ${genData.report.shareable_token}...`);
      const pubRes = await fetch(`${baseUrl}/reports/public/${genData.report.shareable_token}`);
      const pubData = await pubRes.json();
      assert(pubData.report, 'Public report should be accessible');
      assert.strictEqual(pubData.report.client_name, 'Glow Botanicals');
      assert.strictEqual(pubData.report.agency_name, 'Apex Growth Studio');
      assert.strictEqual(pubData.report.brand_color, '#8B5CF6');
      console.log('✅ Public read-only client access passed.');

      console.log('\n🎉 ALL BACKEND API INTEGRATION TESTS PASSED!');
      server.close();
      process.exit(0);
    } catch (err) {
      console.error('❌ API Test failed:', err);
      server.close();
      process.exit(1);
    }
  });
}

testApi();
