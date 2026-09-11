import { PrismaClient, ArticleStatus, CefrLevel } from "@prisma/client";

const prisma = new PrismaClient();

interface TestCaseResult {
  id: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestCaseResult[] = [];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function recordResult(id: string, name: string, passed: boolean, details: string) {
  results.push({ id, name, passed, details });
  const statusIcon = passed ? "✓ PASS" : "✗ FAIL";
  console.log(`[${statusIcon}] ${id}: ${name} — ${details}`);
}

async function runVerification() {
  console.log("================================================================================");
  console.log("ReadToImprove Phase 2 — Automated Database & Integrity Verification Suite");
  console.log("================================================================================\n");

  // TC-DB-01: Database Connectivity & Engine Initialization
  try {
    await prisma.$connect();
    recordResult("TC-DB-01", "Database Connectivity", true, "Successfully connected to PostgreSQL on port 5433.");
  } catch (error: unknown) {
    recordResult("TC-DB-01", "Database Connectivity", false, getErrorMessage(error));
  }

  // TC-DB-02: Seeder Record Counts Verification
  try {
    const userCount = await prisma.user.count();
    const articleCount = await prisma.article.count();
    const categoryCount = await prisma.category.count();
    const vocabCount = await prisma.vocabulary.count();
    const sentenceCount = await prisma.sentence.count();
    const mappingCount = await prisma.sentenceVocabulary.count();

    const passed =
      userCount >= 2 &&
      articleCount === 3 &&
      categoryCount === 5 &&
      vocabCount === 18 &&
      sentenceCount === 9 &&
      mappingCount === 18;

    recordResult(
      "TC-DB-02",
      "Seeded Record Counts Verification",
      passed,
      `Users: ${userCount}, Articles: ${articleCount}, Categories: ${categoryCount}, Vocab: ${vocabCount}, Sentences: ${sentenceCount}, Mappings: ${mappingCount}.`
    );
  } catch (error: unknown) {
    recordResult("TC-DB-02", "Seeded Record Counts Verification", false, getErrorMessage(error));
  }

  // TC-DB-03: Deep Relational Traversal (Article -> Sentence -> SentenceVocabulary -> Vocabulary)
  try {
    const article = await prisma.article.findFirst({
      where: { slug: "clean-energy-microgrids-urban-resilience" },
      include: {
        categories: { include: { category: true } },
        sentences: {
          orderBy: { orderIndex: "asc" },
          include: {
            vocabularies: {
              include: { vocabulary: true },
            },
          },
        },
      },
    });

    const passed =
      article !== null &&
      article.categories.length === 2 &&
      article.sentences.length === 3 &&
      article.sentences[0].vocabularies.length === 2 &&
      article.sentences[0].vocabularies[0].vocabulary.word !== undefined;

    recordResult(
      "TC-DB-03",
      "Deep Relational Traversal",
      passed,
      `Successfully traversed Article "${article?.titleEn.slice(0, 30)}..." through Sentences to Vocabulary.`
    );
  } catch (error: unknown) {
    recordResult("TC-DB-03", "Deep Relational Traversal", false, getErrorMessage(error));
  }

  // Fetch all sentences and mappings for offset testing
  const allSentences = await prisma.sentence.findMany({
    include: {
      vocabularies: {
        include: { vocabulary: true },
      },
    },
  });

  // TC-DB-04: Offset Mathematical Invariants Check
  try {
    let boundsValid = true;
    let failureDetail = "";

    for (const s of allSentences) {
      for (const m of s.vocabularies) {
        if (m.startOffset < 0 || m.endOffset > s.textEn.length || m.startOffset >= m.endOffset) {
          boundsValid = false;
          failureDetail = `Sentence ${s.id} has invalid offset [${m.startOffset}, ${m.endOffset}] with text length ${s.textEn.length}`;
          break;
        }
      }
      if (!boundsValid) break;
    }

    recordResult(
      "TC-DB-04",
      "Offset Mathematical Bounds (startOffset >= 0, endOffset <= length, startOffset < endOffset)",
      boundsValid,
      boundsValid ? "All 18 vocabulary highlight offsets satisfy mathematical bounds." : failureDetail
    );
  } catch (error: unknown) {
    recordResult("TC-DB-04", "Offset Mathematical Bounds", false, getErrorMessage(error));
  }

  // TC-DB-05: Slicing Identity Assertion
  try {
    let sliceValid = true;
    let failureDetail = "";

    for (const s of allSentences) {
      for (const m of s.vocabularies) {
        if (m.highlightedText === "") {
          sliceValid = false;
          failureDetail = `Sentence ${s.id} has empty highlightedText.`;
          break;
        }
        const sliced = s.textEn.slice(m.startOffset, m.endOffset);
        if (sliced !== m.highlightedText) {
          sliceValid = false;
          failureDetail = `Sentence ${s.id}: slice "${sliced}" !== highlightedText "${m.highlightedText}"`;
          break;
        }
      }
      if (!sliceValid) break;
    }

    recordResult(
      "TC-DB-05",
      "Offset Slicing Identity (textEn.slice(start, end) === highlightedText)",
      sliceValid,
      sliceValid ? "All 18 vocabulary highlights identically match raw sentence slices." : failureDetail
    );
  } catch (error: unknown) {
    recordResult("TC-DB-05", "Offset Slicing Identity", false, getErrorMessage(error));
  }

  // TC-DB-06: Non-Overlapping Highlight Integrity
  try {
    let nonOverlapping = true;
    let failureDetail = "";

    for (const s of allSentences) {
      const sorted = [...s.vocabularies].sort((a, b) => a.startOffset - b.startOffset);
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].endOffset > sorted[i + 1].startOffset) {
          nonOverlapping = false;
          failureDetail = `Sentence ${s.id}: overlap between "${sorted[i].highlightedText}" and "${sorted[i + 1].highlightedText}"`;
          break;
        }
      }
      if (!nonOverlapping) break;
    }

    recordResult(
      "TC-DB-06",
      "Non-Overlapping Highlight Integrity",
      nonOverlapping,
      nonOverlapping ? "Zero overlapping highlight ranges detected across all seeded sentences." : failureDetail
    );
  } catch (error: unknown) {
    recordResult("TC-DB-06", "Non-Overlapping Highlight Integrity", false, getErrorMessage(error));
  }

  // TC-DB-07: Sentence Order Uniqueness Constraint
  try {
    const testArticle = await prisma.article.findFirst();
    if (!testArticle) throw new Error("No article found for constraint test.");

    let constraintCaught = false;
    try {
      // Attempt to insert duplicate orderIndex
      await prisma.sentence.create({
        data: {
          articleId: testArticle.id,
          orderIndex: 1, // Duplicate orderIndex
          textEn: "Duplicate order test sentence.",
          textVi: "Câu kiểm tra trùng lặp số thứ tự.",
        },
      });
    } catch (e: unknown) {
      const msg = getErrorMessage(e);
      if (msg.includes("Unique constraint failed") || (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "P2002")) {
        constraintCaught = true;
      }
    }

    recordResult(
      "TC-DB-07",
      "Sentence Order Uniqueness ([articleId, orderIndex] Unique Constraint)",
      constraintCaught,
      constraintCaught
        ? "Prisma rejected duplicate orderIndex with P2002 Unique Constraint violation."
        : "Constraint failed: duplicate orderIndex was allowed."
    );
  } catch (error: unknown) {
    recordResult("TC-DB-07", "Sentence Order Uniqueness", false, getErrorMessage(error));
  }

  // TC-DB-08: Transaction Atomicity & Rollback Test
  try {
    const testSlug = "transaction-abort-test-" + Date.now();
    let errorThrown = false;

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Create temporary article inside transaction
        const tempArticle = await tx.article.create({
          data: {
            slug: testSlug,
            titleEn: "Temporary Transaction Article",
            titleVi: "Bài viết tạm thời kiểm tra giao dịch",
            sourceName: "Test Suite",
            sourceUrl: "https://test.local",
            cefrLevel: CefrLevel.B1,
            status: ArticleStatus.DRAFT,
          },
        });

        // 2. Create a sentence inside transaction
        await tx.sentence.create({
          data: {
            articleId: tempArticle.id,
            orderIndex: 1,
            textEn: "Sentence written before forced exception.",
            textVi: "Câu được tạo trước khi ép lỗi ngoại lệ.",
          },
        });

        // 3. Intentionally throw error to force transaction rollback
        throw new Error("INTENTIONAL_TRANSACTION_ABORT");
      });
    } catch (e: unknown) {
      if (getErrorMessage(e).includes("INTENTIONAL_TRANSACTION_ABORT")) {
        errorThrown = true;
      }
    }

    // Verify database has zero records from this aborted transaction
    const orphanedArticle = await prisma.article.findUnique({
      where: { slug: testSlug },
    });

    const passed = errorThrown && orphanedArticle === null;

    recordResult(
      "TC-DB-08",
      "Transaction Atomicity & Rollback Verification",
      passed,
      passed
        ? "Transaction aborted cleanly on exception; 0 partial or orphaned records remained."
        : "Failed: Records were committed despite transaction exception."
    );
  } catch (error: unknown) {
    recordResult("TC-DB-08", "Transaction Atomicity & Rollback", false, getErrorMessage(error));
  }

  // TC-DB-09: Global Vocabulary Preservation on Article Cascade Delete
  try {
    // 1. Create a dedicated test vocabulary
    const testVocabWord = "ephemeral-" + Date.now();
    const testVocab = await prisma.vocabulary.create({
      data: {
        word: testVocabWord,
        normalizedLemma: "ephemeral",
        ipa: "/ɪˈfemərəl/",
        pos: "adjective",
        meaningVi: "Phù du, chóng tàn, tồn tại trong thời gian rất ngắn",
        exampleEn: "Fame in the digital age can be ephemeral.",
        exampleVi: "Danh tiếng trong thời đại số có thể chỉ là phù du.",
        cefrLevel: CefrLevel.C2,
      },
    });

    // 2. Create a temporary article with a sentence referencing this vocabulary
    const cascadeTestArticle = await prisma.article.create({
      data: {
        slug: "cascade-test-article-" + Date.now(),
        titleEn: "Cascade Deletion Isolation Test",
        titleVi: "Kiểm tra cách ly xóa liên tầng",
        sourceName: "Test Suite",
        sourceUrl: "https://test.local",
        cefrLevel: CefrLevel.C2,
        status: ArticleStatus.DRAFT,
        sentences: {
          create: [
            {
              orderIndex: 1,
              textEn: `Success can be ${testVocabWord} in nature.`,
              textVi: "Thành công có thể mang bản chất phù du.",
              vocabularies: {
                create: [
                  {
                    vocabularyId: testVocab.id,
                    startOffset: 14,
                    endOffset: 14 + testVocabWord.length,
                    highlightedText: testVocabWord,
                  },
                ],
              },
            },
          ],
        },
      },
      include: {
        sentences: {
          include: { vocabularies: true },
        },
      },
    });

    const sentenceId = cascadeTestArticle.sentences[0].id;
    const mappingId = cascadeTestArticle.sentences[0].vocabularies[0].id;

    // 3. Delete the article
    await prisma.article.delete({
      where: { id: cascadeTestArticle.id },
    });

    // 4. Verify: Sentence and SentenceVocabulary were cascade-deleted
    const checkSentence = await prisma.sentence.findUnique({ where: { id: sentenceId } });
    const checkMapping = await prisma.sentenceVocabulary.findUnique({ where: { id: mappingId } });

    // 5. Verify: Vocabulary record STILL EXISTS in database (Global preservation rule)
    const checkVocab = await prisma.vocabulary.findUnique({ where: { id: testVocab.id } });

    const passed = checkSentence === null && checkMapping === null && checkVocab !== null;

    // Clean up test vocabulary record
    await prisma.vocabulary.delete({ where: { id: testVocab.id } });

    recordResult(
      "TC-DB-09",
      "Global Vocabulary Preservation on Article Cascade Delete",
      passed,
      passed
        ? "Article deletion purged Sentence and SentenceVocabulary, but preserved global Vocabulary record."
        : "Failed: Global Vocabulary was improperly deleted or cascade failed."
    );
  } catch (error: unknown) {
    recordResult("TC-DB-09", "Global Vocabulary Preservation", false, getErrorMessage(error));
  }

  // TC-DB-10: User Saved Vocabulary & Reading History Integrity
  try {
    const userWithData = await prisma.user.findFirst({
      where: { email: "learner@example.com" },
      include: {
        savedVocabulary: { include: { vocabulary: true } },
        readingHistory: { include: { article: true } },
      },
    });

    const passed =
      userWithData !== null &&
      userWithData.savedVocabulary.length > 0 &&
      userWithData.savedVocabulary[0].vocabulary.word !== undefined &&
      userWithData.readingHistory.length > 0 &&
      userWithData.readingHistory[0].article.titleEn !== undefined;

    recordResult(
      "TC-DB-10",
      "User Saved Vocabulary & Reading History Relational Integrity",
      passed,
      `Verified learner profile has ${userWithData?.savedVocabulary.length} saved word and ${userWithData?.readingHistory.length} reading history record.`
    );
  } catch (error: unknown) {
    recordResult("TC-DB-10", "User Saved Vocabulary & Reading History Integrity", false, getErrorMessage(error));
  }

  console.log("\n================================================================================");
  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = totalTests - passedTests;
  console.log(`SUMMARY: Total Tests: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
  console.log("================================================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runVerification()
  .catch((e) => {
    console.error("Fatal verification error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
