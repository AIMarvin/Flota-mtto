"""Sync schema with current models

Revision ID: 9a6b4f1d2c3e
Revises: d45db65faf26
Create Date: 2026-02-13 20:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9a6b4f1d2c3e"
down_revision: Union[str, Sequence[str], None] = "d45db65faf26"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_table(table_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    return table_name in inspector.get_table_names()


def _has_column(table_name: str, column_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    return any(col["name"] == column_name for col in inspector.get_columns(table_name))


def _has_fk(table_name: str, constrained_columns: Sequence[str], referred_table: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    for fk in inspector.get_foreign_keys(table_name):
        if (
            fk.get("referred_table") == referred_table
            and fk.get("constrained_columns") == constrained_columns
        ):
            return True
    return False


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    if _has_table("users"):
        if not _has_column("users", "profile_image"):
            op.add_column("users", sa.Column("profile_image", sa.String(), nullable=True))
        if not _has_column("users", "unit_id"):
            op.add_column("users", sa.Column("unit_id", sa.Integer(), nullable=True))
        if dialect != "sqlite" and _has_column("users", "unit_id") and not _has_fk("users", ["unit_id"], "units"):
            op.create_foreign_key("fk_users_unit_id_units", "users", "units", ["unit_id"], ["id"])

    if _has_table("units"):
        if not _has_column("units", "driver_id"):
            op.add_column("units", sa.Column("driver_id", sa.Integer(), nullable=True))
        if not _has_column("units", "manager_id"):
            op.add_column("units", sa.Column("manager_id", sa.Integer(), nullable=True))
        if dialect != "sqlite" and _has_column("units", "driver_id") and not _has_fk("units", ["driver_id"], "users"):
            op.create_foreign_key("fk_units_driver_id_users", "units", "users", ["driver_id"], ["id"])
        if dialect != "sqlite" and _has_column("units", "manager_id") and not _has_fk("units", ["manager_id"], "users"):
            op.create_foreign_key("fk_units_manager_id_users", "units", "users", ["manager_id"], ["id"])

    if _has_table("checklists"):
        if not _has_column("checklists", "is_priority"):
            op.add_column(
                "checklists",
                sa.Column("is_priority", sa.Boolean(), nullable=True, server_default=sa.text("false")),
            )
        if not _has_column("checklists", "comments"):
            op.add_column("checklists", sa.Column("comments", sa.Text(), nullable=True))
        if not _has_column("checklists", "generated_order_id"):
            op.add_column("checklists", sa.Column("generated_order_id", sa.Integer(), nullable=True))
        if (
            dialect != "sqlite"
            and _has_column("checklists", "generated_order_id")
            and not _has_fk("checklists", ["generated_order_id"], "work_orders")
        ):
            op.create_foreign_key(
                "fk_checklists_generated_order_id_work_orders",
                "checklists",
                "work_orders",
                ["generated_order_id"],
                ["id"],
            )

    if _has_table("work_orders"):
        if not _has_column("work_orders", "scheduled_date"):
            op.add_column("work_orders", sa.Column("scheduled_date", sa.DateTime(timezone=True), nullable=True))
        if not _has_column("work_orders", "estimated_hours"):
            op.add_column(
                "work_orders",
                sa.Column("estimated_hours", sa.Integer(), nullable=True, server_default=sa.text("1")),
            )

    if not _has_table("products"):
        op.create_table(
            "products",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("sku", sa.String(), nullable=False),
            sa.Column("category", sa.String(), nullable=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("current_stock", sa.Float(), nullable=False, server_default=sa.text("0")),
            sa.Column("min_stock_level", sa.Float(), nullable=False, server_default=sa.text("5")),
            sa.Column("cost_price", sa.Float(), nullable=True, server_default=sa.text("0")),
            sa.Column("image_url", sa.String(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_products_id", "products", ["id"], unique=False)
        op.create_index("ix_products_name", "products", ["name"], unique=False)
        op.create_index("ix_products_sku", "products", ["sku"], unique=True)
        op.create_index("ix_products_category", "products", ["category"], unique=False)

    if not _has_table("stock_movements"):
        op.create_table(
            "stock_movements",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("product_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=True),
            sa.Column("change_amount", sa.Float(), nullable=False),
            sa.Column("movement_type", sa.Enum("IN", "OUT", "ADJUSTMENT", name="movementtype"), nullable=False),
            sa.Column("reason", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_stock_movements_id", "stock_movements", ["id"], unique=False)

    if not _has_table("purchase_orders"):
        op.create_table(
            "purchase_orders",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("display_id", sa.String(), nullable=True),
            sa.Column(
                "status",
                sa.Enum("REQUESTED", "APPROVED", "RECEIVED", "CANCELLED", name="purchasestatus"),
                nullable=False,
                server_default="REQUESTED",
            ),
            sa.Column("requested_by_id", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.ForeignKeyConstraint(["requested_by_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_purchase_orders_id", "purchase_orders", ["id"], unique=False)
        op.create_index("ix_purchase_orders_display_id", "purchase_orders", ["display_id"], unique=True)

    if not _has_table("purchase_order_items"):
        op.create_table(
            "purchase_order_items",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("purchase_order_id", sa.Integer(), nullable=False),
            sa.Column("product_id", sa.Integer(), nullable=False),
            sa.Column("quantity_requested", sa.Float(), nullable=False),
            sa.Column("quantity_received", sa.Float(), nullable=True, server_default=sa.text("0")),
            sa.ForeignKeyConstraint(["purchase_order_id"], ["purchase_orders.id"]),
            sa.ForeignKeyConstraint(["product_id"], ["products.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_purchase_order_items_id", "purchase_order_items", ["id"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    if _has_table("purchase_order_items"):
        op.drop_index("ix_purchase_order_items_id", table_name="purchase_order_items")
        op.drop_table("purchase_order_items")

    if _has_table("purchase_orders"):
        op.drop_index("ix_purchase_orders_display_id", table_name="purchase_orders")
        op.drop_index("ix_purchase_orders_id", table_name="purchase_orders")
        op.drop_table("purchase_orders")

    if _has_table("stock_movements"):
        op.drop_index("ix_stock_movements_id", table_name="stock_movements")
        op.drop_table("stock_movements")

    if _has_table("products"):
        op.drop_index("ix_products_category", table_name="products")
        op.drop_index("ix_products_sku", table_name="products")
        op.drop_index("ix_products_name", table_name="products")
        op.drop_index("ix_products_id", table_name="products")
        op.drop_table("products")

    if _has_table("work_orders"):
        if _has_column("work_orders", "estimated_hours"):
            op.drop_column("work_orders", "estimated_hours")
        if _has_column("work_orders", "scheduled_date"):
            op.drop_column("work_orders", "scheduled_date")

    if _has_table("checklists"):
        if dialect != "sqlite" and _has_fk("checklists", ["generated_order_id"], "work_orders"):
            op.drop_constraint("fk_checklists_generated_order_id_work_orders", "checklists", type_="foreignkey")
        if _has_column("checklists", "generated_order_id"):
            op.drop_column("checklists", "generated_order_id")
        if _has_column("checklists", "comments"):
            op.drop_column("checklists", "comments")
        if _has_column("checklists", "is_priority"):
            op.drop_column("checklists", "is_priority")

    if _has_table("units"):
        if dialect != "sqlite" and _has_fk("units", ["manager_id"], "users"):
            op.drop_constraint("fk_units_manager_id_users", "units", type_="foreignkey")
        if dialect != "sqlite" and _has_fk("units", ["driver_id"], "users"):
            op.drop_constraint("fk_units_driver_id_users", "units", type_="foreignkey")
        if _has_column("units", "manager_id"):
            op.drop_column("units", "manager_id")
        if _has_column("units", "driver_id"):
            op.drop_column("units", "driver_id")

    if _has_table("users"):
        if dialect != "sqlite" and _has_fk("users", ["unit_id"], "units"):
            op.drop_constraint("fk_users_unit_id_units", "users", type_="foreignkey")
        if _has_column("users", "unit_id"):
            op.drop_column("users", "unit_id")
        if _has_column("users", "profile_image"):
            op.drop_column("users", "profile_image")
