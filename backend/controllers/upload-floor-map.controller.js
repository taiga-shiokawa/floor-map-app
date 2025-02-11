import dotenv from "dotenv";
import OpenAI from "openai/index.mjs";
import sharp from 'sharp';
import Tesseract from 'tesseract.js';

dotenv.config();

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

export const uploadFloorMap = async (req, res) => {
 try {
   if (!req.file) {
     return res.status(400).json({ message: "フロアマップが必要です" });
   }

   const searchStore = req.body.store;
   if (!searchStore) {
     return res.status(400).json({ message: "検索したい店舗名を入力してください" });
   }

   const processImage = async (buffer) => {
     return await sharp(buffer)
       .normalize()
       .modulate({ brightness: 1.1, contrast: 1.2 })
       .sharpen()
       .toBuffer();
   };

   const extractTextFromImage = async (imageBuffer) => {
    const { data: { text } } = await Tesseract.recognize(imageBuffer, 'jpn', {
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789- ',
    });
    return text;
  };

   const processedImage = await processImage(req.file.buffer);
   const extractedText = await extractTextFromImage(processedImage);
   const base64Image = processedImage.toString('base64');
   const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;
   const searchStoreName = normalizeStoreName(searchStore);

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

   const storeInfo = visionResponse.choices[0].message.content;

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

   const guidance = completionResponse.choices[0].message.content;

   if (guidance.includes('申し訳ありません') || guidance.includes('見つかりません')) {
     return res.status(404).json({
       success: false,
       message: "指定された店舗が見つかりませんでした。"
     });
   }

   return res.status(200).json({
     success: true,
     storeInfo,
     guidance
   });

 } catch (error) {
   console.error('Error:', error);
   return res.status(500).json({
     success: false,
     message: "画像の処理中にエラーが発生しました。",
     error: error.message
   });
 }
};