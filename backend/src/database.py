from sqlalchemy import create_engine, Column, Integer, String, Float, JSON
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

# Use SQLite for local dev, can be overridden by env var on Railway
SQLALCHEMY_DATABASE_URL = "sqlite:///./materialiq.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class ProductAnalysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, unique=True, index=True)
    title = Column(String)
    price = Column(String)
    material_score = Column(Float)
    durability_score = Column(Float)
    value_score = Column(Float)
    materials_breakdown = Column(JSON)
    ai_summary = Column(String, nullable=True)

# Create tables
Base.metadata.create_all(bind=engine)
