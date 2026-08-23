/**
 * ดึงเนื้อหามาตราจริงจากฐานข้อมูล codex ของ coolunclelab.com (ประมวล.com)
 * ไฟล์ codex-data.json (~9MB, มี Access-Control-Allow-Origin: *) เป็นแหล่งข้อมูลกลาง
 * เดียวกับที่ codex-search.html บน coolunclelab.com ใช้ค้นหามาตรา
 */

export type CodexArticleMeta = {
  phaak?: string | null;
  phaakTitle?: string | null;
  laksana?: string | null;
  laksanaTitle?: string | null;
  muad?: string | null;
  muadTitle?: string | null;
  suan?: string | null;
  suanTitle?: string | null;
};

export type CodexLectureNote = { id: string; topic: string; text: string };

export type CodexArticle = {
  id: string;
  number: string;
  text: string;
  cancelled?: boolean;
  meta?: CodexArticleMeta;
  keywords?: string[];
  lectureNotes?: CodexLectureNote[];
};

type CodexBook = { title?: string; articles: Record<string, CodexArticle> };
type CodexData = {
  metadata: { version: string; totalArticles: number; books: string[] };
  books: Record<string, CodexBook>;
};

export const CODEX_DATA_URL = "https://coolunclelab.com/codex-data.json";

export const CODEX_BOOK_LABELS: Record<string, string> = {
  civil: "ประมวลกฎหมายแพ่งและพาณิชย์",
  criminal: "ประมวลกฎหมายอาญา",
  civpro: "ประมวลกฎหมายวิธีพิจารณาความแพ่ง",
  crimpro: "ประมวลกฎหมายวิธีพิจารณาความอาญา",
  constitution: "รัฐธรรมนูญ",
  adminproc: "พ.ร.บ. วิธีปฏิบัติราชการทางปกครอง",
  admincourt: "พ.ร.บ. จัดตั้งศาลปกครอง",
  const2560: "รัฐธรรมนูญ 2560",
  tortofficials: "พ.ร.บ. ความรับผิดทางละเมิดของเจ้าหน้าที่",
  copyright: "พ.ร.บ. ลิขสิทธิ์",
  patent: "พ.ร.บ. สิทธิบัตร",
  trademark: "พ.ร.บ. เครื่องหมายการค้า",
  carriage: "กฎหมายการขนส่ง",
  ipcourt: "พ.ร.บ. จัดตั้งศาลทรัพย์สินทางปัญญา",
  politicalparty: "พ.ร.บ. พรรคการเมือง",
};

let codexPromise: Promise<CodexData> | null = null;

function loadCodexData(): Promise<CodexData> {
  if (!codexPromise) {
    codexPromise = fetch(CODEX_DATA_URL, { mode: "cors" })
      .then((response) => {
        if (!response.ok) throw new Error(`codex-data.json ตอบกลับ ${response.status}`);
        return response.json() as Promise<CodexData>;
      })
      .catch((error) => {
        codexPromise = null;
        throw error;
      });
  }
  return codexPromise;
}

export async function fetchCodexArticle(book: string, number: string): Promise<CodexArticle | null> {
  const data = await loadCodexData();
  return data.books[book]?.articles?.[number] ?? null;
}

export function codexSearchUrl(book: string, number: string) {
  return `https://coolunclelab.com/codex-search.html?book=${encodeURIComponent(book)}#article-${encodeURIComponent(number)}`;
}
