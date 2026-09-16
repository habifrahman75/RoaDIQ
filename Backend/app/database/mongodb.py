import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load environment variables
load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME", "roadiq")

if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI is missing from .env file")

# MongoDB client
client = AsyncIOMotorClient(MONGODB_URI)

# Database
db = client[DATABASE_NAME]


async def connect_db():
    try:
        await client.admin.command("ping")
        print("✅ MongoDB Atlas connected successfully")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        raise


async def close_db():
    client.close()
    print("MongoDB connection closed")


def get_db():
    return db