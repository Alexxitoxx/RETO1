CREATE TABLE IF NOT EXISTS startups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    founded_at DATE,
    location VARCHAR(150),
    category VARCHAR(100),
    funding_amount DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS technologies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    sector VARCHAR(100),
    description TEXT,
    adoption_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);