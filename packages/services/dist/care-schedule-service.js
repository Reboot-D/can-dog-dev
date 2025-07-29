// Care Schedule Service for Story 3.1
// Provides data access layer for standardized pet care schedules
import { getCareSchedulesForPetType, getAllCareScheduleRules } from '@petcare-ai/config';
export class CareScheduleService {
    /**
     * Get all care schedule rules for a specific pet type
     */
    static getCareSchedulesByPetType(petType) {
        try {
            const template = getCareSchedulesForPetType(petType);
            return template.schedules;
        }
        catch (error) {
            throw new Error(`Failed to get care schedules for pet type ${petType}: ${error}`);
        }
    }
    /**
     * Get care schedule rules filtered by event type
     */
    static getCareSchedulesByEventType(petType, eventType) {
        try {
            const schedules = this.getCareSchedulesByPetType(petType);
            return schedules.filter(schedule => schedule.event_type === eventType);
        }
        catch (error) {
            throw new Error(`Failed to get care schedules for event type ${eventType}: ${error}`);
        }
    }
    /**
     * Get a specific care schedule rule by ID
     */
    static getCareScheduleById(scheduleId) {
        try {
            const allRules = getAllCareScheduleRules();
            return allRules.find(rule => rule.id === scheduleId) || null;
        }
        catch (error) {
            throw new Error(`Failed to get care schedule by ID ${scheduleId}: ${error}`);
        }
    }
    /**
     * Get applicable care schedules for a pet based on age
     */
    static getApplicableCareSchedules(petType, petAgeMonths) {
        try {
            const schedules = this.getCareSchedulesByPetType(petType);
            return schedules.filter(schedule => {
                // Check if pet meets minimum age requirement
                const minAge = schedule.start_condition.age_months || 0;
                if (petAgeMonths < minAge)
                    return false;
                // Check if pet exceeds maximum age (if specified)
                if (schedule.end_condition?.age_months && petAgeMonths > schedule.end_condition.age_months) {
                    return false;
                }
                // Check recurrence conditions
                if (schedule.recurrence.conditions?.age_min_months &&
                    petAgeMonths < schedule.recurrence.conditions.age_min_months) {
                    return false;
                }
                if (schedule.recurrence.conditions?.age_max_months &&
                    petAgeMonths > schedule.recurrence.conditions.age_max_months) {
                    return false;
                }
                return true;
            });
        }
        catch (error) {
            throw new Error(`Failed to get applicable care schedules: ${error}`);
        }
    }
    /**
     * Calculate next due date for a care schedule rule
     */
    static calculateNextDueDate(schedule, petDateOfBirth, lastEventDate) {
        try {
            const now = new Date();
            const petAgeMonths = this.calculateAgeInMonths(petDateOfBirth, now);
            // If there's a last event date, calculate from that
            let baseDate;
            if (lastEventDate) {
                baseDate = new Date(lastEventDate);
            }
            else {
                // Calculate initial due date based on pet's age and schedule start condition
                const startAgeMonths = schedule.start_condition.age_months || 0;
                baseDate = new Date(petDateOfBirth);
                baseDate.setMonth(baseDate.getMonth() + startAgeMonths);
            }
            // Add the recurrence interval
            const nextDate = new Date(baseDate);
            switch (schedule.recurrence.unit) {
                case 'days':
                    nextDate.setDate(nextDate.getDate() + schedule.recurrence.interval);
                    break;
                case 'weeks':
                    nextDate.setDate(nextDate.getDate() + (schedule.recurrence.interval * 7));
                    break;
                case 'months':
                    nextDate.setMonth(nextDate.getMonth() + schedule.recurrence.interval);
                    break;
                case 'years':
                    nextDate.setFullYear(nextDate.getFullYear() + schedule.recurrence.interval);
                    break;
                default:
                    throw new Error(`Invalid recurrence unit: ${schedule.recurrence.unit}`);
            }
            return nextDate;
        }
        catch (error) {
            throw new Error(`Failed to calculate next due date: ${error}`);
        }
    }
    /**
     * Generate care events for a pet based on care schedules
     */
    static generateCareEventsForPet(petId, petType, petDateOfBirth, lastEventDates = {}) {
        try {
            const petAgeMonths = this.calculateAgeInMonths(petDateOfBirth, new Date());
            const applicableSchedules = this.getApplicableCareSchedules(petType, petAgeMonths);
            return applicableSchedules.map(schedule => {
                const lastEventDate = lastEventDates[schedule.id];
                const dueDate = this.calculateNextDueDate(schedule, petDateOfBirth, lastEventDate);
                return {
                    title: schedule.name,
                    description: schedule.description,
                    due_date: dueDate.toISOString(),
                    event_type: schedule.event_type,
                    schedule_rule_id: schedule.id,
                    pet_id: petId,
                    priority: schedule.priority
                };
            });
        }
        catch (error) {
            throw new Error(`Failed to generate care events for pet: ${error}`);
        }
    }
    /**
     * Helper method to calculate age in months
     */
    static calculateAgeInMonths(dateOfBirth, currentDate) {
        const birth = new Date(dateOfBirth);
        const now = new Date(currentDate);
        let months = (now.getFullYear() - birth.getFullYear()) * 12;
        months += now.getMonth() - birth.getMonth();
        // Adjust if the day hasn't occurred yet this month
        if (now.getDate() < birth.getDate()) {
            months--;
        }
        return Math.max(0, months);
    }
    /**
     * Validate care schedule rule structure
     */
    static validateCareScheduleRule(rule) {
        const errors = [];
        try {
            // Required fields validation
            if (!rule.id || rule.id.trim() === '') {
                errors.push('Care schedule rule must have a valid ID');
            }
            if (!rule.name || rule.name.trim() === '') {
                errors.push('Care schedule rule must have a name');
            }
            if (!rule.pet_type || !['dog', 'cat'].includes(rule.pet_type)) {
                errors.push('Care schedule rule must have a valid pet_type (dog or cat)');
            }
            if (!rule.event_type) {
                errors.push('Care schedule rule must have an event_type');
            }
            // Recurrence validation
            if (!rule.recurrence) {
                errors.push('Care schedule rule must have recurrence configuration');
            }
            else {
                if (!rule.recurrence.interval || rule.recurrence.interval <= 0) {
                    errors.push('Recurrence interval must be a positive number');
                }
                if (!rule.recurrence.unit || !['days', 'weeks', 'months', 'years'].includes(rule.recurrence.unit)) {
                    errors.push('Recurrence unit must be days, weeks, months, or years');
                }
            }
            // Priority validation
            if (!rule.priority || !['high', 'medium', 'low'].includes(rule.priority)) {
                errors.push('Priority must be high, medium, or low');
            }
            return {
                valid: errors.length === 0,
                errors
            };
        }
        catch (error) {
            return {
                valid: false,
                errors: [`Validation error: ${error}`]
            };
        }
    }
}
