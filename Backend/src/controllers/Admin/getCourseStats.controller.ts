import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendResponse } from '../../utils/helpers';

/**
 * @desc    Get comprehensive course statistics for admin dashboard
 * @route   GET /api/admin/courses/stats
 * @access  Private/Admin
 */
export const getCourseStats = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Get basic course counts
      const [
        totalCourses,
        freeCourses,
        paidCourses,
        totalEnrollments,
        completedEnrollments,
        totalReviews,
        totalSections,
        totalLessons,
      ] = await Promise.all([
        prisma.course.count(),
        prisma.course.count({ where: { isFree: true } }),
        prisma.course.count({ where: { isFree: false } }),
        prisma.userCourse.count(),
        prisma.userCourse.count({ where: { completed: true } }),
        prisma.courseReview.count(),
        prisma.courseSection.count(),
        prisma.lesson.count(),
      ]);

      // Get revenue statistics
      const revenueStats = await prisma.course.aggregate({
        where: {
          isFree: false,
          price: {
            not: null,
          },
        },
        _sum: {
          price: true,
        },
        _avg: {
          price: true,
        },
        _min: {
          price: true,
        },
        _max: {
          price: true,
        },
      });

      // Get top performing courses
      const topCourses = await prisma.course.findMany({
        include: {
          userCourses: true,
          reviews: true,
          _count: {
            select: {
              userCourses: true,
              reviews: true,
            },
          },
        },
        orderBy: [
          { averageRating: 'desc' },
          { reviewCount: 'desc' },
        ],
        take: 5,
      });

      // Get recent course activity
      const recentCourses = await prisma.course.findMany({
        include: {
          userCourses: {
            take: 3,
            orderBy: { enrolledAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          reviews: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // Get enrollment trends (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentEnrollments = await prisma.userCourse.findMany({
        where: {
          enrolledAt: {
            gte: thirtyDaysAgo,
          },
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { enrolledAt: 'desc' },
      });

      // Calculate completion rate
      const completionRate = totalEnrollments > 0 
        ? (completedEnrollments / totalEnrollments) * 100 
        : 0;

      // Calculate average rating across all courses
      const avgRatingResult = await prisma.course.aggregate({
        _avg: {
          averageRating: true,
        },
      });

      const responseData = {
        overview: {
          totalCourses,
          freeCourses,
          paidCourses,
          totalEnrollments,
          completedEnrollments,
          completionRate: Math.round(completionRate * 100) / 100,
          totalReviews,
          totalSections,
          totalLessons,
          averageRating: avgRatingResult._avg.averageRating || 0,
        },
        revenue: {
          totalPotentialRevenue: revenueStats._sum.price || 0,
          averageCoursePrice: revenueStats._avg.price || 0,
          lowestPrice: revenueStats._min.price || 0,
          highestPrice: revenueStats._max.price || 0,
        },
        topPerformingCourses: topCourses.map(course => ({
          id: course.id,
          title: course.title,
          enrollments: course._count.userCourses,
          averageRating: course.averageRating,
          reviewCount: course._count.reviews,
          price: course.price,
          isFree: course.isFree,
        })),
        recentActivity: {
          newCourses: recentCourses.map(course => ({
            id: course.id,
            title: course.title,
            createdAt: course.createdAt,
            enrollments: course.userCourses.length,
            recentEnrollments: course.userCourses,
            recentReviews: course.reviews,
          })),
          recentEnrollments: recentEnrollments.map(enrollment => ({
            id: enrollment.id,
            enrolledAt: enrollment.enrolledAt,
            progress: enrollment.progress,
            course: enrollment.course,
            user: enrollment.user,
          })),
        },
        trends: {
          enrollmentsLast30Days: recentEnrollments.length,
          // You can add more trend calculations here
        },
      };

      return sendResponse(
        res,
        STATUS_CODES.OK,
        responseData,
        'Course statistics retrieved successfully.'
      );
    } catch (error: any) {
      console.error('Get course stats error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while fetching course statistics. Please try again.'
      );
    }
  }
);