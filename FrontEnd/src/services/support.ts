import { publicApi } from './api';

export interface SupportTicketPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface SupportTicketResponse {
  success: boolean;
  data: {
    id: string;
    ticketNumber: string;
    status: string;
    createdAt: string;
    notificationEmailSent: boolean;
    confirmationEmailSent: boolean;
  };
  message: string;
  statusCode: number;
}

export const submitSupportTicket = async (
  payload: SupportTicketPayload
): Promise<SupportTicketResponse> => {
  const response = await publicApi.post('/support', payload);
  return response.data;
};
