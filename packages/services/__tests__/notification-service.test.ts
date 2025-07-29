import { NotificationService } from '../notification-service';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js');
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('NotificationService', () => {
  let service: NotificationService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
    };

    mockCreateClient.mockReturnValue(mockSupabase);

    service = new NotificationService({
      notificationWindowHours: 48,
      supabaseUrl: 'https://test.supabase.co',
      supabaseServiceKey: 'test-service-key'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEventsForNotification', () => {
    it('should fetch events that need notifications', async () => {
      const mockEvents = [
        {
          id: '1',
          created_at: '2024-01-01T00:00:00Z',
          user_id: 'user1',
          pet_id: 'pet1',
          title: '疫苗接种',
          due_date: '2024-01-03',
          status: 'pending',
          source: 'vaccination',
          notification_sent_at: null,
          pet: { name: '小白', breed: '金毛' },
          user: { email: 'user@example.com', raw_user_meta_data: { full_name: '张三' } }
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              is: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: mockEvents,
                  error: null
                })
              })
            })
          })
        })
      });

      const result = await service.getEventsForNotification();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        title: '疫苗接种',
        pet: { name: '小白', breed: '金毛' },
        user: { email: 'user@example.com', full_name: '张三' }
      });
    });

    it('should handle empty results', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              is: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              })
            })
          })
        })
      });

      const result = await service.getEventsForNotification();

      expect(result).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockReturnValue({
              is: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database connection failed' }
                })
              })
            })
          })
        })
      });

      await expect(service.getEventsForNotification()).rejects.toThrow('Failed to fetch events for notification: Database connection failed');
    });
  });

  describe('markEventAsNotified', () => {
    it('should successfully mark an event as notified', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null
          })
        })
      });

      const result = await service.markEventAsNotified('event-123');

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('events');
    });

    it('should handle update errors', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Update failed' }
          })
        })
      });

      const result = await service.markEventAsNotified('event-123');

      expect(result).toBe(false);
    });
  });

  describe('isEventNotified', () => {
    it('should return true for notified events', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { notification_sent_at: '2024-01-01T12:00:00Z' },
              error: null
            })
          })
        })
      });

      const result = await service.isEventNotified('event-123');

      expect(result).toBe(true);
    });

    it('should return false for non-notified events', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { notification_sent_at: null },
              error: null
            })
          })
        })
      });

      const result = await service.isEventNotified('event-123');

      expect(result).toBe(false);
    });
  });

  describe('getNotificationStats', () => {
    it('should return notification statistics', async () => {
      const mockCounts = [
        { count: 5 },  // pending
        { count: 3 },  // sent today
        { count: 100 } // total
      ];

      mockSupabase.from
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                is: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue(mockCounts[0])
                })
              })
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lt: jest.fn().mockResolvedValue(mockCounts[1])
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockResolvedValue(mockCounts[2])
        });

      const result = await service.getNotificationStats();

      expect(result).toEqual({
        pendingNotifications: 5,
        sentToday: 3,
        totalEvents: 100
      });
    });
  });
});