# Data Models

## Pet
Represents a single pet belonging to a user.
- **Attributes:** id, created_at, user_id, name, breed, date_of_birth, photo_url.
- **Relationships:** Belongs to one User, has many Journal Entries, has many Events.

## JournalEntry
Represents a single, timestamped observation logged by a user.
- **Attributes:** id, created_at, user_id, pet_id, content, ai_advice.
- **Relationships:** Belongs to one User, belongs to one Pet.

## Event
Represents a future scheduled event for a pet.
- **Attributes:** id, created_at, user_id, pet_id, title, due_date, status, source.
- **Relationships:** Belongs to one User, belongs to one Pet.
