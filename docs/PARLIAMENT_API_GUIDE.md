# UK Parliament API Developer Guide

> Complete reference for all UK Parliament API endpoints

**Last Updated**: November 2025
**Maintained By**: Parliament Software Engineering Team

---

## Quick Navigation

- [**Hansard API**](#hansard-api) - Debates, speeches, and contributions
- [**Members API**](#members-api) - MP and Lords information
- [**Commons Votes API**](#commons-votes-api) - Division records
- [**Committees API**](#committees-api) - Committee information
- [**Bills API**](#bills-api) - Legislative bill tracking

---

# Hansard API

**Base URL**: `https://hansard-api.parliament.uk`
**Documentation**: [Swagger UI](https://hansard-api.parliament.uk/swagger/ui/index)
**Contact**: softwareengineering@parliament.uk

The Hansard API provides access to the official report of all Parliamentary debates.

---

## Debates Endpoints

### GET `/debates/debate/{debateSectionExtId}.{format}`

**What data**: Complete debate section including title, date, location, house, and all member contributions with full text.

**Use cases**:
- Retrieving full transcript of a specific debate
- Analyzing individual contributions within a debate
- Building debate timelines with timestamps
- Citation and reference generation

**Request Parameters**:
- `debateSectionExtId` (path, required): External ID of the debate section (obtained from search results)
- `format` (path, required): Output format - `json` or `xml`

**Response Structure**:
```json
{
  "Overview": {
    "Id": 4798420,
    "ExtId": "26F0D38E-CA94-4935-93BF-303D25B8F110",
    "Title": "NHS Waiting Lists",
    "Date": "2024-12-11T00:00:00",
    "Location": "Commons Chamber",
    "House": "Commons",
    "VolumeNo": 758,
    "HansardSection": "AA-AD"
  },
  "Navigator": [...],
  "Items": [
    {
      "ItemType": "Contribution",
      "ItemId": 41699413,
      "MemberId": 4804,
      "AttributedTo": "Mr Gagan Mohindra (South West Hertfordshire) (Con)",
      "Value": "<Question>...</Question>",
      "Timecode": "2024-12-11T11:45:57",
      "HansardSection": "AA-AD",
      "UIN": "901694"
    }
  ]
}
```

**Related Endpoints**:
- [`/search/debates.{format}`](#get-searchdebatesformat) - Find debates to get ExtId
- [`/debates/divisions/{debateSectionExtId}.{format}`](#get-debatesdivisionsdebatesectionextidformat) - Get divisions within this debate
- [`/debates/speakerslist/{debateSectionExtId}.{format}`](#get-debatesspeakerslistdebatesectionextidformat) - Get all speaker IDs

**Example**:
```bash
curl "https://hansard-api.parliament.uk/debates/debate/26F0D38E-CA94-4935-93BF-303D25B8F110.json"
```

---

### GET `/debates/divisions/{debateSectionExtId}.{format}`

**What data**: List of all divisions (votes) that occurred during a specific debate section.

**Use cases**:
- Finding voting records related to a debate
- Analyzing which debates had divisions
- Tracking controversial debates (those with votes)

**Request Parameters**:
- `debateSectionExtId` (path, required): External ID of the debate section
- `format` (path, required): `json` or `xml`

**Response Structure**:
```json
[
  {
    "DivisionId": 12345,
    "Title": "Division on NHS Funding",
    "Date": "2024-12-11T00:00:00",
    "ExtId": "ABC123..."
  }
]
```

**Related Endpoints**:
- [`/debates/division/{divisionExtId}.{format}`](#get-debatesdivisiondivisionextidformat) - Get full division details
- [`/debates/debate/{debateSectionExtId}.{format}`](#get-debatesdebatedebatesectionextidformat) - Get the debate itself

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Debates/Debates_GetDivisionsList)

---

### GET `/debates/division/{divisionExtId}.{format}`

**What data**: Complete division voting record including debate title, Aye/Noe counts, house, and individual member votes.

**Use cases**:
- Analyzing voting patterns
- Member voting history
- EVEL (English Votes for English Laws) analysis
- Party whip compliance tracking

**Request Parameters**:
- `divisionExtId` (path, required): External ID of the division
- `format` (path, required): `json` or `xml`
- `isEvel` (query, optional): Filter for EVEL voters only (boolean)

**Response Structure**:
```json
{
  "DivisionId": 12345,
  "Title": "Division on NHS Funding",
  "Date": "2024-12-11T00:00:00",
  "House": "Commons",
  "AyeCount": 320,
  "NoeCount": 285,
  "AyeVotes": [
    {
      "MemberId": 4804,
      "Name": "John Smith",
      "Party": "Labour"
    }
  ],
  "NoeVotes": [...]
}
```

**Related Endpoints**:
- [`/search/divisions.{format}`](#get-searchdivisionsformat) - Search for divisions
- [`/debates/divisions/{debateSectionExtId}.{format}`](#get-debatesdivisionsdebatesectionextidformat) - Find divisions in a debate

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Debates/Debates_GetDivision)

---

### GET `/debates/speakerslist/{debateSectionExtId}.{format}`

**What data**: Array of speaker/member IDs who participated in a debate section.

**Use cases**:
- Identifying debate participants
- Member participation analysis
- Cross-referencing with Members API for full details

**Request Parameters**:
- `debateSectionExtId` (path, required): External ID of the debate section
- `format` (path, required): `json` or `xml`

**Response Structure**:
```json
[4804, 5332, 4425, 1234, ...]
```

**Related Endpoints**:
- [`/debates/debate/{debateSectionExtId}.{format}`](#get-debatesdebatedebatesectionextidformat) - Get full debate
- Members API `/Members/{id}` - Get member details from IDs

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Debates/Debates_GetSpeakersList)

---

### GET `/debates/topleveldebateid/{debateSectionExtId}.{format}`

**What data**: The parent/top-level debate ID for a given child debate section.

**Use cases**:
- Navigating debate hierarchies
- Finding the main debate from a sub-section
- Building debate tree structures

**Request Parameters**:
- `debateSectionExtId` (path, required): External ID of a child debate section
- `format` (path, required): `json` or `xml`

**Response Structure**:
```json
"51011BDA-4E9F-4516-9EE8-D90957FABA7F"
```

**Related Endpoints**:
- [`/debates/debate/{debateSectionExtId}.{format}`](#get-debatesdebatedebatesectionextidformat) - Use returned ID to get parent debate
- [`/overview/sectiontrees.{format}`](#get-overviewsectiontreesformat) - See full debate tree

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Debates/Debates_GetTopLevelDebateId)

---

### GET `/debates/topleveldebatebytitle.{format}`

**What data**: Top-level debate matching specific house, date, and section title.

**Use cases**:
- Direct debate lookup by title
- Finding specific debates without search
- Bookmarking/linking to known debates

**Request Parameters**:
- `house` (query, required): `Commons` or `Lords`
- `date` (query, required): Sitting date `yyyy-mm-dd`
- `sectionTitle` (query, required): Section title to match
- `format` (path, required): `json` or `xml`

**Response Structure**: Same as `/debates/debate/{debateSectionExtId}.{format}`

**Related Endpoints**:
- [`/overview/sectionsforday.{format}`](#get-overviewsectionsfordayformat) - Get available section titles for a date

**Example**:
```bash
curl "https://hansard-api.parliament.uk/debates/topleveldebatebytitle.json?house=Commons&date=2024-12-11&sectionTitle=Wales"
```

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Debates/Debates_GetTopLevelDebateByTitle)

---

### GET `/debates/memberdebatecontributions/{memberId}.{format}`

**What data**: All contributions made by a specific member within a debate section.

**Use cases**:
- Member activity tracking
- Analyzing individual MP contributions
- Building member participation history

**Request Parameters**:
- `memberId` (path, required): MNIS ID of the member
- `debateSectionExtId` (query, required): External ID of the debate section
- `format` (path, required): `json` or `xml`

**Response Structure**:
```json
[
  {
    "ContributionId": "ABC123",
    "MemberId": 4804,
    "Text": "...",
    "Timestamp": "2024-12-11T11:46:22",
    "Type": "Speech"
  }
]
```

**Related Endpoints**:
- [`/search/membercontributionsummary/{memberId}.{format}`](#get-searchmembercontributionsummarymemberidformat) - Get contribution summary
- Members API `/Members/{id}` - Get member details

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Debates/Debates_GetMemberContributionDetails)

---

## Search Endpoints

### GET `/search/debates.{format}`

**What data**: Debates matching search criteria with filters for house, date range, topic, member, division, and more.

**Use cases**:
- Finding debates by topic/keyword
- Date-range debate searches
- Member-specific debate history
- Department-specific debates

**Request Parameters**:
- `format` (path, required): `json` or `xml`
- `queryParameters.house` (query): `Commons` or `Lords`
- `queryParameters.startDate` (query): Start date `yyyy-mm-dd`
- `queryParameters.endDate` (query): End date `yyyy-mm-dd`
- `queryParameters.date` (query): Specific date `yyyy-mm-dd`
- `queryParameters.searchTerm` (query): Keyword to search for
- `queryParameters.memberId` (query): Filter by member ID
- `queryParameters.divisionId` (query): Filter by division ID
- `queryParameters.department` (query): Filter by department
- `queryParameters.debateType` (query): Type of debate
- `queryParameters.skip` (query): Pagination offset (default 0)
- `queryParameters.take` (query): Results per page
- `queryParameters.orderBy` (query): `SittingDateAsc` or `SittingDateDesc`

**Response Structure**:
```json
{
  "Results": [
    {
      "DebateSection": "Commons Chamber",
      "SittingDate": "2024-12-11T00:00:00",
      "House": "Commons",
      "Title": "NHS Waiting Lists",
      "Rank": 0,
      "DebateSectionExtId": "26F0D38E-CA94-4935-93BF-303D25B8F110"
    }
  ],
  "TotalResultCount": 51
}
```

**Related Endpoints**:
- [`/debates/debate/{debateSectionExtId}.{format}`](#get-debatesdebatedebatesectionextidformat) - Use ExtId to get full debate

**Example**:
```bash
curl "https://hansard-api.parliament.uk/search/debates.json?queryParameters.searchTerm=NHS&queryParameters.startDate=2024-01-01&queryParameters.endDate=2024-12-31&queryParameters.take=50"
```

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Search/Search_SearchDebates)

---

### GET `/search/divisions.{format}`

**What data**: Division (vote) records matching search criteria.

**Use cases**:
- Finding votes on specific topics
- Analyzing voting patterns over time
- Department-specific voting records

**Request Parameters**: Similar to `/search/debates.{format}` with additional:
- `queryParameters.withDivision` (query): Only include results with divisions

**Response Structure**:
```json
{
  "Results": [
    {
      "DivisionId": 12345,
      "Title": "Division on NHS Funding",
      "Date": "2024-12-11T00:00:00",
      "House": "Commons",
      "ExtId": "ABC123..."
    }
  ],
  "TotalResultCount": 25
}
```

**Related Endpoints**:
- [`/debates/division/{divisionExtId}.{format}`](#get-debatesdivisiondivisionextidformat) - Get full division details

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Search/Search_SearchDivisions)

---

### GET `/search/contributions/{contributionType}.{format}`

**What data**: Individual member contributions filtered by type (speech, intervention, question, answer).

**Use cases**:
- Finding all questions on a topic
- Analyzing minister answers
- Intervention frequency analysis

**Request Parameters**:
- `contributionType` (path, required): Type of contribution
- All standard search parameters (date, member, topic, etc.)

**Response Structure**: Array of contribution records with member details, text snippets, and debate references.

**Related Endpoints**:
- [`/search/debates.{format}`](#get-searchdebatesformat) - Find debates containing contributions
- [`/debates/memberdebatecontributions/{memberId}.{format}`](#get-debatesmemberdebatecontributionsmemberidformat)

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Search/Search_SearchContributions)

---

### GET `/search/members.{format}`

**What data**: Search for members by name, party, constituency with current/former filters.

**Use cases**:
- Finding member IDs for other API calls
- Member lookup by constituency
- Party membership lists

**Request Parameters**:
- `queryParameters.searchTerm` (query): Name or constituency to search
- `queryParameters.house` (query): `Commons` or `Lords`
- `queryParameters.includeFormer` (query): Include former members
- `queryParameters.includeCurrent` (query): Include current members
- `queryParameters.skip`, `queryParameters.take`: Pagination

**Response Structure**:
```json
{
  "Results": [
    {
      "MemberId": 4804,
      "Name": "John Smith",
      "Party": "Labour",
      "Constituency": "North West Example"
    }
  ],
  "TotalResultCount": 15
}
```

**Related Endpoints**:
- Members API `/Members/{id}` - Get full member details
- [`/search/membercontributionsummary/{memberId}.{format}`](#get-searchmembercontributionsummarymemberidformat)

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Search/Search_SearchMembers)

---

### GET `/search/membercontributionsummary/{memberId}.{format}`

**What data**: Summary of a member's contributions including total count, breakdown by type, and date range.

**Use cases**:
- Member activity dashboards
- Participation metrics
- Comparative analysis between members

**Request Parameters**:
- `memberId` (path, required): MNIS ID of member
- `queryParameters.startDate`, `queryParameters.endDate`: Date range
- `format` (path, required): `json` or `xml`

**Response Structure**:
```json
{
  "MemberId": 4804,
  "TotalContributions": 245,
  "Speeches": 120,
  "Questions": 85,
  "Interventions": 40,
  "StartDate": "2024-01-01",
  "EndDate": "2024-12-31"
}
```

**Related Endpoints**:
- [`/debates/memberdebatecontributions/{memberId}.{format}`](#get-debatesmemberdebatecontributionsmemberidformat) - Get actual contributions

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Search/Search_GetMemberContributionSummary)

---

### GET `/search/committees.{format}`

**What data**: Committee debates and proceedings matching search criteria.

**Use cases**:
- Finding committee inquiries
- Committee-specific topic research
- Analyzing committee activity

**Request Parameters**:
- `queryParameters.committeeTitle` (query): Committee name to filter
- `queryParameters.committeeType` (query): Committee type ID
- `queryParameters.includeCommitteeDivisions` (query): Include divisions
- Standard search parameters (date, topic, etc.)

**Response Structure**: Similar to debates search with committee-specific metadata.

**Related Endpoints**:
- Committees API (external) - Get committee details
- [`/search/committeedebates.{format}`](#get-searchcommitteedebatesformat)

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Search/Search_SearchCommittees)

---

### GET `/search/committeedebates.{format}`

**What data**: Debates that occurred in committee settings.

**Use cases**:
- Committee proceeding transcripts
- Witness testimony analysis
- Bill committee stages

**Request Parameters**: Standard search parameters with committee-specific filters.

**Response Structure**: Similar to regular debate search results.

**Related Endpoints**:
- [`/search/committees.{format}`](#get-searchcommitteesformat)
- [`/debates/debate/{debateSectionExtId}.{format}`](#get-debatesdebatedebatesectionextidformat)

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Search/Search_SearchCommitteeDebates)

---

### GET `/search/petitions.{format}`

**What data**: Parliamentary petitions debated in the House.

**Use cases**:
- Tracking petition debates
- Public engagement analysis
- Petition outcome research

**Request Parameters**: Standard search parameters.

**Response Structure**: Petition debates with petition IDs and signature counts.

**Related Endpoints**:
- Petitions API (external) - Get petition details

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Search/Search_SearchPetitions)

---

### GET `/search/debatebycolumn.{format}`

**What data**: Find debate by Hansard column reference.

**Use cases**:
- Looking up citations
- Academic research verification
- Legal reference lookup

**Request Parameters**:
- `queryParameters.seriesNumber` (query): Hansard series number
- `queryParameters.volumeNumber` (query): Volume number
- `queryParameters.columnNumber` (query): Column number
- `queryParameters.house` (query): `Commons` or `Lords`

**Response Structure**: Debate section containing the specified column.

**Related Endpoints**:
- [`/debates/debate/{debateSectionExtId}.{format}`](#get-debatesdebatedebatesectionextidformat)

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Search/Search_SearchDebateByColumn)

---

### GET `/search/debatebyexternalid.{format}`

**What data**: Direct debate lookup by external ID.

**Use cases**:
- Direct debate access with known ID
- Bookmark/link resolution

**Request Parameters**:
- `queryParameters.debateSectionId` (query): External ID of debate

**Response Structure**: Full debate object.

**Related Endpoints**:
- [`/debates/debate/{debateSectionExtId}.{format}`](#get-debatesdebatedebatesectionextidformat) - Equivalent functionality

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Search/Search_SearchDebateByExternalId)

---

### GET `/search.{format}`

**What data**: General search across all Hansard content (debates, contributions, divisions).

**Use cases**:
- Broad topic searches
- General research
- Content discovery

**Request Parameters**: Combines all available search parameters from specific search endpoints.

**Response Structure**: Mixed results with type indicators.

**Related Endpoints**: All specific search endpoints for refined queries.

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Search/Search_Search)

---

## Overview Endpoints

### GET `/overview/sectionsforday.{format}`

**What data**: Hansard section names for debates on a specific sitting date and house.

**Use cases**:
- Finding available debates for a date
- Daily debate navigation
- Calendar/schedule interfaces

**Request Parameters**:
- `date` (query, required): Sitting date `yyyy-mm-dd`
- `house` (query, required): `Commons` or `Lords`
- `format` (path, required): `json` or `xml`

**Response Structure**:
```json
[
  "Oral Answers to Questions",
  "Wales",
  "NHS Waiting Lists",
  "Topical Questions"
]
```

**Related Endpoints**:
- [`/debates/topleveldebatebytitle.{format}`](#get-debatestopleleveldebatebytitleformat) - Get debate by section title
- [`/overview/calendar.{format}`](#get-overviewcalendarformat) - Get sitting dates

**Example**:
```bash
curl "https://hansard-api.parliament.uk/overview/sectionsforday.json?date=2024-12-11&house=Commons"
```

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Overview/Overview_SectionsForDay)

---

### GET `/overview/calendar.{format}`

**What data**: Calendar of sitting dates showing when Parliament was in session.

**Use cases**:
- Building calendar interfaces
- Recess period identification
- Sitting day validation

**Request Parameters**:
- `queryParameters.startDate` (query): Start date
- `queryParameters.endDate` (query): End date
- `queryParameters.house` (query): `Commons` or `Lords`
- `format` (path, required): `json` or `xml`

**Response Structure**:
```json
{
  "SittingDates": [
    "2024-12-10",
    "2024-12-11",
    "2024-12-12"
  ]
}
```

**Related Endpoints**:
- [`/overview/sectionsforday.{format}`](#get-overviewsectionsfordayformat) - Get debates for specific dates

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Overview/Overview_Calendar)

---

### GET `/overview/linkedsittingdates.{format}`

**What data**: Sitting dates with content available in the system.

**Use cases**:
- Finding dates with data
- Data availability checking
- Progress tracking for content import

**Request Parameters**:
- `queryParameters.startDate`, `queryParameters.endDate`: Date range
- `format` (path, required): `json` or `xml`

**Response Structure**: Array of dates with content available.

**Related Endpoints**:
- [`/overview/calendar.{format}`](#get-overviewcalendarformat)

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Overview/Overview_LinkedSittingDates)

---

### GET `/overview/firstyear.{format}`

**What data**: The earliest year of Hansard data available in the system.

**Use cases**:
- Data coverage validation
- Historical research scoping
- UI date picker limits

**Request Parameters**:
- `format` (path, required): `json` or `xml`

**Response Structure**:
```json
{
  "FirstYear": 1803
}
```

**Related Endpoints**: None - standalone metadata endpoint

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Overview/Overview_FirstYear)

---

### GET `/overview/lastsittingdate.{format}`

**What data**: The most recent sitting date with data available.

**Use cases**:
- Finding latest debates
- Data freshness checking
- "Latest" content features

**Request Parameters**:
- `queryParameters.house` (query): `Commons` or `Lords`
- `format` (path, required): `json` or `xml`

**Response Structure**:
```json
{
  "LastSittingDate": "2024-12-17"
}
```

**Related Endpoints**:
- [`/overview/sectionsforday.{format}`](#get-overviewsectionsfordayformat) - Get latest debates

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Overview/Overview_LastSittingDate)

---

### GET `/overview/currentlyprocessing.{format}`

**What data**: Dates currently being processed/imported into the system.

**Use cases**:
- System status monitoring
- Understanding data availability delays
- Admin dashboards

**Request Parameters**:
- `format` (path, required): `json` or `xml`

**Response Structure**:
```json
{
  "ProcessingDates": [
    "2024-12-16",
    "2024-12-17"
  ]
}
```

**Related Endpoints**: None - system status endpoint

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Overview/Overview_CurrentlyProcessing)

---

### GET `/overview/sectiontrees.{format}`

**What data**: Hierarchical tree structure of debate sections for a sitting date.

**Use cases**:
- Building navigation interfaces
- Understanding debate structure
- Table of contents generation

**Request Parameters**:
- `queryParameters.date` (query, required): Sitting date
- `queryParameters.house` (query, required): `Commons` or `Lords`
- `format` (path, required): `json` or `xml`

**Response Structure**:
```json
{
  "Trees": [
    {
      "Id": 4798412,
      "Title": "Commons Chamber",
      "Children": [
        {
          "Id": 4798415,
          "Title": "Oral Answers to Questions",
          "Children": [...]
        }
      ]
    }
  ]
}
```

**Related Endpoints**:
- [`/debates/topleveldebateid/{debateSectionExtId}.{format}`](#get-debatestopleleveldebateiddebatesectionextidformat) - Navigate tree

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Overview/Overview_SectionTrees)

---

### GET `/overview/speakerslist/{date}/{house}.{format}`

**What data**: List of all speaker IDs who spoke on a given date in a specific house.

**Use cases**:
- Daily participation tracking
- Member activity summaries
- Attendance analysis (approximation)

**Request Parameters**:
- `date` (path, required): Sitting date `yyyy-mm-dd`
- `house` (path, required): `Commons` or `Lords`
- `hansardSection` (query): Filter by Hansard section
- `format` (path, required): `json` or `xml`

**Response Structure**:
```json
[4804, 5332, 4425, 1234, ...]
```

**Related Endpoints**:
- Members API `/Members/{id}` - Get member details from IDs

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Overview/Overview_GetSpeakersList)

---

### GET `/overview/pdfsforday.{format}`

**What data**: Available PDF documents for a specific sitting date.

**Use cases**:
- PDF download links
- Official document access
- Archive functionality

**Request Parameters**:
- `queryParameters.date` (query, required): Sitting date
- `queryParameters.house` (query): `Commons` or `Lords`
- `format` (path, required): `json` or `xml`

**Response Structure**:
```json
[
  {
    "Title": "Daily Hansard - Commons",
    "Date": "2024-12-11",
    "PdfUrl": "https://..."
  }
]
```

**Related Endpoints**:
- [`/pdfs/pdf.{format}`](#get-pdfspdfformat) - Direct PDF access

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Overview/Overview_PdfsForDay)

---

## Historic Sitting Days Endpoints

### GET `/historicsittingdays`

**What data**: Query historic sitting days with filters and pagination.

**Use cases**:
- Historic date range searches
- Recess period analysis
- Sitting pattern research

**Request Parameters**:
- `queryParams.house` (query): `Commons` or `Lords`
- `queryParams.startDate` (query): Start date `yyyy-mm-dd`
- `queryParams.endDate` (query): End date `yyyy-mm-dd`
- `queryParams.skip` (query): Pagination offset (0-2147483647)
- `queryParams.take` (query): Results per page (0-100)
- `queryParams.orderBy` (query): `SittingDateAsc` or `SittingDateDesc`
- `queryParams.hasSittingSections` (query): Only include dates with sections

**Response Structure**:
```json
{
  "Items": [
    {
      "House": "Commons",
      "SittingDate": "2024-12-11",
      "HasSittingSections": true
    }
  ],
  "TotalResults": 150,
  "Skip": 0,
  "Take": 25
}
```

**Related Endpoints**:
- [`/historicsittingdays/{house}/{sittingDate}`](#get-historicsittingdayshousesittingdate) - Get day details

**Example**:
```bash
curl "https://hansard-api.parliament.uk/historicsittingdays?queryParams.house=Commons&queryParams.startDate=2024-01-01&queryParams.endDate=2024-12-31&queryParams.take=50"
```

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Historic_Sitting_Days/HistoricSittingDays_Query)

---

### GET `/historicsittingdays/{house}/{sittingDate}`

**What data**: Detailed information about a specific historic sitting day including structure and sections.

**Use cases**:
- Historic day exploration
- Structural analysis
- Content verification

**Request Parameters**:
- `house` (path, required): `Commons` or `Lords`
- `sittingDate` (path, required): Date `yyyy-mm-dd`
- `flattenStructure` (query, required): Flatten the hierarchical structure (boolean)

**Response Structure**:
```json
{
  "House": "Commons",
  "SittingDate": "2024-12-11",
  "Sections": [
    {
      "Id": 123,
      "Title": "Oral Answers",
      "Type": "Questions"
    }
  ]
}
```

**Related Endpoints**:
- [`/historicsittingdays`](#get-historicsittingdays) - Query sitting days
- [`/debates/debate/{debateSectionExtId}.{format}`](#get-debatesdebatedebatesectionextidformat) - Get section content

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Historic_Sitting_Days/HistoricSittingDays_Details)

---

## PDF Endpoints

### GET `/pdfs/pdf.{format}`

**What data**: Direct access to Hansard PDF documents.

**Use cases**:
- PDF downloads
- Official record access
- Print-ready documents

**Request Parameters**:
- `queryParameters.pdfId` (query): PDF identifier
- `format` (path, required): `json` or `xml` (for metadata)

**Response Structure**: PDF metadata or direct file download.

**Related Endpoints**:
- [`/overview/pdfsforday.{format}`](#get-overviewpdfsfordayformat) - Find PDFs by date

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Pdfs/Pdfs_GetPdf)

---

## Timeline Stats Endpoint

### GET `/timeline-stats.{format}`

**What data**: Statistical aggregations of debate/contribution data over time.

**Use cases**:
- Trend analysis
- Volume metrics
- Activity visualization

**Request Parameters**:
- `queryParameters.timelineGroupingSize` (query): `Day`, `Month`, or `Year`
- Date range and search filters

**Response Structure**:
```json
[
  {
    "Date": "2024-12",
    "Count": 245,
    "Type": "Debates"
  }
]
```

**Related Endpoints**:
- All search endpoints - For drilling into specific periods

**Documentation**: [Swagger](https://hansard-api.parliament.uk/swagger/ui/index#!/Timeline_Stats/TimelineStats_Get)

---

# Members API

**Base URL**: `https://members-api.parliament.uk`
**Documentation**: [Swagger UI](https://members-api.parliament.uk/index.html)

The Members API provides comprehensive information about MPs and Lords.

## Key Endpoints

### GET `/api/Members/Search`

**What data**: Search for members by name, party, or constituency.

**Use cases**:
- Member lookup
- Building member directories
- Party lists

**Request Parameters**:
- `Name` (query): Member name
- `PartyId` (query): Party identifier
- `House` (query): `Commons` (1) or `Lords` (2)
- `CurrentMembersOnly` (query): Boolean filter

**Response Structure**: Array of member objects with IDs, names, parties, and constituencies.

**Related Endpoints**:
- `/api/Members/{id}` - Get full member details
- Hansard API `/search/members.{format}` - Alternative member search

**Documentation**: [Members API Docs](https://members-api.parliament.uk/index.html)

---

### GET `/api/Members/{id}`

**What data**: Complete member profile including biography, contact details, roles, and parliamentary history.

**Use cases**:
- Member profile pages
- Contact information
- Role and committee assignments

**Related Endpoints**:
- Hansard API `/debates/memberdebatecontributions/{memberId}.{format}` - Get member's speeches

**Documentation**: [Members API Docs](https://members-api.parliament.uk/index.html)

---

# Commons Votes API

**Base URL**: `https://commonsvotes-api.parliament.uk`
**Documentation**: [Swagger UI](https://commonsvotes-api.parliament.uk/swagger/ui/index)

Provides detailed Commons division (voting) records.

## Key Endpoints

### GET `/data/divisions.json`

**What data**: List of divisions with dates, titles, and vote counts.

**Use cases**:
- Division browsing
- Historical vote tracking
- Voting statistics

**Related Endpoints**:
- `/data/division/{divisionId}.json` - Get full division details

**Documentation**: [Commons Votes API](https://commonsvotes-api.parliament.uk/swagger/ui/index)

---

### GET `/data/division/{divisionId}.json`

**What data**: Complete division record with all member votes, tellers, and outcome.

**Use cases**:
- Detailed vote analysis
- Member voting patterns
- Party discipline tracking

**Response Structure**:
```json
{
  "DivisionId": 12345,
  "Date": "2024-12-11T00:00:00",
  "Title": "NHS Funding Bill",
  "AyeCount": 320,
  "NoCount": 285,
  "Ayes": [...],
  "Noes": [...]
}
```

**Related Endpoints**:
- Hansard API `/debates/division/{divisionExtId}.{format}` - Hansard version
- Members API `/api/Members/{id}` - Member details

**Documentation**: [Commons Votes API](https://commonsvotes-api.parliament.uk/swagger/ui/index)

---

# Committees API

**Base URL**: `https://committees-api.parliament.uk`
**Documentation**: [Swagger UI](https://committees-api.parliament.uk/index.html)

Provides committee information, inquiries, and publications.

## Key Endpoints

### GET `/api/Committees`

**What data**: List of all parliamentary committees.

**Use cases**:
- Committee directories
- Committee type filtering
- Current committee listings

**Related Endpoints**:
- `/api/Committees/{id}` - Get committee details
- `/api/Committees/{id}/Members` - Committee membership

**Documentation**: [Committees API](https://committees-api.parliament.uk/index.html)

---

### GET `/api/Committees/{id}`

**What data**: Committee details including name, type, house, and terms of reference.

**Related Endpoints**:
- `/api/Committees/{id}/Inquiries` - Committee inquiries
- `/api/Committees/{id}/Publications` - Committee publications

**Documentation**: [Committees API](https://committees-api.parliament.uk/index.html)

---

# Bills API

**Base URL**: `https://bills-api.parliament.uk`
**Documentation**: Contact Parliament for API access

Tracks legislative bills through Parliament.

## Key Endpoints

### GET `/api/v1/Bills`

**What data**: List of bills with current status and session information.

**Use cases**:
- Bill tracking dashboards
- Legislative monitoring
- Progress tracking

**Related Endpoints**:
- `/api/v1/Bills/{id}` - Bill details
- `/api/v1/Bills/{id}/Stages` - Bill stages

---

### GET `/api/v1/Bills/{id}`

**What data**: Complete bill information including title, sponsor, bill type, and current stage.

**Related Endpoints**:
- Hansard API - Search for bill debates
- Committees API - Find committee inquiries on bill

---

# Common Patterns & Best Practices

## Authentication

Most Parliament APIs are **public and require no authentication**. Rate limiting may apply.

## Format Selection

- Use `.json` for programmatic access (recommended)
- Use `.xml` for legacy systems or specific XML requirements
- Format is typically specified in the URL path: `endpoint.json` or `endpoint.xml`

## Pagination

Standard pagination pattern:
```bash
?queryParameters.skip=0&queryParameters.take=50
```
- Maximum `take` value: typically 100
- Use `TotalResultCount` to determine total pages

## Date Formats

- Dates: `yyyy-mm-dd` (ISO 8601)
- DateTimes: `yyyy-mm-ddTHH:mm:ss`

## Error Handling

Common HTTP status codes:
- `200 OK` - Success
- `404 Not Found` - Resource doesn't exist
- `403 Forbidden` - Access denied (rare)
- `400 Bad Request` - Invalid parameters

## Rate Limiting

- Be respectful with request frequency
- Implement exponential backoff for retries
- Cache responses when appropriate
- Contact Parliament for high-volume use cases

## Search Optimization

1. **Use specific endpoints** instead of general search when possible
2. **Filter early** - Use house, date range, and type filters to reduce results
3. **Paginate properly** - Don't request large result sets in one call
4. **Cache aggressively** - Historical data doesn't change

## External IDs

Key ID types:
- `ExtId` - External ID (GUID format) - Primary identifier in Hansard API
- `MemberId` / MNIS ID - Member identifier
- `DivisionId` - Division identifier

Always store External IDs for future lookups.

---

# Integration Examples

## Example 1: Find and Display Recent NHS Debates

```javascript
// 1. Search for NHS debates
const searchResponse = await fetch(
  'https://hansard-api.parliament.uk/search/debates.json?' +
  'queryParameters.searchTerm=NHS&' +
  'queryParameters.startDate=2024-01-01&' +
  'queryParameters.endDate=2024-12-31&' +
  'queryParameters.take=10'
);
const searchData = await searchResponse.json();

// 2. Get full debate details for first result
const extId = searchData.Results[0].DebateSectionExtId;
const debateResponse = await fetch(
  `https://hansard-api.parliament.uk/debates/debate/${extId}.json`
);
const debate = await debateResponse.json();

// 3. Display debate title, date, and contributions
console.log(debate.Overview.Title);
console.log(debate.Items.length + ' contributions');
```

## Example 2: Track MP's Voting Record

```javascript
// 1. Find member ID
const memberSearch = await fetch(
  'https://hansard-api.parliament.uk/search/members.json?' +
  'queryParameters.searchTerm=John+Smith'
);
const memberData = await memberSearch.json();
const memberId = memberData.Results[0].MemberId;

// 2. Get member's debate contributions
const contributionSummary = await fetch(
  `https://hansard-api.parliament.uk/search/membercontributionsummary/${memberId}.json?` +
  'queryParameters.startDate=2024-01-01&' +
  'queryParameters.endDate=2024-12-31'
);

// 3. Search for divisions they participated in
const divisions = await fetch(
  'https://commonsvotes-api.parliament.uk/data/divisions.json?' +
  `memberId=${memberId}`
);
```

## Example 3: Build Committee Activity Timeline

```javascript
// 1. Get all committees
const committees = await fetch(
  'https://committees-api.parliament.uk/api/Committees'
);

// 2. For specific committee, get inquiries
const committeeId = 123;
const inquiries = await fetch(
  `https://committees-api.parliament.uk/api/Committees/${committeeId}/Inquiries`
);

// 3. Search Hansard for committee debates
const committeeDebates = await fetch(
  'https://hansard-api.parliament.uk/search/committeedebates.json?' +
  `queryParameters.committeeType=${committeeId}&` +
  'queryParameters.startDate=2024-01-01'
);
```

---

# Additional Resources

## Official Documentation
- **Developer Hub**: [developer.parliament.uk](https://developer.parliament.uk/)
- **Hansard API Swagger**: [hansard-api.parliament.uk/swagger/ui/index](https://hansard-api.parliament.uk/swagger/ui/index)
- **Members API**: [members-api.parliament.uk/index.html](https://members-api.parliament.uk/index.html)
- **Commons Votes API**: [commonsvotes-api.parliament.uk/swagger/ui/index](https://commonsvotes-api.parliament.uk/swagger/ui/index)
- **Committees API**: [committees-api.parliament.uk/index.html](https://committees-api.parliament.uk/index.html)

## Support
- **Email**: softwareengineering@parliament.uk
- **Issues**: Report technical issues through official channels

## License
All data is made available under the [Open Parliament Licence](https://www.parliament.uk/site-information/copyright-parliament/open-parliament-licence/).

---

**Last Updated**: November 2025
**Guide Version**: 1.0
**Maintained By**: Parliament API Community

