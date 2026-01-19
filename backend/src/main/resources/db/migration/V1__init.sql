CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
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

CREATE TABLE goals (
    goal_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    title VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    target_date VARCHAR(64),
    specific VARCHAR(255),
    measurable VARCHAR(255),
    attainable VARCHAR(255),
    relevant VARCHAR(255),
    timely VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)