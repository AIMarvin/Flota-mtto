"""Add REJECTED status to WorkOrder

Revision ID: d45db65faf26
Revises: 286816913fcb
Create Date: 2025-12-11 12:46:07.480211

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd45db65faf26'
down_revision: Union[str, Sequence[str], None] = '286816913fcb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_type t
                JOIN pg_enum e ON t.oid = e.enumtypid
                WHERE t.typname = 'orderstatus' AND e.enumlabel = 'REJECTED'
            ) THEN
                ALTER TYPE orderstatus ADD VALUE 'REJECTED';
            END IF;
        END$$;
        """
    )


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    # Normalize rows to allowed values before removing REJECTED from enum type.
    op.execute("UPDATE work_orders SET status = 'OPEN' WHERE status = 'REJECTED';")
    op.execute(
        "CREATE TYPE orderstatus_old AS ENUM ('PRE_ORDER', 'OPEN', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CLOSED');"
    )
    op.execute("ALTER TABLE work_orders ALTER COLUMN status TYPE orderstatus_old USING status::text::orderstatus_old;")
    op.execute("DROP TYPE orderstatus;")
    op.execute("ALTER TYPE orderstatus_old RENAME TO orderstatus;")
