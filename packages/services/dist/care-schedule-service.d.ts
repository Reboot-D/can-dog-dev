import { CareScheduleRule, PetType, CareEventType, GeneratedCareEvent } from '@petcare-ai/shared-types';
export declare class CareScheduleService {
    /**
     * Get all care schedule rules for a specific pet type
     */
    static getCareSchedulesByPetType(petType: PetType): CareScheduleRule[];
    /**
     * Get care schedule rules filtered by event type
     */
    static getCareSchedulesByEventType(petType: PetType, eventType: CareEventType): CareScheduleRule[];
    /**
     * Get a specific care schedule rule by ID
     */
    static getCareScheduleById(scheduleId: string): CareScheduleRule | null;
    /**
     * Get applicable care schedules for a pet based on age
     */
    static getApplicableCareSchedules(petType: PetType, petAgeMonths: number): CareScheduleRule[];
    /**
     * Calculate next due date for a care schedule rule
     */
    static calculateNextDueDate(schedule: CareScheduleRule, petDateOfBirth: Date, lastEventDate?: Date): Date;
    /**
     * Generate care events for a pet based on care schedules
     */
    static generateCareEventsForPet(petId: string, petType: PetType, petDateOfBirth: Date, lastEventDates?: Record<string, Date>): GeneratedCareEvent[];
    /**
     * Helper method to calculate age in months
     */
    private static calculateAgeInMonths;
    /**
     * Validate care schedule rule structure
     */
    static validateCareScheduleRule(rule: CareScheduleRule): {
        valid: boolean;
        errors: string[];
    };
}
