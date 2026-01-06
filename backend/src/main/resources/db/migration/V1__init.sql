CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(64) NOT NULL,
    email VARCHAR(64) NOT NULL UNIQUE,
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