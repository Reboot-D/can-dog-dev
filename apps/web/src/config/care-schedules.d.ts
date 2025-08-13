import { CareScheduleTemplate } from '../types/care-schedule';
export declare const CARE_SCHEDULE_TEMPLATES: Record<'dog' | 'cat', CareScheduleTemplate>;
export declare function getCareSchedulesForPetType(petType: 'dog' | 'cat'): CareScheduleTemplate;
export declare function getAllCareScheduleRules(): import("../types/care-schedule").CareScheduleRule[];
