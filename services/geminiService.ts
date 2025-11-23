import { GoogleGenAI, Type } from "@google/genai";
import { LevelData } from "../types";

// Fallback levels in case API key is missing or fails
const FALLBACK_LEVEL: LevelData = {
  id: 'fallback-1',
  name: 'ด่านสำรอง (Manual)',
  gridSize: 5,
  start: { x: 0, y: 0 },
  goal: { x: 4, y: 4 },
  obstacles: [{ x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 1, y: 3 }],
  par: 8
};

export const generateLevelWithGemini = async (difficulty: 'easy' | 'medium' | 'hard'): Promise<LevelData> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.warn("API Key not found, using fallback level.");
    return FALLBACK_LEVEL;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Schema definition for the level
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        gridSize: { type: Type.INTEGER, description: "Size of the grid (e.g., 5 for 5x5)" },
        start: {
          type: Type.OBJECT,
          properties: {
            x: { type: Type.INTEGER },
            y: { type: Type.INTEGER }
          },
          required: ["x", "y"]
        },
        goal: {
          type: Type.OBJECT,
          properties: {
            x: { type: Type.INTEGER },
            y: { type: Type.INTEGER }
          },
          required: ["x", "y"]
        },
        obstacles: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              x: { type: Type.INTEGER },
              y: { type: Type.INTEGER }
            },
            required: ["x", "y"]
          }
        },
        name: { type: Type.STRING, description: "A creative name for this robot mission in Thai language" }
      },
      required: ["gridSize", "start", "goal", "obstacles", "name"]
    };

    const prompt = `Create a solvable puzzle level for a grid-based robot game for kids. 
    Difficulty: ${difficulty}.
    Grid Size should be 5 or 6.
    Ensure there is a valid path from start to goal.
    Don't block the start or goal with obstacles.
    IMPORTANT: The "name" field must be in Thai language (ภาษาไทย) suitable for a 7-year-old child.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 1, 
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text);

    return {
      id: `gemini-${Date.now()}`,
      name: data.name,
      gridSize: data.gridSize,
      start: data.start,
      goal: data.goal,
      obstacles: data.obstacles,
    };

  } catch (error) {
    console.error("Gemini Level Generation failed:", error);
    return FALLBACK_LEVEL;
  }
};