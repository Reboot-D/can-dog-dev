export type PetType = 'dog' | 'cat';
export type CareEventType = 'vaccination' | 'wellness_exam' | 'parasite_prevention' | 'dental_care' | 'grooming';
export type RecurrenceUnit = 'days' | 'weeks' | 'months' | 'years';
export interface RecurrenceRule {
    interval: number;
    unit: RecurrenceUnit;
    conditions?: {
        age_min_months?: number;
        age_max_months?: number;
        breed_specific?: string[];
    };
}
export interface CareScheduleRule {
    id: string;
    name: string;
    description: string;
    pet_type: PetType;
    event_type: CareEventType;
    start_condition: {
        age_months?: number;
        event_trigger?: 'adoption' | 'birth' | 'first_visit';
    };
    recurrence: RecurrenceRule;
    end_condition?: {
        age_months?: number;
        max_occurrences?: number;
    };
    priority: 'high' | 'medium' | 'low';
    source: string;
    created_at: string;
    updated_at: string;
}
export interface CareScheduleTemplate {
    pet_type: PetType;
    schedules: CareScheduleRule[];
}
export interface GeneratedCareEvent {
    title: string;
    description: string;
    due_date: string;
    event_type: CareEventType;
    schedule_rule_id: string;
    pet_id: string;
    priority: 'high' | 'medium' | 'low';
}
