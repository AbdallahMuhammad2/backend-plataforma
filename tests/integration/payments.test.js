const request = require('supertest');
const app = require('../../server');
const helpers = require('../helpers');
const PaymentService = require('../../services/paymentService');

// Mock Asaas API responses
jest.mock('../../services/paymentService', () => ({
  createCustomer: jest.fn(),
  createSubscription: jest.fn(),
  createPayment: jest.fn(),
  getSubscription: jest.fn(),
  cancelSubscription: jest.fn(),
  getPayment: jest.fn(),
  getCustomerPayments: jest.fn(),
  refundPayment: jest.fn()
}));

describe('Payment Integration', () => {
  let student;
  let studentToken;

  beforeEach(async () => {
    await helpers.cleanDatabase();
    student = await helpers.createUser(helpers.mockUserData.student);
    studentToken = helpers.getAuthToken(student.id, 'student');

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/payments/subscribe', () => {
    const subscriptionData = {
      plan: 'premium',
      paymentMethod: 'CREDIT_CARD',
      creditCard: {
        holderName: 'John Doe',
        number: '4111111111111111',
        expiryMonth: '12',
        expiryYear: '2025',
        ccv: '123'
      },
      billingInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        cpf: '12345678901',
        phone: '11999999999',
        postalCode: '12345678',
        addressNumber: '123'
      }
    };

    it('should create a new subscription', async () => {
      PaymentService.createCustomer.mockResolvedValue({
        id: 'cus_123',
        name: subscriptionData.billingInfo.name
      });

      PaymentService.createSubscription.mockResolvedValue({
        id: 'sub_123',
        status: 'ACTIVE',
        value: 99.90
      });

      const response = await request(app)
        .post('/api/payments/subscribe')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(subscriptionData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('subscriptionId');
      expect(response.body.status).toBe('ACTIVE');
      expect(PaymentService.createCustomer).toHaveBeenCalled();
      expect(PaymentService.createSubscription).toHaveBeenCalled();
    });

    it('should handle payment processing errors', async () => {
      PaymentService.createSubscription.mockRejectedValue(new Error('Payment processing failed'));

      const response = await request(app)
        .post('/api/payments/subscribe')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(subscriptionData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should validate credit card information', async () => {
      const invalidData = {
        ...subscriptionData,
        creditCard: {
          ...subscriptionData.creditCard,
          number: '1234' // Invalid card number
        }
      };

      const response = await request(app)
        .post('/api/payments/subscribe')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'creditCard.number'
        })
      );
    });
  });

  describe('GET /api/payments/subscription', () => {
    it('should get current subscription status', async () => {
      PaymentService.getSubscription.mockResolvedValue({
        id: 'sub_123',
        status: 'ACTIVE',
        value: 99.90,
        nextDueDate: '2024-01-01'
      });

      const response = await request(app)
        .get('/api/payments/subscription')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ACTIVE');
      expect(response.body).toHaveProperty('nextDueDate');
    });
  });

  describe('POST /api/payments/cancel', () => {
    it('should cancel subscription', async () => {
      PaymentService.cancelSubscription.mockResolvedValue({
        id: 'sub_123',
        status: 'CANCELLED'
      });

      const response = await request(app)
        .post('/api/payments/cancel')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'CANCELLED');
    });
  });

  describe('GET /api/payments/history', () => {
    it('should list payment history', async () => {
      PaymentService.getCustomerPayments.mockResolvedValue([
        {
          id: 'pay_123',
          value: 99.90,
          status: 'CONFIRMED',
          paymentDate: '2023-12-01'
        }
      ]);

      const response = await request(app)
        .get('/api/payments/history')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('status');
    });
  });

  describe('POST /api/payments/refund', () => {
    it('should process refund request', async () => {
      PaymentService.refundPayment.mockResolvedValue({
        id: 'ref_123',
        status: 'REFUNDED',
        value: 99.90
      });

      const response = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ paymentId: 'pay_123' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'REFUNDED');
    });

    it('should handle refund errors', async () => {
      PaymentService.refundPayment.mockRejectedValue(new Error('Refund failed'));

      const response = await request(app)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ paymentId: 'pay_123' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/payments/webhook', () => {
    it('should handle payment confirmation webhook', async () => {
      const webhookData = {
        event: 'PAYMENT_CONFIRMED',
        payment: {
          id: 'pay_123',
          subscription: 'sub_123',
          value: 99.90,
          status: 'CONFIRMED'
        }
      };

      const response = await request(app)
        .post('/api/payments/webhook')
        .send(webhookData);

      expect(response.status).toBe(200);
    });

    it('should handle subscription cancellation webhook', async () => {
      const webhookData = {
        event: 'SUBSCRIPTION_CANCELED',
        subscription: {
          id: 'sub_123',
          status: 'CANCELLED'
        }
      };

      const response = await request(app)
        .post('/api/payments/webhook')
        .send(webhookData);

      expect(response.status).toBe(200);
    });
  });
});
