import { PrismaClient, Role, ArticleStatus, CefrLevel } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

interface VocabDef {
  word: string;
  normalizedLemma: string;
  ipa: string;
  pos: string;
  meaningVi: string;
  exampleEn: string;
  exampleVi: string;
  cefrLevel: CefrLevel;
}

interface HighlightDef {
  vocabKey: string;
  highlightedText: string;
}

interface SentenceDef {
  textEn: string;
  textVi: string;
  highlights: HighlightDef[];
}

interface ArticleDef {
  slug: string;
  titleEn: string;
  titleVi: string;
  excerptEn: string;
  excerptVi: string;
  sourceName: string;
  sourceUrl: string;
  thumbnailUrl: string;
  cefrLevel: CefrLevel;
  categorySlugs: string[];
  readingTimeMinutes: number;
  sentences: SentenceDef[];
}

// 1. GLOBAL VOCABULARY DICTIONARY (Original Educational Content)
const VOCABULARY_REGISTRY: Record<string, VocabDef> = {
  transformative: {
    word: "transformative",
    normalizedLemma: "transform",
    ipa: "/trænsˈfɔːrmətɪv/",
    pos: "adjective",
    meaningVi: "Có tính chất thay đổi căn bản, mang tính đột phá",
    exampleEn: "The digital platform brought transformative changes to classroom learning.",
    exampleVi: "Nền tảng kỹ thuật số đã mang lại những thay đổi đột phá cho việc học tập trên lớp.",
    cefrLevel: "B2",
  },
  "paradigm shift": {
    word: "paradigm shift",
    normalizedLemma: "paradigm shift",
    ipa: "/ˈpærədaɪm ʃɪft/",
    pos: "idiom",
    meaningVi: "Sự thay đổi mang tính hệ hình, chuyển biến căn bản",
    exampleEn: "Remote collaboration tools triggered a permanent paradigm shift in corporate culture.",
    exampleVi: "Các công cụ cộng tác từ xa đã kích hoạt một sự thay đổi hệ hình lâu dài trong văn hóa doanh nghiệp.",
    cefrLevel: "C1",
  },
  mitigate: {
    word: "mitigate",
    normalizedLemma: "mitigate",
    ipa: "/ˈmɪtɪɡeɪt/",
    pos: "verb",
    meaningVi: "Giảm nhẹ, làm dịu bớt (tác hại, rủi ro)",
    exampleEn: "Comprehensive flood barriers help mitigate damage caused by seasonal typhoons.",
    exampleVi: "Hệ thống đê ngăn lũ toàn diện giúp giảm thiểu thiệt hại do các cơn bão theo mùa gây ra.",
    cefrLevel: "B2",
  },
  bottlenecks: {
    word: "bottlenecks",
    normalizedLemma: "bottleneck",
    ipa: "/ˈbɑːtlneks/",
    pos: "noun",
    meaningVi: "Các điểm nghẽn, trở ngại cản trở lưu thông hoặc tiến độ",
    exampleEn: "Supply shortages created severe bottlenecks in semiconductor manufacturing.",
    exampleVi: "Tình trạng thiếu hụt nguồn cung đã tạo ra các điểm nghẽn nghiêm trọng trong sản xuất chất bán dẫn.",
    cefrLevel: "B2",
  },
  bolster: {
    word: "bolster",
    normalizedLemma: "bolster",
    ipa: "/ˈboʊlstər/",
    pos: "verb",
    meaningVi: "Củng cố, tăng cường, gia cố",
    exampleEn: "The central bank introduced fiscal measures to bolster domestic consumer confidence.",
    exampleVi: "Ngân hàng trung ương đã đưa ra các biện pháp tài khóa nhằm củng cố niềm tin của người tiêu dùng nội địa.",
    cefrLevel: "B2",
  },
  resilience: {
    word: "resilience",
    normalizedLemma: "resilience",
    ipa: "/rɪˈzɪliəns/",
    pos: "noun",
    meaningVi: "Khả năng phục hồi, tính bền bỉ dẻo dai",
    exampleEn: "Emotional resilience enables professionals to handle prolonged workplace pressure.",
    exampleVi: "Sự kiên cường về mặt cảm xúc giúp các chuyên gia xử lý được áp lực kéo dài nơi công sở.",
    cefrLevel: "B2",
  },
  unprecedented: {
    word: "unprecedented",
    normalizedLemma: "precedent",
    ipa: "/ʌnˈpresɪdentɪd/",
    pos: "adjective",
    meaningVi: "Chưa từng có tiền lệ, chưa từng thấy trong lịch sử",
    exampleEn: "The meteorological institute reported unprecedented summer temperatures across the continent.",
    exampleVi: "Viện khí tượng báo cáo mức nhiệt độ mùa hè chưa từng có trên toàn lục địa.",
    cefrLevel: "C1",
  },
  dependencies: {
    word: "dependencies",
    normalizedLemma: "dependency",
    ipa: "/dɪˈpendənsiz/",
    pos: "noun",
    meaningVi: "Sự phụ thuộc, các mối liên thuộc",
    exampleEn: "Over-reliance on imported energy creates critical dependencies during geopolitical tension.",
    exampleVi: "Việc phụ thuộc quá mức vào năng lượng nhập khẩu tạo ra những sự liên thuộc nguy hiểm trong các căng thẳng địa chính trị.",
    cefrLevel: "C1",
  },
  inherent: {
    word: "inherent",
    normalizedLemma: "inherent",
    ipa: "/ɪnˈhɪrənt/",
    pos: "adjective",
    meaningVi: "Vốn có, cố hữu, không thể tách rời",
    exampleEn: "Every innovative venture carries an inherent level of financial risk.",
    exampleVi: "Mọi dự án khởi nghiệp sáng tạo đều tiềm ẩn một mức độ rủi ro tài chính cố hữu.",
    cefrLevel: "C1",
  },
  protracted: {
    word: "protracted",
    normalizedLemma: "protract",
    ipa: "/prəˈtræktɪd/",
    pos: "adjective",
    meaningVi: "Kéo dài, dai dẳng hơn bình thường",
    exampleEn: "The labor negotiations concluded after a protracted dispute spanning eight months.",
    exampleVi: "Các cuộc đàm phán lao động đã kết thúc sau một tranh chấp kéo dài tới tám tháng.",
    cefrLevel: "C1",
  },
  supersede: {
    word: "supersede",
    normalizedLemma: "supersede",
    ipa: "/ˌsuːpərˈsiːd/",
    pos: "verb",
    meaningVi: "Thay thế, thế chỗ (một điều gì đó cũ hoặc lạc hậu)",
    exampleEn: "High-speed broadband networks gradually superseded legacy copper telecommunication wires.",
    exampleVi: "Mạng băng thông rộng tốc độ cao đã dần thay thế các đường dây viễn thông bằng đồng cũ kỹ.",
    cefrLevel: "C1",
  },
  longevity: {
    word: "longevity",
    normalizedLemma: "longevity",
    ipa: "/lɔːnˈdʒevəti/",
    pos: "noun",
    meaningVi: "Tuổi thọ, sự trường tồn lâu dài",
    exampleEn: "Rigorous quality control processes ensure the longevity of industrial aerospace engines.",
    exampleVi: "Quy trình kiểm soát chất lượng nghiêm ngặt đảm bảo tuổi thọ của các động cơ hàng không vũ trụ công nghiệp.",
    cefrLevel: "C1",
  },
  significantly: {
    word: "significantly",
    normalizedLemma: "significant",
    ipa: "/sɪɡˈnɪfɪkəntli/",
    pos: "adverb",
    meaningVi: "Một cách đáng kể, có ý nghĩa quan trọng",
    exampleEn: "Regular cardiovascular exercise significantly decreases resting blood pressure.",
    exampleVi: "Tập thể dục tim mạch đều đặn làm giảm huyết áp lúc nghỉ một cách đáng kể.",
    cefrLevel: "B1",
  },
  ambient: {
    word: "ambient",
    normalizedLemma: "ambient",
    ipa: "/ˈæmbiənt/",
    pos: "adjective",
    meaningVi: "Xung quanh, bao quanh (môi trường, nhiệt độ)",
    exampleEn: "Dense roadside vegetation shields school grounds from ambient particulate pollution.",
    exampleVi: "Thảm thực vật ven đường dày đặc giúp bảo vệ khuôn viên trường học khỏi ô nhiễm bụi mịn xung quanh.",
    cefrLevel: "B2",
  },
  psychological: {
    word: "psychological",
    normalizedLemma: "psychology",
    ipa: "/ˌsaɪkəˈlɑːdʒɪkl/",
    pos: "adjective",
    meaningVi: "Thuộc về tâm lý, tinh thần",
    exampleEn: "Green urban sanctuaries provide psychological relief from relentless workplace fatigue.",
    exampleVi: "Các khu bảo tồn xanh đô thị mang lại sự giải tỏa tâm lý khỏi sự mệt mỏi công việc triền miên.",
    cefrLevel: "B1",
  },
  collaborative: {
    word: "collaborative",
    normalizedLemma: "collaborate",
    ipa: "/kəˈlæbərətɪv/",
    pos: "adjective",
    meaningVi: "Có tính chất cộng tác, hợp tác chung",
    exampleEn: "Cross-disciplinary researchers formed a collaborative taskforce to address ecological challenges.",
    exampleVi: "Các nhà nghiên cứu liên ngành đã thành lập một nhóm công tác hợp tác để giải quyết các thách thức sinh thái.",
    cefrLevel: "B1",
  },
  cultivate: {
    word: "cultivate",
    normalizedLemma: "cultivate",
    ipa: "/ˈkʌltɪveɪt/",
    pos: "verb",
    meaningVi: "Canh tác, trồng trọt, trau dồi nuôi dưỡng",
    exampleEn: "Volunteers gather on weekends to cultivate native medicinal herbs in the community greenhouse.",
    exampleVi: "Các tình nguyện viên tụ họp vào cuối tuần để gieo trồng các loại thảo dược bản địa trong nhà kính cộng đồng.",
    cefrLevel: "B1",
  },
  beneficial: {
    word: "beneficial",
    normalizedLemma: "benefit",
    ipa: "/ˌbenɪˈfɪʃl/",
    pos: "adjective",
    meaningVi: "Có lợi, mang lại hiệu quả tích cực",
    exampleEn: "Encouraging pedestrian walkways produces beneficial outcomes for urban air quality.",
    exampleVi: "Khuyến khích các lối đi bộ tạo ra những kết quả có lợi cho chất lượng không khí đô thị.",
    cefrLevel: "B1",
  },
};

// 2. ORIGINAL EDUCATIONAL ARTICLES DATA
const ARTICLES_SEED_DATA: ArticleDef[] = [
  {
    slug: "clean-energy-microgrids-urban-resilience",
    titleEn: "How Next-Generation Clean Energy Microgrids Are Transforming Urban Resilience",
    titleVi: "Cách Các Lưới Điện Cực Nhỏ Năng Lượng Sạch Thế Hệ Mới Đang Thay Đổi Khả Năng Phục Hồi Đô Thị",
    excerptEn: "Cities around the world are deploying localized renewable microgrids to maintain essential power during extreme weather events and accelerate decarbonization.",
    excerptVi: "Các thành phố trên thế giới đang triển khai các lưới điện cực nhỏ tái tạo cục bộ nhằm duy trì nguồn điện thiết yếu trong các hiện tượng thời tiết cực đoan và đẩy nhanh quá trình khử cacbon.",
    sourceName: "ReadToImprove Educational Dispatch",
    sourceUrl: "https://readtoimprove.com/edu/microgrids-urban-resilience",
    thumbnailUrl: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80",
    cefrLevel: "B2",
    categorySlugs: ["technology", "science-environment"],
    readingTimeMinutes: 3,
    sentences: [
      {
        textEn: "Decentralized energy microgrids represent a transformative paradigm shift for modern metropolitan infrastructures.",
        textVi: "Các lưới điện cực nhỏ năng lượng phi tập trung thể hiện một sự thay đổi mang tính hệ hình đột phá cho cơ sở hạ tầng đô thị hiện đại.",
        highlights: [
          { vocabKey: "transformative", highlightedText: "transformative" },
          { vocabKey: "paradigm shift", highlightedText: "paradigm shift" },
        ],
      },
      {
        textEn: "By integrating solar arrays with high-density lithium storage batteries, local communities can mitigate vulnerable transmission bottlenecks.",
        textVi: "Bằng cách tích hợp các mảng pin mặt trời với pin lưu trữ lithium mật độ cao, các cộng đồng địa phương có thể giảm nhẹ các điểm nghẽn truyền tải dễ bị tổn thương.",
        highlights: [
          { vocabKey: "mitigate", highlightedText: "mitigate" },
          { vocabKey: "bottlenecks", highlightedText: "bottlenecks" },
        ],
      },
      {
        textEn: "Municipal planners emphasize that autonomous energy networks bolster long-term socioeconomic resilience during unforeseen grid outages.",
        textVi: "Các nhà quy hoạch đô thị nhấn mạnh rằng các mạng lưới năng lượng tự chủ sẽ củng cố khả năng phục hồi kinh tế - xã hội lâu dài trong các đợt mất điện lưới bất ngờ.",
        highlights: [
          { vocabKey: "bolster", highlightedText: "bolster" },
          { vocabKey: "resilience", highlightedText: "resilience" },
        ],
      },
    ],
  },
  {
    slug: "global-supply-chain-diversification-strategies",
    titleEn: "Navigating the Complexities of Global Supply Chain Diversification",
    titleVi: "Định Hướng Những Phức Tạp Trong Các Chiến Lược Đa Dạng Hóa Chuỗi Cung Ứng Toàn Cầu",
    excerptEn: "Multinational enterprises are re-evaluating single-source manufacturing models to mitigate geopolitical volatility and enhance systemic agility.",
    excerptVi: "Các doanh nghiệp đa quốc gia đang đánh giá lại các mô hình sản xuất từ nguồn đơn nhất để giảm thiểu biến động địa chính trị và nâng cao tính linh hoạt mang tính hệ thống.",
    sourceName: "ReadToImprove Economic Perspectives",
    sourceUrl: "https://readtoimprove.com/edu/supply-chain-diversification",
    thumbnailUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
    cefrLevel: "C1",
    categorySlugs: ["business"],
    readingTimeMinutes: 4,
    sentences: [
      {
        textEn: "The unprecedented disruption of international logistics corridors has prompted corporations to fundamentally reassess their operational dependencies.",
        textVi: "Sự gián đoạn chưa từng có tiền lệ của các hành lang hậu cần quốc tế đã thúc đẩy các tập đoàn đánh giá lại một cách căn bản các mối phụ thuộc vận hành của họ.",
        highlights: [
          { vocabKey: "unprecedented", highlightedText: "unprecedented" },
          { vocabKey: "dependencies", highlightedText: "dependencies" },
        ],
      },
      {
        textEn: "Strategic nearshoring initiatives mitigate vulnerabilities inherent in protracted maritime shipping routes.",
        textVi: "Các sáng kiến dịch chuyển sản xuất về gần mang tính chiến lược giúp giảm nhẹ các lỗ hổng cố hữu trên những tuyến vận tải biển kéo dài.",
        highlights: [
          { vocabKey: "inherent", highlightedText: "inherent" },
          { vocabKey: "protracted", highlightedText: "protracted" },
        ],
      },
      {
        textEn: "Economists argue that structural agility must supersede short-term cost minimization to sustain enterprise longevity.",
        textVi: "Các nhà kinh tế học lập luận rằng tính linh hoạt về cấu trúc phải thay thế mục tiêu tối thiểu hóa chi phí ngắn hạn để duy trì sự trường tồn của doanh nghiệp.",
        highlights: [
          { vocabKey: "supersede", highlightedText: "supersede" },
          { vocabKey: "longevity", highlightedText: "longevity" },
        ],
      },
    ],
  },
  {
    slug: "urban-biodiversity-and-greener-cities",
    titleEn: "Urban Biodiversity: Building Greener Communities for Healthier Living",
    titleVi: "Đa Dạng Sinh Học Đô Thị: Xây Dựng Cộng Đồng Xanh Hơn Vì Cuộc Sống Khỏe Mạnh Hơn",
    excerptEn: "Transforming concrete public spaces into native wildflower meadows brings nature back to city centers and improves public mental health.",
    excerptVi: "Biến đổi không gian công cộng bê tông thành đồng cỏ hoa dại bản địa mang thiên nhiên trở lại các trung tâm thành phố và nâng cao sức khỏe tinh thần cộng đồng.",
    sourceName: "ReadToImprove Civic Ecology",
    sourceUrl: "https://readtoimprove.com/edu/urban-biodiversity",
    thumbnailUrl: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=80",
    cefrLevel: "B1",
    categorySlugs: ["health", "science-environment", "culture-society"],
    readingTimeMinutes: 2,
    sentences: [
      {
        textEn: "Planting native trees along busy roads significantly reduces ambient air pollution in crowded neighborhoods.",
        textVi: "Việc trồng các loại cây bản địa dọc theo những con đường đông đúc làm giảm đáng kể mức ô nhiễm không khí xung quanh tại các khu dân cư đông đúc.",
        highlights: [
          { vocabKey: "significantly", highlightedText: "significantly" },
          { vocabKey: "ambient", highlightedText: "ambient" },
        ],
      },
      {
        textEn: "Access to community gardens provides psychological benefits and encourages collaborative neighborhood activities.",
        textVi: "Việc tiếp cận các khu vườn cộng đồng mang lại nhiều lợi ích tâm lý và khuyến khích các hoạt động láng giềng mang tính cộng tác.",
        highlights: [
          { vocabKey: "psychological", highlightedText: "psychological" },
          { vocabKey: "collaborative", highlightedText: "collaborative" },
        ],
      },
      {
        textEn: "Local councils are encouraging residents to cultivate balcony plants to support beneficial pollinator insects.",
        textVi: "Các hội đồng địa phương đang khuyến khích cư dân trồng cây trên ban công để hỗ trợ các loài côn trùng thụ phấn có lợi.",
        highlights: [
          { vocabKey: "cultivate", highlightedText: "cultivate" },
          { vocabKey: "beneficial", highlightedText: "beneficial" },
        ],
      },
    ],
  },
];

async function main() {
  console.log("Starting ReadToImprove database seed with original educational content...");

  // 1. Seed Categories
  const categoriesData = [
    { slug: "technology", nameEn: "Technology", nameVi: "Công nghệ", description: "Tin tức công nghệ, chuyển đổi số và trí tuệ nhân tạo", orderIndex: 1 },
    { slug: "business", nameEn: "Business & Economy", nameVi: "Kinh tế & Doanh nghiệp", description: "Tài chính quốc tế, thương mại và chuỗi cung ứng", orderIndex: 2 },
    { slug: "science-environment", nameEn: "Science & Environment", nameVi: "Khoa học & Môi trường", description: "Khí hậu, năng lượng tái tạo và đa dạng sinh học", orderIndex: 3 },
    { slug: "health", nameEn: "Health & Wellness", nameVi: "Sức khỏe & Đời sống", description: "Y học cộng đồng, sức khỏe tinh thần và dinh dưỡng", orderIndex: 4 },
    { slug: "culture-society", nameEn: "Culture & Society", nameVi: "Văn hóa & Xã hội", description: "Xu hướng xã hội, giáo dục và giao lưu văn hóa", orderIndex: 5 },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categoriesData) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { nameEn: cat.nameEn, nameVi: cat.nameVi, description: cat.description, orderIndex: cat.orderIndex },
      create: cat,
    });
    categoryMap.set(cat.slug, record.id);
  }
  console.log(`✓ Seeded ${categoriesData.length} categories.`);

  // 2. Seed Users (Admin + Test User)
  const adminEmail = process.env.ADMIN_EMAIL || "admin@readtoimprove.com";
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || "AdminDevSecret2026!ChangeMe";
  const adminHash = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.ADMIN, isActive: true },
    create: {
      email: adminEmail,
      name: "Project Administrator",
      passwordHash: adminHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const testUserEmail = "learner@example.com";
  const testUserHash = await bcrypt.hash("Learner2026!Password", 12);
  const testUser = await prisma.user.upsert({
    where: { email: testUserEmail },
    update: { role: Role.USER },
    create: {
      email: testUserEmail,
      name: "English Learner (IELTS)",
      passwordHash: testUserHash,
      role: Role.USER,
      isActive: true,
    },
  });
  console.log(`✓ Seeded Admin (${adminUser.email}) and Test User (${testUser.email}).`);

  // 3. Seed Global Vocabulary Registry
  const vocabMap = new Map<string, string>();
  for (const [key, vDef] of Object.entries(VOCABULARY_REGISTRY)) {
    const existing = await prisma.vocabulary.findFirst({
      where: { word: vDef.word, cefrLevel: vDef.cefrLevel },
    });
    if (existing) {
      vocabMap.set(key, existing.id);
    } else {
      const created = await prisma.vocabulary.create({
        data: {
          word: vDef.word,
          normalizedLemma: vDef.normalizedLemma,
          ipa: vDef.ipa,
          pos: vDef.pos,
          meaningVi: vDef.meaningVi,
          exampleEn: vDef.exampleEn,
          exampleVi: vDef.exampleVi,
          cefrLevel: vDef.cefrLevel,
        },
      });
      vocabMap.set(key, created.id);
    }
  }
  console.log(`✓ Seeded ${Object.keys(VOCABULARY_REGISTRY).length} global vocabulary records.`);

  // 4. Seed Articles, Sentences & SentenceVocabulary with Exact Offset Computation
  for (const articleDef of ARTICLES_SEED_DATA) {
    // Upsert Article
    const article = await prisma.article.upsert({
      where: { slug: articleDef.slug },
      update: {
        titleEn: articleDef.titleEn,
        titleVi: articleDef.titleVi,
        excerptEn: articleDef.excerptEn,
        excerptVi: articleDef.excerptVi,
        sourceName: articleDef.sourceName,
        sourceUrl: articleDef.sourceUrl,
        thumbnailUrl: articleDef.thumbnailUrl,
        cefrLevel: articleDef.cefrLevel,
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date(),
        readingTimeMinutes: articleDef.readingTimeMinutes,
      },
      create: {
        slug: articleDef.slug,
        titleEn: articleDef.titleEn,
        titleVi: articleDef.titleVi,
        excerptEn: articleDef.excerptEn,
        excerptVi: articleDef.excerptVi,
        sourceName: articleDef.sourceName,
        sourceUrl: articleDef.sourceUrl,
        thumbnailUrl: articleDef.thumbnailUrl,
        cefrLevel: articleDef.cefrLevel,
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date(),
        readingTimeMinutes: articleDef.readingTimeMinutes,
        metaTitle: `${articleDef.titleEn} | ReadToImprove`,
        metaDescription: articleDef.excerptVi,
      },
    });

    // Link Categories
    for (const catSlug of articleDef.categorySlugs) {
      const catId = categoryMap.get(catSlug);
      if (catId) {
        await prisma.articleCategory.upsert({
          where: {
            articleId_categoryId: {
              articleId: article.id,
              categoryId: catId,
            },
          },
          update: {},
          create: {
            articleId: article.id,
            categoryId: catId,
          },
        });
      }
    }

    // Clean up existing sentences for this article if re-seeding to prevent unique constraint conflicts
    await prisma.sentence.deleteMany({
      where: { articleId: article.id },
    });

    // Create Sentences and SentenceVocabulary mappings
    for (let i = 0; i < articleDef.sentences.length; i++) {
      const sDef = articleDef.sentences[i];
      const orderIndex = i + 1;

      const sentence = await prisma.sentence.create({
        data: {
          articleId: article.id,
          orderIndex: orderIndex,
          textEn: sDef.textEn,
          textVi: sDef.textVi,
        },
      });

      // Calculate and verify exact character offsets
      const highlightRanges: Array<{ start: number; end: number }> = [];

      for (const h of sDef.highlights) {
        const vocabId = vocabMap.get(h.vocabKey);
        if (!vocabId) {
          throw new Error(`Vocabulary key "${h.vocabKey}" not found in registry!`);
        }

        const startOffset = sDef.textEn.indexOf(h.highlightedText);
        if (startOffset === -1) {
          throw new Error(
            `Highlighted text "${h.highlightedText}" not found in sentence: "${sDef.textEn}"`
          );
        }
        const endOffset = startOffset + h.highlightedText.length;

        // Mathematical invariants check
        if (startOffset < 0 || endOffset > sDef.textEn.length || startOffset >= endOffset) {
          throw new Error(`Invalid offset range [${startOffset}, ${endOffset}] in sentence`);
        }

        // Substring slice assertion
        const sliced = sDef.textEn.slice(startOffset, endOffset);
        if (sliced !== h.highlightedText) {
          throw new Error(`Slice mismatch: "${sliced}" !== "${h.highlightedText}"`);
        }

        // Non-overlapping check
        for (const range of highlightRanges) {
          if (startOffset < range.end && endOffset > range.start) {
            throw new Error(`Overlapping highlights detected in sentence ${sentence.id}`);
          }
        }
        highlightRanges.push({ start: startOffset, end: endOffset });

        await prisma.sentenceVocabulary.create({
          data: {
            sentenceId: sentence.id,
            vocabularyId: vocabId,
            startOffset: startOffset,
            endOffset: endOffset,
            highlightedText: h.highlightedText,
          },
        });
      }
    }
  }
  console.log(`✓ Seeded ${ARTICLES_SEED_DATA.length} original educational bilingual articles with verified offsets.`);

  // 5. Seed sample UserSavedVocabulary and ReadingHistory for test user
  const sampleVocabId = vocabMap.get("transformative");
  if (sampleVocabId) {
    await prisma.userSavedVocabulary.upsert({
      where: {
        userId_vocabularyId: {
          userId: testUser.id,
          vocabularyId: sampleVocabId,
        },
      },
      update: {},
      create: {
        userId: testUser.id,
        vocabularyId: sampleVocabId,
        notes: "Remember to use this in IELTS Speaking Part 3!",
        isMastered: false,
      },
    });
  }

  const sampleArticle = await prisma.article.findFirst({
    where: { slug: "clean-energy-microgrids-urban-resilience" },
  });
  if (sampleArticle) {
    await prisma.readingHistory.upsert({
      where: {
        userId_articleId: {
          userId: testUser.id,
          articleId: sampleArticle.id,
        },
      },
      update: { readPercentage: 100, completed: true },
      create: {
        userId: testUser.id,
        articleId: sampleArticle.id,
        readPercentage: 100,
        completed: true,
      },
    });
  }

  console.log("Database seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error during database seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
