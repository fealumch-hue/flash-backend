import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { PulseMode, Assignment } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SHARED_RULES = `
Rules:
- DO NOT use markdown formatting. No bold (**), no headings (#), no bullet points (- or *), no markdown symbols.
- Write in clean, plain text only.
- Use LaTeX exclusively for all mathematical expressions and formulas. 
- ALWAYS wrap LaTeX math in dollar signs, e.g., $E=mc^2$ or $\sqrt{x+1}$. Use double dollar signs for centered block math, e.g., $$\frac{a}{b}$$.
- No emojis, no moralizing, no chatter. 
- Be direct and professional, but conversational and approachable. 
- Use normal sentence case - avoid excessive uppercase text as it feels intimidating.
- Avoid polite fillers like "Please", "I'm happy to help", or "Sure".
- Sound knowledgeable and helpful.
- If context is missing, state it directly: "Material required. Paste it or attach an assignment."`;

const INTELLIGENCE_SYSTEMS = `
[PERFORMANCE MEMORY]
- Review user's historical grades and common mistake patterns provided in context.
- Adapt answers to address specific weaknesses (e.g., if user makes 'careless' errors, add verification steps).
- Track improvement trends and offer tactical praise only when significant metrics are hit.

[GRADE-AWARE OPTIMIZATION]
- For any assignment, prioritize questions based on weight and impact on subject grade.
- Calculate and output: "Required Score for [Grade]: X%" based on current status.
- Highlight "High Yield" areas where maximum marks can be secured with minimum effort.

[SUBMISSION CONFIDENCE ENGINE]
- Before closing an analysis, provide a "Submission Confidence: X%" rating.
- List "High Risk Sections" that might trigger teacher flags or lack method clarity.
- Verify formatting against typical academic standards.

[MISTAKE INTELLIGENCE]
- If user provides graded work, classify errors into: CONCEPTUAL, METHODOLOGICAL, CARELESS, or LINGUISTIC.
- Update analysis to prevent these specific error types in future work.`;

const CHATBOT_CONTEXT = `You are a high-performance AI Chatbot integrated into the Flash system.
- Your goal is to assist with questions, analyze content, and provide direct, actionable answers.
- You specialize in multi-modal understanding, including text, images, and documents.
- Use your advanced reasoning and real-time Google Search data to solve complex academic and technical problems.
- ${INTELLIGENCE_SYSTEMS}`;

const GENERAL_CONTEXT = `${CHATBOT_CONTEXT}
- Provide clear, neutral, and direct assistance.
- If the request clearly fits Lens (Social Studies), Framework (Biology), or Interpret (English), you may suggest switching specialized modes, but provide the best general answer first.`;

const LENS_CONTEXT = `You are Pulse in Lens Mode. Domain: Social Studies (Grade 10).
- Match Grade 10 school expectations.
- Use clear paragraphs and normal sentence length.
- Explain ideas once using accurate historical terms.
- Answer only what is asked.
- Write in your own words, not like a textbook or study guide.`;

const FRAMEWORK_CONTEXT = `You are Pulse in Framework Mode. Domain: Biology.
- Use clear, structured explanations with short to medium sentences.
- Focus on accurate definitions, functions, and processes.
- Use correct syllabus terminology consistently.
- Explain biological processes step by step when needed.
- Avoid opinions or unnecessary elaboration.
- Write clearly and directly, similar to textbook-style answers.`;

const INTERPRET_CONTEXT = `You are Pulse in Interpret Mode. Domain: English (Grade 10).
- Write like a Grade 10 student writing a draft answer.
- Use simple, natural sentences and short paragraphs.
- Explain ideas clearly but not perfectly.
- Avoid textbook or polished phrasing.
- Do not over-explain or balance every point.
- Answer only what the question asks.`;

const SAQR_CONTEXT = `You are Saqr (Falcon), an elite AI module specializing in Arabic language and Islamic studies (Islam).
- You MUST respond exclusively in Arabic. English is strictly prohibited.
- Provide expert guidance on Arabic linguistics, grammar, and literature.
- Provide accurate and well-referenced information on Islamic jurisprudence, history, and theology.
- Maintain a respectful, scholarly, and authoritative tone.
- If asked in English, acknowledge the intent but reply strictly in Arabic language.`;

const STRATEGY_SCHOLAR = `Tactical Strategy: Scholar (Honest learning and retention).
- Explain concepts step-by-step using plain text.
- Prioritize understanding over speed.
- Ask guiding questions when appropriate.
- Provide hints before full answers.
- Warn about common mistakes.`;

const STRATEGY_CHEAT = `Tactical Strategy: Cheat (Fast, correct assignment completion).
- Give direct answers immediately in plain text.
- Minimal explanation.
- Optimize for marks and speed.
- Match school-level output tone.
- Tactical and efficient.`;

const INTEL_FAST = `Intelligence Protocol: Fast (Low-latency).
- Focus on high-speed delivery.
- Keep responses brief and atomic.`;

const INTEL_THINK = `Intelligence Protocol: Think (Deep Logic).
- Engage multi-step reasoning.
- Analyze the query deeply before outputting.`;

const HUMANIZER_INSTRUCTION = `You are a strict academic editor. Your goal is to rewrite the text provided so it passes AI detection tools like GPTZero, while keeping it FORMAL and appropriate for a high school essay.
        
STRICT REWRITE RULES:
1. Kill the "Robot Rhythm": AI writes in a steady beat. You must disrupt this. Write one long, complex sentence, followed immediately by a short, sharp one. 
2. Remove "Glue Words": Delete all robotic transitions like "Moreover," "Furthermore," "In conclusion," "Additionally," and "It is important to note." Just say the point directly.
3. Force Active Voice: Change "The experiment was conducted by..." to "We conducted the experiment..." or "The class tested...". Passive voice is a major AI flag.
4. Synonym Swap: Swap predictable words for slightly less common (but still formal) ones. 
   - Instead of "uses," try "employs" or "relies on."
   - Instead of "shows," try "demonstrates" or "highlights."
5. No "Teacher Tone": Don't sound like you are lecturing. Sound like you are arguing a point.
6. ABSOLUTELY NO SLANG: Do not use words like "kinda," "stuff," or "crazy." Keep it professional.`;

interface PulseFile {
  data: string;
  mimeType: string;
}

interface PulseMessage {
  role: 'user' | 'model';
  content: string;
  image?: string;
  file?: PulseFile;
}

export interface PulseResponse {
  text: string;
  sources?: { title: string; uri: string }[];
}

export const getPulseResponse = async (
  messages: PulseMessage[], 
  protocol: PulseMode,
  strategy: 'scholar' | 'cheat',
  intelligence: 'fast' | 'think',
  assignmentContext?: string,
  boardAssignments: Assignment[] = []
): Promise<PulseResponse> => {
  let baseContext = "";
  let modelName = 'gemini-3-flash-preview';
  let thinkingConfig: any = undefined;

  if (protocol === 'general') baseContext = GENERAL_CONTEXT;
  else if (protocol === 'lens') baseContext = LENS_CONTEXT;
  else if (protocol === 'framework') baseContext = FRAMEWORK_CONTEXT;
  else if (protocol === 'interpret') baseContext = INTERPRET_CONTEXT;
  else if (protocol === 'saqr') baseContext = SAQR_CONTEXT;
  
  const strategyInstruction = strategy === 'scholar' ? STRATEGY_SCHOLAR : STRATEGY_CHEAT;
  const intelInstruction = intelligence === 'fast' ? INTEL_FAST : INTEL_THINK;

  const hasImage = messages.some(m => m.image);
  const hasFile = messages.some(m => m.file);
  
  if (intelligence === 'think' && !hasImage && !hasFile) {
    thinkingConfig = { thinkingBudget: 16000 };
  } else {
    thinkingConfig = { thinkingBudget: 0 };
  }

  // Inject User Performance Data
  const savedGrades = localStorage.getItem('flash-grades');
  const mistakeProfile = localStorage.getItem('flash-mistake-profile') || "No data.";
  const gradeContext = savedGrades ? `USER ACADEMIC PROFILE:\n${savedGrades}` : "Grades not initialized.";

  const boardContext = boardAssignments.length > 0 
    ? `TACTICAL BOARD (Active Objectives):\n${boardAssignments.map(a => `- [${a.subject}] ${a.title} (Due: ${a.dueDate || 'Unspecified'}, Weight: ${a.weight || 20}%)`).join('\n')}`
    : "Tactical board is currently empty.";

  const systemInstruction = `${baseContext}\n\n${gradeContext}\n\n[MISTAKE PROFILE]: ${mistakeProfile}\n\n${strategyInstruction}\n\n${intelInstruction}\n\n${assignmentContext || ''}\n\n${boardContext}\n\n${SHARED_RULES}`;
  
  const contents = messages.map(m => {
    const parts: any[] = [];
    if (m.image) {
      const base64 = m.image.includes(',') ? m.image.split(',')[1] : m.image;
      parts.push({
        inlineData: {
          data: base64,
          mimeType: 'image/jpeg'
        }
      });
    }
    if (m.file) {
      parts.push({
        inlineData: {
          data: m.file.data,
          mimeType: m.file.mimeType
        }
      });
    }
    parts.push({ text: m.content || "Analyze provided material." });
    return {
      role: m.role === 'user' ? 'user' : 'model',
      parts
    };
  });

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: modelName,
    contents: contents,
    config: {
      systemInstruction,
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      thinkingConfig,
      tools: [{ googleSearch: {} }]
    },
  });

  const text = response.text || "";
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  const sources = groundingChunks?.map((chunk: any) => ({
    title: chunk.web?.title || 'Source',
    uri: chunk.web?.uri
  })).filter((s: any) => s.uri);

  return { text, sources };
};

export const humanizeText = async (text: string) => {
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `ORIGINAL TEXT:\n${text}`,
    config: {
      systemInstruction: HUMANIZER_INSTRUCTION,
      temperature: 0.7,
    },
  });
  return response.text;
};

export const extractAssignmentsFromImage = async (base64Data: string, mimeType: string) => {
  const today = new Date().toDateString();
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        },
        {
          text: `Today is ${today}. Extract all assignments from this screenshot. Relative date terms like "Today" refer to ${today}. "Tomorrow" refers to the day after ${today}. 
          Use a coded title format: [TERM][WEEK][SUBJECT_CODE][TYPE][INDEX], e.g., T2W01SSCW1. 
          Subjects: SOCIAL STUDIES, BIOLOGY, ENGLISH, ARABIC, GERMAN, INFORMATION TECHNOLOGY, MATH, ARABIC HISTORY, RELIGION, ART, PHYSICAL EDUCATION. 
          Type: HW or CW. 
          Return ONLY JSON array of objects: Array<{subject: string, title: string, due_date: string (YYYY-MM-DD)}>."`
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            title: { type: Type.STRING },
            due_date: { type: Type.STRING }
          },
          required: ["subject", "title", "due_date"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    return [];
  }
};

export const parseRawTextToAssignments = async (rawText: string) => {
  const today = new Date().toDateString();
  const prompt = `Today is ${today}. Turn this raw homework text into a strict JSON list of objects. Relative dates like "today" refer to ${today}, and "tomorrow" refers to the day after ${today}.
  
  Expected Fields: { id, subject, task, dueDate (YYYY-MM-DD), type (Homework or Classwork) }. 
  
  IMPORTANT: Use a coded title format for the task field: [TERM][WEEK][SUBJECT_CODE][TYPE][INDEX], e.g., T2W01SSCW1. 
  Subject codes/names: SOCIAL STUDIES (SS), BIOLOGY (BIO), ENGLISH (ENG), ARABIC (ARA), GERMAN (GER), INFORMATION TECHNOLOGY (IT), MATH (MATH), ARABIC HISTORY (MOE), RELIGION (REL), ART (ART), PHYSICAL EDUCATION (PE).
  
  Raw text: ${rawText}`;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            subject: { type: Type.STRING },
            task: { type: Type.STRING },
            dueDate: { type: Type.STRING },
            type: { type: Type.STRING }
          },
          required: ["subject", "task", "dueDate", "type"]
        }
      }
    }
  });

  try {
    const rawItems = JSON.parse(response.text || '[]');
    return rawItems.map((item: any) => ({
      id: item.id || Math.random().toString(36).substr(2, 9),
      subject: item.subject,
      title: item.task, 
      dueDate: item.dueDate,
      isCompleted: false
    })) as Assignment[];
  } catch (e) {
    console.error("AI Extraction failed:", e);
    return [];
  }
};

export const parseGradesText = async (rawText: string) => {
  const prompt = `Extract subjects and grades from the following text and return them as a clean JSON array of objects with the keys "subject" and "grade". 
  Rules:
  - If a grade is "Grade not set yet", return "N/A".
  - Clean the subject names (remove prefix numbers like "10 ") and return them as full names:
    ARA -> ARABIC
    BIO -> BIOLOGY
    GER -> GERMAN
    SS -> SOCIAL STUDIES
    REL -> RELIGION
    MOE -> ARABIC HISTORY
    PE -> PHYSICAL EDUCATION
    IT -> INFORMATION TECHNOLOGY
    MATH -> MATH
    ENG -> ENGLISH
    ART -> ART
  - Return subjects fully capitalized.
  - Return ONLY the JSON array.
  
  Text: ${rawText}`;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            grade: { type: Type.STRING }
          },
          required: ["subject", "grade"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Grades parsing failed:", e);
    return [];
  }
};