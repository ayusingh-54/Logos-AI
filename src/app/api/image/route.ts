import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { IMAGE_SAFETY_PROMPT } from "@/lib/prompts";
import OpenAI from "openai";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Image prompt is required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const safetyResponse = await model.invoke([
      new SystemMessage(IMAGE_SAFETY_PROMPT),
      new HumanMessage(`User wants to generate this image: "${prompt}"`),
    ]);

    const content = safetyResponse.content as string;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to process safety check" },
        { status: 500 }
      );
    }

    const safetyResult = JSON.parse(jsonMatch[0]);

    if (!safetyResult.safe) {
      return NextResponse.json(
        {
          error: "Image request declined",
          reason: safetyResult.reason,
          safe: false,
        },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const refinedPrompt = safetyResult.refined_prompt || prompt;

    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Christian art style, reverent and beautiful: ${refinedPrompt}. The image should be respectful, uplifting, and suitable for a church setting. High quality, warm lighting, sacred atmosphere.`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const imageUrl = imageResponse.data?.[0]?.url ?? "";

    return NextResponse.json({
      imageUrl,
      refinedPrompt,
      safe: true,
    });
  } catch (error: any) {
    console.error("Image API error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate image",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
