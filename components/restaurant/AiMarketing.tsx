"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AiMarketing() {
  const [prompt, setPrompt] = useState("");
  const [variants, setVariants] = useState<string[]>([]);
  const [genLoading, setGenLoading] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [aiResult, setAiResult] = useState<{ aiTags?: string; aiDraftReply?: string } | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  async function generateText() {
    if (!prompt.trim()) return;
    setGenLoading(true);
    setVariants([]);
    try {
      const res = await fetch("/api/restaurant/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = (await res.json()) as { variants?: string[]; error?: string };
      if (data.variants) setVariants(data.variants);
    } finally {
      setGenLoading(false);
    }
  }

  async function analyzeReview() {
    if (!reviewText.trim()) return;
    setReviewLoading(true);
    setAiResult(null);
    try {
      const res = await fetch("/api/restaurant/ai/review-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewText: reviewText.trim(), rating: reviewRating }),
      });
      const data = (await res.json()) as { aiTags?: string; aiDraftReply?: string };
      setAiResult(data);
    } finally {
      setReviewLoading(false);
    }
  }

  return (
    <Tabs defaultValue="text">
      <TabsList>
        <TabsTrigger value="text">Генерация текстов</TabsTrigger>
        <TabsTrigger value="review">Анализ отзыва</TabsTrigger>
      </TabsList>
      <TabsContent value="text" className="space-y-4 pt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Текст для Push/SMS</CardTitle>
            <p className="text-sm text-muted-foreground">
              Опишите промо — получите 3 варианта текста
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Например: акция на кофе каждый вторник с 10 до 12"
              rows={3}
            />
            <Button onClick={generateText} disabled={genLoading}>
              {genLoading ? "Генерация..." : "Сгенерировать"}
            </Button>
            {variants.length > 0 && (
              <div className="space-y-2">
                <Label>Варианты:</Label>
                {variants.map((v, i) => (
                  <div key={i} className="rounded border p-3 text-sm">
                    {v}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="review" className="space-y-4 pt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Черновик ответа на отзыв</CardTitle>
            <p className="text-sm text-muted-foreground">
              Вставьте текст отзыва — получите теги и черновик ответа
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Рейтинг (1–5)</Label>
              <Input
                type="number"
                min={1}
                max={5}
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value) || 5)}
              />
            </div>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Текст отзыва гостя..."
              rows={4}
            />
            <Button onClick={analyzeReview} disabled={reviewLoading}>
              {reviewLoading ? "Анализ..." : "Анализировать"}
            </Button>
            {aiResult && (
              <div className="space-y-2">
                {aiResult.aiTags && (
                  <div>
                    <Label>Теги</Label>
                    <p className="text-sm">{aiResult.aiTags}</p>
                  </div>
                )}
                {aiResult.aiDraftReply && (
                  <div>
                    <Label>Черновик ответа</Label>
                    <div className="rounded border p-3 text-sm">{aiResult.aiDraftReply}</div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
