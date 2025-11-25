"use server";

import { getModel } from "@/lib/vertex";
import { supabase } from "@/lib/supabase";
import { Step } from "@/lib/types";
import fs from "fs/promises";
import path from "path";

export async function generateTutorial(topic: string) {
  try {
    const promptPath = path.join(
      process.cwd(),
      "prompts",
      "system-tutorial.md"
    );
    const systemPrompt = await fs.readFile(promptPath, "utf-8");

    // 1. Generate content with Vertex AI
    const model = getModel(undefined, systemPrompt);

    const result = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: `Voglio imparare a: ${topic}` }] },
      ],
      generationConfig: { responseMimeType: "application/json" },
    });

    const response = await result.response;
    const content = response.text();

    if (!content) throw new Error("No content generated");

    // Vertex AI returns the JSON string directly
    const parsed = JSON.parse(content);
    const stepsData = Array.isArray(parsed)
      ? parsed
      : parsed.steps || parsed.data;

    if (!stepsData || !Array.isArray(stepsData)) {
      throw new Error("Invalid JSON format from Vertex AI");
    }

    // 2. Save to Supabase
    // Create Tutorial
    const { data: tutorial, error: tutorialError } = await supabase
      .from("tutorials")
      .insert({ topic })
      .select()
      .single();

    if (tutorialError) throw new Error(tutorialError.message);

    // Create Steps
    const stepsToInsert = stepsData.map((s: any, index: number) => ({
      tutorial_id: tutorial.id,
      title: s.title,
      content: s.content,
      command: s.command,
      step_order: index,
    }));

    const { data: steps, error: stepsError } = await supabase
      .from("steps")
      .insert(stepsToInsert)
      .select()
      .order("step_order");

    if (stepsError) throw new Error(stepsError.message);

    return { tutorial, steps };
  } catch (error: any) {
    console.error("Error generating tutorial:", error);
    return { error: error.message || "Failed to generate tutorial" };
  }
}

export async function askFollowUp(
  stepId: string,
  stepContext: string,
  question: string
) {
  try {
    // 1. Save user message
    await supabase.from("messages").insert({
      step_id: stepId,
      role: "user",
      content: question,
    });

    // 2. Get answer from Vertex AI
    const systemPrompt = `Sei un assistente tecnico. L'utente ha una domanda su uno specifico passaggio di un tutorial.
          
          Contesto del passaggio:
          ${stepContext}
          
          Rispondi in modo conciso e utile.`;

    const model = getModel(undefined, systemPrompt);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: question }] }],
    });

    const response = await result.response;
    const answer = response.text() || "Non ho potuto generare una risposta.";

    // 3. Save assistant message
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        step_id: stepId,
        role: "assistant",
        content: answer,
      })
      .select()
      .single();

    if (error) throw error;

    return { message };
  } catch (error) {
    console.error("Error asking follow-up:", error);
    return { error: "Failed to get answer" };
  }
}

export async function getTutorial(id: string) {
  const { data: tutorial } = await supabase
    .from("tutorials")
    .select("*")
    .eq("id", id)
    .single();

  if (!tutorial) return null;

  const { data: steps } = await supabase
    .from("steps")
    .select("*, messages(*)")
    .eq("tutorial_id", id)
    .order("step_order")
    .order("created_at", { foreignTable: "messages", ascending: true });

  return { ...tutorial, steps };
}

export async function getTutorials() {
  const { data: tutorials, error } = await supabase
    .from("tutorials")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching tutorials:", error);
    return [];
  }

  return tutorials;
}
