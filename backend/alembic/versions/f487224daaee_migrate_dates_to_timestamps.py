"""Migrate dates to timestamps

Revision ID: f487224daaee
Revises: bf47a1ec2991
Create Date: 2026-06-06 11:00:58.016108
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f487224daaee'
down_revision: Union[str, None] = 'bf47a1ec2991'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # We use batch_alter_table to support SQLite which doesn't support ALTER COLUMN directly
    with op.batch_alter_table('goals') as batch_op:
        batch_op.alter_column('deadline',
                              existing_type=sa.String(length=30),
                              type_=sa.DateTime(timezone=True),
                              existing_nullable=True,
                              postgresql_using='deadline::timestamp with time zone')

    with op.batch_alter_table('milestones') as batch_op:
        batch_op.alter_column('due_date',
                              existing_type=sa.String(length=30),
                              type_=sa.DateTime(timezone=True),
                              existing_nullable=True,
                              postgresql_using='due_date::timestamp with time zone')

    with op.batch_alter_table('cycles') as batch_op:
        batch_op.alter_column('start_date',
                              existing_type=sa.String(length=30),
                              type_=sa.DateTime(timezone=True),
                              existing_nullable=False,
                              postgresql_using='start_date::timestamp with time zone')
        batch_op.alter_column('end_date',
                              existing_type=sa.String(length=30),
                              type_=sa.DateTime(timezone=True),
                              existing_nullable=False,
                              postgresql_using='end_date::timestamp with time zone')


def downgrade() -> None:
    with op.batch_alter_table('cycles') as batch_op:
        batch_op.alter_column('end_date',
                              existing_type=sa.DateTime(timezone=True),
                              type_=sa.String(length=30),
                              existing_nullable=False)
        batch_op.alter_column('start_date',
                              existing_type=sa.DateTime(timezone=True),
                              type_=sa.String(length=30),
                              existing_nullable=False)

    with op.batch_alter_table('milestones') as batch_op:
        batch_op.alter_column('due_date',
                              existing_type=sa.DateTime(timezone=True),
                              type_=sa.String(length=30),
                              existing_nullable=True)

    with op.batch_alter_table('goals') as batch_op:
        batch_op.alter_column('deadline',
                              existing_type=sa.DateTime(timezone=True),
                              type_=sa.String(length=30),
                              existing_nullable=True)
