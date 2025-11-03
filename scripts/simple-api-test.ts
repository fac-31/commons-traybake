#!/usr/bin/env tsx
// ============================================================================
// SIMPLE PARLIAMENT API TEST (Treaty + Members + Historic Hansard)
// ============================================================================

import axios from "axios";

// Helper to safely extract error messages
function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.message;
  } else if (error instanceof Error) {
    return error.message;
  } else {
    return String(error);
  }
}

async function simpleTest() {
  console.groupCollapsed("====== Parliament API Tests ======");
  console.log("Testing Parliament API endpoints...\n");

  // |---|--------------------------------|
  // | 1 | Treaty API (Search: Singapore) |
  // |---|--------------------------------|
  console.groupCollapsed("=== Test 1 ===");
  console.log("Checking Treaty API...");
  try {
    const response = await axios.get(
      "https://treaties-api.parliament.uk/api/Treaty?SearchText=singapore",
      { timeout: 10000 }
    );

    const data = response.data;

    console.log(`✓ Treaty API working - found ${data.totalResults} results`);

    if (data.items?.length) {
      data.items.forEach((item: any, index: number) => {
        const t = item.value;
        console.log(`\n[${index + 1}] ${t.name}`);
        console.log(`  ID: ${t.id}`);
        console.log(`  URI: ${t.uri}`);
        console.log(`  Lead department: ${t.leadDepartment?.name}`);
        console.log(`  Parliamentary conclusion: ${t.parliamentaryConclusion}`);
        console.log(`  Debate scheduled: ${t.debateScheduled}`);
        console.log(`  Pertinent date: ${t.pertinentDate}`);
        if (t.webLink) console.log(`  Web link: ${t.webLink}`);
      });
    }
  } catch (error: unknown) {
    console.error("✗ Treaty API failed:", getErrorMessage(error));
  }
  console.groupEnd();

  // |---|--------------------------------|
  // | 2 | Who Knows...                   |
  // |---|--------------------------------|
  console.groupCollapsed("=== Test 2 ===");
  console.log("This doesn't exist lol");
  console.groupEnd();

  // |---|--------------------------------|
  // | 3 | Historic Hansard API           |
  // |---|--------------------------------|
  console.groupCollapsed("=== Test 3 ===");
  console.log("[Test 3] Fetching historic debate content (2002-03-15)...");
  try {
    const historicDate = "2002/mar/15";
    const url = `https://api.parliament.uk/historic-hansard/sittings/${historicDate}.js`;

    const response = await axios.get(url, { timeout: 10000 });
    const data = response.data;

    // House of Commons sitting
    if (data[0]?.house_of_commons_sitting?.top_level_sections?.length) {
      const commonsSitting = data[0].house_of_commons_sitting;
      console.log(`✓ Commons sitting found with ${commonsSitting.top_level_sections.length} sections`);
      const firstSection = commonsSitting.top_level_sections[0].section;
      console.log(`  First section: ${firstSection.title}`);
    }

    // Commons Written Answers
    if (data[1]?.commons_written_answers_sitting?.top_level_sections?.length) {
      const commonsAnswers = data[1].commons_written_answers_sitting;
      console.log(`✓ Commons written answers found with ${commonsAnswers.top_level_sections.length} groups`);
      const firstGroup = commonsAnswers.top_level_sections[0].written_answers_group;
      console.log(`  First group: ${firstGroup.title || "Untitled"}`);
    }

    // House of Lords sitting
    if (data[2]?.house_of_lords_sitting?.top_level_sections?.length) {
      const lordsSitting = data[2].house_of_lords_sitting;
      console.log(`✓ Lords sitting found with ${lordsSitting.top_level_sections.length} sections`);
      const firstSection = lordsSitting.top_level_sections[0].section;
      console.log(`  First section: ${firstSection.title}`);
    }

    // Lords Written Answers
    if (data[3]?.lords_written_answers_sitting?.top_level_sections?.length) {
      const lordsAnswers = data[3].lords_written_answers_sitting;
      console.log(`✓ Lords written answers found with ${lordsAnswers.top_level_sections.length} groups`);
      const firstGroup = lordsAnswers.top_level_sections[0].written_answers_group;
      console.log(`  First group: ${firstGroup.title || "Untitled"}`);
    }
  } catch (error: unknown) {
    console.error("✗ Could not fetch historic debate:", getErrorMessage(error));
  }
  console.groupEnd();

  // |---|--------------------------------|
  // |   | Cleanup                        |
  // |---|--------------------------------|
  console.log("\n" + "=".repeat(60));
  console.log("Simple API tests complete!");
  console.log("=".repeat(60));
  console.groupEnd();

  console.groupCollapsed("=== Next Steps ===");
  console.log("If all tests passed, you can now:");
  console.log("1. Save the ParliamentAPI client to: src/ingestion/parliament-api-client.ts");
  console.log("2. Run the full test: npm run test:api");
  console.log("3. Start fetching data for your project!");
  console.groupEnd();
}

simpleTest().catch((error: unknown) => console.error(getErrorMessage(error)));
