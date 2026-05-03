import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';

@Injectable({ providedIn: 'root' })
export class AiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }

  async processMemory(rawText: string, emotion: string) {
    const prompt = `
      You are an advanced psychological AI. Analyze the following memory. The user felt "${emotion}".
      
      1. RECONSTRUCTION: Separate objective facts from subjective interpretations. Write a coherent narrative and a timeline.
      2. BIASES & REFRAMING: Identify cognitive distortions. Provide severity (1-10) and confidence score (0-1). Link to exact quotes.
         CRITICAL: For each bias, provide a 'reframing' object with alternative interpretations, evidence for/against, and a balanced counter-statement.
      3. EMOTIONAL PROGRESSION: Analyze the emotional intensity over time. Provide an array of 5 intensity scores (1-10) representing the gradient from start to finish. Detect if there was escalation or a rumination loop. Estimate recovery speed ('fast', 'moderate', 'slow', 'stuck').
      4. DEEP INSIGHTS: Provide context-aware psychological summaries. Identify core insecurities, behavioral patterns, social triggers, and actionable advice.
      5. SIMULATION: Generate an interactive reality simulation based on this memory.
         - Provide 4 perspectives: 'self' (how user saw it), 'other' (simulating the other person's internal world, constraints, and hidden motives), 'neutral' (objective observer), and 'blended' (a synthesis of all perspectives).
         - Generate a branching story (nodes) with dynamic depth. Each node should have 3 choices: 'rational', 'emotional', 'passive'.
         - For each node, provide 'socialFeedback' indicating how the environment or other people react subtly to the current state.
         - For each choice, provide a 'predictedConsequence' (immediate impact) and a 'delayedConsequence' (long-term ripple effect), and link to a 'nextNodeId'.
         - Create a deep tree (e.g., 7-10 nodes) that explores complex outcomes and delayed consequences.
         - Provide a post-simulation analysis with an optimal path, takeaways, and skill development feedback.
      
      Memory: "${rawText}"
    `;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reconstruction: {
              type: Type.OBJECT,
              properties: {
                objectiveFacts: { type: Type.ARRAY, items: { type: Type.STRING } },
                subjectiveInterpretations: { type: Type.ARRAY, items: { type: Type.STRING } },
                narrative: { type: Type.STRING },
                timeline: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      time: { type: Type.STRING },
                      event: { type: Type.STRING }
                    }
                  }
                }
              }
            },
            biases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  description: { type: Type.STRING },
                  quote: { type: Type.STRING },
                  severity: { type: Type.NUMBER },
                  confidenceScore: { type: Type.NUMBER },
                  reframing: {
                    type: Type.OBJECT,
                    properties: {
                      alternativeInterpretations: { type: Type.ARRAY, items: { type: Type.STRING } },
                      evidenceFor: { type: Type.STRING },
                      evidenceAgainst: { type: Type.STRING },
                      counterStatement: { type: Type.STRING }
                    }
                  }
                }
              }
            },
            emotionalProgression: {
              type: Type.OBJECT,
              properties: {
                intensityGradient: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                escalationDetected: { type: Type.BOOLEAN },
                loopDetected: { type: Type.BOOLEAN },
                recoverySpeed: { type: Type.STRING }
              }
            },
            deepInsights: {
              type: Type.OBJECT,
              properties: {
                coreInsecurities: { type: Type.ARRAY, items: { type: Type.STRING } },
                behavioralPatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
                socialTriggers: { type: Type.ARRAY, items: { type: Type.STRING } },
                actionableAdvice: { type: Type.STRING }
              }
            },
            simulation: {
              type: Type.OBJECT,
              properties: {
                perspectives: {
                  type: Type.OBJECT,
                  properties: {
                    self: { type: Type.STRING },
                    other: { type: Type.STRING },
                    neutral: { type: Type.STRING },
                    blended: { type: Type.STRING }
                  }
                },
                nodes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING },
                      perspective: { type: Type.STRING },
                      socialFeedback: { type: Type.STRING },
                      choices: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            text: { type: Type.STRING },
                            type: { type: Type.STRING },
                            predictedConsequence: { type: Type.STRING },
                            delayedConsequence: { type: Type.STRING },
                            nextNodeId: { type: Type.STRING }
                          }
                        }
                      }
                    }
                  }
                },
                analysis: {
                  type: Type.OBJECT,
                  properties: {
                    optimalPath: { type: Type.ARRAY, items: { type: Type.STRING } },
                    takeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
                    skillDevelopment: { type: Type.STRING }
                  }
                }
              }
            }
          },
          required: ["reconstruction", "biases", "emotionalProgression", "deepInsights", "simulation"]
        }
      }
    });

    const jsonStr = response.text?.trim() || '{}';
    let cleanJson = jsonStr;
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    
    try {
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse AI response", e, cleanJson);
      throw new Error("AI response parsing failed");
    }
  }

  async generateQuiz(memoriesContext: string, learningProfile?: any) {
    const difficulty = learningProfile?.difficultyLevel || 1;
    const difficultyText = difficulty === 1 ? 'beginner (obvious biases)' : difficulty === 2 ? 'intermediate (subtle biases)' : 'advanced (highly complex, nuanced social dynamics)';

    const prompt = `
      You are an advanced psychological AI creating a cognitive training quiz.
      Based on the user's past memories (provided below) OR a completely new randomized situation if no memories are provided, generate a challenging scenario.
      
      The difficulty level is ${difficultyText}. Adjust the nuance and complexity of the scenario and options accordingly.
      
      The scenario should test the user's emotional intelligence, cognitive bias avoidance, and social effectiveness.
      
      Provide 3 choices for the user:
      1. A 'rational' response (balanced, objective, emotionally regulated).
      2. An 'emotional' response (reactive, biased, or overly defensive).
      3. A 'passive' response (avoidant, submissive, or lacking boundaries).
      
      Do not label the choices in the text output, just provide the options.

      User's Past Memories Context:
      """
      ${memoriesContext || 'No past memories available. Generate a random, realistic interpersonal conflict scenario.'}
      """
    `;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenario: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  type: { type: Type.STRING } // 'rational', 'emotional', 'passive'
                }
              }
            }
          },
          required: ["scenario", "options"]
        }
      }
    });

    const jsonStr = response.text?.trim() || '{}';
    let cleanJson = jsonStr;
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    
    try {
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse AI response for quiz", e, cleanJson);
      throw new Error("AI quiz parsing failed");
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async evaluateQuizChoice(scenario: string, options: any[], userChoice: string) {
    const prompt = `
      Evaluate the user's choice in the following cognitive training scenario.
      
      Scenario: "${scenario}"
      Options: ${JSON.stringify(options)}
      User Chose: "${userChoice}"
      
      Evaluate the choice and provide a score (0-100) for:
      - biasAvoidance: How well did they avoid cognitive distortions?
      - eq: Emotional intelligence and regulation.
      - socialEffectiveness: How well does this choice resolve the situation constructively?
      
      Also provide a 'total' score (average of the three) and constructive 'feedback' explaining why this was a good or bad choice and how to improve.
    `;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: {
              type: Type.OBJECT,
              properties: {
                biasAvoidance: { type: Type.NUMBER },
                eq: { type: Type.NUMBER },
                socialEffectiveness: { type: Type.NUMBER },
                total: { type: Type.NUMBER }
              }
            },
            feedback: { type: Type.STRING }
          },
          required: ["score", "feedback"]
        }
      }
    });

    const jsonStr = response.text?.trim() || '{}';
    let cleanJson = jsonStr;
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    
    try {
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse AI response for quiz evaluation", e, cleanJson);
      throw new Error("AI quiz evaluation parsing failed");
    }
  }
}
