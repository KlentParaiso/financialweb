from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://finance_user:finance_pass@localhost:5432/finance_db"
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
