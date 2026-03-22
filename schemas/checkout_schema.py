"""Schemas de validação para checkout."""
from marshmallow import Schema, fields, validates, ValidationError
from utils.validators import sanitize_string


class CheckoutSchema(Schema):
    """Schema para validação de dados de checkout."""

    # Dados pessoais
    fullName = fields.Str(required=True, validate=lambda x: len(x.strip()) >= 2)
    email = fields.Email(required=True)
    phone = fields.Str(required=True)
    cpf = fields.Str(required=True)
    birthDate = fields.Date(required=False, allow_none=True)

    # Endereço
    cep = fields.Str(required=True)
    street = fields.Str(required=True)
    number = fields.Str(required=True)
    neighborhood = fields.Str(required=True)
    city = fields.Str(required=True)
    state = fields.Str(required=True)
    complement = fields.Str(required=False, allow_none=True)

    # Pagamento
    cardNumber = fields.Str(required=True, validate=lambda x: len(x.replace(' ', '')) >= 13)
    cardName = fields.Str(required=True, validate=lambda x: len(x.strip()) >= 2)
    expiryDate = fields.Str(required=True)
    cvv = fields.Str(required=True, validate=lambda x: len(x) >= 3)
    installments = fields.Int(required=False, default=1, validate=lambda x: 1 <= x <= 12)

    @validates('fullName')
    def validate_full_name(self, value):
        """Valida e sanitiza nome completo."""
        if not value or len(value.strip()) < 2:
            raise ValidationError('Nome deve ter pelo menos 2 caracteres.')
        return sanitize_string(value)

    @validates('phone')
    def validate_phone(self, value):
        """Valida telefone."""
        # Remove caracteres não numéricos
        clean_phone = ''.join(filter(str.isdigit, value))
        if len(clean_phone) < 10 or len(clean_phone) > 11:
            raise ValidationError('Telefone deve ter 10 ou 11 dígitos.')

    @validates('cpf')
    def validate_cpf(self, value):
        """Valida CPF."""
        # Implementação básica - em produção usar biblioteca específica
        clean_cpf = ''.join(filter(str.isdigit, value))
        if len(clean_cpf) != 11:
            raise ValidationError('CPF deve ter 11 dígitos.')

    @validates('cep')
    def validate_cep(self, value):
        """Valida CEP."""
        clean_cep = ''.join(filter(str.isdigit, value))
        if len(clean_cep) != 8:
            raise ValidationError('CEP deve ter 8 dígitos.')


# Instância do schema
checkout_schema = CheckoutSchema()