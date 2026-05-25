import "dotenv/config";
import { PrismaClient, PteQuestionTypeName } from "@prisma/client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3, checkS3Configuration } from "../src/config/s3Config";

type Args = {
  text: string;
  contains: boolean;
  questionType?: PteQuestionTypeName;
  limit?: number;
  force: boolean;
  skipS3: boolean;
  yes: boolean;
};

const parseArgs = (): Args => {
  const argv = process.argv.slice(2);
  const readFlagValue = (flag: string) => {
    const idx = argv.indexOf(flag);
    if (idx === -1) return undefined;
    return argv[idx + 1];
  };

  const hasFlag = (flag: string) => argv.includes(flag);

  const text = readFlagValue("--text") ?? readFlagValue("-t") ?? "";
  const contains = hasFlag("--contains");
  const questionTypeRaw = readFlagValue("--questionType");
  const limitRaw = readFlagValue("--limit");

  return {
    text,
    contains,
    questionType: questionTypeRaw
      ? (questionTypeRaw as PteQuestionTypeName)
      : undefined,
    limit: limitRaw ? Number(limitRaw) : undefined,
    force: hasFlag("--force"),
    skipS3: hasFlag("--skip-s3"),
    yes: hasFlag("--yes"),
  };
};

const usage = () => {
  // Keep it short; this is a destructive script.
  console.log(
    [
      "Usage:",
      '  npx ts-node scripts/delete-questions-by-textContent.ts --text "..." [--contains] [--questionType READ_ALOUD] [--limit 10] [--force] [--skip-s3] [--yes]',
      "",
      "Notes:",
      "  - Dry-run by default. Add --yes to actually delete.",
      "  - Without --force, questions with UserResponse rows are skipped (same idea as admin delete).",
      "  - S3 delete uses AWS env vars (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME).",
    ].join("\n"),
  );
};

const deleteS3Key = async (key: string) => {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error("AWS_S3_BUCKET_NAME is not set");
  }

  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    }),
  );
};

async function main() {
  const args = parseArgs();

  if (!args.text) {
    usage();
    process.exitCode = 2;
    return;
  }

  if (
    args.limit !== undefined &&
    (!Number.isFinite(args.limit) || args.limit <= 0)
  ) {
    console.error("Invalid --limit value");
    process.exitCode = 2;
    return;
  }

  if (!args.skipS3 && !checkS3Configuration()) {
    console.warn(
      "S3 is not configured. Use --skip-s3 to ignore, or set AWS env vars to enable S3 deletes.",
    );
    args.skipS3 = true;
  }

  const prisma = new PrismaClient();

  try {
    const where: any = {
      textContent: args.contains
        ? { contains: args.text, mode: "insensitive" }
        : { equals: args.text },
    };

    if (args.questionType) {
      where.questionType = { name: args.questionType };
    }

    const questions = await prisma.question.findMany({
      where,
      take: args.limit,
      include: {
        questionType: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (questions.length === 0) {
      console.log("No questions matched.");
      return;
    }

    console.log(
      `Matched ${questions.length} question(s). ${args.yes ? "DELETE MODE" : "DRY RUN"}`,
    );

    let deletedCount = 0;
    let skippedCount = 0;
    let s3DeletedCount = 0;

    for (const q of questions) {
      const typeName = q.questionType?.name ?? "UNKNOWN";
      const audioKey = q.audioUrl ?? null;

      const userResponseCount = await prisma.userResponse.count({
        where: { questionId: q.id },
      });

      const header = `${q.id} ${q.questionCode} ${typeName}`;
      const matchPreview = (q.textContent ?? "")
        .slice(0, 80)
        .replace(/\s+/g, " ")
        .trim();

      if (userResponseCount > 0 && !args.force) {
        console.log(
          `SKIP ${header} (has ${userResponseCount} UserResponse). Preview: "${matchPreview}"`,
        );
        skippedCount += 1;
        continue;
      }

      console.log(
        `${args.yes ? "DEL" : "PLAN"} ${header} audio=${audioKey ?? "none"} responses=${userResponseCount} Preview: "${matchPreview}"`,
      );

      if (!args.yes) continue;

      // Delete dependent rows first (Mongo relations aren’t enforced like SQL; be explicit).
      if (args.force) {
        await prisma.userResponse.deleteMany({ where: { questionId: q.id } });
      }
      await prisma.practiceResponse.deleteMany({ where: { questionId: q.id } });
      await prisma.questionResponse.deleteMany({ where: { questionId: q.id } });

      await prisma.question.delete({ where: { id: q.id } });
      deletedCount += 1;

      if (!args.skipS3 && audioKey) {
        try {
          await deleteS3Key(audioKey);
          s3DeletedCount += 1;
        } catch (err) {
          console.warn(
            `WARN failed to delete S3 key "${audioKey}" for ${q.id}:`,
            err,
          );
        }
      }
    }

    console.log(
      `Done. deleted=${deletedCount} skipped=${skippedCount} s3Deleted=${s3DeletedCount}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exitCode = 1;
});

// Dry run (recommended first):
// cd Backend && npm run delete:questions-by-text -- --text "YOUR TEXT HERE"
// Contains match:
// cd Backend && npm run delete:questions-by-text -- --text "partial text" --contains
// Actually delete (requires explicit --yes):
// cd Backend && npm run delete:questions-by-text -- --text "YOUR TEXT HERE" --yes
// If questions have UserResponse rows and you still want to delete:
// cd Backend && npm run delete:questions-by-text -- --text "YOUR TEXT HERE" --yes --force
// Skip S3 deletes (DB only):
// cd Backend && npm run delete:questions-by-text -- --text "YOUR TEXT HERE" --yes --skip-s3
