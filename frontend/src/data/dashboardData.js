export const dashboardData = {
  totalRequired: 128,
  totalEarned: 110,
  lastUpdated: "2026-05-19",
  catalogYear: "113學年度",
  categories: [
    {
      id: "general",
      title: "通識課程",
      subtitle: "General Education",
      required: 28,
      earned: 26,
      unit: "學分",
      status: "warn",
      fromColor: "#FA855A",
      toColor: "#C93638",
      warnings: ["通識尚缺 2 學分"],
      items: [
        { name: "中文通", done: true },
        { name: "外文通", done: true },
        { name: "一般通識", done: false },
      ],
      records: [
        { sem: "110-1", name: "基礎國文", credit: 2, score: 85, type: "中文通", ok: true },
        { sem: "110-2", name: "大一英文", credit: 2, score: 78, type: "外文通", ok: true },
        { sem: "111-1", name: "哲學概論", credit: 2, score: 90, type: "一般", ok: true },
        { sem: "-", name: "某通識課", credit: 2, score: "-", type: "一般", ok: false },
      ]
    },
    {
      id: "core",
      title: "共同必修",
      subtitle: "Common Core",
      required: 4,
      earned: 4,
      unit: "門",
      status: "ok",
      fromColor: "#62C4DA",
      toColor: "#2A8FAA",
      warnings: [],
      items: [
        { name: "體育 (1)", done: true },
        { name: "體育 (2)", done: true },
        { name: "服務學習 (一)", done: true },
        { name: "服務學習 (二)", done: true },
      ],
      records: [
        { sem: "110-1", name: "體育 (1)", credit: 0, score: "P", type: "必修", ok: true },
        { sem: "110-2", name: "體育 (2)", credit: 0, score: "P", type: "必修", ok: true },
        { sem: "110-1", name: "服務學習 (一)", credit: 0, score: "P", type: "必修", ok: true },
        { sem: "110-2", name: "服務學習 (二)", credit: 0, score: "P", type: "必修", ok: true },
      ]
    },
    {
      id: "major",
      title: "本系必修/群修",
      subtitle: "Major Core",
      required: 51,
      earned: 45,
      unit: "學分",
      status: "alert",
      fromColor: "#C93638",
      toColor: "#7A1A1C",
      warnings: [
        "必修：缺「作業系統」、「計算機結構與組織」",
        "群修：缺A群2門、B群1門、C群1門、D群1門、E群1門",
      ],
      items: [
        { name: "必修科目 (36學分)", done: false },
        { name: "群修科目 (15學分)", done: false },
      ],
      records: [
        { sem: "110-1", name: "計算機概論", credit: 3, score: 88, type: "必修", ok: true },
        { sem: "110-2", name: "程式設計(一)", credit: 3, score: 92, type: "必修", ok: true },
        { sem: "111-1", name: "資料結構", credit: 3, score: 75, type: "必修", ok: true },
        { sem: "-", name: "作業系統", credit: 3, score: "-", type: "必修", ok: false },
        { sem: "-", name: "計算機結構與組織", credit: 3, score: "-", type: "必修", ok: false },
      ]
    },
    {
      id: "outside",
      title: "外系選修",
      subtitle: "Electives",
      required: 45,
      earned: 15,
      unit: "學分",
      status: "warn",
      fromColor: "#FFDE96",
      toColor: "#E8A830",
      warnings: [],
      items: [
        { name: "外系選修", done: false },
      ],
      records: [
        { sem: "112-1", name: "經濟學原理", credit: 3, score: 82, type: "外系", ok: true },
        { sem: "112-2", name: "心理學導論", credit: 3, score: 80, type: "外系", ok: true },
      ]
    },
  ],
};
