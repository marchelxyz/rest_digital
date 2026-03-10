/**
 * POST /api/restaurant/ai/generate
 * Body: { prompt } -> 3 варианта текста для Push/SMS
 */
import { NextRequest, NextResponse } from "next/server";
import { getEmployee } from "@/lib/auth";
import OpenAI from "openai";

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY не настроен");
  return new OpenAI({ apiKey: key });
}

export async function POST(req: NextRequest) {
  const emp = await getEmployee();
  if (!emp || emp.type !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY не настроен" }, { status: 500 });
  }
  const { prompt } = (await req.json()) as { prompt?: string };
  if (!prompt?.trim()) {
    return NextResponse.json({ error: "prompt обязателен" }, { status: 400 });
  }
  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Ты — копирайтер для ресторана. Генерируй короткие рекламные тексты для Push/SMS/Telegram. Отвечай СТРОГО тремя вариантами, по одному на строку, без нумерации и лишнего текста.",
        },
        {
          role: "user",
          content: prompt.trim(),
        },
      ],
      max_tokens: 300,
    });
    const text = completion.choices[0]?.message?.content ?? "";
    const variants = text
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 3);
    return NextResponse.json({ variants });
  } catch (e) {
    console.error("OpenAI error:", e);
    return NextResponse.json({ error: "Ошибка генерации" }, { status: 500 });
  }
}
