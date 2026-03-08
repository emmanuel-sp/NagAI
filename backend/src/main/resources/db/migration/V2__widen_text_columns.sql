-- Widen goal text fields to TEXT to support AI-generated suggestions (which can exceed 255 chars)
ALTER TABLE goals
    ALTER COLUMN description TYPE TEXT,
    ALTER COLUMN specific     TYPE TEXT,
    ALTER COLUMN measurable   TYPE TEXT,
    ALTER COLUMN attainable   TYPE TEXT,
    ALTER COLUMN relevant     TYPE TEXT,
    ALTER COLUMN timely       TYPE TEXT;

-- Widen checklist notes to TEXT
ALTER TABLE checklist_items
    ALTER COLUMN notes TYPE TEXT;
