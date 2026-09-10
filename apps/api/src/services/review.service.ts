import { prisma } from '../prisma';

export const validateReviewEligibility = async (orderId: string, customerId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { review: true },
  });

  if (!order) {
    return { eligible: false, statusCode: 404, message: 'Order not found.' };
  }

  if (order.customerId !== customerId) {
    return { eligible: false, statusCode: 403, message: 'You can only review your own orders.' };
  }

  if (order.status !== 'COMPLETED') {
    return {
      eligible: false,
      statusCode: 400,
      message: 'Reviews can only be submitted for completed orders.',
    };
  }

  if (order.review) {
    return {
      eligible: false,
      statusCode: 409,
      message: 'A review has already been submitted for this order.',
    };
  }

  return { eligible: true, order };
};
