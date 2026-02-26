/**
 * 華康字體資料庫 — 精選 20 款真實華康字體
 * 資料來源：DynaComware 官方網站 (dynacw.com.tw)
 *
 * 每款字體包含：
 * - name: 字體完整名稱
 * - description: 字體特性與適用情境描述
 */

export interface DynaFont {
  name: string;
  description: string;
}

export const dynaFonts: DynaFont[] = [
  {
    name: "華康金剛黑",
    description: "簡約俐落、理性冷靜、科技感強，散發專業與信任感",
  },
  {
    name: "華康青花黑",
    description: "溫潤細膩、優雅知性，黑體的俐落中帶有宋體般的文藝氣質",
  },
  {
    name: "華康UD黑",
    description: "清晰友善、無障礙導向，小字也看得清楚，傳達關懷與包容",
  },
  {
    name: "華康儷黑",
    description: "方正穩重、乾淨有力，台灣最經典的標題黑體，可靠且百搭",
  },
  {
    name: "華康儷宋",
    description: "典雅端莊、書卷氣濃厚，橫細豎粗的經典美感，正式而不冷漠",
  },
  {
    name: "華康明體",
    description: "端正規矩、沉穩內斂，最基礎的正式感，適合長時間閱讀",
  },
  {
    name: "華康玉刻仿宋",
    description: "古典文人氣息、秀麗脫俗，帶有玉石篆刻般的精緻質感",
  },
  {
    name: "華康楷書",
    description: "正統莊重、毛筆韻味、肅穆敬意，適合莊嚴隆重的場合",
  },
  {
    name: "華康行書",
    description: "流暢瀟灑、文人風雅，介於楷書與草書間的優美韻律感",
  },
  {
    name: "華康金蝶體",
    description: "清瘦內斂、詩意哲思，以詩人周夢蝶手跡為本，充滿文學溫度",
  },
  {
    name: "華康唐風隸",
    description: "寬扁厚重、古樸蒼勁，蠶頭燕尾帶有濃厚歷史感與東方氣韻",
  },
  {
    name: "華康少女文字",
    description: "圓潤甜美、少女情懷、活潑討喜，讓人忍不住微笑的暖心字體",
  },
  {
    name: "華康手札體",
    description: "自然不做作、生活感十足，像朋友隨手寫的便條般溫暖親切",
  },
  {
    name: "華康抖抖體",
    description: "微微顫抖的筆跡、搞怪逗趣，充滿玩心與驚喜的表情感字體",
  },
  {
    name: "華康POP",
    description: "粗獷飽滿、熱鬧吸睛，藥妝店和夜市最熟悉的手寫促銷風格",
  },
  {
    name: "華康相撲體",
    description: "極度粗壯、力量爆發、衝擊力十足，一秒抓住目光的霸氣存在",
  },
  {
    name: "華康新綜藝體",
    description: "圓潤醒目、歡樂熱鬧、充滿彈性感，台灣綜藝節目的經典字體",
  },
  {
    name: "華康勘亭流",
    description: "粗厚圓潤、東洋風情，源自歌舞伎招牌，象徵座無虛席的吉祥感",
  },
  {
    name: "華康歐風花體",
    description: "華麗曲線、優雅奢華，每個字如精雕藝術品般浪漫迷人",
  },
  {
    name: "華康圓體",
    description: "圓潤無稜角、溫暖柔軟、零距離感，最沒有壓力的親和力字體",
  },
];

/**
 * 將字體資料庫轉換為系統提示詞格式
 */
export function buildFontDatabasePrompt(): string {
  return dynaFonts
    .map((font) => `- ${font.name}：${font.description}`)
    .join("\n");
}
