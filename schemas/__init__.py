"""Schemas de validação usando Marshmallow."""
from marshmallow import Schema, fields, validates, ValidationError
from .checkout_schema import checkout_schema


class AddToCartSchema(Schema):
    """Schema para validação de adição ao carrinho."""
    mal_id = fields.Int(required=True)
    title = fields.Str(required=True, validate=lambda x: len(x.strip()) > 0)
    image_url = fields.Url(required=True)
    price = fields.Float(required=True, validate=lambda x: x > 0)

    @validates('title')
    def validate_title(self, value):
        if len(value.strip()) == 0:
            raise ValidationError('Title cannot be empty')


# Instância do schema
add_to_cart_schema = AddToCartSchema()