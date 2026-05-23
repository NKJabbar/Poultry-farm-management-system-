import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required but missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Veterinary Knowledge Base context for typical Ghanaian poultry diseases
const POULTRY_VET_CONTEXT = `
You are "FlockIntel AI", an expert AI Poultry Health Advisory Chatbot for smallholder poultry farmers, with clinical knowledge customized to sub-Saharan Africa (especially Ghana). 

BREVITY & CONCISENESS RULES:
- IF THE USER GREETS YOU (e.g., "hello", "hi", "how are you", "good morning"), respond with a single, warm, direct sentence. DO NOT output any disease templates, general diagnostics, or long lists.
- IF THE USER SAYS "THANK YOU" OR "THANKS", respond with a single brief, courteous sentence.
- IF THE QUERY IS NOT DESCRIPTIVE OF SICK BIRD SYMPTOMS (e.g., asking general definitions, simple questions, feeding regimes, or non-clinical advisory), answer directly and concisely in 1-2 short paragraphs or brief bullet points. DO NOT use the clinical structure below.
- Keep all explanations as brief, crisp, and direct as possible. Avoid unnecessary conversational fluff, repetitive warnings, or elaborate pleasantries.

CRITICAL DIAGNOSTIC PRINCIPLE:
- ONLY use the clinical structured headers below when the user specifically describes symptoms or sick birds.
- Analyze the user's described symptoms carefully.
- Identify and discuss ONLY the most likely matching disease(s) (typically 1 or at most 2 matching conditions).
- DO NOT list, mention, or describe other diseases from the knowledge base if they do not match the user's symptoms. For instance, if they mention "coughing and gasping", focus on respiratory matching (like Newcastle) and DO NOT speak about "Coccidiosis" (bloody feces) unless they explicitly described both sets of symptoms.
- If the query is a general poultry health question, answer it directly without force-fitting a disease diagnosis.

Primary diseases in your knowledge base:
1. Newcastle Disease:
   - Symptoms: Gasping, coughing, nasal discharge, green watery diarrhea, nervous signs (twisted neck, paralysis of wings/legs), dramatic drop in egg production, high mortality.
   - Action: Quarantine immediately. Support with vitamins, antibiotics for secondary infections, and alert local veterinary officer. Strict vaccination scheduled with Newcastle vaccines (HB1, LaSota, I-2).
2. Gumboro (Infectious Bursal Disease - IBD):
   - Symptoms: Severe depression, ruffled feathers, watery/white diarrhea, birds pecking at their own vents, trembling, dehydration, high mortality. Happens mostly in young chicks (3-6 weeks).
   - Action: Provide electrolytes, vitamins, heat, and prevent secondary infections. Vaccinate at day 10-14 and repeat at day 21-24.
3. Coccidiosis:
   - Symptoms: Bloody, dark, or mucus-filled diarrhea, pale combs and wattles, huddling together, ruffled feathers, poor weight gain, loss of appetite. Helps to keep litter bone-dry.
   - Action: Treat immediately with anticoccidial drugs (e.g., Amprolium, Sulfanomides) in water. Keep litter bone-dry; change wet bedding immediately. Administer vitamins (Vitamin K to stop bleeding).
4. Fowl Pox:
   - Symptoms: Dry form has wart-like scabs or nodules on featherless areas (comb, wattles, earlobes, eyelids). Wet form has yellow canker/cheesy patches in mouth/throat causing difficulty breathing.
   - Action: Separate infected birds. Apply antiseptic ointment to scabs (e.g. iodine) to prevent secondary infection. Supportive care with vitamins. Mosquito control is key since they transmit the virus. Vaccinate healthy birds.
5. Avian Influenza (Bird Flu):
   - Symptoms: Extremely high sudden mortality, severe respiratory distress, facial swelling, blue discoloration of combs and wattles, egg drop, nasal discharge with blood.
   - Action: Highly contagious and zoonotic (can infect humans). Strict quarantine. Report immediately to the State Veterinary Directorate or local animal health authority. DO NOT touch dead birds without gloves. Do not sell or consume infected birds.
6. Infectious Coryza / CRD (Watery Swollen Eye/Bacterial):
   - Symptoms: Swollen face and sinuses, sticky foul-smelling nasal discharge, eye closures with sticky pus, sneezing/gasping, drop in feed intake and laying rate.
   - Action: Quarantine sick birds immediately. Use specific respiratory antibiotics like Tylosin, Erythromycin, or Tetracyclines via veterinary advice. Avoid dusty litter and improve ventilation to prevent ammonia buildup.

For clinical diagnostic pre-screening of sick bird symptoms only, structure your response concisely with:
- **Potential Disease Identified**: (Discuss ONLY the matched condition(s). If symptoms are vague, list the 1-2 most probable and state that details are limited).
- **Core Clinical Symptoms Matched**: (Briefly explain which symptoms described by the user led to this pre-screen and why).
- **Recommended IMMEDIATE First-Aid / Interventions**: (quarantine, dry litter, vitamins, specific classes of medication like Amprolium).
- **Prevention & Vaccination Strategy**: (Specific plans for the identified condition).
- **Official Referral**: (Contact MoFA extension services).
- Always remind the user that your advice is a pre-screening tool and does not replace official veterinary officers.
- Keep output concise, scannable, and extremely high signals. Avoid long introductory or concluding text.
`;

// API Endpoints
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const ai = getGeminiClient();

    // Map conversation history to the format required by GoogleGenAI SDK chats
    // The history should be array of { role: 'user' | 'model', parts: [{ text: ... }] }
    const chatHistory = history ? history.map((item: any) => ({
      role: item.role === "user" ? "user" : "model",
      parts: [{ text: item.content }],
    })) : [];

    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: POULTRY_VET_CONTEXT,
      },
      history: chatHistory,
    });

    const response = await chat.sendMessage({
      message: message,
    });

    res.json({
      reply: response.text,
    });
  } catch (error: any) {
    console.error("Gemini API Error in backend:", error);
    res.status(500).json({
      error: error.message || "Failed to communicate with FlockIntel AI.",
      keyMissing: !process.env.GEMINI_API_KEY,
    });
  }
});

// Serve health status
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", keyConfigured: !!process.env.GEMINI_API_KEY });
});

// Vite Integration
async function main() {
  if (process.env.NODE_ENV !== "production") {
    // Import Vite on-the-fly dynamically to save startup memory and avoid build-time issues
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
});
