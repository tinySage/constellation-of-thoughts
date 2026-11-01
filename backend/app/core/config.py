import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    app_name: str = "Constellation of Thoughts API"
    app_version: str = "0.1.0"

    @classmethod
    def from_environment(cls) -> Settings:
        return cls(
            app_name=os.getenv("APP_NAME", cls.app_name),
            app_version=os.getenv("APP_VERSION", cls.app_version),
        )


settings = Settings.from_environment()
