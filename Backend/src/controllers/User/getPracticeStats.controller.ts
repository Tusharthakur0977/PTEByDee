import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';
import { CustomRequest } from '../../types';

/**
 * @desc    Get user's practice statistics
 * @route   GET /api/user/practice/stats
 * @access  Private (requires authentication)
 */
export const getPracticeStats = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const userId = req.user?.id;

    try {
      if (!userId) {
        return sendResponse(
          res,
          STATUS_CODES.UNAUTHORIZED,
          null,
          'Authentication required to view practice statistics.'
        );
      }

      // Get overall practice statistics
      const [totalResponses, correctResponses, totalSessions, totalTimeSpent] =
        await Promise.all([
          prisma.practiceResponse.count({ where: { userId } }),
          prisma.practiceResponse.count({ where: { userId, isCorrect: true } }),
          prisma.practiceSession.count({ where: { userId } }),
          prisma.practiceResponse.aggregate({
            where: { userId },
            _sum: { timeTakenSeconds: true },
          }),
        ]);

      // Get statistics by question type
      const statsByQuestionType = await prisma.practiceResponse.groupBy({
        by: ['questionType'],
        where: { userId },
        _count: { _all: true },
        _sum: {
          timeTakenSeconds: true,
          score: true,
        },
        _avg: { score: true },
      });

      // Get statistics by PTE section
      const responsesBySection = await prisma.practiceResponse.findMany({
        where: { userId },
        include: {
          question: {
            include: {
              questionType: {
                include: {
                  pteSection: true,
                },
              },
            },
          },
        },
      });

      const statsBySection = responsesBySection.reduce((acc: any, response) => {
        const sectionName = response.question.questionType.pteSection.name;
        if (!acc[sectionName]) {
          acc[sectionName] = {
            sectionName,
            totalQuestions: 0,
            correctAnswers: 0,
            totalTime: 0,
            totalScore: 0,
            averageScore: 0,
            accuracy: 0,
          };
        }

        acc[sectionName].totalQuestions++;
        if (response.isCorrect) acc[sectionName].correctAnswers++;
        acc[sectionName].totalTime += response.timeTakenSeconds;
        acc[sectionName].totalScore += response.score;

        return acc;
      }, {});

      // Calculate averages and accuracy for sections
      Object.values(statsBySection).forEach((section: any) => {
        section.averageScore =
          section.totalQuestions > 0
            ? section.totalScore / section.totalQuestions
            : 0;
        section.accuracy =
          section.totalQuestions > 0
            ? (section.correctAnswers / section.totalQuestions) * 100
            : 0;
      });

      // Get recent practice sessions
      const recentSessions = await prisma.practiceSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          _count: {
            select: {
              practiceResponses: true,
            },
          },
        },
      });

      // Get practice streak (consecutive days)
      const practiceStreak = await calculatePracticeStreak(userId);

      // Get today's practice stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayStats = await prisma.practiceResponse.aggregate({
        where: {
          userId,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
        _count: { _all: true },
        _sum: { timeTakenSeconds: true },
      });

      const todayCorrect = await prisma.practiceResponse.count({
        where: {
          userId,
          isCorrect: true,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      const responseData = {
        overall: {
          totalQuestions: totalResponses,
          correctAnswers: correctResponses,
          accuracy:
            totalResponses > 0 ? (correctResponses / totalResponses) * 100 : 0,
          totalSessions,
          totalTimeSpent: totalTimeSpent._sum.timeTakenSeconds || 0,
          averageTimePerQuestion:
            totalResponses > 0
              ? (totalTimeSpent._sum.timeTakenSeconds || 0) / totalResponses
              : 0,
          practiceStreak,
        },
        today: {
          questionsAnswered: todayStats._count._all,
          correctAnswers: todayCorrect,
          timeSpent: todayStats._sum.timeTakenSeconds || 0,
          accuracy:
            todayStats._count._all > 0
              ? (todayCorrect / todayStats._count._all) * 100
              : 0,
        },
        byQuestionType: statsByQuestionType.map((stat) => ({
          questionType: stat.questionType,
          questionTypeName: stat.questionType
            .split('_')
            .map(
              (word: string) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(' '),
          totalQuestions: stat._count._all,
          totalTime: stat._sum.timeTakenSeconds || 0,
          totalScore: stat._sum.score || 0,
          averageScore: stat._avg.score || 0,
        })),
        bySection: Object.values(statsBySection),
        recentSessions: recentSessions.map((session) => ({
          id: session.id,
          sessionDate: session.sessionDate,
          totalQuestions: session.totalQuestions,
          correctAnswers: session.correctAnswers,
          accuracy:
            session.totalQuestions > 0
              ? (session.correctAnswers / session.totalQuestions) * 100
              : 0,
          timeSpent: session.totalTimeSpent,
          createdAt: session.createdAt,
        })),
      };

      return sendResponse(
        res,
        STATUS_CODES.OK,
        responseData,
        'Practice statistics retrieved successfully.'
      );
    } catch (error: any) {
      console.error('Get practice stats error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while fetching practice statistics. Please try again.'
      );
    }
  }
);

/**
 * Calculate practice streak (consecutive days with practice)
 */
async function calculatePracticeStreak(userId: string): Promise<number> {
  try {
    const sessions = await prisma.practiceSession.findMany({
      where: { userId },
      select: { sessionDate: true },
      orderBy: { sessionDate: 'desc' },
    });

    if (sessions.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const session of sessions) {
      const sessionDate = new Date(session.sessionDate);
      sessionDate.setHours(0, 0, 0, 0);

      if (sessionDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (
        sessionDate.getTime() ===
        currentDate.getTime() + 24 * 60 * 60 * 1000
      ) {
        // Allow for yesterday if today hasn't been practiced yet
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Error calculating practice streak:', error);
    return 0;
  }
}
