"""Add reason column to time_logs

Revision ID: a2f6c8d91b44
Revises: 9a6b4f1d2c3e
Create Date: 2026-02-13 21:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a2f6c8d91b44"
down_revision: Union[str, Sequence[str], None] = "9a6b4f1d2c3e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_column(table_name: str, column_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    return any(col["name"] == column_name for col in inspector.get_columns(table_name))


def upgrade() -> None:
    if not _has_column("time_logs", "reason"):
        op.add_column("time_logs", sa.Column("reason", sa.String(length=255), nullable=True))


def downgrade() -> None:
    if _has_column("time_logs", "reason"):
        op.drop_column("time_logs", "reason")
