"""Add CHOFER role to UserRole enum

Revision ID: 286816913fcb
Revises: 33be22dd2c35
Create Date: 2025-12-11 11:59:12.116884

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '286816913fcb'
down_revision: Union[str, Sequence[str], None] = '33be22dd2c35'
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
                WHERE t.typname = 'userrole' AND e.enumlabel = 'CHOFER'
            ) THEN
                ALTER TYPE userrole ADD VALUE 'CHOFER';
            END IF;
        END$$;
        """
    )


def downgrade() -> None:
    """Downgrade schema."""
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    # Normalize rows to allowed values before removing CHOFER from enum type.
    op.execute("UPDATE users SET role = 'TECNICO' WHERE role = 'CHOFER';")
    op.execute("CREATE TYPE userrole_old AS ENUM ('PLANNER', 'TECNICO', 'OPERACIONES', 'ADMIN');")
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole_old USING role::text::userrole_old;")
    op.execute("DROP TYPE userrole;")
    op.execute("ALTER TYPE userrole_old RENAME TO userrole;")
