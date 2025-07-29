import { CareScheduleTemplate } from '@petcare-ai/shared-types';
export declare const CARE_SCHEDULE_TEMPLATES: Record<'dog' | 'cat', CareScheduleTemplate>;
export declare function getCareSchedulesForPetType(petType: 'dog' | 'cat'): CareScheduleTemplate;
export declare function getAllCareScheduleRules(): import("@petcare-ai/shared-types").CareScheduleRule[];
