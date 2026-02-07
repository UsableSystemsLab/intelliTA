from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import (
    MetaData, Table, Column, Integer, String, Text, DateTime,
    ForeignKey, UniqueConstraint, text,
)

from config import DATABASE_URL

engine = create_async_engine(DATABASE_URL, pool_size=5, max_overflow=10)

metadata = MetaData()

conversations = Table(
    "conversations", metadata,
    Column("conversation_id", Integer, primary_key=True),
    Column("firebase_uid", String(128), nullable=False),
    Column("activity_id", Integer, nullable=False),
    Column("created_at", DateTime, server_default=text("NOW()")),
    Column("updated_at", DateTime, server_default=text("NOW()")),
    UniqueConstraint("firebase_uid", "activity_id"),
)

chat_messages = Table(
    "chat_messages", metadata,
    Column("message_id", Integer, primary_key=True),
    Column("conversation_id", Integer,
           ForeignKey("conversations.conversation_id", ondelete="CASCADE"),
           nullable=False),
    Column("role", String(10), nullable=False),
    Column("content", Text, nullable=False),
    Column("created_at", DateTime, server_default=text("NOW()")),
)


# Used to get check if there is a conversation or not, if not create new one
async def get_or_create_conversation(firebase_uid: str, activity_id: int) -> int:
    async with engine.begin() as conn:
        result = await conn.execute(
            conversations.select().where(
                (conversations.c.firebase_uid == firebase_uid) &
                (conversations.c.activity_id == activity_id)
            )
        )
        row = result.first()
        if row:
            return row.conversation_id
        result = await conn.execute(
            conversations.insert()
            .values(firebase_uid=firebase_uid, activity_id=activity_id)
            .returning(conversations.c.conversation_id)
        )
        return result.scalar_one()


# Inserts a new message
async def save_message(conversation_id: int, role: str, content: str):
    async with engine.begin() as conn:
        await conn.execute(
            chat_messages.insert().values(
                conversation_id=conversation_id, role=role, content=content,
            )
        )
        await conn.execute(
            conversations.update()
            .where(conversations.c.conversation_id == conversation_id)
            .values(updated_at=text("NOW()"))
        )

# Get history
async def get_messages(conversation_id: int) -> list[dict]:
    async with engine.connect() as conn:
        result = await conn.execute(
            chat_messages.select()
            .where(chat_messages.c.conversation_id == conversation_id)
            .order_by(chat_messages.c.created_at.asc())
        )
        return [
            {
                "role": row.role,
                "content": row.content,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
            for row in result.fetchall()
        ]