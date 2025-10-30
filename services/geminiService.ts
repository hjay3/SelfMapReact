
import { GoogleGenAI, Type } from "@google/genai";
import { SelfMapData } from "../types/selfmap";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a fallback for development environments where the key might not be set.
  // In a real production environment, this should be handled more gracefully.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const selfMapSchema = {
  type: Type.OBJECT,
  properties: {
    entries: {
      type: Type.ARRAY,
      description: "A list of personal identity concepts, events, or relationships.",
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING, description: "A concise name for the entry." },
          category: {
            type: Type.STRING,
            description: "The category of the entry.",
            enum: ['People', 'Accomplishments', 'Life Story', 'Ideas/Likes', 'Other'],
          },
          power: {
            type: Type.NUMBER,
            description: "A value from 0.0 to 1.0 indicating how central this concept is to one's identity. 1.0 is most central.",
          },
          valence: {
            type: Type.NUMBER,
            description: "A value from -1.0 to 1.0 indicating the emotional tone. -1.0 is very negative, 1.0 is very positive, 0 is neutral.",
          },
        },
        required: ["label", "category", "power", "valence"],
      },
    },
    associations: {
      type: Type.ARRAY,
      description: "A list of connections between the entries.",
      items: {
        type: Type.OBJECT,
        properties: {
          src: { type: Type.STRING, description: "The 'label' of the source entry for the connection." },
          dst: { type: Type.STRING, description: "The 'label' of the destination entry for the connection." },
          relation: {
            type: Type.STRING,
            description: "The nature of the relationship.",
            enum: ['affirms', 'threatens', 'associates_with'],
          },
          weight: {
            type: Type.NUMBER,
            description: "A value from 0.0 to 1.0 indicating the strength of the association. 1.0 is strongest.",
          },
        },
        required: ["src", "dst", "relation", "weight"],
      },
    },
  },
  required: ["entries", "associations"],
};

export const generateSelfMapData = async (prompt: string): Promise<SelfMapData> => {
  const fullPrompt = `
    Based on the following user-provided text, generate a "Self Map" dataset in JSON format.
    The Self Map represents key components of a person's identity.

    It has two main parts:
    1.  **entries**: These are the core concepts.
        -   'label': A short, descriptive name.
        -   'category': Classify it as 'People', 'Accomplishments', 'Life Story', 'Ideas/Likes', or 'Other'.
        -   'power': How central is it to their identity? (0.0 to 1.0). High power means very important.
        -   'valence': What's the emotional charge? (-1.0 for negative, 1.0 for positive, 0 for neutral).
    2.  **associations**: These are the connections between entries.
        -   'src' and 'dst': The 'labels' of the two entries being connected.
        -   'relation': How do they relate?
            - 'affirms': one supports or strengthens the other.
            - 'threatens': one undermines or conflicts with the other.
            - 'associates_with': a neutral connection.
        -   'weight': How strong is this connection? (0.0 to 1.0).

    Generate at least 10 entries and 5 associations. Ensure that all 'src' and 'dst' labels in associations exactly match labels in the entries list.

    USER TEXT:
    ---
    ${prompt}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: selfMapSchema,
      },
    });

    const jsonText = response.text.trim();
    const data = JSON.parse(jsonText);

    // Basic validation
    if (!data.entries || !data.associations) {
      throw new Error("Invalid data structure received from API.");
    }

    return data as SelfMapData;
  } catch (error) {
    console.error("Error generating self map data:", error);
    throw new Error("Failed to generate data from the AI. Please check the console for details.");
  }
};
