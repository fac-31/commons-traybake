# Parliament API

![Icon]()

> [!IMPORTANT]
> Work with user to define requirements

---

## 1. Tasks
> [!NOTE]
> This tasklist does not include upcoming [MVP Milestones](docs/dev/roadmap/Gov-API-MVP.md#2-mvp-milestones)

### 1.1. Open Tasks
#### 1.1.1. Due Tasks

#### 1.1.2. Other Tasks
- [ ] Implement `fetchBillDebates()` functionality (currently returns empty array)
- [ ] Create Bruno API test collection for automated endpoint validation
- [ ] Build validation dataset checklist (50k+ words, 10+ speakers, <10% missing data)
- [ ] Add XML response parsing capabilities for older Hansard endpoints
- [ ] Implement aggressive caching strategy to respect API rate limits

### 1.2. Blocked Tasks
- [ ] Integration testing of API client (blocked: needs test debate dataset)

---

## 2. MVP Milestones
1. **Parliament API Client Implementation** - Core client architecture with retry logic, rate limiting, and modular endpoint support
2. **Type System for Parliamentary Data** - Complete TypeScript interfaces for debates, contributions, speakers, and Hansard references
3. **Data Fetching Workflows** - Functional methods for fetching debates by date, topic, and bill
4. **API Testing Documentation** - Comprehensive guide covering Bruno, HTTPie, validation schemas, and testing workflows

---

## 3. Beyond MVP: Future Features
- Members API integration for detailed MP biographical data
- Lords Hansard support for Upper House debates
- Written Statements and Written Questions fetching
- Treaty API integration for international agreements
- Historic Hansard API for pre-digital debates
- Real-time debate streaming for live coverage
- Automated data quality monitoring and alerting

---

## 4. Work Record
### 4.1. Completed Milestones
- **Parliament API Client Implementation** ✅ - Modular client architecture complete with:
  - Base client with exponential backoff retry (3 attempts, 500ms delay)
  - Hansard client for debates by date and ID
  - Commons Votes client for division searches
  - Bills client for bill metadata and stages
  - Rate limiting protection (500ms between requests)

- **Type System for Parliamentary Data** ✅ - Comprehensive TypeScript types defined in `/src/types/index.ts`:
  - `Debate`, `Contribution`, `Speaker`, `HansardReference` interfaces
  - Enums for `DebateType` (PMQs, General, Committee, Written Questions)
  - Enums for `ContributionType` (speech, intervention, question, answer)
  - `DateRange` utility for topic searches

- **API Testing Documentation** ✅ - 1000+ line comprehensive guide (`/docs/api-testing-guide.md`) covering:
  - Bruno setup and workflow patterns
  - HTTPie command reference for quick CLI testing
  - Response validation schemas
  - Rate limit testing strategies
  - Mock data generation
  - Response diffing and comparison techniques

### 4.2. Completed Tasks
#### 4.2.1. Record of Past Deadlines

#### 4.2.2. Record of Other Completed Tasks
- Created `ParliamentAPI` orchestrator class in `/src/ingestion/parliament-api-client.ts`
- Implemented abstract `BaseClient` with axios integration and error handling
- Built `HansardClient` for Commons debates API (2 endpoints)
- Built `CommonsClient` for divisions/votes API
- Built `BillsClient` for Bills API (bill lookup, stages)
- Developed parsers for debates, contributions, speakers, Hansard references (`/src/ingestion/parsers/`)
- Implemented text transformers: HTML entity decoding, whitespace normalization, procedural marker extraction
- Created basic API test scripts (`/scripts/simple-api-test.ts`, `/scripts/test-parliament-api.ts`)
