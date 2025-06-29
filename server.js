import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/upload-audio', upload.single('audio'), async (req, res) => {
  try {
    const filePath = req.file.path;

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-1',
    });

    const data = {
      transcription: transcription.text,
      audioFile: req.file.filename,
      originalName: req.file.originalname,
      date: new Date().toISOString(),
    };

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
