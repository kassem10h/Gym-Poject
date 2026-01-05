import os

# DATABASE_URL = 'postgresql://postgres:1289@localhost:5432/Gym' // Local DB
DATABASE_URL = "postgresql://neondb_owner:npg_3gkFB1NaIQiE@ep-restless-mud-agffmft4.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"

class Config:
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
