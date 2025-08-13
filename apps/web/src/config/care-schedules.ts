// Standard Care Schedules Configuration for Story 3.1
// Based on AVMA and veterinary best practices

import { CareScheduleTemplate } from '../types/care-schedule'

export const CARE_SCHEDULE_TEMPLATES: Record<'dog' | 'cat', CareScheduleTemplate> = {
  dog: {
    pet_type: 'dog',
    schedules: [
      // Puppy vaccinations (DHPP series)
      {
        id: 'dog-dhpp-puppy',
        name: 'DHPP Vaccination Series (Puppy)',
        description: 'Distemper, Hepatitis, Parvovirus, Parainfluenza vaccination series',
        pet_type: 'dog',
        event_type: 'vaccination',
        start_condition: {
          age_months: 2
        },
        recurrence: {
          interval: 3,
          unit: 'weeks',
          conditions: {
            age_max_months: 4
          }
        },
        end_condition: {
          age_months: 4
        },
        priority: 'high',
        source: 'AVMA Canine Vaccination Guidelines',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      
      // Annual DHPP booster
      {
        id: 'dog-dhpp-annual',
        name: 'DHPP Annual Booster',
        description: 'Annual DHPP vaccination booster',
        pet_type: 'dog',
        event_type: 'vaccination',
        start_condition: {
          age_months: 15
        },
        recurrence: {
          interval: 1,
          unit: 'years'
        },
        priority: 'high',
        source: 'AVMA Canine Vaccination Guidelines',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      
      // Rabies vaccination
      {
        id: 'dog-rabies-initial',
        name: 'Rabies Vaccination (Initial)',
        description: 'Initial rabies vaccination',
        pet_type: 'dog',
        event_type: 'vaccination',
        start_condition: {
          age_months: 4
        },
        recurrence: {
          interval: 1,
          unit: 'years'
        },
        priority: 'high',
        source: 'AVMA Canine Vaccination Guidelines',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      
      // Annual wellness exam
      {
        id: 'dog-wellness-annual',
        name: 'Annual Wellness Examination',
        description: 'Comprehensive annual health examination',
        pet_type: 'dog',
        event_type: 'wellness_exam',
        start_condition: {
          age_months: 12
        },
        recurrence: {
          interval: 1,
          unit: 'years'
        },
        priority: 'high',
        source: 'AVMA Preventive Healthcare Guidelines',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      
      // Heartworm prevention
      {
        id: 'dog-heartworm-monthly',
        name: 'Heartworm Prevention',
        description: 'Monthly heartworm preventive medication',
        pet_type: 'dog',
        event_type: 'parasite_prevention',
        start_condition: {
          age_months: 2
        },
        recurrence: {
          interval: 1,
          unit: 'months'
        },
        priority: 'high',
        source: 'American Heartworm Society Guidelines',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      
      // Dental care
      {
        id: 'dog-dental-annual',
        name: 'Dental Examination and Cleaning',
        description: 'Professional dental examination and cleaning',
        pet_type: 'dog',
        event_type: 'dental_care',
        start_condition: {
          age_months: 24
        },
        recurrence: {
          interval: 1,
          unit: 'years'
        },
        priority: 'medium',
        source: 'AVMA Dental Care Guidelines',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  },
  
  cat: {
    pet_type: 'cat',
    schedules: [
      // Kitten vaccinations (FVRCP series)
      {
        id: 'cat-fvrcp-kitten',
        name: 'FVRCP Vaccination Series (Kitten)',
        description: 'Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia vaccination series',
        pet_type: 'cat',
        event_type: 'vaccination',
        start_condition: {
          age_months: 2
        },
        recurrence: {
          interval: 3,
          unit: 'weeks',
          conditions: {
            age_max_months: 4
          }
        },
        end_condition: {
          age_months: 4
        },
        priority: 'high',
        source: 'AVMA Feline Vaccination Guidelines',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      
      // Annual FVRCP booster
      {
        id: 'cat-fvrcp-annual',
        name: 'FVRCP Annual Booster',
        description: 'Annual FVRCP vaccination booster',
        pet_type: 'cat',
        event_type: 'vaccination',
        start_condition: {
          age_months: 15
        },
        recurrence: {
          interval: 1,
          unit: 'years'
        },
        priority: 'high',
        source: 'AVMA Feline Vaccination Guidelines',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      
      // Rabies vaccination
      {
        id: 'cat-rabies-initial',
        name: 'Rabies Vaccination (Initial)',
        description: 'Initial rabies vaccination',
        pet_type: 'cat',
        event_type: 'vaccination',
        start_condition: {
          age_months: 4
        },
        recurrence: {
          interval: 1,
          unit: 'years'
        },
        priority: 'high',
        source: 'AVMA Feline Vaccination Guidelines',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      
      // Annual wellness exam
      {
        id: 'cat-wellness-annual',
        name: 'Annual Wellness Examination',
        description: 'Comprehensive annual health examination',
        pet_type: 'cat',
        event_type: 'wellness_exam',
        start_condition: {
          age_months: 12
        },
        recurrence: {
          interval: 1,
          unit: 'years'
        },
        priority: 'high',
        source: 'AVMA Preventive Healthcare Guidelines',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      
      // Parasite prevention
      {
        id: 'cat-parasite-monthly',
        name: 'Parasite Prevention',
        description: 'Monthly flea, tick, and internal parasite prevention',
        pet_type: 'cat',
        event_type: 'parasite_prevention',
        start_condition: {
          age_months: 2
        },
        recurrence: {
          interval: 1,
          unit: 'months'
        },
        priority: 'medium',
        source: 'AVMA Parasite Control Guidelines',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      
      // Dental care
      {
        id: 'cat-dental-annual',
        name: 'Dental Examination and Cleaning',
        description: 'Professional dental examination and cleaning',
        pet_type: 'cat',
        event_type: 'dental_care',
        start_condition: {
          age_months: 24
        },
        recurrence: {
          interval: 1,
          unit: 'years'
        },
        priority: 'medium',
        source: 'AVMA Dental Care Guidelines',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  }
}

// Helper function to get care schedules for a specific pet type
export function getCareSchedulesForPetType(petType: 'dog' | 'cat'): CareScheduleTemplate {
  return CARE_SCHEDULE_TEMPLATES[petType]
}

// Helper function to get all care schedule rules
export function getAllCareScheduleRules() {
  return [
    ...CARE_SCHEDULE_TEMPLATES.dog.schedules,
    ...CARE_SCHEDULE_TEMPLATES.cat.schedules
  ]
}