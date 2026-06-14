import type { ChatProvider, SendMessageParams } from "./types";
import type { AssistantReply } from "../types";

const MOCK_DELAY_MS = 1500;

const MOCK_RESPONSES: Record<string, string> = {
  homelessness:
    "For fiscal year 2026–27, the City of Los Angeles allocates approximately $1.3 billion across homelessness-related programs, spanning emergency shelters, permanent supportive housing, and outreach services. This figure spans multiple departments and funding sources, including the Los Angeles Homeless Services Authority (LAHSA) and the Housing Department.",
  lapd: "The LAPD budget for fiscal year 2024–25 totals approximately $1.99 billion, representing the largest single departmental allocation in the city budget. This covers personnel costs, operations, and specialized units across the department's geographic bureaus.",
  parks:
    "Parks and recreation funding has grown modestly over the past five years, from roughly $180 million in FY 2020–21 to approximately $210 million in FY 2024–25. Capital improvement projects and deferred maintenance backlogs remain a significant portion of planned expenditures.",
  "public works":
    "Public works infrastructure accounts for roughly 8–10% of the total city budget, covering street maintenance, sanitation, engineering, and capital projects. The Bureau of Street Services and Bureau of Sanitation represent the largest line items within this category.",
  housing:
    "Affordable housing programs receive approximately $450 million in combined funding across the Housing Department, HHH bond proceeds, and state and federal pass-through allocations. This supports new construction, preservation, and tenant assistance programs.",
};

function findMockResponse(message: string): string {
  const lower = message.toLowerCase();

  for (const [keyword, response] of Object.entries(MOCK_RESPONSES)) {
    if (lower.includes(keyword)) return response;
  }

  return "Based on the adopted budget documents for fiscal year 2026–27, I can help you explore departmental allocations, revenue sources, and spending trends. Could you be more specific about which department, program, or fiscal year you'd like to examine?";
}

export const mockChatProvider: ChatProvider = {
  async sendMessage(params: SendMessageParams): Promise<AssistantReply> {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

    return {
      content: findMockResponse(params.message),
    };
  },
};
