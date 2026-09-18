import { OpenAI } from 'openai';
import { createReadStream } from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // CORS対応
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // リクエストから base64 で受け取ったファイル
    const { audioData, fileName } = req.body;

    if (!audioData || !fileName) {
      return res.status(400).json({ error: 'audioData and fileName required' });
    }

    // base64 をバッファに変換
    const buffer = Buffer.from(audioData, 'base64');

    // 一時ファイルパスに保存（Vercel では /tmp を使用）
    const tempFilePath = path.join('/tmp', fileName);
    
    // 実際には Node.js でバッファを直接渡す方法を使う
    // Whisper API に送信
    const transcript = await openai.audio.transcriptions.create({
      file: new File([buffer], fileName, { type: 'audio/mp4' }),
      model: 'whisper-1',
      language: 'ja', // 日本語指定
    });

    return res.status(200).json({
      success: true,
      text: transcript.text,
      fileName: fileName,
    });
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({
      error: 'Transcription failed',
      message: error.message,
    });
  }
}
