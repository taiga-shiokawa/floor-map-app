import dotenv from "dotenv";
import OpenAI from "openai/index.mjs";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const uploadFloorMap = async (req, res) => {  // 'red' を 'res' に修正
  try {
    // フロアマップの検証
    if (!req.file) {
      return res.status(400).json({ message: "フロアマップが必要です" });
    }

    // 検索したい店舗名の検証
    const searchStore = req.body.store;
    if (!searchStore) {
      return res.status(400).json({ message: "検索したい店舗名を入力してください" });
    }

    const base64Image = req.file.buffer.toString("base64");
    const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [  // 'message' を 'messages' に修正
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "この画像はショッピングモールのフロアマップです。店舗名と位置情報を抽出してください。",
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
                detail: "high"
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const storeInfo = visionResponse.choices[0].message.content;

    const completionResponse = await openai.chat.completions.create({  // 変数名のタイプミスを修正
      model: "gpt-4o-mini",
      messages: [  // 'message' を 'messages' に修正
        {
          role: "system",
          content:
            "あなたはショッピングモールの案内係です。フロアマップの情報をもとに、来場者の目的の店舗への案内を行います。",
        },
        {
          role: "user",
          content: `以下のフロアマップ情報から「${searchStore}」の場所を「〇〇は、△階の□□店の近くにあります」という形式で案内してください。\n\n${storeInfo}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200
    });

    const guidance = completionResponse.choices[0].message.content;

    return res.status(200).json({
      success: true,
      storeInfo,  // 画像から抽出した生のテキスト情報
      guidance    // 自然な案内文
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      message: "画像の処理中にエラーが発生しました。画質が悪い可能性があります。",
      error: error.message
    });
  }
};
