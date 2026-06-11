const https = require('https');

async function testApi() {
  const host = 'servidor-form-track-servidor-api.ubufeb.easypanel.host';
  
  // 1. Login
  const loginReq = await fetch(`https://${host}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: 'admin', password: 'admin_secure_pass' })
  });
  
  if (!loginReq.ok) {
    console.error('Login failed', loginReq.status, await loginReq.text());
    return;
  }
  const { token } = await loginReq.json();
  
  // 2. Get projects
  const projReq = await fetch(`https://${host}/admin/projects`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const projData = await projReq.json();
  console.log('Projects:', projData.projects.map(p => ({ id: p.id, name: p.name })));
  
  if (!projData.projects || projData.projects.length === 0) return;
  const projectId = projData.projects[0].id;
  
  // 3. Get metrics
  console.log('Fetching metrics for', projectId);
  const metricsReq = await fetch(`https://${host}/admin/projects/${projectId}/metrics`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!metricsReq.ok) {
    console.error('Metrics failed', metricsReq.status, await metricsReq.text());
    return;
  }
  
  const metricsData = await metricsReq.json();
  console.log('Metrics:', metricsData);
}

testApi();
