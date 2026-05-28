"""Add approval and oauth fields

Revision ID: bf47a1ec2991
Revises: ada7c2ee0882
Create Date: 2026-05-28 04:55:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bf47a1ec2991'
down_revision: Union[str, None] = 'ada7c2ee0882'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add is_approved, google_id, and microsoft_id columns to users table
    op.add_column('users', sa.Column('is_approved', sa.Boolean(), nullable=False, server_default=sa.text('0')))
    op.add_column('users', sa.Column('google_id', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('microsoft_id', sa.String(length=255), nullable=True))
    op.create_index(op.f('ix_users_google_id'), 'users', ['google_id'], unique=True)
    op.create_index(op.f('ix_users_microsoft_id'), 'users', ['microsoft_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_microsoft_id'), table_name='users')
    op.drop_index(op.f('ix_users_google_id'), table_name='users')
    op.drop_column('users', 'microsoft_id')
    op.drop_column('users', 'google_id')
    op.drop_column('users', 'is_approved')
