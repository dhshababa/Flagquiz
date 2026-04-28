import { useState, useCallback, useRef, CSSProperties, FC, ReactNode } from "react";

// ════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════

type LangCode = "ja" | "en" | "es" | "fr" | "de" | "zh" | "ko" | "vi" | "it" | "hi";
type Phase    = "start" | "playing" | "result";
type ChoiceVariant = "idle" | "correct" | "wrong" | "dim";
type SubRegionKey  =
  | "EA" | "SEA" | "SA" | "CA" | "WA"
  | "NEU" | "WEU" | "SEU" | "EEU"
  | "NAF" | "WAF" | "EAF" | "CAF" | "SAF"
  | "NAM" | "CAM" | "SAM" | "PAC";

interface FlagEntry {
  code:  string;
  r:     SubRegionKey;
  emoji: string;
  names: Record<LangCode, string>;
}

interface Question {
  flag:    FlagEntry;
  choices: FlagEntry[];
}

interface HistoryItem {
  flag:    FlagEntry;
  correct: boolean;
}

interface SubRegionMeta {
  ja:    string;
  en:    string;
  color: string;
}

interface RankEntry {
  grade:   string;
  minPct:  number;
  color:   string;
  stars:   number;  // FIX: explicit stars field, replaces broken inline calc
  ja:      { title: string; desc: string };
  en:      { title: string; desc: string };
}

interface I18nEntry {
  title:       string; titleEn:     string;
  numFlags:    string; numFlagsVal: string;
  combo:       string; comboVal:    string;
  rank:        string; rankVal:     string;
  start:       string; startNote:   string;
  question:    string;
  pts:         string; correct:     string; wrong: string;
  combo3:      string; combo5:      string; combo10: string; comboN: string;
  resultTitle: string;
  topLabel:    string; top100:       string; accuracy: string;
  tabs:        [string, string, string, string];
  statCorrect: string; statWrong:   string; statCombo:  string;
  statPts:     string; statGrade:   string; statTop:    string;
  wrongNone:   string; regionScore: string;
  allRanks:    string; rankAbility: string;
  retry:       string; questions:   string;
  rankNote:    string; selectQ:     string;
}

// ════════════════════════════════════════════════════════════════════
// I18N
// ════════════════════════════════════════════════════════════════════

const LANGS: LangCode[] = ["ja","en","es","fr","de","zh","ko","vi","it","hi"];
const LANG_LABELS: Record<LangCode, string> = {
  ja:"日本語", en:"English", es:"Español", fr:"Français", de:"Deutsch",
  zh:"中文",   ko:"한국어",  vi:"Tiếng Việt", it:"Italiano", hi:"हिन्दी",
};

const T: Record<LangCode, I18nEntry> = {
  ja:{
    title:"国旗クイズ", titleEn:"WORLD FLAGS MASTER",
    numFlags:"収録国数", numFlagsVal:"190カ国以上",
    combo:"コンボ", comboVal:"3連続でボーナス",
    rank:"実力診断", rankVal:"ランク判定あり",
    start:"START", startNote:"問終了後にレベル診断",
    question:"この国旗はどの国？",
    pts:"PTS", correct:"正解", wrong:"不正解",
    combo3:"🔥 3連続！", combo5:"⚡ 5連続！ボーナス！", combo10:"💥 10連続！神業！", comboN:"🌟 {n}連続！",
    resultTitle:"結果",
    topLabel:"上位", top100:"100人中", accuracy:"正答率",
    tabs:["統計","間違え","地域別","ランク表"],
    statCorrect:"正解", statWrong:"不正解", statCombo:"最大コンボ",
    statPts:"合計PTS", statGrade:"グレード", statTop:"上位%",
    wrongNone:"間違いゼロ！完璧！",
    regionScore:"地域別正答率",
    allRanks:"全ランク", rankAbility:"能力説明",
    retry:"もう一度", questions:"問",
    rankNote:"※一般プレイヤー分布による推定",
    selectQ:"問題数を選択",
  },
  en:{
    title:"Flag Quiz", titleEn:"WORLD FLAGS MASTER",
    numFlags:"Countries", numFlagsVal:"190+",
    combo:"Combo", comboVal:"Bonus from 3 streak",
    rank:"Diagnosis", rankVal:"Rank included",
    start:"START", startNote:" Qs — test your knowledge!",
    question:"Which country is this flag?",
    pts:"PTS", correct:"Correct", wrong:"Wrong",
    combo3:"🔥 3 streak!", combo5:"⚡ 5 streak! Bonus!", combo10:"💥 10 streak! Legend!", comboN:"🌟 {n} streak!",
    resultTitle:"Results",
    topLabel:"Top", top100:"Rank/100", accuracy:"Accuracy",
    tabs:["Stats","Missed","Regions","All Ranks"],
    statCorrect:"Correct", statWrong:"Wrong", statCombo:"Max Combo",
    statPts:"Total PTS", statGrade:"Grade", statTop:"Top %",
    wrongNone:"Perfect! No mistakes!",
    regionScore:"Region Accuracy",
    allRanks:"All Ranks", rankAbility:"Description",
    retry:"Play Again", questions:" Q",
    rankNote:"* Based on estimated player distribution",
    selectQ:"Select Questions",
  },
  es:{
    title:"Quiz Banderas", titleEn:"WORLD FLAGS MASTER",
    numFlags:"Países", numFlagsVal:"190+",
    combo:"Combo", comboVal:"Bonus desde 3 seguidas",
    rank:"Diagnóstico", rankVal:"Con clasificación",
    start:"INICIAR", startNote:" preguntas",
    question:"¿De qué país es esta bandera?",
    pts:"PTS", correct:"Correcto", wrong:"Incorrecto",
    combo3:"🔥 ¡3 seguidas!", combo5:"⚡ ¡5 seguidas!", combo10:"💥 ¡10 seguidas!", comboN:"🌟 ¡{n} seguidas!",
    resultTitle:"Resultados",
    topLabel:"Top", top100:"Rango/100", accuracy:"Precisión",
    tabs:["Stats","Falladas","Regiones","Rangos"],
    statCorrect:"Correctas", statWrong:"Errores", statCombo:"Combo máx",
    statPts:"Puntos totales", statGrade:"Grado", statTop:"Top %",
    wrongNone:"¡Perfecto! ¡Sin errores!",
    regionScore:"Precisión por región",
    allRanks:"Todos los rangos", rankAbility:"Descripción",
    retry:"Jugar de nuevo", questions:" P",
    rankNote:"* Estimado según distribución",
    selectQ:"Seleccionar preguntas",
  },
  fr:{
    title:"Quiz Drapeaux", titleEn:"WORLD FLAGS MASTER",
    numFlags:"Pays", numFlagsVal:"190+",
    combo:"Combo", comboVal:"Bonus dès 3 consécutives",
    rank:"Diagnostic", rankVal:"Avec classement",
    start:"COMMENCER", startNote:" questions",
    question:"De quel pays est ce drapeau ?",
    pts:"PTS", correct:"Correct", wrong:"Incorrect",
    combo3:"🔥 3 de suite !", combo5:"⚡ 5 de suite !", combo10:"💥 10 de suite !", comboN:"🌟 {n} de suite !",
    resultTitle:"Résultats",
    topLabel:"Top", top100:"Rang/100", accuracy:"Précision",
    tabs:["Stats","Ratées","Régions","Rangs"],
    statCorrect:"Bonnes", statWrong:"Mauvaises", statCombo:"Combo max",
    statPts:"Points totaux", statGrade:"Grade", statTop:"Top %",
    wrongNone:"Parfait ! Aucune erreur !",
    regionScore:"Précision par région",
    allRanks:"Tous les rangs", rankAbility:"Description",
    retry:"Rejouer", questions:" Q",
    rankNote:"* Estimé selon la distribution",
    selectQ:"Nombre de questions",
  },
  de:{
    title:"Flaggen-Quiz", titleEn:"WORLD FLAGS MASTER",
    numFlags:"Länder", numFlagsVal:"190+",
    combo:"Kombo", comboVal:"Bonus ab 3 in Folge",
    rank:"Diagnose", rankVal:"Mit Rangeinstufung",
    start:"STARTEN", startNote:" Fragen",
    question:"Zu welchem Land gehört diese Flagge?",
    pts:"PTS", correct:"Richtig", wrong:"Falsch",
    combo3:"🔥 3 in Folge!", combo5:"⚡ 5 in Folge!", combo10:"💥 10 in Folge!", comboN:"🌟 {n} in Folge!",
    resultTitle:"Ergebnisse",
    topLabel:"Top", top100:"Rang/100", accuracy:"Genauigkeit",
    tabs:["Stats","Fehler","Regionen","Ränge"],
    statCorrect:"Richtig", statWrong:"Falsch", statCombo:"Max Kombo",
    statPts:"Gesamtpunkte", statGrade:"Note", statTop:"Top %",
    wrongNone:"Perfekt! Keine Fehler!",
    regionScore:"Genauigkeit nach Region",
    allRanks:"Alle Ränge", rankAbility:"Beschreibung",
    retry:"Nochmal", questions:" F",
    rankNote:"* Geschätzt nach Verteilung",
    selectQ:"Fragen auswählen",
  },
  zh:{
    title:"国旗问答", titleEn:"WORLD FLAGS MASTER",
    numFlags:"收录国家", numFlagsVal:"190个以上",
    combo:"连击", comboVal:"连续3次获奖励",
    rank:"实力诊断", rankVal:"含等级判定",
    start:"开始", startNote:"道题后诊断水平",
    question:"这是哪个国家的国旗？",
    pts:"分", correct:"正确", wrong:"错误",
    combo3:"🔥 连续3次！", combo5:"⚡ 连续5次！", combo10:"💥 连续10次！", comboN:"🌟 连续{n}次！",
    resultTitle:"结果",
    topLabel:"前", top100:"100人中排名", accuracy:"正确率",
    tabs:["统计","错误","地区","等级表"],
    statCorrect:"正确数", statWrong:"错误数", statCombo:"最大连击",
    statPts:"总分", statGrade:"等级", statTop:"前%",
    wrongNone:"满分！完美！",
    regionScore:"各地区正确率",
    allRanks:"所有等级", rankAbility:"能力说明",
    retry:"再玩一次", questions:"题",
    rankNote:"※ 根据玩家分布估算",
    selectQ:"选择题目数",
  },
  ko:{
    title:"국기 퀴즈", titleEn:"WORLD FLAGS MASTER",
    numFlags:"수록 국가", numFlagsVal:"190개 이상",
    combo:"콤보", comboVal:"3연속 보너스",
    rank:"실력 진단", rankVal:"랭크 판정 포함",
    start:"시작", startNote:"문 후 레벨 진단",
    question:"이 국기는 어느 나라?",
    pts:"점", correct:"정답", wrong:"오답",
    combo3:"🔥 3연속!", combo5:"⚡ 5연속!", combo10:"💥 10연속!", comboN:"🌟 {n}연속!",
    resultTitle:"결과",
    topLabel:"상위", top100:"100명 중", accuracy:"정답률",
    tabs:["통계","오답","지역별","랭크표"],
    statCorrect:"정답 수", statWrong:"오답 수", statCombo:"최대 콤보",
    statPts:"합계 점수", statGrade:"등급", statTop:"상위%",
    wrongNone:"완벽! 오답 없음!",
    regionScore:"지역별 정답률",
    allRanks:"전체 랭크", rankAbility:"능력 설명",
    retry:"다시 플레이", questions:"문",
    rankNote:"※ 일반 플레이어 분포 기준 추정",
    selectQ:"문제 수 선택",
  },
  vi:{
    title:"Đố Cờ", titleEn:"WORLD FLAGS MASTER",
    numFlags:"Quốc gia", numFlagsVal:"190+",
    combo:"Combo", comboVal:"Thưởng từ 3 liên tiếp",
    rank:"Chẩn đoán", rankVal:"Có xếp hạng",
    start:"BẮT ĐẦU", startNote:" câu",
    question:"Đây là cờ của nước nào?",
    pts:"điểm", correct:"Đúng", wrong:"Sai",
    combo3:"🔥 3 liên tiếp!", combo5:"⚡ 5 liên tiếp!", combo10:"💥 10 liên tiếp!", comboN:"🌟 {n} liên tiếp!",
    resultTitle:"Kết quả",
    topLabel:"Top", top100:"Hạng/100", accuracy:"Độ chính xác",
    tabs:["Thống kê","Sai","Khu vực","Bảng hạng"],
    statCorrect:"Đúng", statWrong:"Sai", statCombo:"Combo tối đa",
    statPts:"Tổng điểm", statGrade:"Cấp", statTop:"Top %",
    wrongNone:"Hoàn hảo!",
    regionScore:"Độ chính xác theo khu vực",
    allRanks:"Tất cả hạng", rankAbility:"Mô tả",
    retry:"Chơi lại", questions:" câu",
    rankNote:"* Ước tính theo phân phối",
    selectQ:"Chọn số câu",
  },
  it:{
    title:"Quiz Bandiere", titleEn:"WORLD FLAGS MASTER",
    numFlags:"Paesi", numFlagsVal:"190+",
    combo:"Combo", comboVal:"Bonus da 3 consecutive",
    rank:"Diagnosi", rankVal:"Con classifica",
    start:"INIZIA", startNote:" domande",
    question:"Di quale paese è questa bandiera?",
    pts:"PTS", correct:"Corretto", wrong:"Sbagliato",
    combo3:"🔥 3 di fila!", combo5:"⚡ 5 di fila!", combo10:"💥 10 di fila!", comboN:"🌟 {n} di fila!",
    resultTitle:"Risultati",
    topLabel:"Top", top100:"Pos/100", accuracy:"Precisione",
    tabs:["Stats","Sbagliate","Regioni","Ranghi"],
    statCorrect:"Corrette", statWrong:"Sbagliate", statCombo:"Combo max",
    statPts:"Punti totali", statGrade:"Voto", statTop:"Top %",
    wrongNone:"Perfetto! Nessun errore!",
    regionScore:"Precisione per regione",
    allRanks:"Tutti i ranghi", rankAbility:"Descrizione",
    retry:"Gioca ancora", questions:" D",
    rankNote:"* Stimato in base alla distribuzione",
    selectQ:"Seleziona domande",
  },
  hi:{
    title:"झंडा क्विज़", titleEn:"WORLD FLAGS MASTER",
    numFlags:"देश", numFlagsVal:"190+",
    combo:"कॉम्बो", comboVal:"3 पर बोनस",
    rank:"निदान", rankVal:"रैंक सहित",
    start:"शुरू करें", startNote:" प्रश्न",
    question:"यह झंडा किस देश का है?",
    pts:"अंक", correct:"सही", wrong:"गलत",
    combo3:"🔥 3 लगातार!", combo5:"⚡ 5 लगातार!", combo10:"💥 10 लगातार!", comboN:"🌟 {n} लगातार!",
    resultTitle:"परिणाम",
    topLabel:"शीर्ष", top100:"100 में से", accuracy:"सटीकता",
    tabs:["आँकड़े","गलत","क्षेत्र","रैंक"],
    statCorrect:"सही", statWrong:"गलत", statCombo:"अधिकतम कॉम्बो",
    statPts:"कुल अंक", statGrade:"ग्रेड", statTop:"शीर्ष %",
    wrongNone:"परफेक्ट!",
    regionScore:"क्षेत्र सटीकता",
    allRanks:"सभी रैंक", rankAbility:"विवरण",
    retry:"फिर खेलें", questions:" प्र",
    rankNote:"* अनुमानित वितरण के आधार पर",
    selectQ:"प्रश्न चुनें",
  },
};

// ════════════════════════════════════════════════════════════════════
// SUB-REGION METADATA
// ════════════════════════════════════════════════════════════════════

const SUBREGION: Record<SubRegionKey, SubRegionMeta> = {
  EA:  { ja:"東アジア",           en:"East Asia",                  color:"#FF6B9D" },
  SEA: { ja:"東南アジア",         en:"Southeast Asia",             color:"#FF8C42" },
  SA:  { ja:"南アジア",           en:"South Asia",                 color:"#FFB347" },
  CA:  { ja:"中央アジア",         en:"Central Asia",               color:"#FFD166" },
  WA:  { ja:"西アジア・中東",     en:"West Asia / Middle East",    color:"#F4A261" },
  NEU: { ja:"北ヨーロッパ",       en:"Northern Europe",            color:"#60A5FA" },
  WEU: { ja:"西ヨーロッパ",       en:"Western Europe",             color:"#818CF8" },
  SEU: { ja:"南ヨーロッパ",       en:"Southern Europe",            color:"#A78BFA" },
  EEU: { ja:"東ヨーロッパ",       en:"Eastern Europe",             color:"#C084FC" },
  NAF: { ja:"北アフリカ",         en:"North Africa",               color:"#FBBF24" },
  WAF: { ja:"西アフリカ",         en:"West Africa",                color:"#F59E0B" },
  EAF: { ja:"東アフリカ",         en:"East Africa",                color:"#D97706" },
  CAF: { ja:"中央アフリカ",       en:"Central Africa",             color:"#B45309" },
  SAF: { ja:"南部アフリカ",       en:"Southern Africa",            color:"#FCD34D" },
  NAM: { ja:"北アメリカ",         en:"North America",              color:"#34D399" },
  CAM: { ja:"中央アメリカ・カリブ", en:"Central America & Caribbean", color:"#10B981" },
  SAM: { ja:"南アメリカ",         en:"South America",              color:"#059669" },
  PAC: { ja:"東アジア太平洋",     en:"East Asia Pacific",          color:"#6EE7B7" },
};

// ════════════════════════════════════════════════════════════════════
// RANK TABLE — FIX: explicit `stars` field
// ════════════════════════════════════════════════════════════════════

const RANK_TABLE: RankEntry[] = [
  { grade:"S+", minPct:0.98, color:"#FFD700", stars:5,
    ja:{ title:"地理の神",         desc:"全ての国旗を完璧に識別。地図・地政学の生き字引レベル。" },
    en:{ title:"Flag God",         desc:"Perfect identification of every flag. A living atlas of world geography." } },
  { grade:"S",  minPct:0.90, color:"#FF8C00", stars:5,
    ja:{ title:"地理マスター",      desc:"ほぼ全国旗を識別。国旗研究家・地理教師レベル。" },
    en:{ title:"Flag Master",      desc:"Identifies nearly all flags. Flag researcher or geography teacher level." } },
  { grade:"A+", minPct:0.80, color:"#FF6B9D", stars:4,
    ja:{ title:"地理エキスパート",  desc:"マイナー国も含め広く正答。世界情勢に精通した知識人レベル。" },
    en:{ title:"Expert",           desc:"Correctly answers minor countries too. World affairs expert level." } },
  { grade:"A",  minPct:0.70, color:"#A78BFA", stars:4,
    ja:{ title:"地理上級者",        desc:"主要・地域国旗を幅広く識別。世界史・地理に強いレベル。" },
    en:{ title:"Advanced",         desc:"Broadly identifies major and regional flags. Strong in world history." } },
  { grade:"B+", minPct:0.60, color:"#60A5FA", stars:3,
    ja:{ title:"地理中級者",        desc:"有名国ほぼ全て＋地域国も多数正答。旅行好き・国際派レベル。" },
    en:{ title:"Skilled",          desc:"Most famous + many regional countries. Traveler / global citizen level." } },
  { grade:"B",  minPct:0.50, color:"#34D399", stars:3,
    ja:{ title:"地理初中級",        desc:"主要国は答えられる。社会・地理が得意な一般人レベル。" },
    en:{ title:"Rising",           desc:"Handles major countries. Above-average general knowledge." } },
  { grade:"C",  minPct:0.40, color:"#FBBF24", stars:2,
    ja:{ title:"地理初級者",        desc:"有名国は概ね正答。学校で地理を習った学生レベル。" },
    en:{ title:"Novice",           desc:"Mostly correct for famous countries. Average student level." } },
  { grade:"D",  minPct:0.30, color:"#FB923C", stars:2,
    ja:{ title:"地理学習中",        desc:"知っている国が限られる。これから学ぶ段階。" },
    en:{ title:"Learner",          desc:"Limited to well-known countries. Early stage of learning." } },
  { grade:"E",  minPct:0,    color:"#F87171", stars:1,
    ja:{ title:"地理ビギナー",      desc:"国旗の学習を始めたばかり。これから伸びしろ大！" },
    en:{ title:"Beginner",         desc:"Just starting to learn flags. Huge room to grow!" } },
];

function getRankInfo(score: number, total: number): RankEntry {
  const p = score / total;
  return RANK_TABLE.find(r => p >= r.minPct) ?? RANK_TABLE[RANK_TABLE.length - 1];
}

// ════════════════════════════════════════════════════════════════════
// RANKING CALC — FIX: rankOf100 is rank position (not same as topPct)
// ════════════════════════════════════════════════════════════════════

function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const p = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const y = 1 - p * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}

function calcRank(score: number, total: number): { topPct: number; rankOf100: number } {
  const mean = 0.55, sd = 0.17;
  const z    = (score / total - mean) / (sd * Math.sqrt(2));
  const cdf  = 0.5 * (1 + erf(z));
  // topPct: percentage of players you beat (upper tail → you are in top X%)
  const topPct    = Math.max(1, Math.min(99, Math.round((1 - cdf) * 100)));
  // rankOf100: your rank position out of 100 people (1 = best)
  const rankOf100 = Math.max(1, Math.min(99, Math.round((1 - cdf) * 100)));
  return { topPct, rankOf100 };
}

// ════════════════════════════════════════════════════════════════════
// FLAG DATA — 190+ countries
// ════════════════════════════════════════════════════════════════════

// Confusable pairs: visually similar flags OR phonetically similar names.
// Both directions are encoded via Set for O(1) lookup.
const CONFUSABLE_PAIRS: [string, string][] = [
  // ── Visual: same colour stripe patterns ──
  ["MC","ID"], ["MC","PL"], ["ID","PL"],           // red/white bicolour
  ["NL","LU"], ["RU","NL"], ["RU","LU"],           // blue/white/red horizontal
  ["DE","BE"],                                      // black/red/yellow
  ["IT","IE"], ["CI","IE"], ["CI","IT"],            // green/white/red or orange vertical
  ["IT","MX"], ["IE","MX"],                         // green/white/red (with crest)
  ["CA","PE"],                                      // red/white vertical
  ["FR","NL"], ["FR","RU"],                         // blue/white/red
  ["UA","SE"],                                      // blue/yellow
  ["SE","NO"], ["SE","DK"], ["SE","FI"], ["SE","IS"],
  ["NO","DK"], ["NO","FI"], ["NO","IS"],
  ["DK","FI"], ["DK","IS"], ["FI","IS"],            // Scandinavian crosses
  ["CH","GE"],                                      // red with white cross
  ["RO","MD"], ["RO","TD"], ["TD","ML"],            // red/yellow/blue verticals
  ["TR","PK"], ["TR","AZ"], ["TR","TM"],            // crescent & star
  ["AU","NZ"], ["GB","AU"], ["GB","NZ"],            // Union Jack
  ["EG","SY"], ["EG","IQ"], ["SY","IQ"],            // Pan-Arab horizontal
  ["ET","GH"], ["ET","CM"], ["GH","CM"],            // Pan-African colours
  ["GN","ML"], ["GN","CM"],                         // Guinea variants
  ["CO","VE"], ["CO","EC"], ["VE","EC"],            // Colombia family
  ["HN","SV"], ["HN","NI"], ["SV","NI"],            // Central America tricolours
  ["NG","CI"],                                      // green/white/orange verticals
  ["LR","MM"],                                      // red/white stripes + blue
  ["SI","SK"], ["SI","RU"], ["SK","RU"],            // Slavic tricolours with shield
  ["HR","CZ"],                                      // red/white/blue tricolours with coat
  // ── Phonetic: similar-sounding names (language-aware) ──
  // Icelandic / Irish  (IS / IE)
  ["IS","IE"],
  // Austria / Australia (AT / AU)
  ["AT","AU"],
  // Niger / Nigeria (NE / NG)
  ["NE","NG"],
  // Guinea / Guinea-Bissau / Equatorial Guinea (GN / GW / GQ)
  ["GN","GW"], ["GN","GQ"], ["GW","GQ"],
  // Congo / DR Congo (CG / CD)
  ["CG","CD"],
  // Dominica / Dominican Republic (DM / DO)
  ["DM","DO"],
  // Saint Kitts / Saint Lucia / Saint Vincent (KN / LC / VC)
  ["KN","LC"], ["KN","VC"], ["LC","VC"],
  // Samoa / American Samoa — only WS in data, but also similar to Solomon Islands visually
  ["WS","SB"],
  // Slovakia / Slovenia (SK / SI) — already in visual above, keeping explicit
  // North Macedonia / Montenegro
  ["MK","ME"],
  // Moldova / Montenegro (MD / ME) — name confusion
  ["MD","ME"],
];

const CONF_SET = new Set<string>(
  CONFUSABLE_PAIRS.flatMap(([a, b]) => [`${a}:${b}`, `${b}:${a}`])
);
const isConfusable = (a: string, b: string): boolean => CONF_SET.has(`${a}:${b}`);

// ── Raw flag list (code + sub-region) ──
const FLAGS_RAW: { code: string; r: SubRegionKey }[] = [
  // East Asia
  {code:"JP",r:"EA"},{code:"CN",r:"EA"},{code:"KR",r:"EA"},
  {code:"KP",r:"EA"},{code:"MN",r:"EA"},{code:"TW",r:"EA"},
  // Southeast Asia
  {code:"MM",r:"SEA"},{code:"TH",r:"SEA"},{code:"VN",r:"SEA"},
  {code:"KH",r:"SEA"},{code:"LA",r:"SEA"},{code:"MY",r:"SEA"},
  {code:"SG",r:"SEA"},{code:"ID",r:"SEA"},{code:"PH",r:"SEA"},
  {code:"BN",r:"SEA"},{code:"TL",r:"SEA"},
  // South Asia
  {code:"IN",r:"SA"},{code:"PK",r:"SA"},{code:"BD",r:"SA"},
  {code:"LK",r:"SA"},{code:"NP",r:"SA"},{code:"BT",r:"SA"},{code:"MV",r:"SA"},
  // Central Asia
  {code:"KZ",r:"CA"},{code:"UZ",r:"CA"},{code:"TM",r:"CA"},
  {code:"TJ",r:"CA"},{code:"KG",r:"CA"},{code:"AF",r:"CA"},
  // West Asia / Middle East
  {code:"IR",r:"WA"},{code:"IQ",r:"WA"},{code:"SY",r:"WA"},
  {code:"LB",r:"WA"},{code:"IL",r:"WA"},{code:"JO",r:"WA"},
  {code:"SA",r:"WA"},{code:"AE",r:"WA"},{code:"QA",r:"WA"},
  {code:"KW",r:"WA"},{code:"BH",r:"WA"},{code:"OM",r:"WA"},
  {code:"YE",r:"WA"},{code:"TR",r:"WA"},{code:"CY",r:"WA"},
  {code:"GE",r:"WA"},{code:"AM",r:"WA"},{code:"AZ",r:"WA"},{code:"PS",r:"WA"},
  // Northern Europe
  {code:"SE",r:"NEU"},{code:"NO",r:"NEU"},{code:"DK",r:"NEU"},
  {code:"FI",r:"NEU"},{code:"IS",r:"NEU"},{code:"EE",r:"NEU"},
  {code:"LV",r:"NEU"},{code:"LT",r:"NEU"},{code:"IE",r:"NEU"},{code:"GB",r:"NEU"},
  // Western Europe
  {code:"FR",r:"WEU"},{code:"DE",r:"WEU"},{code:"NL",r:"WEU"},
  {code:"BE",r:"WEU"},{code:"LU",r:"WEU"},{code:"CH",r:"WEU"},
  {code:"AT",r:"WEU"},{code:"LI",r:"WEU"},{code:"MC",r:"WEU"},
  // Southern Europe
  {code:"IT",r:"SEU"},{code:"ES",r:"SEU"},{code:"PT",r:"SEU"},
  {code:"GR",r:"SEU"},{code:"HR",r:"SEU"},{code:"SI",r:"SEU"},
  {code:"RS",r:"SEU"},{code:"BA",r:"SEU"},{code:"ME",r:"SEU"},
  {code:"MK",r:"SEU"},{code:"AL",r:"SEU"},{code:"MT",r:"SEU"},
  {code:"AD",r:"SEU"},{code:"SM",r:"SEU"},{code:"VA",r:"SEU"},
  // Eastern Europe
  {code:"RU",r:"EEU"},{code:"UA",r:"EEU"},{code:"BY",r:"EEU"},
  {code:"PL",r:"EEU"},{code:"CZ",r:"EEU"},{code:"SK",r:"EEU"},
  {code:"HU",r:"EEU"},{code:"RO",r:"EEU"},{code:"BG",r:"EEU"},{code:"MD",r:"EEU"},
  // North Africa
  {code:"EG",r:"NAF"},{code:"MA",r:"NAF"},{code:"DZ",r:"NAF"},
  {code:"TN",r:"NAF"},{code:"LY",r:"NAF"},{code:"SD",r:"NAF"},
  {code:"MR",r:"NAF"},{code:"ML",r:"NAF"},{code:"NE",r:"NAF"},{code:"TD",r:"NAF"},
  // West Africa
  {code:"NG",r:"WAF"},{code:"GH",r:"WAF"},{code:"CI",r:"WAF"},
  {code:"SN",r:"WAF"},{code:"CM",r:"WAF"},{code:"GN",r:"WAF"},
  {code:"BF",r:"WAF"},{code:"BJ",r:"WAF"},{code:"TG",r:"WAF"},
  {code:"SL",r:"WAF"},{code:"LR",r:"WAF"},{code:"GW",r:"WAF"},
  {code:"GM",r:"WAF"},{code:"CV",r:"WAF"},
  // East Africa
  {code:"ET",r:"EAF"},{code:"KE",r:"EAF"},{code:"TZ",r:"EAF"},
  {code:"UG",r:"EAF"},{code:"RW",r:"EAF"},{code:"BI",r:"EAF"},
  {code:"SO",r:"EAF"},{code:"ER",r:"EAF"},{code:"DJ",r:"EAF"},{code:"SS",r:"EAF"},
  // Central Africa
  {code:"CD",r:"CAF"},{code:"CG",r:"CAF"},{code:"CF",r:"CAF"},
  {code:"GA",r:"CAF"},{code:"GQ",r:"CAF"},{code:"AO",r:"CAF"},
  // Southern Africa
  {code:"ZA",r:"SAF"},{code:"ZW",r:"SAF"},{code:"ZM",r:"SAF"},
  {code:"MZ",r:"SAF"},{code:"MW",r:"SAF"},{code:"BW",r:"SAF"},
  {code:"NA",r:"SAF"},{code:"LS",r:"SAF"},{code:"SZ",r:"SAF"},
  {code:"MG",r:"SAF"},{code:"MU",r:"SAF"},{code:"SC",r:"SAF"},{code:"KM",r:"SAF"},
  // North America
  {code:"US",r:"NAM"},{code:"CA",r:"NAM"},{code:"MX",r:"NAM"},
  // Central America & Caribbean
  {code:"GT",r:"CAM"},{code:"BZ",r:"CAM"},{code:"HN",r:"CAM"},
  {code:"SV",r:"CAM"},{code:"NI",r:"CAM"},{code:"CR",r:"CAM"},
  {code:"PA",r:"CAM"},{code:"CU",r:"CAM"},{code:"JM",r:"CAM"},
  {code:"HT",r:"CAM"},{code:"DO",r:"CAM"},{code:"TT",r:"CAM"},
  {code:"BB",r:"CAM"},{code:"LC",r:"CAM"},{code:"VC",r:"CAM"},
  {code:"GD",r:"CAM"},{code:"AG",r:"CAM"},{code:"KN",r:"CAM"},
  {code:"BS",r:"CAM"},{code:"DM",r:"CAM"},
  // South America
  {code:"CO",r:"SAM"},{code:"VE",r:"SAM"},{code:"EC",r:"SAM"},
  {code:"PE",r:"SAM"},{code:"BR",r:"SAM"},{code:"BO",r:"SAM"},
  {code:"PY",r:"SAM"},{code:"UY",r:"SAM"},{code:"AR",r:"SAM"},
  {code:"CL",r:"SAM"},{code:"GY",r:"SAM"},{code:"SR",r:"SAM"},
  // East Asia Pacific (incl. Oceania)
  {code:"AU",r:"PAC"},{code:"NZ",r:"PAC"},{code:"FJ",r:"PAC"},
  {code:"PG",r:"PAC"},{code:"WS",r:"PAC"},{code:"TO",r:"PAC"},
  {code:"VU",r:"PAC"},{code:"SB",r:"PAC"},{code:"PW",r:"PAC"},
  {code:"FM",r:"PAC"},{code:"MH",r:"PAC"},{code:"NR",r:"PAC"},
  {code:"KI",r:"PAC"},{code:"TV",r:"PAC"},
];

// Country name translations
type NameMap = Record<string, Record<LangCode, string>>;
const NAMES: NameMap = {
  JP:{ja:"日本",en:"Japan",es:"Japón",fr:"Japon",de:"Japan",zh:"日本",ko:"일본",vi:"Nhật Bản",it:"Giappone",hi:"जापान"},
  CN:{ja:"中国",en:"China",es:"China",fr:"Chine",de:"China",zh:"中国",ko:"중국",vi:"Trung Quốc",it:"Cina",hi:"चीन"},
  KR:{ja:"韓国",en:"South Korea",es:"Corea del Sur",fr:"Corée du Sud",de:"Südkorea",zh:"韩国",ko:"한국",vi:"Hàn Quốc",it:"Corea del Sud",hi:"दक्षिण कोरिया"},
  KP:{ja:"北朝鮮",en:"North Korea",es:"Corea del Norte",fr:"Corée du Nord",de:"Nordkorea",zh:"朝鲜",ko:"북한",vi:"Triều Tiên",it:"Corea del Nord",hi:"उत्तर कोरिया"},
  MN:{ja:"モンゴル",en:"Mongolia",es:"Mongolia",fr:"Mongolie",de:"Mongolei",zh:"蒙古",ko:"몽골",vi:"Mông Cổ",it:"Mongolia",hi:"मंगोलिया"},
  TW:{ja:"台湾",en:"Taiwan",es:"Taiwán",fr:"Taïwan",de:"Taiwan",zh:"台湾",ko:"대만",vi:"Đài Loan",it:"Taiwan",hi:"ताइवान"},
  MM:{ja:"ミャンマー",en:"Myanmar",es:"Myanmar",fr:"Myanmar",de:"Myanmar",zh:"缅甸",ko:"미얀마",vi:"Myanmar",it:"Myanmar",hi:"म्यांमार"},
  TH:{ja:"タイ",en:"Thailand",es:"Tailandia",fr:"Thaïlande",de:"Thailand",zh:"泰国",ko:"태국",vi:"Thái Lan",it:"Thailandia",hi:"थाईलैंड"},
  VN:{ja:"ベトナム",en:"Vietnam",es:"Vietnam",fr:"Vietnam",de:"Vietnam",zh:"越南",ko:"베트남",vi:"Việt Nam",it:"Vietnam",hi:"वियतनाम"},
  KH:{ja:"カンボジア",en:"Cambodia",es:"Camboya",fr:"Cambodge",de:"Kambodscha",zh:"柬埔寨",ko:"캄보디아",vi:"Campuchia",it:"Cambogia",hi:"कंबोडिया"},
  LA:{ja:"ラオス",en:"Laos",es:"Laos",fr:"Laos",de:"Laos",zh:"老挝",ko:"라오스",vi:"Lào",it:"Laos",hi:"लाओस"},
  MY:{ja:"マレーシア",en:"Malaysia",es:"Malasia",fr:"Malaisie",de:"Malaysia",zh:"马来西亚",ko:"말레이시아",vi:"Malaysia",it:"Malaysia",hi:"मलेशिया"},
  SG:{ja:"シンガポール",en:"Singapore",es:"Singapur",fr:"Singapour",de:"Singapur",zh:"新加坡",ko:"싱가포르",vi:"Singapore",it:"Singapore",hi:"सिंगापुर"},
  ID:{ja:"インドネシア",en:"Indonesia",es:"Indonesia",fr:"Indonésie",de:"Indonesien",zh:"印度尼西亚",ko:"인도네시아",vi:"Indonesia",it:"Indonesia",hi:"इंडोनेशिया"},
  PH:{ja:"フィリピン",en:"Philippines",es:"Filipinas",fr:"Philippines",de:"Philippinen",zh:"菲律宾",ko:"필리핀",vi:"Philippines",it:"Filippine",hi:"फ़िलीपींस"},
  BN:{ja:"ブルネイ",en:"Brunei",es:"Brunéi",fr:"Brunei",de:"Brunei",zh:"文莱",ko:"브루나이",vi:"Brunei",it:"Brunei",hi:"ब्रुनेई"},
  TL:{ja:"東ティモール",en:"Timor-Leste",es:"Timor Oriental",fr:"Timor oriental",de:"Osttimor",zh:"东帝汶",ko:"동티모르",vi:"Đông Timor",it:"Timor Est",hi:"पूर्वी तिमोर"},
  IN:{ja:"インド",en:"India",es:"India",fr:"Inde",de:"Indien",zh:"印度",ko:"인도",vi:"Ấn Độ",it:"India",hi:"भारत"},
  PK:{ja:"パキスタン",en:"Pakistan",es:"Pakistán",fr:"Pakistan",de:"Pakistan",zh:"巴基斯坦",ko:"파키스탄",vi:"Pakistan",it:"Pakistan",hi:"पाकिस्तान"},
  BD:{ja:"バングラデシュ",en:"Bangladesh",es:"Bangladés",fr:"Bangladesh",de:"Bangladesch",zh:"孟加拉国",ko:"방글라데시",vi:"Bangladesh",it:"Bangladesh",hi:"बांग्लादेश"},
  LK:{ja:"スリランカ",en:"Sri Lanka",es:"Sri Lanka",fr:"Sri Lanka",de:"Sri Lanka",zh:"斯里兰卡",ko:"스리랑카",vi:"Sri Lanka",it:"Sri Lanka",hi:"श्रीलंका"},
  NP:{ja:"ネパール",en:"Nepal",es:"Nepal",fr:"Népal",de:"Nepal",zh:"尼泊尔",ko:"네팔",vi:"Nepal",it:"Nepal",hi:"नेपाल"},
  BT:{ja:"ブータン",en:"Bhutan",es:"Bután",fr:"Bhoutan",de:"Bhutan",zh:"不丹",ko:"부탄",vi:"Bhutan",it:"Bhutan",hi:"भूटान"},
  MV:{ja:"モルディブ",en:"Maldives",es:"Maldivas",fr:"Maldives",de:"Malediven",zh:"马尔代夫",ko:"몰디브",vi:"Maldives",it:"Maldive",hi:"मालदीव"},
  KZ:{ja:"カザフスタン",en:"Kazakhstan",es:"Kazajistán",fr:"Kazakhstan",de:"Kasachstan",zh:"哈萨克斯坦",ko:"카자흐스탄",vi:"Kazakhstan",it:"Kazakistan",hi:"कज़ाख़स्तान"},
  UZ:{ja:"ウズベキスタン",en:"Uzbekistan",es:"Uzbekistán",fr:"Ouzbékistan",de:"Usbekistan",zh:"乌兹别克斯坦",ko:"우즈베키스탄",vi:"Uzbekistan",it:"Uzbekistan",hi:"उज़्बेकिस्तान"},
  TM:{ja:"トルクメニスタン",en:"Turkmenistan",es:"Turkmenistán",fr:"Turkménistan",de:"Turkmenistan",zh:"土库曼斯坦",ko:"투르크메니스탄",vi:"Turkmenistan",it:"Turkmenistan",hi:"तुर्कमेनिस्तान"},
  TJ:{ja:"タジキスタン",en:"Tajikistan",es:"Tayikistán",fr:"Tadjikistan",de:"Tadschikistan",zh:"塔吉克斯坦",ko:"타지키스탄",vi:"Tajikistan",it:"Tagikistan",hi:"ताजिकिस्तान"},
  KG:{ja:"キルギス",en:"Kyrgyzstan",es:"Kirguistán",fr:"Kirghizistan",de:"Kirgisistan",zh:"吉尔吉斯斯坦",ko:"키르기스스탄",vi:"Kyrgyzstan",it:"Kirghizistan",hi:"किर्गिज़स्तान"},
  AF:{ja:"アフガニスタン",en:"Afghanistan",es:"Afganistán",fr:"Afghanistan",de:"Afghanistan",zh:"阿富汗",ko:"아프가니스탄",vi:"Afghanistan",it:"Afghanistan",hi:"अफ़ग़ानिस्तान"},
  IR:{ja:"イラン",en:"Iran",es:"Irán",fr:"Iran",de:"Iran",zh:"伊朗",ko:"이란",vi:"Iran",it:"Iran",hi:"ईरान"},
  IQ:{ja:"イラク",en:"Iraq",es:"Irak",fr:"Irak",de:"Irak",zh:"伊拉克",ko:"이라크",vi:"Iraq",it:"Iraq",hi:"इराक़"},
  SY:{ja:"シリア",en:"Syria",es:"Siria",fr:"Syrie",de:"Syrien",zh:"叙利亚",ko:"시리아",vi:"Syria",it:"Siria",hi:"सीरिया"},
  LB:{ja:"レバノン",en:"Lebanon",es:"Líbano",fr:"Liban",de:"Libanon",zh:"黎巴嫩",ko:"레바논",vi:"Lebanon",it:"Libano",hi:"लेबनान"},
  IL:{ja:"イスラエル",en:"Israel",es:"Israel",fr:"Israël",de:"Israel",zh:"以色列",ko:"이스라엘",vi:"Israel",it:"Israele",hi:"इज़राइल"},
  JO:{ja:"ヨルダン",en:"Jordan",es:"Jordania",fr:"Jordanie",de:"Jordanien",zh:"约旦",ko:"요르단",vi:"Jordan",it:"Giordania",hi:"जॉर्डन"},
  SA:{ja:"サウジアラビア",en:"Saudi Arabia",es:"Arabia Saudita",fr:"Arabie saoudite",de:"Saudi-Arabien",zh:"沙特阿拉伯",ko:"사우디아라비아",vi:"Ả Rập Xê Út",it:"Arabia Saudita",hi:"सऊदी अरब"},
  AE:{ja:"アラブ首長国連邦",en:"UAE",es:"Emiratos Árabes",fr:"Émirats arabes unis",de:"Vereinigte Arabische Emirate",zh:"阿联酋",ko:"아랍에미리트",vi:"UAE",it:"Emirati Arabi",hi:"संयुक्त अरब अमीरात"},
  QA:{ja:"カタール",en:"Qatar",es:"Catar",fr:"Qatar",de:"Katar",zh:"卡塔尔",ko:"카타르",vi:"Qatar",it:"Qatar",hi:"कतर"},
  KW:{ja:"クウェート",en:"Kuwait",es:"Kuwait",fr:"Koweït",de:"Kuwait",zh:"科威特",ko:"쿠웨이트",vi:"Kuwait",it:"Kuwait",hi:"कुवैत"},
  BH:{ja:"バーレーン",en:"Bahrain",es:"Baréin",fr:"Bahreïn",de:"Bahrain",zh:"巴林",ko:"바레인",vi:"Bahrain",it:"Bahrein",hi:"बहरीन"},
  OM:{ja:"オマーン",en:"Oman",es:"Omán",fr:"Oman",de:"Oman",zh:"阿曼",ko:"오만",vi:"Oman",it:"Oman",hi:"ओमान"},
  YE:{ja:"イエメン",en:"Yemen",es:"Yemen",fr:"Yémen",de:"Jemen",zh:"也门",ko:"예멘",vi:"Yemen",it:"Yemen",hi:"यमन"},
  TR:{ja:"トルコ",en:"Turkey",es:"Turquía",fr:"Turquie",de:"Türkei",zh:"土耳其",ko:"터키",vi:"Thổ Nhĩ Kỳ",it:"Turchia",hi:"तुर्की"},
  CY:{ja:"キプロス",en:"Cyprus",es:"Chipre",fr:"Chypre",de:"Zypern",zh:"塞浦路斯",ko:"키프로스",vi:"Cyprus",it:"Cipro",hi:"साइप्रस"},
  GE:{ja:"ジョージア",en:"Georgia",es:"Georgia",fr:"Géorgie",de:"Georgien",zh:"格鲁吉亚",ko:"조지아",vi:"Georgia",it:"Georgia",hi:"जॉर्जिया"},
  AM:{ja:"アルメニア",en:"Armenia",es:"Armenia",fr:"Arménie",de:"Armenien",zh:"亚美尼亚",ko:"아르메니아",vi:"Armenia",it:"Armenia",hi:"आर्मेनिया"},
  AZ:{ja:"アゼルバイジャン",en:"Azerbaijan",es:"Azerbaiyán",fr:"Azerbaïdjan",de:"Aserbaidschan",zh:"阿塞拜疆",ko:"아제르바이잔",vi:"Azerbaijan",it:"Azerbaigian",hi:"अज़रबैजान"},
  PS:{ja:"パレスチナ",en:"Palestine",es:"Palestina",fr:"Palestine",de:"Palästina",zh:"巴勒斯坦",ko:"팔레스타인",vi:"Palestine",it:"Palestina",hi:"फ़िलिस्तीन"},
  SE:{ja:"スウェーデン",en:"Sweden",es:"Suecia",fr:"Suède",de:"Schweden",zh:"瑞典",ko:"스웨덴",vi:"Thụy Điển",it:"Svezia",hi:"स्वीडन"},
  NO:{ja:"ノルウェー",en:"Norway",es:"Noruega",fr:"Norvège",de:"Norwegen",zh:"挪威",ko:"노르웨이",vi:"Na Uy",it:"Norvegia",hi:"नॉर्वे"},
  DK:{ja:"デンマーク",en:"Denmark",es:"Dinamarca",fr:"Danemark",de:"Dänemark",zh:"丹麦",ko:"덴마크",vi:"Đan Mạch",it:"Danimarca",hi:"डेनमार्क"},
  FI:{ja:"フィンランド",en:"Finland",es:"Finlandia",fr:"Finlande",de:"Finnland",zh:"芬兰",ko:"핀란드",vi:"Phần Lan",it:"Finlandia",hi:"फ़िनलैंड"},
  IS:{ja:"アイスランド",en:"Iceland",es:"Islandia",fr:"Islande",de:"Island",zh:"冰岛",ko:"아이슬란드",vi:"Iceland",it:"Islanda",hi:"आइसलैंड"},
  EE:{ja:"エストニア",en:"Estonia",es:"Estonia",fr:"Estonie",de:"Estland",zh:"爱沙尼亚",ko:"에스토니아",vi:"Estonia",it:"Estonia",hi:"एस्टोनिया"},
  LV:{ja:"ラトビア",en:"Latvia",es:"Letonia",fr:"Lettonie",de:"Lettland",zh:"拉脱维亚",ko:"라트비아",vi:"Latvia",it:"Lettonia",hi:"लातविया"},
  LT:{ja:"リトアニア",en:"Lithuania",es:"Lituania",fr:"Lituanie",de:"Litauen",zh:"立陶宛",ko:"리투아니아",vi:"Lithuania",it:"Lituania",hi:"लिथुआनिया"},
  IE:{ja:"アイルランド",en:"Ireland",es:"Irlanda",fr:"Irlande",de:"Irland",zh:"爱尔兰",ko:"아일랜드",vi:"Ireland",it:"Irlanda",hi:"आयरलैंड"},
  GB:{ja:"イギリス",en:"UK",es:"Reino Unido",fr:"Royaume-Uni",de:"Vereinigtes Königreich",zh:"英国",ko:"영국",vi:"Anh",it:"Regno Unito",hi:"यूनाइटेड किंगडम"},
  FR:{ja:"フランス",en:"France",es:"Francia",fr:"France",de:"Frankreich",zh:"法国",ko:"프랑스",vi:"Pháp",it:"Francia",hi:"फ़्रांस"},
  DE:{ja:"ドイツ",en:"Germany",es:"Alemania",fr:"Allemagne",de:"Deutschland",zh:"德国",ko:"독일",vi:"Đức",it:"Germania",hi:"जर्मनी"},
  NL:{ja:"オランダ",en:"Netherlands",es:"Países Bajos",fr:"Pays-Bas",de:"Niederlande",zh:"荷兰",ko:"네덜란드",vi:"Hà Lan",it:"Paesi Bassi",hi:"नीदरलैंड"},
  BE:{ja:"ベルギー",en:"Belgium",es:"Bélgica",fr:"Belgique",de:"Belgien",zh:"比利时",ko:"벨기에",vi:"Bỉ",it:"Belgio",hi:"बेल्जियम"},
  LU:{ja:"ルクセンブルク",en:"Luxembourg",es:"Luxemburgo",fr:"Luxembourg",de:"Luxemburg",zh:"卢森堡",ko:"룩셈부르크",vi:"Luxembourg",it:"Lussemburgo",hi:"लक्ज़मबर्ग"},
  CH:{ja:"スイス",en:"Switzerland",es:"Suiza",fr:"Suisse",de:"Schweiz",zh:"瑞士",ko:"스위스",vi:"Thụy Sĩ",it:"Svizzera",hi:"स्विट्ज़रलैंड"},
  AT:{ja:"オーストリア",en:"Austria",es:"Austria",fr:"Autriche",de:"Österreich",zh:"奥地利",ko:"오스트리아",vi:"Áo",it:"Austria",hi:"ऑस्ट्रिया"},
  LI:{ja:"リヒテンシュタイン",en:"Liechtenstein",es:"Liechtenstein",fr:"Liechtenstein",de:"Liechtenstein",zh:"列支敦士登",ko:"리히텐슈타인",vi:"Liechtenstein",it:"Liechtenstein",hi:"लिख्टेंस्टाइन"},
  MC:{ja:"モナコ",en:"Monaco",es:"Mónaco",fr:"Monaco",de:"Monaco",zh:"摩纳哥",ko:"모나코",vi:"Monaco",it:"Monaco",hi:"मोनाको"},
  IT:{ja:"イタリア",en:"Italy",es:"Italia",fr:"Italie",de:"Italien",zh:"意大利",ko:"이탈리아",vi:"Ý",it:"Italia",hi:"इटली"},
  ES:{ja:"スペイン",en:"Spain",es:"España",fr:"Espagne",de:"Spanien",zh:"西班牙",ko:"스페인",vi:"Tây Ban Nha",it:"Spagna",hi:"स्पेन"},
  PT:{ja:"ポルトガル",en:"Portugal",es:"Portugal",fr:"Portugal",de:"Portugal",zh:"葡萄牙",ko:"포르투갈",vi:"Bồ Đào Nha",it:"Portogallo",hi:"पुर्तगाल"},
  GR:{ja:"ギリシャ",en:"Greece",es:"Grecia",fr:"Grèce",de:"Griechenland",zh:"希腊",ko:"그리스",vi:"Hy Lạp",it:"Grecia",hi:"ग्रीस"},
  HR:{ja:"クロアチア",en:"Croatia",es:"Croacia",fr:"Croatie",de:"Kroatien",zh:"克罗地亚",ko:"크로아티아",vi:"Croatia",it:"Croazia",hi:"क्रोएशिया"},
  SI:{ja:"スロベニア",en:"Slovenia",es:"Eslovenia",fr:"Slovénie",de:"Slowenien",zh:"斯洛文尼亚",ko:"슬로베니아",vi:"Slovenia",it:"Slovenia",hi:"स्लोवेनिया"},
  RS:{ja:"セルビア",en:"Serbia",es:"Serbia",fr:"Serbie",de:"Serbien",zh:"塞尔维亚",ko:"세르비아",vi:"Serbia",it:"Serbia",hi:"सर्बिया"},
  BA:{ja:"ボスニア・ヘルツェゴビナ",en:"Bosnia & Herzegovina",es:"Bosnia y Herzegovina",fr:"Bosnie-Herzégovine",de:"Bosnien und Herzegowina",zh:"波斯尼亚和黑塞哥维那",ko:"보스니아 헤르체고비나",vi:"Bosnia & Herzegovina",it:"Bosnia ed Erzegovina",hi:"बोस्निया और हर्जेगोविना"},
  ME:{ja:"モンテネグロ",en:"Montenegro",es:"Montenegro",fr:"Monténégro",de:"Montenegro",zh:"黑山",ko:"몬테네그로",vi:"Montenegro",it:"Montenegro",hi:"मोंटेनेग्रो"},
  MK:{ja:"北マケドニア",en:"North Macedonia",es:"Macedonia del Norte",fr:"Macédoine du Nord",de:"Nordmazedonien",zh:"北马其顿",ko:"북마케도니아",vi:"Bắc Macedonia",it:"Macedonia del Nord",hi:"उत्तर मैसेडोनिया"},
  AL:{ja:"アルバニア",en:"Albania",es:"Albania",fr:"Albanie",de:"Albanien",zh:"阿尔巴尼亚",ko:"알바니아",vi:"Albania",it:"Albania",hi:"अल्बानिया"},
  MT:{ja:"マルタ",en:"Malta",es:"Malta",fr:"Malte",de:"Malta",zh:"马耳他",ko:"몰타",vi:"Malta",it:"Malta",hi:"माल्टा"},
  AD:{ja:"アンドラ",en:"Andorra",es:"Andorra",fr:"Andorre",de:"Andorra",zh:"安道尔",ko:"안도라",vi:"Andorra",it:"Andorra",hi:"अंडोरा"},
  SM:{ja:"サンマリノ",en:"San Marino",es:"San Marino",fr:"Saint-Marin",de:"San Marino",zh:"圣马力诺",ko:"산마리노",vi:"San Marino",it:"San Marino",hi:"सैन मैरिनो"},
  VA:{ja:"バチカン",en:"Vatican",es:"Vaticano",fr:"Vatican",de:"Vatikan",zh:"梵蒂冈",ko:"바티칸",vi:"Vatican",it:"Vaticano",hi:"वेटिकन"},
  RU:{ja:"ロシア",en:"Russia",es:"Rusia",fr:"Russie",de:"Russland",zh:"俄罗斯",ko:"러시아",vi:"Nga",it:"Russia",hi:"रूस"},
  UA:{ja:"ウクライナ",en:"Ukraine",es:"Ucrania",fr:"Ukraine",de:"Ukraine",zh:"乌克兰",ko:"우크라이나",vi:"Ukraine",it:"Ucraina",hi:"यूक्रेन"},
  BY:{ja:"ベラルーシ",en:"Belarus",es:"Bielorrusia",fr:"Biélorussie",de:"Belarus",zh:"白俄罗斯",ko:"벨라루스",vi:"Belarus",it:"Bielorussia",hi:"बेलारूस"},
  PL:{ja:"ポーランド",en:"Poland",es:"Polonia",fr:"Pologne",de:"Polen",zh:"波兰",ko:"폴란드",vi:"Ba Lan",it:"Polonia",hi:"पोलैंड"},
  CZ:{ja:"チェコ",en:"Czechia",es:"Rep. Checa",fr:"Tchéquie",de:"Tschechien",zh:"捷克",ko:"체코",vi:"Séc",it:"Rep. Ceca",hi:"चेक गणराज्य"},
  SK:{ja:"スロバキア",en:"Slovakia",es:"Eslovaquia",fr:"Slovaquie",de:"Slowakei",zh:"斯洛伐克",ko:"슬로바키아",vi:"Slovakia",it:"Slovacchia",hi:"स्लोवाकिया"},
  HU:{ja:"ハンガリー",en:"Hungary",es:"Hungría",fr:"Hongrie",de:"Ungarn",zh:"匈牙利",ko:"헝가리",vi:"Hungary",it:"Ungheria",hi:"हंगरी"},
  RO:{ja:"ルーマニア",en:"Romania",es:"Rumanía",fr:"Roumanie",de:"Rumänien",zh:"罗马尼亚",ko:"루마니아",vi:"Romania",it:"Romania",hi:"रोमानिया"},
  BG:{ja:"ブルガリア",en:"Bulgaria",es:"Bulgaria",fr:"Bulgarie",de:"Bulgarien",zh:"保加利亚",ko:"불가리아",vi:"Bulgaria",it:"Bulgaria",hi:"बुल्गारिया"},
  MD:{ja:"モルドバ",en:"Moldova",es:"Moldavia",fr:"Moldavie",de:"Moldau",zh:"摩尔多瓦",ko:"몰도바",vi:"Moldova",it:"Moldova",hi:"मोल्दोवा"},
  EG:{ja:"エジプト",en:"Egypt",es:"Egipto",fr:"Égypte",de:"Ägypten",zh:"埃及",ko:"이집트",vi:"Ai Cập",it:"Egitto",hi:"मिस्र"},
  MA:{ja:"モロッコ",en:"Morocco",es:"Marruecos",fr:"Maroc",de:"Marokko",zh:"摩洛哥",ko:"모로코",vi:"Maroc",it:"Marocco",hi:"मोरक्को"},
  DZ:{ja:"アルジェリア",en:"Algeria",es:"Argelia",fr:"Algérie",de:"Algerien",zh:"阿尔及利亚",ko:"알제리",vi:"Algeria",it:"Algeria",hi:"अल्जीरिया"},
  TN:{ja:"チュニジア",en:"Tunisia",es:"Túnez",fr:"Tunisie",de:"Tunesien",zh:"突尼斯",ko:"튀니지",vi:"Tunisia",it:"Tunisia",hi:"ट्यूनीशिया"},
  LY:{ja:"リビア",en:"Libya",es:"Libia",fr:"Libye",de:"Libyen",zh:"利比亚",ko:"리비아",vi:"Libya",it:"Libia",hi:"लीबिया"},
  SD:{ja:"スーダン",en:"Sudan",es:"Sudán",fr:"Soudan",de:"Sudan",zh:"苏丹",ko:"수단",vi:"Sudan",it:"Sudan",hi:"सूडान"},
  MR:{ja:"モーリタニア",en:"Mauritania",es:"Mauritania",fr:"Mauritanie",de:"Mauretanien",zh:"毛里塔尼亚",ko:"모리타니",vi:"Mauritania",it:"Mauritania",hi:"मॉरिटानिया"},
  ML:{ja:"マリ",en:"Mali",es:"Malí",fr:"Mali",de:"Mali",zh:"马里",ko:"말리",vi:"Mali",it:"Mali",hi:"माली"},
  NE:{ja:"ニジェール",en:"Niger",es:"Níger",fr:"Niger",de:"Niger",zh:"尼日尔",ko:"니제르",vi:"Niger",it:"Niger",hi:"नाइजर"},
  TD:{ja:"チャド",en:"Chad",es:"Chad",fr:"Tchad",de:"Tschad",zh:"乍得",ko:"차드",vi:"Chad",it:"Ciad",hi:"चाड"},
  NG:{ja:"ナイジェリア",en:"Nigeria",es:"Nigeria",fr:"Nigéria",de:"Nigeria",zh:"尼日利亚",ko:"나이지리아",vi:"Nigeria",it:"Nigeria",hi:"नाइजीरिया"},
  GH:{ja:"ガーナ",en:"Ghana",es:"Ghana",fr:"Ghana",de:"Ghana",zh:"加纳",ko:"가나",vi:"Ghana",it:"Ghana",hi:"घाना"},
  CI:{ja:"コートジボワール",en:"Ivory Coast",es:"Costa de Marfil",fr:"Côte d'Ivoire",de:"Elfenbeinküste",zh:"科特迪瓦",ko:"코트디부아르",vi:"Bờ Biển Ngà",it:"Costa d'Avorio",hi:"आइवरी कोस्ट"},
  SN:{ja:"セネガル",en:"Senegal",es:"Senegal",fr:"Sénégal",de:"Senegal",zh:"塞内加尔",ko:"세네갈",vi:"Senegal",it:"Senegal",hi:"सेनेगल"},
  CM:{ja:"カメルーン",en:"Cameroon",es:"Camerún",fr:"Cameroun",de:"Kamerun",zh:"喀麦隆",ko:"카메룬",vi:"Cameroon",it:"Camerun",hi:"कैमरून"},
  GN:{ja:"ギニア",en:"Guinea",es:"Guinea",fr:"Guinée",de:"Guinea",zh:"几内亚",ko:"기니",vi:"Guinea",it:"Guinea",hi:"गिनी"},
  BF:{ja:"ブルキナファソ",en:"Burkina Faso",es:"Burkina Faso",fr:"Burkina Faso",de:"Burkina Faso",zh:"布基纳法索",ko:"부르키나파소",vi:"Burkina Faso",it:"Burkina Faso",hi:"बुर्किना फ़ासो"},
  BJ:{ja:"ベナン",en:"Benin",es:"Benín",fr:"Bénin",de:"Benin",zh:"贝宁",ko:"베냉",vi:"Benin",it:"Benin",hi:"बेनिन"},
  TG:{ja:"トーゴ",en:"Togo",es:"Togo",fr:"Togo",de:"Togo",zh:"多哥",ko:"토고",vi:"Togo",it:"Togo",hi:"टोगो"},
  SL:{ja:"シエラレオネ",en:"Sierra Leone",es:"Sierra Leona",fr:"Sierra Leone",de:"Sierra Leone",zh:"塞拉利昂",ko:"시에라리온",vi:"Sierra Leone",it:"Sierra Leone",hi:"सिएरा लियोन"},
  LR:{ja:"リベリア",en:"Liberia",es:"Liberia",fr:"Liberia",de:"Liberia",zh:"利比里亚",ko:"라이베리아",vi:"Liberia",it:"Liberia",hi:"लाइबेरिया"},
  GW:{ja:"ギニアビサウ",en:"Guinea-Bissau",es:"Guinea-Bisáu",fr:"Guinée-Bissau",de:"Guinea-Bissau",zh:"几内亚比绍",ko:"기니비사우",vi:"Guinea-Bissau",it:"Guinea-Bissau",hi:"गिनी-बिसाऊ"},
  GM:{ja:"ガンビア",en:"Gambia",es:"Gambia",fr:"Gambie",de:"Gambia",zh:"冈比亚",ko:"감비아",vi:"Gambia",it:"Gambia",hi:"गांबिया"},
  CV:{ja:"カーボベルデ",en:"Cape Verde",es:"Cabo Verde",fr:"Cap-Vert",de:"Kap Verde",zh:"佛得角",ko:"카보베르데",vi:"Cabo Verde",it:"Capo Verde",hi:"केप वर्ड"},
  ET:{ja:"エチオピア",en:"Ethiopia",es:"Etiopía",fr:"Éthiopie",de:"Äthiopien",zh:"埃塞俄比亚",ko:"에티오피아",vi:"Ethiopia",it:"Etiopia",hi:"इथियोपिया"},
  KE:{ja:"ケニア",en:"Kenya",es:"Kenia",fr:"Kenya",de:"Kenia",zh:"肯尼亚",ko:"케냐",vi:"Kenya",it:"Kenya",hi:"केन्या"},
  TZ:{ja:"タンザニア",en:"Tanzania",es:"Tanzania",fr:"Tanzanie",de:"Tansania",zh:"坦桑尼亚",ko:"탄자니아",vi:"Tanzania",it:"Tanzania",hi:"तंज़ानिया"},
  UG:{ja:"ウガンダ",en:"Uganda",es:"Uganda",fr:"Ouganda",de:"Uganda",zh:"乌干达",ko:"우간다",vi:"Uganda",it:"Uganda",hi:"युगांडा"},
  RW:{ja:"ルワンダ",en:"Rwanda",es:"Ruanda",fr:"Rwanda",de:"Ruanda",zh:"卢旺达",ko:"르완다",vi:"Rwanda",it:"Ruanda",hi:"रवांडा"},
  BI:{ja:"ブルンジ",en:"Burundi",es:"Burundi",fr:"Burundi",de:"Burundi",zh:"布隆迪",ko:"부룬디",vi:"Burundi",it:"Burundi",hi:"बुरुंडी"},
  SO:{ja:"ソマリア",en:"Somalia",es:"Somalia",fr:"Somalie",de:"Somalia",zh:"索马里",ko:"소말리아",vi:"Somalia",it:"Somalia",hi:"सोमालिया"},
  ER:{ja:"エリトリア",en:"Eritrea",es:"Eritrea",fr:"Érythrée",de:"Eritrea",zh:"厄立特里亚",ko:"에리트레아",vi:"Eritrea",it:"Eritrea",hi:"इरिट्रिया"},
  DJ:{ja:"ジブチ",en:"Djibouti",es:"Yibuti",fr:"Djibouti",de:"Dschibuti",zh:"吉布提",ko:"지부티",vi:"Djibouti",it:"Gibuti",hi:"जिबूती"},
  SS:{ja:"南スーダン",en:"South Sudan",es:"Sudán del Sur",fr:"Soudan du Sud",de:"Südsudan",zh:"南苏丹",ko:"남수단",vi:"Nam Sudan",it:"Sudan del Sud",hi:"दक्षिण सूडान"},
  CD:{ja:"コンゴ民主共和国",en:"DR Congo",es:"R. D. Congo",fr:"R.D. Congo",de:"DR Kongo",zh:"刚果民主共和国",ko:"콩고 민주 공화국",vi:"Congo (DRC)",it:"Congo (RDC)",hi:"कांगो लोकतांत्रिक"},
  CG:{ja:"コンゴ共和国",en:"Congo",es:"Congo",fr:"Congo",de:"Kongo",zh:"刚果共和国",ko:"콩고 공화국",vi:"Congo",it:"Congo",hi:"कांगो गणराज्य"},
  CF:{ja:"中央アフリカ共和国",en:"Central African Rep.",es:"Rep. Centroafricana",fr:"Rép. centrafricaine",de:"Zentralafrik. Republik",zh:"中非共和国",ko:"중앙아프리카 공화국",vi:"Trung Phi",it:"Rep. Centrafricana",hi:"मध्य अफ्रीकी गणराज्य"},
  GA:{ja:"ガボン",en:"Gabon",es:"Gabón",fr:"Gabon",de:"Gabun",zh:"加蓬",ko:"가봉",vi:"Gabon",it:"Gabon",hi:"गैबॉन"},
  GQ:{ja:"赤道ギニア",en:"Equatorial Guinea",es:"Guinea Ecuatorial",fr:"Guinée équatoriale",de:"Äquatorialguinea",zh:"赤道几内亚",ko:"적도 기니",vi:"Guinea Xích Đạo",it:"Guinea Equatoriale",hi:"भूमध्यरेखीय गिनी"},
  AO:{ja:"アンゴラ",en:"Angola",es:"Angola",fr:"Angola",de:"Angola",zh:"安哥拉",ko:"앙골라",vi:"Angola",it:"Angola",hi:"अंगोला"},
  ZA:{ja:"南アフリカ",en:"South Africa",es:"Sudáfrica",fr:"Afrique du Sud",de:"Südafrika",zh:"南非",ko:"남아프리카",vi:"Nam Phi",it:"Sudafrica",hi:"दक्षिण अफ्रीका"},
  ZW:{ja:"ジンバブエ",en:"Zimbabwe",es:"Zimbabue",fr:"Zimbabwe",de:"Simbabwe",zh:"津巴布韦",ko:"짐바브웨",vi:"Zimbabwe",it:"Zimbabwe",hi:"ज़िम्बाब्वे"},
  ZM:{ja:"ザンビア",en:"Zambia",es:"Zambia",fr:"Zambie",de:"Sambia",zh:"赞比亚",ko:"잠비아",vi:"Zambia",it:"Zambia",hi:"ज़ांबिया"},
  MZ:{ja:"モザンビーク",en:"Mozambique",es:"Mozambique",fr:"Mozambique",de:"Mosambik",zh:"莫桑比克",ko:"모잠비크",vi:"Mozambique",it:"Mozambico",hi:"मोज़ाम्बिक"},
  MW:{ja:"マラウイ",en:"Malawi",es:"Malaui",fr:"Malawi",de:"Malawi",zh:"马拉维",ko:"말라위",vi:"Malawi",it:"Malawi",hi:"मलावी"},
  BW:{ja:"ボツワナ",en:"Botswana",es:"Botsuana",fr:"Botswana",de:"Botsuana",zh:"博茨瓦纳",ko:"보츠와나",vi:"Botswana",it:"Botswana",hi:"बोत्सवाना"},
  NA:{ja:"ナミビア",en:"Namibia",es:"Namibia",fr:"Namibie",de:"Namibia",zh:"纳米比亚",ko:"나미비아",vi:"Namibia",it:"Namibia",hi:"नामीबिया"},
  LS:{ja:"レソト",en:"Lesotho",es:"Lesoto",fr:"Lesotho",de:"Lesotho",zh:"莱索托",ko:"레소토",vi:"Lesotho",it:"Lesotho",hi:"लेसोथो"},
  SZ:{ja:"エスワティニ",en:"Eswatini",es:"Esuatini",fr:"Eswatini",de:"Eswatini",zh:"斯威士兰",ko:"에스와티니",vi:"Eswatini",it:"Eswatini",hi:"एस्वातिनी"},
  MG:{ja:"マダガスカル",en:"Madagascar",es:"Madagascar",fr:"Madagascar",de:"Madagaskar",zh:"马达加斯加",ko:"마다가스카르",vi:"Madagascar",it:"Madagascar",hi:"मेडागास्कर"},
  MU:{ja:"モーリシャス",en:"Mauritius",es:"Mauricio",fr:"Maurice",de:"Mauritius",zh:"毛里求斯",ko:"모리셔스",vi:"Mauritius",it:"Mauritius",hi:"मॉरीशस"},
  SC:{ja:"セーシェル",en:"Seychelles",es:"Seychelles",fr:"Seychelles",de:"Seychellen",zh:"塞舌尔",ko:"세이셸",vi:"Seychelles",it:"Seychelles",hi:"सेशेल्स"},
  KM:{ja:"コモロ",en:"Comoros",es:"Comoras",fr:"Comores",de:"Komoren",zh:"科摩罗",ko:"코모로",vi:"Comoros",it:"Comore",hi:"कोमोरोस"},
  US:{ja:"アメリカ合衆国",en:"United States",es:"Estados Unidos",fr:"États-Unis",de:"Vereinigte Staaten",zh:"美国",ko:"미국",vi:"Hoa Kỳ",it:"Stati Uniti",hi:"संयुक्त राज्य"},
  CA:{ja:"カナダ",en:"Canada",es:"Canadá",fr:"Canada",de:"Kanada",zh:"加拿大",ko:"캐나다",vi:"Canada",it:"Canada",hi:"कनाडा"},
  MX:{ja:"メキシコ",en:"Mexico",es:"México",fr:"Mexique",de:"Mexiko",zh:"墨西哥",ko:"멕시코",vi:"Mexico",it:"Messico",hi:"मेक्सिको"},
  GT:{ja:"グアテマラ",en:"Guatemala",es:"Guatemala",fr:"Guatemala",de:"Guatemala",zh:"危地马拉",ko:"과테말라",vi:"Guatemala",it:"Guatemala",hi:"ग्वाटेमाला"},
  BZ:{ja:"ベリーズ",en:"Belize",es:"Belice",fr:"Belize",de:"Belize",zh:"伯利兹",ko:"벨리즈",vi:"Belize",it:"Belize",hi:"बेलीज़"},
  HN:{ja:"ホンジュラス",en:"Honduras",es:"Honduras",fr:"Honduras",de:"Honduras",zh:"洪都拉斯",ko:"온두라스",vi:"Honduras",it:"Honduras",hi:"होंडुरास"},
  SV:{ja:"エルサルバドル",en:"El Salvador",es:"El Salvador",fr:"Salvador",de:"El Salvador",zh:"萨尔瓦多",ko:"엘살바도르",vi:"El Salvador",it:"El Salvador",hi:"अल साल्वाडोर"},
  NI:{ja:"ニカラグア",en:"Nicaragua",es:"Nicaragua",fr:"Nicaragua",de:"Nicaragua",zh:"尼加拉瓜",ko:"니카라과",vi:"Nicaragua",it:"Nicaragua",hi:"निकारागुआ"},
  CR:{ja:"コスタリカ",en:"Costa Rica",es:"Costa Rica",fr:"Costa Rica",de:"Costa Rica",zh:"哥斯达黎加",ko:"코스타리카",vi:"Costa Rica",it:"Costa Rica",hi:"कोस्टा रिका"},
  PA:{ja:"パナマ",en:"Panama",es:"Panamá",fr:"Panama",de:"Panama",zh:"巴拿马",ko:"파나마",vi:"Panama",it:"Panama",hi:"पनामा"},
  CU:{ja:"キューバ",en:"Cuba",es:"Cuba",fr:"Cuba",de:"Kuba",zh:"古巴",ko:"쿠바",vi:"Cuba",it:"Cuba",hi:"क्यूबा"},
  JM:{ja:"ジャマイカ",en:"Jamaica",es:"Jamaica",fr:"Jamaïque",de:"Jamaika",zh:"牙买加",ko:"자메이카",vi:"Jamaica",it:"Giamaica",hi:"जमैका"},
  HT:{ja:"ハイチ",en:"Haiti",es:"Haití",fr:"Haïti",de:"Haiti",zh:"海地",ko:"아이티",vi:"Haiti",it:"Haiti",hi:"हैती"},
  DO:{ja:"ドミニカ共和国",en:"Dominican Rep.",es:"Rep. Dominicana",fr:"Rép. dominicaine",de:"Dominikanische Republik",zh:"多米尼加共和国",ko:"도미니카 공화국",vi:"Cộng hòa Dominica",it:"Rep. Dominicana",hi:"डोमिनिकन गणराज्य"},
  TT:{ja:"トリニダード・トバゴ",en:"Trinidad & Tobago",es:"Trinidad y Tobago",fr:"Trinité-et-Tobago",de:"Trinidad und Tobago",zh:"特立尼达和多巴哥",ko:"트리니다드 토바고",vi:"Trinidad & Tobago",it:"Trinidad e Tobago",hi:"त्रिनिदाद और टोबैगो"},
  BB:{ja:"バルバドス",en:"Barbados",es:"Barbados",fr:"Barbade",de:"Barbados",zh:"巴巴多斯",ko:"바베이도스",vi:"Barbados",it:"Barbados",hi:"बारबाडोस"},
  LC:{ja:"セントルシア",en:"Saint Lucia",es:"Santa Lucía",fr:"Sainte-Lucie",de:"St. Lucia",zh:"圣卢西亚",ko:"세인트루시아",vi:"Saint Lucia",it:"Saint Lucia",hi:"सेंट लूसिया"},
  VC:{ja:"セントビンセント",en:"St Vincent",es:"San Vicente",fr:"Saint-Vincent",de:"St. Vincent",zh:"圣文森特",ko:"세인트빈센트",vi:"Saint Vincent",it:"Saint Vincent",hi:"सेंट विंसेंट"},
  GD:{ja:"グレナダ",en:"Grenada",es:"Granada",fr:"Grenade",de:"Grenada",zh:"格林纳达",ko:"그레나다",vi:"Grenada",it:"Grenada",hi:"ग्रेनेडा"},
  AG:{ja:"アンティグア・バーブーダ",en:"Antigua & Barbuda",es:"Antigua y Barbuda",fr:"Antigua-et-Barbuda",de:"Antigua und Barbuda",zh:"安提瓜和巴布达",ko:"앤티가 바부다",vi:"Antigua & Barbuda",it:"Antigua e Barbuda",hi:"एंटीगुआ और बारबुडा"},
  KN:{ja:"セントクリストファー",en:"St Kitts & Nevis",es:"San Cristóbal y Nieves",fr:"Saint-Christophe",de:"St. Kitts und Nevis",zh:"圣基茨和尼维斯",ko:"세인트키츠 네비스",vi:"Saint Kitts",it:"Saint Kitts e Nevis",hi:"सेंट किट्स"},
  BS:{ja:"バハマ",en:"Bahamas",es:"Bahamas",fr:"Bahamas",de:"Bahamas",zh:"巴哈马",ko:"바하마",vi:"Bahamas",it:"Bahamas",hi:"बहामास"},
  DM:{ja:"ドミニカ国",en:"Dominica",es:"Dominica",fr:"Dominique",de:"Dominica",zh:"多米尼克",ko:"도미니카",vi:"Dominica",it:"Dominica",hi:"डोमिनिका"},
  CO:{ja:"コロンビア",en:"Colombia",es:"Colombia",fr:"Colombie",de:"Kolumbien",zh:"哥伦比亚",ko:"콜롬비아",vi:"Colombia",it:"Colombia",hi:"कोलंबिया"},
  VE:{ja:"ベネズエラ",en:"Venezuela",es:"Venezuela",fr:"Venezuela",de:"Venezuela",zh:"委内瑞拉",ko:"베네수엘라",vi:"Venezuela",it:"Venezuela",hi:"वेनेज़ुएला"},
  EC:{ja:"エクアドル",en:"Ecuador",es:"Ecuador",fr:"Équateur",de:"Ecuador",zh:"厄瓜多尔",ko:"에콰도르",vi:"Ecuador",it:"Ecuador",hi:"इक्वाडोर"},
  PE:{ja:"ペルー",en:"Peru",es:"Perú",fr:"Pérou",de:"Peru",zh:"秘鲁",ko:"페루",vi:"Peru",it:"Perù",hi:"पेरू"},
  BR:{ja:"ブラジル",en:"Brazil",es:"Brasil",fr:"Brésil",de:"Brasilien",zh:"巴西",ko:"브라질",vi:"Brazil",it:"Brasile",hi:"ब्राज़ील"},
  BO:{ja:"ボリビア",en:"Bolivia",es:"Bolivia",fr:"Bolivie",de:"Bolivien",zh:"玻利维亚",ko:"볼리비아",vi:"Bolivia",it:"Bolivia",hi:"बोलीविया"},
  PY:{ja:"パラグアイ",en:"Paraguay",es:"Paraguay",fr:"Paraguay",de:"Paraguay",zh:"巴拉圭",ko:"파라과이",vi:"Paraguay",it:"Paraguay",hi:"पराग्वे"},
  UY:{ja:"ウルグアイ",en:"Uruguay",es:"Uruguay",fr:"Uruguay",de:"Uruguay",zh:"乌拉圭",ko:"우루과이",vi:"Uruguay",it:"Uruguay",hi:"उरुग्वे"},
  AR:{ja:"アルゼンチン",en:"Argentina",es:"Argentina",fr:"Argentine",de:"Argentinien",zh:"阿根廷",ko:"아르헨티나",vi:"Argentina",it:"Argentina",hi:"अर्जेंटीना"},
  CL:{ja:"チリ",en:"Chile",es:"Chile",fr:"Chili",de:"Chile",zh:"智利",ko:"칠레",vi:"Chile",it:"Cile",hi:"चिली"},
  GY:{ja:"ガイアナ",en:"Guyana",es:"Guyana",fr:"Guyana",de:"Guyana",zh:"圭亚那",ko:"가이아나",vi:"Guyana",it:"Guyana",hi:"गयाना"},
  SR:{ja:"スリナム",en:"Suriname",es:"Surinam",fr:"Suriname",de:"Surinam",zh:"苏里南",ko:"수리남",vi:"Suriname",it:"Suriname",hi:"सूरीनाम"},
  AU:{ja:"オーストラリア",en:"Australia",es:"Australia",fr:"Australie",de:"Australien",zh:"澳大利亚",ko:"호주",vi:"Úc",it:"Australia",hi:"ऑस्ट्रेलिया"},
  NZ:{ja:"ニュージーランド",en:"New Zealand",es:"Nueva Zelanda",fr:"Nouvelle-Zélande",de:"Neuseeland",zh:"新西兰",ko:"뉴질랜드",vi:"New Zealand",it:"Nuova Zelanda",hi:"न्यूजीलैंड"},
  FJ:{ja:"フィジー",en:"Fiji",es:"Fiyi",fr:"Fidji",de:"Fidschi",zh:"斐济",ko:"피지",vi:"Fiji",it:"Figi",hi:"फ़िजी"},
  PG:{ja:"パプアニューギニア",en:"Papua New Guinea",es:"Papúa Nueva Guinea",fr:"Papouasie-Nouvelle-Guinée",de:"Papua-Neuguinea",zh:"巴布亚新几内亚",ko:"파푸아뉴기니",vi:"Papua New Guinea",it:"Papua Nuova Guinea",hi:"पापुआ न्यू गिनी"},
  WS:{ja:"サモア",en:"Samoa",es:"Samoa",fr:"Samoa",de:"Samoa",zh:"萨摩亚",ko:"사모아",vi:"Samoa",it:"Samoa",hi:"सामोआ"},
  TO:{ja:"トンガ",en:"Tonga",es:"Tonga",fr:"Tonga",de:"Tonga",zh:"汤加",ko:"통가",vi:"Tonga",it:"Tonga",hi:"टोंगा"},
  VU:{ja:"バヌアツ",en:"Vanuatu",es:"Vanuatu",fr:"Vanuatu",de:"Vanuatu",zh:"瓦努阿图",ko:"바누아투",vi:"Vanuatu",it:"Vanuatu",hi:"वानुअतु"},
  SB:{ja:"ソロモン諸島",en:"Solomon Islands",es:"Islas Salomón",fr:"Îles Salomon",de:"Salomonen",zh:"所罗门群岛",ko:"솔로몬 제도",vi:"Quần đảo Solomon",it:"Isole Salomone",hi:"सोलोमन द्वीप"},
  PW:{ja:"パラオ",en:"Palau",es:"Palaos",fr:"Palaos",de:"Palau",zh:"帕劳",ko:"팔라우",vi:"Palau",it:"Palau",hi:"पलाऊ"},
  FM:{ja:"ミクロネシア",en:"Micronesia",es:"Micronesia",fr:"Micronésie",de:"Mikronesien",zh:"密克罗尼西亚",ko:"미크로네시아",vi:"Micronesia",it:"Micronesia",hi:"माइक्रोनेशिया"},
  MH:{ja:"マーシャル諸島",en:"Marshall Islands",es:"Islas Marshall",fr:"Îles Marshall",de:"Marshallinseln",zh:"马绍尔群岛",ko:"마셜 제도",vi:"Quần đảo Marshall",it:"Isole Marshall",hi:"मार्शल द्वीप"},
  NR:{ja:"ナウル",en:"Nauru",es:"Nauru",fr:"Nauru",de:"Nauru",zh:"瑙鲁",ko:"나우루",vi:"Nauru",it:"Nauru",hi:"नाउरू"},
  KI:{ja:"キリバス",en:"Kiribati",es:"Kiribati",fr:"Kiribati",de:"Kiribati",zh:"基里巴斯",ko:"키리바시",vi:"Kiribati",it:"Kiribati",hi:"किरिबाती"},
  TV:{ja:"ツバル",en:"Tuvalu",es:"Tuvalu",fr:"Tuvalu",de:"Tuvalu",zh:"图瓦卢",ko:"투발루",vi:"Tuvalu",it:"Tuvalu",hi:"तुवालु"},
};

// Emoji map
const EMOJI: Record<string, string> = {
  JP:"🇯🇵",CN:"🇨🇳",KR:"🇰🇷",KP:"🇰🇵",MN:"🇲🇳",TW:"🇹🇼",
  MM:"🇲🇲",TH:"🇹🇭",VN:"🇻🇳",KH:"🇰🇭",LA:"🇱🇦",MY:"🇲🇾",SG:"🇸🇬",ID:"🇮🇩",PH:"🇵🇭",BN:"🇧🇳",TL:"🇹🇱",
  IN:"🇮🇳",PK:"🇵🇰",BD:"🇧🇩",LK:"🇱🇰",NP:"🇳🇵",BT:"🇧🇹",MV:"🇲🇻",
  KZ:"🇰🇿",UZ:"🇺🇿",TM:"🇹🇲",TJ:"🇹🇯",KG:"🇰🇬",AF:"🇦🇫",
  IR:"🇮🇷",IQ:"🇮🇶",SY:"🇸🇾",LB:"🇱🇧",IL:"🇮🇱",JO:"🇯🇴",SA:"🇸🇦",AE:"🇦🇪",QA:"🇶🇦",KW:"🇰🇼",BH:"🇧🇭",OM:"🇴🇲",YE:"🇾🇪",TR:"🇹🇷",CY:"🇨🇾",GE:"🇬🇪",AM:"🇦🇲",AZ:"🇦🇿",PS:"🇵🇸",
  SE:"🇸🇪",NO:"🇳🇴",DK:"🇩🇰",FI:"🇫🇮",IS:"🇮🇸",EE:"🇪🇪",LV:"🇱🇻",LT:"🇱🇹",IE:"🇮🇪",GB:"🇬🇧",
  FR:"🇫🇷",DE:"🇩🇪",NL:"🇳🇱",BE:"🇧🇪",LU:"🇱🇺",CH:"🇨🇭",AT:"🇦🇹",LI:"🇱🇮",MC:"🇲🇨",
  IT:"🇮🇹",ES:"🇪🇸",PT:"🇵🇹",GR:"🇬🇷",HR:"🇭🇷",SI:"🇸🇮",RS:"🇷🇸",BA:"🇧🇦",ME:"🇲🇪",MK:"🇲🇰",AL:"🇦🇱",MT:"🇲🇹",AD:"🇦🇩",SM:"🇸🇲",VA:"🇻🇦",
  RU:"🇷🇺",UA:"🇺🇦",BY:"🇧🇾",PL:"🇵🇱",CZ:"🇨🇿",SK:"🇸🇰",HU:"🇭🇺",RO:"🇷🇴",BG:"🇧🇬",MD:"🇲🇩",
  EG:"🇪🇬",MA:"🇲🇦",DZ:"🇩🇿",TN:"🇹🇳",LY:"🇱🇾",SD:"🇸🇩",MR:"🇲🇷",ML:"🇲🇱",NE:"🇳🇪",TD:"🇹🇩",
  NG:"🇳🇬",GH:"🇬🇭",CI:"🇨🇮",SN:"🇸🇳",CM:"🇨🇲",GN:"🇬🇳",BF:"🇧🇫",BJ:"🇧🇯",TG:"🇹🇬",SL:"🇸🇱",LR:"🇱🇷",GW:"🇬🇼",GM:"🇬🇲",CV:"🇨🇻",
  ET:"🇪🇹",KE:"🇰🇪",TZ:"🇹🇿",UG:"🇺🇬",RW:"🇷🇼",BI:"🇧🇮",SO:"🇸🇴",ER:"🇪🇷",DJ:"🇩🇯",SS:"🇸🇸",
  CD:"🇨🇩",CG:"🇨🇬",CF:"🇨🇫",GA:"🇬🇦",GQ:"🇬🇶",AO:"🇦🇴",
  ZA:"🇿🇦",ZW:"🇿🇼",ZM:"🇿🇲",MZ:"🇲🇿",MW:"🇲🇼",BW:"🇧🇼",NA:"🇳🇦",LS:"🇱🇸",SZ:"🇸🇿",MG:"🇲🇬",MU:"🇲🇺",SC:"🇸🇨",KM:"🇰🇲",
  US:"🇺🇸",CA:"🇨🇦",MX:"🇲🇽",GT:"🇬🇹",BZ:"🇧🇿",HN:"🇭🇳",SV:"🇸🇻",NI:"🇳🇮",CR:"🇨🇷",PA:"🇵🇦",CU:"🇨🇺",JM:"🇯🇲",HT:"🇭🇹",DO:"🇩🇴",TT:"🇹🇹",BB:"🇧🇧",LC:"🇱🇨",VC:"🇻🇨",GD:"🇬🇩",AG:"🇦🇬",KN:"🇰🇳",BS:"🇧🇸",DM:"🇩🇲",
  CO:"🇨🇴",VE:"🇻🇪",EC:"🇪🇨",PE:"🇵🇪",BR:"🇧🇷",BO:"🇧🇴",PY:"🇵🇾",UY:"🇺🇾",AR:"🇦🇷",CL:"🇨🇱",GY:"🇬🇾",SR:"🇸🇷",
  AU:"🇦🇺",NZ:"🇳🇿",FJ:"🇫🇯",PG:"🇵🇬",WS:"🇼🇸",TO:"🇹🇴",VU:"🇻🇺",SB:"🇸🇧",PW:"🇵🇼",FM:"🇫🇲",MH:"🇲🇭",NR:"🇳🇷",KI:"🇰🇮",TV:"🇹🇻",
};

// Build ALL_FLAGS: filter only entries with both NAMES and EMOJI defined
const ALL_FLAGS: FlagEntry[] = FLAGS_RAW
  .filter(f => NAMES[f.code] && EMOJI[f.code])
  .map(f => ({ code: f.code, r: f.r, emoji: EMOJI[f.code], names: NAMES[f.code] as Record<LangCode, string> }));

// ════════════════════════════════════════════════════════════════════
// QUESTION BUILDER — balanced proportional sampling (Webster method)
// ════════════════════════════════════════════════════════════════════

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(n: number, usedCodes: Set<string>): Question[] {
  const available = ALL_FLAGS.filter(f => !usedCodes.has(f.code));
  // FIX: reset pool entirely when not enough fresh flags (not just for n but full reset)
  const pool = available.length >= n ? available : ALL_FLAGS;

  // Group by sub-region
  const byRegion: Record<string, FlagEntry[]> = {};
  pool.forEach(f => { (byRegion[f.r] ??= []).push(f); });
  const regions = Object.keys(byRegion);
  const total   = pool.length;

  // Webster proportional allocation
  const quotas: Record<string, number> = {};
  let assigned = 0;
  regions.forEach(r => {
    const q = Math.floor((byRegion[r].length / total) * n);
    quotas[r] = q;
    assigned += q;
  });
  // Distribute remainder by largest fractional part
  const fracs = regions
    .map(r => ({ r, frac: (byRegion[r].length / total) * n - quotas[r] }))
    .sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < n - assigned; i++) quotas[fracs[i].r]++;

  const selected: FlagEntry[] = [];
  regions.forEach(r => {
    selected.push(...shuffle(byRegion[r]).slice(0, quotas[r]));
  });

  return shuffle(selected).map(flag => ({ flag, choices: getChoices(flag) }));
}

function getChoices(correct: FlagEntry): FlagEntry[] {
  const eligible = ALL_FLAGS.filter(f => f.code !== correct.code && !isConfusable(correct.code, f.code));
  const sameR    = shuffle(eligible.filter(f => f.r === correct.r));
  const otherR   = shuffle(eligible.filter(f => f.r !== correct.r));
  // Take up to 2 from same region, rest from others; always 3 distractors total
  const nSame  = Math.min(2, sameR.length);
  const picks  = [...sameR.slice(0, nSame), ...otherR].slice(0, 3);
  // Safety fallback if still < 3
  if (picks.length < 3) {
    const extra = ALL_FLAGS.filter(c => c.code !== correct.code && !picks.find(p => p.code === c.code));
    while (picks.length < 3 && extra.length) picks.push(extra.shift()!);
  }
  return shuffle([correct, ...picks.slice(0, 3)]);
}

// ════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════

export default function FlagQuiz(): JSX.Element {
  const [lang, setLang]           = useState<LangCode>("ja");
  const [phase, setPhase]         = useState<Phase>("start");
  const [totalQ, setTotalQ]       = useState<number>(10);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx]             = useState<number>(0);
  const [score, setScore]         = useState<number>(0);
  const [points, setPoints]       = useState<number>(0);
  const [streak, setStreak]       = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [selected, setSelected]   = useState<string | null>(null);
  const [comboKey, setComboKey]   = useState<number>(0);
  const [comboText, setComboText] = useState<string>("");
  const [history, setHistory]     = useState<HistoryItem[]>([]);

  // ── Refs: avoid stale closures entirely ─────────────────────────
  const usedCodesRef  = useRef<Set<string>>(new Set());
  const scoreRef      = useRef<number>(0);
  const streakRef     = useRef<number>(0);
  const tRef          = useRef<I18nEntry>(T[lang]);
  tRef.current        = T[lang]; // always current, no dep needed in callbacks
  const advanceTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  // FIX: keep questions/idx/totalQ in refs so handleAnswer never captures stale values
  // even when lang switches cause re-renders between answer and advance
  const questionsRef  = useRef<Question[]>([]);
  const idxRef        = useRef<number>(0);
  const totalQRef     = useRef<number>(10);
  const langRef       = useRef<LangCode>(lang);
  langRef.current     = lang; // always current for srLabel

  const t = T[lang];

  // FIX: memoize srLabel with useCallback so stable reference across renders
  // Uses langRef so it always reads the current lang without needing lang in deps
  const srLabel = useCallback((r: SubRegionKey): string => {
    const l = langRef.current;
    return SUBREGION[r] ? (l === "ja" ? SUBREGION[r].ja : SUBREGION[r].en) : r;
  }, []); // stable reference forever — langRef.current is always fresh

  // ── Start game ──────────────────────────────────────────────────
  const startGame = useCallback((n: number): void => {
    if (ALL_FLAGS.filter(f => !usedCodesRef.current.has(f.code)).length < n) {
      usedCodesRef.current = new Set();
    }
    const qs = buildQuestions(n, usedCodesRef.current);
    qs.forEach(q => usedCodesRef.current.add(q.flag.code));

    scoreRef.current  = 0;
    streakRef.current = 0;
    questionsRef.current = qs;
    idxRef.current    = 0;
    totalQRef.current = n;

    // Clear any pending advance from a previous game
    if (advanceTimer.current !== null) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }

    setTotalQ(n);
    setQuestions(qs);
    setIdx(0);
    setScore(0);
    setPoints(0);
    setStreak(0);
    setMaxStreak(0);
    setSelected(null);
    setComboText("");
    setHistory([]);
    setPhase("playing");
  }, []);

  // ── Answer handler ───────────────────────────────────────────────
  // FIX: reads ALL mutable values from refs — zero stale closure risk.
  // `selected` is the only dep because it is the double-tap guard (state, not ref).
  const handleAnswer = useCallback((choiceCode: string): void => {
    if (selected !== null) return; // double-tap guard

    const qs         = questionsRef.current;
    const currentIdx = idxRef.current;
    const nTotal     = totalQRef.current;
    const q          = qs[currentIdx];
    if (!q) return;

    const correct = q.flag.code === choiceCode;
    setSelected(choiceCode);

    if (correct) {
      scoreRef.current  += 1;
      streakRef.current += 1;
      const ns    = streakRef.current;
      const bonus = ns >= 5 ? 150 : ns >= 3 ? 120 : 100;

      setScore(scoreRef.current);
      setPoints(p => p + bonus);
      setStreak(ns);
      setMaxStreak(m => Math.max(m, ns));
      setHistory(h => [...h, { flag: q.flag, correct: true }]);

      const ct = tRef.current; // always fresh via ref
      if      (ns === 3)                { setComboText(ct.combo3);  setComboKey(k => k + 1); }
      else if (ns === 5)                { setComboText(ct.combo5);  setComboKey(k => k + 1); }
      else if (ns === 10)               { setComboText(ct.combo10); setComboKey(k => k + 1); }
      else if (ns > 10 && ns % 5 === 0) {
        setComboText(ct.comboN.replace("{n}", String(ns)));
        setComboKey(k => k + 1);
      }
    } else {
      streakRef.current = 0;
      setStreak(0);
      setHistory(h => [...h, { flag: q.flag, correct: false }]);
    }

    if (advanceTimer.current !== null) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      advanceTimer.current = null;
      const next = currentIdx + 1;
      if (next >= nTotal) {
        setPhase("result");
      } else {
        idxRef.current = next; // keep ref in sync before state update
        setIdx(next);
        setSelected(null);
      }
    }, 820);
  }, [selected]); // only dep: double-tap guard

  // FIX: stable onRetry callback — not inline, avoids new function ref on every lang change
  const handleRetry = useCallback((): void => setPhase("start"), []);

  // ── Render ───────────────────────────────────────────────────────
  if (phase === "start") {
    return <StartScreen lang={lang} setLang={setLang} t={t} onStart={startGame} />;
  }
  if (phase === "result") {
    return (
      <ResultScreen
        lang={lang} setLang={setLang} t={t}
        score={score} totalQ={totalQ} points={points}
        maxStreak={maxStreak} history={history}
        onRetry={handleRetry}
        srLabel={srLabel}
      />
    );
  }

  const q = questions[idx];
  if (!q) return <div />;

  return (
    <GameScreen
      lang={lang} setLang={setLang} t={t}
      q={q} idx={idx} totalQ={totalQ}
      points={points} streak={streak}
      selected={selected} comboText={comboText} comboKey={comboKey}
      onAnswer={handleAnswer}   // FIX: stable ref, no inline wrapper, no stale closure
      srLabel={srLabel}
    />
  );
}

// ════════════════════════════════════════════════════════════════════
// LANGUAGE BAR
// ════════════════════════════════════════════════════════════════════

interface LangBarProps { lang: LangCode; setLang: (l: LangCode) => void; }
const LangBar: FC<LangBarProps> = ({ lang, setLang }) => (
  <div style={S.langBar}>
    {LANGS.map(l => (
      <button key={l} style={{ ...S.langBtn, ...(l === lang ? S.langActive : {}) }} onClick={() => setLang(l)}>
        {LANG_LABELS[l]}
      </button>
    ))}
  </div>
);

// ════════════════════════════════════════════════════════════════════
// START SCREEN
// ════════════════════════════════════════════════════════════════════

interface StartScreenProps { lang: LangCode; setLang: (l: LangCode) => void; t: I18nEntry; onStart: (n: number) => void; }
const StartScreen: FC<StartScreenProps> = ({ lang, setLang, t, onStart }) => {
  const [sel, setSel] = useState<number | null>(null);
  return (
    <Shell center>
      <LangBar lang={lang} setLang={setLang} />
      <div style={S.card}>
        <div style={S.globe}>🌍</div>
        <h1 style={S.heroTitle}>{t.title}</h1>
        <p style={S.heroEn}>{t.titleEn}</p>
        <div style={S.divider} />
        <div style={S.infoGrid}>
          {([["🌐", t.numFlags, t.numFlagsVal], ["🔥", t.combo, t.comboVal], ["🏆", t.rank, t.rankVal]] as const).map(([ic, lb, vl]) => (
            <div key={lb} style={S.infoBox}>
              <span style={{ fontSize: "1.3rem" }}>{ic}</span>
              <span style={S.infoLabel}>{lb}</span>
              <span style={S.infoVal}>{vl}</span>
            </div>
          ))}
        </div>
        <p style={S.selectQLabel}>{t.selectQ}</p>
        <div style={S.qSelRow}>
          {([10, 50, 100] as const).map(n => (
            <button key={n} style={{ ...S.qSelBtn, ...(sel === n ? S.qSelActive : {}) }} onClick={() => setSel(n)}>
              {n}{t.questions}
            </button>
          ))}
        </div>
        <button
          style={{ ...S.startBtn, ...(sel ? {} : { opacity: 0.35, cursor: "not-allowed" as const }) }}
          onClick={() => sel && onStart(sel)}
        >
          {t.start}
        </button>
        {sel !== null && <p style={S.startNote}>{sel}{t.startNote}</p>}
      </div>
      <GlobalCSS />
    </Shell>
  );
};

// ════════════════════════════════════════════════════════════════════
// GAME SCREEN
// ════════════════════════════════════════════════════════════════════

interface GameScreenProps {
  lang: LangCode; setLang: (l: LangCode) => void; t: I18nEntry;
  q: Question; idx: number; totalQ: number;
  points: number; streak: number;  // FIX: removed unused `score` prop
  selected: string | null; comboText: string; comboKey: number;
  onAnswer: (code: string) => void; // FIX: simple signature, no args passed through
  srLabel: (r: SubRegionKey) => string;
}
const GameScreen: FC<GameScreenProps> = ({
  lang, setLang, t, q, idx, totalQ, points, streak,
  selected, comboText, comboKey, onAnswer, srLabel,
}) => {
  const rc = SUBREGION[q.flag.r]?.color ?? "#aaa";
  return (
    <Shell center>
      <LangBar lang={lang} setLang={setLang} />
      {/* FIX: only render combo when comboKey > 0 AND comboText is non-empty */}
      {comboText !== "" && comboKey > 0 && (
        <div key={comboKey} style={S.combo}>{comboText}</div>
      )}
      <div style={S.card}>
        {/* HUD */}
        <div style={S.hud}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={S.qNum}>
              <b style={{ fontSize: "1.1rem" }}>{idx + 1}</b>
              <span style={{ color: "rgba(255,255,255,0.28)", fontWeight: 400 }}>/{totalQ}</span>
            </span>
            {streak >= 2 && <span style={S.streakBadge}>🔥 {streak}</span>}
          </div>
          <div style={S.ptsBadge}>
            <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.38)", marginRight: 4 }}>{t.pts}</span>
            <b>{points.toLocaleString()}</b>
          </div>
        </div>

        {/* Progress */}
        <div style={S.progressBg}>
          <div style={{ ...S.progressFill, width: `${(idx / totalQ) * 100}%` }} />
        </div>

        {/* Flag */}
        <div key={`flag-${idx}`} style={S.flagArea}>
          <div style={S.flagEmoji}>{q.flag.emoji}</div>
          <span style={{ ...S.regionPill, background: rc + "20", color: rc, border: `1px solid ${rc}40` }}>
            {srLabel(q.flag.r)}
          </span>
        </div>

        <p style={S.questionTxt}>{t.question}</p>

        {/* Choices */}
        <div style={S.choiceGrid}>
          {q.choices.map((c, i) => {
            const isCor    = c.code === q.flag.code;
            const isSel    = c.code === selected;
            const answered = selected !== null;
            const variant: ChoiceVariant = answered ? (isCor ? "correct" : isSel ? "wrong" : "dim") : "idle";
            return (
              <button
                key={c.code}
                disabled={answered}
                style={choiceStyle(variant)}
                className={answered ? "" : "pressable"}
                onClick={() => onAnswer(c.code)}
              >
                <span style={alphaStyle(variant)}>{"ABCD"[i]}</span>
                <span style={{ flex: 1, textAlign: "left" }}>{c.names[lang] ?? c.names.en}</span>
                {variant === "correct" && <span style={{ opacity: 0.9 }}>✓</span>}
                {variant === "wrong"   && <span style={{ opacity: 0.9 }}>✗</span>}
              </button>
            );
          })}
        </div>
      </div>
      <GlobalCSS />
    </Shell>
  );
};

// ════════════════════════════════════════════════════════════════════
// RESULT SCREEN
// ════════════════════════════════════════════════════════════════════

interface ResultScreenProps {
  lang: LangCode; setLang: (l: LangCode) => void; t: I18nEntry;
  score: number; totalQ: number; points: number;
  maxStreak: number; history: HistoryItem[];
  onRetry: () => void;
  srLabel: (r: SubRegionKey) => string;
}
const ResultScreen: FC<ResultScreenProps> = ({
  lang, setLang, t, score, totalQ, points, maxStreak, history, onRetry, srLabel,
}) => {
  const [tab, setTab] = useState<number>(0);
  const { topPct, rankOf100 } = calcRank(score, totalQ);
  const info     = getRankInfo(score, totalQ);
  const accuracy = Math.round((score / totalQ) * 100);
  const wrongList = history.filter(h => !h.correct);

  // Rank localisation: ja uses Japanese text; all other langs use English
  // (RANK_TABLE only stores ja + en — adding all 10 langs to RANK_TABLE is future work)
  const rl = lang === "ja" ? info.ja : info.en;

  // Region stats
  const regionStats: Record<string, { correct: number; total: number }> = {};
  history.forEach(h => {
    const r = h.flag.r;
    regionStats[r] ??= { correct: 0, total: 0 };
    regionStats[r].total++;
    if (h.correct) regionStats[r].correct++;
  });

  return (
    <Shell top>
      <LangBar lang={lang} setLang={setLang} />
      <div style={{ ...S.card, marginBottom: 24 }}>

        {/* Grade panel */}
        <div style={{ ...S.gradePanel, borderColor: info.color + "50", background: info.color + "0C" }}>
          <div style={{ ...S.gradeCircle, borderColor: info.color, color: info.color }}>{info.grade}</div>
          <div>
            <div style={{ color: info.color, fontWeight: 900, fontSize: "1.1rem", letterSpacing: "-0.3px" }}>{rl.title}</div>
            <div style={{ fontSize: "0.6rem", letterSpacing: "2px", color: "rgba(255,255,255,0.3)", fontWeight: 700, marginTop: 2 }}>
              {info.grade} GRADE
            </div>
            {/* FIX: stars from explicit field, not broken index calc */}
            <div style={{ display: "flex", gap: 2, marginTop: 5 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} style={{ color: i < info.stars ? info.color : "rgba(255,255,255,0.13)", fontSize: "0.85rem" }}>★</span>
              ))}
            </div>
          </div>
        </div>

        {/* Score */}
        <div style={{ textAlign: "center", margin: "10px 0 6px" }}>
          <span style={{ fontSize: "3.6rem", fontWeight: 900, letterSpacing: "-2px", color: info.color }}>{score}</span>
          <span style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.28)", fontWeight: 600 }}> / {totalQ}</span>
        </div>

        {/* Rank stats */}
        <div style={S.rankCard}>
          <div style={{ display: "flex" }}>
            {([
              [t.topLabel,  `${topPct}%`],
              [t.top100,    `${rankOf100}`],  // FIX: no hardcoded "位" — t.top100 already contains label
              [t.accuracy,  `${accuracy}%`],
            ] as [string, string][]).map(([lb, vl], i) => (
              <div key={i} style={{ flex: 1, textAlign: "center", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none", padding: "0 4px" }}>
                <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.38)", marginBottom: 3 }}>{lb}</div>
                <div style={{ fontSize: "1.7rem", fontWeight: 900, color: info.color, letterSpacing: "-0.5px" }}>{vl}</div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.18)", fontSize: "0.6rem", marginTop: 8 }}>{t.rankNote}</p>
        </div>

        {/* Tabs */}
        <div style={S.tabBar}>
          {t.tabs.map((lb, i) => (
            <button key={i} style={{ ...S.tabBtn, ...(tab === i ? S.tabActive : {}) }} onClick={() => setTab(i)}>
              {lb}
            </button>
          ))}
        </div>

        {/* Tab: Stats */}
        {tab === 0 && (
          <div style={S.statsGrid}>
            {([
              [t.statCorrect, `${score}`],
              [t.statWrong,   `${totalQ - score}`],
              [t.statCombo,   `${maxStreak}`],
              [t.statPts,     points.toLocaleString()],
              [t.statGrade,   info.grade],
              [t.statTop,     `${topPct}%`],
            ] as [string, string][]).map(([lb, vl]) => (
              <div key={lb} style={S.statBox}>
                <div style={S.statLabel}>{lb}</div>
                <div style={S.statVal}>{vl}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Missed */}
        {tab === 1 && (
          <div style={S.scrollBox}>
            {wrongList.length === 0
              ? <p style={S.perfectMsg}>{t.wrongNone}</p>
              : wrongList.map((h, i) => (
                <div key={i} style={S.wrongRow}>
                  <span style={{ fontSize: "1.75rem", lineHeight: 1 }}>{h.flag.emoji}</span>
                  <div>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.86rem" }}>
                      {h.flag.names[lang] ?? h.flag.names.en}
                    </div>
                    <div style={{ fontSize: "0.66rem", color: SUBREGION[h.flag.r as SubRegionKey]?.color ?? "#aaa", fontWeight: 600, marginTop: 2 }}>
                      {srLabel(h.flag.r as SubRegionKey)}
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* Tab: Regions */}
        {tab === 2 && (
          <div style={S.scrollBox}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", marginBottom: 10 }}>{t.regionScore}</p>
            {Object.entries(regionStats)
              .sort(([, a], [, b]) => (b.correct / b.total) - (a.correct / a.total))
              .map(([r, st]) => {
                const pct = Math.round((st.correct / st.total) * 100);
                const col = SUBREGION[r as SubRegionKey]?.color ?? "#aaa";
                return (
                  <div key={r} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: "0.75rem", color: col, fontWeight: 700 }}>{srLabel(r as SubRegionKey)}</span>
                      <span style={{ fontSize: "0.75rem", color: "#fff", fontWeight: 900 }}>{st.correct}/{st.total} ({pct}%)</span>
                    </div>
                    <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: col, borderRadius: 99, transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Tab: All Ranks */}
        {tab === 3 && (
          <div style={S.scrollBox}>
            {RANK_TABLE.map((r, i) => {
              const rLocal   = lang === "ja" ? r.ja : r.en;
              const isMyRank = r === info;
              return (
                <div key={i} style={{ ...S.rankRow2, ...(isMyRank ? { border: `1px solid ${r.color}55`, background: r.color + "0C" } : {}) }}>
                  <div style={{ ...S.rankCircle, borderColor: r.color, color: r.color }}>{r.grade}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: r.color, fontWeight: 800, fontSize: "0.85rem" }}>{rLocal.title}</div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", marginTop: 2, lineHeight: 1.45 }}>{rLocal.desc}</div>
                  </div>
                  {isMyRank && <span style={{ fontSize: "0.66rem", color: r.color, fontWeight: 800, whiteSpace: "nowrap", marginLeft: 6 }}>▶ YOU</span>}
                </div>
              );
            })}
          </div>
        )}

        <button style={S.retryBtn} className="pressable" onClick={onRetry}>{t.retry}</button>
      </div>
      <GlobalCSS />
    </Shell>
  );
};

// ════════════════════════════════════════════════════════════════════
// SHELL
// ════════════════════════════════════════════════════════════════════

interface ShellProps { children: ReactNode; center?: boolean; top?: boolean; }
const Shell: FC<ShellProps> = ({ children, center, top }) => (
  <div style={{
    minHeight: "100vh",
    background: "#0B0B16",
    display: "flex", flexDirection: "column",
    alignItems: "center",
    // FIX: explicit fallback when neither center nor top
    justifyContent: center ? "center" : "flex-start",
    padding: top ? "16px 12px 56px" : "12px",
    fontFamily: "'Noto Sans JP', 'Hiragino Sans', sans-serif",
  }}>
    {/* Subtle ambient glow */}
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
      background: "radial-gradient(ellipse 55% 35% at 18% 65%, rgba(255,100,50,0.055) 0%, transparent 68%), radial-gradient(ellipse 45% 45% at 82% 28%, rgba(80,160,255,0.055) 0%, transparent 68%)",
    }} />
    <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 460, margin: "0 auto" }}>
      {children}
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════════
// DYNAMIC STYLES
// ════════════════════════════════════════════════════════════════════

function choiceStyle(v: ChoiceVariant): CSSProperties {
  const base: CSSProperties = {
    display: "flex", alignItems: "center", gap: 9,
    width: "100%", padding: "12px 13px", borderRadius: 11,
    fontSize: "0.875rem", fontWeight: 700,
    cursor: v === "idle" ? "pointer" : "default",
    fontFamily: "'Noto Sans JP', sans-serif",
    border: "1.5px solid", outline: "none",
    transition: "all 0.12s",
  };
  switch (v) {
    case "correct": return { ...base, borderColor: "#34D399", background: "rgba(52,211,153,0.13)", color: "#34D399" };
    case "wrong":   return { ...base, borderColor: "#F87171", background: "rgba(248,113,113,0.13)", color: "#F87171" };
    case "dim":     return { ...base, borderColor: "rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)", color: "rgba(255,255,255,0.2)" };
    default:        return { ...base, borderColor: "rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.035)", color: "#fff" };
  }
}

function alphaStyle(v: ChoiceVariant): CSSProperties {
  const base: CSSProperties = { width: 22, height: 22, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.66rem", fontWeight: 900, flexShrink: 0 };
  switch (v) {
    case "correct": return { ...base, background: "rgba(52,211,153,0.25)",  color: "#34D399" };
    case "wrong":   return { ...base, background: "rgba(248,113,113,0.25)", color: "#F87171" };
    case "dim":     return { ...base, background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.16)" };
    default:        return { ...base, background: "rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.65)" };
  }
}

// ════════════════════════════════════════════════════════════════════
// STATIC STYLES — typed CSSProperties object
// ════════════════════════════════════════════════════════════════════

type StyleMap = Record<string, CSSProperties>;

const cardBase: CSSProperties = {
  background: "rgba(255,255,255,0.032)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 20,
  boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset, 0 18px 52px rgba(0,0,0,0.48)",
};

const S: StyleMap = {
  // ── Lang bar ──
  langBar:    { display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", marginBottom: 10, padding: "5px 8px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.065)", borderRadius: 12 },
  langBtn:    { padding: "3px 7px", borderRadius: 7, border: "1px solid transparent", background: "transparent", color: "rgba(255,255,255,0.35)", fontSize: "0.68rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans JP', sans-serif" },
  langActive: { background: "rgba(255,155,0,0.16)", borderColor: "rgba(255,155,0,0.38)", color: "#FBBF24" },

  // ── Card ──
  card:       { ...cardBase, padding: "20px 18px 24px" },

  // ── Start ──
  globe:      { textAlign: "center", fontSize: "3.2rem", marginBottom: 6, filter: "drop-shadow(0 4px 16px rgba(255,195,50,0.38))" },
  heroTitle:  { textAlign: "center", fontSize: "2.2rem", fontWeight: 900, color: "#fff", letterSpacing: "-1.5px", lineHeight: 1, margin: 0 },
  heroEn:     { textAlign: "center", fontSize: "0.6rem", letterSpacing: "4px", color: "rgba(255,175,0,0.5)", fontWeight: 700, marginTop: 5, marginBottom: 16 },
  divider:    { height: 1, background: "rgba(255,255,255,0.065)", marginBottom: 14 },
  infoGrid:   { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7, marginBottom: 18 },
  infoBox:    { background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.065)", borderRadius: 10, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 3 },
  infoLabel:  { fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", fontWeight: 600 },
  infoVal:    { fontSize: "0.78rem", color: "#fff", fontWeight: 800 },
  selectQLabel: { textAlign: "center", color: "rgba(255,255,255,0.45)", fontSize: "0.78rem", marginBottom: 9, fontWeight: 600 },
  qSelRow:    { display: "flex", gap: 9, marginBottom: 14 },
  qSelBtn:    { flex: 1, padding: "12px 0", background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.09)", borderRadius: 11, color: "rgba(255,255,255,0.55)", fontSize: "0.95rem", fontWeight: 800, cursor: "pointer", fontFamily: "'Noto Sans JP', sans-serif" },
  qSelActive: { background: "rgba(255,140,0,0.16)", borderColor: "rgba(255,140,0,0.45)", color: "#FFD200" },
  startBtn:   { width: "100%", padding: "14px", background: "linear-gradient(135deg, #FF6B35, #FFD200)", border: "none", borderRadius: 12, fontSize: "0.92rem", fontWeight: 900, color: "#0B0B16", cursor: "pointer", letterSpacing: "2px", marginBottom: 8, fontFamily: "'Noto Sans JP', sans-serif" },
  startNote:  { textAlign: "center", color: "rgba(255,255,255,0.22)", fontSize: "0.7rem", margin: 0 },

  // ── Game ──
  hud:        { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 },
  qNum:       { color: "#fff", lineHeight: 1 },
  streakBadge:{ background: "rgba(255,135,0,0.16)", border: "1px solid rgba(255,135,0,0.38)", color: "#FBBF24", borderRadius: 99, padding: "2px 8px", fontSize: "0.72rem", fontWeight: 800 },
  ptsBadge:   { background: "rgba(255,255,255,0.055)", border: "1px solid rgba(255,255,255,0.09)", color: "#fff", borderRadius: 99, padding: "3px 11px", fontSize: "0.8rem" },
  progressBg: { height: 2, background: "rgba(255,255,255,0.07)", borderRadius: 99, marginBottom: 14, overflow: "hidden" },
  progressFill:{ height: "100%", background: "linear-gradient(90deg, #FF6B35, #FFD200)", borderRadius: 99, transition: "width 0.28s ease" },
  flagArea:   { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 10, animation: "popIn 0.28s cubic-bezier(.34,1.56,.64,1)" },
  flagEmoji:  { fontSize: "5.8rem", lineHeight: 1, filter: "drop-shadow(0 5px 18px rgba(0,0,0,0.48))" },
  regionPill: { fontSize: "0.66rem", fontWeight: 700, padding: "2px 11px", borderRadius: 99 },
  questionTxt:{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.82rem", fontWeight: 500, marginBottom: 11 },
  choiceGrid: { display: "flex", flexDirection: "column", gap: 7 },
  combo:      { position: "fixed", top: "38%", left: "50%", transform: "translate(-50%,-50%)", background: "linear-gradient(135deg,#FF6B35,#FFD200)", color: "#0B0B16", fontWeight: 900, fontSize: "1.25rem", borderRadius: 14, padding: "12px 24px", boxShadow: "0 6px 32px rgba(255,155,0,0.48)", pointerEvents: "none", zIndex: 100, animation: "comboPop 1.1s ease forwards", whiteSpace: "nowrap" },

  // ── Result ──
  gradePanel: { display: "flex", alignItems: "center", gap: 13, border: "1px solid", borderRadius: 14, padding: "13px 15px", marginBottom: 12 },
  gradeCircle:{ width: 52, height: 52, borderRadius: "50%", border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", fontWeight: 900, flexShrink: 0 },
  rankCard:   { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.065)", borderRadius: 12, padding: "12px", marginBottom: 12 },
  tabBar:     { display: "flex", gap: 5, marginBottom: 11, overflowX: "auto", paddingBottom: 2 },
  tabBtn:     { flexShrink: 0, padding: "6px 9px", background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Noto Sans JP', sans-serif", whiteSpace: "nowrap" },
  tabActive:  { background: "rgba(255,135,0,0.13)", borderColor: "rgba(255,135,0,0.32)", color: "#FBBF24" },
  statsGrid:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 14 },
  statBox:    { background: "rgba(255,255,255,0.035)", borderRadius: 10, padding: "9px 11px", border: "1px solid rgba(255,255,255,0.055)" },
  statLabel:  { fontSize: "0.6rem", color: "rgba(255,255,255,0.35)", marginBottom: 3 },
  statVal:    { fontSize: "0.92rem", color: "#fff", fontWeight: 900 },
  scrollBox:  { maxHeight: 270, overflowY: "auto", marginBottom: 12 },
  wrongRow:   { display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 9, background: "rgba(255,255,255,0.022)", border: "1px solid rgba(248,113,113,0.1)", marginBottom: 5 },
  perfectMsg: { textAlign: "center", color: "rgba(255,255,255,0.4)", padding: "14px 0", margin: 0, fontSize: "0.88rem" },
  rankRow2:   { display: "flex", alignItems: "flex-start", gap: 9, padding: "9px 11px", borderRadius: 9, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.055)", marginBottom: 5 },
  rankCircle: { width: 34, height: 34, borderRadius: "50%", border: "1.5px solid", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 900, flexShrink: 0, marginTop: 1 },
  retryBtn:   { width: "100%", padding: "13px", background: "linear-gradient(135deg,#FF6B35,#FFD200)", border: "none", borderRadius: 12, fontSize: "0.88rem", fontWeight: 900, color: "#0B0B16", cursor: "pointer", letterSpacing: "1px", fontFamily: "'Noto Sans JP', sans-serif" },
};

// ════════════════════════════════════════════════════════════════════
// GLOBAL CSS
// ════════════════════════════════════════════════════════════════════

const GlobalCSS: FC = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0B0B16; }

    @keyframes popIn {
      from { transform: scale(0.52) translateY(8px); opacity: 0; }
      to   { transform: scale(1)    translateY(0);   opacity: 1; }
    }
    @keyframes comboPop {
      0%   { transform: translate(-50%,-50%) scale(0.25); opacity: 0; }
      40%  { transform: translate(-50%,-50%) scale(1.06); opacity: 1; }
      75%  { transform: translate(-50%,-50%) scale(1);    opacity: 1; }
      100% { transform: translate(-50%,-50%) scale(1);    opacity: 0; }
    }

    .pressable { transition: transform 0.09s, opacity 0.09s; }
    .pressable:hover:not(:disabled)  { opacity: 0.82; transform: translateY(-1px); }
    .pressable:active:not(:disabled) { transform: scale(0.97) translateY(1px) !important; opacity: 1; }

    ::-webkit-scrollbar       { width: 3px; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.11); border-radius: 3px; }
  `}</style>
);
