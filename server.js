// ===== LOAD GOOGLE KEY FROM ENV (FLY.IO) =====
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  const fs = require("fs");
  fs.writeFileSync(
    "/tmp/google-key.json",
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  );
  process.env.GOOGLE_APPLICATION_CREDENTIALS = "/tmp/google-key.json";
}




const express = require("express");
const multer = require("multer");
const cors = require("cors");
const speech = require("@google-cloud/speech");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.static(__dirname));

const upload = multer({ storage: multer.memoryStorage() });

const client = new speech.SpeechClient({
    keyFilename: "google-stt-key.json",
});

app.post("/stt", upload.single("audio"), async (req, res) => {
    try {
        console.log("📥 /stt called");

        if (!req.file) {
            return res.json({ text: "" });
        }

        const audioBytes = req.file.buffer.toString("base64");

        const [response] = await client.recognize({
            audio: { content: audioBytes },
            config: {
                encoding: "WEBM_OPUS",
                sampleRateHertz: 48000,
                languageCode: "vi-VN",
                alternativeLanguageCodes: ["en-US", "ja-JP", "ko-KR", "zh-CN"]

            },
        });

        const text = response.results
            .map(r => r.alternatives[0].transcript)
            .join(" ");

        console.log("📝 Transcript:", text);
        res.json({ text });
    } catch (e) {
        console.error("❌ STT error:", e);
        res.json({ text: "" });
    }
});

app.listen(3000, () => {
    console.log("✅ STT server running at http://localhost:3000");
});
