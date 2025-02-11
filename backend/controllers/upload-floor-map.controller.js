import dotenv from "dotenv";
import OpenAI from "openai/index.mjs";
import sharp from 'sharp';
import Tesseract from 'tesseract.js';
import NodeCache from 'node-cache';
import crypto from 'crypto';

dotenv.config();

// キャッシュの初期化（TTL: 1時間）
const cache = new NodeCache({ stdTTL: 3600 });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const normalizeStoreName = (name) => {
  const aliases = {
    'スタバ': 'STARBUCKS',
    'スターバックス': 'STARBUCKS',
    'ユナイテッドアローズ': 'UNITED ARROWS',
    'ユナアロ': 'UNITED ARROWS',
    'GU': 'ジーユー',
    'ジーユー': 'GU'
  };
  return aliases[name] || name;
};

const getCacheKey = (imageBuffer, storeName) => {
  const hash = crypto
    .createHash('md5')
    .update(imageBuffer)
    .update(storeName)
    .digest('hex');
  return `floormap:${hash}`;
};

const processImage = async (buffer) => {
  return await sharp(buffer)
    .resize(800, null, {
      withoutEnlargement: true,
      fit: 'inside'
    })
    .normalize()
    .modulate({ brightness: 1.1, contrast: 1.2 })
    .sharpen()
    .jpeg({ quality: 80 })
    .toBuffer();
};

const extractTextFromImage = async (imageBuffer) => {
  const { data: { text } } = await Tesseract.recognize(imageBuffer, 'jpn', {
    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789- ',
    tessjs_create_pdf: '0',
    tessjs_create_hocr: '0',
    tessjs_create_tsv: '0',
    tessedit_pageseg_mode: '1',
    tessedit_ocr_engine_mode: '3',
  });
  return text;
};

const performGPTAnalysis = async (dataUrl, systemPrompt, searchStoreName) => {
  const visionResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `このフロアマップから「${searchStoreName}」の場所情報を抽出してください。`
          },
          {
            type: "image_url",
            image_url: {
              url: dataUrl,
              detail: "high"
            }
          }
        ]
      }
    ],
    max_tokens: 1024
  });

  return visionResponse.choices[0].message.content;
};

const generateGuidance = async (searchStoreName, storeInfo) => {
  const completionResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "あなたはショッピングモールの案内係です。抽出された情報をもとに、来場者にわかりやすく案内してください。"
      },
      {
        role: "user",
        content: `フロアマップの情報から「${searchStoreName}」の場所を「〇〇は、△階の□□店の近くにあります」という形式で案内してください。\n\n${storeInfo}`
      }
    ],
    temperature: 0.7,
    max_tokens: 200
  });

  return completionResponse.choices[0].message.content;
};

export const uploadFloorMap = async (req, res) => {
  try {
    // 入力バリデーション
    if (!req.file) {
      return res.status(400).json({ message: "フロアマップが必要です" });
    }

    const searchStore = req.body.store;
    if (!searchStore) {
      return res.status(400).json({ message: "検索したい店舗名を入力してください" });
    }

    // キャッシュチェック
    const cacheKey = getCacheKey(req.file.buffer, searchStore);
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      return res.status(200).json(cachedResult);
    }

    // 並列処理の開始
    const [processedImage, searchStoreName] = await Promise.all([
      processImage(req.file.buffer),
      Promise.resolve(normalizeStoreName(searchStore))
    ]);

    const [extractedText, base64Image] = await Promise.all([
      extractTextFromImage(processedImage),
      processedImage.toString('base64')
    ]);

    const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    const systemPrompt = `
      あなたはショッピングモールの案内係です。以下の手順で分析と案内を行ってください：

      分析手順:
      1. 画像全体を確認し、フロアの全体的なレイアウトを把握
      2. 各店舗を左上から順に時計回りにスキャン
      3. 店舗名は完全な正式名称で記録
      4. 位置関係は隣接店舗との関係で記録
      5. 略称や通称（例：スタバ→STARBUCKS）も考慮
      6. テキストが不明確な場合は「不明確」と記録

      抽出されたテキスト: ${extractedText}

      出力形式:
      店舗名: [正式名称]
      フロア: [数字]
      位置: [隣接店舗との関係]
      区画番号: [番号もしくはN/A]
   `;

    // まず店舗情報を取得
    const storeInfo = await performGPTAnalysis(dataUrl, systemPrompt, searchStoreName);
    
    // 次にガイダンスを生成
    const guidance = await generateGuidance(searchStoreName, storeInfo);

    if (guidance.includes('申し訳ありません') || guidance.includes('見つかりません')) {
      return res.status(404).json({
        success: false,
        message: "指定された店舗が見つかりませんでした。"
      });
    }

    const result = {
      success: true,
      storeInfo,
      guidance
    };

    // 結果をキャッシュに保存
    cache.set(cacheKey, result);

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      message: "画像の処理中にエラーが発生しました。",
      error: error.message
    });
  }
};