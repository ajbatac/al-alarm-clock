import { GoogleGenAI, FunctionDeclaration, Type, Schema } from "@google/genai";
import { UserStats, Challenge } from '../types';

// --- Function Declarations for Tools ---

const calculateRewardsTool: FunctionDeclaration = {
  name: 'calculateRewards',
  description: 'Calculates points and badges based on user streak and wake-up performance.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      pointsToAdd: {
        type: Type.NUMBER,
        description: 'The number of points to award the user.',
      },
      newBadge: {
        type: Type.STRING,
        description: 'A new badge name to award, if applicable (e.g., "Early Bird", "7-Day Streak"). Returns null/empty if no badge.',
      },
      reason: {
        type: Type.STRING,
        description: 'A short encouraging message explaining the reward.',
      }
    },
    required: ['pointsToAdd', 'reason'],
  },
};

const adjustDifficultyTool: FunctionDeclaration = {
  name: 'adjustDifficulty',
  description: 'Adjusts the alarm difficulty based on user reaction time history.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      suggestedDifficulty: {
        type: Type.STRING,
        description: 'The suggested difficulty level: EASY, MEDIUM, or HARD.',
        enum: ['EASY', 'MEDIUM', 'HARD']
      },
      reason: {
        type: Type.STRING,
        description: 'Reason for the adjustment.',
      }
    },
    required: ['suggestedDifficulty', 'reason'],
  },
};

// --- Service Class ---

class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY is missing from environment variables");
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
  }

  // 1. Chatbot
  async chat(message: string, history: {role: 'user'|'model', parts: {text: string}[]}[]): Promise<string> {
    try {
      // Convert history format if needed, but standard format is compatible
      // Simple stateless call for this demo, or use chat session if persistence is needed
      const chat = this.ai.chats.create({
        model: 'gemini-3-pro-preview',
        history: history as any,
        config: {
          systemInstruction: "You are WakeWise, a helpful AI assistant focused on sleep health, productivity, and morning routines."
        }
      });

      const result = await chat.sendMessage({ message });
      return result.text || "I'm having trouble thinking right now.";
    } catch (error) {
      console.error("Chat error:", error);
      return "Sorry, I couldn't connect to the AI service.";
    }
  }

  // 2. Image Analysis
  async analyzeImage(base64Image: string, prompt: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg', // Assuming jpeg for simplicity, or detect from base64 header
                data: base64Image.split(',')[1], // Remove data:image/xyz;base64, prefix
              },
            },
            { text: prompt || "Analyze this image." },
          ],
        },
      });
      return response.text || "No analysis generated.";
    } catch (error) {
      console.error("Image analysis error:", error);
      return "Failed to analyze image.";
    }
  }

  // 3. Generate Alarm Challenge (Math/Trivia)
  async generateChallenge(difficulty: string): Promise<Challenge> {
    try {
      const prompt = `Generate a single ${difficulty} level multiple-choice question to wake someone up. 
      It should be either MATH or TRIVIA. 
      Return JSON with keys: question, options (array of 4 strings), answer (the correct string), type.`;
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    answer: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['MATH', 'TRIVIA'] }
                },
                required: ['question', 'options', 'answer', 'type']
            }
        }
      });
      
      const text = response.text;
      if (!text) throw new Error("Empty response");
      return JSON.parse(text) as Challenge;
    } catch (error) {
      console.error("Challenge generation error", error);
      // Fallback
      return {
        question: "What is 12 + 15?",
        options: ["25", "27", "30", "22"],
        answer: "27",
        type: "MATH"
      };
    }
  }

  // 4. Process Rewards (Tool Use)
  async processRewards(stats: UserStats, timeTaken: number): Promise<{ points: number, badge?: string, reason: string }> {
    try {
      const prompt = `
        User just woke up!
        Current Streak: ${stats.streak} days.
        Time taken to dismiss alarm: ${timeTaken} seconds.
        Current Badges: ${stats.badges.join(', ')}.
        
        Decide on rewards using the calculateRewards tool. 
        Be generous with points for fast times (<15s) and streaks.
        Award badges for milestones (e.g. 3 day streak, 7 day streak, under 5s reaction).
      `;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          tools: [{ functionDeclarations: [calculateRewardsTool] }],
        },
      });

      // Parse tool calls
      const toolCalls = response.functionCalls;
      if (toolCalls && toolCalls.length > 0) {
        const args = toolCalls[0].args as any;
        return {
            points: args.pointsToAdd || 10,
            badge: args.newBadge,
            reason: args.reason
        };
      }

      return { points: 10, reason: "Good morning! (AI Fallback)" };

    } catch (error) {
      console.error("Reward processing error", error);
      return { points: 10, reason: "Good morning!" };
    }
  }

  // 5. Adjust Difficulty (Tool Use)
  async getDifficultyAdjustment(history: any[]): Promise<{ difficulty: string, reason: string }> {
    try {
      // Summarize last 5 wake ups
      const recent = history.slice(-5);
      const prompt = `
        Analyze recent wake up history to adjust alarm difficulty.
        History (seconds to dismiss): ${recent.map(h => h.timeTakenSeconds).join(', ')}.
        
        If they are too slow (>30s), increase difficulty.
        If they are very fast (<10s) consistently, maybe keep it or increase for challenge.
        If they struggle significantly, maybe ease up slightly to prevent frustration, or go hard to force wake up. Use your judgement.
        Use adjustDifficulty tool.
      `;

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          tools: [{ functionDeclarations: [adjustDifficultyTool] }],
        },
      });

      const toolCalls = response.functionCalls;
      if (toolCalls && toolCalls.length > 0) {
        const args = toolCalls[0].args as any;
        return {
            difficulty: args.suggestedDifficulty || 'MEDIUM',
            reason: args.reason
        };
      }
      return { difficulty: 'MEDIUM', reason: 'Standard setting' };
    } catch (error) {
      return { difficulty: 'MEDIUM', reason: 'Default' };
    }
  }
}

export const geminiService = new GeminiService();