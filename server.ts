import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// --- 1. EXPRESS COGNIZANCE / HARDENING ---
// Explicitly disable x-powered-by to prevent framework fingerprinting and automated target analysis
app.disable("x-powered-by");

// Limit request JSON payloads to protect against large memory allocation attacks / JSON bloating attacks
app.use(express.json({ limit: "150kb" }));

// --- 2. GLOBAL SECURITY HEADERS MIDDLEWARE ---
// Implements secure headers without external dependecies to avoid node_modules versioning conflicts
app.use((req, res, next) => {
  // Prevent MIME-sniffing vulnerability
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Prevent drag-and-drop clickjacking while allowing the applet to safely run inside the AI Studio domain
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  // Rigorous Content-Security-Policy (CSP) restricting script, style, connection and frame targets to prevent XSS and malicious frame embedding
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' data: https://fonts.gstatic.com; " +
    "img-src 'self' data: blob: referrer; " +
    "connect-src 'self' ws: wss: https://*.google.com; " +
    "frame-ancestors 'self' https://*.google.com https://*.run.app https://ais-pre-jjkkbfkvzu3n5catotvkct-482390678493.europe-west1.run.app;"
  );

  // Modern browser defense blocking active loading of Reflected XSS payloads
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Strict referrers constraint to filter credential leaks
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Enforce HTTPS HSTS rules securely
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  next();
});

// --- 3. IN-MEMORY STICKY IP RATE LIMITER ---
// Limits repetitive advisory querying to standard human-level usage to avoid Gemini quota depletion and spam
interface RateLimitInfo {
  count: number;
  resetTime: number;
}
const ipRequestHistory = new Map<string, RateLimitInfo>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // Max 30 questions per IP per minute

// Automatically wipe expired items periodically to guarantee no memory leak grows over time
setInterval(() => {
  const now = Date.now();
  for (const [ip, info] of ipRequestHistory.entries()) {
    if (now > info.resetTime) {
      ipRequestHistory.delete(ip);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

function rateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Extract clients true IP safely prioritizing X-Forwarded-For if behind a reverse proxy
  const forwarded = req.headers["x-forwarded-for"];
  const ip = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket.remoteAddress || "unknown-ip";

  const now = Date.now();
  const info = ipRequestHistory.get(ip);

  if (!info || now > info.resetTime) {
    ipRequestHistory.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    });
    return next();
  }

  if (info.count >= MAX_REQUESTS_PER_WINDOW) {
    res.setHeader("Retry-After", Math.ceil((info.resetTime - now) / 1000));
    return res.status(429).json({
      error: "Too many requests. Please throttle your queries to preserve medical chatbot bandwidth for high-alert diagnostic queries."
    });
  }

  info.count += 1;
  return next();
}

// Mount rate-limiter specifically on API endpoints
app.use("/api/chat", rateLimiter);

// Helper to construct a GoogleGenAI client
function createGeminiClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Handler helper to execute the actual chat with a specific key
async function runGeminiChat(apiKey: string, message: string, history: any[]): Promise<string> {
  const ai = createGeminiClient(apiKey);
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

  return response.text;
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

// Elegant list-based offline symptom classifier
function getOfflineResponse(message: string): string {
  const query = message.toLowerCase();

  // 1. Greetings
  if (
    query.trim() === "hi" ||
    query.trim() === "hello" ||
    query.trim() === "hey" ||
    query.includes("good morning") ||
    query.includes("good afternoon") ||
    query.includes("good evening") ||
    query.includes("how are you")
  ) {
    return `Hello there! I am FlockIntel AI, your clinical health advisor. 

I am currently running in **offline-first pre-screening fallback mode** (ready to help!). Please describe any sickness symptoms you are seeing in your flock (such as *green droppings*, *bloody poop*, *swollen eyes*, or *scabs on comb*) and I will run a customized regional diagnostic check for you.`;
  }

  // 2. Thank you
  if (query.includes("thank you") || query.includes("thanks") || query.trim() === "ok thanks" || query.trim() === "ok") {
    return "You're very welcome! Keep monitoring your flock closely, and let me know if you observe any other clinical signs. Stay safe!";
  }

  const matchedDiseases: string[] = [];
  const symptomsMatched: string[] = [];
  let diagnosisText = "";

  // Newcastle Disease
  if (
    query.includes("newcastle") ||
    query.includes("green") ||
    query.includes("twisting") ||
    query.includes("twisted") ||
    query.includes("paralysis") ||
    query.includes("nervous")
  ) {
    matchedDiseases.push("Newcastle Disease (Highly Contagious Virus)");
    symptomsMatched.push("watery green droppings, respiratory gasping, or nervous twisted-neck symptoms");
    diagnosisText += `
### 1. Newcastle Disease (Viral)
- **Clinical Signs**: Greenish watery diarrhea, coughing/gasping, twisted neck/stargazing, wing/leg paralysis, high mortality.
- **Immediate First-Aid**: Quarantine all symptomatic birds immediately. Administer vitamins and multi-electrolytes in water to reduce stress. Provide broad-spectrum antibiotics (such as Tylosin or Neomycin) only to prevent secondary bacterial complications.
- **Prevention Strategy**: Strict, proactive vaccination is the only prevention. Implement LaSota or HB1 strain vaccines in drinking water or eye drops according to standard scheduling. Disinfect housing with Virkon-S.
`;
  }

  // Coccidiosis
  if (
    query.includes("coccidiosis") ||
    query.includes("blood") ||
    query.includes("bloody") ||
    query.includes("red poop") ||
    query.includes("huddle") ||
    query.includes("huddling") ||
    query.includes("cocci")
  ) {
    matchedDiseases.push("Coccidiosis (Protozoan Parasite)");
    symptomsMatched.push("bloody/mucus-filled diarrhea, ruffled feathers, pale combs, and birds huddling together");
    diagnosisText += `
### 2. Coccidiosis (Protozoic)
- **Clinical Signs**: Bloody, dark/mucus-filled diarrhea, severe lethargy, pale combs, loss of appetite, and huddling.
- **Immediate First-Aid**: Treat immediately using water-soluble anticoccidial drugs such as **Amprolium**, Sulfadimidine, or Toltrazuril. Add **Vitamin K** to their water to control intestinal bleeding.
- **Prevention Strategy**: Keep litter bone-dry at all costs. Change wet bedding immediately! Avoid overcrowding and ensure adequate ventilation. Use coccidiostats in feed if available.
`;
  }

  // Gumboro (IBD)
  if (
    query.includes("gumboro") ||
    query.includes("ibd") ||
    query.includes("bursal") ||
    query.includes("peck") ||
    query.includes("vent") ||
    query.includes("white diarrhea") ||
    query.includes("trembling")
  ) {
    matchedDiseases.push("Gumboro / Infectious Bursal Disease (IBD)");
    symptomsMatched.push("severe depression, watery white feces, self-vent pecking, lack of coordination, or trembling");
    diagnosisText += `
### 3. Gumboro / Infectious Bursal Disease (IBD)
- **Clinical Signs**: Watery white diarrhea, extreme depression, birds pecking at their own vents, trembling, high mortality in young chicks (3-6 weeks).
- **Immediate First-Aid**: There is no direct cure for this virus. Supply high-quality multivitamins, glucose, and supportive oral rehydration electrolytes to combat dehydration. Prevent secondary respiratory/bacterial stress using mild feed antibiotics.
- **Prevention Strategy**: Clean and disinfect pens thoroughly between batches. Vaccinate chicks around Day 10-14, and repeat booster vaccinations on Day 21-24 with live IBD vaccines.
`;
  }

  // Fowl Pox
  if (
    query.includes("pox") ||
    query.includes("scab") ||
    query.includes("scabs") ||
    query.includes("comb") ||
    query.includes("wattle") ||
    query.includes("canker") ||
    query.includes("cheesy")
  ) {
    matchedDiseases.push("Fowl Pox (Slow-Spreading Virus)");
    symptomsMatched.push("wart-like scabs or nodules on the comb/wattles, or cheesy yellow throat patches");
    diagnosisText += `
### 4. Fowl Pox (Dry/Wet)
- **Clinical Signs**: Dark wart-like scabs on comb/eyelids, and/or yellow cheesy canker in mouth/throat causing severe gasping.
- **Immediate First-Aid**: Isolate all scabbed birds. Gently apply antiseptic ointments (such as dilute Iodine or sulfur vaseline) to external nodules. Supplement with Vitamin A to promote skin and mucous membrane healing.
- **Prevention Strategy**: Control mosquitoes and biting insects around the poultry house, as they are the primary vectors. Vaccinate the remaining healthy flock immediately using Fowl Pox vaccine by wing-web stab.
`;
  }

  // Infectious Coryza / Chronic Respiratory Disease (CRD)
  if (
    query.includes("coryza") ||
    query.includes("crd") ||
    query.includes("sneez") ||
    query.includes("cough") ||
    query.includes("swollen eye") ||
    query.includes("watery eye") ||
    query.includes("pus") ||
    query.includes("discharge") ||
    query.includes("nasal") ||
    query.includes("smelly") ||
    query.includes("stinky")
  ) {
    matchedDiseases.push("Infectious Coryza / Chronic Respiratory Disease (CRD)");
    symptomsMatched.push("swollen face, sticky nasal discharge with foul smell, watery/pus-closed eyes, or coughing");
    diagnosisText += `
### 5. Infectious Coryza / CRD (Bacterial)
- **Clinical Signs**: Swollen face/sinuses, foul-smelling nasal discharge, sticky pus closing the eyes, gurgling breath sounds.
- **Immediate First-Aid**: Treat immediately with respiratory antibiotics like **Tylosin, Erythromycin, or Tetracycline** in drinking water. Clean the birds' eyes with a dilute saline or warm boric acid solution.
- **Prevention Strategy**: Improve ventilation immediately to prevent harmful ammonia build-up. Keep dust levels down by managing dry litter, and sanitize drinker lines daily.
`;
  }

  // Avian Influenza
  if (
    query.includes("influenza") ||
    query.includes("flu") ||
    query.includes("sudden") ||
    query.includes("purple") ||
    query.includes("blue wattle") ||
    query.includes("blue comb") ||
    query.includes("swimming") ||
    query.includes("severe distress")
  ) {
    matchedDiseases.push("Highly Pathogenic Avian Influenza (HPAI / Bird Flu)");
    symptomsMatched.push("extremely high sudden mortality, facial swelling, bluish-purple combs/wattles, or blood in nostrils");
    diagnosisText += `
### 6. Avian Influenza (Bird Flu)
- **Clinical Signs**: Sudden death of many birds without prior signs, blue discoloration of combs, bloody nasal discharge, severe lethargy.
- **Immediate First-Aid**: **WARNING: This is a zoonotic disease.** Do not attempt clinical treatment. Quarantine the entire farm immediately. Do not transport, sell, or touch dead poultry without secure protective equipment.
- **Prevention Strategy**: Maintain strict biosecurity. Exclude wild birds from entering pens. Notify state poultry officers or local MOFA veterinarian immediately.
`;
  }

  // If we matched some disease symptoms, compile a gorgeous clinical pre-screening response!
  if (matchedDiseases.length > 0) {
    return `### 🩺 FlockIntel Veterinary Pre-Screening Report
*Running in clinical pre-screening fallback mode.*

- **Potential Disease(s) Identified**: ${matchedDiseases.join(", ")}
- **Core Clinical Symptoms Matched**: ${symptomsMatched.join("; ")}

---

${diagnosisText}

---

### 🛡️ Recommended IMMEDIATE Biosecurity Safeguards
1. **Quarantine Immediately**: Separate all sick, gasping, or ruffling birds from healthy layers/broilers.
2. **Water-Line Treatment**: Administer appropriate supportive classes of medication (Vit K / Amprolium for bloody droppings; broad-spectrum antibiotics for respiratory coryza).
3. **Footbaths & Disinfection**: Setup Virkon-S footbaths at every entrance and scrub tools.

### 📞 MoFA Ghana Support Referral
Please contact the National Poultries Directorate or prompt your district MoFA extension veterinarian at **+233 (0) 244 837 581** for immediate sample collection and diagnostic confirmation.

*Disclaimer: This advisory report is an automated pre-screening engine and must not replace professional on-site diagnostic verification by verified veterinary officers.*`;
  }

  // General poultry definition context response if no specific sickness symptoms matched
  return `### 💡 FlockIntel Advisory Notice
I noticed you are asking about general poultry husbandry, feeding regimes, or non-sickness topics, or I couldn't match specific clinical signs.

I am running in clinical pre-screening fallback mode. You can trigger targeted disease guidelines by asking about specific symptoms, such as:
- *"My birds have watery green droppings and twisted necks"* (Newcastle pre-screen)
- *"What should I do for bloody diarrhea and ruffled feathers?"* (Coccidiosis pre-screen)
- *"They have swollen eyes, runny noses, and sneezing"* (Infectious Coryza pre-screen)
- *"There are black scabs on their combs and eyelids"* (Fowl Pox pre-screen)

**General Farm Quick Checks:**
- Make sure feed silos are at least 15% full.
- Ensure automated sensors monitor temperature within the 21-27°C target.
- Clean and sanitize water drinkers daily to prevent pathogen transmission.`;
}

// Keep track of the API key validity to avoid repeated slow network errors or log spam
let isApiKeyLeaked = false;
let lastUsedKey = "";

function sanitizeApiKey(key: string): string {
  if (!key) return "";
  let sanitized = key.trim();
  // Strip enclosing double quotes if present
  if (sanitized.startsWith('"') && sanitized.endsWith('"')) {
    sanitized = sanitized.slice(1, -1);
  }
  // Strip enclosing single quotes if present
  if (sanitized.startsWith("'") && sanitized.endsWith("'")) {
    sanitized = sanitized.slice(1, -1);
  }
  return sanitized.trim();
}

// API Endpoints
app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;

  // --- STRICT INPUT VALIDATION & SANITIZATION (Defense-in-depth against prompt/buffer injection) ---
  if (typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({ error: "Message must be a non-empty string." });
  }

  if (message.length > 4000) {
    return res.status(400).json({ error: "Message exceeds safely allowed character limit of 4000." });
  }

  const safeMessage = message.trim();
  const validatedHistory: { role: string; content: string }[] = [];

  if (history !== undefined) {
    if (!Array.isArray(history)) {
      return res.status(400).json({ error: "History must be an array structure." });
    }
    if (history.length > 20) {
      return res.status(400).json({ error: "History size exceeds maximum conversation depth of 20." });
    }

    for (let i = 0; i < history.length; i++) {
      const item = history[i];
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return res.status(400).json({ error: `Invalid history item structure at index ${i}` });
      }
      if (typeof item.role !== "string" || !["user", "model", "assistant"].includes(item.role)) {
        return res.status(400).json({ error: `Invalid role at history index ${i}` });
      }
      if (typeof item.content !== "string") {
        return res.status(400).json({ error: `Invalid content type at history index ${i}` });
      }
      if (item.content.length > 4000) {
        return res.status(400).json({ error: `History content at index ${i} exceeds limit of 4000 characters.` });
      }
      validatedHistory.push({
        role: item.role === "user" ? "user" : "model",
        content: item.content.trim()
      });
    }
  }

  const rawKey = process.env.GEMINI_API_KEY || "";
  const userKey = sanitizeApiKey(rawKey);

  // Reset leaked status if user rotated or updated their API key
  if (userKey !== lastUsedKey) {
    isApiKeyLeaked = false;
    lastUsedKey = userKey;
  }

  // If the key was previously detected as leaked, run immediately in offline fallback
  if (isApiKeyLeaked) {
    const guidance = `⚠️ **Gemini API Live Connection Status:** The configured API key was previously reported as leaked and has been deactivated. To restore fully active cloud-tier AI models, please configure or refresh your Gemini API key inside the **Settings > Secrets** panel of the AI Studio UI.\n\n***\n\n`;
    const fallbackMessage = getOfflineResponse(safeMessage);
    return res.json({
      reply: `${guidance}### 🍀 Running Offline-First Local Diagnostics\n\n${fallbackMessage}`
    });
  }

  if (userKey) {
    try {
      console.log("Trying Gemini chat with user's configured GEMINI_API_KEY...");
      const reply = await runGeminiChat(userKey, safeMessage, validatedHistory);
      return res.json({ reply });
    } catch (err: any) {
      let errMsg = "";
      if (err && typeof err === "object") {
        try {
          errMsg = err.message || JSON.stringify(err);
        } catch (_) {
          errMsg = String(err);
        }
      } else {
        errMsg = String(err);
      }
      console.error("Gemini API call failed:", errMsg);
      
      const isLeakedMsg = errMsg.includes("leaked") || 
                          errMsg.includes("leak") || 
                          errMsg.includes("403") || 
                          errMsg.includes("PERMISSION_DENIED") ||
                          errMsg.includes("API key was reported as leaked") ||
                          (err && (err.status === 403 || err.statusCode === 403 || err.code === 403));
      
      const isExpiredOrInvalid = errMsg.includes("expired") ||
                                       errMsg.includes("API_KEY_INVALID") ||
                                       errMsg.includes("renew the API key") ||
                                       errMsg.includes("key expired") ||
                                       errMsg.includes("INVALID_ARGUMENT") && errMsg.includes("API key");

      let guidance = "";
      if (isLeakedMsg) {
        isApiKeyLeaked = true;
        guidance = `⚠️ **Gemini API Live Connection Status:** The cloud API key is restricted or flagged as leaked. To restore active cloud-tier AI models, please configure a fresh Gemini API key inside the **Settings > Secrets** panel of the AI Studio UI.\n\n***\n\n`;
      } else if (isExpiredOrInvalid) {
        guidance = `⚠️ **Gemini API Live Connection Status:** The configured Gemini API key has **expired or is invalid** (Error: API_KEY_INVALID). To restore fully active cloud-tier AI models, please create a fresh API key in Google AI Studio and update it in your AI Studio **Settings > Secrets** panel.\n\n***\n\n`;
      } else {
        guidance = `⚠️ **Gemini API Connection Offline:** Remote model is unreachable (${errMsg || "Network Error"}).\n\n***\n\n`;
      }
      
      const fallbackMessage = getOfflineResponse(safeMessage);
      return res.json({
        reply: `${guidance}### 🍀 Running Offline-First Local Diagnostics\n\n${fallbackMessage}`
      });
    }
  } else {
    console.log("No custom user GEMINI_API_KEY detected in env.");
    const guidance = `💡 **Note on Cloud Connectivity:** No active Gemini API key was found in your server environment. Your environment's personal API key can be securely loaded from the **Settings > Secrets** panel to reactivate global cloud-tier AI reasoning.\n\n***\n\n`;
    
    const fallbackMessage = getOfflineResponse(safeMessage);
    return res.json({
      reply: `${guidance}### 🍀 Running Offline-First Local Diagnostics\n\n${fallbackMessage}`
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
