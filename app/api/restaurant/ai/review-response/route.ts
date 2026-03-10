/**
 * POST /api/restaurant/ai/review-response
 * Body: { reviewText, rating } -> aiTags + aiDraftReply
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
  const { reviewText, rating } = (await req.json()) as { reviewText?: string; rating?: number };
  const text = String(reviewText ?? "").trim();
  const r = Number(rating) || 0;
  if (!text) {
    return NextResponse.json({ error: "reviewText обязателен" }, { status: 400 });
  }
  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Ты анализируешь отзывы гостей ресторана. Для каждого отзыва:
1) Укажи теги через запятую (позитив/негатив, еда/сервис/доставка и т.п.)
2) Сгенерируй черновик вежливого ответа менеджера (2-4 предложения)
Отвечай в формате JSON: { "tags": "строка тегов", "draftReply": "текст ответа" }`,
        },
        {
          role: "user",
          content: `Рейтинг: ${r}/5. Текст: ${text}`,
        },
      ],
      max_tokens: 400,
    });
    const content = completion.choices[0]?.message?.content ?? "{}";
    let parsed: { tags?: string; draftReply?: string };
    try {
      parsed = JSON.parse(content) as { tags?: string; draftReply?: string };
    } catch {
      parsed = { tags: "не определено", draftReply: content };
    }
    return NextResponse.json({
      aiTags: parsed.tags ?? "",
      aiDraftReply: parsed.draftReply ?? "",
    });
  } catch (e) {
    console.error("OpenAI error:", e);
    return NextResponse.json({ error: "Ошибка генерации" }, { status: 500 });
  }
}
