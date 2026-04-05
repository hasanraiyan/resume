const fs = require('fs');

const path = 'src/components/snaplinks/AnalyticsTab.js';
let content = fs.readFileSync(path, 'utf8');

// Fix the chart data parsing based on what the API actually returns
const oldCode = `const { link, summary, chartData, devices, countries, referrers } = analytics;`;
const newCode = `const { linkDetails: link, summary, clicksOverTime, devices, countries, topReferrers: referrers } = analytics;

  // Transform clicksOverTime into chart.js format
  const chartData = {
    labels: clicksOverTime ? clicksOverTime.map(c => c.date) : [],
    data: clicksOverTime ? clicksOverTime.map(c => c.clicks) : []
  };`;

content = content.replace(oldCode, newCode);

// Fix totalClicks variable
content = content.replace('summary.uniqueClicks', 'summary.uniqueVisitors');

// Fix array mapping properties
content = content.replace('ref._id', 'ref.referrer');
content = content.replace('dev._id', 'dev.device');
content = content.replace('country._id', 'country.country');

fs.writeFileSync(path, content);
console.log('Updated AnalyticsTab.js');
