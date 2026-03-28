import { SupportTicketStatus } from '@prisma/client';
import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { STATUS_CODES } from '../../utils/constants';
import { sendSupportTicketStatusEmail } from '../../utils/emailService';
import { sendResponse } from '../../utils/helpers';

export const getAllSupportTickets = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const {
        page = '1',
        limit = '10',
        search = '',
        status = '',
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);
      const skip = (pageNumber - 1) * limitNumber;

      const whereClause: any = {};

      if (search) {
        whereClause.OR = [
          {
            ticketNumber: {
              contains: search as string,
              mode: 'insensitive',
            },
          },
          {
            name: {
              contains: search as string,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: search as string,
              mode: 'insensitive',
            },
          },
          {
            subject: {
              contains: search as string,
              mode: 'insensitive',
            },
          },
        ];
      }

      if (status) {
        whereClause.status = status;
      }

      const orderBy: any = {};
      orderBy[sortBy as string] = sortOrder as 'asc' | 'desc';

      const [totalTickets, tickets, openCount, inProgressCount, resolvedCount] =
        await Promise.all([
          prisma.supportTicket.count({ where: whereClause }),
          prisma.supportTicket.findMany({
            where: whereClause,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
            orderBy,
            skip,
            take: limitNumber,
          }),
          prisma.supportTicket.count({
            where: { ...(status ? whereClause : {}), status: 'OPEN' },
          }),
          prisma.supportTicket.count({
            where: { ...(status ? whereClause : {}), status: 'IN_PROGRESS' },
          }),
          prisma.supportTicket.count({
            where: { ...(status ? whereClause : {}), status: 'RESOLVED' },
          }),
        ]);

      const totalPages = Math.ceil(totalTickets / limitNumber);
      const hasNextPage = pageNumber < totalPages;
      const hasPrevPage = pageNumber > 1;

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          tickets,
          pagination: {
            currentPage: pageNumber,
            totalPages,
            totalTickets,
            hasNextPage,
            hasPrevPage,
            limit: limitNumber,
          },
          stats: {
            totalTickets,
            open: openCount,
            inProgress: inProgressCount,
            resolved: resolvedCount,
          },
          filters: {
            search: search as string,
            status: status as string,
            sortBy: sortBy as string,
            sortOrder: sortOrder as string,
          },
        },
        `Retrieved ${tickets.length} support tickets successfully.`
      );
    } catch (error) {
      console.error('Get all support tickets error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while fetching support tickets. Please try again.'
      );
    }
  }
);

export const getSupportTicketById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      if (!id || id.length !== 24) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Invalid support ticket ID format.'
        );
      }

      const ticket = await prisma.supportTicket.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
            },
          },
        },
      });

      if (!ticket) {
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'Support ticket not found.'
        );
      }

      return sendResponse(
        res,
        STATUS_CODES.OK,
        ticket,
        'Support ticket retrieved successfully.'
      );
    } catch (error) {
      console.error('Get support ticket by ID error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while fetching the support ticket.'
      );
    }
  }
);

export const updateSupportTicketStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body as { status?: SupportTicketStatus };

    try {
      if (!id || id.length !== 24) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Invalid support ticket ID format.'
        );
      }

      const allowedStatuses: SupportTicketStatus[] = [
        'OPEN',
        'IN_PROGRESS',
        'RESOLVED',
        'CLOSED',
      ];

      if (!status || !allowedStatuses.includes(status)) {
        return sendResponse(
          res,
          STATUS_CODES.BAD_REQUEST,
          null,
          'Please provide a valid support ticket status.'
        );
      }

      const existingTicket = await prisma.supportTicket.findUnique({
        where: { id },
      });

      if (!existingTicket) {
        return sendResponse(
          res,
          STATUS_CODES.NOT_FOUND,
          null,
          'Support ticket not found.'
        );
      }

      if (existingTicket.status === 'CLOSED' && status !== 'CLOSED') {
        return sendResponse(
          res,
          STATUS_CODES.CONFLICT,
          null,
          'Closed tickets cannot be updated.'
        );
      }

      const updatedTicket = await prisma.supportTicket.update({
        where: { id },
        data: { status },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      let statusEmailSent = false;
      const shouldSendStatusEmail =
        existingTicket.status !== status &&
        (status === 'RESOLVED' || status === 'CLOSED');

      if (shouldSendStatusEmail) {
        try {
          statusEmailSent = await sendSupportTicketStatusEmail({
            ticketNumber: updatedTicket.ticketNumber,
            name: updatedTicket.name,
            email: updatedTicket.email,
            subject: updatedTicket.subject,
            status,
          });
        } catch (error) {
          console.error('Failed to send support status email:', error);
        }
      }

      return sendResponse(
        res,
        STATUS_CODES.OK,
        {
          ...updatedTicket,
          statusEmailSent,
        },
        'Support ticket status updated successfully.'
      );
    } catch (error) {
      console.error('Update support ticket status error:', error);
      return sendResponse(
        res,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        null,
        'An error occurred while updating the support ticket status.'
      );
    }
  }
);
