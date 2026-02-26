CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(64) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    phone_number VARCHAR(64),
    user_location VARCHAR(64),
    career VARCHAR(64),
    bio VARCHAR(255),
    interests TEXT[],
    hobbies TEXT[],
    habits TEXT[]
);

CREATE TABLE goals (
    goal_id SERIAL PRIMARY KEY,
    user_id INTEGER,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    target_date VARCHAR(64),
    specific VARCHAR(255),
    measurable VARCHAR(255),
    attainable VARCHAR(255),
    relevant VARCHAR(255),
    timely VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE TABLE checklist_items (
    checklist_id SERIAL PRIMARY KEY,
    goal_id INTEGER,
    sort_order INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    notes VARCHAR(255),
    deadline VARCHAR(30),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES goals (goal_id) ON DELETE CASCADE
);