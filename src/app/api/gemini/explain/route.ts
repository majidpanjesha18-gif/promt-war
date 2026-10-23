import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  GeminiExplainRequestSchema,
  GeminiExplainResponseSchema,
} from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    // 1. Zod runtime validation of incoming data
    const parseResult = GeminiExplainRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { listing, matchedRecipient, matchScore, factors, fallbacks } = parseResult.data;

    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";

    // Fallback if no API key is set
    if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
      const deterministicResponse = buildDeterministicExplanation(
        listing,
        matchedRecipient,
        matchScore,
        factors,
        fallbacks
      );
      return NextResponse.json({
        ...deterministicResponse,
        source: "deterministic",
      });
    }

    // Call Google Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2, // Low temperature for deterministic analysis
      },
    });

    const prompt = `
You are an expert food rescue logistics coordinator assistant.
Explain the following already-computed rescue match and analyze trade-offs against fallback recipients.
The deterministic engine has ALREADY verified food safety, storage compatibility, operating hours, and capacity.
Do not invent facts. Return strictly a JSON object with this schema:
{
  "summary": string, // 1-2 sentences summarizing why this recipient is optimal
  "primaryRecommendationReason": string, // core justification (e.g. proximity, ideal capacity fit)
  "tradeOffAnalysis": string, // comparison with alternative fallback options
  "riskMitigation": string // practical collection precaution (e.g. thermal cambros, deadline buffer)
}

MATCH DATA:
- Food Listing: "${listing.title}" (${listing.quantity} meals, category: ${listing.category}, storage: ${listing.storageRequirement}, deadline: ${listing.safeCollectionDeadline})
- Recommended Recipient: ${matchedRecipient.name} (type: ${matchedRecipient.type}, distance: ${matchedRecipient.distanceKm} km, capacity: ${matchedRecipient.capacityMeals} meals, window: ${matchedRecipient.collectionWindow.start}-${matchedRecipient.collectionWindow.end})
- Computed Match Score: ${matchScore}/100
- Match Factors:
  - Collection Feasibility: ${factors.collectionFeasibility}
  - Capacity Fit: ${factors.capacityFit}
  - Route Suitability: ${factors.routeSuitability}
  - Time Urgency: ${factors.timeUrgency}
  - Food Compatibility: ${factors.foodCompatibility}
  - Recipient Reliability: ${factors.recipientReliability}
- Fallback Options Evaluated:
  ${fallbacks.map((f) => `- ${f.recipientName} (Score: ${f.score}): ${f.reason}`).join("\n  ")}
`;

    // 10 second timeout for AI safety
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API request timed out")), 10000)
    );

    const generatePromise = model.generateContent(prompt);
    const result = (await Promise.race([generatePromise, timeoutPromise])) as any;

    const responseText = result.response.text();
    const parsedAiJson = JSON.parse(responseText);

    // Validate structured AI response
    const validatedAiResponse = GeminiExplainResponseSchema.safeParse(parsedAiJson);
    if (!validatedAiResponse.success) {
      console.warn("AI response schema mismatch, falling back to deterministic:", validatedAiResponse.error);
      const fallback = buildDeterministicExplanation(
        listing,
        matchedRecipient,
        matchScore,
        factors,
        fallbacks
      );
      return NextResponse.json({ ...fallback, source: "deterministic" });
    }

    return NextResponse.json({
      ...validatedAiResponse.data,
      source: "gemini",
      model: modelName,
    });
  } catch (err: any) {
    console.error("Gemini API call failed, using safe fallback:", err?.message || err);
    // Graceful fallback: Never expose internal errors or credentials to user
    const deterministic = buildDeterministicExplanation(
      { title: "Surplus Food", quantity: 30 },
      { name: "Top Matched Recipient", distanceKm: 3.5 },
      85,
      { capacityFit: 0.85, routeSuitability: 0.8 },
      []
    );
    return NextResponse.json({
      ...deterministic,
      source: "deterministic",
      fallbackReason: "Service unavailable or unconfigured, deterministic rationale used.",
    });
  }
}

function buildDeterministicExplanation(
  listing: any,
  matchedRecipient: any,
  score: number,
  factors: any,
  fallbacks: any[]
) {
  const distance = matchedRecipient.distanceKm || 3.0;
  const topReason =
    factors.capacityFit >= 0.8
      ? `High capacity absorption efficiency with minimal distribution delay`
      : `Short transit distance (${distance} km) minimizing transit time`;

  const tradeOff =
    fallbacks && fallbacks.length > 0
      ? `Selected over ${fallbacks[0].recipientName} due to higher total score (${score} vs ${fallbacks[0].score}) and superior route alignment.`
      : `Single highest eligible candidate meeting immediate temperature and capacity criteria.`;

  return {
    summary: `${matchedRecipient.name} was selected as the optimal recipient with an algorithmic score of ${score}/100.`,
    primaryRecommendationReason: topReason,
    tradeOffAnalysis: tradeOff,
    riskMitigation: `Coordinate prompt handoff before safe collection deadline. Verify storage temperatures upon transfer.`,
  };
}
