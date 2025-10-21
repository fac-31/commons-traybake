# Parliament API Testing: Tooling & Workflow Guide

## I. Tool Recommendations

### Primary Stack: Bruno (Recommended over Postman)

**Why Bruno instead of Postman:**
- Git-friendly: Collections stored as plain text files in your repo
- Offline-first: no cloud sync required, no account needed
- Open source and completely free
- Scripting in JavaScript (matches your TypeScript comfort zone)
- Environments stored locally as files
- Team members just clone the repo and have all API configs

**Installation:**
```bash
# macOS
brew install bruno

# Windows (via Chocolatey)
choco install bruno

# Or download from: https://www.usebruno.com/downloads
```

### Alternative: HTTPie Desktop

**When to use HTTPie instead:**
- You prefer terminal-based workflows
- You want beautifully formatted JSON output immediately
- You're doing quick exploratory requests

**Installation:**
```bash
# macOS
brew install httpie

# Windows
scoop install httpie

# Or HTTPie Desktop for GUI
# Download from: https://httpie.io/desktop
```

### Supporting Tools

**1. jq (JSON query processor)**
Essential for parsing complex API responses from Parliament API.

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Windows
scoop install jq
```

**2. Postman (still useful for specific cases)**
Despite recommending Bruno, Postman has advantages for:
- Auto-generating API documentation
- Sophisticated mock servers
- More mature testing framework

Keep it around but use Bruno as primary tool.

---

## II. Parliament API Structure Overview

### Base URL
```
https://commonsvotes-api.parliament.uk/
https://members-api.parliament.uk/
https://bills-api.parliament.uk/
https://hansard-api.parliament.uk/
```

Each subdomain handles different data types. You'll primarily use Hansard API for debate transcripts.

### Authentication
Good news: Parliament API is public and requires no authentication for most endpoints. Rate limiting exists but is generous for development.

### Key Endpoints You'll Need

```
GET /api/v1/debates
GET /api/v1/debates/{id}
GET /api/v1/debates/{id}/contributions
GET /api/v1/search/debates?query={term}
GET /api/v1/bills
GET /api/v1/bills/{id}/stages
```

---

## III. Bruno Workflow Setup

### Step 1: Initialize Bruno Collection

Create a Bruno collection in your project:

```bash
cd your-project-root
mkdir -p api-testing/parliament
cd api-testing/parliament

# Bruno stores collections as plain files
# No special init command needed, just create the directory structure
```

### Step 2: Create Environment Files

```
api-testing/parliament/
├── environments/
│   ├── development.bru
│   ├── staging.bru
│   └── production.bru
├── collections/
│   ├── debates/
│   ├── bills/
│   └── members/
└── scripts/
    ├── pre-request.js
    └── post-response.js
```

**development.bru:**
```javascript
vars {
  base_url: https://hansard-api.parliament.uk/api/v1
  members_url: https://members-api.parliament.uk/api/v1
  bills_url: https://bills-api.parliament.uk/api/v1
  
  // Test data IDs you'll reuse
  test_debate_id: YOUR_TEST_ID_HERE
  test_member_id: 1423 // Example: Boris Johnson
  
  // Pagination defaults
  default_page_size: 20
  
  // Date ranges for your dataset
  start_date: 2023-01-01
  end_date: 2024-01-01
}
```

### Step 3: Create Request Templates

**debates/get-all-debates.bru:**
```javascript
meta {
  name: Get All Debates
  type: http
  seq: 1
}

get {
  url: {{base_url}}/debates
  body: none
  auth: none
}

params:query {
  skip: 0
  take: {{default_page_size}}
  searchTerm: NHS
  startDate: {{start_date}}
  endDate: {{end_date}}
}

script:pre-request {
  // Log what we're requesting
  console.log(`Fetching debates about: ${bru.getEnvVar('searchTerm')}`);
}

script:post-response {
  // Extract useful data for next requests
  const debates = res.body.items;
  
  if (debates && debates.length > 0) {
    // Store first debate ID for subsequent requests
    bru.setEnvVar('last_debate_id', debates[0].id);
    
    console.log(`Found ${debates.length} debates`);
    console.log(`Topics:`, debates.map(d => d.title));
  }
  
  // Save response to file for analysis
  const fs = require('fs');
  const path = require('path');
  
  fs.writeFileSync(
    path.join(__dirname, '../../data/raw-responses/debates-response.json'),
    JSON.stringify(res.body, null, 2)
  );
}

tests {
  test("Status is 200", function() {
    expect(res.status).to.equal(200);
  });
  
  test("Response has items array", function() {
    expect(res.body).to.have.property('items');
    expect(res.body.items).to.be.an('array');
  });
  
  test("Items have required fields", function() {
    const item = res.body.items[0];
    expect(item).to.have.property('id');
    expect(item).to.have.property('title');
    expect(item).to.have.property('date');
  });
}
```

**debates/get-debate-contributions.bru:**
```javascript
meta {
  name: Get Debate Contributions
  type: http
  seq: 2
}

get {
  url: {{base_url}}/debates/{{last_debate_id}}/contributions
  body: none
  auth: none
}

params:query {
  skip: 0
  take: 50
}

script:post-response {
  const contributions = res.body.items;
  
  if (contributions && contributions.length > 0) {
    // Analyze contribution structure
    const speakers = [...new Set(contributions.map(c => c.member?.name))];
    const parties = [...new Set(contributions.map(c => c.member?.party))];
    
    console.log(`Contributions: ${contributions.length}`);
    console.log(`Unique speakers: ${speakers.length}`);
    console.log(`Parties represented:`, parties);
    
    // Extract text for chunking analysis
    const totalWords = contributions.reduce((sum, c) => {
      return sum + (c.text?.split(' ').length || 0);
    }, 0);
    
    console.log(`Total words: ${totalWords}`);
    console.log(`Avg words per contribution: ${Math.round(totalWords / contributions.length)}`);
  }
}

tests {
  test("Has contributions", function() {
    expect(res.body.items.length).to.be.greaterThan(0);
  });
  
  test("Contributions have speaker data", function() {
    const contrib = res.body.items[0];
    expect(contrib).to.have.property('member');
    expect(contrib.member).to.have.property('name');
    expect(contrib.member).to.have.property('party');
  });
  
  test("Contributions have text content", function() {
    const contrib = res.body.items[0];
    expect(contrib).to.have.property('text');
    expect(contrib.text.length).to.be.greaterThan(0);
  });
}
```

### Step 4: Create Collection Runner Script

**scripts/test-data-pipeline.bru:**
```javascript
meta {
  name: Test Full Data Pipeline
  type: http
  seq: 100
}

script:pre-request {
  // Define topics you want to test
  const testTopics = [
    'NHS funding',
    'immigration policy',
    'climate change',
    'cost of living'
  ];
  
  bru.setVar('topics', testTopics);
  bru.setVar('currentTopicIndex', 0);
}

// This would be a sequence of requests
// Bruno will run them in order
```

---

## IV. Testing Workflow Patterns

### Pattern 1: Exploratory Testing (First Time)

**Goal:** Understand API structure and find good test data

```bash
# 1. Start with basic search
GET /debates?searchTerm=NHS&take=5

# 2. Examine response structure in Bruno
# Look for:
# - Available fields
# - Data completeness
# - Date formats
# - ID patterns

# 3. Pick an interesting debate ID
GET /debates/{id}

# 4. Get its contributions
GET /debates/{id}/contributions

# 5. Save interesting IDs to your environment file
```

**Bruno Script to Automate This:**
```javascript
// In post-response script
const fs = require('fs');

// Track interesting debates
const debate = res.body;
if (debate.contributions?.length > 30 && 
    debate.title.includes('Question')) {
  
  // This looks like PMQs
  const interestingData = {
    id: debate.id,
    title: debate.title,
    date: debate.date,
    type: 'PMQs',
    contributionCount: debate.contributions.length
  };
  
  // Append to tracking file
  let tracked = [];
  try {
    tracked = JSON.parse(fs.readFileSync('./interesting-debates.json'));
  } catch (e) {
    // File doesn't exist yet
  }
  
  tracked.push(interestingData);
  fs.writeFileSync('./interesting-debates.json', JSON.stringify(tracked, null, 2));
}
```

### Pattern 2: Dataset Validation

**Goal:** Verify your scraped data meets chunking requirements

**validation-suite.bru:**
```javascript
meta {
  name: Validate Dataset for Chunking
  type: http
  seq: 50
}

script:post-response {
  const contributions = res.body.items;
  
  const validation = {
    totalContributions: contributions.length,
    totalWords: 0,
    avgWordsPerContribution: 0,
    speakerDiversity: 0,
    partyBalance: {},
    missingData: [],
    chunking1024Estimate: 0,
    chunking256Estimate: 0
  };
  
  // Analyze contributions
  contributions.forEach((contrib, idx) => {
    // Word count
    const words = contrib.text?.split(/\s+/).length || 0;
    validation.totalWords += words;
    
    // Check for missing critical data
    if (!contrib.member?.name) {
      validation.missingData.push({
        index: idx,
        issue: 'Missing speaker name'
      });
    }
    
    if (!contrib.text || contrib.text.length < 50) {
      validation.missingData.push({
        index: idx,
        issue: 'Insufficient text content'
      });
    }
    
    // Party balance
    const party = contrib.member?.party || 'Unknown';
    validation.partyBalance[party] = (validation.partyBalance[party] || 0) + 1;
  });
  
  validation.avgWordsPerContribution = Math.round(validation.totalWords / contributions.length);
  validation.speakerDiversity = [...new Set(contributions.map(c => c.member?.name))].length;
  
  // Estimate chunk counts
  // Rough estimate: 1 token ≈ 0.75 words for English
  const totalTokens = validation.totalWords * 1.33;
  validation.chunking1024Estimate = Math.ceil(totalTokens / 1024);
  validation.chunking256Estimate = Math.ceil(totalTokens / 256);
  
  console.log('Dataset Validation Results:');
  console.log(JSON.stringify(validation, null, 2));
  
  // Check if dataset meets minimum requirements
  const meetsRequirements = 
    validation.totalWords >= 50000 &&
    validation.speakerDiversity >= 10 &&
    validation.missingData.length < contributions.length * 0.1;
  
  if (meetsRequirements) {
    console.log('✅ Dataset meets project requirements');
  } else {
    console.log('❌ Dataset needs improvement');
    console.log('Required: 50K+ words, 10+ speakers, <10% missing data');
  }
}
```

### Pattern 3: Automated Test Suite

**Goal:** Run before processing pipeline to catch API changes

Create a test suite that runs daily:

**bruno.json (collection config):**
```json
{
  "version": "1",
  "name": "Parliament API Tests",
  "type": "collection",
  "scripts": {
    "prerequest": "./scripts/pre-request.js",
    "test": "./scripts/test-suite.js"
  }
}
```

**scripts/test-suite.js:**
```javascript
// Run with: bru run --env development

const tests = [
  {
    name: 'API is accessible',
    endpoint: '/debates?take=1',
    expect: res => res.status === 200
  },
  {
    name: 'Search returns results',
    endpoint: '/debates?searchTerm=NHS&take=5',
    expect: res => res.body.items.length > 0
  },
  {
    name: 'Debate has contributions',
    endpoint: '/debates/{{test_debate_id}}/contributions',
    expect: res => res.body.items.length > 0
  },
  {
    name: 'Contributions have required fields',
    endpoint: '/debates/{{test_debate_id}}/contributions',
    expect: res => {
      const contrib = res.body.items[0];
      return contrib.text && 
             contrib.member?.name && 
             contrib.member?.party;
    }
  }
];

// Bruno will execute these automatically
module.exports = tests;
```

---

## V. HTTPie Workflows (Alternative/Supplement)

### Quick Command Reference

```bash
# Basic GET with pretty output
http GET https://hansard-api.parliament.uk/api/v1/debates searchTerm==NHS take==5

# Save response to file
http GET https://hansard-api.parliament.uk/api/v1/debates searchTerm==NHS take==5 > debates.json

# Pipe to jq for filtering
http GET https://hansard-api.parliament.uk/api/v1/debates searchTerm==NHS take==5 | \
  jq '.items[] | {id, title, date}'

# Extract all debate IDs
http GET https://hansard-api.parliament.uk/api/v1/debates searchTerm==NHS take==100 | \
  jq '.items[].id' > debate-ids.txt

# Chain requests (get debate, then get contributions)
DEBATE_ID=$(http GET https://hansard-api.parliament.uk/api/v1/debates take==1 | jq -r '.items[0].id')
http GET https://hansard-api.parliament.uk/api/v1/debates/$DEBATE_ID/contributions

# Timing requests
time http GET https://hansard-api.parliament.uk/api/v1/debates searchTerm==NHS take==100
```

### Shell Script for Bulk Testing

**scripts/fetch-test-data.sh:**
```bash
#!/bin/bash

# Fetch Parliament API test data

BASE_URL="https://hansard-api.parliament.uk/api/v1"
OUTPUT_DIR="./test-data"
mkdir -p "$OUTPUT_DIR"

# Topics to test
TOPICS=("NHS" "immigration" "climate" "education")

echo "Fetching test debates..."

for TOPIC in "${TOPICS[@]}"; do
  echo "Topic: $TOPIC"
  
  # Fetch debates
  http GET "$BASE_URL/debates" \
    searchTerm=="$TOPIC" \
    take==10 \
    startDate==2023-01-01 \
    > "$OUTPUT_DIR/debates-${TOPIC}.json"
  
  # Extract debate IDs
  DEBATE_IDS=$(jq -r '.items[].id' "$OUTPUT_DIR/debates-${TOPIC}.json")
  
  # Fetch contributions for each debate
  for ID in $DEBATE_IDS; do
    echo "  Fetching contributions for debate $ID"
    http GET "$BASE_URL/debates/$ID/contributions" \
      take==100 \
      > "$OUTPUT_DIR/contributions-${ID}.json"
    
    # Rate limiting: be nice to the API
    sleep 0.5
  done
done

echo "✅ Test data fetched to $OUTPUT_DIR"

# Analyze what we got
echo ""
echo "Dataset Summary:"
jq -s 'map(.items | length) | add' "$OUTPUT_DIR"/debates-*.json
echo "total debates"

TOTAL_WORDS=$(jq -s 'map(.items[].text // "" | split(" ") | length) | add' "$OUTPUT_DIR"/contributions-*.json)
echo "$TOTAL_WORDS total words"
```

---

## VI. Integration with Your Project

### Add API Testing to Your Repo

**Recommended structure:**
```
your-project/
├── src/
├── api-testing/
│   ├── parliament/
│   │   ├── environments/
│   │   ├── collections/
│   │   └── scripts/
│   ├── data/
│   │   ├── raw-responses/
│   │   └── test-datasets/
│   └── README.md
└── package.json
```

### Add Scripts to package.json

```json
{
  "scripts": {
    "api:test": "cd api-testing && bru run --env development",
    "api:validate": "cd api-testing && bru run collections/validation --env development",
    "api:fetch": "bash api-testing/scripts/fetch-test-data.sh",
    "api:analyze": "node api-testing/scripts/analyze-responses.js"
  }
}
```

### Create Analysis Script

**api-testing/scripts/analyze-responses.js:**
```javascript
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data/raw-responses');
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

console.log('Analyzing API responses...\n');

files.forEach(file => {
  const data = JSON.parse(fs.readFileSync(path.join(dataDir, file)));
  
  if (data.items) {
    console.log(`File: ${file}`);
    console.log(`  Items: ${data.items.length}`);
    
    if (data.items[0]?.text) {
      const totalWords = data.items.reduce((sum, item) => {
        return sum + (item.text?.split(/\s+/).length || 0);
      }, 0);
      console.log(`  Total words: ${totalWords.toLocaleString()}`);
      console.log(`  Avg per item: ${Math.round(totalWords / data.items.length)}`);
    }
    
    if (data.items[0]?.member) {
      const speakers = [...new Set(data.items.map(i => i.member?.name).filter(Boolean))];
      console.log(`  Unique speakers: ${speakers.length}`);
    }
    
    console.log('');
  }
});
```

---

## VII. Workflow for Team of 3

### Week 1, Day 1: Initial Setup

**Everyone together (30 mins):**
```bash
# Clone repo
git clone your-repo

# Set up Bruno
brew install bruno
cd api-testing/parliament

# Run first exploratory requests together
# Each person picks a different topic
# Person A: NHS
# Person B: Immigration  
# Person C: Climate
```

**Individual exploration (2 hours):**
Each person:
1. Finds 5-10 interesting debates on their topic
2. Examines contribution structure
3. Documents any data quality issues
4. Saves good debate IDs to shared environment file

**Sync at end of day:**
Commit your findings:
```bash
git add api-testing/parliament/environments/development.bru
git add api-testing/data/interesting-debates.json
git commit -m "Add initial test debate IDs for NHS/Immigration/Climate"
git push
```

### Day 2-3: Building Pipeline

**Use Bruno/HTTPie to:**
1. Test your data ingestion code against real API
2. Validate your TypeScript types match API response structure
3. Catch edge cases (missing fields, unusual formatting)

**Example validation workflow:**
```bash
# Fetch real data
npm run api:fetch

# Run your ingestion code
npm run ingest -- --source=api-testing/data/test-datasets/debates-NHS.json

# Verify output
npm run verify-chunks

# If chunks look wrong, debug in Bruno
# Examine the raw API response to see what went wrong
```

### Ongoing: Daily Health Checks

**Add to CI/CD or run manually:**
```bash
# Morning check before starting work
npm run api:test

# If fails, investigate in Bruno
# API might be down, or structure changed
```

---

## VIII. Advanced Techniques

### 1. Response Diffing

Track API changes over time:

**scripts/diff-responses.sh:**
```bash
#!/bin/bash

# Fetch current response
http GET https://hansard-api.parliament.uk/api/v1/debates/12345 \
  > current.json

# Compare to baseline
if [ -f baseline.json ]; then
  diff <(jq -S . baseline.json) <(jq -S . current.json)
else
  echo "No baseline found, creating one"
  cp current.json baseline.json
fi
```

### 2. Mock Data Generation

Generate mock responses for testing without API calls:

**scripts/generate-mock-data.js:**
```javascript
const fs = require('fs');

// Based on real API responses, create mocks
function generateMockDebate(topic, numContributions = 20) {
  const parties = ['Conservative', 'Labour', 'Liberal Democrat', 'SNP'];
  const roles = ['Minister', 'Shadow Minister', 'Backbencher'];
  
  return {
    id: `mock-${topic}-${Date.now()}`,
    title: `General Debate on ${topic}`,
    date: new Date().toISOString(),
    items: Array.from({ length: numContributions }, (_, i) => ({
      id: `contrib-${i}`,
      member: {
        name: `Mock MP ${i}`,
        party: parties[i % parties.length],
        role: roles[i % roles.length]
      },
      text: `This is mock contribution ${i} about ${topic}. `.repeat(50),
      hansardRef: `HC Deb 01 Jan 2024 vol 999 c${i * 10}`
    }))
  };
}

// Generate test datasets
const mockDebates = [
  generateMockDebate('NHS', 30),
  generateMockDebate('Immigration', 25),
  generateMockDebate('Climate', 35)
];

mockDebates.forEach(debate => {
  fs.writeFileSync(
    `./test-data/mock-${debate.title.replace(/\s+/g, '-')}.json`,
    JSON.stringify(debate, null, 2)
  );
});

console.log('✅ Generated mock data');
```

### 3. Rate Limit Testing

Test your code's behavior under rate limiting:

**scripts/test-rate-limits.js:**
```javascript
const axios = require('axios');

async function testRateLimits() {
  const baseURL = 'https://hansard-api.parliament.uk/api/v1';
  const requests = 100;
  const results = {
    successful: 0,
    failed: 0,
    rateLimited: 0
  };
  
  console.log(`Sending ${requests} requests...`);
  
  for (let i = 0; i < requests; i++) {
    try {
      const response = await axios.get(`${baseURL}/debates`, {
        params: { take: 1 }
      });
      
      if (response.status === 200) {
        results.successful++;
      }
    } catch (error) {
      if (error.response?.status === 429) {
        results.rateLimited++;
        console.log(`Rate limited at request ${i}`);
        
        // Check for Retry-After header
        const retryAfter = error.response.headers['retry-after'];
        if (retryAfter) {
          console.log(`Retry after: ${retryAfter} seconds`);
        }
      } else {
        results.failed++;
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\nResults:', results);
}

testRateLimits();
```

---

## IX. Troubleshooting Common Issues

### Issue: "Cannot find debates about X"

**Debug in Bruno:**
1. Check search term encoding
2. Try broader date ranges
3. Verify topic exists in parliamentary record
4. Check if you're searching the right API subdomain

```javascript
// In Bruno post-response script
if (res.body.items.length === 0) {
  console.log('No results found');
  console.log('Search term:', bru.getVar('searchTerm'));
  console.log('Date range:', bru.getVar('start_date'), 'to', bru.getVar('end_date'));
  
  // Try alternative terms
  const alternatives = ['healthcare', 'health service', 'medical'];
  console.log('Try these alternatives:', alternatives);
}
```

### Issue: "Response structure different than expected"

**Validate schema:**
```javascript
// Bruno test script
const expectedSchema = {
  items: 'array',
  'items[0].id': 'string',
  'items[0].text': 'string',
  'items[0].member.name': 'string'
};

function validateSchema(obj, schema, path = '') {
  Object.keys(schema).forEach(key => {
    const fullPath = path ? `${path}.${key}` : key;
    
    if (key.includes('[0]')) {
      // Array item check
      const arrayPath = key.split('[0]')[0];
      const itemKey = key.split('[0].')[1];
      
      if (Array.isArray(obj[arrayPath]) && obj[arrayPath].length > 0) {
        const item = obj[arrayPath][0];
        if (typeof item[itemKey] !== schema[key]) {
          console.error(`Schema mismatch at ${fullPath}: expected ${schema[key]}, got ${typeof item[itemKey]}`);
        }
      }
    } else {
      if (typeof obj[key] !== schema[key]) {
        console.error(`Schema mismatch at ${fullPath}: expected ${schema[key]}, got ${typeof obj[key]}`);
      }
    }
  });
}

validateSchema(res.body, expectedSchema);
```

### Issue: "Too much data, running out of memory"

**Paginate properly:**
```javascript
// Bruno script for handling large datasets
async function fetchAllContributions(debateId) {
  const baseUrl = bru.getEnvVar('base_url');
  let allContributions = [];
  let skip = 0;
  const take = 100;
  let hasMore = true;
  
  while (hasMore) {
    const response = await fetch(
      `${baseUrl}/debates/${debateId}/contributions?skip=${skip}&take=${take}`
    );
    
    const data = await response.json();
    allContributions.push(...data.items);
    
    console.log(`Fetched ${data.items.length} contributions (total: ${allContributions.length})`);
    
    hasMore = data.items.length === take;
    skip += take;
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return allContributions;
}
```

---

## X. Quick Start Checklist

```bash
# Day 1 setup
[ ] Install Bruno: brew install bruno
[ ] Install HTTPie: brew install httpie  
[ ] Install jq: brew install jq
[ ] Create api-testing/ directory in repo
[ ] Set up Bruno collection structure
[ ] Create development environment file
[ ] Test first request: GET /debates?take=1
[ ] Document initial findings

# Week 1 workflow
[ ] Explore API with Bruno (30 mins/day)
[ ] Identify 20+ good test debates
[ ] Save debate IDs to environment file
[ ] Create validation scripts
[ ] Test data pipeline integration
[ ] Document any API quirks
[ ] Share findings with team

# Ongoing
[ ] Run daily health check: npm run api:test
[ ] Update environment when finding good data
[ ] Document any API changes
[ ] Generate mock data for offline testing
```

---

## XI. Final Recommendations

**Use Bruno as your primary tool because:**
1. Everything is version-controlled
2. Team members have identical setup
3. Scripts integrate with your TypeScript codebase
4. No cloud dependencies or accounts

**Use HTTPie for:**
1. Quick exploratory requests
2. Command-line scripting
3. CI/CD integration
4. Generating test data

**Use Postman only for:**
1. Generating API documentation
2. Complex mock server scenarios
3. If someone really prefers the UI

**Most importantly:**
Don't just test the API. Test your assumptions about the data structure, completeness, and what "good" test data looks like for your chunking experiments.

The goal isn't to verify the Parliament API works (it does). The goal is to understand the data well enough that your chunking pipelines won't fall over when they encounter parliamentary edge cases.

Good luck wrangling Westminster's finest rhetoric into vectors.
