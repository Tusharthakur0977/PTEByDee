import { SupportTicketStatus } from '@prisma/client';
import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/prismaInstance';
import { CustomRequest } from '../../types';
import { STATUS_CODES } from '../../utils/constants';
import {
  sendSupportTicketConfirmationEmail,
  sendSupportTicketNotificationEmail,
} from '../../utils/emailService';
import { sendResponse } from '../../utils/helpers';

const generateTicketNumber = (): string => {
  const timestamp = Date.now().toString().slice(-8);
  const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SUP-${timestamp}-${randomSuffix}`;
};

export const createSupportTicket = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    const name = String(req.body.name || req.user?.name || '').trim();
    const email = String(req.body.email || req.user?.email || '')
      .trim()
      .toLowerCase();
    const subject = String(req.body.subject || '').trim();
    const message = String(req.body.message || '').trim();

    if (!name || !email || !subject || !message) {
      return sendResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        null,
        'Name, email, subject, and message are required.'
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        null,
        'Please enter a valid email address.'
      );
    }

    if (subject.length < 5 || subject.length > 120) {
      return sendResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        null,
        'Subject must be between 5 and 120 characters.'
      );
    }

    if (message.length < 20 || message.length > 5000) {
      return sendResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        null,
        'Message must be between 20 and 5000 characters.'
      );
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        userId: req.user?.id,
        name,
        email,
        subject,
        message,
        status: SupportTicketStatus.OPEN,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || null,
      },
    });

    let notificationEmailSent = false;
    let confirmationEmailSent = false;

    try {
      notificationEmailSent = await sendSupportTicketNotificationEmail({
        ticketNumber: ticket.ticketNumber,
        name: ticket.name,
        email: ticket.email,
        subject: ticket.subject,
        message: ticket.message,
        createdAt: ticket.createdAt,
      });
    } catch (error) {
      console.error('Failed to send support notification email:', error);
    }

    try {
      confirmationEmailSent = await sendSupportTicketConfirmationEmail({
        ticketNumber: ticket.ticketNumber,
        name: ticket.name,
        email: ticket.email,
        subject: ticket.subject,
      });
    } catch (error) {
      console.error('Failed to send support confirmation email:', error);
    }

    return sendResponse(
      res,
      STATUS_CODES.CREATED,
      {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        createdAt: ticket.createdAt,
        notificationEmailSent,
        confirmationEmailSent,
      },
      'Support ticket submitted successfully.'
    );
  }
);
