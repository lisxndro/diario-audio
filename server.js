import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post('/upload-audio', upload.single('audio'), async (req, res) => {
  try {
    const filePath = req.file.path;

    const transcription = await openai.createTranscription(
      fs.createReadStream(filePath),
      'whisper-1'
    );

    const data = {
      transcription: transcription.data.text,
      audioFile: req.file.filename,
      originalName: req.file.originalname,
      date: new Date().toISOString(),
    };

    // Guarda en un archivo JSON
    const logDir = path.join('transcriptions');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

    const logPath = path.join(logDir, 'log.json');
    let logs = [];
    if (fs.existsSync(logPath)) {
      logs = JSON.parse(fs.readFileSync(logPath));
    }
    logs.push(data);
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error transcribing audio' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
